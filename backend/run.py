from app import create_app
import os
from dotenv import load_dotenv

load_dotenv() # .envファイルから環境変数を読み込む

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=os.environ.get('BACKEND_PORT', 5001)) # ポートは環境変数かデフォルト値