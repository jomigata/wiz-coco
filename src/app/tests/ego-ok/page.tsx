'use client';

import PersonalAmateurTestFlowPage from '@/components/tests/PersonalAmateurTestFlowPage';
import { EGO_OK_AMATEUR_TEST_FLOW } from '@/config/personalAmateurTestFlow';

export default function EgoOkTestPage() {
  return <PersonalAmateurTestFlowPage config={EGO_OK_AMATEUR_TEST_FLOW} />;
}
