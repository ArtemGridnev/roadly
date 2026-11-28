import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  test: {
    environment: 'jsdom',
    globals: true,
    unstubGlobals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_API_URL: 'http://api.test' },
  },
})
