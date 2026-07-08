import { generateCounselReply } from './client'

export type TestRecommendationItem = {
  testId: string
  name: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

export type TestRecommendationResult = {
  summary: string
  recommendations: TestRecommendationItem[]
  modelId: string
  usage?: Awaited<ReturnType<typeof generateCounselReply>>['usage']
}

const MAX_RESULT_JSON_CHARS = 10_000
const MAX_CATALOG_ITEMS = 80

function truncateJson(value: unknown): string {
  try {
    const raw = JSON.stringify(value, null, 2)
    if (raw.length <= MAX_RESULT_JSON_CHARS) return raw
    return `${raw.slice(0, MAX_RESULT_JSON_CHARS)}\n…(truncated)`
  } catch {
    return String(value).slice(0, MAX_RESULT_JSON_CHARS)
  }
}

function parseRecommendationJson(text: string): Omit<TestRecommendationResult, 'modelId' | 'usage'> {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? jsonMatch[0] : trimmed
  const parsed = JSON.parse(candidate) as {
    summary?: string
    recommendations?: Array<{
      testId?: string
      name?: string
      rationale?: string
      priority?: string
    }>
  }

  const summary = String(parsed.summary || '결과를 바탕으로 추가 검사를 검토해 보세요.').trim()
  const recommendations: TestRecommendationItem[] = (parsed.recommendations || [])
    .map((item) => ({
      testId: String(item.testId || '').trim(),
      name: String(item.name || item.testId || '').trim(),
      rationale: String(item.rationale || '').trim(),
      priority: (['high', 'medium', 'low'].includes(String(item.priority))
        ? item.priority
        : 'medium') as TestRecommendationItem['priority'],
    }))
    .filter((item) => item.testId && item.name)

  if (!recommendations.length) {
    throw new Error('recommendation_parse_empty')
  }

  return { summary, recommendations }
}

export async function generateTestRecommendations(input: {
  testType?: string
  clientLabel?: string
  resultData?: unknown
  responses?: unknown
  availableTests: { testId: string; name: string }[]
}): Promise<TestRecommendationResult> {
  const catalog = (input.availableTests || [])
    .filter((t) => t.testId && t.name)
    .slice(0, MAX_CATALOG_ITEMS)

  if (!catalog.length) {
    throw new Error('available_tests_required')
  }

  const catalogBlock = catalog.map((t) => `- ${t.testId}: ${t.name}`).join('\n')
  const resultBlock = truncateJson({
    resultData: input.resultData,
    responses: input.responses,
  })

  const prompt = `[맞춤 검사 추천 요청]

역할: 한국 상담 현장을 돕는 심리검사 추천 보조 AI입니다.
- 아래 **검사 카탈로그에 있는 testId만** 추천하세요 (없는 ID 금지).
- 3~5개 추천, priority는 high/medium/low 중 하나.
- 진단명 단정 금지, 상담 목적의 추가 검사 제안으로 작성.

완료 검사: ${input.testType || '심리검사'}
내담자: ${input.clientLabel || '내담자'}

검사 결과(JSON):
${resultBlock}

사용 가능 검사 카탈로그:
${catalogBlock}

반드시 아래 JSON만 출력 (마크다운 코드블록 없이):
{
  "summary": "2~3문장 한국어 요약",
  "recommendations": [
    { "testId": "...", "name": "...", "rationale": "한국어 1~2문장", "priority": "high" }
  ]
}`

  const result = await generateCounselReply([], prompt)
  const parsed = parseRecommendationJson(result.text)

  const allowed = new Set(catalog.map((t) => t.testId))
  const recommendations = parsed.recommendations
    .filter((r) => allowed.has(r.testId))
    .map((r) => {
      const match = catalog.find((t) => t.testId === r.testId)
      return { ...r, name: match?.name || r.name }
    })

  if (!recommendations.length) {
    throw new Error('recommendation_catalog_mismatch')
  }

  return {
    summary: parsed.summary,
    recommendations,
    modelId: result.modelId,
    usage: result.usage,
  }
}
