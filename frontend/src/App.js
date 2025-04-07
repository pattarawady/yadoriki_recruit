import React, { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート

function App() {
  const [message, setMessage] = useState("Loading backend status...");

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

  return (
    <div>
      <h1>Candidate Evaluator App</h1>
      <p>Backend Status: {message}</p>
      {/* ここに今後テキストエリアやダッシュボードを追加していく */}
    </div>
  );
}

export default App;