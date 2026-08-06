# WizCoCo Cursor 플러그인 설치 가이드

이 문서는 WizCoCo 개발·운영에 맞춘 **Cursor Marketplace 플러그인** 설치 순서입니다.

> **참고:** MCP 서버 URL은 `.cursor/mcp.json`에 미리 넣어 두었습니다.  
> **플러그인(스킬·PR Canvas 등)** 은 Cursor 채팅에서 `/add-plugin …` 또는 마켓플레이스 **Add to Cursor**로 설치해야 합니다.

---

## 0. 공통 준비

1. Cursor 재시작 (`.cursor/mcp.json` 반영)
2. **Customize** (사이드바) → **Tools & MCP**
3. 아래 서버마다 **Connect** → 브라우저 OAuth 완료  
   - `figma`, `google-drive`, `gmail`, `linear`, `amplitude`
4. Google Drive/Gmail은 [Google Cloud Console](https://console.cloud.google.com)에서 `drivemcp.googleapis.com` API 활성화가 필요할 수 있습니다.

---

## 1단계 — 혼자/소규모 개발 (필수 3종)

채팅 입력창에 **한 줄씩** 붙여 넣고 **Add Plugin**을 누릅니다.

| 순서 | 명령 | 용도 |
|------|------|------|
| 1 | `/add-plugin pr-review-canvas` | 배포 전 PR·diff Canvas 리뷰 |
| 2 | `/add-plugin figma` | UI 스펙 → 코드 (상담코드 폼·목록) |
| 3 | `/add-plugin google-drive` | 검사/상담 문서·FAQ 시트 참조 |

설치 후:

- **Figma:** Tools & MCP → `figma` → **Connect**
- **Google Drive:** Tools & MCP → `google-drive` → **Connect**

---

## 2단계 — 운영·장애 대응 + 분석

| 순서 | 명령 | 용도 |
|------|------|------|
| 4 | `/add-plugin datadog` | Cloud Run·Functions 로그/메트릭 |
| 5 | `/add-plugin amplitude` | 검사 완료율·전환 분석 |

설치 후:

- **Datadog:** 채팅에서 `/ddsetup` 실행 → 조직·도메인 설정
- **Amplitude:** Tools & MCP → `amplitude` → **Connect** (Amplitude 계정)

---

## 3단계 — 업무별 추가 플러그인

### 상담사 업무

| 명령 | 용도 |
|------|------|
| `/add-plugin linear` | 이슈·스프린트 (상담코드 UI 요청 추적) |
| `/add-plugin docs-canvas` | 상담코드→발송→검사 흐름 문서 Canvas |

→ Tools & MCP → `linear` → **Connect**

### 배포·장애

| 명령 | 용도 |
|------|------|
| (2단계 Datadog) | GitHub Actions·Cloud Run 장애 조사 |
| `/add-plugin slack` | CI 실패 알림·채널 요약 (팀 사용 시) |

Slack 설치 후 워크스pace Connect.

### 결제·알림

| 명령 | 용도 |
|------|------|
| `/add-plugin gmail` | 발송/결제/문의 메일 확인 |
| `/add-plugin slack` | Solapi·알림톡 장애 시 팀 공유 (선택) |

→ Tools & MCP → `gmail` → **Connect**

---

## 빠른 설치 (브라우저)

PowerShell (저장소 루트):

```powershell
.\scripts\open-wizcoco-cursor-plugins.ps1
```

또는 마켓플레이스 직접:

- [PR Review Canvas](https://cursor.com/marketplace/cursor/pr-review-canvas)
- [Figma](https://cursor.com/marketplace/figma)
- [Google Drive](https://cursor.com/marketplace/google-drive)
- [Datadog](https://cursor.com/marketplace/datadog)
- [Amplitude](https://cursor.com/marketplace/amplitude)
- [Linear](https://cursor.com/marketplace/linear)
- [Gmail](https://cursor.com/marketplace/gmail)
- [Slack](https://cursor.com/marketplace/slack)
- [Docs Canvas](https://cursor.com/marketplace/cursor/docs-canvas)

---

## WizCoCo에서 자주 쓰는 조합

| 작업 | 추천 도구 |
|------|-----------|
| 상담코드 UI 수정 | Figma + PR Review Canvas |
| 검사 문구/매뉴얼 | Google Drive |
| main 푸시 전 리뷰 | PR Review Canvas |
| 발송 실패 디버깅 | Datadog + Gmail |
| 완료율·퍼널 | Amplitude |
| 기능 요청 관리 | Linear |

---

## 문제 해결

| 증상 | 조치 |
|------|------|
| MCP 서버 Error | Cursor 완전 종료 후 재실행 → Connect 재시도 |
| Datadog 도구 없음 | 채팅에서 `/ddsetup` |
| Google OAuth 실패 | GCP OAuth 동의 화면·redirect `http://localhost:8787/callback` 확인 |
| 플러그인 스킬 안 보임 | Customize → Installed Plugins에서 활성화 확인 |

---

## Datadog 수동 MCP 제거

Datadog **플러그인** 설치 후, 예전에 수동으로 넣은 Datadog MCP가 있으면 **충돌**할 수 있습니다.  
Customize → Tools & MCP에서 중복 Datadog 항목을 제거하세요.
