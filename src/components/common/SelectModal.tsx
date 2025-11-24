import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../../constants/colors';

interface SelectOption {
  value: number;
  label: string;
  subLabel?: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue: number | null;
  onSelect: (value: number | null) => void;
  onClose: () => void;
  searchable?: boolean;
  allowClear?: boolean;
}

export default function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchable = true,
  allowClear = true,
}: SelectModalProps) {
  const [searchText, setSearchText] = useState('');

  const filteredOptions = searchText
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  const handleSelect = (value: number | null) => {
    onSelect(value);
    setSearchText('');
    onClose();
  };

  const handleClose = () => {
    setSearchText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* 検索 */}
        {searchable && (
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="検索..."
              placeholderTextColor={colors.placeholder}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* クリアボタン */}
        {allowClear && selectedValue !== null && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSelect(null)}
          >
            <Text style={styles.clearButtonText}>選択を解除</Text>
          </TouchableOpacity>
        )}

        {/* オプション一覧 */}
        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => item.value.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.optionItem,
                item.value === selectedValue && styles.selectedOption,
              ]}
              onPress={() => handleSelect(item.value)}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionLabel,
                    item.value === selectedValue && styles.selectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {item.subLabel && (
                  <Text style={styles.optionSubLabel}>{item.subLabel}</Text>
                )}
              </View>
              {item.value === selectedValue && (
                <Ionicons name="checkmark" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>該当するデータがありません</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  clearButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOption: {
    backgroundColor: colors.backgroundSecondary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  optionSubLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
