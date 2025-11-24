import { supabase } from '../config/supabase';
import { File } from 'expo-file-system/next';
import { decode } from 'base64-arraybuffer';

// 型定義
export type StrategyType = 'oneshot' | 'semiauto' | 'auto' | 'manual';

export interface StrategyMemberInput {
  member_order: number;
  weapon_no: number | null;
  job_no: number | null;
  screenshot_front_uri: string | null;
  screenshot_back_uri: string | null;
}

export interface StrategyInput {
  monster_no: number;
  strategy_type: StrategyType;
  action_description: string | null;
  members: StrategyMemberInput[];
}

export interface Strategy {
  strategy_no: number;
  user_id: string;
  monster_no: number;
  strategy_type: StrategyType;
  action_description: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface StrategyMember {
  member_no: number;
  strategy_no: number;
  member_order: number;
  weapon_no: number | null;
  job_no: number | null;
  screenshot_front_url: string | null;
  screenshot_back_url: string | null;
}

// 攻略タイプの日本語表示
export const strategyTypeLabels: Record<StrategyType, string> = {
  oneshot: 'ワンパン',
  semiauto: 'セミオート',
  auto: 'オート',
  manual: 'マニュアル',
};

// スクリーンショットアップロード
async function uploadScreenshot(
  userId: string,
  strategyNo: number,
  memberOrder: number,
  position: 'front' | 'back',
  uri: string
): Promise<string | null> {
  try {
    const file = new File(uri);
    const base64 = await file.base64();

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/${strategyNo}/${memberOrder}_${position}.${fileExt}`;
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from('mw_screenshots')
      .upload(filePath, decode(base64), {
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error('Screenshot upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('mw_screenshots')
      .getPublicUrl(filePath);

    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error('Screenshot upload error:', error);
    return null;
  }
}

// NGワードチェック
export async function checkNgWords(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    const { data: ngWords } = await supabase
      .from('ng_words')
      .select('word');

    if (ngWords) {
      const lowerText = text.toLowerCase();
      for (const { word } of ngWords) {
        if (lowerText.includes(word.toLowerCase())) {
          return true; // NGワード検出
        }
      }
    }
    return false;
  } catch (error) {
    console.error('NG word check error:', error);
    return false;
  }
}

// 攻略情報登録
export async function createStrategy(
  userId: string,
  input: StrategyInput
): Promise<{ success: boolean; strategy_no?: number; error?: string }> {
  try {
    // NGワードチェック
    if (input.action_description) {
      const hasNgWord = await checkNgWords(input.action_description);
      if (hasNgWord) {
        return { success: false, error: '不適切な文言が含まれています' };
      }
    }

    // 攻略情報を登録
    const { data: strategy, error: strategyError } = await supabase
      .from('mw_strategies')
      .insert({
        user_id: userId,
        monster_no: input.monster_no,
        strategy_type: input.strategy_type,
        action_description: input.action_description || null,
      })
      .select()
      .single();

    if (strategyError || !strategy) {
      console.error('Strategy insert error:', strategyError);
      return { success: false, error: '登録に失敗しました' };
    }

    const strategyNo = strategy.strategy_no;

    // パーティメンバーを登録
    for (const member of input.members) {
      let screenshotFrontUrl: string | null = null;
      let screenshotBackUrl: string | null = null;

      // スクリーンショットをアップロード
      if (member.screenshot_front_uri) {
        screenshotFrontUrl = await uploadScreenshot(
          userId,
          strategyNo,
          member.member_order,
          'front',
          member.screenshot_front_uri
        );
      }

      if (member.screenshot_back_uri) {
        screenshotBackUrl = await uploadScreenshot(
          userId,
          strategyNo,
          member.member_order,
          'back',
          member.screenshot_back_uri
        );
      }

      // メンバー情報を登録
      const { error: memberError } = await supabase
        .from('mw_strategy_members')
        .insert({
          strategy_no: strategyNo,
          member_order: member.member_order,
          weapon_no: member.weapon_no,
          job_no: member.job_no,
          screenshot_front_url: screenshotFrontUrl,
          screenshot_back_url: screenshotBackUrl,
        });

      if (memberError) {
        console.error('Member insert error:', memberError);
        // メンバー登録失敗時は攻略情報を削除
        await supabase.from('mw_strategies').delete().eq('strategy_no', strategyNo);
        return { success: false, error: 'メンバー情報の登録に失敗しました' };
      }
    }

    return { success: true, strategy_no: strategyNo };
  } catch (error) {
    console.error('Create strategy error:', error);
    return { success: false, error: '登録に失敗しました' };
  }
}

// 攻略情報取得（詳細）
export async function fetchStrategy(strategyNo: number): Promise<{
  strategy: Strategy;
  members: StrategyMember[];
} | null> {
  try {
    const { data: strategy, error: strategyError } = await supabase
      .from('mw_strategies')
      .select('*')
      .eq('strategy_no', strategyNo)
      .single();

    if (strategyError || !strategy) {
      return null;
    }

    const { data: members, error: membersError } = await supabase
      .from('mw_strategy_members')
      .select('*')
      .eq('strategy_no', strategyNo)
      .order('member_order', { ascending: true });

    if (membersError) {
      return null;
    }

    return { strategy, members: members || [] };
  } catch (error) {
    console.error('Fetch strategy error:', error);
    return null;
  }
}

// 検索結果の型
export interface StrategyListItem {
  strategy_no: number;
  user_id: string;
  monster_no: number;
  strategy_type: StrategyType;
  like_count: number;
  created_at: string;
  monster_name: string;
  monster_category: string;
  nickname: string | null;
  avatar_url: string | null;
}

// 検索パラメータ
export interface SearchParams {
  monster_no?: number | null;
  weapon_no?: number | null;
  limit?: number;
  offset?: number;
}

// 攻略情報一覧取得（検索）
export async function searchStrategies(
  params: SearchParams = {}
): Promise<{ data: StrategyListItem[]; count: number }> {
  const { monster_no, weapon_no, limit = 20, offset = 0 } = params;

  try {
    // 基本クエリ（profilesはFKがないため別途取得）
    let query = supabase
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
      `, { count: 'exact' });

    // モンスターフィルタ
    if (monster_no) {
      query = query.eq('monster_no', monster_no);
    }

    // 武器フィルタ（サブクエリで対応）
    if (weapon_no) {
      // 武器を使用しているstrategy_noを取得
      const { data: strategyNos } = await supabase
        .from('mw_strategy_members')
        .select('strategy_no')
        .eq('weapon_no', weapon_no);

      if (strategyNos && strategyNos.length > 0) {
        const nos = strategyNos.map((s) => s.strategy_no);
        query = query.in('strategy_no', nos);
      } else {
        // 該当なし
        return { data: [], count: 0 };
      }
    }

    // いいね数順でソート、ページネーション
    const { data, error, count } = await query
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Search strategies error:', error);
      return { data: [], count: 0 };
    }

