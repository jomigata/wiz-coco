import type { RiskLevel } from '../types'

const CRISIS_KEYWORDS_HIGH = [
  '자살',
  '죽고 싶',
  '끝내고 싶',
  '자해',
  '목을 매',
  '약을 먹고',
  '살고 싶지 않',
]

export function detectRisk(text: string): { riskLevel: RiskLevel; keywords: string[] } {
  const lower = text.toLowerCase()
  const keywords = CRISIS_KEYWORDS_HIGH.filter((k) => lower.includes(k))
  if (keywords.length > 0) {
    return { riskLevel: 'high', keywords }
  }
  return { riskLevel: 'none', keywords: [] }
}
