import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  
  return {
    plugins: [react()],
    base: isDev ? '/' : '/tracc/', // Use root for dev, /tracc/ for production
    server: {
      // Ensure dev server works correctly
      port: 5173,
      host: true,
    },
    resolve: {
      // Ensure single React instance to prevent hook conflicts
      dedupe: ['react', 'react-dom'],
      alias: {
        // Force all React imports to use the same instance
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        // Fix CSS import from shared package
        '@santonastaso/shared/styles.css': path.resolve(__dirname, 'node_modules/@santonastaso/shared/dist/styles.css'),
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }
})