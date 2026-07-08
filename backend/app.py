# WizCoCo Flask API - 상담사/내담자 API 진입점
import os
from flask import Flask
from flask_cors import CORS

from config import FLASK_ENV, SECRET_KEY
from utils.cors_config import CORS_ALLOW_HEADERS, get_cors_origins
from routes.assessments import bp as assessments_bp
from routes.auth import bp as auth_bp
from routes.counselor_applications import bp as counselor_applications_bp
from routes.results import bp as results_bp
from routes.client_portals import bp as client_portals_bp
from routes.notifications import bp as notifications_bp
from routes.admin_maintenance import bp as admin_maintenance_bp
from routes.join_flow import bp as join_flow_bp
from routes.commerce import bp as commerce_bp
from routes.admin_organizations import bp as admin_organizations_bp
from routes.organizations import bp as organizations_bp
from routes.b2c import bp as b2c_bp
from routes.public_api import bp as public_api_bp, admin_bp as developer_admin_bp
from routes.care_assignments import bp as care_assignments_bp
from routes.ai_credits import bp as ai_credits_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    CORS(
        app,
        origins=get_cors_origins(),
        supports_credentials=True,
        allow_headers=CORS_ALLOW_HEADERS,
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    app.register_blueprint(assessments_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(counselor_applications_bp)
    app.register_blueprint(results_bp)
    app.register_blueprint(client_portals_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(admin_maintenance_bp)
    app.register_blueprint(join_flow_bp)
    app.register_blueprint(commerce_bp)
    app.register_blueprint(organizations_bp)
    app.register_blueprint(b2c_bp)
    app.register_blueprint(public_api_bp)
    app.register_blueprint(developer_admin_bp)
    app.register_blueprint(admin_organizations_bp)
    app.register_blueprint(care_assignments_bp)
    app.register_blueprint(ai_credits_bp)

    @app.route("/", methods=["GET"])
    def root():
        # Cloud Run 기본 URL만 열면 404로 보이지 않도록 안내
        return {
            "service": "wizcoco-api",
            "status": "ok",
            "health": "/api/health",
            "api": [
                "/api/assessments",
                "/api/results",
                "/api/client-portals",
                "/api/notifications/process",
                "/api/notifications/cohort-reminders",
                "/api/notifications/individual-reminders",
                "/api/notifications/care-reminders",
                "/api/notifications/status",
                "/api/admin/purge-assessment-data",
                "/api/commerce/catalog",
                "/api/commerce/credits",
                "/api/commerce/checkout",
                "/api/commerce/webhooks/toss",
                "/api/commerce/settlement",
                "/api/b2c/catalog",
                "/api/b2c/mini-check",
                "/api/b2c/checkout",
                "/api/v1/public/catalog",
                "/api/admin/developer/api-keys",
            ],
        }

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "service": "wizcoco-api"}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=(FLASK_ENV == "development"))
