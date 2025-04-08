# backend/app/api/evaluate_routes.py
from flask import Blueprint, request, jsonify
# ▼▼▼ 追加: gemini_service から関数をインポート ▼▼▼
from ..services import gemini_service # '..'は一つ上の階層(app)を指す

bp = Blueprint('evaluate_api', __name__, url_prefix='/api')

# ▼▼▼ この関数の中身を修正 ▼▼▼
@bp.route('/evaluate', methods=['POST'])
def evaluate_candidate():
    print("'/api/evaluate' endpoint hit!")
    data = request.get_json()

    if not data or 'candidate_text' not in data:
        return jsonify({"error": "Missing 'candidate_text' in request body"}), 400

    candidate_text = data['candidate_text']
    print(f"Received text: {candidate_text[:50]}...")

    # --- ★★★ ここからが変更点 ★★★ ---
    # 1. 評価基準プロンプトを取得 (今はまだハードコード)
    #    (将来的には設定ファイルやDBから読み込む)
    criteria_prompt_text = """
###採用条件マッチ度計算プロンプト###
評価対象の採用条件
必須条件（60%）
年齢が23～30歳であること（重み: 40%）
副業NGであること（重み: 30%）
業務委託NGであること（重み: 30%）

優遇条件（30%）
旅館・ホテルの勤務経験があること（重み: 50%）
アラサー(28-30歳)の場合はマネージャーレベル以上であること（特にルームのみの経験の場合は不可）（重み: 50%）

その他評価ポイント（10%）
転職希望者であること（重み: 40%）
適応力が高いこと（重み: 30%）
チームワーク・人間関係構築力があること（重み: 30%）

評価ステップ
各評価項目に対して、以下の4段階で評価を行う
◎（excellent）= 完全に条件を満たしている（スコア: 1.0）
〇（good）= 条件をほぼ満たしている、または条件を満たす可能性が高い（スコア: 0.7）
△（fair）= 条件を部分的に満たしている、または満たせる可能性がある（スコア: 0.3）
×（poor）= 条件を満たしていない（スコア: 0.0）

各カテゴリに以下の重み付けを設定
必須条件: 60%
優遇条件: 30%
その他参考条件: 10%

総合スコアの計算方法

追加の評価ガイドライン
「副業可能」と「副業希望」は異なる概念として扱う。副業希望の場合でも、条件次第で折り合いがつく可能性があれば「〇」と評価可能。
宿泊施設での経験は、役職レベルと担当業務（特にルーム担当か否か）を詳細に確認する。
アラサー（28-30歳）の場合、マネージャーレベル未満だと評価が下がる点に注意。
履歴書やプロフィールから、適応力や人間関係構築力などの柔らかいスキルも評価に含める。
"""

    # 2. プロンプトを組み立てる (JSON出力指示を追加)
    full_prompt = gemini_service.build_evaluation_prompt(criteria_prompt_text)

    # 3. Geminiサービスを呼び出して評価を実行 (今はダミー応答が返る)
    evaluation_result = gemini_service.evaluate_with_gemini(full_prompt, candidate_text)

    # 4. 結果をフロントエンドに返す
    if evaluation_result:
        # 成功時 (今はダミーデータが返る)
        return jsonify(evaluation_result), 200
    else:
        # エラー時 (evaluate_with_gemini が None を返した場合など)
        return jsonify({"error": "Evaluation failed by gemini_service"}), 500 # Internal Server Error
    # --- ★★★ ここまでが変更点 ★★★ ---