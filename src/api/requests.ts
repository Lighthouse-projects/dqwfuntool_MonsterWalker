import { supabase } from '../config/supabase';

// 要望カテゴリー
export type RequestCategory = 'monster' | 'weapon' | 'job' | 'bug' | 'feature' | 'question' | 'other';

// 対応ステータス
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

// 要望カテゴリーラベル
export const requestCategoryLabels: Record<RequestCategory, string> = {
  monster: 'モンスターマスタ',
  weapon: '武器マスタ',
  job: '職業マスタ',
  bug: '不具合報告',
  feature: '機能要望',
  question: '質問',
  other: 'その他',
};

// 対応ステータスラベル
export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  completed: '対応完了',
  rejected: '対応不可',
};

// ステータスカラー
export const requestStatusColors: Record<RequestStatus, string> = {
  pending: '#999999',
  in_progress: '#FF9500',
  completed: '#34C759',
  rejected: '#FF3B30',
};

// 要望アイテム
export interface RequestItem {
  request_no: number;
  user_id: string;
  category: RequestCategory;
  content: string;
  status: RequestStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  nickname: string | null;
}

// 要望送信
export async function createRequest(
  userId: string,
  category: RequestCategory,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mw_requests')
      .insert({
        user_id: userId,
        category,
        content,
      });

    if (error) {
      console.error('Create request error:', error);
      return { success: false, error: '送信に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('Create request error:', error);
    return { success: false, error: '送信に失敗しました' };
  }
}

// 要望一覧取得（全件）
export async function fetchRequests(): Promise<RequestItem[]> {
  try {
    const { data, error } = await supabase
      .from('mw_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Fetch requests error:', error);
      return [];
    }

    // ユーザーIDを収集してプロフィール情報を一括取得
    const userIds = [...new Set(data.map((item) => item.user_id))];
    let profilesMap: Record<string, { nickname: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', userIds);

      if (profilesData) {
        profilesMap = profilesData.reduce((acc, p) => {
          acc[p.user_id] = { nickname: p.nickname };
          return acc;
        }, {} as Record<string, { nickname: string | null }>);
      }
    }

    // データ整形
    return data.map((item) => ({
      request_no: item.request_no,
      user_id: item.user_id,
      category: item.category,
      content: item.content,
      status: item.status,
      admin_comment: item.admin_comment,
      created_at: item.created_at,
      updated_at: item.updated_at,
      nickname: profilesMap[item.user_id]?.nickname || null,
    }));
  } catch (error) {
    console.error('Fetch requests error:', error);
    return [];
  }
}
