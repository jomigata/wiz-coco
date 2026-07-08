# WizCoCo Flask API 설정
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Firebase
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
# 환경변수 GOOGLE_APPLICATION_CREDENTIALS가 있으면 Firebase Admin이 자동 사용

# Email (결과 제출 시 비밀번호·요약 발송)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@wizcoco.example.com")

def is_email_configured():
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)

# Rate limiting (requests per minute; 0 = disabled)
RATE_LIMIT_ACCESS_CODE = int(os.getenv("RATE_LIMIT_ACCESS_CODE", "30"))
RATE_LIMIT_PASSWORD_API = int(os.getenv("RATE_LIMIT_PASSWORD_API", "20"))

# Flask
FLASK_ENV = os.getenv("FLASK_ENV", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")

# Firestore 컬렉션 이름 (프론트 타입과 동일)
ASSESSMENTS_COLLECTION = "assessments"
TEST_RESULTS_COLLECTION = "testResults"
USERS_COLLECTION = "users"
CLIENT_PORTALS_COLLECTION = "clientPortals"
NOTIFICATION_QUEUE_COLLECTION = "notificationQueue"
JOIN_PARTICIPANTS_COLLECTION = "joinParticipants"

# 그룹코드 일괄 발급 시 내담자 수 상한
BULK_PORTAL_MAX_ROWS = int(os.getenv("BULK_PORTAL_MAX_ROWS", "2000"))
# 이 인원 이하는 HTTP 요청에서 동기 처리, 초과 시 job + 폴링
BULK_PORTAL_SYNC_MAX = int(os.getenv("BULK_PORTAL_SYNC_MAX", "50"))
# job/cron 배치당 처리 행 수
BULK_PORTAL_BATCH_SIZE = int(os.getenv("BULK_PORTAL_BATCH_SIZE", "50"))
BULK_PORTAL_JOBS_COLLECTION = "bulkPortalJobs"

# 상담사 검사 크레딧 (1단계 파일럿)
COUNSELOR_CREDITS_COLLECTION = "counselorCredits"
COUNSELOR_CREDIT_LEDGER_COLLECTION = "counselorCreditLedger"
COMMERCE_CREDITS_ENFORCE = os.getenv("COMMERCE_CREDITS_ENFORCE", "false").lower() in (
    "1",
    "true",
    "yes",
)
PILOT_FREE_CREDITS = int(os.getenv("PILOT_FREE_CREDITS", "50"))

# 2단계 — 결제·정산
COMMERCE_ORDERS_COLLECTION = "commerceOrders"
PAYMENT_HISTORY_COLLECTION = "paymentHistory"
SUBSCRIPTIONS_COLLECTION = "subscriptions"
TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY", "").strip()
TOSS_CLIENT_KEY = os.getenv("TOSS_CLIENT_KEY", "").strip()
TOSS_WEBHOOK_SECRET = os.getenv("TOSS_WEBHOOK_SECRET", "").strip()
TOSS_API_BASE = os.getenv("TOSS_API_BASE", "https://api.tosspayments.com").rstrip("/")
COMMERCE_MOCK_PAYMENTS = os.getenv("COMMERCE_MOCK_PAYMENTS", "false").lower() in (
    "1",
    "true",
    "yes",
)
PLATFORM_FEE_RATE = float(os.getenv("PLATFORM_FEE_RATE", "0.25"))

# 3단계 — B2B 기관
ORGANIZATIONS_COLLECTION = "organizations"
ORG_CREDITS_COLLECTION = "orgCredits"
ORG_CREDIT_LEDGER_COLLECTION = "orgCreditLedger"

# 4단계 — B2C · 공개 API
B2C_ENTITLEMENTS_COLLECTION = "b2cEntitlements"
API_KEYS_COLLECTION = "apiKeys"

# Wave 2 — 케어 플랜 (T-2-01)
CARE_ASSIGNMENTS_COLLECTION = "careAssignments"
CARE_PROGRESS_COLLECTION = "careProgress"

# 공개 사이트 URL (매직 링크·초대 메일)
PUBLIC_SITE_URL = os.getenv("PUBLIC_SITE_URL", "https://wizcoco.com").rstrip("/")

# Cron/스케줄러가 통지 큐 처리 API 호출 시 사용 (X-Notification-Cron-Secret 헤더)
NOTIFICATION_CRON_SECRET = os.getenv("NOTIFICATION_CRON_SECRET", "").strip()

# SMS (Twilio, 선택)

# 내담자 포털 세션·매직 링크 (초)
PORTAL_SESSION_MAX_AGE = int(os.getenv("PORTAL_SESSION_MAX_AGE", str(24 * 3600)))
PORTAL_SESSION_REMEMBER_MAX_AGE = int(os.getenv("PORTAL_SESSION_REMEMBER_MAX_AGE", str(30 * 24 * 3600)))
PORTAL_MAGIC_LINK_MAX_AGE = int(os.getenv("PORTAL_MAGIC_LINK_MAX_AGE", str(72 * 3600)))

# Role bootstrap (최초 운영자/상담사 계정)
# Firestore users/{uid}.role 이 설정되지 않은 경우, 토큰의 email 클레임으로 1회 자동 승격합니다.
# 쉼표 구분: "a@b.com,c@d.com"
_BOOTSTRAP_ADMIN_DEFAULT = "jomigata@gmail.com,wizcocoai@gmail.com"
BOOTSTRAP_ADMIN_EMAILS = [
    x.strip().lower()
    for x in os.getenv("BOOTSTRAP_ADMIN_EMAILS", _BOOTSTRAP_ADMIN_DEFAULT).split(",")
    if x.strip()
]
BOOTSTRAP_COUNSELOR_EMAILS = [x.strip().lower() for x in os.getenv("BOOTSTRAP_COUNSELOR_EMAILS", "").split(",") if x.strip()]

# 상담사 전환 승인 요청 알림 수신
COUNSELOR_ADMIN_NOTIFY_EMAIL = os.getenv("COUNSELOR_ADMIN_NOTIFY_EMAIL", "jomigata@gmail.com").strip().lower()
