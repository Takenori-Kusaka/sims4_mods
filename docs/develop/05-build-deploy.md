# 05. ビルド・デプロイ手順

## 全体フロー

Sims 4 MOD は最大2つの成果物を持つ:

| 成果物 | 拡張子 | ビルド方法 | 内容 |
|--------|--------|-----------|------|
| Package MOD | `.package` | S4TK VSCode拡張 | Tuning XML, SimData, StringTable |
| Script MOD | `.ts4script` | `npm run build:script` | Python スクリプト |

**両方を持つMODの場合、2つのビルドを別々に実行する。**

## Package MOD（.package）のビルド

### 方法: S4TK VSCode拡張（推奨・唯一の動作実績あり）

1. VSCode で MOD フォルダを開く
2. `Ctrl+Shift+P` → "S4TK: Build Packages" を選択
3. ビルドタイプを選択:
   - **Build**: `.package` ファイルを出力
   - **Dry Run**: ファイル出力なしの検証のみ
   - **Release**: ZIP配布用パッケージ

**代替アクセス方法:**
- `s4tk.config.json` を開くと、`buildInstructions` の上にボタンが表示される
- `s4tk.config.json` を右クリック → コンテキストメニュー

### ビルド結果の確認

**BuildSummary.json** が自動生成される。以下を確認:

```json
{
  "buildInfo": {
    "mode": "build",
    "success": true
  },
  "written": [
    {
      "filename": "KokorCareerAutoTasks",
      "resources": [
        {
          "key": "CB5FDDC7-00000000-7524859ECEAA67DF",
          "type": "Tuning (buff)"
        },
        {
          "key": "545AC67A-005FDD0C-7524859ECEAA67DF",
          "type": "SimData (buff)"
        },
        {
          "key": "CB5FDDC7-00000000-614754D6227ED43D",
          "type": "Tuning (snippet)"
        }
      ]
    }
  ]
}
```

**確認ポイント:**
- Tuning と SimData がペアで存在するか
- Instance ID（key の3番目）がFNVハッシュ値と一致するか
- リソース数が期待通りか

### build.ts について

`npm run build` で実行される `build.ts` は**参考実装**として残してあるが、**動作する .package を生成できた実績がない**。必ず S4TK VSCode 拡張を使用すること。

## Script MOD（.ts4script）のビルド

### コマンド

```powershell
cd mods/<mod-name>

# ビルドのみ（dist/ に出力）
npm run build:script

# ビルド + Modsフォルダへデプロイ
npm run deploy:script
```

### build-script.ts の仕組み

1. `src/scripts/<package_name>/` 内の `.py` ファイルを確認
2. PowerShell の `Compress-Archive` で ZIP を作成
3. ZIP を `.ts4script` にリネーム
4. `--deploy` フラグ時は Mods フォルダにコピー

### build-script.ts のカスタマイズ

新しい MOD 用に `build-script.ts` を作成する場合、以下の2行を変更:

```typescript
const MOD_NAME = 'KokorNewMod';           // 出力ファイル名
const PACKAGE_NAME = 'kokor_new_mod';     // Pythonパッケージ名
```

## デプロイ

### 方法1: 自動デプロイ

```powershell
# Package + Script 両方をデプロイ
npm run deploy:all
```

これは以下を実行する:
1. `build.ts --deploy` → .package を dist/ と Mods フォルダに出力
2. `build-script.ts --deploy` → .ts4script を dist/ と Mods フォルダに出力

**ただし**: build.ts は .package 生成に失敗するため、実質 Script のみが正しくデプロイされる。

### 方法2: 推奨デプロイフロー

```
1. S4TK VSCode拡張で Build → dist/ と Mods に .package 出力
2. npm run deploy:script → dist/ と Mods に .ts4script 出力
```

S4TK の `destinations` に Mods フォルダが含まれていれば、S4TK ビルド時に自動的に Mods フォルダへコピーされる。

### 方法3: 手動コピー

```powershell
# dist/ からコピー
Copy-Item dist\KokorCareerAutoTasks.package "C:\Users\kokor\Documents\Electronic Arts\The Sims 4\Mods\"
Copy-Item dist\KokorCareerAutoTasks.ts4script "C:\Users\kokor\Documents\Electronic Arts\The Sims 4\Mods\"
```

### デプロイ先

```
C:\Users\kokor\Documents\Electronic Arts\The Sims 4\Mods\
├── KokorCareerAutoTasks.package
├── KokorCareerAutoTasks.ts4script
├── KokorEducationAutoTasks.package
├── KokorEducationAutoTasks.ts4script
└── （他のMOD）
```

## 依存MOD

| MOD | 必要な場合 |
|-----|-----------|
| [XmlInjector](https://scumbumbomods.com/xml-injector) | XmlInjector Snippet を使用する場合（Package MOD） |

XmlInjector は別途ダウンロードして Mods フォルダに配置する必要がある。

## ビルドトラブルシューティング

| 症状 | 原因 | 対策 |
|------|------|------|
| BuildSummary に SimData がない | `.SimData.xml` ファイルが見つからない | ファイル名がチューニングXMLと一致しているか確認 |
| `__dirname is not defined` | ESM モードで実行 | `fileURLToPath(import.meta.url)` を使用 |
| .ts4script が空 | scripts/ フォルダのパスが間違い | `build-script.ts` の `SCRIPTS_DIR` を確認 |
| ゲームが .package を読まない | Instance ID が不正 | `s` 属性が `n` のFNVハッシュと一致しているか確認 |
| Script MOD がロードされない | .pyc を同梱している | .py をそのまま同梱する |
