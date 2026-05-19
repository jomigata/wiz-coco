/**
 * 기존 검사코드·검사결과 코드에서 하이픈 제거 후 로컬 기록·키 재저장.
 * Firestore 서버 데이터는 backend/scripts/migrate_strip_code_hyphens.py 실행.
 */

import {
  INSPECTION_CODE_MIGRATION_STORAGE_KEY,
  inspectionCodeHasHyphen,
  normalizeInspectionCode,
} from '@/lib/accessCodeFormat';

const CODE_FIELD_NAMES = new Set([
  'code',
  'testCode',
  'accessCode',
  'counselorCode',
  'counselorCodePinDisplay',
  'counselorAccessCode',
  'groupCode',
  'resultCode',
  'lastGeneratedCode',
]);

const RECORD_ARRAY_KEYS = [
  'test_records',
  'deleted_test_records',
  'admin_deleted_records',
  'mbti-user-test-records',
  'db_generated_codes',
];

const SINGLE_CODE_KEYS = ['mbti_test_code'];

const TEST_RESULT_KEY_PREFIXES = ['test-result-', 'mbti-test-result-', 'pending-test-result-'];

export type InspectionCodeMigrationReport = {
  ran: boolean;
  recordArraysUpdated: number;
  recordsFieldsUpdated: number;
  storageKeysRenamed: number;
  singleKeysUpdated: number;
  syncQueueUpdated: number;
  indexedDbUpdated: number;
  errors: string[];
};

function migrateCodeValue(value: unknown): { next: unknown; changed: boolean } {
  if (typeof value !== 'string' || !value || value === '—') {
    return { next: value, changed: false };
  }
  if (!inspectionCodeHasHyphen(value)) {
    return { next: value, changed: false };
  }
  const next = normalizeInspectionCode(value);
  return { next: next || value, changed: next !== value };
}

function migrateRecordObject(
  record: Record<string, unknown>,
  stats: { fields: number }
): Record<string, unknown> {
  const out = { ...record };

  for (const key of CODE_FIELD_NAMES) {
    if (key in out) {
      const { next, changed } = migrateCodeValue(out[key]);
      if (changed) {
        out[key] = next;
        stats.fields += 1;
      }
    }
  }

  if (out.userData && typeof out.userData === 'object' && !Array.isArray(out.userData)) {
    const ud = { ...(out.userData as Record<string, unknown>) };
    let udChanged = false;
    for (const key of ['counselorCode', 'groupCode', 'code', 'testCode']) {
      if (key in ud) {
        const { next, changed } = migrateCodeValue(ud[key]);
        if (changed) {
          ud[key] = next;
          udChanged = true;
          stats.fields += 1;
        }
      }
    }
    if (ud.clientInfo && typeof ud.clientInfo === 'object') {
      const ci = { ...(ud.clientInfo as Record<string, unknown>) };
      let ciChanged = false;
      for (const key of ['counselorCode', 'groupCode', 'code']) {
        if (key in ci) {
          const { next, changed } = migrateCodeValue(ci[key]);
          if (changed) {
            ci[key] = next;
            ciChanged = true;
            stats.fields += 1;
          }
        }
      }
      if (ciChanged) ud.clientInfo = ci;
    }
    if (udChanged) out.userData = ud;
  }

  if (out.result && typeof out.result === 'object' && !Array.isArray(out.result)) {
    const r = migrateRecordObject(out.result as Record<string, unknown>, stats);
    if (JSON.stringify(r) !== JSON.stringify(out.result)) {
      out.result = r;
    }
  }

  return out;
}

function migrateRecordArray(raw: string): { json: string; arrayChanged: boolean; fields: number } {
  let arr: unknown[];
  try {
    arr = JSON.parse(raw);
  } catch {
    return { json: raw, arrayChanged: false, fields: 0 };
  }
  if (!Array.isArray(arr)) {
    return { json: raw, arrayChanged: false, fields: 0 };
  }

  const stats = { fields: 0 };
  const next = arr.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    return migrateRecordObject(item as Record<string, unknown>, stats);
  });

  const arrayChanged = stats.fields > 0 || JSON.stringify(next) !== JSON.stringify(arr);
  return {
    json: JSON.stringify(next),
    arrayChanged,
    fields: stats.fields,
  };
}

