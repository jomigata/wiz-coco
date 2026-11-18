/**
 * TA 이고-오케이그램 검사 문항 (99, 타당도 9문항).
 * Generated from docs/internal-materials/ego-ok/items-99.json
 * Bank id: ego-ok-99 — do not edit by hand; run: npm run sync:ego-ok-questions
 */

export const EGO_OK_ITEM_BANK_ID = 'ego-ok-99' as const;

export type EgoOkScaleKind = 'egogram' | 'okgram' | 'validity';

export interface EgoOkQuestion {
  no: number;
  text: string;
  /** 화면 표시용(의미 그룹 · 넓은 간격). 없으면 text 사용 */
  readingText?: string;
  code: string;
  egoIndex: number | null;
  okIndex: number | null;
  scaleType: string;
  scaleKind: EgoOkScaleKind;
}

export const EGO_OK_QUESTIONS: EgoOkQuestion[] = [
  { no: 1, text: "흠을 잡기보다, 잘한 점이나 장점을 칭찬하는 편이다.", readingText: "흠을 잡기보다, 잘한 점이나 장점을 칭찬하는 편이다.", code: "BA", egoIndex: 1, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 2, text: "인정이나 예외보다, 정해진 규칙과 절차대로 정확히 맞추는 편이다.", readingText: "인정이나 예외보다, 정해진 규칙과 절차대로 정확히 맞추는 편이다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 3, text: "나 자신의 성격과 삶의 방식을, 있는 그대로 받아들이고 아끼는 편이다.", readingText: "나 자신의 성격과 삶의 방식을, 있는 그대로 받아들이고 아끼는 편이다.", code: "DC", egoIndex: null, okIndex: 1, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 4, text: "일을 같이 할 때, 상대의 의견보다 내 방식대로 하라고 말하는 편이다.", readingText: "일을 같이 할 때, 상대의 의견보다 내 방식대로 하라고 말하는 편이다.", code: "AB", egoIndex: 2, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 5, text: "의견이 달라도, 서로 생각이 다를 수 있다고 받아들이는 편이다.", readingText: "의견이 달라도, 서로 생각이 다를 수 있다고 받아들이는 편이다.", code: "BC", egoIndex: null, okIndex: 8, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 6, text: "주변 시선이 신경 쓰여, 사소한 행동도 지나치게 조심하는 편이다.", readingText: "주변 시선이 신경 쓰여, 사소한 행동도 지나치게 조심하는 편이다.", code: "EB", egoIndex: 11, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 7, text: "사람들과 어울릴 때, 속마음을 숨기기보다 편하게 웃고 즐기는 편이다.", readingText: "사람들과 어울릴 때, 속마음을 숨기기보다 편하게 웃고 즐기는 편이다.", code: "DA", egoIndex: 4, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 8, text: "사람들에게 호감이나 좋은 인상을 주지 못한다고 느끼는 편이다.", readingText: "사람들에게 호감이나 좋은 인상을 주지 못한다고 느끼는 편이다.", code: "EC", egoIndex: null, okIndex: 2, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 9, text: "처음 만난 사람이라도,\n그 사람의 성향이나 마음가짐을 꽤 빨리 짐작하는 편이다.", readingText: "처음 만난 사람이라도,\n그 사람의 성향이나 마음가짐을 꽤 빨리 짐작하는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 10, text: "남의 사소한 실수나 약속 어김은,\n대충 넘기기 어렵고 용서하기 어려운 편이다.", readingText: "남의 사소한 실수나 약속 어김은,\n대충 넘기기 어렵고 용서하기 어려운 편이다.", code: "AC", egoIndex: null, okIndex: 36, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 11, text: "문제가 생겼을 때, 감정보다 차분하고 이성적으로 대처하는 편이다.", readingText: "문제가 생겼을 때, 감정보다 차분하고 이성적으로 대처하는 편이다.", code: "CB", egoIndex: 5, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 12, text: "가까운 사람이 실수하지 않도록, 미리 챙겨 알려 주는 편이다.", readingText: "가까운 사람이 실수하지 않도록, 미리 챙겨 알려 주는 편이다.", code: "BB", egoIndex: 7, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 13, text: "내가 속한 곳에서, 나의 역할을 다하며 기여하고 있다고 느끼는 편이다.", readingText: "내가 속한 곳에서, 나의 역할을 다하며 기여하고 있다고 느끼는 편이다.", code: "DC", egoIndex: null, okIndex: 6, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 14, text: "남의 행동이나 일 처리에, 쓴소리나 지적을 쉽게 하는 편이다.", readingText: "남의 행동이나 일 처리에, 쓴소리나 지적을 쉽게 하는 편이다.", code: "AB", egoIndex: 24, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 15, text: "누군가 잘나가는 모습을 볼 때,\n어느 순간 부러움을 느낄 때가 있다.", readingText: "누군가 잘나가는 모습을 볼 때,\n어느 순간 부러움을 느낄 때가 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 16, text: "의견이 엇갈리면, 양쪽이 조금씩 양보해 맞추려는 편이다.", readingText: "의견이 엇갈리면, 양쪽이 조금씩 양보해 맞추려는 편이다.", code: "EA", egoIndex: 18, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 17, text: "해야 할 일이 있어도, 기분에 따라 미루거나 바꿔 버리는 편이다.", readingText: "해야 할 일이 있어도, 기분에 따라 미루거나 바꿔 버리는 편이다.", code: "DB", egoIndex: 8, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 18, text: "남들이 자신의 뜻을 당당히 말하는 모습은, 바람직하다고 본다.", readingText: "남들이 자신의 뜻을 당당히 말하는 모습은, 바람직하다고 본다.", code: "BC", egoIndex: null, okIndex: 25, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 19, text: "어릴 적, 든든하게 받쳐 주는 관계가 없었다고 느끼는 편이다.", readingText: "어릴 적, 든든하게 받쳐 주는 관계가 없었다고 느끼는 편이다.", code: "EC", egoIndex: null, okIndex: 4, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 20, text: "남의 뚜렷한 성과나 좋은 결과에,\n선뜻 인정하고 칭찬해 주기가 어려운 편이다.", readingText: "남의 뚜렷한 성과나 좋은 결과에,\n선뜻 인정하고 칭찬해 주기가 어려운 편이다.", code: "AC", egoIndex: null, okIndex: 37, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 21, text: "이야기할 때, 상대 말에 귀 기울이고 마음을 헤아려 주는 편이다.", readingText: "이야기할 때, 상대 말에 귀 기울이고 마음을 헤아려 주는 편이다.", code: "BA", egoIndex: 12, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 22, text: "사람을 대하거나 일할 때, 손해와 이익을 먼저 따져보는 편이다.", readingText: "사람을 대하거나 일할 때, 손해와 이익을 먼저 따져보는 편이다.", code: "CB", egoIndex: 9, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 23, text: "현실에만 안주하지 않고, 더 높은 목표를 향해 꾸준히 노력하는 편이다.", readingText: "현실에만 안주하지 않고, 더 높은 목표를 향해 꾸준히 노력하는 편이다.", code: "AA", egoIndex: 6, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 24, text: "힘들거나 곤란할 때, 스스로보다 누군가에게 의지하고 싶어지는 편이다.", readingText: "힘들거나 곤란할 때, 스스로보다 누군가에게 의지하고 싶어지는 편이다.", code: "EB", egoIndex: 17, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 25, text: "가까운 사람들이, 나와 있으면 의지가 된다고 말하는 편이다.", readingText: "가까운 사람들이, 나와 있으면 의지가 된다고 말하는 편이다.", code: "DC", egoIndex: null, okIndex: 10, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 26, text: "살면서 기쁨이나 분노를,\n마음 깊이 느껴본 적이 없는 편이다.", readingText: "살면서 기쁨이나 분노를,\n마음 깊이 느껴본 적이 없는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 27, text: "남이 잘되면, 내 일처럼 기분이 좋아지는 편이다.", readingText: "남이 잘되면, 내 일처럼 기분이 좋아지는 편이다.", code: "BC", egoIndex: null, okIndex: 28, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 28, text: "눈치나 규칙보다, 내가 하고 싶은 대로 행동하는 편이다.", readingText: "눈치나 규칙보다, 내가 하고 싶은 대로 행동하는 편이다.", code: "DB", egoIndex: 16, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 29, text: "내 능력이나 잠재력을, 잘 믿지 못해 자주 불안해하는 편이다.", readingText: "내 능력이나 잠재력을, 잘 믿지 못해 자주 불안해하는 편이다.", code: "EC", egoIndex: null, okIndex: 35, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 30, text: "누가 곤란해 보여도, 나서 돕기보다 스스로 해결하게 두는 편이다.", readingText: "누가 곤란해 보여도, 나서 돕기보다 스스로 해결하게 두는 편이다.", code: "AC", egoIndex: null, okIndex: 23, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 31, text: "일이 애매하거나 꼬이면,\n내 뜻대로 해석하기보다 사실과 근거부터 따져보는 편이다.", readingText: "일이 애매하거나 꼬이면,\n내 뜻대로 해석하기보다 사실과 근거부터 따져보는 편이다.", code: "CA", egoIndex: 19, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 32, text: "가정이나 일터에서, 남들의 일에 자주 끼어들어 참견하는 편이다.", readingText: "가정이나 일터에서, 남들의 일에 자주 끼어들어 참견하는 편이다.", code: "BB", egoIndex: 14, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 33, text: "새로운 것을 보면 호기심이 들어, 직접 시도해 보고 싶어지는 편이다.", readingText: "새로운 것을 보면 호기심이 들어, 직접 시도해 보고 싶어지는 편이다.", code: "DA", egoIndex: 10, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 34, text: "여럿이 함께 일할 때, 내가 정한 역할과 순서대로 진행하게 하는 편이다.", readingText: "여럿이 함께 일할 때, 내가 정한 역할과 순서대로 진행하게 하는 편이다.", code: "AB", egoIndex: 31, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 35, text: "내 방식이 더 낫다고 느껴도, 억지로 따르게 하지 않는 편이다.", readingText: "내 방식이 더 낫다고 느껴도, 억지로 따르게 하지 않는 편이다.", code: "BC", egoIndex: null, okIndex: 18, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 36, text: "서운한 일이 있어도, 말로 풀지 못하고 혼자 마음에 담아 두는 편이다.", readingText: "서운한 일이 있어도, 말로 풀지 못하고 혼자 마음에 담아 두는 편이다.", code: "EB", egoIndex: 29, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 37, text: "새로운 일이 생기면, 망설이기보다 먼저 판단하고 행동하는 편이다.", readingText: "새로운 일이 생기면, 망설이기보다 먼저 판단하고 행동하는 편이다.", code: "DC", egoIndex: null, okIndex: 11, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 38, text: "밀린 일을 끝마쳤을 때,\n다음 할 일은 있어도 마음은 한결 가벼워지는 편이다.", readingText: "밀린 일을 끝마쳤을 때,\n다음 할 일은 있어도 마음은 한결 가벼워지는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 39, text: "내 판단에 자신이 없어, 남이 정한 결정을 따르는 편이다.", readingText: "내 판단에 자신이 없어, 남이 정한 결정을 따르는 편이다.", code: "EC", egoIndex: null, okIndex: 22, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 40, text: "의견을 나눌 때, 맞추기보다 내 원칙을 먼저 내세우는 편이다.", readingText: "의견을 나눌 때, 맞추기보다 내 원칙을 먼저 내세우는 편이다.", code: "AC", egoIndex: null, okIndex: 39, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 41, text: "여럿이 일할 때, 서로 호흡을 맞추며 돕는 편이다.", readingText: "여럿이 일할 때, 서로 호흡을 맞추며 돕는 편이다.", code: "EA", egoIndex: 3, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 42, text: "말할 때 농담이나 감정 표현을 잘 안 하고, 건조하게 들리는 편이다.", readingText: "말할 때 농담이나 감정 표현을 잘 안 하고, 건조하게 들리는 편이다.", code: "CB", egoIndex: 33, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 43, text: "힘들어하는 사람을 보면, 도움을 제안하며 함께 방법을 찾는 편이다.", readingText: "힘들어하는 사람을 보면, 도움을 제안하며 함께 방법을 찾는 편이다.", code: "BA", egoIndex: 26, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 44, text: "작은 이득보다, 양심에 부끄럽지 않게 바르게 행동하려는 편이다.", readingText: "작은 이득보다, 양심에 부끄럽지 않게 바르게 행동하려는 편이다.", code: "AA", egoIndex: 13, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 45, text: "내 외모나 첫인상에, 대체로 만족하는 편이다.", readingText: "내 외모나 첫인상에, 대체로 만족하는 편이다.", code: "DC", egoIndex: null, okIndex: 21, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 46, text: "어떤 일이 마음에 꽂히면, 뒷일 생각 없이 일단 행동하는 편이다.", readingText: "어떤 일이 마음에 꽂히면, 뒷일 생각 없이 일단 행동하는 편이다.", code: "DB", egoIndex: 36, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 47, text: "동료가 실수해도, 탓하기보다 격려하는 편이다.", readingText: "동료가 실수해도, 탓하기보다 격려하는 편이다.", code: "BC", egoIndex: null, okIndex: 34, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 48, text: "해야 할 일이 밀려 있어도,\n너무 피곤하면 잠시 쉬고 싶어질 때가 있다.", readingText: "해야 할 일이 밀려 있어도,\n너무 피곤하면 잠시 쉬고 싶어질 때가 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 49, text: "가끔은 나 자신이, 많이 부족하거나 무기력하게 느껴지는 편이다.", readingText: "가끔은 나 자신이, 많이 부족하거나 무기력하게 느껴지는 편이다.", code: "EC", egoIndex: null, okIndex: 7, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 50, text: "상대가 내 기대에 못 미치면, 답답하고 화가 나는 편이다.", readingText: "상대가 내 기대에 못 미치면, 답답하고 화가 나는 편이다.", code: "AC", egoIndex: null, okIndex: 15, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 51, text: "일이나 상황을 볼 때,\n막연한 기대보다 지금 확인된 현실부터 보는 편이다.", readingText: "일이나 상황을 볼 때,\n막연한 기대보다 지금 확인된 현실부터 보는 편이다.", code: "CA", egoIndex: 22, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 52, text: "남의 고민이나 걱정을, 내 일처럼 끌어안고 신경 쓰는 편이다.", readingText: "남의 고민이나 걱정을, 내 일처럼 끌어안고 신경 쓰는 편이다.", code: "BB", egoIndex: 25, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 53, text: "복잡하게 따지지 않고, 첫 느낌으로 상황을 빠르게 파악하는 편이다.", readingText: "복잡하게 따지지 않고, 첫 느낌으로 상황을 빠르게 파악하는 편이다.", code: "DA", egoIndex: 27, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 54, text: "상식이나 기본 매너에서 벗어난 행동을 보면, 받아들이기 어려운 편이다.", readingText: "상식이나 기본 매너에서 벗어난 행동을 보면, 받아들이기 어려운 편이다.", code: "AB", egoIndex: 43, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 55, text: "나는 따뜻한 관심 속에서 자랐다고 느끼는 편이다.", readingText: "나는 따뜻한 관심 속에서 자랐다고 느끼는 편이다.", code: "DC", egoIndex: null, okIndex: 3, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 56, text: "결정을 내리기 전에, 가까운 사람에게 의견을 묻고 동의를 구하는 편이다.", readingText: "결정을 내리기 전에, 가까운 사람에게 의견을 묻고 동의를 구하는 편이다.", code: "EB", egoIndex: 39, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 57, text: "다른 사람 말을 들을 때,\n그 사람이 왜 그렇게 느끼는지 이해하려 하는 편이다.", readingText: "다른 사람 말을 들을 때,\n그 사람이 왜 그렇게 느끼는지 이해하려 하는 편이다.", code: "BC", egoIndex: null, okIndex: 9, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 58, text: "다른 사람과 나를 비교해서 생각하는 일이,\n거의 없는 편이다.", readingText: "다른 사람과 나를 비교해서 생각하는 일이,\n거의 없는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 59, text: "실패가 두려워, 새로운 일이나 도전에 선뜻 나서지 못하는 편이다.", readingText: "실패가 두려워, 새로운 일이나 도전에 선뜻 나서지 못하는 편이다.", code: "EC", egoIndex: null, okIndex: 12, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 60, text: "나와 생각이나 가치관이 다르면, 거부감이 들어 마음을 닫는 편이다.", readingText: "나와 생각이나 가치관이 다르면, 거부감이 들어 마음을 닫는 편이다.", code: "AC", egoIndex: null, okIndex: 26, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 61, text: "주위에서 예의 바르고 착하다는 말을 종종 듣는 편이다.", readingText: "주위에서 예의 바르고 착하다는 말을 종종 듣는 편이다.", code: "EA", egoIndex: 21, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 62, text: "믿기 어려운 말을 들으면, 상대 기분 걱정보다 사실부터 확인하는 편이다.", readingText: "믿기 어려운 말을 들으면, 상대 기분 걱정보다 사실부터 확인하는 편이다.", code: "CB", egoIndex: 41, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 63, text: "주변 사람들의 노력과 성장을, 따뜻하게 격려하고 응원하는 편이다.", readingText: "주변 사람들의 노력과 성장을, 따뜻하게 격려하고 응원하는 편이다.", code: "BA", egoIndex: 23, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 64, text: "남이 보지 않아도, 공공 질서와 규칙을 지키는 편이다.", readingText: "남이 보지 않아도, 공공 질서와 규칙을 지키는 편이다.", code: "AA", egoIndex: 28, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 65, text: "내가 잘하는 분야에서는, 자신감이 있는 편이다.", readingText: "내가 잘하는 분야에서는, 자신감이 있는 편이다.", code: "DC", egoIndex: null, okIndex: 24, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 66, text: "상대의 기분보다, 내 감정을 먼저 말하거나 행동할 때가 있다.", readingText: "상대의 기분보다, 내 감정을 먼저 말하거나 행동할 때가 있다.", code: "DB", egoIndex: 32, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 67, text: "처음 만난 사람에게도, 열린 마음으로 대하는 편이다.", readingText: "처음 만난 사람에게도, 열린 마음으로 대하는 편이다.", code: "BC", egoIndex: null, okIndex: 17, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 68, text: "칭찬이나 따뜻한 격려를 들으면,\n기분이 한결 나고 힘이 조금 생기는 편이다.", readingText: "칭찬이나 따뜻한 격려를 들으면,\n기분이 한결 나고 힘이 조금 생기는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 69, text: "지나간 말이나 행동을, 자책하며 되돌아볼 때가 많다.", readingText: "지나간 말이나 행동을, 자책하며 되돌아볼 때가 많다.", code: "EC", egoIndex: null, okIndex: 14, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 70, text: "사람들과 이야기할 때, 잘한 점보다 고칠 점을 먼저 말하는 편이다.", readingText: "사람들과 이야기할 때, 잘한 점보다 고칠 점을 먼저 말하는 편이다.", code: "AC", egoIndex: null, okIndex: 16, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 71, text: "일이 뜻대로 안 풀릴 때, 걱정만 하기보다 실행할 대안부터 찾는 편이다.", readingText: "일이 뜻대로 안 풀릴 때, 걱정만 하기보다 실행할 대안부터 찾는 편이다.", code: "CA", egoIndex: 46, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 72, text: "부탁받지 않아도, 남의 할 일을 내가 대신 해 버리는 편이다.", readingText: "부탁받지 않아도, 남의 할 일을 내가 대신 해 버리는 편이다.", code: "BB", egoIndex: 30, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 73, text: "긍정적이고 활기찬 기운으로, 일상을 보내는 편이다.", readingText: "긍정적이고 활기찬 기운으로, 일상을 보내는 편이다.", code: "DA", egoIndex: 38, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 74, text: "사소한 일에도 답답해져, 쉽게 욱하며 화를 내는 편이다.", readingText: "사소한 일에도 답답해져, 쉽게 욱하며 화를 내는 편이다.", code: "AB", egoIndex: 50, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 75, text: "일상이나 사회생활에서, 보통 사람들만큼 해낼 수 있다고 생각한다.", readingText: "일상이나 사회생활에서, 보통 사람들만큼 해낼 수 있다고 생각한다.", code: "DC", egoIndex: null, okIndex: 38, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 76, text: "마음에 안 들어도, 그 사람 앞에서는 평소처럼 대하는 편이다.", readingText: "마음에 안 들어도, 그 사람 앞에서는 평소처럼 대하는 편이다.", code: "EB", egoIndex: 47, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 77, text: "가까운 사람들과 연락을 이어 가며, 관계를 유지하는 편이다.", readingText: "가까운 사람들과 연락을 이어 가며, 관계를 유지하는 편이다.", code: "BC", egoIndex: null, okIndex: 27, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 78, text: "일상에서 깜빡하거나 착각해,\n작은 실수를 한 적이 거의 없는 편이다.", readingText: "일상에서 깜빡하거나 착각해,\n작은 실수를 한 적이 거의 없는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 79, text: "사람들과 어울리는 자리가 부담돼서, 혼자 있으려는 편이다.", readingText: "사람들과 어울리는 자리가 부담돼서, 혼자 있으려는 편이다.", code: "EC", egoIndex: null, okIndex: 30, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 80, text: "모임이나 일을 이끌 때,\n남들이 내 결정에 맞춰 주는 게 당연하다고 생각한다.", readingText: "모임이나 일을 이끌 때,\n남들이 내 결정에 맞춰 주는 게 당연하다고 생각한다.", code: "AC", egoIndex: null, okIndex: 32, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 81, text: "함께 정한 결론이 있으면, 내 뜻과 달라도 따르는 편이다.", readingText: "함께 정한 결론이 있으면, 내 뜻과 달라도 따르는 편이다.", code: "EA", egoIndex: 35, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 82, text: "친한 사람이 힘들다고 하면, 위로보다 이유와 해결을 먼저 말하는 편이다.", readingText: "친한 사람이 힘들다고 하면, 위로보다 이유와 해결을 먼저 말하는 편이다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 83, text: "상대가 실수를 해도, 탓하지 않고 상황을 이해하려는 편이다.", readingText: "상대가 실수를 해도, 탓하지 않고 상황을 이해하려는 편이다.", code: "BA", egoIndex: 40, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 84, text: "아무리 바빠도, 말과 행동에서 기본 예의를 지키려는 편이다.", readingText: "아무리 바빠도, 말과 행동에서 기본 예의를 지키려는 편이다.", code: "AA", egoIndex: 34, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 85, text: "사람들 앞에서는 대체로 긴장하지 않고,\n내 생각을 자연스럽게 표현하는 편이다.", readingText: "사람들 앞에서는 대체로 긴장하지 않고,\n내 생각을 자연스럽게 표현하는 편이다.", code: "DC", egoIndex: null, okIndex: 29, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 86, text: "기분이 격해지면, 말이나 행동을 불쑥 내뱉는 편이다.", readingText: "기분이 격해지면, 말이나 행동을 불쑥 내뱉는 편이다.", code: "DB", egoIndex: 44, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 87, text: "개인적인 일들의 선택은, 본인이 스스로 정해야 한다고 생각한다.", readingText: "개인적인 일들의 선택은, 본인이 스스로 정해야 한다고 생각한다.", code: "BC", egoIndex: null, okIndex: 33, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 88, text: "사람들의 사소한 말이나 행동에,\n마음속으로 서운함을 느낄 때가 있다.", readingText: "사람들의 사소한 말이나 행동에,\n마음속으로 서운함을 느낄 때가 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 89, text: "내 옷차림이나 스타일에, 만족하지 못해 자신 없는 편이다.", readingText: "내 옷차림이나 스타일에, 만족하지 못해 자신 없는 편이다.", code: "EC", egoIndex: null, okIndex: 20, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 90, text: "중요한 일은 남에게 맡기기보다, 내가 직접 처리하려는 편이다.", readingText: "중요한 일은 남에게 맡기기보다, 내가 직접 처리하려는 편이다.", code: "AC", egoIndex: null, okIndex: 5, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 91, text: "새로 맡은 일을 시작하기 전, 순서와 계획을 먼저 잡는 편이다.", readingText: "새로 맡은 일을 시작하기 전, 순서와 계획을 먼저 잡는 편이다.", code: "CA", egoIndex: 37, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 92, text: "힘들거나 바빠도 내 마음이 불편해,\n남의 부탁을 쉽게 거절하지 못하는 편이다.", readingText: "힘들거나 바빠도 내 마음이 불편해,\n남의 부탁을 쉽게 거절하지 못하는 편이다.", code: "BB", egoIndex: 45, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 93, text: "화가 나면, 상대가 내 말에 동의할 때까지 계속 밀어붙이는 편이다.", readingText: "화가 나면, 상대가 내 말에 동의할 때까지 계속 밀어붙이는 편이다.", code: "AC", egoIndex: null, okIndex: 13, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 94, text: "사소한 일이라도, 주위를 살피며 가볍게 행동하지 않는 편이다.", readingText: "사소한 일이라도, 주위를 살피며 가볍게 행동하지 않는 편이다.", code: "EA", egoIndex: 42, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 95, text: "맡은 일은 끝까지 책임지고 마무리하는 편이다.", readingText: "맡은 일은 끝까지 책임지고 마무리하는 편이다.", code: "AA", egoIndex: 48, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 96, text: "맞지 않는 사람과도, 맡은 일에서는 역할을 인정하며 협력할 수 있다.", readingText: "맞지 않는 사람과도, 맡은 일에서는 역할을 인정하며 협력할 수 있다.", code: "BC", egoIndex: null, okIndex: 31, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 97, text: "선택을 해야 할 때, 잘못할까 봐 망설이고 결정을 미루는 편이다.", readingText: "선택을 해야 할 때, 잘못할까 봐 망설이고 결정을 미루는 편이다.", code: "EC", egoIndex: null, okIndex: 19, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 98, text: "일이 잘 안 풀려도, 포기하지 않고 다시 시도하는 편이다.", readingText: "일이 잘 안 풀려도, 포기하지 않고 다시 시도하는 편이다.", code: "DC", egoIndex: null, okIndex: 40, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 99, text: "뻔하지 않고 색다른 아이디어가, 자주 떠오르는 편이다.", readingText: "뻔하지 않고 색다른 아이디어가, 자주 떠오르는 편이다.", code: "DA", egoIndex: 49, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
];

export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;
