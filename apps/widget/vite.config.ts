import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'path'

// A script without a charset is decoded with the host page's encoding, which garbles Hebrew on a non-UTF-8 page.
const asciiOnlyBundle = (): Plugin => ({
  name: 'ascii-only-bundle',
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === 'chunk') {
        file.code = file.code.replace(
          /[\u0080-￿]/g,
          (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
        )
      }
    }
  },
})

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
    asciiOnlyBundle(),
  ],
  server: {
    port: 5175,
    strictPort: true,
  },
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
