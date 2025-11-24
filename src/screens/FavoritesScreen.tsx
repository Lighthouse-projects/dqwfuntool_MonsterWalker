import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchFavoriteStrategies,
  fetchFavoriteSearches,
  removeFavoriteSearch,
  type FavoriteSearch,
} from '../api/favorites';
import { type StrategyListItem } from '../api/strategies';
import { fetchMonsters, fetchWeapons, type Monster, type Weapon } from '../api/masters';
import StrategyCard from '../components/features/StrategyCard';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'strategies' | 'searches';

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('strategies');
  const [strategies, setStrategies] = useState<StrategyListItem[]>([]);
  const [searches, setSearches] = useState<FavoriteSearch[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [strategiesData, searchesData, monstersData, weaponsData] = await Promise.all([
        fetchFavoriteStrategies(user.id),
        fetchFavoriteSearches(user.id),
        fetchMonsters(),
        fetchWeapons(),
      ]);

      setStrategies(strategiesData);
      setSearches(searchesData);
      setMonsters(monstersData);
      setWeapons(weaponsData);
    } catch (error) {
      console.error('Load favorites error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCardPress = (item: StrategyListItem) => {
    navigation.navigate('StrategyDetail', { strategy_no: item.strategy_no });
  };

  const handleSearchPress = (search: FavoriteSearch) => {
    // ホーム画面へ遷移してフィルター適用
    navigation.navigate('Main', {
      screen: 'Home',
      params: {
        monster_no: search.monster_no ?? undefined,
        weapon_no: search.weapon_no ?? undefined,
      },
    } as any);
  };

  const handleDeleteSearch = async (search: FavoriteSearch) => {
    if (!user) return;

    Alert.alert(
      '削除確認',
      `「${search.display_name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFavoriteSearch(user.id, search.favorite_search_no);
            if (result.success) {
              setSearches(prev => prev.filter(s => s.favorite_search_no !== search.favorite_search_no));
            } else {
              Alert.alert('エラー', result.error || '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const getMonsterName = (monsterNo: number | null): string => {
    if (!monsterNo) return '指定なし';
    const monster = monsters.find(m => m.monster_no === monsterNo);
    return monster?.monster_name || '不明';
  };

  const getWeaponName = (weaponNo: number | null): string => {
    if (!weaponNo) return '指定なし';
    const weapon = weapons.find(w => w.weapon_no === weaponNo);
    return weapon?.weapon_name || '不明';
  };

  // 未ログイン表示
  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>ログインが必要です</Text>
        <Text style={styles.emptyText}>
          お気に入り機能を使用するには{'\n'}ログインしてください
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>ログイン</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const renderStrategyItem = ({ item }: { item: StrategyListItem }) => (
    <StrategyCard item={item} onPress={() => handleCardPress(item)} />
  );

  const renderSearchItem = ({ item }: { item: FavoriteSearch }) => (
    <TouchableOpacity style={styles.searchCard} onPress={() => handleSearchPress(item)}>
      <View style={styles.searchContent}>
        <Text style={styles.searchName}>{item.display_name}</Text>
        <View style={styles.searchConditions}>
          <Text style={styles.searchCondition}>
            <MaterialCommunityIcons name="ghost-outline" size={12} color={colors.textSecondary} />
            {' '}{getMonsterName(item.monster_no)}
          </Text>
          <Text style={styles.searchCondition}>
            <MaterialCommunityIcons name="sword" size={12} color={colors.textSecondary} />
            {' '}{getWeaponName(item.weapon_no)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSearch(item)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyList}>
      <Ionicons
        name={activeTab === 'strategies' ? 'bookmark-outline' : 'search-outline'}
        size={48}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyListText}>
        {activeTab === 'strategies'
          ? 'お気に入りの攻略情報がありません'
          : '保存した検索条件がありません'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* タブ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'strategies' && styles.tabActive]}
          onPress={() => setActiveTab('strategies')}
        >
          <Ionicons
            name="bookmark"
            size={18}
            color={activeTab === 'strategies' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'strategies' && styles.tabTextActive]}>
            攻略情報 ({strategies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'searches' && styles.tabActive]}
          onPress={() => setActiveTab('searches')}
        >
          <Ionicons
            name="search"
            size={18}
            color={activeTab === 'searches' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'searches' && styles.tabTextActive]}>
            検索条件 ({searches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* リスト */}
      {activeTab === 'strategies' ? (
        <FlatList
          data={strategies}
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
          data={searches}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.favorite_search_no.toString()}
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
  // 検索条件カード
  searchCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContent: {
    flex: 1,
  },
  searchName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  searchConditions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  searchCondition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  // 空表示
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
  emptyList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyListText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
