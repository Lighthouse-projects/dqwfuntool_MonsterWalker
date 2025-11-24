import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchMyStrategies,
  deleteStrategy,
  strategyTypeLabels,
  type StrategyListItem,
  type StrategyType,
} from '../api/strategies';
import { monsterCategoryLabels, type Monster } from '../api/masters';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyStrategiesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [strategies, setStrategies] = useState<StrategyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const data = await fetchMyStrategies(user.id);
      setStrategies(data);
    } catch (error) {
      console.error('Load my strategies error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初回のみデータ取得（フォーカス時は再取得しない）
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePress = (item: StrategyListItem) => {
    navigation.navigate('StrategyDetail', { strategy_no: item.strategy_no });
  };

  const handleEdit = (item: StrategyListItem) => {
    navigation.navigate('StrategyEdit', { strategy_no: item.strategy_no });
  };

  const handleDelete = (item: StrategyListItem) => {
    Alert.alert(
      '削除確認',
      'この攻略情報を削除しますか？\n削除後は復元できません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const result = await deleteStrategy(item.strategy_no, user.id);
            if (result.success) {
              setStrategies((prev) =>
                prev.filter((s) => s.strategy_no !== item.strategy_no)
              );
              Alert.alert('完了', '攻略情報を削除しました');
            } else {
              Alert.alert('エラー', result.error || '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: StrategyListItem }) => {
    const categoryLabel = monsterCategoryLabels[item.monster_category as Monster['monster_category']] || '';
    const typeLabel = strategyTypeLabels[item.strategy_type as StrategyType];

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
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
            <View style={styles.likeContainer}>
              <Ionicons name="heart" size={14} color={colors.error} />
              <Text style={styles.likeCount}>{item.like_count}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('ja-JP')}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>登録した攻略情報はありません</Text>
      <Text style={styles.emptySubText}>攻略情報を登録してみましょう</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.countContainer}>
        <Text style={styles.countText}>登録件数: {strategies.length}件</Text>
      </View>

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
        ListEmptyComponent={renderEmpty}
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  countContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
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
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: spacing.sm,
  },
  deleteButton: {
    padding: spacing.sm,
  },
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
  emptySubText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
