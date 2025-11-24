import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import {
  fetchStrategyRanking,
  fetchUserRankingTotal,
  fetchUserRankingWeekly,
  type StrategyRankingItem,
  type UserRankingItem,
} from '../api/rankings';
import { strategyTypeLabels } from '../api/strategies';
import { monsterCategoryLabels, type Monster } from '../api/masters';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RankingTab = 'strategies' | 'users_weekly' | 'users_total';

export default function RankingScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [activeTab, setActiveTab] = useState<RankingTab>('strategies');
  const [strategyRanking, setStrategyRanking] = useState<StrategyRankingItem[]>([]);
  const [userRankingWeekly, setUserRankingWeekly] = useState<UserRankingItem[]>([]);
  const [userRankingTotal, setUserRankingTotal] = useState<UserRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [strategies, usersWeekly, usersTotal] = await Promise.all([
        fetchStrategyRanking(50),
        fetchUserRankingWeekly(50),
        fetchUserRankingTotal(50),
      ]);

      setStrategyRanking(strategies);
      setUserRankingWeekly(usersWeekly);
      setUserRankingTotal(usersTotal);
    } catch (error) {
      console.error('Load ranking error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStrategyPress = (item: StrategyRankingItem) => {
    navigation.navigate('StrategyDetail', { strategy_no: item.strategy_no });
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return styles.rankGold;
      case 2:
        return styles.rankSilver;
      case 3:
        return styles.rankBronze;
      default:
        return styles.rankDefault;
    }
  };

  const getRankTextStyle = (rank: number) => {
    if (rank <= 3) return styles.rankTextTop;
    return styles.rankText;
  };

  const renderStrategyItem = ({ item }: { item: StrategyRankingItem }) => {
    const categoryLabel = monsterCategoryLabels[item.monster_category as Monster['monster_category']] || '';
    const typeLabel = strategyTypeLabels[item.strategy_type as keyof typeof strategyTypeLabels];

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleStrategyPress(item)}>
        <View style={[styles.rankBadge, getRankStyle(item.rank)]}>
          <Text style={getRankTextStyle(item.rank)}>{item.rank}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.categoryLabel}>{categoryLabel}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={styles.monsterName} numberOfLines={1}>
            {item.monster_name}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.userInfo}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={10} color={colors.textSecondary} />
                </View>
              )}
              <Text style={styles.nickname} numberOfLines={1}>
                {item.nickname || '名無し'}
              </Text>
            </View>
            <View style={styles.likeContainer}>
              <Ionicons name="heart" size={14} color={colors.error} />
              <Text style={styles.likeCount}>{item.like_count}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }: { item: UserRankingItem }) => (
    <View style={styles.userCard}>
      <View style={[styles.rankBadge, getRankStyle(item.rank)]}>
        <Text style={getRankTextStyle(item.rank)}>{item.rank}</Text>
      </View>

      <View style={styles.userCardContent}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        )}
        <Text style={styles.userNickname} numberOfLines={1}>
          {item.nickname || '名無し'}
        </Text>
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countNumber}>{item.strategy_count}</Text>
        <Text style={styles.countLabel}>件</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>ランキングデータがありません</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const isStrategyTab = activeTab === 'strategies';

  return (
    <View style={styles.container}>
      {/* タブ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'strategies' && styles.tabActive]}
          onPress={() => setActiveTab('strategies')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={activeTab === 'strategies' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'strategies' && styles.tabTextActive]}>
            いいね数
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users_weekly' && styles.tabActive]}
          onPress={() => setActiveTab('users_weekly')}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={activeTab === 'users_weekly' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'users_weekly' && styles.tabTextActive]}>
            週間
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users_total' && styles.tabActive]}
          onPress={() => setActiveTab('users_total')}
        >
          <Ionicons
            name="stats-chart"
            size={16}
            color={activeTab === 'users_total' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'users_total' && styles.tabTextActive]}>
            累計
          </Text>
        </TouchableOpacity>
      </View>

      {/* リスト */}
      {isStrategyTab ? (
        <FlatList
          data={strategyRanking}
          renderItem={renderStrategyItem}
          keyExtractor={(item) => item.strategy_no.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      ) : (
        <FlatList
          data={activeTab === 'users_weekly' ? userRankingWeekly : userRankingTotal}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
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
  // タブ
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // リスト
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  // 攻略情報カード
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankGold: {
    backgroundColor: '#FFD700',
  },
  rankSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBronze: {
    backgroundColor: '#CD7F32',
  },
  rankDefault: {
    backgroundColor: colors.backgroundSecondary,
  },
  rankTextTop: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.background,
  },
  rankText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  typeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.background,
  },
  monsterName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  avatarPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  nickname: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeCount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },
  // ユーザーカード
  userCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userNickname: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countNumber: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  countLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  // 空表示
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
