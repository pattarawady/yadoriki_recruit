# backend/app/services/gemini_service.py
import google.generativeai as genai
import os
import json # GeminiからのJSON応答を扱うためにインポートしておく

# --- APIキーの設定 ---
# .envファイルからAPIキーを読み込む。
# run.pyで load_dotenv() が実行されているので、ここでは os.environ.get で取得できる
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    # APIキーが設定されていない場合はエラーメッセージを表示して、処理を続行しないようにする
    # (実際にはアプリケーション起動時にチェックする方がより堅牢)
    print("Error: GEMINI_API_KEY environment variable not set.")
    # raise ValueError("GEMINI_API_KEY environment variable not set.") # エラーを発生させて停止させることも可能
else:
    try:
        # 取得したAPIキーを使ってGeminiクライアントを設定
        genai.configure(api_key=api_key)
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        # ここでもエラー処理を追加できる

# --- 使用するモデルの準備 (例: gemini-pro) ---
# ここで使うモデルを指定しておく。後で変更も可能。
# generation_config や safety_settings もここで設定できる
model = genai.GenerativeModel(
    'gemini-2.5-pro-exp-03-25',
    # 例: safety_settings=[ # コンテンツフィルターの設定 (必要に応じて調整)
    #     {
    #         "category": "HARM_CATEGORY_HARASSMENT",
    #         "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    #     },
    #     {
    #         "category": "HARM_CATEGORY_HATE_SPEECH",
    #         "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    #     },
    # ]
    )
print("Gemini Model (gemini-2.5-pro-exp-03-25) initialized.")


# backend/app/services/gemini_service.py 内

# --- 評価を実行する関数を修正 ---
def evaluate_with_gemini(prompt, candidate_text):
    """
    候補者テキストとプロンプトを使ってGemini APIで評価を行う関数
    Args:
        prompt (str): Geminiに送る完全な指示（JSON出力指示を含む）
        candidate_text (str): 評価対象の候補者情報テキスト
    Returns:
        dict or None: 評価結果のJSONオブジェクト、またはエラー時はNone
    """
    print(f"\n--- Evaluating with Gemini ---")
    print(f"Prompt starts with: {prompt[:100]}...")
    print(f"Candidate text starts with: {candidate_text[:100]}...")

    # --- ★★★ ここからが実際のAPI呼び出し ★★★ ---
    # Geminiに渡す最終的なテキストコンテンツを作成
    # プロンプトに加えて、評価対象のテキストも明確に渡す
    full_content_for_gemini = f"{prompt}\n\n## Candidate Information:\n```\n{candidate_text}\n```\n\n## Evaluation Output (JSON):\n"

    try:
        # model.generate_content を使ってAIにコンテンツ生成をリクエスト
        # stream=False で、応答全体を一度に受け取る
        print("Sending request to Gemini API...")
        response = model.generate_content(
            full_content_for_gemini,
            # generation_config={'response_mime_type': 'application/json'} # ← これが使えると便利だが、
            #                                                              # モデルやライブラリバージョンによるかも。
            #                                                              # まずはテキストでJSONを取得する想定で進める。
            )
        print("Received response from Gemini API.")

        # --- レスポンスの処理 ---
        # response.text で、AIが生成したテキスト全体を取得
        generated_text = response.text

        # デバッグ用に、AIが返した生のテキストを表示してみる
        print("\n--- Raw response text from Gemini ---")
        print(generated_text)
        print("--- End of raw response text ---")

        # AIが指示通りJSONだけを返してくれているか確認し、パースする
        # 応答テキストの最初と最後にある ```json ... ``` を探して中身を取り出す
        try:
            # ```json と ``` で囲まれた部分を探す
            json_block_match = generated_text.split('```json\n', 1)
            if len(json_block_match) > 1:
                json_content = json_block_match[1].split('\n```', 1)[0]
                # JSON文字列をPythonの辞書オブジェクトに変換（パース）
                result_json = json.loads(json_content)
                print("Successfully parsed JSON response from Gemini.")
                return result_json # パース成功したら辞書を返す
            else:
                # ```json が見つからない場合 (予期しない形式)
                print("Error: Could not find ```json block in Gemini response.")
                print("Trying to parse the whole text as JSON (might fail)...")
                # ダメ元で全体をパースしてみる（失敗する可能性が高い）
                try:
                    result_json = json.loads(generated_text)
                    print("Parsed the whole text as JSON.")
                    return result_json
                except json.JSONDecodeError:
                    print("Error: Failed to parse the whole text as JSON.")
                    return {"error": "Gemini returned non-JSON response", "raw_response": generated_text}

        except json.JSONDecodeError as e:
            # JSONパースに失敗した場合
            print(f"Error: Failed to parse JSON from Gemini response: {e}")
            # エラー情報と生の応答を返す
            return {"error": "Failed to parse JSON response", "raw_response": generated_text}
        except Exception as e:
             # JSONブロックの抽出などで予期せぬエラー
             print(f"Error processing Gemini response: {e}")
             return {"error": "Error processing Gemini response", "raw_response": generated_text}

    except Exception as e:
        # API呼び出し自体でエラーが発生した場合
        print(f"Error during Gemini API call: {e}")
        # (より詳細なエラーハンドリングが必要な場合もある)
        return None # エラー発生時は None を返す (APIルート側で500エラーにする)
    # --- ★★★ ここまでが実際のAPI呼び出し ★★★ ---

def build_evaluation_prompt(criteria_prompt):
     """
     評価基準のプロンプトを受け取り、Geminiへの完全な指示を組み立てる関数（予定）
     Args:
         criteria_prompt (str): ユーザー定義の評価基準プロンプト
     Returns:
         str: Geminiに渡す最終的なプロンプト文字列
     """
     # 重要：ここでGeminiにJSON形式で応答するように明確に指示する！
     json_output_instruction = """
---
Output the evaluation result strictly in the following JSON format. Do not include any other text before or after the JSON object.

```json
{
  "evaluation": {
    "required": {
      "age": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"},
      "side_job": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"},
      "outsourcing": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"}
    },
    "preferred": {
      "experience": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"},
      "management_level": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"}
    },
    "other": {
      "job_change_desire": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"},
      "adaptability": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"},
      "teamwork": {"symbol": "評価記号(◎〇△×)", "reason": "評価理由"}
    }
  },
  "candidate_identifier": "候補者の名前や識別子 (抽出できれば)",
  "overall_comment": "全体的な所見やコメント"
}
"""
     # ユーザー定義の評価基準とJSON出力指示を組み合わせる
     full_prompt = f"{criteria_prompt}\n{json_output_instruction}"
     return full_prompt


