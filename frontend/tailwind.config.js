// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ▼▼▼ ここに色定義を追加 ▼▼▼
      colors: {
        'custom-dark': '#0C0A0B',      // 例: 背景や濃い文字色
        'custom-gray-dark': '#616160', // 例: やや濃いグレー
        'custom-beige': '#DEBFB9',     // 例: アクセント背景や要素
        'custom-brown': '#664644',     // 例: 区切り線や補足情報
        'custom-red': '#E12A22',       // 例: エラーや強調したい部分
        // 必要であれば、既存の色を上書きするのではなく、
        // 新しい名前をつけるのが安全です。
      },
      // ▲▲▲ ここまで追加 ▲▲▲
    },
  },
  plugins: [],
}