import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchStrategy,
  updateStrategy,
  type StrategyMemberInput,
  type StrategyType,
} from '../api/strategies';
import StrategyForm, {
  type StrategyFormData,
  type MemberState,
  initialMemberState,
} from '../components/features/StrategyForm';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'StrategyEdit'>;

export default function StrategyEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { user } = useAuth();

  const { strategy_no } = route.params;

  // 初期データ
  const [initialData, setInitialData] = useState<StrategyFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 攻略情報を読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchStrategy(strategy_no);
        if (result) {
          // メンバーデータを変換
          const membersData: MemberState[] = [0, 1, 2, 3].map((index) => {
            const member = result.members.find((m) => m.member_order === index + 1);
            if (member) {
              return {
                weapon_no: member.weapon_no,
                job_no: member.job_no,
                screenshot_front_uri: member.screenshot_front_url,
                screenshot_back_uri: member.screenshot_back_url,
              };
            }
            return { ...initialMemberState };
          });

          setInitialData({
            monsterNo: result.strategy.monster_no,
            strategyType: result.strategy.strategy_type as StrategyType,
            actionDescription: result.strategy.action_description || '',
            members: membersData,
          });
        } else {
          Alert.alert('エラー', '攻略情報が見つかりません', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error) {
        console.error('Load strategy error:', error);
        Alert.alert('エラー', 'データの読み込みに失敗しました', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [strategy_no]);

  // バリデーションエラー
  const handleValidationError = (message: string) => {
    Alert.alert('エラー', message);
  };

  // 更新処理
  const handleSubmit = async (data: StrategyFormData) => {
    if (!user) {
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

      const result = await updateStrategy(strategy_no, user.id, {
        monster_no: data.monsterNo!,
        strategy_type: data.strategyType,
        action_description: data.actionDescription || null,
        members: memberInputs,
      });

      if (result.success) {
        Alert.alert('完了', '攻略情報を更新しました', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('エラー', result.error || '更新に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', '更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!initialData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>データを読み込めませんでした</Text>
      </View>
    );
  }

  return (
    <StrategyForm
      mode="edit"
      initialData={initialData}
      submitLabel="更新"
      submitting={submitting}
      onSubmit={handleSubmit}
      onValidationError={handleValidationError}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
