import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

export default function MyPageScreen() {
  const { user, profile, loading, signInWithX, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マイページ</Text>

      {user ? (
        <>
          <Text style={styles.subtitle}>
            {profile?.nickname ?? 'ニックネーム未設定'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>ログアウト</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>ログインして攻略情報を登録しよう</Text>
          <TouchableOpacity style={styles.button} onPress={signInWithX}>
            <Text style={styles.buttonText}>Xでログイン</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
});
