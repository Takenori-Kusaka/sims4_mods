# Sims 4 MOD 調査・デバッグツール

MOD開発で使用する調査・デバッグ用 TypeScript スクリプト群。

## セットアップ

```powershell
cd src/tools
npm ci
```

## ツール一覧

### ハッシュ・ID検証

| コマンド | 説明 |
|---------|------|
| `npm run hash-check` | FNV32/FNV64 ハッシュ値を計算・検証 |
| `npm run compute-hashes` | スニペット/バフ名のFNV64ハッシュを計算 |

### パッケージ検査

| コマンド | 説明 |
|---------|------|
| `npm run inspect` | .package のTGI・XML・SimDataを表示 |
| `npm run inspect-mod` | 動作MODの詳細検査（参照データ取得） |
| `npm run compare` | 2つの .package を並べて比較 |
| `npm run deep-inspect` | DBPF バイナリ構造の詳細検査 |
| `npm run hex-compare` | バイナリレベルのヘッダ・インデックス比較 |

### スキーマ・タイプ確認

| コマンド | 説明 |
|---------|------|
| `npm run extract-schema` | 動作MODからSimDataスキーマを抽出 |
| `npm run check-types` | S4TK認識のリソースタイプID一覧 |

### リソース抽出

| コマンド | 説明 |
|---------|------|
| `npm run extract-buff` | Buff の autonomy_modifier 等を抽出 |
| `npm run extract-homework` | 宿題関連Buff構造を抽出 |
| `npm run extract-career` | キャリア関連インタラクションIDを抽出 |
| `npm run extract-xmlinjector` | XmlInjector構造を抽出 |
| `npm run find-moods` | SimData の mood_type 値を抽出 |
| `npm run find-tags` | TraitGroup タグ値を抽出 |

## 使用例

```powershell
# ハッシュ値を確認
npm run hash-check

# 自分のパッケージを検査
npm run inspect -- "../../mods/career_auto_tasks/dist/KokorCareerAutoTasks.package"

# 動作MODからスキーマを抽出
npm run extract-schema -- "C:/path/to/working-mod.package"
```

## 注意事項

- 各ツールはコマンドライン引数で .package ファイルパスを受け取るものが多い
- 元は `mods/career_auto_tasks/` で開発されたスクリプトを共通化したもの
- 一部のツールはハードコードされたパスを含む場合がある（必要に応じて修正）
