// frontend/src/App.js (Tailwind CSS 適用 - マッチングアプリ風)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './App.css'; // Tailwindを使うので App.css は不要になるかも or 基本スタイルのみ残す
// import EvaluationDetails from './components/EvaluationDetails'; // テーブル部分は App.js 内で実装

// カテゴリキーと表示名、データ構造キーのマッピング
const evaluationCategories = [
  { key: 'required', label: '必須条件', dataKey: 'required' },
  { key: 'preferred', label: '優遇条件', dataKey: 'preferred' },
  { key: 'other', label: 'その他評価ポイント', dataKey: 'other' },
  // サンプルコードに合わせるなら strengths, considerations などに再分類が必要
];

// 項目キーと表示名のマッピング (EvaluationDetailsから持ってくる)
const itemLabels = {
  age: '年齢', side_job: '副業', outsourcing: '業務委託',
  experience: '旅館・ホテル経験', management_level: '役職レベル (アラサー時)',
  job_change_desire: '転職希望', adaptability: '適応力', teamwork: 'チームワーク',
};

// 評価記号に応じたTailwindクラスとアイコン(仮)を返す関数
const getRatingDisplay = (symbol) => {
  switch (symbol) {
    case '◎': return { textClass: 'text-green-600', icon: '✓✓', label: 'Excellent' }; // ✓✓ or ★★★ etc.
    case '〇': return { textClass: 'text-yellow-600', icon: '✓', label: 'Good' };   // ✓ or ★★☆ etc.
    case '△': return { textClass: 'text-gray-500', icon: '~', label: 'Fair' };      // ~ or ★☆☆ etc.
    case '×': return { textClass: 'text-red-600', icon: '✕', label: 'Poor' };       // ✕ or ☆☆☆ etc.
    default: return { textClass: 'text-gray-400', icon: '-', label: 'N/A' };
  }
};


