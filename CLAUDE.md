# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**MonsterWalker（モンスターウォーカー）** - ドラクエウォークのモンスター攻略情報を登録・共有するファンツールアプリ。

## 開発コマンド

```bash
# 開発サーバー起動
npm start                    # Expo開発サーバー
npx expo start --clear       # キャッシュクリアして起動

# プラットフォーム別
npm run ios                  # iOSシミュレーター
npm run android              # Androidエミュレーター

# 型チェック
npx tsc --noEmit

# パッケージ追加（Expo互換バージョン自動選択）
npx expo install <package>
```

## 技術スタック

- **フロントエンド**: React Native + Expo SDK 54
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage)
- **状態管理**: React Context (AuthContext) + React Query (TanStack Query)
- **ナビゲーション**: React Navigation (Bottom Tabs)
- **プラットフォーム**: iOS / Android

## ソースコード構造

```
src/
├── api/                     # Supabaseクエリ関数（データ取得・更新）
├── components/
│   ├── common/              # 汎用UI部品（Button, Card, Modal等）
│   └── features/            # 機能固有UI部品
├── config/                  # 設定ファイル
│   ├── supabase.ts          # Supabaseクライアント
│   └── queryClient.ts       # React Query設定
├── constants/               # 定数
│   └── colors.ts            # カラーパレット（UI設計書準拠）
├── contexts/                # グローバル状態（React Context）
│   └── AuthContext.tsx      # 認証状態管理
├── hooks/                   # カスタムフック（状態・データ取得）
├── navigation/              # ナビゲーション
│   └── TabNavigator.tsx     # 5タブナビゲーション
├── screens/                 # 画面コンポーネント
├── types/                   # 型定義
│   ├── database.ts          # Supabaseテーブル型定義
│   └── navigation.ts        # ナビゲーション型定義
└── utils/                   # 純粋関数（Reactに依存しない）
```

### フォルダの役割分担

| フォルダ | 役割 | 配置するもの |
|---------|------|-------------|
| `api/` | データ取得・更新 | Supabaseクエリ関数 |
| `components/` | UIの見た目 | 再利用可能なUI部品 |
| `config/` | 設定 | 外部サービス接続設定 |
| `hooks/` | 状態・副作用 | React Queryフック、カスタムフック |
| `utils/` | 純粋関数 | フォーマット、バリデーション |
| `screens/` | 画面 | 各タブ・ページのコンポーネント |
| `contexts/` | グローバル状態 | 認証など横断的な状態管理 |

## アーキテクチャ

### データフロー
```
UI Components → React Query → AsyncStorage (キャッシュ) → Supabase
```

### ナビゲーション構造
```
RootNavigator (Stack)
├── Main (TabNavigator)
│   ├── Home            # 検索・一覧
│   ├── Favorites       # お気に入り
│   ├── Register        # 攻略情報登録（StrategyRegisterScreen）
│   ├── Ranking         # ランキング
│   └── MyPage          # マイページ
└── Modal Screens
    ├── Login / SignUp / ForgotPassword
    ├── Terms / PrivacyPolicy
    ├── StrategyDetail / StrategyEdit
    ├── MyStrategies / LikedStrategies
    └── RequestSubmit / RequestList
```

### 共通コンポーネントパターン
- **StrategyForm**: 攻略情報の登録/編集で共通利用（mode: 'create' | 'edit'）
- **SelectModal**: マスタ選択用モーダル（モンスター、武器、職業）
- **PartyMemberInput**: パーティメンバー入力（4人分）

### Supabaseプロジェクト共用
dqwfuntool内で他アプリとSupabaseプロジェクトを共用。以下のテーブルは共用：
- `auth.users` - ユーザー認証（Supabase Auth標準）
- `public.profiles` - プロフィール情報
- `public.ng_words` - NGワードリスト

### 本アプリ専用テーブル（`mw_`プレフィクス）
- `mw_mst_*` - マスタテーブル（monsters, weapons, jobs）
- `mw_strategies` - 攻略情報
- `mw_strategy_members` - パーティメンバー（4人分）、全項目NULL許容（任意入力）
- `mw_likes`, `mw_favorites_*`, `mw_reports` - ユーザーアクション
- `mw_requests` - 要望

### セキュリティ
- Row Level Security (RLS) でデータ保護
- 参照は全員許可、更新は自分のデータのみ

## ドキュメント構成

| ファイル | 内容 |
|---------|------|
| `documents/1_要件定義書.md` | 機能要件、画面構成、法的事項 |
| `documents/2_アーキテクチャ設計書.md` | 技術スタック、システム構成、キャッシュ設計 |
| `documents/3_機能設計書.md` | 各機能の詳細設計（F001〜F013） |
| `documents/4_データベース設計書.md` | テーブル定義、DDL、RLSポリシー、Storage設計 |
| `documents/4.1_マスタデータ初期設定INSERT文.md` | マスタデータINSERT文 |
| `documents/5_UI設計書.md` | 画面レイアウト、デザイン仕様 |
| `documents/6_利用規約.md` | 利用規約（21項目の禁止事項含む） |
| `documents/7_プライバシーポリシー.md` | プライバシーポリシー |

## 命名規則

### テーブル
- 共用テーブル: プレフィクスなし（`profiles`, `ng_words`）
- 本アプリ専用: `mw_` プレフィクス
- マスタテーブル: `mw_mst_` プレフィクス

### 主キー
- bigint型の場合: `*_no`（例: `strategy_no`, `monster_no`）
- UUID型の場合: `user_id`

### ENUM型
- `monster_category_enum`: hokora / megamon / gigamon
- `strategy_type_enum`: oneshot / semiauto / auto / manual
- `job_rank_enum`: basic / advanced / special
- `request_category_enum`: monster / weapon / job / bug / feature / question / other
- `request_status_enum`: pending / in_progress / completed / rejected

## Supabase Edge Functions

```
supabase/functions/
└── delete-account/     # アカウント削除（関連データ一括削除）
```

## Supabase Storage

### バケット
- `avatars` - ユーザーアイコン（共用）
- `mw_screenshots` - 攻略スクリーンショット

### ファイルパス
```
avatars/{user_id}/avatar.{ext}
mw_screenshots/{user_id}/{strategy_no}/{member_order}_{front|back}.{ext}
```

## マスタデータ

### 登録済み
- mw_mst_jobs: 24職（基本職8、上級職8、特級職8）
- mw_mst_weapons: 199件（星5武器）
- mw_mst_monsters: 262件（ギガモン12、メガモン99、ほこら151）

## 注意事項

- パッケージ追加時は `npx expo install` を使用（Expo SDKとの互換性を自動確認）
- 環境変数は `.env` ファイルで管理（`EXPO_PUBLIC_` プレフィクス必須）
