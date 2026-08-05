# QA-Sensei 🤖
**GitHub Actions × Gemini API** で、PR（プルリクエスト）のコード差分を
QA視点で自動レビュー＆自律修復するCI/CDツール

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 💡 QA-Sensei とは？
**QA-Sensei** は、Pull Requestの変更差分（diff）に対して、**QA（品質保証）エンジニアの観点**
から自動レビューを行うGitHub Custom Actionです。
単なる構文チェックにとどまらず、型チェック（tsc）による静的解析とGemini APIによる
自動判定・コード修復エンジンの連携により、バグの早期発見と修正案の提示を自動化します。

## ✨ 主な機能
1. QA思考ロジックによる自動レビュー
    PR差分を解析し、境界値・エッジケース・異常系テストの観点から問題点を指摘。

2. 型チェック＆自律修復エンジン
    バックグラウンドで TypeScript の型チェック（tsc）を実行。
    エラーが検出された場合、Gemini APIが自動で修復コード案（Fixer）を生成。

3. PRへのシームレスなフィードバック
    レビュー結果と修正案をPRのコメントとして自動投稿。

## 🚀 使い方
自身のワークフロー（`.github/workflows/qa-sensei.yml`）に以下のように追加します。

```yaml
name: QA-Sensei Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  qa-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run QA-Sensei
        uses: nao-dev-glitch/qa-sensei@main
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## 🛠️ 技術スタック
    Language: TypeScript (Node.js v20)
    AI Model: Google Gemini API (@google/genai)
    CI/CD Platform: GitHub Actions (@actions/core, @actions/github)

## 📝 開発の背景 / Qiita記事
本プロジェクトの開発経緯や、プロンプトエンジニアリング・型チェック連携の仕組みについてはQiitaにて解説しています。

👉 【個人開発】Gemini API × GitHub ActionsでPRのQAレビューを自動化する「QA-Sensei」を作ってみた（記事URL）

## 📄 ライセンス
MIT License

## 📁 ディレクトリ構成
```text
qa-sensei/
├── README.md
├── package-lock.json
├── package.json
├── packages
│   └── qa-sensei-engine                # 自動判定・修復エンジン(Core Package)
│       ├── package.json
│       ├── src
│       │   ├── engine
│       │   │   └── codeGenerator.ts    # Gemini APIを活用したコード自動生成・修復
│       │   ├── index.ts                # エンジンのエントリーポイント
│       │   ├── services
│       │   │   ├── parser.ts           # PR差分(diff)等の解析処理
│       │   │   └── tscRunner.ts        # tscによる静的解析・型チェック実行
│       │   └── types
│       │       └── index.ts            # エンジン用型定義
│       └── tsconfig.json
└── src                                 # QA思考ロジック・GitHub Actions連携層
    ├── index.ts                        # アクション全体のエントリーポイント
    └── services
        └── qaGeneratorService.ts       # QA観点でのレビュー生成サービス

9 directories, 13 files
```
