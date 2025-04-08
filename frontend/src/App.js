// frontend/src/App.js (新しい内容)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // デフォルトのCSSをインポート (任意)

function App() {
  const [message, setMessage] = useState("Loading backend status...");
  const [inputText, setInputText] = useState(''); // テキストエリア用の状態を追加
  const [analysisResult, setAnalysisResult] = useState(null); // 解析結果表示用 (今はまだ使わない)
  const [isLoading, setIsLoading] = useState(false); // ローディング状態

  useEffect(() => {
    // バックエンドのヘルスチェックAPIを叩く
    axios.get('/') // package.jsonのproxy設定により '/api' などを付けずに済む
      .then(response => {
        setMessage(response.data.message || "Backend connected!");
      })
      .catch(error => {
        console.error("Error fetching backend status:", error);
        setMessage("Failed to connect to backend.");
      });
  }, []); // 初回レンダリング時にのみ実行

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  // ▼▼▼ この関数の中身を確認・修正 ▼▼▼
  const handleAnalyzeClick = async () => { // async を追加
    console.log("Analyze button clicked!");
    console.log("Input Text:", inputText);

    if (!inputText.trim()) {
        alert("Please enter some text to analyze.");
        return;
    }

    setIsLoading(true); // ローディング開始
    setAnalysisResult(null); // 前回の結果をクリア

    try {
      // --- ここがバックエンドへの通信部分 ---
      // axios を使って、バックエンドの /api/evaluate に POST リクエストを送る
      // 第2引数がリクエストボディ (送るデータ)
      const response = await axios.post('/api/evaluate', {
        candidate_text: inputText // { "candidate_text": "入力されたテキスト" } というJSONを送る
      });
      // --- ここまで ---

      console.log("Response from backend:", response.data); // コンソールに応答を表示
      setAnalysisResult(response.data); // <<< 応答を状態に保存して画面表示に使う
      // alert("Analysis request sent! Response received."); // alertは毎回出すと邪魔なのでコメントアウトしても良い

    } catch (error) {
      console.error("Error sending analysis request:", error);
      setAnalysisResult({ error: "Analysis failed." }); // エラー情報を保存
      if (error.response) {
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        alert(`Error: ${error.response.data.error || 'Failed to analyze.'}`);
      } else {
        alert("An error occurred while sending the request.");
      }
    } finally {
        setIsLoading(false); // ローディング終了 (成功しても失敗しても)
    }
  };
  // ▲▲▲ ここまで確認・修正 ▲▲▲

  return (
    <div className="App">
      <h1>Candidate Evaluator App</h1>
      <p>Backend Status: {message}</p>

      <div>
        <h2>Enter Candidate Information:</h2>
        <textarea
          rows="10"
          cols="80"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Paste candidate details here..."
          disabled={isLoading} // ローディング中は入力不可に
        />
      </div>
      <div>
        {/* ボタンの表示と無効化をローディング状態で切り替え */}
        <button onClick={handleAnalyzeClick} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : '解析 (Analyze)'}
        </button>
      </div>

      {/* ▼▼▼ 解析結果表示エリア ▼▼▼ */}
      {/* analysisResult に何か値が入ったら表示する */}
      {analysisResult && (
          <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', background: '#f9f9f9' }}>
              <h2>Analysis Result:</h2>
              {/* もし結果に error プロパティがあればエラー表示 */}
              {analysisResult.error ? (
                  <p style={{ color: 'red' }}>Error: {analysisResult.error}</p>
              ) : (
                  // なければ、受け取ったデータをそのまま整形して表示 (preタグは整形済みテキスト表示に便利)
                  // 今はバックエンドが送ったテキストをエコーバックしてるだけ
                  <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
              )}
          </div>
      )}
      {/* ▲▲▲ 解析結果表示エリア ▲▲▲ */}

    </div>
  );
}

export default App;