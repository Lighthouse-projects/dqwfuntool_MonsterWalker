import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// デバッグ用（本番では削除）
if (__DEV__) {
  if (!supabaseUrl || supabaseUrl === '') {
    console.warn('EXPO_PUBLIC_SUPABASE_URL is not set');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
    console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
}
