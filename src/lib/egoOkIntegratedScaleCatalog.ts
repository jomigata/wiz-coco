import type { EgoOkReportTabId } from '@/components/tests/egoOk/egoOkReportTabNav';
import type { CstMajorDef, CstMiddleDef, CstMinorDef } from '@/lib/egoOkCstBridgeCatalog';
import type { EgoOkPersonalityScaleType } from '@/lib/egoOkReportScaleTaxonomy';

function m3(prefix: string, labels: [string, string, string]): CstMinorDef[] {
  return labels.map((label, i) => ({ id: `${prefix}.${i + 1}`, label }));
}

function sm(
  id: string,
  label: string,
  labelEn: string,
  scaleTypes: EgoOkPersonalityScaleType[],
  targetItemCount: number,
  contentFit: number,
  minorLabels: [string, string, string],
): CstMiddleDef {
  const fit: Partial<Record<EgoOkPersonalityScaleType, number>> = {};
  for (const st of scaleTypes) fit[st] = contentFit;
  return {
    id,
    label,
    labelEn,
    kind: 'scale-map',
    scaleTypes,
    targetItemCount,
    contentFit: fit,
    minors: m3(id, minorLabels),
  };
}

function major(
  id: string,
  label: string,
  labelEn: string,
  middles: CstMiddleDef[],
  relatedTabId: EgoOkReportTabId = 'scale-90',
): CstMajorDef {
  return { id, label, labelEn, relatedTabId, middles };
}

/**
 * IIP·MPD·NEO·Station·KDS·IESS·SRI·SCI-II·MindFit·SAED — 이고-오케이 90(+6)문항 근사 매핑.
 * 공식 전용 문항 시트 미연동 · contentFit·targetItemCount는 추정치.
 */
