/** Firebase Callable 에러 메시지 추출 */
export function getCallableErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const fb = err as { code: string; message: string }
    if (fb.message) return fb.message
  }
  if (err instanceof Error) return err.message
  return '메시지 전송에 실패했습니다.'
}
