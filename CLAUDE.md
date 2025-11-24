# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**MonsterWalker（モンスターウォーカー）** - ドラクエウォークのモンスター攻略情報を登録・共有するファンツールアプリ。

## 技術スタック

- **フロントエンド**: React Native + Expo
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage)
- **状態管理**: React Context (AuthContext) + React Query (TanStack Query)
- **キャッシュ**: React Query + AsyncStorage (SWRパターン)
- **プラットフォーム**: iOS / Android

## アーキテクチャ

### データフロー
```
UI Components → React Query → AsyncStorage (キャッシュ) → Supabase
```

### Supabaseプロジェクト共用
dqwfuntool内で他アプリとSupabaseプロジェクトを共用。以下のテーブルは共用：
- `auth.users` - ユーザー認証（Supabase Auth標準）
- `public.profiles` - プロフィール情報
- `public.ng_words` - NGワードリスト

### 本アプリ専用テーブル（`mw_`プレフィクス）
- `mw_mst_*` - マスタテーブル（monsters, weapons, jobs）
- `mw_strategies` - 攻略情報
- `mw_strategy_members` - パーティメンバー（4人分）、武器はNULL許容（NULL=任意）
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
- `strategy_type_enum`: oneshot / semiauto / auto
- `job_rank_enum`: basic / advanced / special
- `request_category_enum`: monster / weapon / job / bug / feature / question / other
- `request_status_enum`: pending / in_progress / completed / rejected

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
