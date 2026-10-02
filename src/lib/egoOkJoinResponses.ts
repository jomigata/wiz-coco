import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import { EGO_OK_ITEM_BANK_ID } from '@/data/egoOkQuestions';
import { buildMbtiProJoinResponses } from '@/lib/mbtiProJoinResponses';

/** 포털·상담코드 제출용 이고-오케이 응답 (문항 번호 0..89 → 척도 값) */
export function buildEgoOkJoinResponses(
  answers: Record<string, number>,
  clientInfo?: ClientInfo | null,
): Record<string, unknown> {
  return {
    ...buildMbtiProJoinResponses(answers, clientInfo),
    _itemBankId: EGO_OK_ITEM_BANK_ID,
    _testKind: 'EGO_OK_PRO',
  };
}
