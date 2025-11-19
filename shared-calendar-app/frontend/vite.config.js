import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ★★★ GitHub Pages用のベースパス設定を追加 ★★★
  // リポジトリ名に合わせて設定します。
  base: '/shared-calendar/', 
});