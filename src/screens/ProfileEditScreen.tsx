import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system/next';
import { decode } from 'base64-arraybuffer';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, profile, refreshProfile } = useAuth();

  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ nickname?: string }>({});

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const validateNickname = (): boolean => {
    const newErrors: { nickname?: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = 'ニックネームを入力してください';
    } else if (nickname.length > 20) {
      newErrors.nickname = 'ニックネームは20文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('エラー', '画像ライブラリへのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // 新しいFile APIでbase64読み込み
      const file = new File(uri);
      const base64 = await file.base64();

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${fileExt}`;
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      // base64をArrayBufferに変換してアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          upsert: true,
          contentType,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // キャッシュ対策のためタイムスタンプを付与
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  const checkNgWords = async (text: string): Promise<boolean> => {
    try {
      const { data: ngWords } = await supabase
        .from('ng_words')
        .select('word');

      if (ngWords) {
        const lowerText = text.toLowerCase();
        for (const { word } of ngWords) {
          if (lowerText.includes(word.toLowerCase())) {
            return true; // NGワード検出
          }
        }
      }
      return false;
    } catch (error) {
      console.error('NG word check error:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!validateNickname()) return;

    // NGワードチェック
    const hasNgWord = await checkNgWords(nickname);
    if (hasNgWord) {
      Alert.alert('エラー', '不適切な文言が含まれています');
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // 新しいアバター画像がある場合はアップロード
      if (newAvatarUri) {
        const uploadedUrl = await uploadAvatar(newAvatarUri);
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
        } else {
          Alert.alert('エラー', '画像のアップロードに失敗しました');
          setSaving(false);
          return;
        }
      }

      // プロフィールが存在するか確認
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // 更新
        const { error } = await supabase
          .from('profiles')
          .update({
            nickname: nickname.trim(),
            avatar_url: finalAvatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            nickname: nickname.trim(),
            avatar_url: finalAvatarUrl,
            x_account_public: false,
          });

        if (error) throw error;
      }

      await refreshProfile();
      Alert.alert('完了', 'プロフィールを保存しました', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('エラー', '保存に失敗しました。再度お試しください');
    } finally {
      setSaving(false);
    }
  };

  const displayAvatarUri = newAvatarUri || avatarUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* アバター編集 */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
          {displayAvatarUri ? (
            <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={16} color={colors.background} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>タップして画像を変更</Text>
      </View>

      {/* ニックネーム */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>ニックネーム</Text>
        <TextInput
          style={[styles.input, errors.nickname && styles.inputError]}
          placeholder="ニックネームを入力"
          placeholderTextColor={colors.placeholder}
          value={nickname}
          onChangeText={(text) => {
            setNickname(text);
            if (errors.nickname) setErrors({});
          }}
          maxLength={20}
        />
        <View style={styles.inputFooter}>
          {errors.nickname ? (
            <Text style={styles.errorText}>{errors.nickname}</Text>
          ) : (
            <Text style={styles.hintText}>20文字以内</Text>
          )}
          <Text style={styles.charCount}>{nickname.length}/20</Text>
        </View>
      </View>

      {/* Xアカウント連携セクション */}
      <View style={styles.xSection}>
        <Text style={styles.sectionTitle}>Xアカウント連携</Text>
        <View style={styles.xCard}>
          <Text style={styles.xDescription}>
            Xアカウントを連携すると、プロフィールにXアカウント名を表示できます。
          </Text>
          <TouchableOpacity
            style={styles.xButton}
            onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
          >
            <Text style={styles.xButtonText}>𝕏 Xアカウントを連携</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.saveButtonText}>保存</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  // アバターセクション
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarButton: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  // 入力セクション
  inputSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    height: 50,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  // Xアカウントセクション
  xSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  xCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  xDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  xButton: {
    height: 44,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // 保存ボタン
  saveButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
