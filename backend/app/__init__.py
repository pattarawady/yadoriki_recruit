# backend/app/__init__.py (正しい内容)
from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"})

    from .api import evaluate_routes
    app.register_blueprint(evaluate_routes.bp)

    return app