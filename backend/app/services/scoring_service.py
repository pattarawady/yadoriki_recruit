# backend/app/services/scoring_service.py

# 評価記号とスコアのマッピング
SCORE_MAP = {
    "◎": 1.0,
    "〇": 0.7,
    "△": 0.3,
    "×": 0.0,
}

# カテゴリ別の重み
CATEGORY_WEIGHTS = {
    "required": 0.60, # 60%
    "preferred": 0.30, # 30%
    "other": 0.10,    # 10%
}

# 各カテゴリ内の項目別重み (プロンプトで定義されたもの)
ITEM_WEIGHTS = {
    "required": {
        "age": 0.40,         # 40%
        "side_job": 0.30,    # 30%
        "outsourcing": 0.30, # 30%
    },
    "preferred": {
        "experience": 0.50,       # 50%
        "management_level": 0.50, # 50%
    },
    "other": {
        "job_change_desire": 0.40, # 40%
        "adaptability": 0.30,      # 30%
        "teamwork": 0.30,          # 30%
    }
}

def calculate_scores(evaluation_data):
    """
    Geminiの評価結果データからマッチ度スコアを計算する関数
    Args:
        evaluation_data (dict): Geminiが生成した評価結果の辞書 (evaluation キーを含む)
    Returns:
        dict: 各カテゴリのスコアと総合スコアを含む辞書
               例: {'required_score': 51.0, 'preferred_score': 21.0, 'other_score': 8.0, 'total_match_percentage': 80.0}
               エラー時は空の辞書を返す (より良いエラー処理も検討可)
    """
    if not evaluation_data or "evaluation" not in evaluation_data:
        print("Error: Invalid evaluation data provided for scoring.")
        return {} # またはエラーを示す値を返す

    evaluations = evaluation_data["evaluation"]
    calculated_scores = {}
    total_percentage = 0.0

    # カテゴリごとにスコアを計算
    for category, items in ITEM_WEIGHTS.items():
        category_score = 0.0
        max_category_score = 1.0 # カテゴリ内の最大スコアは1.0 (重み付け前)

        # カテゴリが存在するかチェック
        if category not in evaluations:
            print(f"Warning: Category '{category}' not found in evaluation data.")
            continue # 次のカテゴリへ

        category_evaluations = evaluations[category]

        # カテゴリ内の各項目について計算
        for item_key, item_weight in items.items():
            # 項目が存在するかチェック
            if item_key not in category_evaluations:
                print(f"Warning: Item '{item_key}' not found in category '{category}'.")
                continue # 次の項目へ

            item_evaluation = category_evaluations[item_key]
            symbol = item_evaluation.get("symbol")

            # 記号に対応するスコアを取得 (記号がなければ0点)
            score = SCORE_MAP.get(symbol, 0.0)

            # 項目スコア = 記号スコア * 項目重み
            category_score += score * item_weight

        # カテゴリ別スコア（パーセント表示用、最終的な重み付け前の上限100%で計算）
        # このスコアは参考値であり、最終合計には使わない
        # calculated_scores[f"{category}_raw_percentage"] = round(category_score / max_category_score * 100, 1)

        # 最終スコアへの寄与分 = カテゴリ内スコア * カテゴリ重み * 100 (パーセントにするため)
        category_contribution = category_score * CATEGORY_WEIGHTS[category] * 100
        calculated_scores[f"{category}_score"] = round(category_contribution, 1)
        total_percentage += category_contribution

    calculated_scores["total_match_percentage"] = round(total_percentage, 1)

    print(f"Calculated scores: {calculated_scores}")
    return calculated_scores