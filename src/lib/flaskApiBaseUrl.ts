/** Flask API base URL — 빌드 env 우선, 프로덕션은 동일 오리진 폴백 */
export function getFlaskApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}
