# カスタムトレイトMOD トラブルシューティング記録

**対象MOD**: `mods/career_auto_tasks` (KokorCareerAutoTasks.package)
**ゲームバージョン**: 1.121.342.1030
**調査期間**: 2026年2月
**ステータス**: 解決済み

---

## 症状

- CAS（シム作成画面）のトレイト一覧にカスタムトレイトが表示されない
- チートコマンド `traits.equip_trait Kokor_Trait_CareerAutoTasks` が無反応
- MCCCのトレイト一覧にも存在しない
- LastException.txt は生成されない（エラーなしで無視される）
- S4TK VSCode拡張でのビルド、Sims 4 Studioでのパッケージ作成、どちらでも同様

---

## 発見された問題（5件）

### 問題1: `s` 属性（Instance ID）がFNVハッシュと不一致【根本原因】

**重要度**: 致命的（これだけでトレイトが完全に認識されない）

**症状**: ゲームがリソースを発見できず、トレイトが存在しないものとして扱われる

**原因**:
チューニングXMLの `s` 属性は、`n` 属性の値からFNVハッシュを計算した結果と一致する必要がある。S4TKは `s` の値をそのままInstance IDとしてTGIキーに使用し、ゲームは `n` の値からFNVハッシュを計算してリソースを検索する。両者が一致しなければリソースは発見できない。

```xml
<!-- 修正前: s の値が n のFNVハッシュと不一致 -->
<I c="Trait" i="trait" m="traits.traits"
   n="Kokor_Trait_CareerAutoTasks" s="2413475841">

<!-- 修正後: FNV32("Kokor_Trait_CareerAutoTasks") = 2063152614 -->
<I c="Trait" i="trait" m="traits.traits"
   n="Kokor_Trait_CareerAutoTasks" s="2063152614">
```

**ハッシュの種類**:
- **CASパーソナリティトレイト**: FNV32（32-bit）を使用。64-bitだとSim Profileで「Unknown Trait」になる
- **Buff、その他のチューニング**: FNV64（64-bit）を使用

**検証方法**:
```typescript
import { fnv32, fnv64 } from "@s4tk/hashing";
// トレイト → FNV32
console.log(fnv32("Kokor_Trait_CareerAutoTasks")); // 2063152614
// バフ → FNV64
console.log(fnv64("Kokor_Buff_CareerFocused"));    // 8441018518717753311n
```

**教訓**: `s` 属性の値は絶対に手入力で適当な数値を設定してはいけない。必ず `@s4tk/hashing` の `fnv32()` / `fnv64()` で計算すること。`hash-check.ts` スクリプトで検証可能。

---

### 問題2: SimDataファイルが存在しない

**重要度**: 致命的

**症状**: チューニングXMLがあってもSimDataがなければゲームに読み込まれない

**原因**: S4TK VSCode拡張はSimDataを自動生成しない。手動で作成し、チューニングXMLと同じフォルダに同名 + `.SimData.xml` 拡張子で配置する必要がある。

```
src/tuning/traits/
  Kokor_Trait_CareerAutoTasks.xml          ← チューニングXML
  Kokor_Trait_CareerAutoTasks.SimData.xml  ← SimData（手動作成必須）
```

**教訓**: 新しいチューニングXMLを作成したら、必ず対応するSimDataファイルも作成する。BuildSummary.jsonでSimDataエントリが含まれていることを確認する。

---

### 問題3: SimDataスキーマハッシュが古い

**重要度**: 致命的

**症状**: SimDataがパッケージに含まれていても、スキーマハッシュが現行ゲームバージョンと一致しなければ拒否される

**原因**: EA公式リファレンスファイル（`docs/reference/trait_Ambitious`）から取得したスキーマハッシュ `0x236FC540` が古いバージョンのものだった。

```xml
<!-- 修正前: 古いスキーマハッシュ -->
<Schema name="Trait" schema_hash="0x236FC540">

<!-- 修正後: 現行バージョンのスキーマハッシュ -->
<Schema name="Trait" schema_hash="0x53D584C8">
```

**現行スキーマハッシュ（ゲームv1.121時点）**:

| スキーマ | ハッシュ | カラム数 | 検証元 |
|---------|---------|---------|--------|
| Trait | `0x53D584C8` | 14 | LittleMsSam_AutoEmployee.package |
| Buff | `0x0D045687` | 9 | LittleMsSam_AutoRepair.package |

**検証方法**: `extract-schema.ts` スクリプトで動作確認済みMODからスキーマを抽出できる。

**教訓**: EAの公式リファレンスやWebの古い情報からスキーマハッシュをコピーしない。必ず現行バージョンで動作しているMODから抽出して検証する。ゲームアップデートでスキーマハッシュが変わることがある。

---