function renameTestResultStorageKeys(report: InspectionCodeMigrationReport): void {
  if (typeof window === 'undefined') return;

  const keysToRename: { oldKey: string; newKey: string }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const prefix = TEST_RESULT_KEY_PREFIXES.find((p) => key.startsWith(p));
    if (!prefix) continue;
    const codePart = key.slice(prefix.length);
    if (!inspectionCodeHasHyphen(codePart)) continue;
    const newCode = normalizeInspectionCode(codePart);
    if (!newCode || newCode === codePart) continue;
    const newKey = `${prefix}${newCode}`;
    if (localStorage.getItem(newKey) != null) {
      report.errors.push(`skip rename ${key}: target exists`);
      continue;
    }
    keysToRename.push({ oldKey: key, newKey });
  }

  for (const { oldKey, newKey } of keysToRename) {
    const val = localStorage.getItem(oldKey);
    if (val == null) continue;
    let payload = val;
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object') {
        const stats = { fields: 0 };
        const migrated = migrateRecordObject(parsed as Record<string, unknown>, stats);
        if (migrated.code && typeof migrated.code === 'string') {
          const { next } = migrateCodeValue(migrated.code);
          migrated.code = next;
        }
        payload = JSON.stringify(migrated);
        report.recordsFieldsUpdated += stats.fields;
      }
    } catch {
      /* keep raw string */
    }
    localStorage.setItem(newKey, payload);
    localStorage.removeItem(oldKey);
    report.storageKeysRenamed += 1;
  }
}

function migrateSyncQueue(report: InspectionCodeMigrationReport): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem('sync_queue');
  if (!raw) return;
  let queue: unknown[];
  try {
    queue = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(queue)) return;

  let changed = false;
  const next = queue.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const o = { ...(item as Record<string, unknown>) };
    if (o.data && typeof o.data === 'object') {
      const stats = { fields: 0 };
      o.data = migrateRecordObject(o.data as Record<string, unknown>, stats);
      if (stats.fields > 0) {
        report.syncQueueUpdated += 1;
        changed = true;
      }
    }
    if (typeof o.code === 'string' && inspectionCodeHasHyphen(o.code)) {
      o.code = normalizeInspectionCode(o.code);
      changed = true;
      report.syncQueueUpdated += 1;
    }
    return o;
  });

  if (changed) {
    localStorage.setItem('sync_queue', JSON.stringify(next));
  }
}

async function migrateIndexedDb(report: InspectionCodeMigrationReport): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { getAllTestData, saveTestData, deleteTestData } = await import('@/utils/indexedDB');
    const all = await getAllTestData({ includeExpired: true });
    if (!Array.isArray(all)) return;

    for (const row of all) {
      const code = row?.code;
      if (typeof code !== 'string' || !inspectionCodeHasHyphen(code)) continue;
      const newCode = normalizeInspectionCode(code);
      if (!newCode || newCode === code) continue;

      const stats = { fields: 0 };
      const migrated = migrateRecordObject({ ...row, code: newCode }, stats);
      migrated.code = newCode;

      await saveTestData(migrated);
      await deleteTestData(code);
      report.indexedDbUpdated += 1;
    }
  } catch (e) {
    report.errors.push(`indexedDB: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 브라우저 localStorage(및 IndexedDB) 내 검사코드·결과코드 하이픈 제거 (1회).
 */
export async function migrateLocalInspectionCodes(): Promise<InspectionCodeMigrationReport> {
  const report: InspectionCodeMigrationReport = {
    ran: false,
    recordArraysUpdated: 0,
    recordsFieldsUpdated: 0,
    storageKeysRenamed: 0,
    singleKeysUpdated: 0,
    syncQueueUpdated: 0,
    indexedDbUpdated: 0,
    errors: [],
  };

  if (typeof window === 'undefined') {
    return report;
  }

  if (localStorage.getItem(INSPECTION_CODE_MIGRATION_STORAGE_KEY) === 'done') {
    return report;
  }

  report.ran = true;

  for (const key of RECORD_ARRAY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const { json, arrayChanged, fields } = migrateRecordArray(raw);
    if (arrayChanged) {
      localStorage.setItem(key, json);
      report.recordArraysUpdated += 1;
      report.recordsFieldsUpdated += fields;
    }
  }

  const userPrefix = 'test_records_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(userPrefix)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const { json, arrayChanged, fields } = migrateRecordArray(raw);
    if (arrayChanged) {
      localStorage.setItem(key, json);
      report.recordArraysUpdated += 1;
      report.recordsFieldsUpdated += fields;
    }
  }

  for (const key of SINGLE_CODE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const { next, changed } = migrateCodeValue(raw);
    if (changed) {
      localStorage.setItem(key, String(next));
      report.singleKeysUpdated += 1;
    }
  }

  renameTestResultStorageKeys(report);
  migrateSyncQueue(report);
  await migrateIndexedDb(report);

  localStorage.setItem(INSPECTION_CODE_MIGRATION_STORAGE_KEY, 'done');
  if (report.ran && (report.storageKeysRenamed > 0 || report.recordsFieldsUpdated > 0)) {
    console.info('[검사코드 마이그레이션] 로컬 저장소 갱신 완료', report);
  }

  return report;
}
