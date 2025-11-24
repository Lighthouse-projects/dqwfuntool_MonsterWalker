import { supabase } from '../config/supabase';

// 攻略情報ランキングアイテム
export interface StrategyRankingItem {
  rank: number;
  strategy_no: number;
  monster_no: number;
  monster_name: string;
  monster_category: string;
  strategy_type: string;
  like_count: number;
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
}

// 登録者ランキングアイテム
export interface UserRankingItem {
  rank: number;
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  strategy_count: number;
}

// 攻略情報いいね数ランキング取得
export async function fetchStrategyRanking(
  limit: number = 20
): Promise<StrategyRankingItem[]> {
  try {
    // 攻略情報を取得（いいね数順）
    const { data: strategies, error } = await supabase
      .from('mw_strategies')
      .select(`
        strategy_no,
        user_id,
        monster_no,
        strategy_type,
        like_count,
        mw_mst_monsters!inner (
          monster_name,
          monster_category
        )
      `)
      .order('like_count', { ascending: false })
      .limit(limit);

    if (error || !strategies) {
      console.error('Fetch strategy ranking error:', error);
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

    // データ整形
    return strategies.map((item: any, index: number) => ({
      rank: index + 1,
      strategy_no: item.strategy_no,
      monster_no: item.monster_no,
      monster_name: item.mw_mst_monsters?.monster_name || '',
      monster_category: item.mw_mst_monsters?.monster_category || '',
      strategy_type: item.strategy_type,
      like_count: item.like_count,
      user_id: item.user_id,
      nickname: profilesMap[item.user_id]?.nickname || null,
      avatar_url: profilesMap[item.user_id]?.avatar_url || null,
    }));
  } catch (error) {
    console.error('Fetch strategy ranking error:', error);
    return [];
  }
}

// 登録者ランキング取得（累計）
export async function fetchUserRankingTotal(
  limit: number = 20
): Promise<UserRankingItem[]> {
  try {
    // 攻略情報の登録件数を集計
    const { data, error } = await supabase
      .from('mw_strategies')
      .select('user_id');

    if (error || !data) {
      console.error('Fetch user ranking error:', error);
      return [];
    }

    // ユーザーごとにカウント
    const countMap: Record<string, number> = {};
    data.forEach((item: any) => {
      countMap[item.user_id] = (countMap[item.user_id] || 0) + 1;
    });

    // ソートしてtop N取得
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const userIds = sorted.map(([userId]) => userId);

    // プロフィール情報を取得
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

    // データ整形
    return sorted.map(([userId, count], index) => ({
      rank: index + 1,
      user_id: userId,
      nickname: profilesMap[userId]?.nickname || null,
      avatar_url: profilesMap[userId]?.avatar_url || null,
      strategy_count: count,
    }));
  } catch (error) {
    console.error('Fetch user ranking error:', error);
    return [];
  }
}

// 登録者ランキング取得（週間）
export async function fetchUserRankingWeekly(
  limit: number = 20
): Promise<UserRankingItem[]> {
  try {
    // 今週の開始日を計算（日曜日始まり）
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    // 今週の攻略情報を取得
    const { data, error } = await supabase
      .from('mw_strategies')
      .select('user_id, created_at')
      .gte('created_at', weekStart.toISOString());

    if (error || !data) {
      console.error('Fetch user weekly ranking error:', error);
      return [];
    }

    // ユーザーごとにカウント
    const countMap: Record<string, number> = {};
    data.forEach((item: any) => {
      countMap[item.user_id] = (countMap[item.user_id] || 0) + 1;
    });

    // ソートしてtop N取得
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const userIds = sorted.map(([userId]) => userId);

    // プロフィール情報を取得
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

    // データ整形
    return sorted.map(([userId, count], index) => ({
      rank: index + 1,
      user_id: userId,
      nickname: profilesMap[userId]?.nickname || null,
      avatar_url: profilesMap[userId]?.avatar_url || null,
      strategy_count: count,
    }));
  } catch (error) {
    console.error('Fetch user weekly ranking error:', error);
    return [];
  }
}
