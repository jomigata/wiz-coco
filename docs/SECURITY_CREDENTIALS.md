# 자격 증명·로컬 키 취급 (WizCoCo)

## 원칙

1. **서비스 계정 JSON·Refresh Token·개인 키**는 Git에 커밋하지 않습니다.
2. CI/CD에는 **GitHub Secrets** 또는 GCP Secret Manager 등만 사용합니다.
3. 로컬 개발용 키는 `Firebase_GitHub/` 등 **저장소에서 무시되는 디렉터리**에만 둡니다.

## `.gitignore`

- `*.json` 패턴(예외: `package.json`, `tsconfig.json` 등만 허용)으로 대부분의 JSON 키 파일이 제외됩니다.
- `*.json` 무시 규칙으로 `Firebase_GitHub/` 아래 서비스 계정 JSON이 추적되지 않습니다. 폴더 안 `README.md`만 안내용으로 커밋할 수 있습니다.

## 저장소에 키가 올라간 경우

1. **즉시** 해당 키를 GCP/Firebase 콘솔에서 **삭제(폐기)**하고 새 키를 만듭니다.
2. `FIREBASE_TOKEN` 등 노출된 토큰은 **재발급**합니다.
3. GitHub에서 해당 커밋이 공개 저장소에 있다면 **히스토리에 남은 비밀은 회수 불가**에 가깝습니다. 키 폐기가 본질적인 대응입니다.

## 문서에 비밀을 쓰지 않기

- 설정 가이드에는 **변수 이름·설정 위치**만 적고, 샘플 값은 `your-api-key` 형태의 플레이스홀더만 사용합니다.

## Flask / Cloud Run

- GCP 배포용은 GitHub Secret `GCP_SA_KEY`, `GCP_PROJECT_ID`를 사용합니다. JSON 내용은 문서나 코드에 붙이지 않습니다.

---

## 단계별 실행 (최초 설정·로테이션)

상세 절차는 **[CREDENTIAL_SETUP_AND_ROTATION_KO.md](./CREDENTIAL_SETUP_AND_ROTATION_KO.md)** 를 따르세요.
