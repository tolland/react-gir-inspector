import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      base: process.env.NODE_ENV === 'production' ? '/react-gir-inspector/' : '/'
    };
});
