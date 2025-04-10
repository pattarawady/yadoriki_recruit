# backend/app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS # <<< インポートを確認
import os

def create_app():
    app = Flask(__name__)

    # ▼▼▼ CORS設定を修正 ▼▼▼
    frontend_url = os.environ.get('FRONTEND_URL', '*')
    # CORS(app, origins=frontend_url, supports_credentials=True) # 修正前

    # より多くのオプションを指定して、Preflight (OPTIONS) に対応
    CORS(
        app,
        origins=[frontend_url] if frontend_url != '*' else '*', # originsはリスト形式も可
        methods=["GET", "POST", "OPTIONS"], # OPTIONSメソッドを許可
        allow_headers=["Content-Type", "Authorization"], # フロントから送る可能性のあるヘッダーを許可 (Authorizationは将来用)
        supports_credentials=True,
        automatic_options=True # <<< Flask-CORSにOPTIONSリクエストを自動処理させる (通常Trueがデフォルトだが明示)
    )
    print(f"CORS enabled for origins: {frontend_url} with methods and headers.") # ログも少し変更
    # ▲▲▲ CORS設定を修正 ▲▲▲


    @app.route('/')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"})

    from .api import evaluate_routes
    app.register_blueprint(evaluate_routes.bp)
    # from .api import export_routes # 必要ならコメント解除
    # app.register_blueprint(export_routes.bp)

    return app