    // ユーザーIDを収集してプロフィール情報を一括取得
    const userIds = [...new Set((data || []).map((item: any) => item.user_id))];
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
    const formattedData: StrategyListItem[] = (data || []).map((item: any) => ({
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
    }));

    return { data: formattedData, count: count || 0 };
  } catch (error) {
    console.error('Search strategies error:', error);
    return { data: [], count: 0 };
  }
}

// 自分の攻略情報一覧取得
export async function fetchMyStrategies(
  userId: string
): Promise<StrategyListItem[]> {
  try {
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Fetch my strategies error:', error);
      return [];
    }

    // プロフィール情報を取得
    const { data: profileData } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('user_id', userId)
      .single();

    // データ整形
    return data.map((item: any) => ({
      strategy_no: item.strategy_no,
      user_id: item.user_id,
      monster_no: item.monster_no,
      strategy_type: item.strategy_type,
      like_count: item.like_count,
      created_at: item.created_at,
      monster_name: item.mw_mst_monsters?.monster_name || '',
      monster_category: item.mw_mst_monsters?.monster_category || '',
      nickname: profileData?.nickname || null,
      avatar_url: profileData?.avatar_url || null,
    }));
  } catch (error) {
    console.error('Fetch my strategies error:', error);
    return [];
  }
}

// いいねした攻略情報一覧取得
export async function fetchLikedStrategies(
  userId: string
): Promise<StrategyListItem[]> {
  try {
    // いいねした攻略情報のstrategy_noを取得
    const { data: likes, error: likesError } = await supabase
      .from('mw_likes')
      .select('strategy_no')
      .eq('user_id', userId);

    if (likesError || !likes || likes.length === 0) {
      return [];
    }

    const strategyNos = likes.map((l) => l.strategy_no);

    // 攻略情報を取得
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Fetch liked strategies error:', error);
      return [];
    }

    // ユーザーIDを収集してプロフィール情報を一括取得
    const userIds = [...new Set(data.map((item: any) => item.user_id))];
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
    return data.map((item: any) => ({
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
    }));
  } catch (error) {
    console.error('Fetch liked strategies error:', error);
    return [];
  }
}

// 攻略情報削除（物理削除）
export async function deleteStrategy(
  strategyNo: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // RLSで自分のデータのみ削除可能なため、直接削除を実行
    // 関連データ（mw_strategy_members, mw_likes等）はCASCADE削除される
    const { error: deleteError } = await supabase
      .from('mw_strategies')
      .delete()
      .eq('strategy_no', strategyNo)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete strategy error:', deleteError);
      return { success: false, error: '削除に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete strategy error:', error);
    return { success: false, error: '削除に失敗しました' };
  }
}
