# 로컬 풀스택 개발 (GCP 배포 0회)

개발 중 UI·API·DB 확인은 **localhost + Firebase Emulator** 로 하고,  
**`git push`로 prod 배포**는 기능 마무리·스모크 테스트 때만 하세요 (`AUTO_DEPLOY_ON_PUSH=false` 권장).

## 사전 요구

- **Node.js** 18+ (프로젝트 `engines` 참고)
- **Python** 3.10+ (`python` / `python3`)
- **Java JDK 11+** (Firestore Emulator용 — `java -version` 확인)  
  - Windows 미설치 시: `winget install --id Microsoft.OpenJDK.17 -e` 후 **터미널 재시작**

## 1회 설정

```powershell
npm install
npm run setup:local
```

- `backend/.venv` 생성 및 `requirements.txt` 설치
- `.env.local`, `backend/.env` 템플릿 복사 (이미 있으면 건너뜀)

## 실행 (한 번에)

```powershell
npm run dev
```

| 서비스 | URL |
|--------|-----|
| Next.js UI | http://localhost:3000 |
| Flask API | http://localhost:5000 |
| Health | http://localhost:5000/api/health |
| Emulator UI | http://localhost:4000 |

### Cursor — 프로젝트 열 때 (자동)

워크스페이스를 열면 **자동 작업**이 한 번 실행됩니다 (`.vscode/tasks.json`, `.vscode/settings.json`의 `task.allowAutomaticTasks: on`).

1. **8080 / 4000 / 5000 / 3000** 이 모두 떠 있지 않으면 **`npm run dev`** 를 백그라운드로 시작 (로그: `.firebase/local-dev-server.log`)  
2. Emulator·Flask·Next 준비까지 대기 (최대 4분)  
3. 터미널에 **로컬 스택 상태 표** 출력 (Emulator / `/api/health` / Next URL)  
4. Auth Emulator **테스트 계정 시드** (`dev:seed-auth`, 이미 있으면 건너뜀)  
5. **Simple Browser 탭 3개** (우측 내장 브라우저, `WIZCOCO_DEV_SKIP_BROWSER=1` 이면 생략):
   - http://localhost:3000/
   - http://localhost:3000/admin/counselor-management
   - http://127.0.0.1:4000/auth

처음 폴더를 열 때 Cursor가 **「Allow Automatic Tasks in Folder」** 를 물으면 **Allow** 를 선택하세요.  
수동 실행: `npm run dev:workspace:open`

**Emulator 데이터 유지 (회원·Firestore):**

- 저장 위치: **`.firebase/emulator-data`** (git 제외, PC 로컬 디스크만)
- **`npm run dev` 시작** 시 위 폴더가 있으면 **Auth·Firestore를 import** (이전 회원가입·로그인 계정·문서 복원)
- **실행 중** 약 **2분마다** 자동 export (기본 120초, `DEV_EMULATOR_EXPORT_INTERVAL_SEC`로 변경)
- **Ctrl+C로 dev 종료** 시 `--export-on-exit`으로 한 번 더 저장
- PC **재부팅·강제 종료** 후에도 **마지막 자동 export** 시점까지 데이터 유지 (dev를 다시 `npm run dev`만 실행하면 됨)
- 수동 백업: `npm run dev:emulators:export` (Emulator가 떠 있을 때)

**Simple Browser CLI:** 탭이 안 열리면 Cursor 명령 팔레트 → **Shell Command: Install 'cursor' command in PATH** 실행 후 워크스페이스를 다시 엽니다.

저장하면 Next는 **HMR**로 바로 반영됩니다. Flask는 `FLASK_ENV=development`로 코드 변경 시 재시작합니다.

## 개별 실행

```powershell
npm run dev:emulators   # Auth + Firestore Emulator만
npm run dev:flask       # Emulator가 떠 있어야 함 (8080)
npm run dev:next        # API 5000 떠 있으면 Next만
```

## 환경 요약

| 파일 | 역할 |
|------|------|
| `.env.local` | `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, API URL |
| `backend/.env` | `USE_FIREBASE_EMULATOR=true`, `COST_SAVER_MODE=true` |
| `backend/.env.smtp.local` | **로컬 이메일 실발송** (Git 제외, GitHub Secrets `SMTP_*` 와 동일 값) |

- **Firestore/Auth Emulator**: prod GCP Firestore·Auth **과금·데이터 오염 없음**
- **COST_SAVER_MODE**: Solapi/SMS **실발송 스킵** (이메일 SMTP는 별도 — 아래 참고)
- **나의코드 전달·내담자 추가(코드 발송) 이메일**: `backend/.env.smtp.local`에 SMTP 설정 시 **실제 수신함까지 발송**
  1. `copy backend\.env.smtp.local.example backend\.env.smtp.local`
  2. GitHub → Settings → Secrets → `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` 값을 붙여넣기 (Gmail은 **앱 비밀번호** 16자)
  3. `npm run smtp:local:check` → OK 확인 후 **`npm run dev` 재시작** (Flask)
  4. `http://localhost:5000/api/health` → `"emailConfigured": true`
  5. UI에서 **이메일** 채널 선택(또는 내담자 추가 시 이메일 있는 행) 후 발송
- CORS: `localhost:3000` 허용 (`backend/utils/cors_config.py`)

## Emulator 로그인

