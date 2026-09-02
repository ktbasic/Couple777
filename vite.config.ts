import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * VITE_ROUTER=hash produces the static-hosting build: hash routing (see
 * main.tsx) and pure-ASCII output. The ASCII part matters because that bundle
 * gets inlined into a single page whose host declares the charset — an em
 * dash or an emoji served as UTF-8 but read as Latin-1 turns into mojibake,
 * so the safe move is to leave no non-ASCII bytes to misread.
 */
export default defineConfig(() => {
  const staticBuild = process.env.VITE_ROUTER === 'hash';
  return {
    plugins: [react()],
    esbuild: staticBuild ? { charset: 'ascii' as const } : undefined,
    build: staticBuild ? { cssTarget: 'chrome80' } : undefined,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
