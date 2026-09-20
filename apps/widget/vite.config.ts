import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development'),
  },
  build: {
    target: 'es2020',
    lib: {
      entry: resolve(__dirname, 'src/widget.tsx'),
      name: 'RoadlyWidget',
      formats: ['iife'],
      fileName: () => 'widget.js'
    }
  }
}))