export const EGO_OK_INTEGRATED_EXTRA_MAJORS: CstMajorDef[] = [
  major('10', '대인관계 (IIP)', 'Interpersonal Problems', [
    sm('10.C1', '지배통제', 'Dominance', ['cp_positive'], 6, 0.68, ['통제·지시', '타인 기대', '관계 갈등']),
    sm('10.C2', '자기중심성', 'Self-centered', ['fc_positive', 'i_minus'], 6, 0.62, ['욕구 우선', '타인 무시', '마찰']),
    sm('10.C3', '냉담', 'Cold', ['ac_negative', 'a_negative'], 6, 0.7, ['공감 결여', '정서 거리', '친밀 회피']),
    sm('10.C4', '사회적 억제', 'Social Inhibition', ['ac_positive', 'ac_negative'], 6, 0.72, ['불안', '위축', '회피']),
    sm('10.C5', '비주장성', 'Non-assertive', ['ac_positive', 'np_negative'], 6, 0.65, ['의견 표현', '수동성', '억압']),
    sm('10.C6', '과순응', 'Over-compliant', ['ac_positive', 'np_positive'], 6, 0.74, ['환심', '과잉 맞춤', '자기희생']),
    sm('10.C7', '자기희생', 'Self-sacrifice', ['np_positive', 'ac_positive'], 6, 0.78, ['거절 어려움', '과로', '경계']),
    sm('10.C8', '과관여', 'Over-involvement', ['np_positive', 'u_plus'], 6, 0.66, ['간섭', '조언 과다', '역할 침범']),
    sm('10.PD1', '대인적 과민', 'Hypersensitivity', ['i_minus', 'ac_negative'], 5, 0.64, ['예민', '의심', '상처']),
    sm('10.PD2', '대인적 비수용', 'Non-acceptance', ['u_minus', 'ac_negative'], 5, 0.63, ['거리두기', '고립', '불신']),
    sm('10.PD3', '공격성', 'Aggression', ['cp_negative', 'fc_negative'], 5, 0.71, ['비판', '적대', '분노']),
    sm('10.PD4', '사회적 인정욕구', 'Approval seeking', ['ac_positive', 'u_plus'], 5, 0.67, ['인정', '관심', '과시']),
    sm('10.PD5', '사회적 부적응', 'Social inadequacy', ['i_minus', 'u_minus'], 5, 0.69, ['기술 부족', '불편', '회피']),
  ]),
  major('11', '심리사회성 (MPD)', 'Psychosocial Development', [
    sm('11.R1', '신뢰 vs 불신', 'Trust', ['np_positive', 'u_plus'], 8, 0.58, ['애착', '안전', '불신']),
    sm('11.R2', '자율 vs 수치', 'Autonomy', ['fc_positive', 'cp_positive'], 8, 0.6, ['자기결정', '통제', '수치']),
    sm('11.R3', '주도 vs 죄책', 'Initiative', ['fc_positive', 'np_positive'], 8, 0.59, ['목표', '죄책', '억제']),
    sm('11.R4', '근면 vs 열등', 'Industry', ['a_positive', 'cp_positive'], 8, 0.62, ['유능', '끈기', '열등']),
    sm('11.R5', '정체 vs 혼미', 'Identity', ['a_positive', 'i_plus'], 8, 0.57, ['자아', '역할', '혼란']),
    sm('11.R6', '친밀 vs 고립', 'Intimacy', ['np_positive', 'u_plus'], 8, 0.65, ['애정', '거리', '고립']),
    sm('11.R7', '생산 vs 침체', 'Generativity', ['np_positive', 'u_plus'], 8, 0.58, ['기여', '양육', '침체']),
    sm('11.R8', '통합 vs 절망', 'Integrity', ['a_positive', 'i_plus'], 8, 0.56, ['수용', '후회', '절망']),
  ]),
  major('12', '성격 (NEO)', 'NEO Personality', [
    sm('12.N', '신경증(N)', 'Neuroticism', ['a_negative', 'fc_negative', 'i_minus'], 12, 0.7, ['불안', '적대', '취약']),
    sm('12.E', '외향성(E)', 'Extraversion', ['fc_positive', 'np_positive'], 12, 0.68, ['사회성', '활력', '긍정']),
    sm('12.O', '개방성(O)', 'Openness', ['fc_positive', 'a_positive'], 12, 0.72, ['창의', '개방', '탐색']),
    sm('12.A', '친화성(A)', 'Agreeableness', ['np_positive', 'ac_positive'], 12, 0.75, ['온정', '협력', '배려']),
    sm('12.C', '성실성(C)', 'Conscientiousness', ['cp_positive', 'a_positive'], 12, 0.73, ['책임', '질서', '자기통제']),
    sm('12.S', '사회성(S)', 'Sociality', ['np_positive', 'u_plus', 'a_positive'], 10, 0.66, ['관계', '공감', '소통']),
  ]),
  major('13', '스테이션 (Station)', 'Learning / Station', [
    sm('13.1', '학습·직무 적응', 'Work adaptation', ['a_positive', 'cp_positive'], 8, 0.64, ['목표', '몰입', '완수']),
    sm('13.2', '자기조절·루틴', 'Self-regulation', ['cp_positive', 'ac_positive'], 8, 0.67, ['규율', '지연', '루틴']),
    sm('13.3', '성취·집중', 'Achievement focus', ['cp_positive', 'a_positive', 'fc_positive'], 8, 0.63, ['집중', '성취', '지속']),
  ]),
  major('14', '우울 (KDS)', 'Korean Depression Scale', [
    sm('14.1', '인지·미래', 'Cognitive future', ['i_minus', 'u_minus'], 10, 0.61, ['비관', '무력', '자책']),
    sm('14.2', '정서·불안', 'Emotional', ['fc_negative', 'np_negative'], 10, 0.64, ['우울', '초조', '슬픔']),
    sm('14.3', '신체화', 'Somatic', ['ac_negative', 'fc_negative'], 10, 0.55, ['피로', '수면', '신체']),
    sm('14.4', '의욕상실', 'Motivation loss', ['ac_negative', 'cp_negative'], 10, 0.6, ['무기력', '회피', '집중']),
  ]),
  major('15', '통합스트레스 (IESS)', 'Integrated Stress', [
    sm('15.1', '스트레스 수준', 'Stress level', ['u_minus', 'i_minus', 'a_negative'], 15, 0.67, ['지각', '신체', '불안']),
    sm('15.2', '스트레스 취약', 'Vulnerability', ['ac_negative', 'fc_negative'], 12, 0.62, ['완벽', '억제', '회피']),
    sm('15.3', '생활 스트레스', 'Life events', ['cp_negative', 'u_minus'], 10, 0.58, ['갈등', '부담', '사건']),
  ]),
  major('16', '스트레스 (SRI)', 'Stress Response', [
    sm('16.1', '취약성', 'Vulnerability', ['i_minus', 'u_minus'], 8, 0.65, ['민감', '예민', '불안']),
    sm('16.2', '과소허용·비현실', 'Under-tolerance', ['fc_positive', 'np_positive'], 8, 0.6, ['기대', '회피', '부정']),
    sm('16.3', '인내성', 'Tolerance', ['a_positive', 'cp_positive'], 8, 0.68, ['대처', '지속', '조절']),
    sm('16.4', '과대허용·부인', 'Over-tolerance', ['ac_positive', 'np_positive'], 8, 0.59, ['부인', '과잉', '지연']),
  ]),
  major('17', '자아개념 (SCI-II)', 'Self-Concept', [
    sm('17.1', '인지적 자아', 'Cognitive self', ['a_positive', 'i_plus'], 10, 0.64, ['문제해결', '성격인식', '자신감']),
    sm('17.2', '정서적 자아', 'Emotional self', ['i_plus', 'i_minus'], 10, 0.62, ['도덕', '가치', '정서']),
    sm('17.3', '사회적 자아', 'Social self', ['u_plus', 'np_positive'], 10, 0.7, ['친구', '공동체', '관계']),
    sm('17.4', '신체적 자아', 'Physical self', ['fc_positive', 'ac_positive'], 10, 0.58, ['능력', '외모', '건강']),
  ]),
  major('18', '마인드 (MindFit)', 'MindFit', [
    sm('18.1', '심리적 적응', 'Adaptability', ['np_positive', 'a_positive', 'fc_positive'], 12, 0.63, ['적응', '회복', '균형']),
    sm('18.2', '적응역량', 'Competence', ['cp_positive', 'a_positive', 'u_plus'], 12, 0.65, ['목표', '자존', '관계']),
    sm('18.3', '스트레스·갈등', 'Stress load', ['u_minus', 'cp_negative'], 10, 0.66, ['갈등', '부담', '대처']),
  ]),
  major('19', '정서행동 (SAED)', 'Emotional-Behavioral Problems', [
    sm('19.1', '내재화', 'Internalizing', ['i_minus', 'fc_negative', 'ac_negative'], 12, 0.64, ['불안', '우울', '철수']),
    sm('19.2', '외현화', 'Externalizing', ['cp_negative', 'fc_negative'], 12, 0.67, ['분노', '충동', '대립']),
    sm('19.3', '신체·주의', 'Somatic/Attention', ['ac_negative', 'fc_negative'], 10, 0.6, ['신체', '주의', '활동']),
    sm('19.4', '종합 위험 지수', 'Composite risk', ['a_negative', 'u_minus', 'i_minus'], 15, 0.58, ['종합', '기능', '개입']),
  ]),
];
