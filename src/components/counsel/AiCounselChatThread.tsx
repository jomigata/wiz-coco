'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { subscribeAiCounselMessages } from '@/lib/firestore/aiCounselSessions'
import { sendCounselMessage } from '@/lib/counsel/api'
import { getCallableErrorMessage } from '@/lib/counsel/errors'
import type { AiCounselMessageDoc } from '@/types/aiCounsel'

interface AiCounselChatThreadProps {
  sessionId: string
}

export function AiCounselChatThread({ sessionId }: AiCounselChatThreadProps) {
  const [messages, setMessages] = useState<(AiCounselMessageDoc & { id: string })[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = subscribeAiCounselMessages(sessionId, setMessages, (err) => {
      setError(err.message)
    })
    return () => unsub()
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setError(null)
    setInput('')

    try {
      await sendCounselMessage(sessionId, text)
    } catch (err) {
      setError(getCallableErrorMessage(err))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[min(70vh,640px)] bg-white rounded-2xl shadow-xl border border-indigo-500/30 overflow-hidden backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-indigo-200/70 text-sm py-8">
            편하게 마음을 나눠 보세요. AI는 전문 치료를 대체하지 않습니다.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                  : 'bg-white/10 text-indigo-50 border border-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 py-2 text-sm text-red-300 bg-red-950/40 border-t border-red-500/30">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-4 border-t border-indigo-500/20 bg-white"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          maxLength={2000}
          disabled={sending}
          className="flex-1 rounded-xl border border-slate-200 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-200/40 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white disabled:opacity-40 hover:from-sky-400 hover:to-indigo-500 transition-colors"
          aria-label="전송"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  )
}
