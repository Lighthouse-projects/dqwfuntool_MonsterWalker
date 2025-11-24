import { supabase } from '../config/supabase';
import { File } from 'expo-file-system/next';
import { decode } from 'base64-arraybuffer';

// 型定義
export type StrategyType = 'oneshot' | 'semiauto' | 'auto';

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
  is_deleted: boolean;
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
