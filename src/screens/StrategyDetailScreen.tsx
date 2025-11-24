import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import { fetchStrategy, strategyTypeLabels, type Strategy, type StrategyMember } from '../api/strategies';
import { fetchMonsters, fetchWeapons, fetchJobs, monsterCategoryLabels, type Monster, type Weapon, type Job } from '../api/masters';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { checkFavoriteStrategy, addFavoriteStrategy, removeFavoriteStrategy } from '../api/favorites';
import type { RootStackParamList } from '../navigation/RootNavigator';

type RouteParams = RouteProp<RootStackParamList, 'StrategyDetail'>;

interface StrategyDetailData {
  strategy: Strategy;
  members: StrategyMember[];
  monster: Monster | null;
  user: { nickname: string | null; avatar_url: string | null } | null;
}

export default function StrategyDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { strategy_no } = route.params;

  const [data, setData] = useState<StrategyDetailData | null>(null);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [strategy_no]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 攻略情報を取得
      const strategyData = await fetchStrategy(strategy_no);
      if (!strategyData) {
        Alert.alert('エラー', '攻略情報が見つかりませんでした', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // マスタデータを取得
      const [monstersData, weaponsData, jobsData] = await Promise.all([
        fetchMonsters(),
        fetchWeapons(),
        fetchJobs(),
      ]);

      setWeapons(weaponsData);
      setJobs(jobsData);

      // モンスター情報
      const monster = monstersData.find(m => m.monster_no === strategyData.strategy.monster_no) || null;

      // ユーザー情報を取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('user_id', strategyData.strategy.user_id)
        .single();

      setData({
        strategy: strategyData.strategy,
        members: strategyData.members,
        monster,
        user: profileData,
      });

      setLikeCount(strategyData.strategy.like_count);

      // いいね・お気に入り状態を確認
      if (user) {
        const { data: likeData } = await supabase
          .from('mw_likes')
          .select('like_no')
          .eq('strategy_no', strategy_no)
          .eq('user_id', user.id)
          .single();

        setIsLiked(!!likeData);

        // お気に入り状態を確認
        const isFav = await checkFavoriteStrategy(user.id, strategy_no);
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('ログインが必要です', 'いいねするにはログインしてください');
      return;
    }

    if (likeLoading) return;

    setLikeLoading(true);
    try {
      if (isLiked) {
        // いいね解除
        await supabase
          .from('mw_likes')
          .delete()
          .eq('strategy_no', strategy_no)
          .eq('user_id', user.id);

        // like_countキャッシュを更新
        const newCount = Math.max(0, likeCount - 1);
        await supabase
          .from('mw_strategies')
          .update({ like_count: newCount })
          .eq('strategy_no', strategy_no);

        setIsLiked(false);
        setLikeCount(newCount);
      } else {
        // いいね追加
        await supabase
          .from('mw_likes')
          .insert({
            strategy_no,
            user_id: user.id,
          });

        // like_countキャッシュを更新
        const newCount = likeCount + 1;
        await supabase
          .from('mw_strategies')
          .update({ like_count: newCount })
          .eq('strategy_no', strategy_no);

        setIsLiked(true);
        setLikeCount(newCount);
      }
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('エラー', 'いいねの処理に失敗しました');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      Alert.alert('ログインが必要です', 'お気に入り登録するにはログインしてください');
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // お気に入り解除
        const result = await removeFavoriteStrategy(user.id, strategy_no);
        if (result.success) {
          setIsFavorite(false);
        } else {
          Alert.alert('エラー', result.error || 'お気に入り解除に失敗しました');
        }
      } else {
        // お気に入り追加
        const result = await addFavoriteStrategy(user.id, strategy_no);
        if (result.success) {
          setIsFavorite(true);
        } else {
          Alert.alert('エラー', result.error || 'お気に入り登録に失敗しました');
        }
      }
    } catch (error) {
      console.error('Favorite error:', error);
      Alert.alert('エラー', 'お気に入りの処理に失敗しました');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const getWeaponName = (weaponNo: number | null): string => {
    if (!weaponNo) return '未設定';
    const weapon = weapons.find(w => w.weapon_no === weaponNo);
    return weapon?.weapon_name || '不明';
  };

  const getJobName = (jobNo: number | null): string => {
    if (!jobNo) return '未設定';
    const job = jobs.find(j => j.job_no === jobNo);
    return job?.job_name || '不明';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>データが見つかりません</Text>
      </View>
    );
  }

  const { strategy, members, monster } = data;
  const categoryLabel = monster ? monsterCategoryLabels[monster.monster_category] : '';
  const typeLabel = strategyTypeLabels[strategy.strategy_type];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー情報 */}
        <View style={styles.header}>
          <View style={styles.monsterInfo}>
            <Text style={styles.categoryLabel}>{categoryLabel}</Text>
            <Text style={styles.monsterName}>{monster?.monster_name || '不明'}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
        </View>

        {/* ユーザー情報 */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            {data.user?.avatar_url ? (
              <Image source={{ uri: data.user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color={colors.textSecondary} />
              </View>
            )}
            <Text style={styles.nickname}>{data.user?.nickname || '名無し'}</Text>
          </View>
          <Text style={styles.createdAt}>
            {new Date(strategy.created_at).toLocaleDateString('ja-JP')}
          </Text>
        </View>

        {/* アクション説明 */}
        {strategy.action_description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>行動説明</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{strategy.action_description}</Text>
            </View>
          </View>
        )}

        {/* パーティメンバー */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>パーティ編成</Text>
          {members.map((member, index) => (
            <View key={member.member_no} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberNumber}>
                  <Text style={styles.memberNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberLabel}>武器</Text>
                  <Text style={styles.memberValue}>{getWeaponName(member.weapon_no)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberLabel}>職業</Text>
                  <Text style={styles.memberValue}>{getJobName(member.job_no)}</Text>
                </View>
              </View>

              {/* スクリーンショット */}
              {(member.screenshot_front_url || member.screenshot_back_url) && (
                <View style={styles.screenshotsContainer}>
                  {member.screenshot_front_url && (
                    <View style={styles.screenshotWrapper}>
                      <Text style={styles.screenshotLabel}>表</Text>
                      <Image
                        source={{ uri: member.screenshot_front_url }}
                        style={styles.screenshot}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  {member.screenshot_back_url && (
                    <View style={styles.screenshotWrapper}>
                      <Text style={styles.screenshotLabel}>裏</Text>
                      <Image
                        source={{ uri: member.screenshot_back_url }}
                        style={styles.screenshot}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* アクションバー */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.likeButton, isLiked && styles.likeButtonActive]}
          onPress={handleLike}
          disabled={likeLoading}
        >
          {likeLoading ? (
            <ActivityIndicator size="small" color={isLiked ? colors.background : colors.error} />
          ) : (
            <>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? colors.background : colors.error}
              />
              <Text style={[styles.likeButtonText, isLiked && styles.likeButtonTextActive]}>
                {likeCount}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={handleFavorite}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color={isFavorite ? colors.background : colors.primary} />
          ) : (
            <>
              <Ionicons
                name={isFavorite ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isFavorite ? colors.background : colors.primary}
              />
              <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteButtonTextActive]}>
                {isFavorite ? '登録済み' : 'お気に入り'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  // ヘッダー
  header: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  monsterInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  monsterName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  typeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  typeText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.background,
  },
  // ユーザー情報
  userSection: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  nickname: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  createdAt: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // アクション説明
  descriptionSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  descriptionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  // パーティメンバー
  membersSection: {
    padding: spacing.md,
  },
  memberCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  memberNumberText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.background,
  },
  memberInfo: {
    flex: 1,
  },
  memberLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // スクリーンショット
  screenshotsContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  screenshotWrapper: {
    flex: 1,
  },
  screenshotLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  screenshot: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  // アクションバー
  actionBar: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.error,
    gap: spacing.xs,
  },
  likeButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  likeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.error,
  },
  likeButtonTextActive: {
    color: colors.background,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  favoriteButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  favoriteButtonText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  favoriteButtonTextActive: {
    color: colors.background,
  },
});
