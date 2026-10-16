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
  { no: 1, text: "다른 사람의 부족한 점보다는 장점을 먼저 찾아,\n따뜻하게 칭찬하고 격려하는 편이다.", readingText: "다른 사람의 부족한 점보다는 장점을 먼저 찾아,\n따뜻하게 칭찬하고 격려하는 편이다.", code: "BA", egoIndex: 1, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 2, text: "매사에 표정이나 감정 변화가 적어서, 사람들에게\n딱딱하고 재미없다는 인상을 주는 편이다.", readingText: "매사에 표정이나 감정 변화가 적어서, 사람들에게\n딱딱하고 재미없다는 인상을 주는 편이다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 3, text: "부족한 면이 있더라도, 나 자신을 있는 그대로 아끼고 긍정적으로 바라본다.", readingText: "부족한 면이 있더라도, 나 자신을 있는 그대로 아끼고 긍정적으로 바라본다.", code: "DC", egoIndex: null, okIndex: 1, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 4, text: "일을 할 때 다른 사람들의 의견보다는, 내 방식대로 밀어붙이는 편이다.", readingText: "일을 할 때 다른 사람들의 의견보다는, 내 방식대로 밀어붙이는 편이다.", code: "AB", egoIndex: 2, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 5, text: "의견이나 살아온 방식이 나와 달라도, ‘틀렸다’고\n단정하지 않고 있는 그대로 인정하는 편이다.", readingText: "의견이나 살아온 방식이 나와 달라도, ‘틀렸다’고\n단정하지 않고 있는 그대로 인정하는 편이다.", code: "BC", egoIndex: null, okIndex: 8, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 6, text: "다른 사람들의 시선을 지나치게 의식해서, 대체로\n행동이 조심스럽고 위축되는 편이다.", readingText: "다른 사람들의 시선을 지나치게 의식해서, 대체로\n행동이 조심스럽고 위축되는 편이다.", code: "EB", egoIndex: 11, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 7, text: "일상 속에서도 때로는 아이처럼 순수하고 천진난만한 모습을 드러내곤 한다.", readingText: "일상 속에서도 때로는 아이처럼 순수하고 천진난만한 모습을 드러내곤 한다.", code: "DA", egoIndex: 4, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 8, text: "스스로 매력이 부족해서, 다른 사람들에게 별로\n호감을 주지 못한다고 느낄 때가 많다.", readingText: "스스로 매력이 부족해서, 다른 사람들에게 별로\n호감을 주지 못한다고 느낄 때가 많다.", code: "EC", egoIndex: null, okIndex: 2, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 9, text: "나에게 주어진 하루는 24시간이며, 오늘이 지나면\n내일이 온다는 것도 잘 인식하고 있다.", readingText: "나에게 주어진 하루는 24시간이며, 오늘이 지나면\n내일이 온다는 것도 잘 인식하고 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 10, text: "다른 사람을 평가할 때, 대체로 엄격하고 까다로운 기준을 두는 편이다.", readingText: "다른 사람을 평가할 때, 대체로 엄격하고 까다로운 기준을 두는 편이다.", code: "AC", egoIndex: null, okIndex: 36, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 11, text: "어떤 상황에서도 말과 행동이 차분하며, 침착하게 이성을 유지하는 편이다.", readingText: "어떤 상황에서도 말과 행동이 차분하며, 침착하게 이성을 유지하는 편이다.", code: "CB", egoIndex: 5, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 12, text: "가족이나 주변 사람들의 작은 일까지도, 나도\n모르게 끼어들어 간섭하는 경향이 있다.", readingText: "가족이나 주변 사람들의 작은 일까지도, 나도\n모르게 끼어들어 간섭하는 경향이 있다.", code: "BB", egoIndex: 7, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 13, text: "나는 내 주위와 사회에 나름대로 보탬이 되는,\n가치 있는 사람이라고 생각한다.", readingText: "나는 내 주위와 사회에 나름대로 보탬이 되는,\n가치 있는 사람이라고 생각한다.", code: "DC", egoIndex: null, okIndex: 6, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 14, text: "상대방의 사소한 잘못이나 실수를 그냥 넘기지 않고,\n분명하게 지적하는 편이다.", readingText: "상대방의 사소한 잘못이나 실수를 그냥 넘기지 않고,\n분명하게 지적하는 편이다.", code: "AB", egoIndex: 24, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 15, text: "몸이 피곤하거나 예민할 때는, 가까운 사람에게\n사소한 일로 짜증이나 투정을 부릴 때가 있다.", readingText: "몸이 피곤하거나 예민할 때는, 가까운 사람에게\n사소한 일로 짜증이나 투정을 부릴 때가 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 16, text: "다른 사람들과 의견 차이가 생기면, 원만하게\n타협하고 맞춰가려고 노력하는 편이다.", readingText: "다른 사람들과 의견 차이가 생기면, 원만하게\n타협하고 맞춰가려고 노력하는 편이다.", code: "EA", egoIndex: 18, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 17, text: "차분하고 깊게 생각하기보다, 그 순간의\n감정과 기분에 이끌려 행동하는 편이다.", readingText: "차분하고 깊게 생각하기보다, 그 순간의\n감정과 기분에 이끌려 행동하는 편이다.", code: "DB", egoIndex: 8, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 18, text: "처음 만나는 사람이라도 거리를 두기보다, 먼저\n열린 마음으로 친절하게 다가가는 편이다.", readingText: "처음 만나는 사람이라도 거리를 두기보다, 먼저\n열린 마음으로 친절하게 다가가는 편이다.", code: "BC", egoIndex: null, okIndex: 25, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 19, text: "주변 사람들로부터 충분한 관심이나 지지를 받지 못해,\n마음 한구석이 늘 허전한 편이다.", readingText: "주변 사람들로부터 충분한 관심이나 지지를 받지 못해,\n마음 한구석이 늘 허전한 편이다.", code: "EC", egoIndex: null, okIndex: 4, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 20, text: "다른 사람의 장점이나 좋은 성과를 앞에 두고도,\n인정이나 칭찬을 하는 것이 쉽지 않은 편이다.", readingText: "다른 사람의 장점이나 좋은 성과를 앞에 두고도,\n인정이나 칭찬을 하는 것이 쉽지 않은 편이다.", code: "AC", egoIndex: null, okIndex: 37, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 21, text: "평소 다른 사람의 입장이나 사정을 먼저 챙기며,\n따뜻하게 배려해 주는 편이다.", readingText: "평소 다른 사람의 입장이나 사정을 먼저 챙기며,\n따뜻하게 배려해 주는 편이다.", code: "BA", egoIndex: 12, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 22, text: "상대방의 마음에 공감해주기보다 사실과 논리만 따지다 보니,\n대화가 대체로 차가워질 때가 많다.", readingText: "상대방의 마음에 공감해주기보다 사실과 논리만 따지다 보니,\n대화가 대체로 차가워질 때가 많다.", code: "CB", egoIndex: 9, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 23, text: "다소 손해를 보거나 유혹이 있더라도, 양심과\n도덕적 기준에 따라 행동하는 편이다.", readingText: "다소 손해를 보거나 유혹이 있더라도, 양심과\n도덕적 기준에 따라 행동하는 편이다.", code: "AA", egoIndex: 6, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 24, text: "어려운 일들은 스스로 해결하기보다, 주변 사람에게\n의지하거나 도움을 받으려는 경향이 있다.", readingText: "어려운 일들은 스스로 해결하기보다, 주변 사람에게\n의지하거나 도움을 받으려는 경향이 있다.", code: "EB", egoIndex: 17, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 25, text: "나를 아는 사람들에게 나름대로 좋은 평가와 신뢰를 받고 있다고 여긴다.", readingText: "나를 아는 사람들에게 나름대로 좋은 평가와 신뢰를 받고 있다고 여긴다.", code: "DC", egoIndex: null, okIndex: 10, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 26, text: "나는 살면서 기쁨이나 분노, 슬픔 같은 감정을\n단 한 번도 경험해 본 적이 없다.", readingText: "나는 살면서 기쁨이나 분노, 슬픔 같은 감정을\n단 한 번도 경험해 본 적이 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 27, text: "주변 사람에게 좋은 일이나 성과가 생기면,\n진심으로 기뻐하고 축하해 주는 편이다.", readingText: "주변 사람에게 좋은 일이나 성과가 생기면,\n진심으로 기뻐하고 축하해 주는 편이다.", code: "BC", egoIndex: null, okIndex: 28, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 28, text: "남들의 시선이나 입장은 아랑곳하지 않고,\n내가 하고 싶은 대로 행동하는 편이다.", readingText: "남들의 시선이나 입장은 아랑곳하지 않고,\n내가 하고 싶은 대로 행동하는 편이다.", code: "DB", egoIndex: 16, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 29, text: "스스로의 능력이나 판단에 확신을 갖지 못하고,\n늘 나 자신을 의심하는 편이다.", readingText: "스스로의 능력이나 판단에 확신을 갖지 못하고,\n늘 나 자신을 의심하는 편이다.", code: "EC", egoIndex: null, okIndex: 35, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 30, text: "누군가 어려운 처지에 놓여도, 대개 본인이 자초한 결과라고 생각하는 편이다.", readingText: "누군가 어려운 처지에 놓여도, 대개 본인이 자초한 결과라고 생각하는 편이다.", code: "AC", egoIndex: null, okIndex: 23, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 31, text: "문제가 생겼을 때 개인적인 감정이나 기분에 치우치지 않고,\n명확한 사실과 근거를 바탕으로 판단하는 편이다.", readingText: "문제가 생겼을 때 개인적인 감정이나 기분에 치우치지 않고,\n명확한 사실과 근거를 바탕으로 판단하는 편이다.", code: "CA", egoIndex: 19, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 32, text: "상대방이 알아서 할 수 있는 일인데도, 나도 모르게\n사소한 것까지 일일이 다 챙겨주는 편이다.", readingText: "상대방이 알아서 할 수 있는 일인데도, 나도 모르게\n사소한 것까지 일일이 다 챙겨주는 편이다.", code: "BB", egoIndex: 14, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 33, text: "새로운 것을 배우고 경험하는 일에 호기심이 많고,\n의욕과 열정이 넘치는 편이다.", readingText: "새로운 것을 배우고 경험하는 일에 호기심이 많고,\n의욕과 열정이 넘치는 편이다.", code: "DA", egoIndex: 10, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 34, text: "사람들과 함께할 때 내가 중심이 되어, 내가\n생각한 방향대로 상황을 풀어나가려는 편이다.", readingText: "사람들과 함께할 때 내가 중심이 되어, 내가\n생각한 방향대로 상황을 풀어나가려는 편이다.", code: "AB", egoIndex: 31, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 35, text: "누구나 실수를 통해 배우며, 더 나은 사람으로\n성장할 잠재력이 있다고 믿는다.", readingText: "누구나 실수를 통해 배우며, 더 나은 사람으로\n성장할 잠재력이 있다고 믿는다.", code: "BC", egoIndex: null, okIndex: 18, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 36, text: "마음속에 불만이나 서운함이 쌓여도, 겉으로 솔직하게\n말하지 못하고 속으로 삭이는 편이다.", readingText: "마음속에 불만이나 서운함이 쌓여도, 겉으로 솔직하게\n말하지 못하고 속으로 삭이는 편이다.", code: "EB", egoIndex: 29, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 37, text: "어떤 일이든 망설이지 않고, 스스로 상황을\n이끌며 적극적으로 행동하는 편이다.", readingText: "어떤 일이든 망설이지 않고, 스스로 상황을\n이끌며 적극적으로 행동하는 편이다.", code: "DC", egoIndex: null, okIndex: 11, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 38, text: "갑작스럽게 큰 소리가 나거나 위험한 상황을 마주하면,\n순간적으로 깜짝 놀라는 편이다.", readingText: "갑작스럽게 큰 소리가 나거나 위험한 상황을 마주하면,\n순간적으로 깜짝 놀라는 편이다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 39, text: "갈등이나 문제가 생기면 원인을 따져보기도 전에, 무조건\n내 잘못으로 생긴 일이라고 느껴지곤 한다.", readingText: "갈등이나 문제가 생기면 원인을 따져보기도 전에, 무조건\n내 잘못으로 생긴 일이라고 느껴지곤 한다.", code: "EC", egoIndex: null, okIndex: 22, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 40, text: "다른 사람의 주장이나 의견을 들으면, 솔직히 깊이가\n없거나 틀렸다는 생각이 먼저 드는 편이다.", readingText: "다른 사람의 주장이나 의견을 들으면, 솔직히 깊이가\n없거나 틀렸다는 생각이 먼저 드는 편이다.", code: "AC", egoIndex: null, okIndex: 39, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 41, text: "사람들과 함께할 때, 서로 호흡을 맞추며 손발을 잘 맞추어 나가는 편이다.", readingText: "사람들과 함께할 때, 서로 호흡을 맞추며 손발을 잘 맞추어 나가는 편이다.", code: "EA", egoIndex: 3, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 42, text: "어떤 일이나 관계를 맺을 때, 나에게 돌아올\n득과 실을 먼저 계산해보는 편이다.", readingText: "어떤 일이나 관계를 맺을 때, 나에게 돌아올\n득과 실을 먼저 계산해보는 편이다.", code: "CB", egoIndex: 33, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 43, text: "상대방의 이야기를 귀담아듣고, 그 마음을 깊이\n헤아리며 받아주고자 노력하는 편이다.", readingText: "상대방의 이야기를 귀담아듣고, 그 마음을 깊이\n헤아리며 받아주고자 노력하는 편이다.", code: "BA", egoIndex: 26, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 44, text: "대체로 공공의 규칙과 질서를 잘 지키며, 원칙에\n맞게 바르게 행동하려 노력하는 편이다.", readingText: "대체로 공공의 규칙과 질서를 잘 지키며, 원칙에\n맞게 바르게 행동하려 노력하는 편이다.", code: "AA", egoIndex: 13, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 45, text: "남들의 기준과 상관없이, 내 외모에는 나만의\n고유한 매력과 개성이 있다고 느낀다.", readingText: "남들의 기준과 상관없이, 내 외모에는 나만의\n고유한 매력과 개성이 있다고 느낀다.", code: "DC", egoIndex: null, okIndex: 21, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 46, text: "차분히 생각하기보다, 순간의 충동에 이끌려 즉흥적으로 행동하곤 한다.", readingText: "차분히 생각하기보다, 순간의 충동에 이끌려 즉흥적으로 행동하곤 한다.", code: "DB", egoIndex: 36, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 47, text: "동료나 주변 사람이 실수를 하더라도, 비난하기보다\n따뜻하게 격려하고 지지해 주는 편이다.", readingText: "동료나 주변 사람이 실수를 하더라도, 비난하기보다\n따뜻하게 격려하고 지지해 주는 편이다.", code: "BC", egoIndex: null, okIndex: 34, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 48, text: "해야 할 일이 밀려 있어도 너무 피곤할 때는, 다\n제쳐두고 마냥 늘어져 있고 싶을 때가 있다.", readingText: "해야 할 일이 밀려 있어도 너무 피곤할 때는, 다\n제쳐두고 마냥 늘어져 있고 싶을 때가 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 49, text: "마음이 힘들거나 지칠 때면, 내가 아무런\n쓸모가 없는 사람처럼 느껴지곤 한다.", readingText: "마음이 힘들거나 지칠 때면, 내가 아무런\n쓸모가 없는 사람처럼 느껴지곤 한다.", code: "EC", egoIndex: null, okIndex: 7, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 50, text: "다른 사람이 한 일이 내 마음에 들지 않으면,\n쉽게 짜증이 나거나 화가 나는 편이다.", readingText: "다른 사람이 한 일이 내 마음에 들지 않으면,\n쉽게 짜증이 나거나 화가 나는 편이다.", code: "AC", egoIndex: null, okIndex: 15, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 51, text: "막연한 생각이나 감정에 사로잡히지 않고,\n현실적이고 이성적으로 판단하는 편이다.", readingText: "막연한 생각이나 감정에 사로잡히지 않고,\n현실적이고 이성적으로 판단하는 편이다.", code: "CA", egoIndex: 22, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 52, text: "다른 사람의 사소한 일이나 문제까지도, 지나치게\n걱정하고 마음을 졸이는 편이다.", readingText: "다른 사람의 사소한 일이나 문제까지도, 지나치게\n걱정하고 마음을 졸이는 편이다.", code: "BB", egoIndex: 25, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 53, text: "복잡하게 생각하기보다, 직감이나 감각으로 상황을 빠르게 파악해 내는 편이다.", readingText: "복잡하게 생각하기보다, 직감이나 감각으로 상황을 빠르게 파악해 내는 편이다.", code: "DA", egoIndex: 27, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 54, text: "내 생각과 방식이 옳다는 확신이 강해서, 다른\n사람도 내 기준을 따르기를 바라는 편이다.", readingText: "내 생각과 방식이 옳다는 확신이 강해서, 다른\n사람도 내 기준을 따르기를 바라는 편이다.", code: "AB", egoIndex: 43, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 55, text: "어릴 때부터 주변의 따뜻한 보살핌과 사랑을 받으며 자란 편이다.", readingText: "어릴 때부터 주변의 따뜻한 보살핌과 사랑을 받으며 자란 편이다.", code: "DC", egoIndex: null, okIndex: 3, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 56, text: "사소한 일도 스스로 결정을 내리지 못하고 망설이다가,\n대체로 남의 의견에 따르곤 한다.", readingText: "사소한 일도 스스로 결정을 내리지 못하고 망설이다가,\n대체로 남의 의견에 따르곤 한다.", code: "EB", egoIndex: 39, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 57, text: "다른 사람의 단점이나 부족한 점도, 있는\n그대로 편견 없이 받아들이는 편이다.", readingText: "다른 사람의 단점이나 부족한 점도, 있는\n그대로 편견 없이 받아들이는 편이다.", code: "BC", egoIndex: null, okIndex: 9, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 58, text: "며칠 동안 잠을 전혀 자지 않아도, 아무런 피로\n없이 완벽한 집중력을 유지할 수 있다.", readingText: "며칠 동안 잠을 전혀 자지 않아도, 아무런 피로\n없이 완벽한 집중력을 유지할 수 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 59, text: "잘못되거나 실패할까 봐 불안해서, 새로운 일에 나서는 것을 주저하는 편이다.", readingText: "잘못되거나 실패할까 봐 불안해서, 새로운 일에 나서는 것을 주저하는 편이다.", code: "EC", egoIndex: null, okIndex: 12, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 60, text: "나와 생각이나 가치관이 다른 사람을 보면,\n이해하기보다 반감이 먼저 드는 편이다.", readingText: "나와 생각이나 가치관이 다른 사람을 보면,\n이해하기보다 반감이 먼저 드는 편이다.", code: "AC", egoIndex: null, okIndex: 26, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 61, text: "주변 사람들로부터 예의 바르고 온화하다는 말을 자주 듣는 편이다.", readingText: "주변 사람들로부터 예의 바르고 온화하다는 말을 자주 듣는 편이다.", code: "EA", egoIndex: 21, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 62, text: "사소한 의문이라도 그냥 넘어가지 못하고, 상대에게 끝까지 따져 묻는 편이다.", readingText: "사소한 의문이라도 그냥 넘어가지 못하고, 상대에게 끝까지 따져 묻는 편이다.", code: "CB", egoIndex: 41, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 63, text: "주변 사람들이나 후배들을 따뜻하게 챙기고,\n잘 성장하도록 힘이 되어주려 하는 편이다.", readingText: "주변 사람들이나 후배들을 따뜻하게 챙기고,\n잘 성장하도록 힘이 되어주려 하는 편이다.", code: "BA", egoIndex: 23, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 64, text: "옳은 일이라고 판단되면, 주저 없이 앞장서서 이끌곤 한다.", readingText: "옳은 일이라고 판단되면, 주저 없이 앞장서서 이끌곤 한다.", code: "AA", egoIndex: 28, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 65, text: "완벽하진 않더라도, 나만의 강점과 능력에는 솔직히 자신감이 있는 편이다.", readingText: "완벽하진 않더라도, 나만의 강점과 능력에는 솔직히 자신감이 있는 편이다.", code: "DC", egoIndex: null, okIndex: 24, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 66, text: "작은 흥미에도 쉽게 일을 시작하지만, 마무리는 대체로 흐지부지되는 편이다.", readingText: "작은 흥미에도 쉽게 일을 시작하지만, 마무리는 대체로 흐지부지되는 편이다.", code: "DB", egoIndex: 32, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 67, text: "사람들은 기본적으로 따뜻한 마음과 양심을 가지고 있다고 믿는 편이다.", readingText: "사람들은 기본적으로 따뜻한 마음과 양심을 가지고 있다고 믿는 편이다.", code: "BC", egoIndex: null, okIndex: 17, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 68, text: "나는 무리하게 일하거나 잠이 부족하면, 몸이 피로해지고 쉬고 싶어진다.", readingText: "나는 무리하게 일하거나 잠이 부족하면, 몸이 피로해지고 쉬고 싶어진다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 69, text: "남들은 신경 쓰지도 않을 사소한 말이나 행동을,\n혼자 끊임없이 되짚어보며 괴로워하는 편이다.", readingText: "남들은 신경 쓰지도 않을 사소한 말이나 행동을,\n혼자 끊임없이 되짚어보며 괴로워하는 편이다.", code: "EC", egoIndex: null, okIndex: 14, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 70, text: "누군가를 대할 때, 그 사람의 장점보다 단점이나\n아쉬운 점이 먼저 보이는 편이다.", readingText: "누군가를 대할 때, 그 사람의 장점보다 단점이나\n아쉬운 점이 먼저 보이는 편이다.", code: "AC", egoIndex: null, okIndex: 16, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 71, text: "일을 시작할 때 즉흥적으로 나서기보다, 구체적인\n계획을 세워 차근차근 실행하는 편이다.", readingText: "일을 시작할 때 즉흥적으로 나서기보다, 구체적인\n계획을 세워 차근차근 실행하는 편이다.", code: "CA", egoIndex: 46, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 72, text: "다른 사람이 부탁하지 않았는데도, 나서서 챙겨주거나 관여하는 편이다.", readingText: "다른 사람이 부탁하지 않았는데도, 나서서 챙겨주거나 관여하는 편이다.", code: "BB", egoIndex: 30, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 73, text: "평소 활기차게 생활하며, 밝고 긍정적인 편이다.", readingText: "평소 활기차게 생활하며, 밝고 긍정적인 편이다.", code: "DA", egoIndex: 38, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 74, text: "다른 사람의 말이나 행동에 대해, 나도 모르게\n비판적인 시선으로 엄격하게 평가하곤 한다.", readingText: "다른 사람의 말이나 행동에 대해, 나도 모르게\n비판적인 시선으로 엄격하게 평가하곤 한다.", code: "AB", egoIndex: 50, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 75, text: "다른 사람들이 해내는 일이라면, 나도 노력하면\n충분히 해낼 수 있다고 믿는 편이다.", readingText: "다른 사람들이 해내는 일이라면, 나도 노력하면\n충분히 해낼 수 있다고 믿는 편이다.", code: "DC", egoIndex: null, okIndex: 38, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 76, text: "부담스러운 부탁을 받아도, 상대방이 실망하거나\n싫어할까 봐 단호하게 거절하지 못하곤 한다.", readingText: "부담스러운 부탁을 받아도, 상대방이 실망하거나\n싫어할까 봐 단호하게 거절하지 못하곤 한다.", code: "EB", egoIndex: 47, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 77, text: "사람들과 편안하게 마음을 나누다 보면, 함께하는\n것만으로도 큰 힘과 활력을 얻는 편이다.", readingText: "사람들과 편안하게 마음을 나누다 보면, 함께하는\n것만으로도 큰 힘과 활력을 얻는 편이다.", code: "BC", egoIndex: null, okIndex: 27, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 78, text: "지금까지 살아오면서, 감기나 두통 같은 사소한\n잔병치레를 단 한 번도 겪어본 적이 없다.", readingText: "지금까지 살아오면서, 감기나 두통 같은 사소한\n잔병치레를 단 한 번도 겪어본 적이 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 79, text: "다른 사람과 나를 비교하다 보면, 내가 뒤처지고 초라하게 느껴지곤 한다.", readingText: "다른 사람과 나를 비교하다 보면, 내가 뒤처지고 초라하게 느껴지곤 한다.", code: "EC", egoIndex: null, okIndex: 30, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 80, text: "사람들은 대개 이기적이고 계산적이어서, 온전히\n믿기는 어렵다고 생각하는 편이다.", readingText: "사람들은 대개 이기적이고 계산적이어서, 온전히\n믿기는 어렵다고 생각하는 편이다.", code: "AC", egoIndex: null, okIndex: 32, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 81, text: "갈등을 만들기보다 다른 사람의 의견을 존중하며, 유연하게 맞춰가는 편이다.", readingText: "갈등을 만들기보다 다른 사람의 의견을 존중하며, 유연하게 맞춰가는 편이다.", code: "EA", egoIndex: 35, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 82, text: "원칙과 효율을 우선시하다 보니, 유연성이 부족하고\n냉정해 보인다는 말을 듣는 편이다.", readingText: "원칙과 효율을 우선시하다 보니, 유연성이 부족하고\n냉정해 보인다는 말을 듣는 편이다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 83, text: "다른 사람이 실수하더라도 다그치기보다, 너그럽게 감싸주고 이해하려는 편이다.", readingText: "다른 사람이 실수하더라도 다그치기보다, 너그럽게 감싸주고 이해하려는 편이다.", code: "BA", egoIndex: 40, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 84, text: "현실의 편안함에 만족하기보다, 높은 이상과\n목표를 향해 계속 노력하는 편이다.", readingText: "현실의 편안함에 만족하기보다, 높은 이상과\n목표를 향해 계속 노력하는 편이다.", code: "AA", egoIndex: 34, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 85, text: "사람들 앞에서도 자신감을 가지고, 내 생각을 당당히 말하려는 편이다.", readingText: "사람들 앞에서도 자신감을 가지고, 내 생각을 당당히 말하려는 편이다.", code: "DC", egoIndex: null, okIndex: 29, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 86, text: "가끔은 조심스러운 자리에서 나도 모르게, 가볍거나\n장난스럽게 행동을 할 때가 있다.", readingText: "가끔은 조심스러운 자리에서 나도 모르게, 가볍거나\n장난스럽게 행동을 할 때가 있다.", code: "DB", egoIndex: 44, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 87, text: "모든 사람은 각자의 생각과 감정을 존중받아야 할 소중한 존재라고 여긴다.", readingText: "모든 사람은 각자의 생각과 감정을 존중받아야 할 소중한 존재라고 여긴다.", code: "BC", egoIndex: null, okIndex: 33, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 88, text: "아무리 가까운 사람이라도, 사소한 말이나 행동에 서운함을 느낄 때가 있다.", readingText: "아무리 가까운 사람이라도, 사소한 말이나 행동에 서운함을 느낄 때가 있다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 89, text: "남들에게 내세울 만한 점이 별로 없다고 느껴져,\n자신이 없고 위축될 때가 자주 있는 편이다.", readingText: "남들에게 내세울 만한 점이 별로 없다고 느껴져,\n자신이 없고 위축될 때가 자주 있는 편이다.", code: "EC", egoIndex: null, okIndex: 20, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 90, text: "남에게 온전히 맡기기가 불안해서, 중요한 일일수록 내가 직접 챙기는 편이다.", readingText: "남에게 온전히 맡기기가 불안해서, 중요한 일일수록 내가 직접 챙기는 편이다.", code: "AC", egoIndex: null, okIndex: 5, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 91, text: "대체로 감정에 치우치기보다, 상황을 객관적이고\n합리적으로 판단하여 일을 처리하는 편이다.", readingText: "대체로 감정에 치우치기보다, 상황을 객관적이고\n합리적으로 판단하여 일을 처리하는 편이다.", code: "CA", egoIndex: 37, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 92, text: "상대가 딱해 보이면 마음이 약해져서, 조금\n무리가 되더라도 부탁을 들어주곤 한다.", readingText: "상대가 딱해 보이면 마음이 약해져서, 조금\n무리가 되더라도 부탁을 들어주곤 한다.", code: "BB", egoIndex: 45, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 93, text: "화가 나면 순간적으로 감정을 조절하지 못하고, 거친 말을 표현하는 편이다.", readingText: "화가 나면 순간적으로 감정을 조절하지 못하고, 거친 말을 표현하는 편이다.", code: "AC", egoIndex: null, okIndex: 13, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 94, text: "모임이나 조직의 방침에 잘 맞추며, 무리 없이 조화롭게 행동하는 편이다.", readingText: "모임이나 조직의 방침에 잘 맞추며, 무리 없이 조화롭게 행동하는 편이다.", code: "EA", egoIndex: 42, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 95, text: "나에게 맡겨진 일에 대해서는, 끝까지 책임을 다해 마무리하는 편이다.", readingText: "나에게 맡겨진 일에 대해서는, 끝까지 책임을 다해 마무리하는 편이다.", code: "AA", egoIndex: 48, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 96, text: "누구를 만나더라도 그 사람의 장점이나 배울 점을 먼저 보려는 편이다.", readingText: "누구를 만나더라도 그 사람의 장점이나 배울 점을 먼저 보려는 편이다.", code: "BC", egoIndex: null, okIndex: 31, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 97, text: "내가 내린 판단과 결정을 확신하기 어려워, 일을\n처리하는 동안 자주 불안감을 느끼는 편이다.", readingText: "내가 내린 판단과 결정을 확신하기 어려워, 일을\n처리하는 동안 자주 불안감을 느끼는 편이다.", code: "EC", egoIndex: null, okIndex: 19, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 98, text: "일이 잘 풀리지 않더라도 금방 낙담하지 않고, 다시 시도해 보려는 편이다.", readingText: "일이 잘 풀리지 않더라도 금방 낙담하지 않고, 다시 시도해 보려는 편이다.", code: "DC", egoIndex: null, okIndex: 40, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 99, text: "호기심과 상상력이 풍부해서, 엉뚱하거나\n새로운 아이디어를 잘 떠올리는 편이다.", readingText: "호기심과 상상력이 풍부해서, 엉뚱하거나\n새로운 아이디어를 잘 떠올리는 편이다.", code: "DA", egoIndex: 49, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
];

export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;
