import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import { fetchMonsters, fetchWeapons, type Monster, type Weapon } from '../api/masters';
import { searchStrategies, type StrategyListItem, type SearchParams } from '../api/strategies';
import SelectModal from '../components/common/SelectModal';
import StrategyCard from '../components/features/StrategyCard';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ITEMS_PER_PAGE = 20;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  // フィルター状態
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);

  // モーダル状態
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [showWeaponModal, setShowWeaponModal] = useState(false);

  // マスタデータ
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // 検索結果
  const [strategies, setStrategies] = useState<StrategyListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);

  // マスタデータ読み込み
  const loadMasters = async () => {
    setLoadingMasters(true);
    try {
      const [monstersData, weaponsData] = await Promise.all([
        fetchMonsters(),
        fetchWeapons(),
      ]);
      setMonsters(monstersData);
      setWeapons(weaponsData);
    } catch (error) {
      console.error('Failed to load masters:', error);
    } finally {
      setLoadingMasters(false);
    }
  };

  // 検索実行（フィルター値を直接受け取る）
  const executeSearch = async (
    reset: boolean = false,
    monsterFilter: Monster | null = selectedMonster,
    weaponFilter: Weapon | null = selectedWeapon
  ) => {
    const currentPage = reset ? 0 : page;

    if (reset) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: SearchParams = {
        monster_no: monsterFilter?.monster_no || null,
        weapon_no: weaponFilter?.weapon_no || null,
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
      };

      const result = await searchStrategies(params);

      if (reset) {
        setStrategies(result.data);
      } else {
        setStrategies(prev => [...prev, ...result.data]);
      }
      setTotalCount(result.count);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // 初期読み込み
  useFocusEffect(
    useCallback(() => {
      loadMasters();
      executeSearch(true, null, null);
    }, [])
  );

  // フィルター変更時に再検索
  const handleFilterChange = (
    monster: Monster | null = selectedMonster,
    weapon: Weapon | null = selectedWeapon
  ) => {
    setSelectedMonster(monster);
    setSelectedWeapon(weapon);
    setPage(0);
    // フィルター値を直接渡して検索実行
    executeSearch(true, monster, weapon);
  };

  // プルリフレッシュ
  const handleRefresh = () => {
    setRefreshing(true);
    executeSearch(true);
  };

  // 追加読み込み
  const handleLoadMore = () => {
    if (loadingMore || loading || strategies.length >= totalCount) return;
    setPage(prev => prev + 1);
    setTimeout(() => executeSearch(false), 0);
  };

  // フィルタークリア
  const clearFilters = () => {
    setSelectedMonster(null);
    setSelectedWeapon(null);
    // フィルターなしで検索実行
    executeSearch(true, null, null);
  };

  // 詳細画面へ遷移
  const handleCardPress = (item: StrategyListItem) => {
    navigation.navigate('StrategyDetail', { strategy_no: item.strategy_no });
  };

  // モンスター選択用オプション
  const monsterOptions = monsters.map(m => ({
    value: m.monster_no,
    label: m.monster_name,
  }));

  // 武器選択用オプション
  const weaponOptions = weapons.map(w => ({
    value: w.weapon_no,
    label: w.weapon_name,
  }));

  const hasFilters = selectedMonster || selectedWeapon;

  const renderItem = ({ item }: { item: StrategyListItem }) => (
    <StrategyCard item={item} onPress={() => handleCardPress(item)} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>
          {hasFilters ? '該当する攻略情報が見つかりませんでした' : '攻略情報がまだありません'}
        </Text>
        {hasFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>フィルターをクリア</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loadingMasters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 検索フィルター */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>絞り込み検索</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, selectedMonster && styles.filterButtonActive]}
            onPress={() => setShowMonsterModal(true)}
          >
            <Ionicons
              name="skull-outline"
              size={16}
              color={selectedMonster ? colors.background : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedMonster && styles.filterButtonTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedMonster?.monster_name || 'モンスター'}
            </Text>
            {selectedMonster && (
              <TouchableOpacity
                onPress={() => handleFilterChange(null, selectedWeapon)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedWeapon && styles.filterButtonActive]}
            onPress={() => setShowWeaponModal(true)}
          >
            <Ionicons
              name="flash-outline"
              size={16}
              color={selectedWeapon ? colors.background : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedWeapon && styles.filterButtonTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedWeapon?.weapon_name || '武器'}
            </Text>
            {selectedWeapon && (
              <TouchableOpacity
                onPress={() => handleFilterChange(selectedMonster, null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 検索結果件数 */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {totalCount}件の攻略情報
        </Text>
      </View>

      {/* 検索結果リスト */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={strategies}
          renderItem={renderItem}
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* モンスター選択モーダル */}
      <SelectModal
        visible={showMonsterModal}
        title="モンスターを選択"
        options={monsterOptions}
        selectedValue={selectedMonster?.monster_no || null}
        onSelect={(value) => {
          const monster = monsters.find(m => m.monster_no === value) || null;
          handleFilterChange(monster, selectedWeapon);
          setShowMonsterModal(false);
        }}
        onClose={() => setShowMonsterModal(false)}
        searchable
      />

      {/* 武器選択モーダル */}
      <SelectModal
        visible={showWeaponModal}
        title="武器を選択"
        options={weaponOptions}
        selectedValue={selectedWeapon?.weapon_no || null}
        onSelect={(value) => {
          const weapon = weapons.find(w => w.weapon_no === value) || null;
          handleFilterChange(selectedMonster, weapon);
          setShowWeaponModal(false);
        }}
        onClose={() => setShowWeaponModal(false)}
        searchable
      />
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
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  // フィルターセクション
  filterContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  // 検索結果ヘッダー
  resultHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // リスト
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
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
  clearButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
});
