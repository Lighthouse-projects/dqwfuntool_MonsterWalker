import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  createStrategy,
  type StrategyMemberInput,
} from '../api/strategies';
import StrategyForm, {
  type StrategyFormData,
  initialMemberState,
} from '../components/features/StrategyForm';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StrategyRegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  // 送信状態
  const [submitting, setSubmitting] = useState(false);
  // フォームをリセットするためのキー
  const [formKey, setFormKey] = useState(0);

  // 未ログイン時はログイン画面へ
  const handleLoginRequired = () => {
    navigation.navigate('Login');
  };

  // バリデーションエラー
  const handleValidationError = (message: string) => {
    Alert.alert('エラー', message);
  };

  // 登録処理
  const handleSubmit = async (data: StrategyFormData) => {
    if (!user) {
      handleLoginRequired();
      return;
    }

    setSubmitting(true);
    try {
      const memberInputs: StrategyMemberInput[] = data.members.map((member, index) => ({
        member_order: index + 1,
        weapon_no: member.weapon_no,
        job_no: member.job_no,
        screenshot_front_uri: member.screenshot_front_uri,
        screenshot_back_uri: member.screenshot_back_uri,
      }));

      const result = await createStrategy(user.id, {
        monster_no: data.monsterNo!,
        strategy_type: data.strategyType,
        action_description: data.actionDescription || null,
        members: memberInputs,
      });

      if (result.success) {
        Alert.alert('完了', '攻略情報を登録しました', [
          {
            text: 'OK',
            onPress: () => {
              // フォームをリセット（キーを変更して再マウント）
              setFormKey((prev) => prev + 1);
            },
          },
        ]);
      } else {
        Alert.alert('エラー', result.error || '登録に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // 未ログイン時の表示
  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestTitle}>攻略情報を登録</Text>
        <Text style={styles.guestSubtitle}>
          ログインして攻略情報を登録しよう
        </Text>
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginRequired}>
          <Text style={styles.loginButtonText}>ログイン / 新規登録</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StrategyForm
      key={formKey}
      mode="create"
      submitLabel="登録"
      submitting={submitting}
      onSubmit={handleSubmit}
      onValidationError={handleValidationError}
    />
  );
}

const styles = StyleSheet.create({
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
});
