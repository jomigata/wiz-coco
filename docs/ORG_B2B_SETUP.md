# B2B 기관 (3단계) 설정

## 역할

| 역할 | 설명 |
|------|------|
| `org_admin` | 학교·기업 담당자 — cohort 발송·그룹 리포트 |
| `liaisonCounselorUid` | 검사코드 법적 소유 상담사 (assessments.counselorId) |

Admin이 `/admin/organizations/`에서 기관 생성 시 `org_admin` 역할과 `organizationId`가 사용자 문서에 설정됩니다.

## API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/org/me` | 기관 정보·크레딧·cohort 목록 |
| GET | `/api/org/dashboard` | 대시보드 요약 |
| POST | `/api/org/bulk` | 선결제 일괄 발송 (org 크레딧 차감) |
| GET | `/api/org/cohorts/{id}/group-report` | 익명 그룹 통계 |
| GET | `/api/admin/organizations` | Admin 기관 목록 |
| POST | `/api/admin/organizations` | 기관 생성 |
| POST | `/api/admin/organizations/{id}/grant-credits` | 선결제 크레딧 |

## Firestore (Admin SDK 전용)

- `organizations`
- `orgCredits` / `orgCreditLedger`
- `assessments.organizationId`, `clientPortals.organizationId`, `prepaidByOrg`

## POC 체크리스트

- [ ] liaison 상담사 UID 확보
- [ ] 기관 생성 + 크레딧 30+
- [ ] org_admin 계정 배정
- [ ] 1개 학급 cohort 발송
- [ ] 그룹 리포트 PDF 확인
