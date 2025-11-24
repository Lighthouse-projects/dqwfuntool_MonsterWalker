import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStrategy, type Strategy, type StrategyMember } from '../api/strategies';

// キャッシュ設定（攻略情報はユーザーが更新する可能性があるため短め）
const STALE_TIME = 1000 * 60 * 5;  // 5分間は再取得しない
const GC_TIME = 1000 * 60 * 30;    // 30分キャッシュ保持

export interface StrategyData {
  strategy: Strategy;
  members: StrategyMember[];
}

// 攻略情報詳細取得フック
export function useStrategy(strategyNo: number) {
  return useQuery<StrategyData | null, Error>({
    queryKey: ['strategy', strategyNo],
    queryFn: () => fetchStrategy(strategyNo),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// キャッシュ無効化用フック
export function useInvalidateStrategy() {
  const queryClient = useQueryClient();

  // 特定の攻略情報のキャッシュを無効化
  const invalidate = (strategyNo: number) => {
    queryClient.invalidateQueries({ queryKey: ['strategy', strategyNo] });
  };

  // 全ての攻略情報キャッシュを無効化
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['strategy'] });
  };

  return { invalidate, invalidateAll };
}
