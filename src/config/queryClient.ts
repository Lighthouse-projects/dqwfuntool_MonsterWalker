import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // キャッシュ時間: 5分
      staleTime: 5 * 60 * 1000,
      // ガベージコレクション時間: 30分
      gcTime: 30 * 60 * 1000,
      // エラー時のリトライ回数
      retry: 2,
      // バックグラウンドでのリフェッチを無効化（モバイル向け最適化）
      refetchOnWindowFocus: false,
    },
  },
});
