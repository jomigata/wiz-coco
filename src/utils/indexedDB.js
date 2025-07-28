/**
 * IndexedDB를 사용한 오프라인 데이터 저장 및 동기화 유틸리티
 */

// 데이터베이스 설정
const DB_NAME = 'offlineApp';
const DB_VERSION = 1;

// 스토어 이름 상수
const STORES = {
  TEST_DATA: 'testData',
  SYNC_QUEUE: 'syncQueue',
  USER_DATA: 'userData',
  SETTINGS: 'settings',
};

/**
 * IndexedDB 연결 및 초기화
 * @returns {Promise<IDBDatabase>} - 데이터베이스 연결 객체
 */
export function initDatabase() {
  return new Promise((resolve, reject) => {
    // 브라우저에서만 실행
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('이 환경에서는 IndexedDB를 사용할 수 없습니다.'));
    }
    
    // 데이터베이스 열기
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    // 데이터베이스 스키마 업그레이드 처리
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 테스트 데이터 저장소
      if (!db.objectStoreNames.contains(STORES.TEST_DATA)) {
        const testDataStore = db.createObjectStore(STORES.TEST_DATA, { keyPath: 'code' });
        testDataStore.createIndex('timestamp', 'timestamp', { unique: false });
        testDataStore.createIndex('testType', 'testType', { unique: false });
        console.log('테스트 데이터 스토어가 생성되었습니다.');
      }
      
      // 동기화 큐 저장소
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncQueueStore.createIndex('status', 'status', { unique: false });
        console.log('동기화 큐 스토어가 생성되었습니다.');
      }
      
      // 사용자 데이터 저장소
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        const userDataStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
        console.log('사용자 데이터 스토어가 생성되었습니다.');
      }
      
      // 설정 데이터 저장소
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        const settingsStore = db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        console.log('설정 데이터 스토어가 생성되었습니다.');
      }
    };
    
    // 오류 처리
    request.onerror = (event) => {
      console.error('IndexedDB 연결 오류:', event.target.error);
      reject(event.target.error);
    };
    
    // 성공 처리
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // 데이터베이스 연결 오류 이벤트 리스너
      db.onerror = (event) => {
        console.error('IndexedDB 오류:', event.target.error);
      };
      
      console.log('IndexedDB 연결 성공');
      resolve(db);
    };
  });
}

/**
 * 데이터베이스 연결 상태에서 트랜잭션 실행
 * @param {string} storeName - 스토어 이름
 * @param {string} mode - 트랜잭션 모드 ('readonly' | 'readwrite')
 * @param {Function} callback - 트랜잭션 콜백
 * @returns {Promise<any>} - 트랜잭션 결과
 */
