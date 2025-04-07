from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)

    # 簡単な動作確認用ルート
    @app.route('/')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"})

    # ここに今後 /evaluate などのルートを追加していく
    # from .api import evaluate_routes
    # app.register_blueprint(evaluate_routes.bp)

    return app