function App() {
  const [backendStatus, setBackendStatus] = useState({ connected: false, message: "接続確認中..." }); // バックエンド接続状態
  const [inputText, setInputText] = useState('');
  const [resultsList, setResultsList] = useState([]); // 履歴用
  const [selectedResult, setSelectedResult] = useState(null); // 詳細表示用
  const [errorInfo, setErrorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // --- バックエンド接続確認 ---
  useEffect(() => {
    axios.get('/')
      .then(response => { setBackendStatus({ connected: true, message: "バックエンド接続済み" }); })
      .catch(error => { console.error("Error fetching backend status:", error); setBackendStatus({ connected: false, message: "バックエンド接続失敗" }); });
  }, []);

  // --- 解析処理 ---
  const handleAnalyzeClick = async () => {
    if (!inputText.trim()) { alert("候補者情報を入力してください。"); return; }
    setIsLoading(true); setSelectedResult(null); setErrorInfo(null);
    try {
      const response = await axios.post('/api/evaluate', { candidate_text: inputText });
      if (response.data && response.data.gemini_evaluation && response.data.calculated_scores) {
        const newResult = response.data;
        setResultsList(prevList => [newResult, ...prevList]);
        setSelectedResult(newResult); // 解析直後は最新結果を選択状態にする
      } else {
        setErrorInfo({ message: "サーバーから予期しない形式のデータを受信しました。" });
      }
    } catch (error) {
      const errorResponse = error.response?.data?.error || error.response?.data?.details || "解析リクエスト失敗";
      setErrorInfo({ message: errorResponse, rawError: error.response?.data });
      alert(`エラー: ${errorResponse}`);
    } finally { setIsLoading(false); }
  };

   // --- エクスポート処理 ---
  const handleExportClick = async () => {
    const exportData = selectedResult ? [selectedResult] : resultsList; // 選択中の結果 or 全履歴
    if (exportData.length === 0) { alert("エクスポートする結果がありません。"); return; }
    console.log(`Exporting ${exportData.length} results as ${exportFormat}...`);
    // ... (以前のexportロジックを流用 ...）
    try {
      const response = await axios.post('/api/export', { resultsList: exportData, format: exportFormat }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `evaluation_results.${exportFormat}`;
      if (contentDisposition) { /* ... filename抽出ロジック ... */ }
      link.setAttribute('download', filename); document.body.appendChild(link); link.click(); link.parentNode.removeChild(link); window.URL.revokeObjectURL(url); console.log("Export successful!");
    } catch (error) { /* ... エラー処理 ... */ }
  };

  // --- 履歴クリック処理 ---
  const handleHistoryClick = (result) => {
    setSelectedResult(result);
    setErrorInfo(null); // 詳細表示を切り替えたらエラーは消す
  };

  // --- 表示用データ準備 ---
  const currentResult = errorInfo ? null : selectedResult; // エラー時は詳細表示しない
  const currentEvaluation = currentResult?.gemini_evaluation?.evaluation;
  const currentScores = currentResult?.calculated_scores;
  const currentCandidateId = currentResult?.gemini_evaluation?.candidate_identifier;
  const currentOverallComment = currentResult?.gemini_evaluation?.overall_comment;


  return (
    // Tailwindクラスを適用していく
    <div className="bg-gray-50 min-h-screen p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">候補者評価アプリ</h1>
          <div className={`inline-flex items-center text-sm font-medium py-1 px-3 rounded-full ${backendStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${backendStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {backendStatus.message}
          </div>
        </header>

        {/* メインコンテンツ (Gridレイアウト) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* --- 左側パネル --- */}
          <div className="md:col-span-1 space-y-6">
            {/* 候補者情報入力 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">候補者情報を入力</h2>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-sm" // text-sm追加
                rows="8" // 少し増やす
                placeholder="候補者の詳細情報をここに貼り付け..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
              ></textarea>
              <button
                className={`mt-4 w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${isLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                onClick={handleAnalyzeClick}
                disabled={isLoading}
              >
                {/* SVGアイコン (サンプルから拝借) */}
                <svg className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   {!isLoading ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                   : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H4V4m.582 16H4v-5h.582m15.356-2a8.001 8.001 0 01-14.736 0H20v5h-.582" /> // ローディングアイコン例
                   }
                </svg>
                {isLoading ? '解析中...' : '解析する'}
              </button>
               {/* エラー表示 */}
               {errorInfo && !isLoading && (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{errorInfo.message}</p>
                )}
            </div>

            {/* エクスポート設定 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">結果をエクスポート</h2>
              <div className="flex gap-4 mb-4">
                 {/* ラジオボタン */}
                <label className="flex items-center cursor-pointer"> <input type="radio" name="exportType" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} /> <span className="ml-2 text-gray-700 text-sm">CSV</span> </label>
                <label className="flex items-center cursor-pointer"> <input type="radio" name="exportType" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" checked={exportFormat === 'md'} onChange={() => setExportFormat('md')} /> <span className="ml-2 text-gray-700 text-sm">Markdown</span> </label>
              </div>
              <button
                className={`w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${resultsList.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                onClick={handleExportClick}
                disabled={resultsList.length === 0} // 結果がない場合は無効
              >
                 {/* エクスポートSVGアイコン */}
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                {exportFormat === 'csv' ? 'CSVでエクスポート' : 'Markdownでエクスポート'} ({resultsList.length}件)
              </button>
              {/* 注釈 */}
              <p className="mt-3 text-xs text-gray-500">※ CSVはExcelの「データ」タブ→「テキストまたはCSVから」でUTF-8を指定して開いてください。</p>
            </div>

            {/* 履歴 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">履歴</h2>
              {resultsList.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* スクロール可能に */}
                  {resultsList.map((result, index) => {
                    const isSelected = selectedResult === result; // 選択中か判定
                    const identifier = result?.gemini_evaluation?.candidate_identifier || `結果 ${resultsList.length - index}`;
                    const score = result?.calculated_scores?.total_match_percentage;
                    return (
                      <div
                        key={index}
                        className={`pl-4 py-2 mb-3 transition-colors rounded cursor-pointer ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-gray-300 hover:bg-gray-50'}`}
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
              ) : (
                <p className="text-sm text-gray-500">解析履歴はありません。</p>
              )}
            </div>
          </div>

          {/* --- 右側パネル - 分析結果 --- */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 min-h-[600px]"> {/* 最低高さを確保 */}
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                {currentResult ? '分析結果' : '解析を実行してください'}
              </h2>

              {isLoading && <p className="text-center text-gray-500">解析中...</p>}
              {errorInfo && !isLoading && <p className="error-message">エラー: {errorInfo.message}</p>}

              {currentResult && !isLoading && !errorInfo && (
                <>
                  {/* マッチ度表示 */}
                  <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                       {/* currentCandidateId を表示 */}
                      <h3 className="text-lg font-medium text-indigo-800">
                         マッチ度: {currentScores?.total_match_percentage?.toFixed(1) ?? '---'}%
                      </h3>
                      <span className="text-sm font-medium text-gray-600">{currentCandidateId || '---'}</span>
                    </div>
                    {/* プログレスバー */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{width: `${currentScores?.total_match_percentage ?? 0}%`}} // 0% 未満にならないように
                      ></div>
                    </div>
                  </div>

                  {/* --- 評価詳細テーブル --- */}
                  {currentEvaluation ? (
                    evaluationCategories.map(category => {
                      const items = currentEvaluation[category.dataKey];
                      // カテゴリに対応するデータがある場合のみ表示
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
                                  const displayInfo = getRatingDisplay(details?.symbol);
                                  return (
                                    <tr key={`${category.key}-${itemKey}`}>
                                      <td className="px-4 py-3 text-sm text-gray-900">{itemLabels[itemKey] || itemKey}</td>
                                      <td className={`px-4 py-3 text-center font-bold ${displayInfo.textClass}`}>
                                        {displayInfo.icon} {/* アイコン表示 (今は文字) */}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">{details?.reason || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null; // items がない場合は何も表示しない
                    })
                  ) : (
                    <p className="text-sm text-gray-500">評価の詳細データがありません。</p>
                  )}


                  {/* 全体コメント */}
                  {currentOverallComment && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">全体コメント</h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed"> {/* leading-relaxedで行間調整 */}
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