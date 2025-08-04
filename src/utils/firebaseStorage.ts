// Firebase Storage 유틸리티
// 파일 업로드, 다운로드, 삭제 기능 제공

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * 파일을 Firebase Storage에 업로드
 * @param file - 업로드할 파일
 * @param path - 저장할 경로 (예: 'users/uid/profile.jpg')
 * @returns Promise<string> - 다운로드 URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('파일 업로드 성공:', path);
    return downloadURL;
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
}

/**
 * Firebase Storage에서 파일 다운로드 URL 가져오기
 * @param path - 파일 경로
 * @returns Promise<string> - 다운로드 URL
 */
export async function getFileURL(path: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  try {
    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('파일 URL 가져오기 실패:', error);
    throw new Error('파일을 찾을 수 없습니다.');
  }
}

/**
 * Firebase Storage에서 파일 삭제
 * @param path - 삭제할 파일 경로
 * @returns Promise<void>
 */
export async function deleteFile(path: string): Promise<void> {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('파일 삭제 성공:', path);
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    throw new Error('파일 삭제에 실패했습니다.');
  }
}

/**
 * 특정 경로의 모든 파일 목록 가져오기
 * @param path - 디렉토리 경로
 * @returns Promise<string[]> - 파일 경로 목록
 */
export async function listFiles(path: string): Promise<string[]> {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return result.items.map(item => item.fullPath);
  } catch (error) {
    console.error('파일 목록 가져오기 실패:', error);
    throw new Error('파일 목록을 가져올 수 없습니다.');
  }
}

/**
 * 사용자 프로필 이미지 업로드
 * @param file - 이미지 파일
 * @param userId - 사용자 ID
 * @returns Promise<string> - 다운로드 URL
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  const fileExtension = file.name.split('.').pop();
  const path = `users/${userId}/profile.${fileExtension}`;
  return uploadFile(file, path);
}

/**
 * 테스트 결과 이미지 업로드
 * @param file - 이미지 파일
 * @param testCode - 테스트 코드
 * @returns Promise<string> - 다운로드 URL
 */
export async function uploadTestResultImage(file: File, testCode: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  const fileExtension = file.name.split('.').pop();
  const path = `test-results/${testCode}/result.${fileExtension}`;
  return uploadFile(file, path);
}

/**
 * 파일 크기 검증
 * @param file - 검증할 파일
 * @param maxSizeMB - 최대 크기 (MB)
 * @returns boolean - 유효성 여부
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 이미지 파일 형식 검증
 * @param file - 검증할 파일
 * @returns boolean - 유효성 여부
 */
export function validateImageFormat(file: File): boolean {
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
} 