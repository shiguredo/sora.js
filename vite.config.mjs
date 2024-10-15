import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// root が examples なので examples/dist にビルドされる

export default defineConfig({
  root: resolve(__dirname, 'examples'),
  resolve: {
    // NPM_PKG_E2E_TEST が true の時は alias を無効化する
    // これは .github/workflows/npm-pkg-e2e-test.yml で、
    // E2E テストで複数のバージョンの npm の sora-js-sdk をインストールして利用するため
    alias: process.env.NPM_PKG_E2E_TEST
      ? {}
      : {
          'sora-js-sdk': resolve(__dirname, 'dist/sora.mjs'),
        },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'examples/index.html'),
        sendrecv: resolve(__dirname, 'examples/sendrecv/index.html'),
        sendonly: resolve(__dirname, 'examples/sendonly/index.html'),
        recvonly: resolve(__dirname, 'examples/recvonly/index.html'),
        check_stereo: resolve(__dirname, 'examples/check_stereo/index.html'),
        check_stereo_multi: resolve(__dirname, 'examples/check_stereo_multi/index.html'),
        simulcast: resolve(__dirname, 'examples/simulcast/index.html'),
        spotlight_sendrecv: resolve(__dirname, 'examples/spotlight_sendrecv/index.html'),
        spotlight_sendonly: resolve(__dirname, 'examples/spotlight_sendonly/index.html'),
        spotlight_recvonly: resolve(__dirname, 'examples/spotlight_recvonly/index.html'),
        sendonly_audio: resolve(__dirname, 'examples/sendonly_audio/index.html'),
        messaging: resolve(__dirname, 'examples/messaging/index.html'),
      },
    },
  },
  envDir: resolve(__dirname, './'),
})