처음 설치·export 폴더가 없을 때만 Auth가 **빈 상태**입니다. 한 번 dev로 데이터를 쌓으면 **재시작·재부팅 후에도 import** 됩니다.

```powershell
npm run dev:seed-auth
```

- 기본 비밀번호: `wizcoco1` (`DEV_EMULATOR_PASSWORD`, `.env.local`)
- **관리자** `jomigata@gmail.com`: `.env.local`에 `DEV_EMULATOR_ADMIN_PASSWORD=…` 설정 후 `npm run dev:seed-auth` (기존 Emulator 계정 비밀번호 동기화)
- `jomigata@gmail.com` → 관리자 bootstrap
- `jomigata@naver.com` → 로컬 로그인 테스트 (상담사 role은 별도 등록·승인)

또는:

1. http://localhost:4000 → Authentication에서 테스트 사용자 추가  
2. 또는 앱 **전문가·상담사 등록** UI로 Emulator 계정 생성  
3. `backend/.env`의 `BOOTSTRAP_ADMIN_EMAILS` 이메일이면 상담사/관리자 bootstrap 가능

**주의:** prod(실서비스) 비밀번호는 Emulator에서 통하지 않습니다. 「로그인 정보 기억」에 예전 비밀번호가 남아 있으면 체크 해제 후 다시 입력하세요.

### Cursor 내장 브라우저 / 로그인 기억

- Cursor **내장 브라우저**는 Chrome 확장·1Password/NordPass **자동완성은 지원하지 않습니다** (공식 한계).
- Firebase 로그인 세션은 워크스페이스별로 **localStorage/IndexedDB에 유지**되는 경우가 많습니다. 한 번 로그인하면 재방문 시 로그인 유지될 수 있습니다.
- **로컬 전용**: `/login` 에서 `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` 또는 `localhost` 일 때 **「로그인 정보 기억」** 체크 → 이메일·비밀번호를 `localStorage`에 저장 (Emulator 테스트용, prod 배포 산출물에도 코드는 있으나 prod 호스트에서는 UI 비표시).
- Cursor **앱 자체** 로그인·설정이 재시작마다 풀리면 `%APPDATA%\\Cursor\\argv.json` 에 `"password-store": "basic"` (Windows) — Electron 키링 대신 디스크 저장. **Cursor 완전 종료 후 재실행** 필요. 공유 PC에서는 보안상 비권장.

- 외부 Chrome에서 테스트하려면 http://localhost:3000 을 일반 Chrome으로 열면 **비밀번호 관리자·자동완성** 사용 가능.

## prod 데이터가 꼭 필요할 때 (비용 주의)

`backend/.env`에서:

```env
USE_FIREBASE_EMULATOR=false
FIREBASE_CREDENTIALS_PATH=../Firebase_GitHub/<service-account>.json
```

→ **클라oud Firestore 읽기/쓰기 과금**이 다시 붙습니다. 일상 개발에는 Emulator 권장.

## Emulator → prod 데이터 (TASK-062)

- **금지**: Emulator export / 로컬 JSON을 **prod Firestore에 import**하는 스크립트·수동 작업
- **허용**: prod → backup export (보관만), Postgres Phase 7 착수 전까지 SQL cutover 없음
- 에이전트 규칙: [scale-cost-roadmap-agent-tasks-ko.md](./scale-cost-roadmap-agent-tasks-ko.md) 범위外

## Postgres dual-write (로컬, TASK-071~073)

Docker Desktop + WSL2 필요. **Docker MCP Toolkit(MCP Profiles)은 WizCoCo 필수 아님** — 무시해도 됩니다.

1. `backend/.env` (또는 `.env.local`):
   ```env
   DATABASE_URL=postgresql://wizcoco:wizcoco_local@127.0.0.1:5432/wizcoco_dispatch
   DISPATCH_SQL_DUAL_WRITE=true
   DISPATCH_LIST_SOURCE=firestore
   ```
2. 터미널:
   ```powershell
   npm run postgres:up
   npm run postgres:migrate
   npm run dev
   ```
3. UI에서 상담코드에 **내담자 1명 추가** (Emulator)
4. 확인:
   ```powershell
   docker exec wizcoco-postgres-1 psql -U wizcoco -d wizcoco_dispatch -c "SELECT portal_id, notify_status FROM dispatch_recipients LIMIT 5;"
   ```
5. (선택) Firestore vs SQL parity:
   ```powershell
   cd backend
   python scripts/compare_dispatch_parity.py --assessment-id <id> --counselor-uid <uid>
   ```

**Firestore 인덱스**(ordered pagination, prod): `firebase deploy --only firestore:indexes --project wiz-coco`  
Staging parity: [staging-dispatch-postgres-parity-ko.md](./staging-dispatch-postgres-parity-ko.md)

## prod 배포와 분리

- 개발: **`npm run dev`** 만 사용 → GitHub Actions / Cloud Build / Hosting 배포 **없음**
- 확인: Variable **`AUTO_DEPLOY_ON_PUSH=false`** ([비용 절감 가이드](./gcp-cost-saver-ko.md))
- 배포: 주 1~2회 수동 workflow 또는 오픈 전에만 `true`

## CI·로컬 빌드

- `npm run dev:build` / `npm run build` — 정적 export 검증 (Hosting과 동일 산출물)
- AI **Cloud Functions** 로컬은 `functions/` 참고 (상담 API 대부분은 Flask)
