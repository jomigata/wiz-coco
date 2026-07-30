const TRUTHY = new Set(['1', 'true', 'yes', 'on'])

/** Cloud Run·Functions 공통 — Gemini API 호출 차단 (제작 단계 비용 절감) */
export function isCostSaverMode(): boolean {
  const raw = (process.env.COST_SAVER_MODE ?? 'true').trim().toLowerCase()
  return TRUTHY.has(raw)
}

export const COST_SAVER_GEMINI_MESSAGE =
  '비용 절감 모드(COST_SAVER_MODE)가 켜져 있어 AI 응답이 일시 중지되어 있습니다. 정식 오픈 후 다시 이용해 주세요.'

export function costSaverGeminiStub(modelId = 'cost-saver-stub') {
  return {
    text: COST_SAVER_GEMINI_MESSAGE,
    modelId,
    usage: undefined,
  }
}
