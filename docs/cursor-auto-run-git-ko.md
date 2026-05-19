# Cursor: Git·GitHub 명령 자동 실행 설정 (WizCoCo)

에이전트가 `git status`, `git commit`, `git push`, `gh` 등을 실행할 때 **Run 버튼·승인 없이** 진행되도록 하는 설정입니다.

## 한 번만 하면 되는 설정 (필수)

### 1) Cursor Auto-Run 모드 (가장 중요)

1. **Cursor 설정** 열기: `Ctrl + Shift + J` (Windows) / `Cmd + Shift + J` (macOS)
2. **Agents** → **Auto-Run**
3. 아래 중 **하나** 선택 (**Ask Every Time 은 사용하지 않음**)
   - **Run in Sandbox** (권장) — 샌드박스 안에서 자동 실행, allowlist 명령은 샌드박스 제한 없이 실행
   - **Run Everything** — 모든 명령 자동 실행 (가장 단순, 보안상 주의)

> **Ask Every Time** 이면 `permissions.json` allowlist가 **적용되지 않습니다**.  
> 이 상태에서는 에이전트가 git을 실행해도 매번 Run 확인 UI가 뜹니다.

### 2) 전역 `permissions.json` (이 PC에 반영됨)

경로: `%USERPROFILE%\.cursor\permissions.json`  
(예: `C:\Users\jomig\.cursor\permissions.json`)

- `terminalAllowlist`에 `git`, `gh`, `npm` 등이 포함되어 있으면, Auto-Run이 켜진 상태에서 해당 명령은 승인 없이 실행됩니다.
- 저장소 예시 파일: [docs/cursor-permissions.json.example](./cursor-permissions.json.example)

Cursor를 **한 번 재시작**하면 파일 변경이 확실히 반영됩니다.

### 3) 샌드박스 네트워크 (`git push`용)

경로 (전역): `%USERPROFILE%\.cursor\sandbox.json`  
경로 (이 저장소): 프로젝트 루트 `.cursor/sandbox.json`  
(예시: [docs/cursor-sandbox.json.example](./cursor-sandbox.json.example) — `.gitignore` 때문에 저장소에는 예시만 포함)

- `git push`는 `github.com` 등으로 네트워크 접속이 필요합니다.
- **Run in Sandbox** 모드에서 push가 막히면, 위 `sandbox.json`의 `networkPolicy.allow`에 GitHub 도메인이 있는지 확인하세요.

## 이미 적용된 VS Code / Git 설정

| 파일 | 내용 |
|------|------|
| `%APPDATA%\Cursor\User\settings.json` | `git.confirmSync: false`, 커밋 전 저장 프롬프트 끔 등 |
| `.vscode/settings.json` | 워크스페이스 `git.confirmSync: false` |

에이전트 터미널 승인과는 별개로, **소스 제어 UI**에서 뜨는 Git 확인 대화상자를 줄이는 설정입니다.

## 동작 확인 방법

1. Auto-Run을 **Run in Sandbox** 또는 **Run Everything**으로 설정
2. Cursor 재시작
3. 채팅에서 에이전트에게 `git status` 실행 요청
4. **Run / Allow 버튼 없이** 터미널에 결과가 바로 나오면 성공

## 문제 해결

| 증상 | 조치 |
|------|------|
| 매번 "Run" / "Allow" 버튼 | Auto-Run이 **Ask Every Time**인지 확인 → Sandbox 또는 Run Everything으로 변경 |
| allowlist를 썼는데도 물어봄 | `permissions.json` 저장 후 Cursor 재시작; 설정 화면에 "configured via permissions.json" 문구 확인 |
| `git push`만 승인 요청 | `sandbox.json`에 `github.com` 허용 추가; 또는 명령을 allowlist에 추가해 샌드박스 밖에서 실행 |
| 회사/팀 정책 | Enterprise 대시보드 Auto-Run이 관리자에 의해 잠겨 있을 수 있음 |

## 저장소 에이전트 규칙

- `.cursor/rules/agent-auto-run.mdc` — Run 클릭 유도 문구 금지
- `.cursor/rules/git-push-after-edit.mdc` — 작업 후 `git push origin HEAD` 실행

에이전트는 위 규칙에 따라 **사용자에게 Run을 요청하지 않고** git 명령을 직접 실행합니다.  
실제로 자동 실행되려면 **이 문서의 1번(Auto-Run 모드)** 이 반드시 필요합니다.

## 참고 링크

- [Cursor permissions.json](https://cursor.com/docs/reference/permissions)
- [Cursor sandbox.json](https://cursor.com/docs/reference/sandbox)
- [Terminal / Auto-Run](https://cursor.com/docs/agent/tools/terminal)
