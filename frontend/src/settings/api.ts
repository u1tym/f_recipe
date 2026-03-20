// APIの起点（設定ファイル）
export const API_BASE_URL: string =
  // 開発時は CORS回避のため Vite の proxy 経由（vite.config.ts の /api）を使う
  import.meta.env.VITE_API_BASE_URL ?? '/api'

