import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { deleteAccount } from '../api/account';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
}

function MenuItem({ icon, label, onPress, showArrow = true, color }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={color || colors.textPrimary} />
        <Text style={[styles.menuItemLabel, color && { color }]}>{label}</Text>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

export default function MyPageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, profile, loading, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、全ての攻略情報・いいね・お気に入り等のデータが完全に削除され、復元できません。\n\n本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteAccount();
              if (result.success) {
                await signOut();
                Alert.alert('完了', 'アカウントを削除しました');
              } else {
                Alert.alert('エラー', result.error || '削除に失敗しました');
              }
            } catch (error) {
              Alert.alert('エラー', '削除に失敗しました');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // 未ログイン状態
  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
        <Text style={styles.guestTitle}>マイページ</Text>
        <Text style={styles.guestSubtitle}>
          ログインして攻略情報を登録しよう
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>ログイン / 新規登録</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ログイン済み状態
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* プロフィールセクション */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>
              {profile?.nickname || 'ニックネーム未設定'}
            </Text>
            <Text style={styles.editHint}>タップしてプロフィール編集</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* メニューセクション: 攻略情報 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>攻略情報</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="document-text-outline"
            label="自分の攻略情報"
            onPress={() => navigation.navigate('MyStrategies')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="heart-outline"
            label="いいねした攻略情報"
            onPress={() => navigation.navigate('LikedStrategies')}
          />
        </View>
      </View>

      {/* メニューセクション: サポート */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>サポート</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="要望送信"
            onPress={() => navigation.navigate('RequestSubmit')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="list-outline"
            label="要望一覧"
            onPress={() => navigation.navigate('RequestList')}
          />
        </View>
      </View>

      {/* メニューセクション: 設定 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>設定</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="ログアウト"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </View>

      {/* アカウント削除 */}
      <View style={styles.menuSection}>
        <View style={styles.menuCard}>
          {deleting ? (
            <View style={styles.deletingContainer}>
              <ActivityIndicator color={colors.error} />
              <Text style={styles.deletingText}>削除中...</Text>
            </View>
          ) : (
            <MenuItem
              icon="trash-outline"
              label="アカウント削除"
              onPress={handleDeleteAccount}
              showArrow={false}
              color={colors.error}
            />
          )}
        </View>
      </View>

      {/* バージョン情報 */}
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  // ゲスト（未ログイン）表示
  guestContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  guestTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  guestSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  loginButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  // プロフィールセクション
  profileSection: {
    padding: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  editHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // メニューセクション
  menuSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 24 + spacing.md,
  },
  // バージョン
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  // 削除中
  deletingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  deletingText: {
    fontSize: fontSize.md,
    color: colors.error,
  },
});