### 問題4: チューニングXMLのフィールド名・タグ値の誤り

**重要度**: 高（CAS表示に影響）

| 項目 | 修正前（誤） | 修正後（正） |
|------|------------|------------|
| 表示名フィールド | `trait_name` | `display_name` |
| トレイトタグ | `Personality` | `TraitPersonality` |
| 性別不問表示名 | (なし) | `display_name_gender_neutral` を追加 |
| トレイトグループ | (なし) | `TraitGroup_Emotional` を追加 |

**教訓**: 動作しているMODの実際のXML構造と比較すること。EAのドキュメントや古いチュートリアルの情報はフィールド名が変わっている場合がある。

---

### 問題5: Buffの `s` 属性も不一致

**重要度**: 致命的（Buffが動作しない）

```xml
<!-- 修正前 -->
<I c="Buff" ... n="Kokor_Buff_CareerFocused" s="9131330870566081">

<!-- 修正後: FNV64("Kokor_Buff_CareerFocused") = 8441018518717753311 -->
<I c="Buff" ... n="Kokor_Buff_CareerFocused" s="8441018518717753311">
```

---

## 調査に使用したツール・手法

### 1. パッケージ検査スクリプト

`inspect-working-mod.ts` — 任意の.packageファイルの全エントリ（TGI、XML内容、SimDataスキーマ）を表示。

**用途**: 自作パッケージと動作するMODの構造を直接比較する。

### 2. スキーマ抽出スクリプト

`extract-schema.ts` — 動作確認済みMODからSimDataスキーマ（ハッシュ、カラム定義）を抽出する。

**用途**: 現行ゲームバージョンの正しいスキーマハッシュとカラム構成を取得する。

### 3. パッケージ比較スクリプト

`compare-packages.ts` — 自作パッケージとリファレンスMODのTGI、XML、SimDataを並べて比較する。

**用途**: 差異を特定する。今回はこのスクリプトで `s` 属性のFNVハッシュ不一致を発見した。

### 4. ハッシュ検証スクリプト

`hash-check.ts` — チューニング名のFNV32/FNV64ハッシュを計算し、`s` 属性の値と照合する。

**用途**: 新しいチューニングを作成する際、`s` の値が正しいことを確認する。

### 5. DBPFヘッダー比較

`hex-compare.ts` — パッケージファイルのバイナリヘッダー（DBPF 2.1）を比較する。

**用途**: パッケージフォーマットの問題を排除するために使用。結果、フォーマットは正常だった。

### 6. リファレンスMOD

動作確認済みMODとして以下を使用した：
- **LittleMsSam_AutoEmployee.package** — Traitチューニング + SimDataの正しい構造を確認
- **LittleMsSam_AutoRepair.package** — BuffチューニングのSimDataスキーマを確認

---

## 新規MOD開発時のチェックリスト

新しいチューニング（Trait, Buff, Interaction等）を作成する際、以下を必ず確認する：

### ビルド前チェック

- [ ] `s` 属性が `n` 属性名のFNVハッシュと一致しているか
  - Trait(Personality): `fnv32(n)` を使用
  - Buff/その他: `fnv64(n)` を使用
  - `hash-check.ts` で検証
- [ ] SimDataファイルが存在するか（チューニングXMLと同名 + `.SimData.xml`）
- [ ] SimDataのスキーマハッシュが現行ゲームバージョンのものか
  - `extract-schema.ts` で動作するMODから抽出して比較
- [ ] SimDataのカラム定義が現行スキーマと一致しているか
- [ ] チューニングXMLのフィールド名・タグ値が正しいか
  - 動作するMODの実際のXML構造と比較

### ビルド後チェック

- [ ] BuildSummary.jsonにチューニングとSimDataの両方がリストされているか
- [ ] `compare-packages.ts` で動作するリファレンスMODと構造比較
- [ ] ゲーム内でチートコマンドで動作確認
  - `traits.equip_trait [名前]`
  - `sims.add_buff [名前]`

### デバッグ時の優先順序

1. **`s` 属性のFNVハッシュ一致を確認** — 最も多い原因
2. **SimDataファイルの存在を確認** — 忘れがち
3. **SimDataスキーマハッシュの確認** — ゲームアップデート後に変わる
4. **チューニングXMLの構造確認** — フィールド名・タグ値
5. **DBPFフォーマット確認** — S4TKを使っていれば通常問題なし

---

## 参考情報

- S4TK公式: https://sims4toolkit.com/
- `@s4tk/hashing`: FNVハッシュ計算ライブラリ
- `@s4tk/models`: パッケージ読み書きライブラリ
- Sims 4 Studio: https://sims4studio.com/
- EA MODポリシー: https://help.ea.com/en/articles/the-sims/the-sims-4/mods-policy/
