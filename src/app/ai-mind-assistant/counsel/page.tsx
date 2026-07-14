'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthResolved } from '@/hooks/useAuthResolved'
import { AuthGate, AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews'
import { AiCounselChatThread } from '@/components/counsel/AiCounselChatThread'
import { startAiSession, endAiSession } from '@/lib/counsel/api'

export default function AiCounselPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [ending, setEnding] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const initSession = useCallback(async () => {
    setInitializing(true)
    setInitError(null)
    try {
      const { sessionId: id } = await startAiSession('AI 상담')
      setSessionId(id)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '상담 세션을 시작할 수 없습니다. Functions 배포 및 로그인을 확인하세요.'
      setInitError(message)
    } finally {
      setInitializing(false)
    }
  }, [])

  useEffect(() => {
    if (authPending || showLoginRequired || !user) return
    void initSession()
  }, [authPending, showLoginRequired, user, initSession])

  async function handleEndSession() {
    if (!sessionId) return
    setEnding(true)
    try {
      const { summary: s } = await endAiSession(sessionId)
      setSummary(s)
      setSessionId(null)
    } catch (err) {
      setInitError(err instanceof Error ? err.message : '세션 종료에 실패했습니다.')
    } finally {
      setEnding(false)
    }
  }

  return (
    <AuthGate
      loadingFallback={
        <div className="min-h-screen bg-[#f8fafc] pt-16 flex items-center justify-center">
          <AuthLoadingState message="AI 상담 준비 중..." />
        </div>
      }
      loginFallback={
        <div className="min-h-screen bg-[#f8fafc] pt-16 flex items-center justify-center px-4">
          <AuthRequiredState
            title="AI 실시간 상담"
            description="로그인한 상태에서 AI 상담을 이용할 수 있습니다."
            loginHref="/login?redirect=/ai-mind-assistant/counsel"
          />
        </div>
      }
    >
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="pt-16">
          <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-8">
            <div className="max-w-3xl mx-auto">
              {initializing && !sessionId && !initError ? (
                <div className="flex items-center justify-center py-24">
                  <AuthLoadingState message="AI 상담 세션을 시작하는 중..." />
                </div>
              ) : (
                <>
                  <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">AI 실시간 상담</h1>
                      <p className="text-sm text-indigo-200/80 mt-1">
                        {user?.email} · AI는 전문 치료를 대체하지 않습니다
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/ai-mind-assistant"
                        className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-indigo-100 hover:bg-slate-100 transition-colors"
                      >
                        AI 비서 홈
                      </Link>
                    </div>
                  </header>

                  {summary && (
                    <div className="mb-6 p-4 rounded-xl bg-indigo-950/60 border border-indigo-400/30 text-sm text-indigo-100">
                      <p className="font-semibold text-sky-300 mb-2">상담 요약</p>
                      <p className="whitespace-pre-wrap">{summary}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSummary(null)
                          void initSession()
                        }}
                        className="mt-4 text-sky-400 font-medium text-sm hover:underline"
                      >
                        새 상담 시작
                      </button>
                    </div>
                  )}

                  {initError && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-sm text-amber-100">
                      <p>{initError}</p>
                      <button
                        type="button"
                        onClick={() => void initSession()}
                        className="mt-2 text-amber-300 font-medium hover:underline"
                      >
                        다시 시도
                      </button>
                    </div>
                  )}

                  {sessionId && !summary && (
                    <>
                      <AiCounselChatThread sessionId={sessionId} />
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleEndSession}
                          disabled={ending}
                          className="text-sm text-indigo-300 hover:text-white disabled:opacity-50"
                        >
                          {ending ? '종료 중...' : '상담 종료'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGate>
  )
}
