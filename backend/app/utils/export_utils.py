# backend/app/utils/export_utils.py
import pandas as pd
import io
from datetime import datetime

CSV_HEADERS_JP = [
    "候補者名", "総合コメント", "総合スコア(%)", "必須スコア", "優遇スコア", "その他スコア",
    "必須_年齢_評価", "必須_年齢_理由", "必須_副業_評価", "必須_副業_理由", "必須_業務委託_評価", "必須_業務委託_理由",
    "優遇_経験_評価", "優遇_経験_理由", "優遇_役職レベル_評価", "優遇_役職レベル_理由",
    "その他_転職希望_評価", "その他_転職希望_理由", "その他_適応力_評価", "その他_適応力_理由",
    "その他_チームワーク_評価", "その他_チームワーク_理由", "評価日時"
]

def _flatten_evaluation_data(result):
    flat_data = {}
    gemini_eval = result.get("gemini_evaluation", {}) if result else {}
    scores = result.get("calculated_scores", {}) if result else {}
    evaluation = gemini_eval.get("evaluation", {}) if gemini_eval else {}

    flat_data["候補者名"] = gemini_eval.get("candidate_identifier", "")
    flat_data["総合コメント"] = gemini_eval.get("overall_comment", "")
    flat_data["総合スコア(%)"] = scores.get("total_match_percentage", "")
    flat_data["必須スコア"] = scores.get("required_score", "")
    flat_data["優遇スコア"] = scores.get("preferred_score", "")
    flat_data["その他スコア"] = scores.get("other_score", "")

    item_label_map = {
        "age": "年齢", "side_job": "副業", "outsourcing": "業務委託",
        "experience": "経験", "management_level": "役職レベル",
        "job_change_desire": "転職希望", "adaptability": "適応力", "teamwork": "チームワーク"
    }
    category_label_map = {"required":"必須", "preferred":"優遇", "other":"その他"}

    for category, items in evaluation.items():
        category_prefix = category_label_map.get(category)
        if not category_prefix or not isinstance(items, dict): continue

        for item_key, details in items.items():
            item_prefix = item_label_map.get(item_key, item_key)
            if isinstance(details, dict): # detailsが辞書であることを確認
                header_base = f"{category_prefix}_{item_prefix}"
                flat_data[f"{header_base}_評価"] = details.get("symbol", "")
                flat_data[f"{header_base}_理由"] = details.get("reason", "")

    flat_data["評価日時"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    return flat_data

def generate_csv(results_list):
    if not results_list: return ""
    flat_data_list = [_flatten_evaluation_data(result) for result in results_list]
    df = pd.DataFrame(flat_data_list)
    df = df.reindex(columns=CSV_HEADERS_JP, fill_value="")
    output = io.StringIO()
    df.to_csv(output, index=False, encoding="utf-8-sig")  # ここのアンダースコア(_)をハイフン(-)に変えたで！
    return output.getvalue()

def generate_markdown(results_list):
    if not results_list: return "# 評価結果なし"
    markdown_output = "# 候補者評価結果一覧\n\n"
    for i, result in enumerate(results_list):
        gemini_eval = result.get("gemini_evaluation", {}) if result else {}
        scores = result.get("calculated_scores", {}) if result else {}
        evaluation = gemini_eval.get("evaluation", {}) if gemini_eval else {}

        candidate_id = gemini_eval.get('candidate_identifier', f'不明な候補者 {i+1}')
        total_score = scores.get('total_match_percentage', 'N/A')
        req_score = scores.get('required_score', 'N/A')
        pref_score = scores.get('preferred_score', 'N/A')
        other_score = scores.get('other_score', 'N/A')
        overall_comment = gemini_eval.get('overall_comment', 'コメントなし')

        markdown_output += f"## {i+1}. {candidate_id}\n\n"
        markdown_output += f"**総合スコア:** {total_score} %\n"
        markdown_output += f"(必須: {req_score}, 優遇: {pref_score}, その他: {other_score})\n\n"
        markdown_output += "**評価詳細:**\n\n"

        item_label_map = {
            "age": "年齢", "side_job": "副業", "outsourcing": "業務委託",
            "experience": "経験", "management_level": "役職レベル",
            "job_change_desire": "転職希望", "adaptability": "適応力", "teamwork": "チームワーク"
        }
        category_label_map = {"required":"必須条件", "preferred":"優遇条件", "other":"その他評価ポイント"}

        for category, items in evaluation.items():
             category_label = category_label_map.get(category, category)
             markdown_output += f"### {category_label}\n"
             markdown_output += "| 評価項目 | 評価 | 理由 |\n"
             markdown_output += "|---|---|---|\n"
             if isinstance(items, dict): # items が辞書であることを確認
                 for item_key, details in items.items():
                     item_label = item_label_map.get(item_key, item_key)
                     if isinstance(details, dict): # details が辞書であることを確認
                         symbol = details.get('symbol', '-')
                         reason = details.get('reason', '-').replace('\n', ' ').replace('|', '\|') # Markdown テーブル用にエスケープ
                         markdown_output += f"| {item_label} | {symbol} | {reason} |\n"
             markdown_output += "\n"

        markdown_output += "**総合コメント:**\n"
        markdown_output += f"> {overall_comment.replace('> ', '')}\n\n"
        markdown_output += "---\n\n"
    return markdown_output