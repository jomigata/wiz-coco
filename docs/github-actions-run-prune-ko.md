# GitHub Actions 실행 기록 정리

저장소 push마다 CI·배포 등 여러 워크플로가 돌면 **Actions** 목록이 수백~수천 건까지 쌓일 수 있습니다. GitHub UI에는 **일괄 삭제**가 없어 스크립트·워크플로로 정리합니다.

## 자동 (권장)

워크플로 **🧹 Prune Actions runs** (`prune-actions-runs.yml`)

| 실행 방법 | 보존 규칙 |
|-----------|-----------|
| **매일 03:15 KST** (스케줄) | 워크플로마다 최신 **3건** (`workflow`, keep=3) |
| **Run workflow** (수동) | 저장소 전체 최신 **5건** (`global`, keep=5) — All workflows 목록을 대략 **5개** 수준으로 |

수동 실행: [Actions → 🧹 Prune Actions runs → Run workflow](https://github.com/jomigata/wiz-coco/actions/workflows/prune-actions-runs.yml)

수동 Run에서 **mode=workflow**, **keep=3** 으로 바꾸면 스케줄과 동일하게 돌릴 수 있습니다.

## 로컬 한 번에 정리

```bash
# 스케줄과 동일 (워크플로별 3건)
node scripts/prune-github-actions-runs.mjs --keep=3 --mode=workflow

# 수동 Run과 동일 (전체 5건)
node scripts/prune-github-actions-runs.mjs --keep=5 --mode=global

# 삭제 대상만 확인
node scripts/prune-github-actions-runs.mjs --dry-run --keep=5 --mode=global
```

`gh auth login` — `repo`, `workflow` 권한 필요.

대량 삭제는 API 제한 때문에 **수분~수십분** 걸릴 수 있습니다.

## npm

```bash
npm run gh:prune-runs          # 워크플로별 keep 3 (일일 스케줄과 동일)
npm run gh:prune-runs:dry
npm run gh:prune-runs:global   # 전체 keep 5 (수동 Run과 동일)
```
