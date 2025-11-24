import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../../constants/colors';
import { strategyTypeLabels, type StrategyListItem } from '../../api/strategies';
import { monsterCategoryLabels, type Monster } from '../../api/masters';

interface StrategyCardProps {
  item: StrategyListItem;
  onPress: () => void;
}

export default function StrategyCard({ item, onPress }: StrategyCardProps) {
  const categoryLabel = monsterCategoryLabels[item.monster_category as Monster['monster_category']] || '';
  const typeLabel = strategyTypeLabels[item.strategy_type];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.monsterInfo}>
          <Text style={styles.categoryBadge}>{categoryLabel}</Text>
          <Text style={styles.monsterName} numberOfLines={1}>
            {item.monster_name}
          </Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={12} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.nickname} numberOfLines={1}>
            {item.nickname || '名無し'}
          </Text>
        </View>

        <View style={styles.likeContainer}>
          <Ionicons name="heart" size={16} color={colors.error} />
          <Text style={styles.likeCount}>{item.like_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  monsterInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryBadge: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  monsterName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  typeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.background,
  },
  footer: {
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
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.xs,
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  nickname: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});
