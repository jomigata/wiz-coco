# Cloud Run 배포 (GitHub Actions)

## 실패 시 확인 사항

### `PERMISSION_DENIED: artifactregistry.repositories.downloadArtifacts`

**원인:** GitHub Actions에서 사용하는 GCP 서비스 계정(예: `wizcoco-github-ci@<project>.iam.gserviceaccount.com`)에 Artifact Registry 이미지 다운로드 권한이 없음.

**조치:** GCP 콘솔에서 해당 서비스 계정에 다음 역할 추가.

1. **GCP 콘솔** → **IAM 및 관리자** → **IAM**
2. 서비스 계정 `wizcoco-github-ci@...` 찾기 (또는 GitHub Secrets `GCP_SA_KEY`에 넣은 JSON의 `client_email` 확인)
3. **편집(연필)** → **다른 역할 추가**:
   - **Artifact Registry 읽기** (`roles/artifactregistry.reader`)
   - (이미 있다면) **Cloud Run 관리자** (`roles/run.admin`), **서비스 계정 사용자** (`roles/iam.serviceAccountUser`)
4. 저장 후 GitHub Actions에서 **Re-run jobs** 실행

이미지를 GCR(`gcr.io`)으로만 쓰는 경우 **Storage 개체 뷰어** (`roles/storage.objectViewer`)도 필요할 수 있습니다.
