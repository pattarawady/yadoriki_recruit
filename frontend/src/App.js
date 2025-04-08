// frontend/src/App.js (State確認・表示修正版)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import EvaluationDetails from './components/EvaluationDetails';

function App() {
  const [message, setMessage] = useState("Loading backend status...");
  const [inputText, setInputText] = useState('');
  const [resultsList, setResultsList] = useState([]);
  const [latestResult, setLatestResult] = useState(null); // 最新の結果データ全体
  const [errorInfo, setErrorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // --- Backend health check (初回のみ) ---
  useEffect(() => {
    axios.get('/')
      .then(response => { setMessage(response.data.message || "Backend connected!"); })
      .catch(error => { console.error("Error fetching backend status:", error); setMessage("Failed to connect to backend."); });
  }, []);

  // --- ★★★ デバッグ用: latestResult の変化を監視 ★★★ ---
  useEffect(() => {
    // このログで latestResult が API 応答後に更新されるか確認
    console.log("Debug: latestResult state updated:", latestResult);
  }, [latestResult]); // latestResult が変化した時だけ実行
  // --- ★★★ デバッグ用ここまで ★★★ ---


  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleAnalyzeClick = async () => {
    console.log("Analyze button clicked!");
    if (!inputText.trim()) { alert("Please enter some text to analyze."); return; }

    setIsLoading(true);
    setLatestResult(null); // 表示をクリア
    setErrorInfo(null);    // エラーをクリア

    try {
      const response = await axios.post('/api/evaluate', { candidate_text: inputText });
      console.log("Response from backend:", response.data);

      // レスポンスが期待通りか簡単なチェック (念のため)
      if (response.data && response.data.gemini_evaluation && response.data.calculated_scores) {
        // 正常なレスポンスの場合
        const newResult = response.data; // 受け取ったデータ全体
        setResultsList(prevList => [newResult, ...prevList]); // リストの先頭に追加
        setLatestResult(newResult); // 最新結果として設定
      } else {
        // バックエンドからの応答形式が予期せぬものだった場合
        console.error("Unexpected response format from backend:", response.data);
        setErrorInfo({ message: "Received unexpected data format from server." });
        alert("Error: Received unexpected data format.");
      }

    } catch (error) {
      console.error("Error sending analysis request:", error);
      const errorResponse = error.response?.data?.error || error.response?.data?.details || "Analysis request failed.";
      setErrorInfo({ message: errorResponse, rawError: error.response?.data });
      alert(`Error: ${errorResponse}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportClick = async () => {
    if (resultsList.length === 0) { alert("No results to export."); return; }
    console.log(`Exporting ${resultsList.length} results as ${exportFormat}...`);

    try {
      const response = await axios.post('/api/export',
        { resultsList: resultsList, format: exportFormat },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `evaluation_results.${exportFormat}`; // デフォルトファイル名
      if (contentDisposition) {
        // ▼▼▼ 正規表現を修正 ▼▼▼
        // filename="([^"]+)" または filename=([^;]+) のパターンにマッチさせる
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?(?:;|$)/i);
        // ▲▲▲ 正規表現を修正 ▲▲▲
        if (filenameMatch && filenameMatch[1]) {
          // filenameMatch[1] にファイル名本体が入る
          filename = filenameMatch[1];
          // デコードが必要な場合 (例: UTF-8 でエンコードされている場合など filename*=UTF-8''...)
          // filename = decodeURIComponent(filename); // 必要に応じてデコード
        } else {
            // 別の形式 (filename=...) も試す (より簡易なパターン)
            const fallbackMatch = contentDisposition.match(/filename=([^;]+)/i);
            if (fallbackMatch && fallbackMatch[1]){
                 filename = fallbackMatch[1];
                 // こちらは通常デコード不要
            }
        }
      }
      console.log("Debug: Final filename for download:", filename);
      link.setAttribute('download', filename); // クリーンなファイル名を設定
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("Export successful!");

    } catch (error) {
      console.error("Error exporting results:", error);
       if (error.response && error.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = function() {
              try {
                  const errorJson = JSON.parse(reader.result);
                  alert(`Export Error: ${errorJson.error || 'Unknown error'}`);
              } catch (parseError) {
                  alert('Export Error: Failed to parse error response blob.');
              }
          }
          reader.onerror = function() { alert('Export Error: Could not read error response blob.'); }
          reader.readAsText(error.response.data);
      } else if (error.response && error.response.data) {
          alert(`Export Error: ${error.response.data.error || 'Server error occurred.'}`);
      }
       else { alert("An error occurred during export."); }
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Candidate Evaluator App</h1>
      <p>Backend Status: {message}</p>

      {/* 入力エリア */}
      <div>
        <h2>Enter Candidate Information:</h2>
        <textarea rows="10" cols="80" value={inputText} onChange={handleInputChange} placeholder="Paste candidate details here..." disabled={isLoading} style={{ width: '90%', maxWidth: '600px', padding: '10px' }}/>
      </div>
      {/* 解析ボタン */}
      <div>
        <button onClick={handleAnalyzeClick} disabled={isLoading} style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer' }}> {isLoading ? 'Analyzing...' : '解析 (Analyze)'} </button>
      </div>

      {/* --- エクスポートUI --- */}
      {resultsList.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', background: '#fff', maxWidth: '600px' }}>
          <h3>Export Results</h3>
          <div style={{ marginBottom: '10px' }}>
            {/* ラジオボタン (変更なし) */}
            <label style={{ marginRight: '10px' }}> <input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value)} /> CSV </label>
            <label> <input type="radio" value="md" checked={exportFormat === 'md'} onChange={(e) => setExportFormat(e.target.value)} /> Markdown </label>
          </div>
          <button onClick={handleExportClick} style={{ padding: '8px 15px', marginBottom: '10px' }}> {/* ボタン下に少しマージン追加 */}
            Export {resultsList.length} Result(s) as {exportFormat.toUpperCase()}
          </button>
          {/* ▼▼▼ 注釈を追加 ▼▼▼ */}
          <p style={{ fontSize: '0.8em', color: '#666', margin: 0 }}>
            ※ CSVファイルをExcelで開く際に文字化けする場合は、「データ」タブ → 「テキストまたはCSVから」を選択し、ファイルを開く際のエンコードで「65001: Unicode (UTF-8)」を指定してください。
          </p>
          {/* ▲▲▲ 注釈を追加 ▲▲▲ */}
        </div>
      )}
      {/* --- エクスポートUI --- */}

      {/* --- 解析結果表示エリア --- */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '20px', marginTop: '30px' }}>
         {/* 右側: 最新の結果詳細表示 */}
         <div style={{ flex: 2, padding: '15px', border: '1px solid #ddd', borderRadius: '5px', background: '#f8f8f8', minWidth: '400px' }}>
            <h2>Latest Analysis Result:</h2>
            {isLoading && <p>Analyzing...</p>}
            {/* ▼▼▼ エラー表示を errorInfo state から行うように修正 ▼▼▼ */}
            {errorInfo && ( <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorInfo.message}</p> )}
            {/* ▲▲▲ エラー表示修正 ▲▲▲ */}

            {/* ▼▼▼ latestResult が存在し、エラーがない場合に詳細を表示 ▼▼▼ */}
            {latestResult && !errorInfo && (
              <>
                {/* 総合スコア表示 */}
                {latestResult.calculated_scores && typeof latestResult.calculated_scores.total_match_percentage === 'number' ? (
                  <div style={{ marginBottom: '15px', padding: '10px', background: '#e0f7fa', borderRadius: '4px' }}>
                    <p style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0, color: '#00796b' }}>
                      マッチ度: {latestResult.calculated_scores.total_match_percentage.toFixed(1)} %
                    </p>
                  </div>
                ) : (
                  <p>Score not calculated.</p>
                )}

                {/* EvaluationDetails コンポーネント呼び出し */}
                {/* gemini_evaluation データが存在するか確認してから渡す */}
                {latestResult.gemini_evaluation ? (
                  <EvaluationDetails evaluationData={latestResult.gemini_evaluation} />
                ) : (
                  <p>No detailed evaluation data available in the result.</p>
                )}
              </>
            )}
            {/* ▲▲▲ 表示条件ここまで ▲▲▲ */}

            {/* 初期状態または結果がない場合の表示 */}
            {!latestResult && !errorInfo && !isLoading && (
               <p>No analysis performed yet, or no results available.</p>
            )}
         </div>

         {/* 左側: 過去の結果リスト */}
         {resultsList.length > 0 && (
             <div style={{ flex: 1, padding: '15px', border: '1px solid #eee', borderRadius: '5px', background: '#fff', maxHeight: '600px', overflowY: 'auto' }}>
                <h2>History:</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {resultsList.map((result, index) => (
                    <li key={index} style={{ borderBottom: '1px dashed #ccc', padding: '10px 0', cursor: 'pointer' }}
                        onClick={() => { setLatestResult(result); setErrorInfo(null); }} // クリックで詳細表示 + エラー解除
                    >
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        {/* null チェックを追加 */}
                        {result?.gemini_evaluation?.candidate_identifier || `Result ${resultsList.length - index}`}
                      </p>
                      {/* null チェックを追加 */}
                      {result?.calculated_scores && typeof result.calculated_scores.total_match_percentage === 'number' ? (
                         <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>
                           Score: {result.calculated_scores.total_match_percentage.toFixed(1)} %
                         </p>
                      ) : (
                         <p style={{ margin: 0, fontSize: '0.9em', color: 'red' }}>Score N/A</p>
                      )}
                    </li>
                  ))}
                </ul>
             </div>
         )}
       </div>
      {/* --- 解析結果表示エリア --- */}
    </div>
  );
}

export default App;