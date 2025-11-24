import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, fontSize, spacing } from '../../constants/colors';
import {
  monsterCategoryLabels,
  jobRankLabels,
  type Monster,
  type Weapon,
  type Job,
} from '../../api/masters';
import {
  strategyTypeLabels,
  type StrategyType,
} from '../../api/strategies';
import { useMasters } from '../../hooks/useMasters';
import SelectModal from '../common/SelectModal';
import PartyMemberInput from './PartyMemberInput';

export interface MemberState {
  weapon_no: number | null;
  job_no: number | null;
  screenshot_front_uri: string | null;
  screenshot_back_uri: string | null;
}

export const initialMemberState: MemberState = {
  weapon_no: null,
  job_no: null,
  screenshot_front_uri: null,
  screenshot_back_uri: null,
};

export interface StrategyFormData {
  monsterNo: number | null;
  strategyType: StrategyType;
  actionDescription: string;
  members: MemberState[];
}

interface StrategyFormProps {
  mode: 'create' | 'edit';
  initialData?: StrategyFormData;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (data: StrategyFormData) => void;
  onValidationError: (message: string) => void;
}

export default function StrategyForm({
  mode,
  initialData,
  submitLabel,
  submitting,
  onSubmit,
  onValidationError,
}: StrategyFormProps) {
  // マスタデータ（React Queryでキャッシュ）
  const { monsters, weapons, jobs, isLoading: loadingMasters } = useMasters();

  // フォーム状態
  const [monsterNo, setMonsterNo] = useState<number | null>(initialData?.monsterNo ?? null);
  const [strategyType, setStrategyType] = useState<StrategyType>(initialData?.strategyType ?? 'oneshot');
  const [actionDescription, setActionDescription] = useState(initialData?.actionDescription ?? '');
  const [members, setMembers] = useState<MemberState[]>(
    initialData?.members ?? [
      { ...initialMemberState },
      { ...initialMemberState },
      { ...initialMemberState },
      { ...initialMemberState },
    ]
  );

  // モーダル状態
  const [monsterModalVisible, setMonsterModalVisible] = useState(false);
  const [weaponModalVisible, setWeaponModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [activeMemberIndex, setActiveMemberIndex] = useState(0);

  // 初期データが変更された場合にフォームを更新
  useEffect(() => {
    if (initialData) {
      setMonsterNo(initialData.monsterNo);
      setStrategyType(initialData.strategyType);
      setActionDescription(initialData.actionDescription);
      setMembers(initialData.members);
    }
  }, [initialData]);

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

  // 送信処理
  const handleSubmit = () => {
    // バリデーション
    if (!monsterNo) {
      onValidationError('モンスターを選択してください');
      return;
    }

    onSubmit({
      monsterNo,
      strategyType,
      actionDescription,
      members,
    });
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

      {/* 送信ボタン */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
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
