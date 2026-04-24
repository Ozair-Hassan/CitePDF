import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ include: ['src'] })],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CitePDF',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'pdfjs-dist'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'pdfjs-dist': 'pdfjsLib',
        },
      },
    },
  },
})
