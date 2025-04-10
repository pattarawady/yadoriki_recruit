// frontend/src/App.js (Default Tailwind Colors)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './App.css'; // Tailwindを使うので基本的には不要
// import EvaluationDetails from './components/EvaluationDetails'; // 必要ならインポート

// API URL設定 (変更なし)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
console.log("Using API Base URL:", API_BASE_URL);
let healthCheckUrl = '/';
if (API_BASE_URL.startsWith('http')) { try { const url = new URL(API_BASE_URL); healthCheckUrl = `${url.protocol}//${url.host}/`; } catch (e) { /* ... */ } }
console.log("Using Health Check URL:", healthCheckUrl);

// カテゴリ/項目ラベル (変更なし)
const evaluationCategories = [ /* ... */ ];
const itemLabels = { /* ... */ };

// 評価記号の表示 (色クラスをデフォルトに戻す)
const getRatingDisplay = (symbol) => {
  switch (symbol) {
    // ▼▼▼ Tailwindのデフォルトカラーに戻す ▼▼▼
    case '◎': return { textClass: 'text-green-600', icon: '✓✓', label: 'Excellent' };
    case '〇': return { textClass: 'text-yellow-600', icon: '✓', label: 'Good' };
    case '△': return { textClass: 'text-gray-500', icon: '~', label: 'Fair' };
    case '×': return { textClass: 'text-red-600', icon: '✕', label: 'Poor' };
    default: return { textClass: 'text-gray-400', icon: '-', label: 'N/A' };
    // ▲▲▲ デフォルトカラーに戻す ▲▲▲
  }
};


function App() {
  const [backendStatus, setBackendStatus] = useState({ connected: false, message: "接続確認中..." });
  const [inputText, setInputText] = useState('');
  const [resultsList, setResultsList] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // --- useEffect, handleInputChange, handleAnalyzeClick, handleExportClick, handleHistoryClick は変更なし ---
  useEffect(() => { /* ... */ }, []);
  // useEffect(() => { console.log("Debug: selectedResult state updated:", selectedResult); }, [selectedResult]);
  const handleInputChange = (event) => { setInputText(event.target.value); };
  const handleAnalyzeClick = async () => { /* ... */ };
  const handleExportClick = async () => { /* ... */ };
  const handleHistoryClick = (result) => { setSelectedResult(result); setErrorInfo(null); };

  // --- 表示用データ準備 (変更なし) ---
  const currentResult = errorInfo ? null : selectedResult;
  const currentEvaluation = currentResult?.gemini_evaluation?.evaluation;
  const currentScores = currentResult?.calculated_scores;
  const currentCandidateId = currentResult?.gemini_evaluation?.candidate_identifier;
  const currentOverallComment = currentResult?.gemini_evaluation?.overall_comment;


  // --- ▼▼▼ JSX部分のTailwindクラスをデフォルトカラーベースに戻す ▼▼▼ ---
  return (
    // 背景を明るいグレーに、文字をデフォルト(黒系)に
    <div className="bg-gray-100 text-gray-800 min-h-screen p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー (文字色など調整) */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">候補者評価アプリ</h1>
          <div className={`inline-flex items-center text-sm font-medium py-1 px-3 rounded-full ${backendStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${backendStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {backendStatus.message}
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* --- 左側パネル --- */}
          <div className="md:col-span-1 space-y-6">
            {/* 候補者情報入力 (背景白、枠線グレー) */}
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
                 {/* ... SVG ... */}
                 <svg className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">...</svg>
                {isLoading ? '解析中...' : '解析する'}
              </button>
               {errorInfo && !isLoading && ( <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-300">{errorInfo.message}</p> )}
            </div>
            {/* エクスポート設定 (背景白、ボタン色など) */}
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
                 {/* ... SVG ... */}
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">...</svg>
                {exportFormat === 'csv' ? 'CSVでエクスポート' : 'Markdownでエクスポート'} ({resultsList.length}件)
              </button>
              <p className="mt-3 text-xs text-gray-500">※ CSVはExcelの「データ」タブ→「テキストまたはCSVから」でUTF-8指定で開いてください。</p>
            </div>
            {/* 履歴 (背景白、選択色など) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">履歴</h2>
              {resultsList.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {resultsList.map((result, index) => {
                    const isSelected = selectedResult === result;
                    const identifier = result?.gemini_evaluation?.candidate_identifier || `結果 ${resultsList.length - index}`;
                    const score = result?.calculated_scores?.total_match_percentage;
                    return (
                      <div
                        key={index}
                        className={`pl-3 py-2 transition-colors rounded cursor-pointer border-l-4 ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'border-gray-300 hover:bg-gray-50'}`} // 色をデフォルトに
                        onClick={() => handleHistoryClick(result)}
                      >
                        <div className={`font-medium text-sm ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>{identifier}</div>
                        <div className="text-xs text-gray-600">
                          マッチ度: {score !== undefined ? `${score.toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : ( <p className="text-sm text-gray-500">解析履歴はありません。</p> )}
            </div>
          </div>
          {/* --- 右側パネル - 分析結果 --- */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 min-h-[600px]">
              <h2 className="text-xl font-bold mb-6 text-gray-800"> {currentResult ? '分析結果' : '解析を実行してください'} </h2>
              {isLoading && <p className="text-center text-gray-500">解析中...</p>}
              {errorInfo && !isLoading && <p className="text-red-600 bg-red-50 p-3 rounded-md border border-red-300">{errorInfo.message}</p>}

              {currentResult && !isLoading && !errorInfo && (
                <>
                  {/* マッチ度表示 (背景色、文字色など) */}
                  <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-indigo-800">
                         マッチ度: <span className="text-xl text-indigo-600 font-bold">{currentScores?.total_match_percentage?.toFixed(1) ?? '---'}%</span>
                      </h3>
                      <span className="text-sm font-medium text-gray-600">{currentCandidateId || '---'}</span>
                    </div>
                    {/* プログレスバー */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${currentScores?.total_match_percentage ?? 0}%`}}></div>
                    </div>
                  </div>

                  {/* --- 評価詳細テーブル (色クラスを getRatingDisplay で自動適用) --- */}
                  {currentEvaluation ? (
                    evaluationCategories.map(category => {
                      const items = currentEvaluation[category.dataKey];
                      return items && Object.keys(items).length > 0 ? (
                        <div className="mb-6" key={category.key}>
                          <h3 className="text-lg font-semibold mb-3 text-gray-700">{category.label}</h3>
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">評価項目</th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">評価</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(items).map(([itemKey, details]) => {
                                  const displayInfo = getRatingDisplay(details?.symbol); // 色クラス取得
                                  return (
                                    <tr key={`${category.key}-${itemKey}`}>
                                      <td className="px-4 py-3 text-sm text-gray-900">{itemLabels[itemKey] || itemKey}</td>
                                      <td className={`px-4 py-3 text-center font-bold ${displayInfo.textClass}`}> {/* 色クラス適用 */}
                                        {displayInfo.icon}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">{details?.reason || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null;
                    })
                  ) : ( <p className="text-sm text-gray-500">評価の詳細データがありません。</p> )}

                  {/* 全体コメント (背景色、文字色) */}
                  {currentOverallComment && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">全体コメント</h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed">
                        {currentOverallComment}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div> {/* grid */}
      </div> {/* max-w-5xl */}
    </div> // App
  );
}

export default App;