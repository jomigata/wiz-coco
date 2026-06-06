import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as logger from 'firebase-functions/logger'
import { requireAdmin } from '../utils/auth'
import { syncCounselFaqFromSheetInternal } from '../knowledge/sync'
import { isCounselFaqSheetConfigured } from '../config/params'

export const syncCounselFaqFromSheet = onCall(
  { region: 'asia-northeast3' },
  async (request) => {
    await requireAdmin(request)

    if (!isCounselFaqSheetConfigured()) {
      throw new HttpsError(
        'failed-precondition',
        'COUNSEL_FAQ_SHEET_ID 환경 변수를 설정한 뒤 Functions를 재배포하세요.'
      )
    }

    try {
      const result = await syncCounselFaqFromSheetInternal()
      return { ok: true, ...result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      logger.error('syncCounselFaqFromSheet failed', { message })
      throw new HttpsError('internal', message)
    }
  }
)

export const scheduledSyncCounselFaq = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul',
  },
  async () => {
    if (!isCounselFaqSheetConfigured()) {
      logger.warn('scheduledSyncCounselFaq skipped: COUNSEL_FAQ_SHEET_ID not set')
      return
    }
    try {
      const result = await syncCounselFaqFromSheetInternal()
      logger.info('scheduledSyncCounselFaq ok', result)
    } catch (err) {
      logger.error('scheduledSyncCounselFaq failed', {
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
)
