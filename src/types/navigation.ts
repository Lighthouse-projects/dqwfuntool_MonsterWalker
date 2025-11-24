// ナビゲーション型定義

// タブナビゲーターのパラメータ
export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Register: undefined;
  Ranking: undefined;
  MyPage: undefined;
};

// スタックナビゲーターのパラメータ（将来の画面遷移用）
export type RootStackParamList = {
  Main: undefined;
  StrategyDetail: { strategyNo: number };
  ProfileEdit: undefined;
  Settings: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  Request: undefined;
};

// React Navigation型拡張
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
