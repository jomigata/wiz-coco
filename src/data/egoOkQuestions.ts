/**
 * TA 이고-오케이그램 검사 문항 (96, 타당도 6문항 분산).
 * Generated from docs/internal-materials/ego-ok/items-96.json
 * Bank id: ego-ok-96 — do not edit by hand; run: npm run sync:ego-ok-questions
 */

export const EGO_OK_ITEM_BANK_ID = 'ego-ok-96' as const;

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
  { no: 1, text: "다른사람을 비난하기 보다는, 칭찬을 잘 하는 편이다.", readingText: "다른사람을 비난하기 보다는, 칭찬을 잘 하는 편이다.", code: "BA", egoIndex: 1, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 2, text: "\"내가 시키는 대로 하면 된다.\"는 식으로 말한다.", readingText: "\"내가 시키는 대로 하면 된다.\"는 식으로 말한다.", code: "AB", egoIndex: 2, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 3, text: "나는 나 자신을 좋아한다.", readingText: "나는 나 자신을 좋아한다.", code: "DC", egoIndex: null, okIndex: 1, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 4, text: "이상을 추구하는 편이다.", readingText: "이상을 추구하는 편이다.", code: "AA", egoIndex: 6, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 5, text: "나는, 다른 사람의 사고나 행동방식이 나와 달라도, 대체로 수용한다.", readingText: "나는, 다른 사람의 사고나 행동방식이 나와 달라도, 대체로 수용한다.", code: "BC", egoIndex: null, okIndex: 8, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 6, text: "컴퓨터처럼 정확한 사람이다.", readingText: "컴퓨터처럼 정확한 사람이다.", code: "CB", egoIndex: 5, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 7, text: "나는, 다른사람으로부터 호감을 얻지 못하는 사람이다.", readingText: "나는, 다른사람으로부터 호감을 얻지 못하는 사람이다.", code: "EC", egoIndex: null, okIndex: 2, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 8, text: "동료에 비해 나의, 타인에 대한 평가는 엄격하다.", readingText: "동료에 비해 나의, 타인에 대한 평가는 엄격하다.", code: "AC", egoIndex: null, okIndex: 36, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 9, text: "천진난만한 편이다.", readingText: "천진난만한 편이다.", code: "DA", egoIndex: 4, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 10, text: "주변 사람들이 실수하지 않도록, 사소한 부분까지 챙겨주는 편이다.", readingText: "주변 사람들이 실수하지 않도록, 사소한 부분까지 챙겨주는 편이다.", code: "BB", egoIndex: 7, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 11, text: "나의 탄생은 그다지 환영받지 못했다고 생각한다.", readingText: "나의 탄생은 그다지 환영받지 못했다고 생각한다.", code: "EC", egoIndex: null, okIndex: 4, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 12, text: "좋은 일이나 나쁜 일이나 양심에 따라 행동한다.", readingText: "좋은 일이나 나쁜 일이나 양심에 따라 행동한다.", code: "AA", egoIndex: 13, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 13, text: "나는, 다른사람이 자기주장을 강력하게 하는 것은 좋은것이라고 생각한다.", readingText: "나는, 다른사람이 자기주장을 강력하게 하는 것은 좋은것이라고 생각한다.", code: "BC", egoIndex: null, okIndex: 25, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 14, text: "무슨일이든 항상 조심하는 경향이 있다.", readingText: "무슨일이든 항상 조심하는 경향이 있다.", code: "EB", egoIndex: 11, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 15, text: "살면서 단 한 번도 남의 험담이나 사소한 거짓말을 해본 적이 없다.", readingText: "살면서 단 한 번도 남의 험담이나 사소한 거짓말을 해본 적이 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 16, text: "나는, 지금의 사회에서 유익한 사람이라고 생각한다.", readingText: "나는, 지금의 사회에서 유익한 사람이라고 생각한다.", code: "DC", egoIndex: null, okIndex: 6, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 17, text: "나는, 그다지 다른 사람을 칭찬하지 않는 편이다.", readingText: "나는, 그다지 다른 사람을 칭찬하지 않는 편이다.", code: "AC", egoIndex: null, okIndex: 37, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 18, text: "상대의 이야기를 경청하고 공감을 잘 한다.", readingText: "상대의 이야기를 경청하고 공감을 잘 한다.", code: "BA", egoIndex: 12, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 19, text: "무슨일이나 나의, 감정대로 행동한다.", readingText: "무슨일이나 나의, 감정대로 행동한다.", code: "DB", egoIndex: 8, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 20, text: "나는, 나 자신을 그다지 신뢰 할 수가 없다.", readingText: "나는, 나 자신을 그다지 신뢰 할 수가 없다.", code: "EC", egoIndex: null, okIndex: 35, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 21, text: "나는, 다른사람을 돕는 일은 그들에게 나쁜 버릇을 키우게 하므로, 하지 않는다.", readingText: "나는, 다른사람을 돕는 일은 그들에게 나쁜 버릇을 키우게 하므로, 하지 않는다.", code: "AC", egoIndex: null, okIndex: 23, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 22, text: "나는, 남의 일이 잘 되면 나도 기뻐해 준다.", readingText: "나는, 남의 일이 잘 되면 나도 기뻐해 준다.", code: "BC", egoIndex: null, okIndex: 28, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 23, text: "말이나 행동이 침착하고 냉정하다.", readingText: "말이나 행동이 침착하고 냉정하다.", code: "CA", egoIndex: 19, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 24, text: "남에게 기대고 싶어하는 의존심이 강하다.", readingText: "남에게 기대고 싶어하는 의존심이 강하다.", code: "EB", egoIndex: 17, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 25, text: "나는, 다른 사람으로부터 신뢰받는 사람이라고 생각하고 있다.", readingText: "나는, 다른 사람으로부터 신뢰받는 사람이라고 생각하고 있다.", code: "DC", egoIndex: null, okIndex: 10, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 26, text: "나는, 모든 다른사람도 자신의 의견이나 생각을 가질 권리가 있다고 생각한다.", readingText: "나는, 모든 다른사람도 자신의 의견이나 생각을 가질 권리가 있다고 생각한다.", code: "BC", egoIndex: null, okIndex: 18, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 27, text: "나의 기준이나 원칙이 상대의 의견이나 그 무엇보다 중요하다고 생각한다.", readingText: "나의 기준이나 원칙이 상대의 의견이나 그 무엇보다 중요하다고 생각한다.", code: "AC", egoIndex: null, okIndex: 39, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 28, text: "다른사람과 타협을 잘 한다.", readingText: "다른사람과 타협을 잘 한다.", code: "EA", egoIndex: 18, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 29, text: "동료가 실패하더라도, 질책하기보다, 먼저 격려하려고 노력한다.", readingText: "동료가 실패하더라도, 질책하기보다, 먼저 격려하려고 노력한다.", code: "BC", egoIndex: null, okIndex: 34, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 30, text: "이 문항은 주의력을 확인하기 위한 질문으로,\n「(E) 매우 아니다」를 선택합니다.", readingText: "이 문항은 주의력을 확인하기 위한 질문으로,\n「(E) 매우 아니다」를 선택합니다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 31, text: "남의 일에는 아랑곳하지 않고, 내가 하고싶은대로 행동한다.", readingText: "남의 일에는 아랑곳하지 않고, 내가 하고싶은대로 행동한다.", code: "DB", egoIndex: 16, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 32, text: "나는, 내 판단에 자신이 없어 다른 사람들이 하는 대로 따르는 편이다.", readingText: "나는, 내 판단에 자신이 없어 다른 사람들이 하는 대로 따르는 편이다.", code: "EC", egoIndex: null, okIndex: 22, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 33, text: "호기심이 많다.", readingText: "호기심이 많다.", code: "DA", egoIndex: 10, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 34, text: "집안에서나 직장에서 지나치게 간섭한다.", readingText: "집안에서나 직장에서 지나치게 간섭한다.", code: "BB", egoIndex: 14, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 35, text: "나는, 상대가 내가 기대한 대로 해주지 않으면 매우 화가 난다.", readingText: "나는, 상대가 내가 기대한 대로 해주지 않으면 매우 화가 난다.", code: "AC", egoIndex: null, okIndex: 15, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 36, text: "다른사람과 협조를 잘 한다.", readingText: "다른사람과 협조를 잘 한다.", code: "EA", egoIndex: 3, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 37, text: "나는 적극적으로 행동을 취하는 편이다.", readingText: "나는 적극적으로 행동을 취하는 편이다.", code: "DC", egoIndex: null, okIndex: 11, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 38, text: "모든일에 비판적이고 엄격하다.", readingText: "모든일에 비판적이고 엄격하다.", code: "AB", egoIndex: 24, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 39, text: "나는, 나 자신을 쓸모없는 사람이라고 생각하는 경우가 있다.", readingText: "나는, 나 자신을 쓸모없는 사람이라고 생각하는 경우가 있다.", code: "EC", egoIndex: null, okIndex: 7, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 40, text: "나는, 상대의 인격을 존중하고 그의 기본까지도 수용한다.", readingText: "나는, 상대의 인격을 존중하고 그의 기본까지도 수용한다.", code: "BC", egoIndex: null, okIndex: 9, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 41, text: "감각적이고 직관이 강하다. (경험, 연상, 추리를 하지 않고, 직접적으로 바로 판단함.)", readingText: "감각적이고 직관이 강하다. (경험, 연상, 추리를 하지 않고, 직접적으로 바로 판단함.)", code: "DA", egoIndex: 27, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 42, text: "다른 사람으로부터 재미가 없고 무미건조하다는 말을 자주 듣는다.", readingText: "다른 사람으로부터 재미가 없고 무미건조하다는 말을 자주 듣는다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 43, text: "나는, 실패가 두려워서 일에 선뜻 손을 대지 못할 때가 있다.", readingText: "나는, 실패가 두려워서 일에 선뜻 손을 대지 못할 때가 있다.", code: "EC", egoIndex: null, okIndex: 12, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 44, text: "어디에서나 질서를 잘 지키는 편이다.", readingText: "어디에서나 질서를 잘 지키는 편이다.", code: "AA", egoIndex: 28, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 45, text: "나는, 내자신의 얼굴이나 모습에 매력이 있다고 생각한다.", readingText: "나는, 내자신의 얼굴이나 모습에 매력이 있다고 생각한다.", code: "DC", egoIndex: null, okIndex: 21, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 46, text: "다른사람의 문제에 지나치게 관심이 많다.", readingText: "다른사람의 문제에 지나치게 관심이 많다.", code: "BB", egoIndex: 25, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 47, text: "나는, 지난 한 달 동안 단 하루도 음식이나 물을 섭취하지 않았다.", readingText: "나는, 지난 한 달 동안 단 하루도 음식이나 물을 섭취하지 않았다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 48, text: "나는, 내자신이 한 말과 행동에 대해 곧잘 후회한다.", readingText: "나는, 내자신이 한 말과 행동에 대해 곧잘 후회한다.", code: "EC", egoIndex: null, okIndex: 14, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 49, text: "문제를 다룰 때, 감정을 배제하고 제3자의 객관적 사실에 근거하여 판단한다.", readingText: "문제를 다룰 때, 감정을 배제하고 제3자의 객관적 사실에 근거하여 판단한다.", code: "CA", egoIndex: 22, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 50, text: "불평불만이 있어도 잘 표현하지 못한다.", readingText: "불평불만이 있어도 잘 표현하지 못한다.", code: "EB", egoIndex: 29, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 51, text: "나는, 태어나서부터 소중하게 길러졌다고 생각한다.", readingText: "나는, 태어나서부터 소중하게 길러졌다고 생각한다.", code: "DC", egoIndex: null, okIndex: 3, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 52, text: "남을 걱정하거나 배려하는 편이다.", readingText: "남을 걱정하거나 배려하는 편이다.", code: "BA", egoIndex: 26, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 53, text: "다른 사람을 지배하려는 경향이 강하다.", readingText: "다른 사람을 지배하려는 경향이 강하다.", code: "AB", egoIndex: 31, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 54, text: "나는 기본적으로 다른 사람을 믿는다.", readingText: "나는 기본적으로 다른 사람을 믿는다.", code: "BC", egoIndex: null, okIndex: 17, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 55, text: "나의 행동은 민첩하고 활발하다.", readingText: "나의 행동은 민첩하고 활발하다.", code: "DA", egoIndex: 38, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 56, text: "대화할 때는, 감정을 나타내지 않고, 냉정하게 말한다.", readingText: "대화할 때는, 감정을 나타내지 않고, 냉정하게 말한다.", code: "CB", egoIndex: 33, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 57, text: "나는, 나의 능력중 어떤것에는 자신감을 갖고 있다.", readingText: "나는, 나의 능력중 어떤것에는 자신감을 갖고 있다.", code: "DC", egoIndex: null, okIndex: 24, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 58, text: "무엇보다 예절이나 도덕을 중요시 한다.", readingText: "무엇보다 예절이나 도덕을 중요시 한다.", code: "AA", egoIndex: 34, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 59, text: "나는, 남과 어울리는 것이 불편스럽고 고독을 즐긴다.", readingText: "나는, 남과 어울리는 것이 불편스럽고 고독을 즐긴다.", code: "EC", egoIndex: null, okIndex: 30, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 60, text: "본능에 따르거나 충동적으로 행동하는 편이다.", readingText: "본능에 따르거나 충동적으로 행동하는 편이다.", code: "DB", egoIndex: 36, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 61, text: "착한 사람이라는 말을 자주 듣는다.", readingText: "착한 사람이라는 말을 자주 듣는다.", code: "EA", egoIndex: 21, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 62, text: "나는 나의, 용모에 자신이 없다.", readingText: "나는 나의, 용모에 자신이 없다.", code: "EC", egoIndex: null, okIndex: 20, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 63, text: "약속 시간에 단 1분이라도 늦거나 어겨본 적이 평생 한 번도 없다.", readingText: "약속 시간에 단 1분이라도 늦거나 어겨본 적이 평생 한 번도 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 64, text: "상대가 부탁하지 않더라도 내가 먼저, 나서서 일을 대신해 주곤 한다.", readingText: "상대가 부탁하지 않더라도 내가 먼저, 나서서 일을 대신해 주곤 한다.", code: "BB", egoIndex: 30, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 65, text: "나는, 생각이 나와 다른 사람은 멀리하거나 거부하거나 강력히 비난한다.", readingText: "나는, 생각이 나와 다른 사람은 멀리하거나 거부하거나 강력히 비난한다.", code: "AC", egoIndex: null, okIndex: 26, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 66, text: "나의 의견보다는 다른 사람의 의견을 따른는 편이다.", readingText: "나의 의견보다는 다른 사람의 의견을 따른는 편이다.", code: "EA", egoIndex: 35, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 67, text: "무슨일을 하든 타산적으로 생각한다. (이익과 손해관계의 득실을 따지는것)", readingText: "무슨일을 하든 타산적으로 생각한다. (이익과 손해관계의 득실을 따지는것)", code: "CB", egoIndex: 9, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 68, text: "나는, 다른 사람의 장점보다 단점을 지적하는 편이다.", readingText: "나는, 다른 사람의 장점보다 단점을 지적하는 편이다.", code: "AC", egoIndex: null, okIndex: 16, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 69, text: "아랫사람을 보호하며 육성한다.", readingText: "아랫사람을 보호하며 육성한다.", code: "BA", egoIndex: 23, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 70, text: "의문점이 생기면 상대가 누구이든 따지고 밝힌다.", readingText: "의문점이 생기면 상대가 누구이든 따지고 밝힌다.", code: "CB", egoIndex: 41, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 71, text: "나는, 후배나 부하가 나를 따라야 하는 것이 당연한 것이라고 생각한다.", readingText: "나는, 후배나 부하가 나를 따라야 하는 것이 당연한 것이라고 생각한다.", code: "AC", egoIndex: null, okIndex: 32, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 72, text: "모든일에 이성적이고 현실에 충실하다.", readingText: "모든일에 이성적이고 현실에 충실하다.", code: "CA", egoIndex: 46, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 73, text: "원칙이나 논리에 맞지 않는 일은 납득할 만한 이유가 없으면 받아들이지 않는다.", readingText: "원칙이나 논리에 맞지 않는 일은 납득할 만한 이유가 없으면 받아들이지 않는다.", code: "AB", egoIndex: 43, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 74, text: "나는, 대부분의 사람들과의 관계를 훌륭하게 해 가고 있다.", readingText: "나는, 대부분의 사람들과의 관계를 훌륭하게 해 가고 있다.", code: "BC", egoIndex: null, okIndex: 27, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 75, text: "창조성이 풍부하다.", readingText: "창조성이 풍부하다.", code: "DA", egoIndex: 49, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 76, text: "나는, 근본적으로 남을 믿지 못하고 스스로 한다.", readingText: "나는, 근본적으로 남을 믿지 못하고 스스로 한다.", code: "AC", egoIndex: null, okIndex: 5, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 77, text: "검사에 성실히 참여하고 있는지, 확인하는 문항으로,\n「(A) 매우 그렇다」를 선택합니다.", readingText: "검사에 성실히 참여하고 있는지, 확인하는 문항으로,\n「(A) 매우 그렇다」를 선택합니다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 78, text: "스스로 일을 처리하는 자주성이 부족한 편이다.", readingText: "스스로 일을 처리하는 자주성이 부족한 편이다.", code: "EB", egoIndex: 39, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 79, text: "사람들은 누구나 스스로 의사결정을 할 권리가 있다고 생각한다.", readingText: "사람들은 누구나 스스로 의사결정을 할 권리가 있다고 생각한다.", code: "BC", egoIndex: null, okIndex: 33, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 80, text: "나는, 대개 다른 사람이 하는 만큼은 할 수 있다.", readingText: "나는, 대개 다른 사람이 하는 만큼은 할 수 있다.", code: "DC", egoIndex: null, okIndex: 38, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 81, text: "오든일에 책임감을 갖고 일을 한다.", readingText: "오든일에 책임감을 갖고 일을 한다.", code: "AA", egoIndex: 48, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 82, text: "상대가 미워도 잘 표현하지 못한다.", readingText: "상대가 미워도 잘 표현하지 못한다.", code: "EB", egoIndex: 47, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 83, text: "나는, 비록 싫어하는 사람일지라도 함께 일을 할수 있다고 생각한다.", readingText: "나는, 비록 싫어하는 사람일지라도 함께 일을 할수 있다고 생각한다.", code: "BC", egoIndex: null, okIndex: 31, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 84, text: "일을 할 때, 계획을 먼저, 세우고 실행에 옮긴다.", readingText: "일을 할 때, 계획을 먼저, 세우고 실행에 옮긴다.", code: "CA", egoIndex: 37, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 85, text: "다른사람의 감정보다는 내 감정대로 행동한다.", readingText: "다른사람의 감정보다는 내 감정대로 행동한다.", code: "DB", egoIndex: 32, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 86, text: "화가 나면 상대방을 강하게 몰아붙이거나 거칠게 질책한다.", readingText: "화가 나면 상대방을 강하게 몰아붙이거나 거칠게 질책한다.", code: "AC", egoIndex: null, okIndex: 13, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 87, text: "상대를 존중하며 인간적으로 대한다.", readingText: "상대를 존중하며 인간적으로 대한다.", code: "BA", egoIndex: 40, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 88, text: "말이나 행동을 감정적으로 처리하는 편이다.", readingText: "말이나 행동을 감정적으로 처리하는 편이다.", code: "DB", egoIndex: 44, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 89, text: "나는, 내자신이 결단하여 행동하는 것이 잘 되지 않는다.", readingText: "나는, 내자신이 결단하여 행동하는 것이 잘 되지 않는다.", code: "EC", egoIndex: null, okIndex: 19, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 90, text: "가끔 벽이나 바닥에서 정체불명의 악마 목소리가 선명하게 들린다.", readingText: "가끔 벽이나 바닥에서 정체불명의 악마 목소리가 선명하게 들린다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 91, text: "무슨일이든 합리적으로 처리한다.", readingText: "무슨일이든 합리적으로 처리한다.", code: "CA", egoIndex: 15, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 92, text: "성미가 급하고 화를 잘 내는 편이다.", readingText: "성미가 급하고 화를 잘 내는 편이다.", code: "AB", egoIndex: 50, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 93, text: "나는, 누구 앞에서도 자유롭고 자연스럽게 말한다.", readingText: "나는, 누구 앞에서도 자유롭고 자연스럽게 말한다.", code: "DC", egoIndex: null, okIndex: 29, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 94, text: "모든일에 신중하다.", readingText: "모든일에 신중하다.", code: "EA", egoIndex: 42, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 95, text: "다른사람의 부탁을 받으면 거절하지 못한다.", readingText: "다른사람의 부탁을 받으면 거절하지 못한다.", code: "BB", egoIndex: 45, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 96, text: "나는, 일이 잘못되어 실패를 해도, 좌절하지 않고, 다시 시작한다.", readingText: "나는, 일이 잘못되어 실패를 해도, 좌절하지 않고, 다시 시작한다.", code: "DC", egoIndex: null, okIndex: 40, scaleType: "i_plus", scaleKind: 'okgram' },
];

export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;
