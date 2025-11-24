import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  createRequest,
  requestCategoryLabels,
  type RequestCategory,
} from '../api/requests';

const categories: RequestCategory[] = [
  'monster',
  'weapon',
  'job',
  'bug',
  'feature',
  'question',
  'other',
];

export default function RequestSubmitScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxLength = 500;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('エラー', 'カテゴリーを選択してください');
      return;
    }

    if (!content.trim()) {
      Alert.alert('エラー', '要望内容を入力してください');
      return;
    }

    if (content.length > maxLength) {
      Alert.alert('エラー', `要望内容は${maxLength}文字以内で入力してください`);
      return;
    }

    setSubmitting(true);

    try {
      const result = await createRequest(user.id, selectedCategory, content.trim());

      if (result.success) {
        Alert.alert('完了', '要望を送信しました', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('エラー', result.error || '送信に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', '送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* カテゴリー選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリー <Text style={styles.required}>*</Text></Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextSelected,
                  ]}
                >
                  {requestCategoryLabels[category]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 要望内容 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>要望内容 <Text style={styles.required}>*</Text></Text>
            <Text style={styles.charCount}>
              {content.length}/{maxLength}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="要望内容を入力してください"
            placeholderTextColor={colors.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
          />
        </View>

        {/* 注意事項 */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            送信後の編集・削除はできません。{'\n'}
            対応状況は「要望一覧」から確認できます。
          </Text>
        </View>

        {/* 送信ボタン */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedCategory || !content.trim() || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedCategory || !content.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>送信する</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  charCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  categoryButtonTextSelected: {
    color: colors.background,
    fontWeight: 'bold',
  },
  textArea: {
    height: 200,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.background,
  },
});
