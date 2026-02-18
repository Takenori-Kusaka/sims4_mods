# AGENTS.md

Sims 4 MOD開発マルチプロジェクトリポジトリ向けのAIエージェント指示ファイル。

## Commands

```powershell
# === Package MOD ビルド（各MODフォルダ内で実行） ===
# 方法1: npm スクリプト（推奨）
cd mods/<mod-name>
npm ci                        # 依存インストール（初回 or lockfile変更時）
npm run build                 # ビルド（dist/ に .package 出力）
npm run build:dry             # Dry Run（ファイル出力なし、検証のみ）
npm run deploy                # ビルド + Modsフォルダへデプロイ
npm run clean                 # dist/ を削除
npm run test                  # 単体テスト実行（mocha）
npm run typecheck             # TypeScript型チェック（tsc --noEmit）

# 方法2: S4TK VSCode拡張（GUI）
# Ctrl+Shift+P → "S4TK: Build" / "S4TK: Dry Run" / "S4TK: Release"

# === リント ===
npx eslint . --fix
```

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js
- **MOD Toolkit:** S4TK (Sims 4 Toolkit) — VSCode拡張 + npmパッケージ群
- **Package Manager:** npm
- **Editor:** VSCode + S4TK拡張 (sims4toolkit.s4tk-vscode)
- **Shell:** PowerShell (Windows)

### S4TK npm Packages (@s4tk scope)

| Package | Purpose |
|---------|---------|
| `@s4tk/models` | パッケージ・リソースモデル（コア） |
| `@s4tk/hashing` | FNV-1ハッシュ生成 |
| `@s4tk/xml-dom` | チューニングXML DOM操作 |
| `@s4tk/tunables` | チューナブルノード操作 |
| `@s4tk/extraction` | ゲームファイル抽出・インデックス |
| `@s4tk/validation` | パッケージ・リソース検証 |
| `@s4tk/encoding` | バイナリファイル読み書き |
| `@s4tk/compression` | ファイル圧縮 |
| `@s4tk/images` | 画像処理 |

## Project Structure

```
CLAUDE.md                     # Claude Code 向け指示
AGENTS.md                     # AIエージェント共通指示（本ファイル）
.github/
  agents/                     # カスタムエージェント定義
docs/
  research/                   # リサーチ結果・情報収集
src/                          # 共通ライブラリ・ツール（TypeScript）
mods/
  README.md                   # MOD一覧・概要
  career_auto_tasks/          # S4TK MOD: キャリア自動タスク
    package.json              # npm scripts: build, build:dry, deploy, clean
    tsconfig.json             # TypeScript設定
    build.ts                  # TypeScriptビルドスクリプト（@s4tk使用）
    s4tk.config.json          # S4TK VSCode拡張用設定
    src/tuning/               # buffs/, interactions/, traits/
    src/strings/              # .stbl.json (EN + JA)
    dist/                     # ビルド出力先（.package）
  education_auto_tasks/       # S4TK MOD: 教育自動タスク
    package.json              # npm scripts: build, build:dry, deploy, clean
    tsconfig.json
    build.ts
    s4tk.config.json
    src/tuning/
    src/strings/
    dist/
  auto_tasks_controller/      # Python Script MOD: 自動タスク制御
    scripts/kokor_auto_tasks/ # Python source (.py)
build_scripts.ps1             # PowerShellビルドスクリプト（ts4script用）
```

### MODの2種類

| 種類 | ツール | 成果物 | ビルド方法 | 例 |
|------|--------|--------|-----------|-----|
| **Package MOD** | S4TK (TypeScript) | `.package` | `npm run build` (各MODフォルダ内) | career_auto_tasks, education_auto_tasks |
| **Script MOD** | Python 3.7 | `.ts4script` | `build_scripts.ps1` | auto_tasks_controller |

Package MODの新規作成時は必ずS4TK + TypeScriptワークフローを使用すること。Script MODはゲームランタイムの制約上Python 3.7を使用する。

