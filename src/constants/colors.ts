// カラーパレット（UI設計書準拠）

export const colors = {
  // プライマリカラー
  primary: '#50C878',     // エメラルドグリーン - ボタン、アクティブ要素
  accent: '#FFC107',      // 黄色 - 他人のメダル
  silver: '#9E9E9E',      // 銀色 - 自分のメダル

  // セマンティックカラー
  success: '#4CAF50',     // 緑 - 成功メッセージ
  error: '#F44336',       // 赤 - エラーメッセージ、削除ボタン
  warning: '#FF9800',     // オレンジ - 警告メッセージ
  info: '#2196F3',        // 青 - 情報メッセージ

  // 背景・テキストカラー
  background: '#FFFFFF',          // 白
  backgroundSecondary: '#F5F5F5', // ライトグレー
  textPrimary: '#212121',         // ダークグレー
  textSecondary: '#757575',       // グレー
  border: '#E0E0E0',              // ライトグレー

  // タブバー
  tabActive: '#50C878',
  tabInactive: '#757575',
};

// フォントサイズ
export const fontSize = {
  xl: 24,    // 画面タイトル
  lg: 18,    // セクションタイトル
  md: 16,    // ボタンテキスト、本文
  sm: 14,    // サブテキスト、キャプション
  xs: 12,    // 注釈、補足情報
};

// スペーシング
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
