# backend/app/api/evaluate_routes.py
from flask import Blueprint, request, jsonify, Response # Response をインポート
from ..services import gemini_service
from ..services import scoring_service
from ..utils import text_processing
from ..utils import export_utils # <<< export_utils をインポート
from datetime import datetime # タイムスタンプ用にインポート

bp = Blueprint('evaluate_api', __name__, url_prefix='/api')

@bp.route('/evaluate', methods=['POST'])
def evaluate_candidate():
    print("'/api/evaluate' endpoint hit!")
    data = request.get_json()
    if not data or 'candidate_text' not in data:
        return jsonify({"error": "Missing 'candidate_text' in request body"}), 400
    raw_candidate_text = data['candidate_text']
    print(f"Received raw text length: {len(raw_candidate_text)}")
    # ... (ログ) ...
    candidate_text = text_processing.clean_candidate_text(raw_candidate_text)
    if candidate_text:
        print(f"Cleaned text length: {len(candidate_text)}")
        # ... (ログ) ...
    else:
        print("Warning: Cleaned text is empty after processing.")

    criteria_prompt_text = """...""" # 省略
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

@bp.route('/export', methods=['POST'])
def export_results():
    print("'/api/export' endpoint hit!")
    data = request.get_json()
    results_list = data.get('resultsList')
    export_format = data.get('format')
    if not results_list or not isinstance(results_list, list):
        return jsonify({"error": "Missing or invalid 'resultsList' in request body"}), 400
    if export_format not in ['csv', 'md']:
        return jsonify({"error": "Invalid or missing 'format' in request body (must be 'csv' or 'md')"}), 400
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
            mimetype = "text/markdown; charset=utf-8-sig"
        return Response(
                file_content,
                mimetype=mimetype,
                headers={
                    # ▼▼▼ ダブルクォートの扱いを修正 ▼▼▼
                    # "Content-Disposition": f'attachment; filename="{filename}"' # 修正前
                    "Content-Disposition": f'attachment; filename="{filename.replace("\"", "\\\"")}"' # ファイル名中の " をエスケープ
                    # または、よりシンプルな方法として、ファイル名に " が含まれない前提なら以下でも良い
                    # "Content-Disposition": f"attachment; filename=\"{filename}\"" # Python 3.6+ の f-string 内で \ を使う
                    # ▲▲▲ ダブルクォートの扱いを修正 ▲▲▲
                }
            )
    except Exception as e:
        print(f"Error during export generation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate export file"}), 500