# 08. 既知の落とし穴と解決策

開発中に遭遇した問題とその解決策をまとめる。新しいMOD開発時に必ず一読すること。

---

## 1. s属性は FNV ハッシュ値でなければならない

**症状**: トレイト/バフがゲームに認識されない、CASに表示されない

**原因**: チューニング XML の `s` 属性値が `n` 属性の FNV ハッシュと一致していない。

S4TK は `s` 属性をそのまま Instance ID として使う。ゲームは `n`（チューニング名）から FNV ハッシュを計算してリソースを検索する。`s` がハッシュ値と違う場合、リソースが見つからない。

**解決策**:
```typescript
import { fnv32, fnv64 } from '@s4tk/hashing';

// Traitの場合: FNV32
const s = fnv32('Kokor_Trait_CareerAutoTasks');

// Buff/Snippetの場合: FNV64
const s = fnv64('Kokor_Buff_CareerFocused');
```

**検証**: `src/tools/hash-check.ts` で確認。

---

## 2. SimData は自動生成されない

**症状**: BuildSummary.json に Tuning はあるが SimData がない

**原因**: S4TK VSCode拡張は SimData を自動生成しない。

**解決策**: チューニング XML と**同じ名前 + `.SimData.xml`** で手動作成し、**同じフォルダ**に配置する。

```
src/tuning/buffs/
  Kokor_Buff_CareerFocused.xml            ← Tuning
  Kokor_Buff_CareerFocused.SimData.xml    ← SimData（手動作成）
```

**参考**: 動作する MOD から `src/tools/extract-schema.ts` でスキーマを抽出してテンプレートにする。

---

## 3. build.ts では動作する .package を生成できない

**症状**: `npm run build` で .package が生成されるがゲームで読み込めない

**原因**: カスタム `build.ts` は DBPF バイナリ形式の細部で問題がある。

**解決策**: **.package ビルドは必ず S4TK VSCode拡張を使う**。`build.ts` は参考実装として残してあるだけ。

```
S4TK VSCode: Ctrl+Shift+P → "S4TK: Build Packages"
```

---

## 4. Python .pyc はゲームで読めない

**症状**: .ts4script をゲームに入れてもスクリプトが実行されない

**原因**: ローカル Python（3.10）のバイトコードマジック(3439)とゲーム Python（3.7）のマジック(3394)が異なるため、.pyc をゲームが読めない。

**解決策**: **.py ファイルをそのまま ZIP に同梱**する。ゲームが `zipimport` で読み込み、ランタイムでコンパイルする。

---

## 5. Zone 未ロード時に services.current_zone() が None

**症状**: Script MOD でモジュールレベルで `services.current_zone()` を呼ぶと `None`

**原因**: .ts4script はゲーム起動時（ゾーンロード前）に読み込まれる。この時点では Zone オブジェクトが存在しない。

**解決策**: Zone クラスの monkey-patch でゾーンロード後に初期化する。

```python
import zone

_original = zone.Zone.on_loading_screen_animation_finished

def _injected(self, *args, **kwargs):
    result = _original(self, *args, **kwargs)
    _setup_alarm()  # ゾーンロード後に実行される
    return result

zone.Zone.on_loading_screen_animation_finished = _injected
```

---

## 6. `__dirname` は ESM で使えない

**症状**: `ts-node` で `ReferenceError: __dirname is not defined in ES module scope`

**原因**: `tsconfig.json` で `ts-node.compilerOptions.module: "ESNext"` を指定すると ESM として実行されるが、`__dirname` は CommonJS 専用。

**解決策**:

```typescript
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm);
```

---

## 7. docs/reference/ のハッシュ値は古い

**症状**: EA参照ファイルの `s` 属性値をコピーしたがゲームで動かない

**原因**: `docs/reference/` にある EA 公式チューニングの `s` 属性はゲーム内部の値であり、カスタムチューニングにはそのまま使えない。

**解決策**: カスタムチューニングでは必ず自分の `n` 属性値から FNV ハッシュを計算して `s` に設定する。

---

## 8. PowerShell コマンドの bash でのエスケープ

**症状**: bash シェルから PowerShell を呼ぶ際に `$` が変数展開される

**原因**: bash は `$` をシェル変数として解釈する。

**解決策**: PowerShell コマンドは `.ps1` ファイルに書いてから実行する。

```bash
powershell -ExecutionPolicy Bypass -File script.ps1
```

---

## 9. Glob ツールが OneDrive パスでファイルを見つけられない

**症状**: Glob で `mods/*/src/**/*` を検索しても結果が空

**原因**: OneDrive 同期フォルダでパス解決が不安定になることがある。

**解決策**: PowerShell の `Get-ChildItem` で直接確認する。

```powershell
Get-ChildItem 'C:\Users\kokor\OneDrive\...\src' -Recurse -File
```

---

## 10. SimData スキーマハッシュの不一致

**症状**: .package はビルドされるがゲームでチューニングが読み込まれない

**原因**: SimData のスキーマハッシュがゲームバージョンと合っていない。

**解決策**: 動作する MOD（LittleMsSam 等）から `src/tools/extract-schema.ts` でスキーマハッシュを抽出して使用する。

```
Trait: 0x53D584C8 （14カラム）
Buff:  0x0D045687 （9カラム）
```

---

## チェックリスト（新MOD作成時）

- [ ] `n` 属性の FNV ハッシュを計算して `s` 属性に設定したか
- [ ] SimData を手動作成して同じフォルダに配置したか
- [ ] SimData のスキーマハッシュは最新か（動作MODから抽出）
- [ ] s4tk.config.json で `exclude: ["scripts/**"]` を設定したか
- [ ] .package は S4TK VSCode拡張でビルドしたか
- [ ] .ts4script には .py（.pyc ではない）を同梱したか
- [ ] Python コードは 3.7 互換か
- [ ] Zone injection パターンを使っているか（モジュールレベルで zone を直接使わない）
