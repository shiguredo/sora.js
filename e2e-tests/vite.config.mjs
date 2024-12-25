import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// root が examples なので examples/dist にビルドされる

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    // NPM_PKG_E2E_TEST が true の時は alias を無効化する
    // これは .github/workflows/npm-pkg-e2e-test.yml で、
    // E2E テストで複数のバージョンの npm の sora-js-sdk をインストールして利用するため
    alias: process.env.NPM_PKG_E2E_TEST
      ? {}
      : {
          'sora-js-sdk': resolve(__dirname, '../dist/sora.mjs'),
        },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        sendrecv: resolve(__dirname, 'sendrecv/index.html'),
        sendonly: resolve(__dirname, 'sendonly/index.html'),
        recvonly: resolve(__dirname, 'recvonly/index.html'),
        check_stereo: resolve(__dirname, 'check_stereo/index.html'),
        check_stereo_multi: resolve(__dirname, 'check_stereo_multi/index.html'),
        replace_track: resolve(__dirname, 'replace_track/index.html'),
        simulcast: resolve(__dirname, 'simulcast/index.html'),
        spotlight_sendrecv: resolve(__dirname, 'spotlight_sendrecv/index.html'),
        spotlight_sendonly: resolve(__dirname, 'spotlight_sendonly/index.html'),
        spotlight_recvonly: resolve(__dirname, 'spotlight_recvonly/index.html'),
        sendonly_audio: resolve(__dirname, 'sendonly_audio/index.html'),
        messaging: resolve(__dirname, 'messaging/index.html'),
        data_channel_signaling_only: resolve(__dirname, 'data_channel_signaling_only/index.html'),
        whip: resolve(__dirname, 'whip/index.html'),
        whep: resolve(__dirname, 'whep/index.html'),
      },
    },
  },
  envDir: resolve(__dirname, '..'),
})
