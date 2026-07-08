import { setGlobalOptions } from 'firebase-functions/v2'

setGlobalOptions({ region: 'asia-northeast3' })

export { startAiSession } from './counsel/startAiSession'
export { sendCounselMessage } from './counsel/sendCounselMessage'
export { endAiSession } from './counsel/endAiSession'
export { interpretAssessmentResult } from './counsel/interpretAssessmentResult'
export {
  syncCounselFaqFromSheet,
  scheduledSyncCounselFaq,
} from './counsel/syncCounselFaqFromSheet'
