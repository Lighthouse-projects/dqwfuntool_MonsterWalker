import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// OAuth完了後のブラウザセッションを閉じる
WebBrowser.maybeCompleteAuthSession();

// リダイレクトURIを生成
const redirectUri = makeRedirectUri({
  scheme: 'monsterwalker',
  path: 'auth/callback',
});

interface Profile {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  x_account_public: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithX: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithX = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Supabaseから認証URLを取得
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true, // ブラウザリダイレクトをスキップしてURLを取得
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.url) {
        return { success: false, error: '認証URLの取得に失敗しました' };
      }

      // WebBrowserでOAuth認証ページを開く
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );

      if (result.type === 'success') {
        // コールバックURLからトークンを抽出
        const url = result.url;

        // URLからアクセストークンとリフレッシュトークンを取得
        // Supabaseは #access_token=...&refresh_token=... の形式でトークンを返す
        const hashParams = url.split('#')[1];
        if (hashParams) {
          const params = new URLSearchParams(hashParams);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            // セッションを設定
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              return { success: false, error: sessionError.message };
            }

            return { success: true };
          }
        }

        // エラーパラメータのチェック
        const queryParams = url.split('?')[1];
        if (queryParams) {
          const params = new URLSearchParams(queryParams);
          const errorDescription = params.get('error_description');
          if (errorDescription) {
            return { success: false, error: decodeURIComponent(errorDescription) };
          }
        }

        return { success: false, error: '認証情報の取得に失敗しました' };
      } else if (result.type === 'cancel') {
        return { success: false, error: '認証がキャンセルされました' };
      } else {
        return { success: false, error: '認証に失敗しました' };
      }
    } catch (error) {
      console.error('Error signing in with X:', error);
      return { success: false, error: '通信エラーが発生しました' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signInWithX,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
