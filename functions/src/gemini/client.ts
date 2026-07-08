import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_PROMPT } from './prompts'
import type { GeminiUsage } from '../types'

export const DEFAULT_COUNSEL_MODEL = 'gemini-2.5-flash-lite'

const MODEL_CANDIDATES = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
]

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return apiKey
}

function getGeminiModel(modelId: string) {
  const genAI = new GoogleGenerativeAI(getApiKey())
  return genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_PROMPT,
  })
}

function toGeminiError(err: unknown): Error {
  if (err instanceof Error) return err
  return new Error(String(err))
}

export function classifyGeminiFailure(err: unknown): {
  kind: 'quota' | 'auth' | 'model' | 'history' | 'unknown'
  message: string
} {
  const message = toGeminiError(err).message
  const lower = message.toLowerCase()

  if (/429|quota|rate limit|resource exhausted|depleted|billing|prepay/i.test(message)) {
    return { kind: 'quota', message }
  }
  if (/api key|apikey|401|403|permission|invalid key/i.test(lower)) {
    return { kind: 'auth', message }
  }
  if (/history|alternate|must be/i.test(lower)) {
    return { kind: 'history', message }
  }
  if (/404|not found|model/i.test(lower)) {
    return { kind: 'model', message }
  }
  return { kind: 'unknown', message }
}

function extractUsage(response: {
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}): GeminiUsage {
  const meta = response.usageMetadata || {}
  const prompt = Number(meta.promptTokenCount ?? 0)
  const completion = Number(meta.candidatesTokenCount ?? 0)
  const total = Number(meta.totalTokenCount ?? prompt + completion)
  return {
    tokensPrompt: prompt > 0 ? prompt : undefined,
    tokensCompletion: completion > 0 ? completion : undefined,
    tokensTotal: total > 0 ? total : undefined,
  }
}

export async function generateCounselReply(
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  userMessage: string,
  options?: { knowledgeContext?: string }
): Promise<{ text: string; modelId: string; usage?: GeminiUsage }> {
  let lastError: Error | null = null
  const prompt = options?.knowledgeContext
    ? `${options.knowledgeContext}\n\n---\n\n[사용자 메시지]\n${userMessage}`
    : userMessage

  for (const modelId of MODEL_CANDIDATES) {
    try {
      const model = getGeminiModel(modelId)
      const chat = model.startChat({ history })
      const result = await chat.sendMessage(prompt)
      return { text: result.response.text(), modelId, usage: extractUsage(result.response) }
    } catch (err) {
      lastError = toGeminiError(err)
      const msg = lastError.message.toLowerCase()
      if (msg.includes('api key') || msg.includes('permission') || msg.includes('403')) {
        throw lastError
      }
    }
  }

  throw lastError ?? new Error('Gemini model call failed')
}

export async function generateSessionSummary(
  transcript: string
): Promise<{ text: string; modelId: string; usage?: GeminiUsage }> {
  let lastError: Error | null = null

  for (const modelId of MODEL_CANDIDATES) {
    try {
      const model = getGeminiModel(modelId)
      const result = await model.generateContent(
        `다음 상담 대화를 3~5문장으로 요약하세요. 진단·처방은 하지 마세요.\n\n${transcript}`
      )
      return {
        text: result.response.text(),
        modelId,
        usage: extractUsage(result.response),
      }
    } catch (err) {
      lastError = toGeminiError(err)
    }
  }

  throw lastError ?? new Error('Gemini summary call failed')
}
