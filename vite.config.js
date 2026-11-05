import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  // Keep in step with the browserslist in package.json and the README.
  build: { target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'] },
})
