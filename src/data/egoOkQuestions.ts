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
  { no: 1, text: "다른 사람을 비난하기보다는, \n칭찬을 더 자주 하는 편이다.", readingText: "다른 사람을 비난하기보다는, \n칭찬을 더 자주 하는 편이다.", code: "BA", egoIndex: 1, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 2, text: "다른 사람들에게 ‘내가 시키는 대로만 하면 된다’는 식으로 \n말하곤 한다.", readingText: "다른 사람들에게 ‘내가 시키는 대로만 하면 된다’는 식으로 \n말하곤 한다.", code: "AB", egoIndex: 2, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 3, text: "나는 나 자신을 좋아하고, \n긍정적으로 생각한다.", readingText: "나는 나 자신을 좋아하고, \n긍정적으로 생각한다.", code: "DC", egoIndex: null, okIndex: 1, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 4, text: "나는 현실에 안주하기보다, \n높은 이상을 추구하는 편이다.", readingText: "나는 현실에 안주하기보다, \n높은 이상을 추구하는 편이다.", code: "AA", egoIndex: 6, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 5, text: "나는 다른 사람의 생각이나 행동 방식이, 나와 다르더라도 \n너그럽게 받아들인다.", readingText: "나는 다른 사람의 생각이나 행동 방식이, 나와 다르더라도 \n너그럽게 받아들인다.", code: "BC", egoIndex: null, okIndex: 8, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 6, text: "나는 감정에 치우치지 않고, 컴퓨터처럼 정확하고, \n빈틈없이 일하는 편이다.", readingText: "나는 감정에 치우치지 않고, 컴퓨터처럼 정확하고, \n빈틈없이 일하는 편이다.", code: "CB", egoIndex: 5, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 7, text: "나는 다른 사람들에게, \n별로 호감을 사지 못한다고 느낀다.", readingText: "나는 다른 사람들에게, \n별로 호감을 사지 못한다고 느낀다.", code: "EC", egoIndex: null, okIndex: 2, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 8, text: "나는 동료들에 비해, 다른 사람을 더 엄격하고, \n까다롭게 평가하는 편이다.", readingText: "나는 동료들에 비해, 다른 사람을 더 엄격하고, \n까다롭게 평가하는 편이다.", code: "AC", egoIndex: null, okIndex: 36, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 9, text: "나는 아이처럼 순수하고, \n천진난만한 구석이 있다.", readingText: "나는 아이처럼 순수하고, \n천진난만한 구석이 있다.", code: "DA", egoIndex: 4, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 10, text: "주변 사람들이 실수하지 않도록, 사소한 부분까지 \n미리 챙겨주는 편이다.", readingText: "주변 사람들이 실수하지 않도록, 사소한 부분까지 \n미리 챙겨주는 편이다.", code: "BB", egoIndex: 7, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 11, text: "나는 태어났을 때, \n가족이나 주변에서 그리 환영받지 못했다고 느낀다.", readingText: "나는 태어났을 때, \n가족이나 주변에서 그리 환영받지 못했다고 느낀다.", code: "EC", egoIndex: null, okIndex: 4, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 12, text: "어떤 상황에서도, \n내 양심과 도덕적 기준에 따라 행동한다.", readingText: "어떤 상황에서도, \n내 양심과 도덕적 기준에 따라 행동한다.", code: "AA", egoIndex: 13, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 13, text: "다른 사람이 자신의 주장을, 당당하고 분명하게 밝히는 것은, \n바람직하다고 생각한다.", readingText: "다른 사람이 자신의 주장을, 당당하고 분명하게 밝히는 것은, \n바람직하다고 생각한다.", code: "BC", egoIndex: null, okIndex: 25, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 14, text: "무슨 일을 하든, \n항상 조심하고 경계하는 편이다.", readingText: "무슨 일을 하든, \n항상 조심하고 경계하는 편이다.", code: "EB", egoIndex: 11, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 15, text: "살면서 단 한 번도, 남의 험담이나 사소한 거짓말을, \n해본 적이 없다.", readingText: "살면서 단 한 번도, 남의 험담이나 사소한 거짓말을, \n해본 적이 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 16, text: "나는 우리 사회에 보탬이 되는, \n유익한 사람이라고 생각한다.", readingText: "나는 우리 사회에 보탬이 되는, \n유익한 사람이라고 생각한다.", code: "DC", egoIndex: null, okIndex: 6, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 17, text: "나는 다른 사람을, \n칭찬하는 일에 인색한 편이다.", readingText: "나는 다른 사람을, \n칭찬하는 일에 인색한 편이다.", code: "AC", egoIndex: null, okIndex: 37, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 18, text: "상대방의 이야기를 귀담아듣고, \n그 마음에 깊이 공감해 주는 편이다.", readingText: "상대방의 이야기를 귀담아듣고, \n그 마음에 깊이 공감해 주는 편이다.", code: "BA", egoIndex: 12, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 19, text: "무슨 일이든 논리보다는, \n내 감정과 기분에 따라 행동한다.", readingText: "무슨 일이든 논리보다는, \n내 감정과 기분에 따라 행동한다.", code: "DB", egoIndex: 8, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 20, text: "나는, 나 자신의 판단이나 능력을, \n별로 신뢰하지 못한다.", readingText: "나는, 나 자신의 판단이나 능력을, \n별로 신뢰하지 못한다.", code: "EC", egoIndex: null, okIndex: 35, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 21, text: "남을 무조건 도와주는 것은, 상대에게 나쁜 버릇만 들이는, \n일이라고 생각해 돕지 않는다.", readingText: "남을 무조건 도와주는 것은, 상대에게 나쁜 버릇만 들이는, \n일이라고 생각해 돕지 않는다.", code: "AC", egoIndex: null, okIndex: 23, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 22, text: "남의 일이 잘 풀리면, \n내 일처럼 진심으로 기뻐해 준다.", readingText: "남의 일이 잘 풀리면, \n내 일처럼 진심으로 기뻐해 준다.", code: "BC", egoIndex: null, okIndex: 28, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 23, text: "어떤 상황에서도, 말과 행동이 침착하고, \n냉정함을 유지하는 편이다.", readingText: "어떤 상황에서도, 말과 행동이 침착하고, \n냉정함을 유지하는 편이다.", code: "CA", egoIndex: 19, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 24, text: "남에게 기대고, 의지하고 싶어 하는 마음이, \n강한 편이다.", readingText: "남에게 기대고, 의지하고 싶어 하는 마음이, \n강한 편이다.", code: "EB", egoIndex: 17, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 25, text: "나는 주변 사람들에게, \n충분히 신뢰받고 있다고 생각한다.", readingText: "나는 주변 사람들에게, \n충분히 신뢰받고 있다고 생각한다.", code: "DC", egoIndex: null, okIndex: 10, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 26, text: "사람은 누구나, 자신만의 의견과 생각을, 자유롭게 \n가질 권리가 있다고 생각한다.", readingText: "사람은 누구나, 자신만의 의견과 생각을, 자유롭게 \n가질 권리가 있다고 생각한다.", code: "BC", egoIndex: null, okIndex: 18, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 27, text: "상대방의 의견보다는, 내 기준과 원칙을 지키는 것이, \n훨씬 중요하다고 생각한다.", readingText: "상대방의 의견보다는, 내 기준과 원칙을 지키는 것이, \n훨씬 중요하다고 생각한다.", code: "AC", egoIndex: null, okIndex: 39, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 28, text: "의견 차이가 생기면, 다른 사람과 원만하게, \n타협을 잘하는 편이다.", readingText: "의견 차이가 생기면, 다른 사람과 원만하게, \n타협을 잘하는 편이다.", code: "EA", egoIndex: 18, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 29, text: "동료가 실수를 하더라도, 질책하기보다는, 먼저 \n따뜻하게 격려해 준다.", readingText: "동료가 실수를 하더라도, 질책하기보다는, 먼저 \n따뜻하게 격려해 준다.", code: "BC", egoIndex: null, okIndex: 34, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 30, text: "주의력을 확인하기 위한 질문입니다. \n‘E. 매우 아니다’ 를 선택하세요.", readingText: "주의력을 확인하기 위한 질문입니다. \n‘E. 매우 아니다’ 를 선택하세요.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 31, text: "남들의 시선이나 입장은 아랑곳하지 않고, \n내가 하고 싶은 대로 행동한다.", readingText: "남들의 시선이나 입장은 아랑곳하지 않고, \n내가 하고 싶은 대로 행동한다.", code: "DB", egoIndex: 16, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 32, text: "내 판단에 자신이 없어서, 다른 사람들이 하는대로, \n무작정 따르는 편이다.", readingText: "내 판단에 자신이 없어서, 다른 사람들이 하는대로, \n무작정 따르는 편이다.", code: "EC", egoIndex: null, okIndex: 22, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 33, text: "새로운 것에 호기심이 많고, \n알고 싶은 것도 많다.", readingText: "새로운 것에 호기심이 많고, \n알고 싶은 것도 많다.", code: "DA", egoIndex: 10, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 34, text: "가정이나 직장에서, 다른 사람들의 일에 지나치게, \n참견하고 간섭하는 편이다.", readingText: "가정이나 직장에서, 다른 사람들의 일에 지나치게, \n참견하고 간섭하는 편이다.", code: "BB", egoIndex: 14, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 35, text: "상대방이 내가 기대한 대로, 행동해주지 않으면, \n몹시 화가 난다.", readingText: "상대방이 내가 기대한 대로, 행동해주지 않으면, \n몹시 화가 난다.", code: "AC", egoIndex: null, okIndex: 15, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 36, text: "다른 사람들과 손발을 맞추어 협력하고, \n협조하는 일을 잘한다.", readingText: "다른 사람들과 손발을 맞추어 협력하고, \n협조하는 일을 잘한다.", code: "EA", egoIndex: 3, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 37, text: "매사에 망설이기보다 주도적이고, \n적극적으로 행동하는 편이다.", readingText: "매사에 망설이기보다 주도적이고, \n적극적으로 행동하는 편이다.", code: "DC", egoIndex: null, okIndex: 11, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 38, text: "매사에 비판적인 시각을 갖고, \n엄격한 기준을 적용하는 편이다.", readingText: "매사에 비판적인 시각을 갖고, \n엄격한 기준을 적용하는 편이다.", code: "AB", egoIndex: 24, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 39, text: "가끔은 나 자신이, 아무런 가치도 없는, \n쓸모없는 존재처럼 느껴진다.", readingText: "가끔은 나 자신이, 아무런 가치도 없는, \n쓸모없는 존재처럼 느껴진다.", code: "EC", egoIndex: null, okIndex: 7, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 40, text: "상대방의 인격을 존중하며, 그의 단점이나 있는 그대로의 모습까지 \n포용한다.", readingText: "상대방의 인격을 존중하며, 그의 단점이나 있는 그대로의 모습까지 \n포용한다.", code: "BC", egoIndex: null, okIndex: 9, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 41, text: "복잡하게 따지기보다는, 번뜩이는 직관과 감각으로, \n상황을 바로 판단하는 편이다.", readingText: "복잡하게 따지기보다는, 번뜩이는 직관과 감각으로, \n상황을 바로 판단하는 편이다.", code: "DA", egoIndex: 27, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 42, text: "주변 사람들에게 재미가 없고, 지나치게 무미건조하다는 \n말을 자주 듣는다.", readingText: "주변 사람들에게 재미가 없고, 지나치게 무미건조하다는 \n말을 자주 듣는다.", code: "CB", egoIndex: 20, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 43, text: "실패할까 봐 두려워서, \n새로운 일에 선뜻 착수하지 못할 때가 많다.", readingText: "실패할까 봐 두려워서, \n새로운 일에 선뜻 착수하지 못할 때가 많다.", code: "EC", egoIndex: null, okIndex: 12, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 44, text: "어떤 장소에서든, 공공의 규칙과 질서를, \n철저히 지키는 편이다.", readingText: "어떤 장소에서든, 공공의 규칙과 질서를, \n철저히 지키는 편이다.", code: "AA", egoIndex: 28, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 45, text: "나는, 내 외모나 겉모습에, \n나름의 매력이 있다고 생각한다.", readingText: "나는, 내 외모나 겉모습에, \n나름의 매력이 있다고 생각한다.", code: "DC", egoIndex: null, okIndex: 21, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 46, text: "남의 일이나 사소한 개인사까지, \n지나치게 신경을 쓰는 편이다.", readingText: "남의 일이나 사소한 개인사까지, \n지나치게 신경을 쓰는 편이다.", code: "BB", egoIndex: 25, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 47, text: "나는 지난 한 달 동안, 단 하루도 음식이나 물을, \n섭취하지 않았다.", readingText: "나는 지난 한 달 동안, 단 하루도 음식이나 물을, \n섭취하지 않았다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 48, text: "내가 내뱉은 말이나, 저지른 행동에 대해, \n곧잘 후회하곤 한다.", readingText: "내가 내뱉은 말이나, 저지른 행동에 대해, \n곧잘 후회하곤 한다.", code: "EC", egoIndex: null, okIndex: 14, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 49, text: "문제를 해결할 때, 사적인 감정을 배제하고, \n객관적인 사실에 입각하여 판단한다.", readingText: "문제를 해결할 때, 사적인 감정을 배제하고, \n객관적인 사실에 입각하여 판단한다.", code: "CA", egoIndex: 22, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 50, text: "마음에 불평불만이 쌓여도, \n겉으로 솔직하게 표현하지 못한다.", readingText: "마음에 불평불만이 쌓여도, \n겉으로 솔직하게 표현하지 못한다.", code: "EB", egoIndex: 29, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 51, text: "나는 어릴 때부터, 소중한 보살핌과 사랑을 받으며, \n자랐다고 생각한다.", readingText: "나는 어릴 때부터, 소중한 보살핌과 사랑을 받으며, \n자랐다고 생각한다.", code: "DC", egoIndex: null, okIndex: 3, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 52, text: "항상 남을 먼저 염려하고, \n배려하는 마음이 크다.", readingText: "항상 남을 먼저 염려하고, \n배려하는 마음이 크다.", code: "BA", egoIndex: 26, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 53, text: "사람들을 내 뜻대로 이끌고, \n지배하려는 성향이 강하다.", readingText: "사람들을 내 뜻대로 이끌고, \n지배하려는 성향이 강하다.", code: "AB", egoIndex: 31, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 54, text: "나는 기본적으로, \n사람들의 선의를 믿는 편이다.", readingText: "나는 기본적으로, \n사람들의 선의를 믿는 편이다.", code: "BC", egoIndex: null, okIndex: 17, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 55, text: "평소 행동이 민첩하고, \n에너지와 활기가 넘치는 편이다.", readingText: "평소 행동이 민첩하고, \n에너지와 활기가 넘치는 편이다.", code: "DA", egoIndex: 38, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 56, text: "대화할 때, 감정적인 반응을 보이지 않고, \n차분하고 이성적으로 말한다.", readingText: "대화할 때, 감정적인 반응을 보이지 않고, \n차분하고 이성적으로 말한다.", code: "CB", egoIndex: 33, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 57, text: "나만의 강점이나, 특정 능력에 대해서는, \n분명한 자신감을 갖고 있다.", readingText: "나만의 강점이나, 특정 능력에 대해서는, \n분명한 자신감을 갖고 있다.", code: "DC", egoIndex: null, okIndex: 24, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 58, text: "어떤 일에서든, 예의범절과 도덕적인 도리를, \n가장 중요하게 여긴다.", readingText: "어떤 일에서든, 예의범절과 도덕적인 도리를, \n가장 중요하게 여긴다.", code: "AA", egoIndex: 34, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 59, text: "남들과 어울리는 것이, 피곤하게 느껴져, \n차라리 혼자 있는 시간을 즐긴다.", readingText: "남들과 어울리는 것이, 피곤하게 느껴져, \n차라리 혼자 있는 시간을 즐긴다.", code: "EC", egoIndex: null, okIndex: 30, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 60, text: "깊이 생각하기보다, 본능과 충동에 이끌려, \n즉흥적으로 행동하는 편이다.", readingText: "깊이 생각하기보다, 본능과 충동에 이끌려, \n즉흥적으로 행동하는 편이다.", code: "DB", egoIndex: 36, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 61, text: "주위에서 참~ 착하고, \n유순하다는 말을 자주 듣는다.", readingText: "주위에서 참~ 착하고, \n유순하다는 말을 자주 듣는다.", code: "EA", egoIndex: 21, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 62, text: "나는, 내 외모나 체형에, \n자신이 없다.", readingText: "나는, 내 외모나 체형에, \n자신이 없다.", code: "EC", egoIndex: null, okIndex: 20, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 63, text: "내 평생 약속 시간에, 단 1분이라도 늦거나, \n어겨본 적이 한 번도 없다.", readingText: "내 평생 약속 시간에, 단 1분이라도 늦거나, \n어겨본 적이 한 번도 없다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_lie", scaleKind: 'validity' },
  { no: 64, text: "상대가 부탁하지 않더라도, 곤란해 보이면 내가 먼저 나서서, \n일을 도와주곤 한다.", readingText: "상대가 부탁하지 않더라도, 곤란해 보이면 내가 먼저 나서서, \n일을 도와주곤 한다.", code: "BB", egoIndex: 30, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 65, text: "나와 생각이 다른 사람을 보면, 마음이 멀어지거나, \n강하게 비판하게 된다.", readingText: "나와 생각이 다른 사람을 보면, 마음이 멀어지거나, \n강하게 비판하게 된다.", code: "AC", egoIndex: null, okIndex: 26, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 66, text: "내 생각이나 주장보다는, 다른 사람들의 의견을, \n순순히 따르는 편이다.", readingText: "내 생각이나 주장보다는, 다른 사람들의 의견을, \n순순히 따르는 편이다.", code: "EA", egoIndex: 35, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 67, text: "어떤 일을 결정할 때, 나에게 생길 손익과 득실을, \n철저하게 따져본다.", readingText: "어떤 일을 결정할 때, 나에게 생길 손익과 득실을, \n철저하게 따져본다.", code: "CB", egoIndex: 9, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 68, text: "다른 사람을 볼 때, 장점보다는 단점이나, \n부족한 점이 먼저 눈에 띈다.", readingText: "다른 사람을 볼 때, 장점보다는 단점이나, \n부족한 점이 먼저 눈에 띈다.", code: "AC", egoIndex: null, okIndex: 16, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 69, text: "후배나 아랫사람을, 따뜻하게 보살피고, 성장할 수 있도록 \n잘 이끌어준다.", readingText: "후배나 아랫사람을, 따뜻하게 보살피고, 성장할 수 있도록 \n잘 이끌어준다.", code: "BA", egoIndex: 23, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 70, text: "의문이나 미심쩍은 점이 생기면, 상대가 누구든 끝까지, \n따져서 짚고 넘어간다.", readingText: "의문이나 미심쩍은 점이 생기면, 상대가 누구든 끝까지, \n따져서 짚고 넘어간다.", code: "CB", egoIndex: 41, okIndex: null, scaleType: "a_negative", scaleKind: 'egogram' },
  { no: 71, text: "후배나 부하 직원은, 마땅히 내 지시와 의견을, \n따라야 한다고 생각한다.", readingText: "후배나 부하 직원은, 마땅히 내 지시와 의견을, \n따라야 한다고 생각한다.", code: "AC", egoIndex: null, okIndex: 32, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 72, text: "항상 현실에 발을 붙이고, 매사에 이성적이고, \n현실적으로 판단한다.", readingText: "항상 현실에 발을 붙이고, 매사에 이성적이고, \n현실적으로 판단한다.", code: "CA", egoIndex: 46, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 73, text: "상식이나 논리에 맞지 않는 일은, 납득할 만한 근거가 없으면, \n결코 받아들이지 않는다.", readingText: "상식이나 논리에 맞지 않는 일은, 납득할 만한 근거가 없으면, \n결코 받아들이지 않는다.", code: "AB", egoIndex: 43, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 74, text: "나는 대부분의 사람들과 원만하고, \n좋은 인간관계를 잘 유지하고 있다.", readingText: "나는 대부분의 사람들과 원만하고, \n좋은 인간관계를 잘 유지하고 있다.", code: "BC", egoIndex: null, okIndex: 27, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 75, text: "상상력이 풍부하고, 창의적인 아이디어를, \n잘 떠올리는 편이다.", readingText: "상상력이 풍부하고, 창의적인 아이디어를, \n잘 떠올리는 편이다.", code: "DA", egoIndex: 49, okIndex: null, scaleType: "fc_positive", scaleKind: 'egogram' },
  { no: 76, text: "남을 온전히 믿지 못하기 때문에, 웬만한 일은, \n내가 직접 해야 안심이 된다.", readingText: "남을 온전히 믿지 못하기 때문에, 웬만한 일은, \n내가 직접 해야 안심이 된다.", code: "AC", egoIndex: null, okIndex: 5, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 77, text: "검사를 잘 하고 있는지 확인하는 질문입니다. \n‘A. 매우 그렇다’ 를 선택해 주세요.", readingText: "검사를 잘 하고 있는지 확인하는 질문입니다. \n‘A. 매우 그렇다’ 를 선택해 주세요.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_imc", scaleKind: 'validity' },
  { no: 78, text: "스스로 알아서 결정을 내리고, 일을 처리하는 독립성이, \n부족한 편이다.", readingText: "스스로 알아서 결정을 내리고, 일을 처리하는 독립성이, \n부족한 편이다.", code: "EB", egoIndex: 39, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 79, text: "사람은 누구나, 자신의 삶과 일에 대해, 스스로 결정할 권리가 \n있다고 생각한다.", readingText: "사람은 누구나, 자신의 삶과 일에 대해, 스스로 결정할 권리가 \n있다고 생각한다.", code: "BC", egoIndex: null, okIndex: 33, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 80, text: "남들이 해내는 일이라면, 나 역시 그만큼은, 충분히 \n해낼 수 있다고 생각한다.", readingText: "남들이 해내는 일이라면, 나 역시 그만큼은, 충분히 \n해낼 수 있다고 생각한다.", code: "DC", egoIndex: null, okIndex: 38, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 81, text: "맡은 일에 대해서는 끝까지, \n책임감을 갖고 성실하게 임한다.", readingText: "맡은 일에 대해서는 끝까지, \n책임감을 갖고 성실하게 임한다.", code: "AA", egoIndex: 48, okIndex: null, scaleType: "cp_positive", scaleKind: 'egogram' },
  { no: 82, text: "상대방이 밉고 원망스러워도, \n그 감정을 겉으로 잘 드러내지 못한다.", readingText: "상대방이 밉고 원망스러워도, \n그 감정을 겉으로 잘 드러내지 못한다.", code: "EB", egoIndex: 47, okIndex: null, scaleType: "ac_negative", scaleKind: 'egogram' },
  { no: 83, text: "사적으로 싫어하는 사람이라도, 필요하다면 \n공적으로 함께 일할 수 있다.", readingText: "사적으로 싫어하는 사람이라도, 필요하다면 \n공적으로 함께 일할 수 있다.", code: "BC", egoIndex: null, okIndex: 31, scaleType: "u_plus", scaleKind: 'okgram' },
  { no: 84, text: "무슨 일이든 충동적으로 시작하기보다, 구체적인 계획을 \n먼저 세운 뒤 행동에 옮긴다.", readingText: "무슨 일이든 충동적으로 시작하기보다, 구체적인 계획을 \n먼저 세운 뒤 행동에 옮긴다.", code: "CA", egoIndex: 37, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 85, text: "다른 사람의 기분이나 처지보다는, 내 감정과 충동대로 \n행동하는 편이다.", readingText: "다른 사람의 기분이나 처지보다는, 내 감정과 충동대로 \n행동하는 편이다.", code: "DB", egoIndex: 32, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 86, text: "화가 나면 상대방을, \n강하게 몰아붙이거나 거칠게 쏘아붙인다.", readingText: "화가 나면 상대방을, \n강하게 몰아붙이거나 거칠게 쏘아붙인다.", code: "AC", egoIndex: null, okIndex: 13, scaleType: "u_minus", scaleKind: 'okgram' },
  { no: 87, text: "상대방을 수단으로 대하지 않고, \n인격적으로 존중하며 대한다.", readingText: "상대방을 수단으로 대하지 않고, \n인격적으로 존중하며 대한다.", code: "BA", egoIndex: 40, okIndex: null, scaleType: "np_positive", scaleKind: 'egogram' },
  { no: 88, text: "상황을 객관적으로 보기보다는, 감정적인 기분에 휩쓸려 \n처리하는 편이다.", readingText: "상황을 객관적으로 보기보다는, 감정적인 기분에 휩쓸려 \n처리하는 편이다.", code: "DB", egoIndex: 44, okIndex: null, scaleType: "fc_negative", scaleKind: 'egogram' },
  { no: 89, text: "스스로 결단을 내리고 결단한 대로, \n밀고 나가는 힘이 부족하다.", readingText: "스스로 결단을 내리고 결단한 대로, \n밀고 나가는 힘이 부족하다.", code: "EC", egoIndex: null, okIndex: 19, scaleType: "i_minus", scaleKind: 'okgram' },
  { no: 90, text: "방바닥에서 정체불명의 큰소리를 자주 듣는다.", readingText: "방바닥에서 정체불명의 큰소리를 자주 듣는다.", code: "VX", egoIndex: null, okIndex: null, scaleType: "validity_infreq", scaleKind: 'validity' },
  { no: 91, text: "감정에 치우치지 않고, 무슨 일이든 합리적이고, \n효율적으로 처리한다.", readingText: "감정에 치우치지 않고, 무슨 일이든 합리적이고, \n효율적으로 처리한다.", code: "CA", egoIndex: 15, okIndex: null, scaleType: "a_positive", scaleKind: 'egogram' },
  { no: 92, text: "성미가 급해서 사소한 일에도, \n불같이 화를 내는 편이다.", readingText: "성미가 급해서 사소한 일에도, \n불같이 화를 내는 편이다.", code: "AB", egoIndex: 50, okIndex: null, scaleType: "cp_negative", scaleKind: 'egogram' },
  { no: 93, text: "어떤 상대 앞에서도 위축되지 않고, 내 생각을 \n편안하고 자연스럽게 말한다.", readingText: "어떤 상대 앞에서도 위축되지 않고, 내 생각을 \n편안하고 자연스럽게 말한다.", code: "DC", egoIndex: null, okIndex: 29, scaleType: "i_plus", scaleKind: 'okgram' },
  { no: 94, text: "매사에 경솔하게 행동하지 않고, \n신중하게 처신하는 편이다.", readingText: "매사에 경솔하게 행동하지 않고, \n신중하게 처신하는 편이다.", code: "EA", egoIndex: 42, okIndex: null, scaleType: "ac_positive", scaleKind: 'egogram' },
  { no: 95, text: "다른 사람의 부탁을 받으면, \n거절하기가 몹시 어렵다.", readingText: "다른 사람의 부탁을 받으면, \n거절하기가 몹시 어렵다.", code: "BB", egoIndex: 45, okIndex: null, scaleType: "np_negative", scaleKind: 'egogram' },
  { no: 96, text: "일이 잘못되어 실패하더라도, \n낙담하지 않고 꿋꿋하게 다시 시작한다.", readingText: "일이 잘못되어 실패하더라도, \n낙담하지 않고 꿋꿋하게 다시 시작한다.", code: "DC", egoIndex: null, okIndex: 40, scaleType: "i_plus", scaleKind: 'okgram' },
];

export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;
