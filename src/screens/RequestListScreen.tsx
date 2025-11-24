import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/colors';
import {
  fetchRequests,
  requestCategoryLabels,
  requestStatusLabels,
  requestStatusColors,
  type RequestItem,
  type RequestCategory,
  type RequestStatus,
} from '../api/requests';

export default function RequestListScreen() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (error) {
      console.error('Load requests error:', error);
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

  const handlePress = (item: RequestItem) => {
    setSelectedRequest(item);
  };

  const renderItem = ({ item }: { item: RequestItem }) => {
    const categoryLabel = requestCategoryLabels[item.category as RequestCategory];
    const statusLabel = requestStatusLabels[item.status as RequestStatus];
    const statusColor = requestStatusColors[item.status as RequestStatus];

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.nickname}>{item.nickname || '名無し'}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('ja-JP')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>要望はまだありません</Text>
    </View>
  );

  const renderDetailModal = () => {
    if (!selectedRequest) return null;

    const categoryLabel = requestCategoryLabels[selectedRequest.category as RequestCategory];
    const statusLabel = requestStatusLabels[selectedRequest.status as RequestStatus];
    const statusColor = requestStatusColors[selectedRequest.status as RequestStatus];

    return (
      <Modal
        visible={!!selectedRequest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* ヘッダー */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedRequest(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>要望詳細</Text>
            <View style={styles.headerRight} />
          </View>

          {/* 内容 */}
          <View style={styles.modalContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>カテゴリー</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{categoryLabel}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>対応状況</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>送信者</Text>
              <Text style={styles.detailValue}>{selectedRequest.nickname || '名無し'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>送信日時</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedRequest.created_at).toLocaleString('ja-JP')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>要望内容</Text>
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>{selectedRequest.content}</Text>
              </View>
            </View>

            {selectedRequest.admin_comment && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>運営からの回答</Text>
                <View style={styles.commentBox}>
                  <Text style={styles.commentText}>{selectedRequest.admin_comment}</Text>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.request_no.toString()}
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

      {renderDetailModal()}
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
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.background,
  },
  content: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nickname: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
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
  // モーダル
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  modalContent: {
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  detailSection: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  contentText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  commentBox: {
    backgroundColor: '#E8F5E9',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  commentText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
