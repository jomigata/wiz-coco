import { getFirestore } from 'firebase-admin/firestore'
import type { CounselFaqDoc } from './types'

const FAQ_COLLECTION = 'counselFaqs'
const MAX_RESULTS = 3
const MAX_CONTEXT_CHARS = 2200

const db = () => getFirestore()

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，.!?·…]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

function scoreFaq(faq: CounselFaqDoc, message: string, tokens: string[]): number {
  const lowerMsg = message.toLowerCase()
  let score = 0

  if (faq.category && lowerMsg.includes(faq.category.toLowerCase())) {
    score += 3
  }

  for (const kw of faq.keywords) {
    const k = kw.toLowerCase()
    if (k.length < 2) continue
    if (lowerMsg.includes(k)) score += 2
    if (tokens.some((t) => t.includes(k) || k.includes(t))) score += 1
  }

  if (score === 0 && faq.category === '일반') {
    score = 0.1
  }

  return score
}

export async function searchCounselFaqs(userMessage: string): Promise<CounselFaqDoc[]> {
  const snap = await db().collection(FAQ_COLLECTION).where('active', '==', true).get()
  if (snap.empty) return []

  const tokens = tokenize(userMessage)
  const ranked = snap.docs
    .map((d) => d.data() as CounselFaqDoc)
    .map((faq) => ({ faq, score: scoreFaq(faq, userMessage, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.faq)

  return ranked
}

export function formatFaqKnowledgeContext(faqs: CounselFaqDoc[]): string | undefined {
  if (faqs.length === 0) return undefined

  const parts: string[] = [
    '[상담 참고 자료 — 아래 FAQ를 우선 반영하되, 문장을 그대로 복사하지 말고 공감·질문을 덧붙이세요. 진단·처방 금지]',
  ]

  let total = parts[0].length
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i]
    const block = [
      `${i + 1}) [${f.category}]`,
      f.keywords.length ? `키워드: ${f.keywords.join(', ')}` : '',
      `참고: ${f.answerTemplate}`,
    ]
      .filter(Boolean)
      .join('\n')

    if (total + block.length > MAX_CONTEXT_CHARS) break
    parts.push(block)
    total += block.length
  }

  return parts.join('\n\n')
}
