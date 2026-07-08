import { generateCounselReply } from './client'

export type ComprehensiveReportSection = {
  heading: string
  lines: string[]
}

export type ComprehensiveReportResult = {
  summary: string
  sections: ComprehensiveReportSection[]
  modelId: string
  usage?: Awaited<ReturnType<typeof generateCounselReply>>['usage']
}

const MAX_JSON = 10_000

function truncateJson(value: unknown): string {
  try {
    const raw = JSON.stringify(value, null, 2)
    return raw.length <= MAX_JSON ? raw : `${raw.slice(0, MAX_JSON)}\n…(truncated)`
  } catch {
    return String(value).slice(0, MAX_JSON)
  }
}

function parseReportJson(text: string): { summary: string; sections: ComprehensiveReportSection[] } {
  const match = text.trim().match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(match ? match[0] : text) as {
    summary?: string
    sections?: Array<{ heading?: string; lines?: string[] }>
  }
  const summary = String(parsed.summary || '').trim() || '종합 검사 리포트'
  const sections = (parsed.sections || [])
    .map((s) => ({
      heading: String(s.heading || '').trim(),
      lines: (s.lines || []).map((l) => String(l).trim()).filter(Boolean),
    }))
    .filter((s) => s.heading && s.lines.length)
  if (!sections.length) {
    throw new Error('report_sections_empty')
  }
  return { summary, sections }
}

export async function generateComprehensiveAssessmentReport(input: {
  testType?: string
  clientLabel?: string
  accessCode?: string
  status?: string
  resultData?: unknown
  responses?: unknown
  priorInterpretation?: string
}): Promise<ComprehensiveReportResult> {
  const interpretBlock = input.priorInterpretation
    ? `\n\n기존 AI 해석(참고):\n${input.priorInterpretation.slice(0, 4000)}`
    : ''

  const prompt = `[종합 검사 리포트 생성]

역할: 상담사가 내담자에게 제공할 **비진단적** 종합 심리검사 리포트 초안을 작성합니다.
- 진단명 단정 금지, 참고·상담 목적 문구 사용
- 한국어, 상담사가 인쇄·전달하기 적합한 톤

검사: ${input.testType || '심리검사'}
내담자: ${input.clientLabel || '내담자'}
코드: ${input.accessCode || '—'}
상태: ${input.status || 'completed'}

검사 결과(JSON):
${truncateJson({ resultData: input.resultData, responses: input.responses })}${interpretBlock}

반드시 JSON만 출력:
{
  "summary": "2~4문장 종합 요약",
  "sections": [
    { "heading": "검사 결과 요약", "lines": ["bullet1", "bullet2"] },
    { "heading": "주요 소견", "lines": ["..."] },
    { "heading": "상담·개입 권고", "lines": ["..."] },
    { "heading": "추가 검사·모니터링", "lines": ["..."] }
  ]
}`

  const result = await generateCounselReply([], prompt)
  const parsed = parseReportJson(result.text)
  return { ...parsed, modelId: result.modelId, usage: result.usage }
}
