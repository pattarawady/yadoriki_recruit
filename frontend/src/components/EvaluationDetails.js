// frontend/src/components/EvaluationDetails.js (CSS適用・記号クラス追加版)
import React from 'react';
import '../App.css'; // <<< App.css をインポート (App.jsと同じ階層にある想定)

// カテゴリ名を分かりやすい日本語にするためのマッピング (変更なし)
const categoryLabels = { required: '必須条件', preferred: '優遇条件', other: 'その他評価ポイント' };
// 項目名を分かりやすい日本語にするためのマッピング (変更なし)
const itemLabels = { age: '年齢', side_job: '副業', outsourcing: '業務委託', experience: '旅館・ホテル経験', management_level: '役職レベル (アラサー時)', job_change_desire: '転職希望', adaptability: '適応力', teamwork: 'チームワーク' };

// 評価記号に対応するCSSクラス名を返すヘルパー関数
const getSymbolClassName = (symbol) => {
  switch (symbol) {
    case '◎': return 'symbol-excellent';
    case '〇': return 'symbol-good';
    case '△': return 'symbol-fair';
    case '×': return 'symbol-poor';
    default: return '';
  }
};


function EvaluationDetails({ evaluationData }) {
  if (!evaluationData) { return <p>No evaluation data provided to details component.</p>; }

  const evaluation = evaluationData.evaluation || {};
  const candidate_identifier = evaluationData.candidate_identifier || "不明な候補者";
  const overall_comment = evaluationData.overall_comment || "コメントなし";

  return (
    <div>
      {/* 候補者識別子 (変更なし) */}
      <p><strong>候補者:</strong> {candidate_identifier}</p>

      {/* カテゴリごとにテーブルを作成 */}
      {Object.keys(evaluation).length > 0 ? (
        Object.entries(evaluation).map(([categoryKey, items]) => (
          (items && typeof items === 'object') ? (
            <div key={categoryKey} style={{ marginBottom: '20px' }}>
              <h3>{categoryLabels[categoryKey] || categoryKey}</h3>
              {/* ▼▼▼ テーブルにCSSクラスを適用 ▼▼▼ */}
              <table className="evaluation-table"> {/* <<< className を適用 */}
                <thead>
                  <tr>
                    <th>評価項目</th>{/* <<< th の style 削除 */}
                    <th>評価</th>
                    <th>理由</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(items).map(([itemKey, details]) => {
                    const symbol = (details && details.symbol) ? details.symbol : '-';
                    const reason = (details && details.reason) ? details.reason : '-';
                    const symbolClassName = getSymbolClassName(symbol); // <<< クラス名を取得

                    return (
                      <tr key={itemKey}>
                        <td>{itemLabels[itemKey] || itemKey}</td>{/* <<< td の style 削除 */}
                        {/* ▼▼▼ 評価記号セルにクラスを適用 ▼▼▼ */}
                        <td className={`evaluation-symbol ${symbolClassName}`}> {/* <<< className を適用 */}
                          {symbol}
                        </td>
                        {/* ▲▲▲ 評価記号セルにクラスを適用 ▲▲▲ */}
                        <td className="evaluation-reason">{/* <<< className を適用 */}
                          {reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* ▲▲▲ テーブルにCSSクラスを適用 ▲▲▲ */}
            </div>
          ) : null
        ))
      ) : (
        <p>Detailed evaluation breakdown is not available.</p>
      )}


      {/* 全体コメント */}
      <div>
        <h3>全体コメント</h3>
         {/* ▼▼▼ 全体コメントにCSSクラスを適用 ▼▼▼ */}
        <p className="overall-comment-box"> {/* <<< className を適用 */}
          {overall_comment}
        </p>
         {/* ▲▲▲ 全体コメントにCSSクラスを適用 ▲▲▲ */}
      </div>
    </div>
  );
}

export default EvaluationDetails;