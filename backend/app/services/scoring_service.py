# backend/app/services/scoring_service.py
# ▼▼▼ config モジュールをインポート ▼▼▼
from .. import config # '..'は一つ上の階層(app), そこにある config.py を指す

# --- ▼▼▼ ハードコードされた設定定義を削除 ▼▼▼ ---
# SCORE_MAP = { ... }
# CATEGORY_WEIGHTS = { ... }
# ITEM_WEIGHTS = { ... }
# --- ▲▲▲ 削除 ▲▲▲ ---


def calculate_scores(evaluation_data):
    """
    Geminiの評価結果データからマッチ度スコアを計算する関数
    Args:
        evaluation_data (dict): Geminiが生成した評価結果の辞書 (evaluation キーを含む)
    Returns:
        dict: 各カテゴリのスコアと総合スコアを含む辞書
    """
    if not evaluation_data or "evaluation" not in evaluation_data:
        print("Error: Invalid evaluation data provided for scoring.")
        return {}

    evaluations = evaluation_data["evaluation"]
    calculated_scores = {}
    total_percentage = 0.0

    # --- ▼▼▼ configから設定値を参照するように変更 ▼▼▼ ---
    # カテゴリごとにスコアを計算 (ITEM_WEIGHTS を config から取得)
    for category, items in config.ITEM_WEIGHTS.items():
        category_score = 0.0
        max_category_score = 1.0

        if category not in evaluations:
            print(f"Warning: Category '{category}' not found in evaluation data.")
            continue

        category_evaluations = evaluations[category]

        # カテゴリ内の各項目について計算
        for item_key, item_weight in items.items():
            if item_key not in category_evaluations:
                print(f"Warning: Item '{item_key}' not found in category '{category}'.")
                continue

            item_evaluation = category_evaluations[item_key]
            symbol = item_evaluation.get("symbol")

            # 記号に対応するスコアを取得 (SCORE_MAP を config から取得)
            score = config.SCORE_MAP.get(symbol, 0.0)

            category_score += score * item_weight

        # 最終スコアへの寄与分 (CATEGORY_WEIGHTS を config から取得)
        category_contribution = category_score * config.CATEGORY_WEIGHTS[category] * 100
        calculated_scores[f"{category}_score"] = round(category_contribution, 1)
        total_percentage += category_contribution
    # --- ▲▲▲ configから設定値を参照するように変更 ▲▲▲ ---

    calculated_scores["total_match_percentage"] = round(total_percentage, 1)

    print(f"Calculated scores (using config): {calculated_scores}") # ログメッセージ変更
    return calculated_scores