### Package MOD npm scripts

各Package MODフォルダの `package.json` に以下のスクリプトが定義されている:

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `ts-node build.ts` | ビルド → `dist/` に `.package` 出力 |
| `build:dry` | `ts-node build.ts --dry-run` | Dry Run（出力なし、検証のみ） |
| `deploy` | `ts-node build.ts --deploy` | ビルド + Modsフォルダへ自動コピー |
| `clean` | `rimraf dist` | `dist/` を削除 |
| `test` | `mocha` | 単体テスト実行 |
| `typecheck` | `tsc --noEmit` | TypeScript型チェック |

## Code Style

### TypeScript必須

全てのスクリプト・ツール・ビルドスクリプトは**TypeScriptで記述**すること。JavaScriptは使用しない。

```typescript
// ✅ Good - TypeScript with types
import { Package, ResourceKey } from "@s4tk/models";
import { fnv64 } from "@s4tk/hashing";

async function buildMod(sourcePath: string): Promise<Package> {
  const pkg = new Package();
  // ...
  return pkg;
}

// ❌ Bad - JavaScript / untyped
const { Package } = require("@s4tk/models");

async function buildMod(sourcePath) {
  const pkg = new Package();
  // ...
  return pkg;
}
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "./dst"
  },
  "include": ["./src/**/*.ts"]
}
```

### Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Functions / Variables | camelCase | `buildPackage`, `resourceKey` |
| Classes / Types | PascalCase | `ModBuilder`, `TuningResource` |
| Constants | UPPER_SNAKE_CASE | `MODS_DIR`, `DEFAULT_GROUP` |
| Files (TS) | camelCase | `modBuilder.ts`, `hashUtils.ts` |
| Files (Tuning XML) | Sims 4 convention | `buff_Example.xml`, `buff_Example.SimData.xml` |
| Files (STBL JSON) | descriptive | `default.stbl.json` |

## Sims 4 MOD Key Concepts

### Resource Keys (TGI)

全リソースは **Type (32bit) + Group (32bit) + Instance (64bit)** で一意識別される。

- カスタムコンテンツでは Group・Instance の**最上位ビットを1**に設定
- Instance は **FNV-1ハッシュ**で生成（作者名+MOD名等から）
- `@s4tk/hashing` の `fnv64()` を使用

### Resource Types

| Resource | Format | Description |
|----------|--------|-------------|
| Tuning | `.xml` | ゲーム動作設定（バフ、トレイト、インタラクション等） |
| SimData | `.SimData.xml` | チューニングと対のバイナリデータ。要素の一致が必須 |
| StringTable | `.stbl.json` | ゲーム内テキスト（ローカライズ） |
| Package | `.package` | 上記をまとめたバイナリコンテナ |

### ⚠️ Tuning Resource Type IDs (CRITICAL)

**各チューニングタイプには固有の Resource Type ID が必要。間違った Type ID を使うとゲームに認識されない。**

**値は S4TK の TuningResourceType / BinaryResourceType enum から取得すること。**

| Tuning Type | Type ID | Group | 10進数 | 備考 |
|-------------|---------|-------|--------|------|
| **Trait** | `0xCB5FDDC7` | `0x00000000` | 3412057543 | 特質 |
| **Buff** | `0x6017E896` | `0x00000000` | 1612179606 | バフ/ムードレット |
| **Interaction** | `0xE882D22F` | `0x00000000` | 3900887599 | インタラクション全般 |
| **Snippet/Loot** | `0x7DF2169C` | `0x00000000` | 2113017500 | LootActions等のSnippet |
| **StringTable** | `0x220557DA` | `0x80000000` | 570775514 | 文字列テーブル |
| **SimData** | `0x545AC67A` | varies | 1415235194 | SimData（StringTableと混同注意！） |
| **Statistic** | `0x339BC5BD` | `0x00000000` | 865846717 | Traitと混同しやすい！ |
| ~~Generic~~ | ~~`0x03B33006`~~ | - | 62078431 | **使用非推奨** |

**よくある間違い:**
- `0x339BC5BD` は **Statistic** であり Trait ではない！
- `0x545AC67A` は **SimData** であり StringTable ではない！
- StringTable の正しい Type ID は `0x220557DA`

```typescript
// ✅ 正しい例（S4TK TuningResourceType enum準拠）
pkg.add(
  { type: 0xCB5FDDC7, group: 0x00000000, instance: instanceId }, // Trait
  resource
);
pkg.add(
  { type: 0x6017E896, group: 0x00000000, instance: instanceId }, // Buff
  resource
);
pkg.add(
  { type: 0x220557DA, group: 0x80000000, instance: instanceId }, // StringTable
  stbl
);

// ❌ 間違い（ゲームに認識されない）
pkg.add(
  { type: 0x03B33006, group: 0x80000000, instance: instanceId }, // Generic（非推奨）
  resource
);
pkg.add(
  { type: 0x339BC5BD, group: 0x00000000, instance: instanceId }, // StatisticをTraitと誤用
  resource
);
```

**重要ポイント:**
- Tuning の **Group は常に `0x00000000`**（StringTable のみ `0x80000000`）
- Instance の**最上位ビットを1**に設定
- `npm run test` で Resource Type ID を自動検証

### S4TK Build Config (s4tk.config.json)

```json
{
  "buildInstructions": {
    "source": "src",
    "destinations": [
      "out",
      "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods"
    ],
    "packages": [
      {
        "filename": "ModName",
        "include": ["**/*"],
        "exclude": []
      }
    ]
  },
  "buildSettings": {
    "allowEmptyPackages": false,
    "allowFolderCreation": false,
    "allowMissingSourceFiles": false,
    "allowPackageOverlap": false,
    "allowResourceKeyOverrides": false,
    "outputBuildSummary": "partial"
  },
  "stringTableSettings": {
    "allowStringKeyOverrides": false,
    "generateMissingLocales": true,
    "mergeStringTablesInSamePackage": true
  }
}
```

## Testing & Debugging

### テスト・デバッグ戦略（4層アプローチ）

| 層 | 実行環境 | 対象 | ツール | 実行タイミング |
|----|---------|------|--------|---------------|
| **1. 単体テスト** | ゲーム外（ローカルPC） | **Resource Type ID検証**、ビルドロジック、ハッシュ生成 | `npm run test`（mocha + chai） | **ビルド後 必須** |
| **2. ビルド検証** | ゲーム外（ローカルPC） | .package構造、TGI整合性、リソースキー重複 | `npm run build:dry`、S4TK Dry Run | ビルドごと |
| **3. ゲーム内テスト** | ゲーム内 | バフ・トレイト・インタラクションの動作確認 | チートコンソール、MCCC | デプロイ後 |
| **4. ログ・例外解析** | ゲーム内 | ランタイムエラー、MOD間の競合 | LastException.txt、Better Exceptions | 問題発生時 |

### 1. 単体テスト（ゲーム外）— 最重要

各MODフォルダの `test/` にテストを配置し、`npm run test` で実行:

```powershell
cd mods/career_auto_tasks
npm run test          # mocha で単体テスト実行
npm run typecheck     # TypeScript型チェック（tsc --noEmit）
```

テスト対象:
- **Resource Type ID の正当性** ← 最重要！間違った Type ID はゲームに認識されない
- `build.ts` のヘルパー関数（ハッシュ生成、ファイル読み込み、Instance ID計算）
- StringTableのJSON構造の正当性
- リソースキーの一意性検証
- Tuning の Group = 0x00000000 であること
- Instance の最上位ビットが1であること

Script MOD（Python）の場合は `unittest` + `unittest.mock` でゲームAPIをモック化してテスト可能。

### 2. ビルド検証（ゲーム外）

