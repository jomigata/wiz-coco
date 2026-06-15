import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase';
import {
  ALLOWED_COUNSELOR_APPLICATION_EXTENSIONS,
  ALLOWED_COUNSELOR_APPLICATION_MIME_TYPES,
  COUNSELOR_APPLICATION_MAX_FILE_SIZE_MB,
  COUNSELOR_APPLICATION_MAX_FILES,
  type CounselorApplicationAttachment,
} from '@/types/counselorApplication';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-가-힣]/g, '_').slice(0, 100);
}

export function formatCounselorFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateCounselorApplicationFile(file: File): string | null {
  const maxBytes = COUNSELOR_APPLICATION_MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size <= 0) return `빈 파일은 업로드할 수 없습니다. (${file.name})`;
  if (file.size > maxBytes) {
    return `파일당 최대 ${COUNSELOR_APPLICATION_MAX_FILE_SIZE_MB}MB까지 업로드할 수 있습니다. (${file.name})`;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeOk =
    !file.type ||
    ALLOWED_COUNSELOR_APPLICATION_MIME_TYPES.includes(file.type) ||
    file.type.startsWith('image/');
  const extOk = ALLOWED_COUNSELOR_APPLICATION_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return `허용 형식: PDF, JPG, PNG, DOC, DOCX, HWP (${file.name})`;
  }
  return null;
}

export async function uploadCounselorApplicationAttachment(
  uid: string,
  file: File,
  options?: { applicationId?: string },
): Promise<CounselorApplicationAttachment> {
  const validationError = validateCounselorApplicationFile(file);
  if (validationError) throw new Error(validationError);

  const { storage } = initializeFirebase();
  if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');

  const id = crypto.randomUUID();
  const folder = options?.applicationId || 'draft';
  const path = `counselor-applications/${uid}/${folder}/${id}_${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    id,
    name: file.name,
    url,
    storagePath: path,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
  };
}

export async function uploadCounselorApplicationAttachments(
  uid: string,
  files: File[],
  applicationId?: string,
): Promise<CounselorApplicationAttachment[]> {
  if (files.length > COUNSELOR_APPLICATION_MAX_FILES) {
    throw new Error(`첨부 파일은 최대 ${COUNSELOR_APPLICATION_MAX_FILES}개까지 가능합니다.`);
  }
  const results: CounselorApplicationAttachment[] = [];
  for (const file of files) {
    results.push(await uploadCounselorApplicationAttachment(uid, file, { applicationId }));
  }
  return results;
}

export function mapRawAttachments(raw: unknown): CounselorApplicationAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const url = String(o.url || '');
      const name = String(o.name || '');
      if (!url || !name) return null;
      return {
        id: String(o.id || crypto.randomUUID()),
        name,
        url,
        storagePath: String(o.storagePath || ''),
        size: Number(o.size ?? 0),
        contentType: String(o.contentType || ''),
        uploadedAt: String(o.uploadedAt || ''),
      } satisfies CounselorApplicationAttachment;
    })
    .filter((x): x is CounselorApplicationAttachment => x !== null);
}