export async function withStore(storeName, mode, callback) {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    transaction.oncomplete = () => {
      db.close();
    };
    
    transaction.onerror = (event) => {
      console.error(`${storeName} 트랜잭션 오류:`, event.target.error);
      reject(event.target.error);
    };
    
    try {
      const result = callback(store, transaction);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 테스트 데이터 저장
 * @param {Object} testData - 저장할 테스트 데이터
 * @returns {Promise<string>} - 저장된 테스트 코드
 */
export async function saveTestData(testData) {
  if (!testData.code) {
    throw new Error('테스트 데이터에 코드가 없습니다.');
  }
  
  // 타임스탬프 추가
  const dataToSave = {
    ...testData,
    timestamp: testData.timestamp || new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  
  return withStore(STORES.TEST_DATA, 'readwrite', (store) => {
    const request = store.put(dataToSave);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // 동기화 큐에 추가
        queueForSync({
          type: 'saveTestData',
          data: dataToSave,
          timestamp: new Date().toISOString(),
          status: 'pending',
        }).then(() => {
          console.log('테스트 데이터가 저장되고 동기화 큐에 추가되었습니다.');
          resolve(dataToSave.code);
        }).catch(reject);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 테스트 데이터 조회
 * @param {string} code - 테스트 코드
 * @returns {Promise<Object>} - 테스트 데이터
 */
export async function getTestData(code) {
  return withStore(STORES.TEST_DATA, 'readonly', (store) => {
    const request = store.get(code);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 모든 테스트 데이터 조회
 * @param {Object} options - 조회 옵션 (정렬, 필터링 등)
 * @returns {Promise<Array>} - 테스트 데이터 배열
 */
export async function getAllTestData(options = {}) {
  return withStore(STORES.TEST_DATA, 'readonly', (store) => {
    const { index, direction = 'prev', filter } = options;
    let request;
    
    // 인덱스가 지정된 경우 해당 인덱스로 조회
    if (index && store.indexNames.contains(index)) {
      const idx = store.index(index);
      request = idx.openCursor(null, direction);
    } else {
      request = store.openCursor(null, direction);
    }
    
    const results = [];
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          // 필터 함수가 제공된 경우 필터링
          if (!filter || filter(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 동기화 큐에 작업 추가
 * @param {Object} operation - 동기화할 작업 정보
 * @returns {Promise<number>} - 동기화 작업 ID
 */
export async function queueForSync(operation) {
  return withStore(STORES.SYNC_QUEUE, 'readwrite', (store) => {
    const request = store.add(operation);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 동기화 큐의 작업 상태 업데이트
 * @param {number} id - 동기화 작업 ID
 * @param {string} status - 새로운 상태 ('pending', 'syncing', 'completed', 'failed')
 * @param {Object} metadata - 추가 메타데이터 (오류 정보 등)
 * @returns {Promise<void>}
 */
export async function updateSyncStatus(id, status, metadata = {}) {
  return withStore(STORES.SYNC_QUEUE, 'readwrite', (store) => {
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const operation = request.result;
        
        if (operation) {
          operation.status = status;
          operation.lastUpdated = new Date().toISOString();
          
          if (metadata) {
            operation.metadata = {
              ...operation.metadata,
              ...metadata,
            };
          }
          
          const updateRequest = store.put(operation);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            reject(event.target.error);
          };
        } else {
          reject(new Error(`동기화 작업 ID ${id}를 찾을 수 없습니다.`));
        }
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 동기화 큐에서 대기 중인 작업 조회
 * @returns {Promise<Array>} - 대기 중인 동기화 작업 배열
 */
export async function getPendingSyncOperations() {
  return withStore(STORES.SYNC_QUEUE, 'readonly', (store) => {
    const index = store.index('status');
    const request = index.getAll('pending');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 사용자 데이터 저장
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<string>} - 사용자 ID
 */
export async function saveUserData(userData) {
  if (!userData.id) {
    throw new Error('사용자 데이터에 ID가 없습니다.');
  }
  
  return withStore(STORES.USER_DATA, 'readwrite', (store) => {
    const request = store.put(userData);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(userData.id);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 사용자 데이터 조회
 * @param {string} id - 사용자 ID
 * @returns {Promise<Object>} - 사용자 데이터
 */
export async function getUserData(id) {
  return withStore(STORES.USER_DATA, 'readonly', (store) => {
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 앱 설정 값 저장
 * @param {string} key - 설정 키
 * @param {*} value - 설정 값
 * @returns {Promise<void>}
 */
export async function saveSetting(key, value) {
  return withStore(STORES.SETTINGS, 'readwrite', (store) => {
    const request = store.put({ key, value });
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 앱 설정 값 조회
 * @param {string} key - 설정 키
 * @returns {Promise<*>} - 설정 값
 */
export async function getSetting(key) {
  return withStore(STORES.SETTINGS, 'readonly', (store) => {
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 모든 앱 설정 조회
 * @returns {Promise<Object>} - 모든 설정 객체
 */
export async function getAllSettings() {
  return withStore(STORES.SETTINGS, 'readonly', (store) => {
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

/**
 * 네트워크 상태 감지
 * @returns {boolean} - 온라인 상태 여부
 */
export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * 백그라운드 동기화 실행
 * @param {Function} syncFunction - 동기화 함수
 * @returns {Promise<Object>} - 동기화 결과
 */
export async function performBackgroundSync(syncFunction) {
  if (!isOnline()) {
    console.log('오프라인 상태입니다. 동기화가 연기됩니다.');
    return { success: false, reason: 'offline' };
  }
  
  try {
    // 대기 중인 동기화 작업 조회
    const pendingOperations = await getPendingSyncOperations();
    
    if (pendingOperations.length === 0) {
      console.log('동기화할 작업이 없습니다.');
      return { success: true, synced: 0 };
    }
    
    console.log(`${pendingOperations.length}개의 작업 동기화 시작...`);
    
    let syncedCount = 0;
    let failedCount = 0;
    
    // 동기화 함수 실행
    if (typeof syncFunction === 'function') {
      const result = await syncFunction(pendingOperations);
      
      if (result && result.synced) {
        syncedCount = result.synced;
      }
      
      if (result && result.failed) {
        failedCount = result.failed;
      }
    } else {
      // 기본 동기화 동작 (각 작업에 대해 서버와 동기화)
      for (const operation of pendingOperations) {
        try {
          // 작업 상태 업데이트
          await updateSyncStatus(operation.id, 'syncing');
          
          // 작업 유형에 따른 동기화 처리
          if (operation.type === 'saveTestData') {
            // 서버에 테스트 데이터 저장 요청
            // (여기서는 실제 API 호출 대신 예시만 표시)
            console.log(`테스트 데이터 ${operation.data.code} 동기화 중...`);
            
            // 실제 API 호출은 여기에 구현
            // 예: await api.post('/api/test-data', operation.data);
            
            // 성공적으로 동기화된 작업 상태 업데이트
            await updateSyncStatus(operation.id, 'completed', {
              syncedAt: new Date().toISOString(),
            });
            
            syncedCount++;
          } else {
            console.log(`지원되지 않는 작업 유형: ${operation.type}`);
            await updateSyncStatus(operation.id, 'failed', {
              error: '지원되지 않는 작업 유형',
            });
            failedCount++;
          }
        } catch (error) {
          console.error(`작업 ${operation.id} 동기화 실패:`, error);
          
          // 실패한 작업 상태 업데이트
          await updateSyncStatus(operation.id, 'failed', {
            error: error.message,
            failedAt: new Date().toISOString(),
          });
          
          failedCount++;
        }
      }
    }
    
    return {
      success: true,
      synced: syncedCount,
      failed: failedCount,
      total: pendingOperations.length,
    };
  } catch (error) {
    console.error('동기화 처리 중 오류 발생:', error);
    return {
      success: false,
      reason: error.message,
    };
  }
} 