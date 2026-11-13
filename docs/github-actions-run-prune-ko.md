# GitHub Actions 실행 기록 정리

저장소 push마다 CI·배포 등 여러 워크플로가 돌면 **Actions** 목록이 수천 건까지 쌓일 수 있습니다. GitHub UI에는 **일괄 삭제**가 없어 스크립트·워크플로로 정리합니다.

## 자동 (권장)

워크플로 **🧹 Prune Actions runs** (`prune-actions-runs.yml`)

| 항목 | 값 |
|------|-----|
| **스케줄** | 매일 03:15 KST |
| **기본** | 워크플로마다 최신 **2건**만 유지 |
| **수동** | [Actions](https://github.com/jomigata/wiz-coco/actions/workflows/prune-actions-runs.yml) → **Run workflow** |

`global` 모드: 저장소 **전체** 실행 중 최신 N건만 남김 (목록을 극단적으로 비울 때).

## 로컬 한 번에 정리

```bash
# 삭제 대상만 확인
node scripts/prune-github-actions-runs.mjs --dry-run --keep=2

# 워크플로별 최신 2건 유지
node scripts/prune-github-actions-runs.mjs --keep=2 --mode=workflow

# 저장소 전체 최신 2건만 남김
node scripts/prune-github-actions-runs.mjs --keep=2 --mode=global
```

`gh auth login` — `repo`, `workflow` 권한 필요.

첫 대량 삭제(수천 건)는 API 제한 때문에 **10~30분** 걸릴 수 있습니다.

## npm

```bash
npm run gh:prune-runs
npm run gh:prune-runs:dry
```
