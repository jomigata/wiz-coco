# WizCoCo Flask API - 상담사/내담자 API 진입점
import os
from flask import Flask
from flask_cors import CORS

from config import FLASK_ENV, SECRET_KEY
from routes.assessments import bp as assessments_bp
from routes.auth import bp as auth_bp
from routes.results import bp as results_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    CORS(app, origins=os.getenv("CORS_ORIGINS", "*").split(","), supports_credentials=True)

    app.register_blueprint(assessments_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(results_bp)

    @app.route("/", methods=["GET"])
    def root():
        # Cloud Run 기본 URL만 열면 404로 보이지 않도록 안내
        return {
            "service": "wizcoco-api",
            "status": "ok",
            "health": "/api/health",
            "api": ["/api/assessments", "/api/results"],
        }

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "service": "wizcoco-api"}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=(FLASK_ENV == "development"))
