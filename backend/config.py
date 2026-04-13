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
