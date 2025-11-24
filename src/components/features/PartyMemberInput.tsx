import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fontSize, spacing } from '../../constants/colors';
import type { Weapon, Job } from '../../api/masters';

interface PartyMemberInputProps {
  memberOrder: number;
  weaponNo: number | null;
  jobNo: number | null;
  screenshotFrontUri: string | null;
  screenshotBackUri: string | null;
  weapons: Weapon[];
  jobs: Job[];
  onWeaponSelect: () => void;
  onJobSelect: () => void;
  onScreenshotFrontChange: (uri: string | null) => void;
  onScreenshotBackChange: (uri: string | null) => void;
}

export default function PartyMemberInput({
  memberOrder,
  weaponNo,
  jobNo,
  screenshotFrontUri,
  screenshotBackUri,
  weapons,
  jobs,
  onWeaponSelect,
  onJobSelect,
  onScreenshotFrontChange,
  onScreenshotBackChange,
}: PartyMemberInputProps) {
  const selectedWeapon = weapons.find((w) => w.weapon_no === weaponNo);
  const selectedJob = jobs.find((j) => j.job_no === jobNo);

  const pickImage = async (
    onImageChange: (uri: string | null) => void
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.memberNumber}>{memberOrder}人目</Text>
      </View>

      {/* 武器選択 */}
      <TouchableOpacity style={styles.selectButton} onPress={onWeaponSelect}>
        <Text style={styles.selectLabel}>武器</Text>
        <View style={styles.selectValue}>
          <Text
            style={[
              styles.selectText,
              !selectedWeapon && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedWeapon?.weapon_name || '選択してください'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* 職業選択 */}
      <TouchableOpacity style={styles.selectButton} onPress={onJobSelect}>
        <Text style={styles.selectLabel}>職業</Text>
        <View style={styles.selectValue}>
          <Text
            style={[
              styles.selectText,
              !selectedJob && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedJob?.job_name || '選択してください'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* スクリーンショット */}
      <View style={styles.screenshotSection}>
        <Text style={styles.screenshotLabel}>スクリーンショット</Text>
        <View style={styles.screenshotRow}>
          {/* 表 */}
          <TouchableOpacity
            style={styles.screenshotButton}
            onPress={() => pickImage(onScreenshotFrontChange)}
          >
            {screenshotFrontUri ? (
              <View style={styles.screenshotImageContainer}>
                <Image
                  source={{ uri: screenshotFrontUri }}
                  style={styles.screenshotImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onScreenshotFrontChange(null)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.screenshotPlaceholder}>
                <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.screenshotPlaceholderText}>表</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 裏 */}
          <TouchableOpacity
            style={styles.screenshotButton}
            onPress={() => pickImage(onScreenshotBackChange)}
          >
            {screenshotBackUri ? (
              <View style={styles.screenshotImageContainer}>
                <Image
                  source={{ uri: screenshotBackUri }}
                  style={styles.screenshotImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onScreenshotBackChange(null)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.screenshotPlaceholder}>
                <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.screenshotPlaceholderText}>裏</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: spacing.md,
  },
  memberNumber: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 50,
  },
  selectValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selectText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  placeholderText: {
    color: colors.placeholder,
  },
  screenshotSection: {
    marginTop: spacing.md,
  },
  screenshotLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  screenshotRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  screenshotButton: {
    flex: 1,
    aspectRatio: 9 / 16,
    maxHeight: 120,
  },
  screenshotPlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotPlaceholderText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  screenshotImageContainer: {
    flex: 1,
    position: 'relative',
  },
  screenshotImage: {
    flex: 1,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
});
