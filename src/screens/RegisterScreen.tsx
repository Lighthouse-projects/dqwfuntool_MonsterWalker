import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchMonsters,
  fetchWeapons,
  fetchJobs,
  monsterCategoryLabels,
  jobRankLabels,
  type Monster,
  type Weapon,
  type Job,
} from '../api/masters';
import {
  createStrategy,
  strategyTypeLabels,
  type StrategyType,
  type StrategyMemberInput,
} from '../api/strategies';
import SelectModal from '../components/common/SelectModal';
import PartyMemberInput from '../components/features/PartyMemberInput';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MemberState {
  weapon_no: number | null;
  job_no: number | null;
  screenshot_front_uri: string | null;
  screenshot_back_uri: string | null;
}

const initialMemberState: MemberState = {
  weapon_no: null,
  job_no: null,
  screenshot_front_uri: null,
  screenshot_back_uri: null,
};

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  // マスタデータ
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // フォーム状態
  const [monsterNo, setMonsterNo] = useState<number | null>(null);
  const [strategyType, setStrategyType] = useState<StrategyType>('oneshot');
  const [actionDescription, setActionDescription] = useState('');
  const [members, setMembers] = useState<MemberState[]>([
    { ...initialMemberState },
    { ...initialMemberState },
    { ...initialMemberState },
    { ...initialMemberState },
  ]);

  // モーダル状態
  const [monsterModalVisible, setMonsterModalVisible] = useState(false);
  const [weaponModalVisible, setWeaponModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [activeMemberIndex, setActiveMemberIndex] = useState(0);

  // 送信状態
  const [submitting, setSubmitting] = useState(false);

  // マスタデータ読み込み
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [monstersData, weaponsData, jobsData] = await Promise.all([
          fetchMonsters(),
          fetchWeapons(),
          fetchJobs(),
        ]);
        setMonsters(monstersData);
        setWeapons(weaponsData);
        setJobs(jobsData);
      } catch (error) {
        Alert.alert('エラー', 'データの読み込みに失敗しました');
      } finally {
        setLoadingMasters(false);
      }
    };
    loadMasters();
  }, []);

  // 未ログイン時はログイン画面へ
  const handleLoginRequired = () => {
    navigation.navigate('Login');
  };

  // メンバー更新
  const updateMember = (index: number, updates: Partial<MemberState>) => {
    setMembers((prev) =>
      prev.map((member, i) => (i === index ? { ...member, ...updates } : member))
    );
  };

  // 武器選択モーダルを開く
  const openWeaponModal = (index: number) => {
    setActiveMemberIndex(index);
    setWeaponModalVisible(true);
  };

  // 職業選択モーダルを開く
  const openJobModal = (index: number) => {
    setActiveMemberIndex(index);
    setJobModalVisible(true);
  };

  // 登録処理
  const handleSubmit = async () => {
    if (!user) {
      handleLoginRequired();
      return;
    }

    // バリデーション
    if (!monsterNo) {
      Alert.alert('エラー', 'モンスターを選択してください');
      return;
    }

    setSubmitting(true);
    try {
      const memberInputs: StrategyMemberInput[] = members.map((member, index) => ({
        member_order: index + 1,
        weapon_no: member.weapon_no,
        job_no: member.job_no,
        screenshot_front_uri: member.screenshot_front_uri,
        screenshot_back_uri: member.screenshot_back_uri,
      }));

      const result = await createStrategy(user.id, {
        monster_no: monsterNo,
        strategy_type: strategyType,
        action_description: actionDescription || null,
        members: memberInputs,
      });

      if (result.success) {
        Alert.alert('完了', '攻略情報を登録しました', [
          {
            text: 'OK',
            onPress: () => {
              // フォームをリセット
              setMonsterNo(null);
              setStrategyType('oneshot');
              setActionDescription('');
              setMembers([
                { ...initialMemberState },
                { ...initialMemberState },
                { ...initialMemberState },
                { ...initialMemberState },
              ]);
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

  // モンスター選択オプション
  const monsterOptions = monsters.map((m) => ({
    value: m.monster_no,
    label: m.monster_name,
    subLabel: monsterCategoryLabels[m.monster_category],
  }));

  // 武器選択オプション
  const weaponOptions = weapons.map((w) => ({
    value: w.weapon_no,
    label: w.weapon_name,
  }));

  // 職業選択オプション
  const jobOptions = jobs.map((j) => ({
    value: j.job_no,
    label: j.job_name,
    subLabel: jobRankLabels[j.job_rank],
  }));

  const selectedMonster = monsters.find((m) => m.monster_no === monsterNo);

  if (loadingMasters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* モンスター選択 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>攻略対象モンスター *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setMonsterModalVisible(true)}
        >
          <Text
            style={[
              styles.selectButtonText,
              !selectedMonster && styles.placeholderText,
            ]}
          >
            {selectedMonster?.monster_name || 'モンスターを選択'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 攻略タイプ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>攻略タイプ *</Text>
        <View style={styles.typeContainer}>
          {(['oneshot', 'semiauto', 'auto', 'manual'] as StrategyType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                strategyType === type && styles.typeButtonSelected,
              ]}
              onPress={() => setStrategyType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  strategyType === type && styles.typeButtonTextSelected,
                ]}
              >
                {strategyTypeLabels[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* パーティ構成 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>パーティ構成</Text>
        {members.map((member, index) => (
          <PartyMemberInput
            key={index}
            memberOrder={index + 1}
            weaponNo={member.weapon_no}
            jobNo={member.job_no}
            screenshotFrontUri={member.screenshot_front_uri}
            screenshotBackUri={member.screenshot_back_uri}
            weapons={weapons}
            jobs={jobs}
            onWeaponSelect={() => openWeaponModal(index)}
            onJobSelect={() => openJobModal(index)}
            onScreenshotFrontChange={(uri) =>
              updateMember(index, { screenshot_front_uri: uri })
            }
            onScreenshotBackChange={(uri) =>
              updateMember(index, { screenshot_back_uri: uri })
            }
          />
        ))}
      </View>

      {/* 行動順序・内容 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>行動順序・内容</Text>
        <TextInput
          style={styles.textArea}
          placeholder="行動順序や内容を入力..."
          placeholderTextColor={colors.placeholder}
          value={actionDescription}
          onChangeText={setActionDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* 登録ボタン */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.submitButtonText}>登録</Text>
        )}
      </TouchableOpacity>

      {/* モーダル */}
      <SelectModal
        visible={monsterModalVisible}
        title="モンスター選択"
        options={monsterOptions}
        selectedValue={monsterNo}
        onSelect={setMonsterNo}
        onClose={() => setMonsterModalVisible(false)}
        allowClear={false}
      />

      <SelectModal
        visible={weaponModalVisible}
        title="武器選択"
        options={weaponOptions}
        selectedValue={members[activeMemberIndex]?.weapon_no ?? null}
        onSelect={(value) => updateMember(activeMemberIndex, { weapon_no: value })}
        onClose={() => setWeaponModalVisible(false)}
      />

      <SelectModal
        visible={jobModalVisible}
        title="職業選択"
        options={jobOptions}
        selectedValue={members[activeMemberIndex]?.job_no ?? null}
        onSelect={(value) => updateMember(activeMemberIndex, { job_no: value })}
        onClose={() => setJobModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
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
    marginTop: spacing.md,
  },
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  selectButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  selectButtonText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.placeholder,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  typeButtonTextSelected: {
    color: colors.background,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
