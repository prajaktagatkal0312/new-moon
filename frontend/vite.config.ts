import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path';
import fs from 'fs';

function midnightZkAssets() {
  return {
    name: 'midnight-zk-assets',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/moon-vow')) {
          const filePath = path.join(__dirname, '../contracts/managed', req.url);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            if (ext === '.prover' || ext === '.verifier' || ext === '.zkir' || ext === '.bzkir') {
               res.setHeader('Content-Type', 'application/octet-stream');
            }
            res.end(fs.readFileSync(filePath));
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
       fs.mkdirSync(path.resolve(__dirname, 'dist/moon-vow/keys'), { recursive: true });
       fs.mkdirSync(path.resolve(__dirname, 'dist/moon-vow/zkir'), { recursive: true });
       fs.cpSync(path.resolve(__dirname, '../contracts/managed/moon-vow/keys'), path.resolve(__dirname, 'dist/moon-vow/keys'), { recursive: true });
       fs.cpSync(path.resolve(__dirname, '../contracts/managed/moon-vow/zkir'), path.resolve(__dirname, 'dist/moon-vow/zkir'), { recursive: true });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    midnightZkAssets(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@contracts': path.resolve(__dirname, '../contracts'),
      'isomorphic-ws': path.resolve(__dirname, './src/mock-ws.js'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/compact-runtime'],
    include: ['object-inspect'],
  },
  build: {
    target: 'esnext',
  },
});
