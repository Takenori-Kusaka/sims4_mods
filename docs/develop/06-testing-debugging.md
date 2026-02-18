# 06. テスト・デバッグ手法

## 4層テスト戦略

### Layer 1: 単体テスト（ゲーム外）

```powershell
cd mods/<mod-name>
npm run test          # mocha + chai テスト実行
npm run typecheck     # TypeScript型チェック（tsc --noEmit）
```

テスト対象:
- FNV ハッシュ生成の正確性
- Instance ID 計算
- STBL JSON 構造の妥当性
- リソースキーの一意性

Script MOD（Python）は `unittest` + `unittest.mock` でゲーム API をモック化してテスト可能。

### Layer 2: ビルド検証（ゲーム外）

**S4TK Dry Run**:
- `Ctrl+Shift+P` → "S4TK: Build Packages" → "Dry Run"
- `BuildSummary.json` で TGI 重複・欠落を検出

**ツールによる検証**:

```powershell
cd src/tools
npm run inspect -- <path-to-package>     # .package 内容確認
npm run compare -- <my.package> <ref.package>  # 参照MODと比較
npm run extract-schema -- <working.package>    # スキーマ抽出
npm run hash-check                              # ハッシュ検証
```

### Layer 3: ゲーム内テスト

**チートコンソール**: `Ctrl+Shift+C` でゲーム内コンソールを開く

```
testingCheats true              # テストモード有効化

# バフテスト
sims.add_buff <buff_instance_id>
sims.remove_buff <buff_instance_id>

# トレイトテスト
traits.equip_trait <trait_instance_id>
traits.remove_trait <trait_instance_id>

# CAS / オブジェクト
cas.fulleditmode                # CASフル編集モード
bb.showhiddenobjects            # 隠しオブジェクト表示
```

**Shift+クリック**: テストモード有効時、シムやオブジェクトをShift+クリックでデバッグメニュー表示。

### Layer 4: ログ・例外解析

**LastException.txt**:
- 場所: `C:\Users\kokor\Documents\Electronic Arts\The Sims 4\LastException.txt`
- ゲームでエラーが発生すると自動生成
- https://lastexception.com/ で整形して読みやすくできる

**MCCC（Master Controller Command Center）**:
- ゲーム内ログ出力、例外レポート（`mc_lastexception.html`）

**Better Exceptions**:
- 原因MODを特定するHTMLレポートを生成

**Script MOD のログ**:

```python
import sims4.log
logger = sims4.log.Logger('MyModName', default_owner='kokor')

logger.info('Message: {}', variable)
logger.warn('Warning: {}', variable)
logger.error('Error: {}', variable)
```

ログは LastException.txt やゲーム内例外レポートに出力される。

## src/tools/ 調査ツール一覧

`src/tools/` にある調査・デバッグツール群。使用前に `npm ci` が必要。

### 基本ツール

| コマンド | ファイル | 用途 |
|---------|---------|------|
| `npm run hash-check` | hash-check.ts | FNV32/FNV64 ハッシュ値計算・検証 |
| `npm run inspect` | inspect-package.ts | .package のTGI・XML・SimData表示 |
| `npm run inspect-mod` | inspect-working-mod.ts | 動作MODの詳細検査 |
| `npm run compare` | compare-packages.ts | 2つの .package を比較 |
| `npm run extract-schema` | extract-schema.ts | SimData スキーマ抽出 |

### 詳細調査ツール

| コマンド | ファイル | 用途 |
|---------|---------|------|
| `npm run deep-inspect` | deep-inspect.ts | DBPF バイナリ構造検査 |
| `npm run hex-compare` | hex-compare.ts | バイナリレベル比較 |
| `npm run check-types` | check-s4tk-types.ts | S4TK リソースタイプ確認 |
| `npm run compute-hashes` | compute-snippet-hashes.ts | スニペット/バフFNV64ハッシュ計算 |

### リソース抽出ツール

| コマンド | ファイル | 用途 |
|---------|---------|------|
| `npm run extract-buff` | extract-buff-details.ts | Buff の autonomy_modifier 等を抽出 |
| `npm run extract-homework` | extract-homework-buff.ts | 宿題関連Buff構造抽出 |
| `npm run extract-career` | extract-career-interactions.ts | キャリアインタラクションID抽出 |
| `npm run extract-xmlinjector` | extract-xmlinjector.ts | XmlInjector構造抽出 |
| `npm run find-moods` | find-mood-ids.ts | SimData mood_type 値抽出 |
| `npm run find-tags` | find-tag-ids.ts | TraitGroup タグ値抽出 |

## デバッグフロー例

### Package MOD がゲームで認識されない場合

```
1. BuildSummary.json を確認 → リソースが正しくリストされているか
2. src/tools で inspect → TGI が正しいか確認
3. hash-check → s属性がFNVハッシュ値と一致するか
4. SimData確認 → スキーマハッシュとカラム定義が正しいか
5. 動作する参照MODと compare で比較
```

### Script MOD がロードされない場合

```
1. .ts4script の中身を ZIP展開して確認
   → パッケージフォルダ/ファイルが正しい構造か
2. .py ファイルが .pyc でないことを確認
3. LastException.txt を確認 → Python エラーが出ているか
4. ログメッセージ（Logger）が出力されているか確認
5. Python 3.7 で使えない構文がないか確認
```
