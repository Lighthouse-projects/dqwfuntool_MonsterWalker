import { supabase } from '../config/supabase';
import type { StrategyListItem } from './strategies';

// お気に入り攻略情報の型
export interface FavoriteStrategy {
  favorite_strategy_no: number;
  user_id: string;
  strategy_no: number;
  sort_order: number;
  created_at: string;
}

// お気に入り検索条件の型
export interface FavoriteSearch {
  favorite_search_no: number;
  user_id: string;
  monster_no: number | null;
  weapon_no: number | null;
  display_name: string;
  sort_order: number;
  created_at: string;
}

// 攻略情報のお気に入り状態を確認
export async function checkFavoriteStrategy(
  userId: string,
  strategyNo: number
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('mw_favorites_strategies')
      .select('favorite_strategy_no')
      .eq('user_id', userId)
      .eq('strategy_no', strategyNo)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// 攻略情報をお気に入りに追加
export async function addFavoriteStrategy(
  userId: string,
  strategyNo: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mw_favorites_strategies')
      .insert({
        user_id: userId,
        strategy_no: strategyNo,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: '既にお気に入りに登録されています' };
      }
      console.error('Add favorite strategy error:', error);
      return { success: false, error: 'お気に入り登録に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('Add favorite strategy error:', error);
    return { success: false, error: 'お気に入り登録に失敗しました' };
  }
}

// 攻略情報をお気に入りから削除
export async function removeFavoriteStrategy(
  userId: string,
  strategyNo: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mw_favorites_strategies')
      .delete()
      .eq('user_id', userId)
      .eq('strategy_no', strategyNo);

    if (error) {
      console.error('Remove favorite strategy error:', error);
      return { success: false, error: 'お気に入り解除に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('Remove favorite strategy error:', error);
    return { success: false, error: 'お気に入り解除に失敗しました' };
  }
}

// お気に入り攻略情報一覧を取得
export async function fetchFavoriteStrategies(
  userId: string
): Promise<StrategyListItem[]> {
  try {
    // お気に入り一覧を取得
    const { data: favorites, error: favError } = await supabase
      .from('mw_favorites_strategies')
      .select('strategy_no')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favError || !favorites || favorites.length === 0) {
      return [];
    }

    const strategyNos = favorites.map(f => f.strategy_no);

    // 攻略情報を取得
    const { data: strategies, error: stratError } = await supabase
      .from('mw_strategies')
      .select(`
        strategy_no,
        user_id,
        monster_no,
        strategy_type,
        like_count,
        created_at,
        mw_mst_monsters!inner (
          monster_name,
          monster_category
        )
      `)
      .in('strategy_no', strategyNos)
      .eq('is_deleted', false);

    if (stratError || !strategies) {
      return [];
    }

    // プロフィール情報を取得
    const userIds = [...new Set(strategies.map((s: any) => s.user_id))];
    let profilesMap: Record<string, { nickname: string | null; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', userIds);

      if (profilesData) {
        profilesMap = profilesData.reduce((acc, p) => {
          acc[p.user_id] = { nickname: p.nickname, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { nickname: string | null; avatar_url: string | null }>);
      }
    }

    // データ整形（お気に入り順序を維持）
    const strategyMap = new Map(strategies.map((s: any) => [s.strategy_no, s]));
    const result: StrategyListItem[] = [];

    for (const strategyNo of strategyNos) {
      const item: any = strategyMap.get(strategyNo);
      if (item) {
        result.push({
          strategy_no: item.strategy_no,
          user_id: item.user_id,
          monster_no: item.monster_no,
          strategy_type: item.strategy_type,
          like_count: item.like_count,
          created_at: item.created_at,
          monster_name: item.mw_mst_monsters?.monster_name || '',
          monster_category: item.mw_mst_monsters?.monster_category || '',
          nickname: profilesMap[item.user_id]?.nickname || null,
          avatar_url: profilesMap[item.user_id]?.avatar_url || null,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Fetch favorite strategies error:', error);
    return [];
  }
}

// 検索条件をお気に入りに追加
export async function addFavoriteSearch(
  userId: string,
  monsterNo: number | null,
  weaponNo: number | null,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mw_favorites_searches')
      .insert({
        user_id: userId,
        monster_no: monsterNo,
        weapon_no: weaponNo,
        display_name: displayName,
      });

    if (error) {
      console.error('Add favorite search error:', error);
      return { success: false, error: 'お気に入り登録に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('Add favorite search error:', error);
    return { success: false, error: 'お気に入り登録に失敗しました' };
  }
}

// 検索条件をお気に入りから削除
export async function removeFavoriteSearch(
  userId: string,
  favoriteSearchNo: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mw_favorites_searches')
      .delete()
      .eq('user_id', userId)
      .eq('favorite_search_no', favoriteSearchNo);

    if (error) {
      console.error('Remove favorite search error:', error);
      return { success: false, error: 'お気に入り解除に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('Remove favorite search error:', error);
    return { success: false, error: 'お気に入り解除に失敗しました' };
  }
}

// お気に入り検索条件一覧を取得
export async function fetchFavoriteSearches(
  userId: string
): Promise<FavoriteSearch[]> {
  try {
    const { data, error } = await supabase
      .from('mw_favorites_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch favorite searches error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Fetch favorite searches error:', error);
    return [];
  }
}
