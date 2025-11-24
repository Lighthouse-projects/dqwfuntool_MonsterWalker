import { useQuery } from '@tanstack/react-query';
import {
  fetchMonsters,
  fetchWeapons,
  fetchJobs,
  type Monster,
  type Weapon,
  type Job,
} from '../api/masters';

// キャッシュ設定（マスタデータは頻繁に変わらない）
const STALE_TIME = 1000 * 60 * 30; // 30分間は再取得しない
const GC_TIME = 1000 * 60 * 60;    // 1時間キャッシュ保持

// モンスター一覧取得フック
export function useMonsters() {
  return useQuery<Monster[], Error>({
    queryKey: ['monsters'],
    queryFn: fetchMonsters,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// 武器一覧取得フック
export function useWeapons() {
  return useQuery<Weapon[], Error>({
    queryKey: ['weapons'],
    queryFn: fetchWeapons,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// 職業一覧取得フック
export function useJobs() {
  return useQuery<Job[], Error>({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// 全マスタデータ一括取得フック
export function useMasters() {
  const monstersQuery = useMonsters();
  const weaponsQuery = useWeapons();
  const jobsQuery = useJobs();

  const isLoading = monstersQuery.isLoading || weaponsQuery.isLoading || jobsQuery.isLoading;
  const isError = monstersQuery.isError || weaponsQuery.isError || jobsQuery.isError;

  return {
    monsters: monstersQuery.data ?? [],
    weapons: weaponsQuery.data ?? [],
    jobs: jobsQuery.data ?? [],
    isLoading,
    isError,
  };
}
