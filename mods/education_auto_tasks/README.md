# Education Auto Tasks MOD

シムが学業関連のタスク（大学課題、宿題）を自律的にこなすためのMOD。Package MOD + Script MOD の2層構造。

**新規MOD開発の参考実装としても利用可能。** 開発手順の詳細は [docs/develop/](../../docs/develop/) を参照。

## 構成

```
education_auto_tasks/
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
│       └── kokor_education_auto_tasks/
│           ├── __init__.py
│           └── education_autonomy.py
└── dist/                 # ビルド出力
    ├── KokorEducationAutoTasks.package
    └── KokorEducationAutoTasks.ts4script
```

## 機能

### Layer 1: Package MOD（.package）
- **XmlInjector スニペット**: 年齢トレイト（child〜elder）にバフを注入
- **学業集中バフ**: `static_commodity_score_multipliers` で学業関連の自律スコアをブースト

### Layer 2: Script MOD（.ts4script）
- **定期チェック**: ゲーム内30分ごとにアクティブ世帯をスキャン
- **大学タスク処理**:
  - `FinalCourseRequirement.PAPER` → 執筆/リサーチコモディティをブースト
  - `FinalCourseRequirement.PRESENTATION` → リサーチコモディティをブースト
  - `FinalCourseRequirement.EXAM` → 読書/ロジックコモディティをブースト
- **宿題処理**: 子供/ティーンの宿題オブジェクト検出 + インタラクション直接プッシュ

## ビルド・デプロイ

```powershell
cd mods/education_auto_tasks
npm ci                    # 依存インストール（初回のみ）

# 1. Package MOD: S4TK VSCode拡張でビルド
#    Ctrl+Shift+P → "S4TK: Build Packages"

# 2. Script MOD: npm コマンドでビルド + デプロイ
npm run deploy:script
```

## 依存MOD

- [XmlInjector](https://scumbumbomods.com/xml-injector) — XmlInjector スニペットの実行に必要
