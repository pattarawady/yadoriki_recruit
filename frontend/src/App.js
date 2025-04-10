// frontend/src/App.js (Final - Default Tailwind Colors)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './App.css'; // Base Tailwind is in index.css
import EvaluationDetails from './components/EvaluationDetails'; // Import the details component

// API URL Configuration (Remains the same)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
console.log("Using API Base URL:", API_BASE_URL);
let healthCheckUrl = '/';
if (API_BASE_URL.startsWith('http')) { try { const url = new URL(API_BASE_URL); healthCheckUrl = `${url.protocol}//${url.host}/`; } catch (e) { console.error("Could not parse API_BASE_URL for health check:", API_BASE_URL); } }
console.log("Using Health Check URL:", healthCheckUrl);

function App() {
  // --- States (No changes needed here from previous correct state) ---
  const [backendStatus, setBackendStatus] = useState({ connected: false, message: "接続確認中..." });
  const [inputText, setInputText] = useState('');
  const [resultsList, setResultsList] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null); // Use this for displaying details
  const [errorInfo, setErrorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // --- useEffect for health check (No changes needed) ---
  useEffect(() => {
    axios.get(healthCheckUrl)
      .then(response => {
        console.log("Health check successful, setting status..."); // Keep this for debugging
        setBackendStatus({ connected: true, message: response.data.message || "バックエンド接続済み" });
      })
      .catch(error => { console.error("Error fetching backend status:", error); setBackendStatus({ connected: false, message: "バックエンド接続失敗" }); });
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- useEffect for debugging selectedResult (Keep for now) ---
  useEffect(() => {
    console.log("Debug: selectedResult state updated:", selectedResult);
  }, [selectedResult]);

  // --- Event Handlers (handleInputChange, handleAnalyzeClick, handleExportClick, handleHistoryClick - No changes needed in logic) ---
  const handleInputChange = (event) => { setInputText(event.target.value); };

  const handleAnalyzeClick = async () => {
    if (!inputText.trim()) { alert("候補者情報を入力してください。"); return; }
    setIsLoading(true); setSelectedResult(null); setErrorInfo(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/evaluate`, { candidate_text: inputText });
      console.log("Response from backend:", response.data);
      if (response.data && response.data.gemini_evaluation && response.data.calculated_scores) {
        const newResult = response.data;
        setResultsList(prevList => [newResult, ...prevList]);
        setSelectedResult(newResult); // Set the new result as the one to display in detail
      } else {
        console.error("Unexpected response format from backend:", response.data);
        setErrorInfo({ message: "サーバーから予期しない形式のデータを受信しました。" });
      }
    } catch (error) {
      console.error("Error sending analysis request:", error);
      const errorResponse = error.response?.data?.error || error.response?.data?.details || "解析リクエスト失敗";
      setErrorInfo({ message: errorResponse, rawError: error.response?.data });
    } finally { setIsLoading(false); }
  };

  const handleExportClick = async () => {
    const exportData = resultsList;
    //const exportData = selectedResult ? [selectedResult] : resultsList; // Export selected or all
    if (exportData.length === 0) { alert("エクスポートする結果がありません。"); return; }
    console.log(`Exporting ${exportData.length} results as ${exportFormat}...`);
    try {
      const response = await axios.post(`${API_BASE_URL}/export`, { resultsList: exportData, format: exportFormat }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `evaluation_results.${exportFormat}`;
      if (contentDisposition) { /* ... filename extraction logic ... */ }
      console.log("Debug: Final filename for download:", filename);
      link.setAttribute('download', filename); document.body.appendChild(link); link.click(); link.parentNode.removeChild(link); window.URL.revokeObjectURL(url); console.log("Export successful!");
    } catch (error) { /* ... error handling ... */ }
  };

  const handleHistoryClick = (result) => {
     setSelectedResult(result);
      setErrorInfo(null); // Clear error when selecting from history
   };

  // --- Prepare data for rendering (No changes needed) ---
  const currentResult = errorInfo ? null : selectedResult;
  // We will pass gemini_evaluation part to EvaluationDetails
  const currentGeminiEvaluation = currentResult?.gemini_evaluation;
  const currentScores = currentResult?.calculated_scores;
  const currentCandidateId = currentResult?.gemini_evaluation?.candidate_identifier;


  // --- JSX Structure (Using Default Tailwind Colors) ---
  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">候補者評価アプリ</h1>
          <div className={`inline-flex items-center text-sm font-medium py-1 px-3 rounded-full ${backendStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${backendStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {backendStatus.message}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* --- Left Panel --- */}
          <div className="md:col-span-1 space-y-6">
            {/* Input Area */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">候補者情報を入力</h2>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-sm"
                rows="8"
                placeholder="候補者の詳細情報をここに貼り付け..."
                value={inputText}
                onChange={handleInputChange}
                disabled={isLoading}
              ></textarea>
              <button
                className={`mt-4 w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${isLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                onClick={handleAnalyzeClick}
                disabled={isLoading}
              >
                 <svg className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {!isLoading ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H4V4m.582 16H4v-5h.582m15.356-2a8.001 8.001 0 01-14.736 0H20v5h-.582" />
                    }
                 </svg>
                {isLoading ? '解析中...' : '解析する'}
              </button>
               {errorInfo && !isLoading && ( <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-300">{errorInfo.message}</p> )}
            </div>
            {/* Export Settings */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">結果をエクスポート</h2>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center cursor-pointer"> <input type="radio" name="exportType" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} /> <span className="ml-2 text-gray-700 text-sm">CSV</span> </label>
                <label className="flex items-center cursor-pointer"> <input type="radio" name="exportType" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" checked={exportFormat === 'md'} onChange={() => setExportFormat('md')} /> <span className="ml-2 text-gray-700 text-sm">Markdown</span> </label>
              </div>
              <button
                className={`w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${resultsList.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                onClick={handleExportClick}
                disabled={resultsList.length === 0}
              >
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                {exportFormat === 'csv' ? 'CSVでエクスポート' : 'Markdownでエクスポート'} ({resultsList.length}件)
              </button>
              <p className="mt-3 text-xs text-gray-500">※ CSVはExcelの「データ」タブ→「テキストまたはCSVから」でUTF-8指定で開いてください。</p>
            </div>
            {/* History */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">履歴</h2>
              {resultsList.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {resultsList.map((result, index) => {
                    const isSelected = selectedResult === result;
                    const identifier = result?.gemini_evaluation?.candidate_identifier || `結果 ${resultsList.length - index}`;
                    const score = result?.calculated_scores?.total_match_percentage;
                    return (
                      <div key={index} className={`pl-3 py-2 transition-colors rounded cursor-pointer border-l-4 ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'border-gray-300 hover:bg-gray-50'}`} onClick={() => handleHistoryClick(result)}>
                        <div className={`font-medium text-sm ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>{identifier}</div>
                        <div className="text-xs text-gray-600"> マッチ度: {score !== undefined ? `${score.toFixed(1)}%` : 'N/A'} </div>
                      </div> );
                  })}
                </div>
              ) : ( <p className="text-sm text-gray-500">解析履歴はありません。</p> )}
            </div>
          </div> {/* End Left Panel */}

          {/* --- Right Panel - Analysis Results --- */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 min-h-[600px]">
              <h2 className="text-xl font-bold mb-6 text-gray-800"> {selectedResult ? '分析結果' : '解析を実行するか履歴を選択してください'} </h2>

              {isLoading && <p className="text-center text-gray-500">解析中...</p>}
              {errorInfo && !isLoading && <p className="text-red-600 bg-red-50 p-3 rounded-md border border-red-300">{errorInfo.message}</p>}

              {/* ▼▼▼ selectedResult を使って表示を制御 ▼▼▼ */}
              {selectedResult && !isLoading && !errorInfo && (
                <>
                  {/* Match Score Display */}
                  <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-indigo-800">
                         マッチ度: <span className="text-xl text-indigo-600 font-bold">{currentScores?.total_match_percentage?.toFixed(1) ?? '---'}%</span>
                      </h3>
                      <span className="text-sm font-medium text-gray-600">{currentCandidateId || '---'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"> <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${currentScores?.total_match_percentage ?? 0}%`}}></div> </div>
                  </div>

                  {/* Evaluation Details Component Call */}
                  {/* selectedResult.gemini_evaluation が存在するか確認 */}
                  {selectedResult.gemini_evaluation ? (
                    // EvaluationDetails コンポーネントを呼び出す
                    <EvaluationDetails evaluationData={selectedResult.gemini_evaluation} />
                  ) : (
                    <p className="text-sm text-gray-500">評価の詳細データがありません。</p>
                  )}

                  {/* Overall Comment (EvaluationDetailsに移しても良い) */}
                  {/* {selectedResult.gemini_evaluation?.overall_comment && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">全体コメント</h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed">
                        {selectedResult.gemini_evaluation.overall_comment}
                      </div>
                    </div>
                  )} */}
                </>
              )}
              {/* ▲▲▲ selectedResult を使って表示を制御 ▲▲▲ */}

            </div>
          </div> {/* End Right Panel */}
        </div> {/* End Grid */}
      </div> {/* End Max Width Container */}
    </div> // End App
  );
}

export default App;