# Gemini AI 상담 (AiCoCo → WizCoCo 이식)

AiCoCo 프로젝트의 Gemini 기반 AI 상담 기능을 WizCoCo `wiz-coco` Firebase 프로젝트로 이식했습니다.  
AiCoCo 삭제 예정에 따라 **WizCoCo만으로 운영**합니다.

## 아키텍처

| 계층 | 구현 |
|------|------|
| 프론트 | `/ai-mind-assistant/counsel` — Callable Functions 호출 |
| Functions | `startAiSession`, `sendCounselMessage`, `endAiSession`, `syncCounselFaqFromSheet` |
| Firestore | `aiCounselSessions/{id}/messages`, `counselFaqs`, `crisisEvents` |
| AI | Gemini 2.5 Flash-Lite (폴백: Flash, 1.5 Flash) |

## GitHub Secrets (wiz-coco 저장소)

| Secret | 필수 | 설명 |
|--------|------|------|
| `GEMINI_API_KEY` | **권장** | [Google AI Studio](https://aistudio.google.com/) API 키 |
| `COUNSEL_FAQ_SHEET_ID` | 선택 | FAQ Google Sheets 문서 ID |
| `COUNSEL_FAQ_SHEET_GID` | 선택 | 시트 탭 gid (기본 `0`) |

로컬 Secret 설정:

```bash
firebase functions:secrets:set GEMINI_API_KEY --project wiz-coco
```

## 배포 후 확인

1. https://wizcoco.com/ai-mind-assistant/counsel 로그인
2. 메시지 전송 → AI 응답 말풍선 확인
3. 실패 시 [Functions 로그](https://console.firebase.google.com/project/wiz-coco/functions/logs)

## AiCoCo와의 차이

| 항목 | AiCoCo | WizCoCo |
|------|--------|---------|
| Firebase 프로젝트 | `aicoco-5f8e6` | `wiz-coco` |
| 세션 컬렉션 | `sessions` | `aiCounselSessions` |
| 관리자 검증 | Custom token role | Firestore `users/{uid}.role` |
| OAuth/Flask | 없음 | 기존 WizCoCo 유지 |

## FAQ 동기화 (관리자)

관리자 계정으로 Callable `syncCounselFaqFromSheet` 호출 또는 24시간 스케줄러 `scheduledSyncCounselFaq` 사용.
