import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../../constants/colors';

// プライバシーポリシーの内容（documents/7_プライバシーポリシー.mdの内容を反映）
const PRIVACY_POLICY_CONTENT = `
第1条（はじめに）

本プライバシーポリシーは、dqwfunモンスターウォーカー（以下「本サービス」）における利用者の個人情報の取り扱いについて説明します。本サービスを利用することにより、利用者は本ポリシーに同意したものとみなされます。

第2条（収集する情報）

2.1 利用者から直接提供される情報
- メールアドレス（アカウント登録時）
- パスワード（暗号化して保存）
- ニックネーム（プロフィール設定時）
- プロフィール画像（任意）
- X（旧Twitter）アカウント情報（連携時のみ）
- 攻略情報（投稿内容）
- スクリーンショット画像（攻略情報登録時）

2.2 自動的に収集される情報
- デバイス情報（OS、バージョン）
- アプリの利用状況（アクセス日時、利用機能）

第3条（情報の利用目的）

収集した情報は、以下の目的で利用します。

1. アカウントの作成・認証
2. 本サービスの提供・運営
3. 利用者からの問い合わせ対応
4. 本サービスの改善・新機能開発
5. 不正利用の防止
6. 利用規約違反への対応

第4条（情報の共有）

当社は、以下の場合を除き、利用者の個人情報を第三者に提供しません。

1. 利用者の同意がある場合
2. 法令に基づく場合
3. 人の生命・身体・財産の保護に必要な場合
4. 本サービスの運営に必要な範囲で業務委託先に提供する場合

第5条（データの保護）

当社は、利用者の個人情報を適切に管理するため、以下の措置を講じています。

1. パスワードはbcryptによる暗号化
2. 通信はHTTPS（SSL/TLS）による暗号化
3. データベースへのアクセスは認証により制限

第6条（データの保存期間）

利用者の個人情報は、アカウント削除後30日間保持した後、完全に削除されます。ただし、法令により保存が義務付けられている情報については、当該法令に定める期間保存します。

第7条（利用者の権利）

利用者は、自己の個人情報について、以下の権利を有します。

1. 情報の閲覧・訂正
2. アカウントの削除
3. データのエクスポート

これらの権利を行使する場合は、お問い合わせ窓口までご連絡ください。

第8条（Cookie等の使用）

本サービスでは、セッション管理のためにローカルストレージを使用します。これにより、ログイン状態の維持などの機能を提供します。

第9条（プライバシーポリシーの変更）

当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス内で通知します。

第10条（お問い合わせ）

本ポリシーに関するお問い合わせは、以下の窓口までご連絡ください。

メールアドレス: rks_1008@yahoo.co.jp

以上
`;

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.text}>{PRIVACY_POLICY_CONTENT}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
