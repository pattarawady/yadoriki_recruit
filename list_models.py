# list_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# --- .env ファイルから API キーを読み込む ---
# このスクリプトはプロジェクトルートにあるので、そのまま .env を読み込める
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file.")
    print("Please make sure the .env file exists in the project root and contains your API key.")
else:
    print("API Key found. Configuring Gemini API...")
    try:
        # --- Gemini API を設定 ---
        genai.configure(api_key=api_key)

        print("\nFetching available models...")
        print("--------------------------------------------------")
        print("Models supporting 'generateContent' method:")
        print("--------------------------------------------------")

        # --- 利用可能なモデルのリストを取得して表示 ---
        model_found = False
        for m in genai.list_models():
            # このAPIキーで generateContent (テキスト生成) が使えるモデルのみ表示
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}") # <<< これが正式なモデルID（識別子）です
                model_found = True

        if not model_found:
            print("No models supporting 'generateContent' found for your API key.")
            print("Please check your API key permissions or available models in Google AI Studio / Cloud Console.")

        print("--------------------------------------------------")

    except Exception as e:
        print(f"\nAn error occurred:")
        print(e)
        print("\nPlease check your API key, internet connection, and project setup in Google Cloud Console (if applicable).")