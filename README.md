# Sora JavaScript SDK

![Static Badge](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)
[![GitHub tag](https://img.shields.io/github/tag/shiguredo/sora-js-sdk.svg)](https://github.com/shiguredo/sora-js-sdk)
[![npm version](https://badge.fury.io/js/sora-js-sdk.svg)](https://badge.fury.io/js/sora-js-sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Sora JavaScript SDK は[株式会社時雨堂](https://shiguredo.jp/)が開発、販売している [WebRTC SFU Sora](https://sora.shiguredo.jp) / [Sora Cloud](https://sora-cloud.shiguredo.app/) をブラウザから扱うための SDK です。

## About Shiguredo's open source software

We will not respond to PRs or issues that have not been discussed on Discord. Also, Discord is only available in Japanese.

Please read <https://github.com/shiguredo/oss> before use.

## 時雨堂のオープンソースソフトウェアについて

利用前に <https://github.com/shiguredo/oss> をお読みください。

## 条件

- WebRTC SFU Sora 2024.1.0 以降
- TypeScript 5.1 以降

## 使い方

使い方は [Sora JavaScript SDK ドキュメント](https://sora-js-sdk.shiguredo.jp/) を参照してください。

## サンプル

サンプルは [sora-js-sdk-examples](https://github.com/shiguredo/sora-js-sdk-examples) を参照してください。

## インストール

### npm

```bash
npm install sora-js-sdk
```

### pnpm

```bash
pnpm add sora-js-sdk
```

### Node.js の条件

- Sora JavaScript SDK 2024.2.x までは **Node.js 18.0 以降** を要求します
- 次のリリース Sora JavaScript SDK 2025.1.0 以降は **Node.js 20.0 以降** を要求します

> [!CAUTION]
> Sora JavaScript SDK 2024.2.0 以降は [Compression Stream API](https://developer.mozilla.org/ja/docs/Web/API/Compression_Streams_API) を利用しているため、ブラウザの要件がありますのでご確認ください。
>
> - Chrome / Edge 80 以降
> - Firefox 113 以降
> - Safari 16.4 以降

## E2E (End to End) テスト

Playwright を利用した E2E テストを実行できます。

```bash
# .env.local を作成して適切な値を設定してください
$ cp .env.template .env.local
$ pnpm install
$ pnpm run build
$ pnpm exec playwright install chromium --with-deps
$ pnpm run e2e-test
```

### E2E テストページ

E2E テストで実行するページを Vite にて起動できます。

```bash
pnpm run e2e-dev
```

## マルチトラックについて

[WebRTC SFU Sora](https://sora.shiguredo.jp) は 1 メディアストリームにつき 1 音声トラック、
1 映像トラックまでしか対応していないため, Sora JavaScript SDK はマルチトラックに対応していません。

マルチトラックへの対応は今のところ未定です。

## API 一覧

[Sora JavaScript SDK ドキュメント API リファレンス](https://sora-js-sdk.shiguredo.jp/api.html)

## ライセンス

Apache License 2.0

```text
Copyright 2017-2025, Shiguredo Inc.
Copyright 2017-2022, Yuki Ito (Original Author)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## リンク

### 商用製品

- [WebRTC SFU Sora](https://sora.shiguredo.jp)
  - [WebRTC SFU Sora ドキュメント](https://sora-doc.shiguredo.jp)
- [Sora Cloud](https://sora-cloud.shiguredo.jp)
  - [Sora Cloud ドキュメント](https://doc.sora-cloud.shiguredo.app)

### 無料検証サービス

- [Sora Labo](https://sora-labo.shiguredo.app)
  - [Sora Labo ドキュメント](https://github.com/shiguredo/sora-labo-doc)

### クライアント SDK

- [Sora JavaScript SDK](https://github.com/shiguredo/sora-javascript-sdk)
  - [Sora JavaScript SDK ドキュメント](https://sora-js-sdk.shiguredo.jp/)
- [Sora iOS SDK](https://github.com/shiguredo/sora-ios-sdk)
  - [Sora iOS SDK ドキュメント](https://sora-ios-sdk.shiguredo.jp/)
  - [Sora iOS SDK クイックスタート](https://github.com/shiguredo/sora-ios-sdk-quickstart)
  - [Sora iOS SDK サンプル集](https://github.com/shiguredo/sora-ios-sdk-samples)
- [Sora Android SDK](https://github.com/shiguredo/sora-android-sdk)
  - [Sora Android SDK ドキュメント](https://sora-android-sdk.shiguredo.jp/)
  - [Sora Android SDK クイックスタート](https://github.com/shiguredo/sora-android-sdk-quickstart)
  - [Sora Android SDK サンプル集](https://github.com/shiguredo/sora-android-sdk-samples)
- [Sora Unity SDK](https://github.com/shiguredo/sora-unity-sdk)
  - [Sora Unity SDK ドキュメント](https://sora-unity-sdk.shiguredo.jp/)
  - [Sora Unity SDK サンプル集](https://github.com/shiguredo/sora-unity-sdk-samples)
- [Sora Python SDK](https://github.com/shiguredo/sora-python-sdk)
  - [Sora Python SDK ドキュメント](https://sora-python-sdk.shiguredo.jp/)
  - [Sora Python SDK サンプル集](https://github.com/shiguredo/sora-python-sdk-samples)
- [Sora C++ SDK](https://github.com/shiguredo/sora-cpp-sdk)
- [Sora C SDK](https://github.com/shiguredo/sora-c-sdk)

### クライアントツール

- [Sora DevTools](https://github.com/shiguredo/sora-devtools)
- [Media Processors](https://github.com/shiguredo/media-processors)
- [WebRTC Native Client Momo](https://github.com/shiguredo/momo)

### サーバーツール

- [WebRTC Load Testing Tool Zakuro](https://github.com/shiguredo/zakuro)
  - Sora 専用負荷試験ツール
- [WebRTC Stats Collector Kohaku](https://github.com/shiguredo/kohaku)
  - Sora 専用統計収集ツール
- [Recording Composition Tool Hisui](https://github.com/shiguredo/hisui)
  - Sora 専用録画ファイル合成ツール
- [Audio Streaming Gateway Suzu](https://github.com/shiguredo/suzu)
  - Sora 専用音声解析ゲートウェイ
- [Sora Archive Uploader](https://github.com/shiguredo/sora-archive-uploader)
  - Sora 専用録画ファイル S3 互換オブジェクトストレージアップロードツール
- [Prometheus exporter for WebRTC SFU Sora metrics](https://github.com/shiguredo/sora_exporter)
  - Sora 専用 OpenMetrics 形式エクスポーター
