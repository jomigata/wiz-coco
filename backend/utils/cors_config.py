"""Flask CORS 허용 오리진·헤더 (프로덕션 www.wizcoco.com 포함)."""
import os

DEFAULT_CORS_ORIGINS = (
    "https://wizcoco.com",
    "https://www.wizcoco.com",
    "https://wiz-coco.web.app",
    "https://wiz-coco.firebaseapp.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)

CORS_ALLOW_HEADERS = [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Notification-Cron-Secret",
]


def get_cors_origins() -> list[str]:
    raw = (os.getenv("CORS_ORIGINS") or "").strip()
    if not raw or raw == "*":
        return list(DEFAULT_CORS_ORIGINS)
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or list(DEFAULT_CORS_ORIGINS)
