# backend/app/__init__.py (Blueprintを使わないバージョン)
from flask import Flask, jsonify, request, Response, make_response # 必要なものをインポート
from flask_cors import CORS
import os
from datetime import datetime
import traceback # エラーログ用

# サービスとユーティリティをインポート
from .services import gemini_service
from .services import scoring_service
from .utils import text_processing
from .utils import export_utils
from . import config # config.py をインポート

def create_app():
    app = Flask(__name__)

    # --- CORS設定 ---
    frontend_url = os.environ.get('FRONTEND_URL', '*')
    CORS(
        app,
        origins=[frontend_url] if frontend_url != '*' else '*',
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True, # 一旦 True のまま試す
        automatic_options=True # これが効かない前提で進めるが、念のため残す
    )
    print(f"CORS enabled for origins: {frontend_url} with methods and headers.")

    # --- ルート定義をここに直接記述 ---

    @app.route('/')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"})

    # --- /api/evaluate OPTIONS ハンドラ ---
    @app.route('/api/evaluate', methods=['OPTIONS'])
    def handle_evaluate_options():
        response = make_response()
        # Flask-CORSがヘッダーを付与してくれるはず
        print("Handling OPTIONS request for /api/evaluate (direct)")
        return response, 200

    # --- /api/evaluate POST ハンドラ ---
    @app.route('/api/evaluate', methods=['POST'])
    def evaluate_candidate():
        print("'/api/evaluate' endpoint hit! (POST - direct)")
        data = request.get_json()
        if not data or 'candidate_text' not in data:
            return jsonify({"error": "Missing 'candidate_text' in request body"}), 400

        raw_candidate_text = data['candidate_text']
        print(f"Received raw text length: {len(raw_candidate_text)}")
        # ...(ログ)

        candidate_text = text_processing.clean_candidate_text(raw_candidate_text)
        if candidate_text: print(f"Cleaned text length: {len(candidate_text)}")
        # ...(ログ)
        else: print("Warning: Cleaned text is empty after processing.")

        # configからプロンプト取得
        criteria_prompt_text = config.CRITERIA_PROMPT
        full_prompt = gemini_service.build_evaluation_prompt(criteria_prompt_text)
        evaluation_result = gemini_service.evaluate_with_gemini(full_prompt, candidate_text)

        if evaluation_result:
            if isinstance(evaluation_result, dict) and evaluation_result.get("error"):
                 print(f"Gemini evaluation returned an error: {evaluation_result}")
                 return jsonify({"error": "Evaluation failed during Gemini processing", "details": evaluation_result}), 500
            calculated_scores = scoring_service.calculate_scores(evaluation_result)
            final_response = {
                "gemini_evaluation": evaluation_result,
                "calculated_scores": calculated_scores
            }
            return jsonify(final_response), 200
        else:
            print("Evaluation failed in gemini_service (returned None).")
            return jsonify({"error": "Evaluation failed due to Gemini API call error"}), 500

    # --- /api/export POST ハンドラ ---
    @app.route('/api/export', methods=['POST'])
    def export_results():
        print("'/api/export' endpoint hit! (direct)")
        data = request.get_json()
        results_list = data.get('resultsList')
        export_format = data.get('format')
        if not results_list or not isinstance(results_list, list): return jsonify({"error": "Missing or invalid 'resultsList'"}), 400
        if export_format not in ['csv', 'md']: return jsonify({"error": "Invalid or missing 'format'"}), 400

        print(f"Received {len(results_list)} results to export in {export_format} format.")
        filename_base = f"evaluation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        filename = f"{filename_base}.{export_format}"
        file_content = ""
        mimetype = "text/plain"
        try:
            if export_format == 'csv':
                file_content = export_utils.generate_csv(results_list)
                mimetype = "text/csv; charset=utf-8-sig"
            elif export_format == 'md':
                file_content = export_utils.generate_markdown(results_list)
                mimetype = "text/markdown; charset=utf-8"
            return Response(
                file_content,
                mimetype=mimetype,
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
        except Exception as e:
            print(f"Error during export generation: {e}")
            traceback.print_exc()
            return jsonify({"error": "Failed to generate export file"}), 500

    return app # create_app 関数の最後

# --- ここに create_app() を呼び出す処理はない ---
# --- run.py が app = create_app() を呼び出す ---