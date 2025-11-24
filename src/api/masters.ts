import { supabase } from '../config/supabase';

// 型定義
export interface Monster {
  monster_no: number;
  monster_category: 'hokora' | 'megamon' | 'gigamon';
  monster_name: string;
  star_rank: number;
  release_date: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Weapon {
  weapon_no: number;
  weapon_name: string;
  star_rank: number;
  release_date: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Job {
  job_no: number;
  job_name: string;
  job_rank: 'basic' | 'advanced' | 'special';
  sort_order: number;
  is_active: boolean;
}

// モンスターカテゴリーの日本語表示
export const monsterCategoryLabels: Record<Monster['monster_category'], string> = {
  hokora: 'ほこら',
  megamon: 'メガモン',
  gigamon: 'ギガモン',
};

// 職業ランクの日本語表示
export const jobRankLabels: Record<Job['job_rank'], string> = {
  basic: '基本職',
  advanced: '上級職',
  special: '特級職',
};

// モンスター一覧取得
export async function fetchMonsters(): Promise<Monster[]> {
  const { data, error } = await supabase
    .from('mw_mst_monsters')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching monsters:', error);
    throw error;
  }

  return data || [];
}

// カテゴリー別モンスター取得
export async function fetchMonstersByCategory(
  category: Monster['monster_category']
): Promise<Monster[]> {
  const { data, error } = await supabase
    .from('mw_mst_monsters')
    .select('*')
    .eq('is_active', true)
    .eq('monster_category', category)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching monsters by category:', error);
    throw error;
  }

  return data || [];
}

// 武器一覧取得
export async function fetchWeapons(): Promise<Weapon[]> {
  const { data, error } = await supabase
    .from('mw_mst_weapons')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching weapons:', error);
    throw error;
  }

  return data || [];
}

// 職業一覧取得
export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('mw_mst_jobs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  return data || [];
}

// ランク別職業取得
export async function fetchJobsByRank(rank: Job['job_rank']): Promise<Job[]> {
  const { data, error } = await supabase
    .from('mw_mst_jobs')
    .select('*')
    .eq('is_active', true)
    .eq('job_rank', rank)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching jobs by rank:', error);
    throw error;
  }

  return data || [];
}
