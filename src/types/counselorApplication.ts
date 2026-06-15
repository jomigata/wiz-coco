/** 상담사 전환 신청 첨부 파일 */

export const COUNSELOR_APPLICATION_MAX_FILES = 5;
export const COUNSELOR_APPLICATION_MAX_FILE_SIZE_MB = 10;

export const ALLOWED_COUNSELOR_APPLICATION_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-hwp',
  'application/haansofthwp',
  'application/octet-stream',
];

export const ALLOWED_COUNSELOR_APPLICATION_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'doc',
  'docx',
  'hwp',
];

export interface CounselorApplicationAttachment {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export type CounselorAttachmentItem =
  | { source: 'saved'; attachment: CounselorApplicationAttachment }
  | { source: 'local'; file: File; localId: string };
