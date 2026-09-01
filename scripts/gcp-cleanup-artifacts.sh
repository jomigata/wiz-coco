#!/usr/bin/env bash
# GCP 일회성·정기 정리: GCS Functions 아티팩트, Cloud Build, Artifact Registry
# 사용: GCP_PROJECT_ID=wiz-coco ./scripts/gcp-cleanup-artifacts.sh
#      (또는 GitHub Actions → "GCP artifact cleanup" workflow_dispatch)
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${GCP_REGION:-asia-northeast3}"
AR_REPO="${AR_REPO:-wizcoco-repo}"
SERVICE_NAME="${SERVICE_NAME:-wizcoco-api}"
KEEP_IMAGES="${KEEP_IMAGES:-5}"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-14}"

if [ -z "${PROJECT_ID}" ]; then
  echo "❌ GCP_PROJECT_ID 또는 GOOGLE_CLOUD_PROJECT를 설정하세요."
  exit 1
fi

echo "🧹 GCP cleanup — project=${PROJECT_ID} region=${REGION}"

# --- Artifact Registry (Cloud Run API images) ---
REPO="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}"
if gcloud artifacts docker images list "$REPO" --project "${PROJECT_ID}" --format="get(digest)" >/dev/null 2>&1; then
  echo "📋 Artifact Registry: ${REPO} (keep latest ${KEEP_IMAGES})"
  DIGESTS=$(gcloud artifacts docker images list "$REPO" \
    --project "${PROJECT_ID}" \
    --sort-by="~UPDATE_TIME" \
    --format="get(digest)" 2>/dev/null | tail -n +$((KEEP_IMAGES + 1)) || true)
  if [ -n "${DIGESTS}" ]; then
    echo "$DIGESTS" | while read -r DIGEST; do
      [ -z "$DIGEST" ] && continue
      echo "  🗑️  delete ${REPO}@${DIGEST}"
      gcloud artifacts docker images delete "${REPO}@${DIGEST}" \
        --project "${PROJECT_ID}" --delete-tags --quiet || true
    done
  else
    echo "  ✅ Nothing to delete (≤${KEEP_IMAGES} images)"
  fi
else
  echo "ℹ️  Artifact Registry repo not found or empty: ${REPO}"
fi

# --- GCS: list gcf / cloudbuild buckets (set lifecycle in Console for auto purge) ---
echo "📦 GCS buckets — review size; enable 30-day lifecycle on gcf-artifacts / gcf-sources if large"
gcloud storage buckets list --project "${PROJECT_ID}" --format='table(name,location,storageClass)' 2>/dev/null \
  | grep -E 'gcf-sources|gcf-artifacts|cloudbuild|appspot' || echo "  (no matching buckets listed)"

# --- Cloud Logging retention (project/_Default) ---
echo "📜 Log bucket retention → ${LOG_RETENTION_DAYS} days (_Default)"
gcloud logging buckets update _Default \
  --location=global \
  --retention-days="${LOG_RETENTION_DAYS}" \
  --project="${PROJECT_ID}" 2>/dev/null \
  && echo "  ✅ _Default retention updated" \
  || echo "  ⚠️  Could not update _Default (needs logging.buckets.update)"

echo "✅ Cleanup finished. Check Billing → Reports for next cycle."
