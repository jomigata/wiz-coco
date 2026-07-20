'use client';

import PersonalAmateurTestFlowPage from '@/components/tests/PersonalAmateurTestFlowPage';
import { MBTI_AMATEUR_TEST_FLOW } from '@/config/personalAmateurTestFlow';

export default function MbtiTestPage() {
  return <PersonalAmateurTestFlowPage config={MBTI_AMATEUR_TEST_FLOW} />;
}
