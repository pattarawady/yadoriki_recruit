# backend/app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS # <<< 追加
import os # os をインポート (環境変数用)

def create_app():
    app = Flask(__name__)

    # ▼▼▼ CORS設定を追加 ▼▼▼
    # 環境変数 'FRONTEND_URL' があればそれを許可、なければ全てのオリジンを許可(開発中は便利、本番は注意)
    # Renderでは環境変数でデプロイされたフロントエンドのURLを設定する
    frontend_url = os.environ.get('FRONTEND_URL', '*') # デフォルトは '*' (全許可)
    CORS(app, origins=frontend_url, supports_credentials=True) # credentialsは将来的に必要になるかも
    print(f"CORS enabled for origins: {frontend_url}")
    # ▲▲▲ CORS設定を追加 ▲▲▲


    @app.route('/')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"})

    from .api import evaluate_routes
    app.register_blueprint(evaluate_routes.bp)

    # /export ルートが evaluate_routes にあればこの行は不要
    # from .api import export_routes # もし export を別ファイルに分けた場合
    # app.register_blueprint(export_routes.bp) # もし export を別ファイルに分けた場合

    return app