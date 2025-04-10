// frontend/src/components/EvaluationDetails.js
import React from 'react';
// import '../App.css';

// ▼▼▼ この定義を追加 ▼▼▼
// カテゴリキーと表示名、データ構造キーのマッピング
const evaluationCategories = [
  { key: 'required', label: '必須条件', dataKey: 'required' },
  { key: 'preferred', label: '優遇条件', dataKey: 'preferred' },
  { key: 'other', label: 'その他評価ポイント', dataKey: 'other' },
];
// ▲▲▲ この定義を追加 ▲▲▲

// カテゴリ名を分かりやすい日本語にするためのマッピング (これはループで使うので不要になるかも)
// const categoryLabels = { required: '必須条件', preferred: '優遇条件', other: 'その他評価ポイント' };

// 項目名を分かりやすい日本語にするためのマッピング (変更なし)
const itemLabels = { age: '年齢', side_job: '副業', outsourcing: '業務委託', experience: '旅館・ホテル経験', management_level: '役職レベル (アラサー時)', job_change_desire: '転職希望', adaptability: '適応力', teamwork: 'チームワーク' };

// 評価記号の表示 (変更なし)
// EvaluationDetails.js 内
const getRatingDisplay = (symbol) => {
  switch (symbol) {
    case '◎': return { textClass: 'text-green-600', icon: '✓✓', label: 'Excellent' };
    case '〇': return { textClass: 'text-yellow-600', icon: '✓', label: 'Good' };
    case '△': return { textClass: 'text-gray-500', icon: '~', label: 'Fair' };
    case '×': return { textClass: 'text-red-600', icon: '✕', label: 'Poor' };
    default: // <<< default ケースを追加！
      console.warn("Unknown symbol received:", symbol); // 予期せぬ値が来たら警告を出す
      return { textClass: 'text-gray-400', icon: '?', label: 'Unknown' }; // 不明な場合の表示
  }
};


function EvaluationDetails({ evaluationData }) {
  if (!evaluationData) { return <p className="text-sm text-gray-500">評価データがありません。</p>; }

  const evaluation = evaluationData.evaluation || {};
  const candidate_identifier = evaluationData.candidate_identifier || "不明な候補者";
  const overall_comment = evaluationData.overall_comment || "コメントなし";

  return (
    <div>
      {/* 候補者名は App.js 側で表示するのでここでは不要かも */}
      {/* <p><strong>候補者:</strong> {candidate_identifier}</p> */}

      {/* カテゴリごとにテーブルを作成 */}
      {Object.keys(evaluation).length > 0 ? (
        evaluationCategories.map(categoryInfo => { // evaluationCategories を使う
            const categoryKey = categoryInfo.dataKey;
            const items = evaluation[categoryKey];
            // カテゴリに対応するデータがある場合のみ表示
            return items && typeof items === 'object' && Object.keys(items).length > 0 ? (
                <div className="mb-6" key={categoryKey}>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">{categoryInfo.label}</h3>
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
                            <tr key={`${categoryKey}-${itemKey}`}>
                              <td className="px-4 py-3 text-sm text-gray-900">{itemLabels[itemKey] || itemKey}</td>
                              <td className={`px-4 py-3 text-center font-bold ${displayInfo.textClass}`}>
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
              ) : null; // items がない or 空の場合は何も表示しない
        })
      ) : (
        <p className="text-sm text-gray-500">評価の詳細データがありません。</p>
      )}

      {/* 全体コメント */}
      {overall_comment && overall_comment !== 'コメントなし' && ( // コメントがある場合のみ表示
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">全体コメント</h3>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed">
            {overall_comment}
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationDetails;