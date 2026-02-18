# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sims 4 MOD開発のマルチプロジェクトリポジトリ。MODは種類別にフォルダで管理し、共通仕様・ライブラリ・ツールは`docs/`や`src/`に配置する。S4TK (Sims 4 Toolkit) VSCode拡張を使い、TypeScriptベースのワークフローで`.package`ファイルを作成・管理する。

## Development Environment

- **Shell**: PowerShell (Windows)
- **Sims 4**: このPCにインストール済み
- **Mods配置先**: `C:\Users\kokor\Documents\Electronic Arts\The Sims 4\Mods`
- **エディタ**: VSCode + [S4TK拡張](https://marketplace.visualstudio.com/items?itemName=sims4toolkit.s4tk-vscode)

## Language

All responses and communications should be in **Japanese (日本語)**. Code comments may remain in English.

## Mandatory: TypeScript First

- ビルドスクリプト・ツール・共通ライブラリは**TypeScriptで記述**すること。JavaScript（.js/.cjs/.mjs）は使用禁止
- `tsconfig.json`は`strict: true`を使用
- Package MOD（.package）の作成はS4TK + TypeScriptワークフローで行う
- Script MOD（.ts4script）はゲームランタイム制約上Python 3.7を使用（例外）

## Repository Structure

```
docs/
  research/             # リサーチ結果・情報収集ドキュメント
src/                    # 共通ライブラリ・ツール
mods/
  <mod-name>/           # 各MODのフォルダ（種類別）
    package.json        # npm scripts: build, build:dry, deploy, clean
    tsconfig.json       # TypeScript設定
    build.ts            # TypeScriptビルドスクリプト（@s4tk使用）
    s4tk.config.json    # S4TK VSCode拡張用設定
    src/                # MODソースファイル
      tuning/           # チューニングXML、SimData XML
      strings/          # 文字列テーブル（.stbl.json推奨）
      packages/         # 既存の.packageファイル（マージ用）
    dist/               # ビルド出力先（.package）
```

## Key Concepts

### リソースキー（TGI）
ゲーム内の全リソースは **Type (32bit) + Group (32bit) + Instance (64bit)** で識別される。
- カスタムコンテンツではGroup・Instanceの**最上位ビットを1**に設定して公式コンテンツとの衝突を防ぐ
- InstanceにはFNV-1ハッシュを使用（作者名+MOD名等から生成）

### リソースタイプ
- **Tuning (XML)**: ゲーム動作の設定。バフ、トレイト、インタラクション等を定義
- **SimData**: チューニングと対になるバイナリデータ（S4TKではXML形式で編集）。チューニングとの要素一致が必須
- **StringTable (STBL)**: ゲーム内テキストのローカライズテーブル（JSON形式管理推奨）
- **Package (.package)**: 上記リソースをまとめたバイナリコンテナ

## Build & Deploy

### 方法1: npm スクリプト（推奨）

各MODフォルダ内で実行:

```powershell
cd mods/<mod-name>
npm ci                  # 依存インストール（初回 or lockfile変更時）
npm run build           # ビルド → dist/ に .package 出力
npm run build:dry       # Dry Run（出力なし、検証のみ）
npm run deploy          # ビルド + Modsフォルダへ自動デプロイ
npm run clean           # dist/ を削除
```

### 方法2: S4TK VSCode拡張（GUI）

1. `s4tk.config.json` 内の `buildInstructions` 上に表示されるボタンをクリック
2. VSCodeコマンドパレット (`Ctrl+Shift+P`) → "S4TK" で検索
3. `s4tk.config.json` を右クリック → コンテキストメニューからビルド

ビルドタイプ:
- **Build**: パッケージを`destinations`に出力
- **Dry Run**: ファイル出力なしのテストビルド（BuildSummary.jsonのみ生成）
- **Release**: パッケージをZIPにまとめて配布用に出力

## S4TK npm Packages

各MODの `build.ts` で使用するS4TKパッケージ群:

- `@s4tk/models` — パッケージとリソースのモデル（コア）
- `@s4tk/hashing` — FNV-1ハッシュ等
- `@s4tk/xml-dom` — チューニングXML操作
- `@s4tk/tunables` — チューナブルノード操作
- `@s4tk/extraction` — ゲームファイルの抽出
- `@s4tk/validation` — パッケージ・リソースの検証

## Testing & Debugging

4層のテスト・デバッグ戦略を採用する。詳細は `docs/research/Sims 4 Mod テスト・デバッグ手法.md` を参照。

### 1. 単体テスト（ゲーム外）
- `npm run test` — mocha + chai で各MODの `test/` 内テストを実行
- `npm run typecheck` — TypeScript型チェック（`tsc --noEmit`）
- テスト対象: ハッシュ生成、Instance ID計算、STBL JSON構造、リソースキー一意性
- Script MOD（Python）: `unittest` + `unittest.mock` でゲームAPIをモック化

### 2. ビルド検証（ゲーム外）
- `npm run build:dry` — Dry Runでリソース読み込み・ハッシュ生成の検証
- **S4TK Dry Run** — BuildSummary.jsonでTGI重複・欠落を検出
- **@s4tk/models** — .packageを読み込んでTGI一覧確認スクリプト作成可能
- **Sims 4 Studio / S4TK Package Tools** — .packageの中身をGUI/Webで閲覧

### 3. ゲーム内テスト
- **チートコンソール**: `Ctrl+Shift+C` → `testingCheats true`
  - `sims.add_buff` / `sims.remove_buff` — バフのテスト
  - `traits.equip_trait` / `traits.remove_trait` — トレイトのテスト
  - Shift+クリック — デバッグメニュー表示
  - `cas.fulleditmode` / `bb.showhiddenobjects` — 編集・表示拡張
- **MCCC** — ログ出力・例外レポート（mc_lastexception.html）
- **S4CL Testing Framework** — ゲーム内 `s4clib.run_tests` でScript MODのテスト実行

### 4. ログ・例外解析
- **LastException.txt**: `Documents\Electronic Arts\The Sims 4\` に自動生成。https://lastexception.com/ で整形
- **Better Exceptions**: 原因MOD特定HTMLレポート生成
- **S4CLログ**: `CommonLogRegistry` で `mod_logs/` にファイル出力
- **PyCharm リモートデバッグ**: Python Debug Serverでゲームプロセスにアタッチ（Script MOD用）

## Reference

- 詳細リサーチ: `docs/research/sims4_mod_development_guide.md`
- S4TKドキュメント: https://sims4toolkit.com/ / https://vscode.sims4toolkit.com/
- EA MODポリシー: https://help.ea.com/en/articles/the-sims/the-sims-4/mods-policy/
- Modders Reference: https://thesims4moddersreference.org/reference/file-types/
