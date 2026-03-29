# 로컬 전용 — Git에 올리지 마세요

이 폴더는 Firebase 서비스 계정 JSON 등 **로컬 개발·수동 배포용 키**를 두는 용도입니다.

- 파일 이름 예: `wiz-coco-firebase-adminsdk-*.json`
- 저장소 루트 `.gitignore`에 `Firebase_GitHub/`가 포함되어 있어 일반적으로 추적되지 않습니다.
- CI/CD에는 **GitHub Secrets**만 사용하세요. 자세한 내용은 [docs/SECURITY_CREDENTIALS.md](../docs/SECURITY_CREDENTIALS.md)를 참고하세요.
