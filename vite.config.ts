import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const backendOrigin = apiUrl.replace(/\/api\/v1\/?$/, '');

  return {
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      open: false,
      proxy: {
        '/api/v1': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/docs': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/openapi.json': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/redoc': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
