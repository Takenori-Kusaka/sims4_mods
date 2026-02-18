# 02. プロジェクト構成

## ディレクトリ全体像

```
sims4_mods/
├── CLAUDE.md                  # AI開発アシスタント向け指示
├── docs/
│   ├── develop/               # 開発ドキュメント（このファイル群）
│   ├── research/              # リサーチ結果・調査ドキュメント
│   ├── reference/             # EA公式参照ファイル（注: ハッシュ値は古い）
│   └── request/               # MOD要件定義
├── src/
│   └── tools/                 # 調査・デバッグツール（全MOD共通）
│       ├── package.json
│       ├── tsconfig.json
│       └── *.ts               # 各種ツールスクリプト
└── mods/
    ├── example/               # S4TK公式サンプル
    ├── career_auto_tasks/     # キャリア自動タスクMOD（サンプル）
    └── education_auto_tasks/  # 教育自動タスクMOD（サンプル）
```

## MODフォルダ構成

各MODは以下の構成に従う:

```
mods/<mod-name>/
├── package.json               # npm scripts（build, deploy等）
├── tsconfig.json              # TypeScript設定
├── s4tk.config.json           # S4TK VSCode拡張用ビルド設定
├── build.ts                   # カスタムビルドスクリプト（参考用）
├── build-script.ts            # .ts4script ビルドスクリプト（Script MODの場合）
├── BuildSummary.json          # S4TKビルド結果（自動生成）
├── README.md                  # MOD説明
├── src/
│   ├── tuning/                # チューニングXML
│   │   ├── buffs/             # バフ定義
│   │   │   ├── *.xml          # Tuning XML
│   │   │   └── *.SimData.xml  # SimData（チューニングと同名）
│   │   ├── traits/            # トレイト定義
│   │   └── snippets/          # スニペット（XmlInjector等）
│   ├── strings/               # 文字列テーブル
│   │   ├── strings.stbl.json  # 英語（デフォルト）
│   │   └── strings_ja.stbl.json # 日本語
│   ├── scripts/               # Python Script MOD ソース
│   │   └── <package_name>/    # Pythonパッケージフォルダ
│   │       ├── __init__.py
│   │       └── <module>.py
│   └── packages/              # 既存 .package（マージ用、任意）
├── dist/                      # ビルド出力（.package, .ts4script）
├── test/                      # テストファイル（任意）
└── node_modules/              # npm依存（.gitignore対象）
```

## 新しいMODフォルダの作り方

### 1. フォルダとファイル作成

```powershell
cd mods
mkdir <mod-name>
cd <mod-name>

# career_auto_tasks からテンプレートをコピー
# （package.json, tsconfig.json, s4tk.config.json を修正して使う）
```

### 2. package.json

```json
{
  "name": "kokor-<mod-name>",
  "version": "1.0.0",
  "description": "Sims 4 MOD: <説明>",
  "private": true,
  "scripts": {
    "build": "ts-node build.ts",
    "build:dry": "ts-node build.ts --dry-run",
    "build:script": "ts-node build-script.ts",
    "deploy": "ts-node build.ts --deploy",
    "deploy:script": "ts-node build-script.ts --deploy",
    "deploy:all": "ts-node build.ts --deploy && ts-node build-script.ts --deploy",
    "clean": "rimraf dist",
    "test": "mocha",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@s4tk/hashing": "^0.2.1",
    "@s4tk/models": "^0.6.14",
    "@s4tk/xml-dom": "^0.2.6",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. s4tk.config.json

```json
{
  "buildInstructions": {
    "source": "src",
    "destinations": [
      "dist",
      "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods"
    ],
    "packages": [
      {
        "filename": "Kokor<ModName>",
        "include": ["**/*"],
        "exclude": ["scripts/**"]
      }
    ]
  },
  "buildSettings": {
    "allowEmptyPackages": false,
    "allowFolderCreation": true,
    "allowMissingSourceFiles": false,
    "allowPackageOverlap": false,
    "allowResourceKeyOverrides": false,
    "outputBuildSummary": "full"
  },
  "stringTableSettings": {
    "allowStringKeyOverrides": false,
    "generateMissingLocales": true,
    "mergeStringTablesInSamePackage": true
  }
}
```

**重要**: `exclude: ["scripts/**"]` で Python ファイルが .package に混入するのを防ぐ。

### 4. ソースフォルダ作成

```powershell
mkdir src\tuning\buffs
mkdir src\tuning\snippets
mkdir src\strings
mkdir src\scripts\kokor_<mod_name>  # Script MODの場合
```

## 参考MOD

| MOD | タイプ | 説明 |
|-----|--------|------|
| `career_auto_tasks` | Package + Script | XmlInjectorバフ注入 + Python定期チェック |
| `education_auto_tasks` | Package + Script | 宿題/大学タスク自動化 |
| `example` | Package のみ | S4TK公式サンプル（Buff定義例） |
