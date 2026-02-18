# Career Auto Tasks MOD

シムがキャリア関連のタスクを自律的にこなすためのMOD。Package MOD + Script MOD の2層構造。

**新規MOD開発の参考実装としても利用可能。** 開発手順の詳細は [docs/develop/](../../docs/develop/) を参照。

## 構成

```
career_auto_tasks/
├── package.json          # npm設定
├── tsconfig.json         # TypeScript設定
├── s4tk.config.json      # S4TK VSCode拡張設定
├── build.ts              # .package カスタムビルド（参考用、S4TK推奨）
├── build-script.ts       # .ts4script ビルドスクリプト
├── BuildSummary.json     # S4TKビルド結果（自動生成）
├── src/
│   ├── tuning/
│   │   ├── buffs/        # バフ定義XML + SimData
│   │   └── snippets/     # XmlInjector スニペット
│   ├── strings/          # StringTable (STBL JSON)
│   └── scripts/          # Python Script MOD ソース
│       └── kokor_career_auto_tasks/
│           ├── __init__.py
│           └── career_autonomy.py
└── dist/                 # ビルド出力
    ├── KokorCareerAutoTasks.package
    └── KokorCareerAutoTasks.ts4script
```

## 機能

### Layer 1: Package MOD（.package）
- **XmlInjector スニペット**: 年齢トレイト（teen〜elder）にバフを注入
- **キャリア集中バフ**: `static_commodity_score_multipliers` でスキル練習の自律スコアをブースト

### Layer 2: Script MOD（.ts4script）
- **定期チェック**: ゲーム内30分ごとにアクティブ世帯をスキャン
- **キャリア日課検出**: `career_tracker.active_assignments` を解析
- **Static Commodity Boosting**: キーワード分析で関連スキルのコモディティを動的にブースト

## ビルド・デプロイ

```powershell
cd mods/career_auto_tasks
npm ci                    # 依存インストール（初回のみ）

# 1. Package MOD: S4TK VSCode拡張でビルド
#    Ctrl+Shift+P → "S4TK: Build Packages"

# 2. Script MOD: npm コマンドでビルド + デプロイ
npm run deploy:script
```

## 依存MOD

- [XmlInjector](https://scumbumbomods.com/xml-injector) — XmlInjector スニペットの実行に必要
