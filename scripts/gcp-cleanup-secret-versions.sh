#!/usr/bin/env bash
# Secret Manager — 오래된 버전 destroy (replica storage 과금 절감)
# 최신 KEEP_SECRET_VERSIONS 개만 남기고 나머지 버전 삭제
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
KEEP_SECRET_VERSIONS="${KEEP_SECRET_VERSIONS:-2}"

if [ -z "${PROJECT_ID}" ]; then
  echo "❌ GCP_PROJECT_ID 또는 GOOGLE_CLOUD_PROJECT를 설정하세요."
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "❌ gcloud CLI가 필요합니다."
  exit 1
fi

echo "🔐 Secret Manager cleanup — project=${PROJECT_ID} keep=${KEEP_SECRET_VERSIONS} version(s) per secret"

mapfile -t SECRETS < <(
  gcloud secrets list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null || true
)

if [ "${#SECRETS[@]}" -eq 0 ]; then
  if ! gcloud secrets list --project="${PROJECT_ID}" --limit=1 >/dev/null 2>&1; then
    echo "⚠️  secretmanager.secrets.list 권한이 없거나 API 비활성화."
    echo "   GitHub Actions SA에 roles/secretmanager.admin (또는 Secret Manager Admin) 부여 후 재실행하거나,"
    echo "   Console → Secret Manager에서 구버전을 수동 destroy 하세요."
    exit 0
  fi
  echo "ℹ️  No secrets in project."
  exit 0
fi

total_destroyed=0

for SECRET in "${SECRETS[@]}"; do
  [ -z "${SECRET}" ] && continue
  mapfile -t VERSIONS < <(
    gcloud secrets versions list "${SECRET}" \
      --project="${PROJECT_ID}" \
      --sort-by=~createTime \
      --format='value(name)' 2>/dev/null || true
  )
  count="${#VERSIONS[@]}"
  if [ "${count}" -le "${KEEP_SECRET_VERSIONS}" ]; then
    echo "  ✅ ${SECRET}: ${count} version(s) — nothing to delete"
    continue
  fi
  to_delete=$((count - KEEP_SECRET_VERSIONS))
  echo "  🗑️  ${SECRET}: destroy ${to_delete} old version(s) (keeping ${KEEP_SECRET_VERSIONS})"
  idx=0
  for VER in "${VERSIONS[@]}"; do
    idx=$((idx + 1))
    if [ "${idx}" -le "${KEEP_SECRET_VERSIONS}" ]; then
      continue
    fi
    if gcloud secrets versions destroy "${VER}" \
      --secret="${SECRET}" \
      --project="${PROJECT_ID}" \
      --quiet 2>/dev/null; then
      total_destroyed=$((total_destroyed + 1))
      echo "     destroyed ${SECRET}@${VER}"
    else
      echo "     ⚠️  could not destroy ${SECRET}@${VER}"
    fi
  done
done

echo "✅ Secret cleanup finished. Destroyed ${total_destroyed} version(s)."
echo "   Billing → SKU 'Secret version replica storage' should drop over the next 1–2 days."
