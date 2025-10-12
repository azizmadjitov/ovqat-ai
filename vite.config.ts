import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';

// Custom plugin to copy assets and design folders to dist
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      function copyRecursive(src: string, dest: string) {
        mkdirSync(dest, { recursive: true });
        const entries = readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
          }
        }
      }
      
      // Copy assets folder
      copyRecursive('assets', 'dist/assets');
      
      // Copy design folder (for design tokens)
      copyRecursive('design', 'dist/design');
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), copyAssetsPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      publicDir: false,
      build: {
        outDir: 'dist',
        assetsDir: '_vite_assets',
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const extType = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                return `_vite_assets/img/[name][extname]`;
              } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
                return `_vite_assets/fonts/[name][extname]`;
              } else if (/css/i.test(extType)) {
                return `_vite_assets/[name][extname]`;
              }
              return `_vite_assets/[name]-[hash][extname]`;
            },
            chunkFileNames: '_vite_assets/[name]-[hash].js',
            entryFileNames: '_vite_assets/[name]-[hash].js',
          },
        },
        copyPublicDir: true,
      },
    };
});