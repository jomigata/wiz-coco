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
  { no: 1, text: "주변 사람들의 좋은 모습을 금방 알아차리고,\n자연스럽게 칭찬하곤 한다.", readingText: "주변 사람들의 좋은 모습을 금방 알아차리고,\n자연스럽게 칭찬하곤 한다.", code: "BA", egoIndex: 1, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 2, text: "사람들과의 관계나 일 처리에서,\n원칙과 규정을 잘 지키려 한다.", readingText: "사람들과의 관계나 일 처리에서,\n원칙과 규정을 잘 지키려 한다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 3, text: "남들의 시선이나 기준에 흔들리지 않고,\n내 삶의 방식대로 존중하며 살아가는 편이다.", readingText: "남들의 시선이나 기준에 흔들리지 않고,\n내 삶의 방식대로 존중하며 살아가는 편이다.", code: "DC", egoIndex: null, okIndex: 1, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 4, text: "모임이나 일을 진행할 때,\n남의 의견보다는 내 방식대로 이끌고자 한다.", readingText: "모임이나 일을 진행할 때,\n남의 의견보다는 내 방식대로 이끌고자 한다.", code: "AB", egoIndex: 2, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 5, text: "사람들의 생각이나 방식이 달라도,\n있는 그대로 존중하며 받아들이는 편이다.", readingText: "사람들의 생각이나 방식이 달라도,\n있는 그대로 존중하며 받아들이는 편이다.", code: "BC", egoIndex: null, okIndex: 8, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 6, text: "사람들의 눈치를 많이 보는 편이라,\n어디서든 편하게 행동하기가 쉽지 않다.", readingText: "사람들의 눈치를 많이 보는 편이라,\n어디서든 편하게 행동하기가 쉽지 않다.", code: "EB", egoIndex: 11, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 7, text: "누군가를 대할 때 득실을 따지기보다는,\n있는 그대로의 마음으로 편안하고 즐겁게\n어울리곤 한다.", readingText: "누군가를 대할 때 득실을 따지기보다는,\n있는 그대로의 마음으로 편안하고 즐겁게\n어울리곤 한다.", code: "DA", egoIndex: 4, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 8, text: "나는 다른 사람에게 호감을 주지 못하다고, 느낄 때가 많다.", readingText: "나는 다른 사람에게 호감을 주지 못하다고, 느낄 때가 많다.", code: "EC", egoIndex: null, okIndex: 2, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 9, text: "주변에서 어떤 일이 생겨도, 마음이 흔들리거나 고민에 빠진 적 없이 늘 평정심을 유지하는 편이다.", readingText: "주변에서 어떤 일이 생겨도, 마음이 흔들리거나 고민에 빠진 적 없이 늘 평정심을 유지하는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 10, text: "상대방의 사소한 실수나 잘못이 보이면, 쉽게 넘어가기 어려운 편이다.", readingText: "상대방의 사소한 실수나 잘못이 보이면, 쉽게 넘어가기 어려운 편이다.", code: "AC", egoIndex: null, okIndex: 36, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 11, text: "갑작스러운 일이 생겨도, 동요하지 않고 차분하게 행동하는 편이다.", readingText: "갑작스러운 일이 생겨도, 동요하지 않고 차분하게 행동하는 편이다.", code: "CB", egoIndex: 5, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 12, text: "가족이나 주변 사람의 사소한 고민을 들으면,\n그냥 지나치지 못하고 이모저모 의견을 보태곤 한다.", readingText: "가족이나 주변 사람의 사소한 고민을 들으면,\n그냥 지나치지 못하고 이모저모 의견을 보태곤 한다.", code: "BB", egoIndex: 7, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 13, text: "평소 주변과 사회에, 나름 도움이 되는 사람이라고 생각한다.", readingText: "평소 주변과 사회에, 나름 도움이 되는 사람이라고 생각한다.", code: "DC", egoIndex: null, okIndex: 6, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 14, text: "누군가 나의 행동이나 판단을 지적하면,\n쉽게 받아들이지 못하고 바로 반박하는 편이다.", readingText: "누군가 나의 행동이나 판단을 지적하면,\n쉽게 받아들이지 못하고 바로 반박하는 편이다.", code: "AB", egoIndex: 24, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 15, text: "살면서 누가 잘 나갈 때,\n마음속으로 시샘이나 질투심이 든적이 거의 없었다.", readingText: "살면서 누가 잘 나갈 때,\n마음속으로 시샘이나 질투심이 든적이 거의 없었다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 16, text: "의견 차이가 생기면,\n대체로 양보하며 다른 사람과 원만히 맞추어보려 하곤 한다.", readingText: "의견 차이가 생기면,\n대체로 양보하며 다른 사람과 원만히 맞추어보려 하곤 한다.", code: "EA", egoIndex: 18, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 17, text: "계획을 세우기보다, 그 순간 내키는 대로 행동하곤 한다.", readingText: "계획을 세우기보다, 그 순간 내키는 대로 행동하곤 한다.", code: "DB", egoIndex: 8, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 18, text: "다른 사람이 자신의 뜻을 당당히 말하는 것은, 바람직하다고 생각한다.", readingText: "다른 사람이 자신의 뜻을 당당히 말하는 것은, 바람직하다고 생각한다.", code: "BC", egoIndex: null, okIndex: 25, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 19, text: "어릴 때부터 주변 사람에게,\n충분한 관심이나 지지를 받지 못했다고 생각한다.", readingText: "어릴 때부터 주변 사람에게,\n충분한 관심이나 지지를 받지 못했다고 생각한다.", code: "EC", egoIndex: null, okIndex: 4, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 20, text: "나는 남의 장점이 보여도, 마음속으로 칭찬하기가 쉽지 않은 편이다.", readingText: "나는 남의 장점이 보여도, 마음속으로 칭찬하기가 쉽지 않은 편이다.", code: "AC", egoIndex: null, okIndex: 37, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 21, text: "상대방의 이야기에 귀 기울여 들으며,\n내 일처럼 진심으로 헤아려 주곤 한다.", readingText: "상대방의 이야기에 귀 기울여 들으며,\n내 일처럼 진심으로 헤아려 주곤 한다.", code: "BA", egoIndex: 12, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 22, text: "어떤 일을 결정할 때, 손해와 이익의 득실을 먼저 계산하곤 한다.", readingText: "어떤 일을 결정할 때, 손해와 이익의 득실을 먼저 계산하곤 한다.", code: "CB", egoIndex: 9, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 23, text: "현재에 머무르지 않고, 정해둔 목표를 향해 꾸준히 노력하는 편이다.", readingText: "현재에 머무르지 않고, 정해둔 목표를 향해 꾸준히 노력하는 편이다.", code: "AA", egoIndex: 6, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 24, text: "어려운 일에 부딪히면 스스로 해결하기보다, 누군가에게 의지하고 싶어진다.", readingText: "어려운 일에 부딪히면 스스로 해결하기보다, 누군가에게 의지하고 싶어진다.", code: "EB", egoIndex: 17, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 25, text: "나는 주변에서 대체로, 좋은 신뢰와 인정을 받고 있다고 생각한다.", readingText: "나는 주변에서 대체로, 좋은 신뢰와 인정을 받고 있다고 생각한다.", code: "DC", egoIndex: null, okIndex: 10, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 26, text: "살면서 기쁨이나 슬픔 또는 화 같은 감정들을,\n마음속에서 느끼거나 표현해 본 적이 별로 없다.", readingText: "살면서 기쁨이나 슬픔 또는 화 같은 감정들을,\n마음속에서 느끼거나 표현해 본 적이 별로 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 27, text: "주변 사람이 잘되는 모습을 보면, 내 일처럼 기분이 좋아진다.", readingText: "주변 사람이 잘되는 모습을 보면, 내 일처럼 기분이 좋아진다.", code: "BC", egoIndex: null, okIndex: 28, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 28, text: "주변의 눈치나 규칙보다는, 내 마음이 가는대로 자유롭게 행동하곤 한다.", readingText: "주변의 눈치나 규칙보다는, 내 마음이 가는대로 자유롭게 행동하곤 한다.", code: "DB", egoIndex: 16, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 29, text: "주변의 다른 사람들보다, 내 능력이나 가능성이 부족해 보이는 편이다.", readingText: "주변의 다른 사람들보다, 내 능력이나 가능성이 부족해 보이는 편이다.", code: "EC", egoIndex: null, okIndex: 35, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 30, text: "남들이 곤란에 처하거나 어려워하는 것은,\n본인들이 열심히 노력하지 않은 탓이라 생각한다.", readingText: "남들이 곤란에 처하거나 어려워하는 것은,\n본인들이 열심히 노력하지 않은 탓이라 생각한다.", code: "AC", egoIndex: null, okIndex: 23, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 31, text: "어려운 문제에 부딪히면,\n원인을 차근차근 따져보며 해결책을 찾아내는 편이다.", readingText: "어려운 문제에 부딪히면,\n원인을 차근차근 따져보며 해결책을 찾아내는 편이다.", code: "CA", egoIndex: 19, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 32, text: "상대방의 스스로 할 수 있는 일인데도,\n불안한 마음에 나서서 해 주곤 한다.", readingText: "상대방의 스스로 할 수 있는 일인데도,\n불안한 마음에 나서서 해 주곤 한다.", code: "BB", egoIndex: 14, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 33, text: "새로운 분야나 처음 해보는 일을 접하면,\n호기심을 가지고 즐겁게 시작하곤 한다.", readingText: "새로운 분야나 처음 해보는 일을 접하면,\n호기심을 가지고 즐겁게 시작하곤 한다.", code: "DA", egoIndex: 10, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 34, text: "타인의 일 처리 방식이 마음에 안 들면,\n대체로 간섭하며 바로잡으려 하는 편이다.", readingText: "타인의 일 처리 방식이 마음에 안 들면,\n대체로 간섭하며 바로잡으려 하는 편이다.", code: "AB", egoIndex: 31, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 35, text: "주변 사람이 좋은 성과를 거두거나 좋은 일이 생기면,\n진심으로 기뻐해 주는 편이다.", readingText: "주변 사람이 좋은 성과를 거두거나 좋은 일이 생기면,\n진심으로 기뻐해 주는 편이다.", code: "BC", egoIndex: null, okIndex: 18, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 36, text: "서운하거나 화가 나는 일이 있어도, 내색하지 않고 혼자 감내하곤 한다.", readingText: "서운하거나 화가 나는 일이 있어도, 내색하지 않고 혼자 감내하곤 한다.", code: "EB", egoIndex: 29, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 37, text: "어떤 일이든 망설이기보다, 주도적으로 판단하고 실행하는 편이다.", readingText: "어떤 일이든 망설이기보다, 주도적으로 판단하고 실행하는 편이다.", code: "DC", egoIndex: null, okIndex: 11, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 38, text: "보통 새로운 일을 시작할 때 약간의 긴장감이나 기대감을 가지는 편이다.", readingText: "보통 새로운 일을 시작할 때 약간의 긴장감이나 기대감을 가지는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 39, text: "자신감이 부족하여 스스로 결정하기보다, 남들이 하는 대로 따르는 편이다.", readingText: "자신감이 부족하여 스스로 결정하기보다, 남들이 하는 대로 따르는 편이다.", code: "EC", egoIndex: null, okIndex: 22, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 40, text: "대화나 일할 때, 상대의 생각보다 내 기준을 우선시하는 편이다.", readingText: "대화나 일할 때, 상대의 생각보다 내 기준을 우선시하는 편이다.", code: "AC", egoIndex: null, okIndex: 39, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 41, text: "주위 사람들로부터 예의 바르고 친절하다는 말을 종종 듣는다.", readingText: "주위 사람들로부터 예의 바르고 친절하다는 말을 종종 듣는다.", code: "EA", egoIndex: 3, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 42, text: "다른 사람들과 대화할 때,\n이성적이고 차분하게 대하는 편이라 건조하다는 말을 듣곤 한다.", readingText: "다른 사람들과 대화할 때,\n이성적이고 차분하게 대하는 편이라 건조하다는 말을 듣곤 한다.", code: "CB", egoIndex: 33, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 43, text: "다른 사람들의 형편이나 어려움을 걱정하고, 챙겨주려 노력하곤 한다.", readingText: "다른 사람들의 형편이나 어려움을 걱정하고, 챙겨주려 노력하곤 한다.", code: "BA", egoIndex: 26, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 44, text: "작은 이익보다, 양심과 바른 기준에 따라 행동하곤 한다.", readingText: "작은 이익보다, 양심과 바른 기준에 따라 행동하곤 한다.", code: "AA", egoIndex: 13, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 45, text: "내 외모나 인상에 대체로 만족하는 편이다.", readingText: "내 외모나 인상에 대체로 만족하는 편이다.", code: "DC", egoIndex: null, okIndex: 21, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 46, text: "문제가 생겼을 때 차분한 분석보다,\n지금의 감정이나 직감대로 행동하곤 한다.", readingText: "문제가 생겼을 때 차분한 분석보다,\n지금의 감정이나 직감대로 행동하곤 한다.", code: "DB", egoIndex: 36, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 47, text: "동료가 실수나 실패를 하더라도, 탓하기보다 격려해 주는 편이다.", readingText: "동료가 실수나 실패를 하더라도, 탓하기보다 격려해 주는 편이다.", code: "BC", egoIndex: null, okIndex: 34, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 48, text: "타인에 대한 험담이나 사소한 거짓말을 마음속으로라도 떠올려본 적이 없다.", readingText: "타인에 대한 험담이나 사소한 거짓말을 마음속으로라도 떠올려본 적이 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 49, text: "때때로 내가 부족하거나, 무기력한 사람처럼 느껴질 때도 있다.", readingText: "때때로 내가 부족하거나, 무기력한 사람처럼 느껴질 때도 있다.", code: "EC", egoIndex: null, okIndex: 7, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 50, text: "상대가 내 생각만큼 따라주지 않을 때,\n속상하거나 실망감을 느끼는 편이다.", readingText: "상대가 내 생각만큼 따라주지 않을 때,\n속상하거나 실망감을 느끼는 편이다.", code: "AC", egoIndex: null, okIndex: 15, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 51, text: "일을 처리할 때는 개인적인 짐작보다,\n명확한 사실과 근거를 바탕으로 진행하는 편이다.", readingText: "일을 처리할 때는 개인적인 짐작보다,\n명확한 사실과 근거를 바탕으로 진행하는 편이다.", code: "CA", egoIndex: 22, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 52, text: "다른 사람의 문제를 내 일처럼 신경 쓰다가,\n스스로 지치거나 힘에 부치곤 한다.", readingText: "다른 사람의 문제를 내 일처럼 신경 쓰다가,\n스스로 지치거나 힘에 부치곤 한다.", code: "BB", egoIndex: 25, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 53, text: "어떤 일을 선택할 때 복잡하게 따지기보다,\n내 마음이 진정으로 원하고 끌리는 쪽을 택하곤 한다.", readingText: "어떤 일을 선택할 때 복잡하게 따지기보다,\n내 마음이 진정으로 원하고 끌리는 쪽을 택하곤 한다.", code: "DA", egoIndex: 27, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 54, text: "상식이나 기준에 어긋나는 행동을 보면,\n쉽게 이해하기 어렵고 거부감이 들곤 한다.", readingText: "상식이나 기준에 어긋나는 행동을 보면,\n쉽게 이해하기 어렵고 거부감이 들곤 한다.", code: "AB", egoIndex: 43, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 55, text: "어릴 때부터 사랑과 보살핌 속에서, 자연스럽게 자랐다고 느낀다.", readingText: "어릴 때부터 사랑과 보살핌 속에서, 자연스럽게 자랐다고 느낀다.", code: "DC", egoIndex: null, okIndex: 3, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 56, text: "사소한 일이라도 혼자 결정하기 어려워,\n주변 사람의 확인이나 동의를 구하곤 한다.", readingText: "사소한 일이라도 혼자 결정하기 어려워,\n주변 사람의 확인이나 동의를 구하곤 한다.", code: "EB", egoIndex: 39, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 57, text: "대체로 다른 사람의 입장을 존중하고,\n그의 감정이나 기분도 잘 받아들이는 편이다.", readingText: "대체로 다른 사람의 입장을 존중하고,\n그의 감정이나 기분도 잘 받아들이는 편이다.", code: "BC", egoIndex: null, okIndex: 9, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 58, text: "수면 시간이 턱없이 부족해도,\n몸이 지치거나 피곤해지는 일은 거의 없는 편이다.", readingText: "수면 시간이 턱없이 부족해도,\n몸이 지치거나 피곤해지는 일은 거의 없는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 59, text: "혹시나 실수하거나 망신을 당할까 봐,\n새로운 일이나 도전에 선뜻 나서지 못하는 편이다.", readingText: "혹시나 실수하거나 망신을 당할까 봐,\n새로운 일이나 도전에 선뜻 나서지 못하는 편이다.", code: "EC", egoIndex: null, okIndex: 12, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 60, text: "나와 생각이 다른 사람을 보면,\n쉽게 수용하기 어렵고 불편한 감정이 드는 편이다.", readingText: "나와 생각이 다른 사람을 보면,\n쉽게 수용하기 어렵고 불편한 감정이 드는 편이다.", code: "AC", egoIndex: null, okIndex: 26, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 61, text: "주변 사람들과의 좋은 관계를 위해,\n가급적 상대의 뜻을 진심으로 따라주곤 한다.", readingText: "주변 사람들과의 좋은 관계를 위해,\n가급적 상대의 뜻을 진심으로 따라주곤 한다.", code: "EA", egoIndex: 21, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 62, text: "누군가의 말에 의문이 생기면,\n상대의 기분보다는 정확한 사실부터 확인하는 편이다.", readingText: "누군가의 말에 의문이 생기면,\n상대의 기분보다는 정확한 사실부터 확인하는 편이다.", code: "CB", egoIndex: 41, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 63, text: "누군가 실수를 하거나 부족한 모습을 보여도,\n너그러운 마음으로 감싸주곤 한다.", readingText: "누군가 실수를 하거나 부족한 모습을 보여도,\n너그러운 마음으로 감싸주곤 한다.", code: "BA", egoIndex: 23, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 64, text: "평소에 사회적 규칙이나 공공질서를, 원칙대로 바르게 지키려고 노력한다.", readingText: "평소에 사회적 규칙이나 공공질서를, 원칙대로 바르게 지키려고 노력한다.", code: "AA", egoIndex: 28, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 65, text: "새로운 지식이나 경험을 접하면, 흥미를 갖고 탐색하며 배워나가는 편이다.", readingText: "새로운 지식이나 경험을 접하면, 흥미를 갖고 탐색하며 배워나가는 편이다.", code: "DC", egoIndex: null, okIndex: 24, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 66, text: "다른 사람의 입장을 배려하기보다,\n내 기분대로 행동해 주변을 머쓱하게 하곤 한다.", readingText: "다른 사람의 입장을 배려하기보다,\n내 기분대로 행동해 주변을 머쓱하게 하곤 한다.", code: "DB", egoIndex: 32, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 67, text: "사람들과 어울릴 때, 경계하기보다는 믿고 긍정적으로 받아들이는 편이다.", readingText: "사람들과 어울릴 때, 경계하기보다는 믿고 긍정적으로 받아들이는 편이다.", code: "BC", egoIndex: null, okIndex: 17, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 68, text: "무리하게 일하거나 잠이 부족하면, 금방 피곤해지고 쉬고 싶어진다.", readingText: "무리하게 일하거나 잠이 부족하면, 금방 피곤해지고 쉬고 싶어진다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 69, text: "사소한 일이라도 내가 했던 말이나 행동을 자꾸 떠올리며,\n은근히 걱정하거나 후회하는 편이다.", readingText: "사소한 일이라도 내가 했던 말이나 행동을 자꾸 떠올리며,\n은근히 걱정하거나 후회하는 편이다.", code: "EC", egoIndex: null, okIndex: 14, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 70, text: "사람들을 보면, 장점보다는 단점이나 아쉬운 점이 먼저 보이는 편이다.", readingText: "사람들을 보면, 장점보다는 단점이나 아쉬운 점이 먼저 보이는 편이다.", code: "AC", egoIndex: null, okIndex: 16, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 71, text: "일이나 상황이 뜻대로 되지 않을 때,\n막연하게 걱정하기보다 곧바로 실행할 수 있는 대안부터 찾아보는 편이다.", readingText: "일이나 상황이 뜻대로 되지 않을 때,\n막연하게 걱정하기보다 곧바로 실행할 수 있는 대안부터 찾아보는 편이다.", code: "CA", egoIndex: 46, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 72, text: "주변의 어려움을 보면, 부탁받지 않아도 먼저 나서서 도와주곤 한다.", readingText: "주변의 어려움을 보면, 부탁받지 않아도 먼저 나서서 도와주곤 한다.", code: "BB", egoIndex: 30, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 73, text: "대체로 생기 있고 밝은 태도로, 일상을 활기차게 보내곤 한다.", readingText: "대체로 생기 있고 밝은 태도로, 일상을 활기차게 보내곤 한다.", code: "DA", egoIndex: 38, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 74, text: "일이 잘 안 풀리거나 마음에 들지 않으면,\n쉽게 짜증이 나거나 화가 나곤 한다.", readingText: "일이 잘 안 풀리거나 마음에 들지 않으면,\n쉽게 짜증이 나거나 화가 나곤 한다.", code: "AB", egoIndex: 50, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 75, text: "완벽하지는 않아도, 내 능력과 가능성을 믿고 긍정적으로 생각하는 편이다.", readingText: "완벽하지는 않아도, 내 능력과 가능성을 믿고 긍정적으로 생각하는 편이다.", code: "DC", egoIndex: null, okIndex: 38, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 76, text: "상대방의 기분을 고심하느라,\n정작 내가 하고 싶은 주장이나 요구를 접곤 한다.", readingText: "상대방의 기분을 고심하느라,\n정작 내가 하고 싶은 주장이나 요구를 접곤 한다.", code: "EB", egoIndex: 47, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 77, text: "평소 사람들을 신뢰하며 우호적으로 대하는 편이라,\n대체로 좋은 관계를 이어가고 있다.", readingText: "평소 사람들을 신뢰하며 우호적으로 대하는 편이라,\n대체로 좋은 관계를 이어가고 있다.", code: "BC", egoIndex: null, okIndex: 27, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 78, text: "살면서 헷갈리거나 깜빡하여, 작은 실수를 한 적이 아직까지는 거의 없다.", readingText: "살면서 헷갈리거나 깜빡하여, 작은 실수를 한 적이 아직까지는 거의 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 79, text: "사람들과 어울리는 게 살짝 부담스러워,\n혼자 시간을 보내는 것을 더 좋아하는 편이다.", readingText: "사람들과 어울리는 게 살짝 부담스러워,\n혼자 시간을 보내는 것을 더 좋아하는 편이다.", code: "EC", egoIndex: null, okIndex: 30, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 80, text: "누구를 이끌거나 지시할 때,\n내 뜻대로 잘 따라와 주는 것이 맞다고 생각하는 편이다.", readingText: "누구를 이끌거나 지시할 때,\n내 뜻대로 잘 따라와 주는 것이 맞다고 생각하는 편이다.", code: "AC", egoIndex: null, okIndex: 32, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 81, text: "여럿이 함께 의논할 때,\n내 생각보다는 다른 사람들의 이야기를 우선해서 경청하곤 한다.", readingText: "여럿이 함께 의논할 때,\n내 생각보다는 다른 사람들의 이야기를 우선해서 경청하곤 한다.", code: "EA", egoIndex: 35, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 82, text: "사적인 대화를 나눌 때조차 감정적인 공감보다는,\n정확한 정보나 논리를 우선시하는 편이다.", readingText: "사적인 대화를 나눌 때조차 감정적인 공감보다는,\n정확한 정보나 논리를 우선시하는 편이다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 83, text: "누구를 대하든 함부로 하지 않고,\n상대의 생각과 입장을 먼저 존중해 주곤 한다.", readingText: "누구를 대하든 함부로 하지 않고,\n상대의 생각과 입장을 먼저 존중해 주곤 한다.", code: "BA", egoIndex: 40, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 84, text: "사소한 일이라도, 정해진 원칙과 올바른 태도를 지키려고 노력하는 편이다.", readingText: "사소한 일이라도, 정해진 원칙과 올바른 태도를 지키려고 노력하는 편이다.", code: "AA", egoIndex: 34, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 85, text: "다른 사람 앞에서, 내 생각을 솔직하고 자연스럽게 말하는 편이다.", readingText: "다른 사람 앞에서, 내 생각을 솔직하고 자연스럽게 말하는 편이다.", code: "DC", egoIndex: null, okIndex: 29, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 86, text: "속상하거나 짜증이 날 때는,\n감정을 마음속에 담아두지 못하고 솔직하게 드러내곤 한다.", readingText: "속상하거나 짜증이 날 때는,\n감정을 마음속에 담아두지 못하고 솔직하게 드러내곤 한다.", code: "DB", egoIndex: 44, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 87, text: "누군가의 결정에 대하여,\n그 사람의 선택과 방식을 늘 존중해 주는 편이다.", readingText: "누군가의 결정에 대하여,\n그 사람의 선택과 방식을 늘 존중해 주는 편이다.", code: "BC", egoIndex: null, okIndex: 33, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 88, text: "지금껏 주변 사람들의 말이나 행동 때문에,\n속상해하거나 섭섭함을 느낀적이 거의 없다.", readingText: "지금껏 주변 사람들의 말이나 행동 때문에,\n속상해하거나 섭섭함을 느낀적이 거의 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 89, text: "사람들과 함께할 때,\n내 외모나 스타일이 마음에 들지 않아 신경이 쓰이는 편이다.", readingText: "사람들과 함께할 때,\n내 외모나 스타일이 마음에 들지 않아 신경이 쓰이는 편이다.", code: "EC", egoIndex: null, okIndex: 20, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 90, text: "누구에게나 내 진짜 속마음을 쉽게 보여주지 않고,\n대체로 경계하며 거리를 두는 편이다.", readingText: "누구에게나 내 진짜 속마음을 쉽게 보여주지 않고,\n대체로 경계하며 거리를 두는 편이다.", code: "AC", egoIndex: null, okIndex: 5, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 91, text: "대체로 일을 시작하기 전에 미리 계획을 세우고,\n순서에 따라 차분히 진행하하는 편이다.", readingText: "대체로 일을 시작하기 전에 미리 계획을 세우고,\n순서에 따라 차분히 진행하하는 편이다.", code: "CA", egoIndex: 37, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 92, text: "내가 힘들어도, 타인의 부탁이나 요청을 쉽게 거절하지 못하곤 한다.", readingText: "내가 힘들어도, 타인의 부탁이나 요청을 쉽게 거절하지 못하곤 한다.", code: "BB", egoIndex: 45, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 93, text: "생각이 서로 다를 때,\n상대의 방식보다 내 뜻을 우선하여 관철하려는 편이다.", readingText: "생각이 서로 다를 때,\n상대의 방식보다 내 뜻을 우선하여 관철하려는 편이다.", code: "AC", egoIndex: null, okIndex: 13, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 94, text: "맡은 일을 할 때 주변에서 기대하는 바를 잘 헤아려,\n바르게 완수해내곤 한다.", readingText: "맡은 일을 할 때 주변에서 기대하는 바를 잘 헤아려,\n바르게 완수해내곤 한다.", code: "EA", egoIndex: 42, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 95, text: "맡은 일에 책임을 다하며, 대체로 꼼꼼하게 처리하곤 한다.", readingText: "맡은 일에 책임을 다하며, 대체로 꼼꼼하게 처리하곤 한다.", code: "AA", egoIndex: 48, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 96, text: "다른 사람들과 의견이 다르면,\n그들의 의견과 조언을 먼저 듣고 대체로 수용하는 편이다.", readingText: "다른 사람들과 의견이 다르면,\n그들의 의견과 조언을 먼저 듣고 대체로 수용하는 편이다.", code: "BC", egoIndex: null, okIndex: 31, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 97, text: "나의 결정에 확신이 서지 않아,\n중요한 일을 앞두고 쉽게 불안해하는 편이다.", readingText: "나의 결정에 확신이 서지 않아,\n중요한 일을 앞두고 쉽게 불안해하는 편이다.", code: "EC", egoIndex: null, okIndex: 19, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 98, text: "진행하던 일이 뜻대로 되지 않아도,\n마음을 추스르며 다시 도전하는 편이다.", readingText: "진행하던 일이 뜻대로 되지 않아도,\n마음을 추스르며 다시 도전하는 편이다.", code: "DC", egoIndex: null, okIndex: 40, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 99, text: "새로운 방식을 시도해보거나,\n재미있는 아이디어를 떠올릴 때 즐거움을 느끼곤 한다.", readingText: "새로운 방식을 시도해보거나,\n재미있는 아이디어를 떠올릴 때 즐거움을 느끼곤 한다.", code: "DA", egoIndex: 49, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
];

export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;
