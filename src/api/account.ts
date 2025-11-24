import { supabase } from '../config/supabase';

// アカウント削除
// Edge Function経由でauth.users削除を実行
// 関連データはCASCADE削除で自動的に削除される
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    // Edge Functionを呼び出し
    const { data, error } = await supabase.functions.invoke('delete-account');

    if (error) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message || '削除に失敗しました' };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    return { success: false, error: '削除に失敗しました' };
  }
}
