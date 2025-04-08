# backend/app/utils/text_processing.py
import re

# --- ヘッダー部分の終了を示す行のパターン ---
# これ以降の行から評価対象を開始する
# ここでは、"会員No." で始まる行をヘッダーの終わりと判断する
HEADER_END_PATTERN = r"^\s*会員No\.\d+"

# --- フッター部分の開始を示す行のパターン ---
# このパターンが見つかった行以降はすべて除去する
# ここでは、"今見ているレジュメと類似するレジュメの対象者が" を含む行をフッターの開始と判断する
FOOTER_START_PATTERN = r".*今見ているレジュメと類似するレジュメの対象者が.*"

# --- 行単位で除去したいパターン (正規表現) ---
# 評価対象内のテキストで、不要な「行」を除去するためのパターン
LINE_PATTERNS_TO_REMOVE = [
    r"^\s*\*+$",                      # "*****" だけの行
    r"^\s*更新日",
    r"^\s*年齢$",                      # 「年齢」だけの行
    r"^\s*性別$",                      # 「性別」だけの行
    r"^\s*居住地$",
    # r"^\s*年収",                    # 年収は情報として残すことが多い
    r"^\s*現職・離職$",
    r"^\s*最終学歴$",
    r"^\s*専攻$",
    r"^\s*卒業区分$",
    r"^\s*活動状況$",
    r"^\s*スカウト状況$",              # 見出し行
    r"^\s*※スカウト送信情報の閲覧期限は.*",
    r"^\s*閲覧可能なスカウト送信情報がありません.*",
    r"^\s*職務経歴$",                  # 見出し行
    r"^\s*転職回数$",
    r"^\s*海外赴任先$",
    r"^\s*直近の職務経歴$",            # 見出し行
    # r"^\s*在籍企業$",                # 残す
    # r"^\s*雇用形態$",
    # r"^\s*業種$",
    # r"^\s*職種$",
    # r"^\s*職務内容$",                # 残す
    r"^\s*経験・スキル$",              # 見出し行
    # r"^\s*経験職種\d+$",             # 残す
    # r"^\s*業種\d+$",
    # r"^\s*スキル\d+$",
    r"^\s*語学力・資格$",              # 見出し行
    # r"^\s*語学力$",
    # r"^\s*保有資格$",
    r"^\s*行動履歴$",                  # 見出し行
    r"^\s*最終ログイン",
    r"^\s*doda ダイレクト$",
    r"^\s*スカウト受信数.*",
    r"^\s*転職活動状況",
    r"^\s*よく閲覧する職種.*",
    r"^\s*貴社求人に$",                # 「対する行動」が改行されている場合を考慮
    r"^\s*対する行動.*",
    r"^\s*希望条件$",                  # 見出し行
    # r"^\s*勤務地$",
    # r"^\s*時期$",
    # r"^\s*転居／転勤$",
    r"^\s*自由記入欄$",                # 見出し行 (自己PR等は残す)
    r"^\s*自己PR／表彰歴／職務概要等…$", # 具体的な見出し
    r"^\s*-+$",                      # 区切り線 ---
    r"^\s*$",                         # 空行 (後でまとめて処理)
    # フッター部分で他の会員情報を示すパターン (フッター除去が確実なら不要かも)
    # r"^\s*会員No\.\d+｜未閲覧.*",
]

# --- 特定の完全一致フレーズ (行全体ではなく、部分一致でも除去したい場合など) ---
# 注意: 現在の実装では行単位での除去が主なので、これは使っていない
# PHRASES_TO_REMOVE_EXACT = [
#     "入力なし",
# ]

def clean_candidate_text(raw_text):
    """
    候補者の生テキストからヘッダー、フッター、不要な定型行を除去する関数。

    Args:
        raw_text (str): フロントエンドから受け取った生のテキスト全体。

    Returns:
        str: クレンジングされたテキスト。
    """
    if not isinstance(raw_text, str):
        return ""

    lines = raw_text.splitlines()
    cleaned_lines = []
    is_header = True  # 最初はヘッダー部分とみなす
    is_footer = False # フッター部分はまだ始まっていない
    header_removed_count = 0
    line_removed_count = 0
    footer_removed_count = 0

    for i, line in enumerate(lines):
        original_line = line
        line_to_check = line.strip()

        # --- ヘッダー処理 ---
        if is_header:
            # ヘッダー終了パターンに一致するかチェック
            if re.match(HEADER_END_PATTERN, line_to_check, re.IGNORECASE):
                print(f"Header end detected at line {i+1}: '{original_line}'")
                is_header = False # ヘッダー終了
                # この行自体は評価対象に含める (会員No.などは次の行除去で消える想定)
                # cleaned_lines.append(original_line) # 含めずに次のステップに進む
                # continue # 次の行の処理へ
            else:
                # まだヘッダー部分なので、この行は無視
                # print(f"Removing header line: '{original_line}'")
                header_removed_count += 1
                continue # 次の行へ

        # --- フッター処理 ---
        if not is_footer:
             # フッター開始パターンに一致するかチェック
            if re.match(FOOTER_START_PATTERN, line_to_check, re.IGNORECASE):
                print(f"Footer start detected at line {i+1}: '{original_line}'")
                is_footer = True # フッター開始
                # この行以降はすべて無視
                footer_removed_count += (len(lines) - i) # 残りの行数をカウント
                break # ループを抜ける

        # --- 本文の不要行除去処理 ---
        if not is_header and not is_footer:
            should_remove = False
            # 完全一致フレーズ除去 (今回は使わない)
            # if line_to_check in PHRASES_TO_REMOVE_EXACT:
            #     should_remove = True

            if not should_remove:
                # 行パターンで除去するかチェック
                for pattern in LINE_PATTERNS_TO_REMOVE:
                    if re.match(pattern, line_to_check, re.IGNORECASE):
                        # print(f"Removing line by pattern '{pattern}': '{original_line}'")
                        should_remove = True
                        line_removed_count += 1
                        break

            if not should_remove:
                # 空行でない、または直前が空行でない場合のみ追加 (連続空行をなくす)
                if line_to_check or (cleaned_lines and cleaned_lines[-1].strip()):
                     cleaned_lines.append(original_line)

    total_removed = header_removed_count + line_removed_count + footer_removed_count
    print(f"Cleaned text: Removed {total_removed} lines (Header: {header_removed_count}, Body: {line_removed_count}, Footer: {footer_removed_count}).")

    # クレンジング後の行を結合
    cleaned_text = "\n".join(cleaned_lines)

    # 最後に全体の不要な空白を除去
    return cleaned_text.strip()