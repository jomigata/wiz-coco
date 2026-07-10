/**
 * 사업자 정보 — 카카오 채널 심사·푸터 표기용
 * 사업자등록증(한국교류분석) 기준
 */
export const BUSINESS_LEGAL = {
  /** 서비스 브랜드명 (사이트·채널명) */
  brandName: 'WizCoCo',
  brandNameKo: '위즈코코',
  /** 사업자등록증 상호 */
  companyName: '한국교류분석',
  representative: '송재화',
  businessRegistrationNumber: '542-22-01072',
  address:
    '경기도 광명시 하안로 237, 806동 803호(하안동, 하안주공)',
  contactEmail: 'support@wizcoco.com',
  contactPhone: '010-5182-5410',
  /**
   * 통신판매업 신고번호 — 미신고 시 null
   * 온라인 정보 제공(심리검사 플랫폼) 위주 서비스는 통신판매업 신고 대상이 아닐 수 있음
   */
  mailOrderReportNumber: null as string | null,
  mailOrderReportNote:
    '본 서비스는 데이터베이스·온라인 정보 제공(심리검사·상담 지원 플랫폼)이며, 통신판매 중개형 쇼핑몰 업종이 아니어서 통신판매업 신고번호가 없습니다.',
  brandRelationNote:
    '「위즈코코(WizCoCo)」는 사업자 「한국교류분석」이 운영하는 심리검사·상담 지원 서비스 브랜드입니다.',
} as const;
