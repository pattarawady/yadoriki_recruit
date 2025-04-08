// frontend/src/components/EvaluationDetails.js (nullチェック追加版)
import React from 'react';

// カテゴリ名を分かりやすい日本語にするためのマッピング
const categoryLabels = {
  required: '必須条件',
  preferred: '優遇条件',
  other: 'その他評価ポイント',
};

// 項目名を分かりやすい日本語にするためのマッピング
const itemLabels = {
  age: '年齢',
  side_job: '副業',
  outsourcing: '業務委託',
  experience: '旅館・ホテル経験',
  management_level: '役職レベル (アラサー時)',
  job_change_desire: '転職希望',
  adaptability: '適応力',
  teamwork: 'チームワーク',
};

// 評価記号にスタイルを適用するヘルパー関数
const getSymbolStyle = (symbol) => {
  switch (symbol) {
    case '◎': return { color: 'green', fontWeight: 'bold' };
    case '〇': return { color: 'orange' }; // or some other color like blue
    case '△': return { color: 'gray' };
    case '×': return { color: 'red' };
    default: return {};
  }
};

// テーブルのスタイル
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '20px' };
const thStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2', minWidth: '80px' };
const tdStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };
const reasonCellStyle = { ...tdStyle, wordBreak: 'break-word' };

function EvaluationDetails({ evaluationData }) {
  // evaluationData やその中身が null or undefined の場合の防御処理
  if (!evaluationData) {
    return <p>No evaluation data provided to details component.</p>;
  }

  // evaluationData から必要な情報を取り出す (null チェックを行いデフォルト値を設定)
  const evaluation = evaluationData.evaluation || {};
  const candidate_identifier = evaluationData.candidate_identifier || "不明な候補者";
  const overall_comment = evaluationData.overall_comment || "コメントなし";

  return (
    <div>
      {/* 候補者識別子 */}
      <p><strong>候補者:</strong> {candidate_identifier}</p>

      {/* カテゴリごとにテーブルを作成 */}
      {/* evaluation が空オブジェクトでないことを確認 */}
      {Object.keys(evaluation).length > 0 ? (
        Object.entries(evaluation).map(([categoryKey, items]) => (
          // items がオブジェクトであることを確認 (より安全に)
          (items && typeof items === 'object') ? (
            <div key={categoryKey} style={{ marginBottom: '20px' }}>
              <h3>{categoryLabels[categoryKey] || categoryKey}</h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>評価項目</th>
                    <th style={thStyle}>評価</th>
                    <th style={thStyle}>理由</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 各カテゴリの項目をループ */}
                  {Object.entries(items).map(([itemKey, details]) => {
                    // details がオブジェクトであることを確認
                    const symbol = (details && details.symbol) ? details.symbol : '-';
                    const reason = (details && details.reason) ? details.reason : '-';
                    const symbolStyle = getSymbolStyle(symbol); // スタイル取得

                    return (
                      <tr key={itemKey}>
                        <td style={tdStyle}>{itemLabels[itemKey] || itemKey}</td>
                        {/* スタイルを適用 */}
                        <td style={{...tdStyle, ...symbolStyle}}>
                          {symbol}
                        </td>
                        <td style={reasonCellStyle}>{reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null // itemsが不正な場合は何も表示しない
        ))
      ) : (
        <p>Detailed evaluation breakdown is not available.</p> // evaluationが空の場合
      )}


      {/* 全体コメント */}
      <div>
        <h3>全体コメント</h3>
        <p style={{ whiteSpace: 'pre-wrap', background: '#eee', padding: '10px', borderRadius: '4px' }}>
          {overall_comment}
        </p>
      </div>
    </div>
  );
}

export default EvaluationDetails;