- **npm run build:dry**: Dry Run でリソース読み込み・ハッシュ生成を検証（ファイル出力なし）
- **S4TK Dry Run**: `BuildSummary.json` でリソースキーの重複・欠落を検出
- **s4tk-cache.json**: リソースキー問題時は削除して再ビルド
- **@s4tk/models**: `.package` ファイルを読み込んでTGI一覧を確認するスクリプトを作成可能
- **Sims 4 Studio**: .packageの中身をGUIで閲覧・検証
- **S4TK Package Tools**: https://pkg.sims4toolkit.com/ でWeb上から.package閲覧

### 3. ゲーム内テスト

- **チートコンソール**: `Ctrl+Shift+C` → `testingCheats true`
  - `sims.add_buff <name>` — バフを付与してテスト
  - `sims.remove_buff <name>` — バフを削除
  - `traits.equip_trait <name>` — トレイトを付与
  - `traits.remove_trait <name>` — トレイトを削除
  - Shift+クリックでデバッグメニュー表示（testingCheats有効時）
  - `cas.fulleditmode` — CASでフル編集モード
  - `bb.showhiddenobjects` — 隠しオブジェクトを表示
- **MCCC**: ログ出力・例外レポート（mc_lastexception.html）

### 4. ログ・例外解析

- **LastException.txt**: `C:\Users\kokor\Documents\Electronic Arts\The Sims 4\` に自動生成
  - ファイル末尾のトレースバックを確認 → 直近のエラー
  - `File "..."` 行でエラー発生モジュールを特定
  - https://lastexception.com/ に貼り付けて整形
- **Better Exceptions**: どのMODが原因かを特定するHTMLレポート生成
- **Script MODのログ**: `sims4.log.Logger` / S4CL LogRegistry でファイル出力

### Script MOD（Python）固有のデバッグ

- **S4CL Testing Framework**: ゲーム内で `s4clib.run_tests` コマンドでテスト実行
- **S4CL ログシステム**: `CommonLogRegistry` でファイルにログ出力（`mod_logs/` フォルダ）
- **リモートデバッグ**: PyCharm Professional の Python Debug Server でゲームプロセスにアタッチ
- **チートコンソール出力**: `sims4.commands.CheatOutput` で簡易デバッグ値を表示

### 詳細ドキュメント

→ `docs/research/Sims 4 Mod テスト・デバッグ手法.md` に包括的なガイドあり

## Boundaries

### ✅ Always Do

- 全てのスクリプト・ツールを**TypeScript**で書く（.js禁止）
- MODごとに固有の`s4tk.config.json`を持たせる
- リソースキーにはFNV-1ハッシュを使用し、最上位ビットを1に設定する
- TuningとSimDataの要素を一致させる
- ビルド前に`npm run build:dry`で検証する
- コミット前に`npm run typecheck`（型チェック）と`npm run test`（単体テスト）を通す
- 日本語でコミュニケーションする（コードコメントは英語可）

### ⚠️ Ask First

- 新しいnpmパッケージの追加
- 既存MODの`s4tk.config.json`のdestinations変更
- リポジトリ構造の変更（フォルダ追加・移動）
- 共通ライブラリ（`src/`）のAPI変更

### 🚫 Never Do

- JavaScriptファイル（.js/.cjs/.mjs）を作成しない — 必ずTypeScriptを使う
- `.env`やクレデンシャルをコミットしない
- `out/`やビルド成果物をコミットしない
- `.package`バイナリファイルを直接手動編集しない
- EAの公式ロゴやブランドアートを使用しない
- MODを有料で配布しない（EA MODポリシー違反）

## Reference

- S4TK: https://sims4toolkit.com/ / https://vscode.sims4toolkit.com/
- EA MOD Policy: https://help.ea.com/en/articles/the-sims/the-sims-4/mods-policy/
- Modders Reference: https://thesims4moddersreference.org/reference/file-types/
- SimsWiki TGI: https://simswiki.info/wiki.php?title=Game_Help:TS4_CC_Basics
- Research docs: `docs/research/sims4_mod_development_guide.md`
