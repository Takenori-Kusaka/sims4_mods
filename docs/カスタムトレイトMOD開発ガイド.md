# カスタムトレイト MOD 開発ガイド

> 対象読者: Sims 4 MOD開発初心者
> ツール: S4TK VSCode拡張 (v0.2.4+)
> 最終更新: 2025年

---

## 目次

1. [前提知識](#1-前提知識)
2. [必要なファイル一覧](#2-必要なファイル一覧)
3. [Step 1: チューニングXMLの作成](#3-step-1-チューニングxmlの作成)
4. [Step 2: SimData XMLの作成](#4-step-2-simdata-xmlの作成)
5. [Step 3: 文字列テーブル（STBL）の作成](#5-step-3-文字列テーブルstblの作成)
6. [Step 4: S4TKでビルド](#6-step-4-s4tkでビルド)
7. [Step 5: テスト](#7-step-5-テスト)
8. [よくある間違いと対処法](#8-よくある間違いと対処法)
9. [リファレンス](#9-リファレンス)

---

## 1. 前提知識

### リソースキー（TGI）

Sims 4のゲーム内リソースはすべて **Type + Group + Instance** の3つの値で識別されます。

| 要素 | サイズ | 例 | 説明 |
|------|--------|-----|------|
| Type | 32bit | `0xCB5FDDC7` | リソースの種類。トレイト、バフ、SimDataなど |
| Group | 32bit | `0x00000000` | グループ分け。チューニングは常に `0x00000000` |
| Instance | 64bit | `0x002238D99FE12491` | リソースの一意識別子 |

### チューニングとSimDataの関係

Sims 4のゲームデータは **2つのファイルのペア** で構成されます：

```
チューニングXML  ←→  SimData XML
（ゲームロジック）    （UIデータ）
```

- **チューニングXML**: ゲームの動作を定義（バフ効果、年齢制限、タグなど）
- **SimData XML**: CASやUIに表示するためのデータ（表示名、アイコン、分類など）

**重要: 両方のファイルが揃っていないとゲームに認識されません。**

SimDataはチューニングから自動生成されません。必ず手動で作成してください。

---

## 2. 必要なファイル一覧

CASに表示されるパーソナリティトレイトを作るには、最低限以下のファイルが必要です：

```
src/
  tuning/
    traits/
      MyTrait.xml              ← チューニングXML
      MyTrait.SimData.xml      ← SimData XML（同名・同フォルダ必須）
    buffs/
      MyBuff.xml               ← バフチューニング（任意）
      MyBuff.SimData.xml       ← バフSimData（任意）
  strings/
    strings.stbl.json          ← 英語文字列テーブル
    strings_ja.stbl.json       ← 日本語文字列テーブル（任意）
```

### SimDataファイルの配置ルール

S4TKはSimDataとチューニングを **ファイル名** でペアリングします：

| ルール | 説明 |
|--------|------|
| 同じフォルダ | チューニングと同じディレクトリに配置 |
| 同じ名前 | `MyTrait.xml` に対して `MyTrait.SimData.xml` |
| 拡張子 | 必ず `.SimData.xml`（大文字小文字に注意） |

---

## 3. Step 1: チューニングXMLの作成

### 推奨手順: 既存トレイトをクローンして編集

1. **Sims 4 Studio** を開く
2. 「Override」モードで既存のトレイト（例: `trait_Ambitious`）を検索
3. Tuning XMLとSimData XMLの両方をエクスポート
4. エクスポートしたXMLを自分のプロジェクトにコピーして編集

### チューニングXMLの構造

```xml
<?xml version="1.0" encoding="utf-8"?>
<I c="Trait" i="trait" m="traits.traits" n="作者名_Trait_名前" s="Instance番号">

  <!-- 対象年齢 -->
  <L n="ages">
    <E>TEEN</E>
    <E>YOUNGADULT</E>
    <E>ADULT</E>
    <E>ELDER</E>
  </L>

  <!-- ★ 表示名（STBLキーを指定） -->
  <T n="display_name">0x8C4A7001</T>
  <T n="display_name_gender_neutral">0x8C4A7001</T>

  <!-- アイコン（Type:Group:Instance形式） -->
  <T n="icon">2f7d0004:00000000:XXXXXXXXXXXXXXXX</T>

  <!-- 種族（空タグ = HUMAN） -->
  <L n="species">
    <E />
  </L>

  <!-- ★★★ CAS分類タグ（最重要） ★★★ -->
  <L n="tags">
    <E>TraitPersonality</E>
    <E>TraitGroup_Emotional</E>
  </L>

  <!-- 説明文（STBLキーを指定） -->
  <T n="trait_description">0x8C4A7002</T>

  <!-- トレイトタイプ -->
  <E n="trait_type">PERSONALITY</E>

</I>
```

### 必ず守ること

| 項目 | 正しい値 | よくある間違い |
|------|----------|----------------|
| 表示名フィールド | `display_name` | ~~`trait_name`~~ |
| 性別中立名 | `display_name_gender_neutral` | 省略してしまう |
| CASタグ | `TraitPersonality` | ~~`Personality`~~ |
| 種族 | `<E />` または `<E>HUMAN</E>` | 省略してしまう |
| Instance ID (s属性) | 32bit以下 (≤ 4294967295) | 64bit値を使ってしまう |

### TraitGroup タグ一覧

`TraitPersonality` に加えて、以下のグループタグを1つ追加するとCASで正しいカテゴリに表示されます：

| タグ | カテゴリ |
|------|----------|
| `TraitGroup_Emotional` | 感情系 |
| `TraitGroup_Hobby` | 趣味系 |
| `TraitGroup_Lifestyle` | ライフスタイル系 |
| `TraitGroup_Social` | 社交系 |

---

## 4. Step 2: SimData XMLの作成

### トレイト SimData テンプレート

チューニングXMLと **同じフォルダ・同じ名前** で `.SimData.xml` を作成します。

```xml
<?xml version="1.0" encoding="utf-8"?>
<SimData version="0x00000101" u="0x00000000">
  <Instances>
    <I name="作者名_Trait_名前" schema="Trait" type="Object">

      <!-- 年齢（Int64: TEEN=8, YOUNGADULT=16, ADULT=32, ELDER=64） -->
      <L name="ages">
        <T type="Int64">8</T>
        <T type="Int64">16</T>
        <T type="Int64">32</T>
        <T type="Int64">64</T>
      </L>

      <!-- 空のリスト（省略不可） -->
      <L name="bb_filter_styles" />
      <L name="bb_filter_tags" />

      <!-- CAS設定 -->
      <T name="cas_allowed_pack">0</T>
      <T name="cas_idle_asm_key">00000000-00000000-0000000000000000</T>
      <T name="cas_idle_asm_state"></T>
      <T name="cas_selected_icon">00000000-00000000-0000000000000000</T>
      <T name="cas_trait_asm_param">カスタム名</T>
      <T name="cas_trait_hidden">0</T>
      <T name="cas_trait_vfx"></T>

      <!-- 競合トレイト -->
      <L name="conflicting_traits" />

      <!-- ★ 表示名（STBLキー） -->
      <T name="display_name">0x8C4A7001</T>
      <T name="display_name_gender_neutral">0x8C4A7001</T>

      <L name="display_overrides" />
      <L name="genders" />

      <!-- アイコン（SimData形式: Type-Group-Instance） -->
      <T name="icon">00B2D882-00000000-XXXXXXXXXXXXXXXX</T>

      <L name="occults" />
      <T name="refresh_sim_thumbnail">0</T>

      <!-- 種族（1 = HUMAN） -->
      <L name="species">
        <T type="Int64">1</T>
      </L>

      <!-- ★ タグ（234=TraitPersonality, 753=TraitGroup_Emotional） -->
      <L name="tags">
        <T type="Int64">234</T>
        <T type="Int64">753</T>
      </L>

      <T name="thumbnail_type_asm_param"></T>
      <T name="trait_description">0x8C4A7002</T>
      <T name="trait_origin_description">0x00000000</T>

      <!-- トレイトタイプ（0=PERSONALITY） -->
      <T name="trait_type">0</T>

      <V name="ui_category" variant="0x603EAA6C">
        <T type="Int64">0</T>
      </V>
    </I>
  </Instances>

  <!-- スキーマ定義（変更不要・そのままコピー） -->
  <Schemas>
    <Schema name="Trait" schema_hash="0x236FC540">
      <Columns>
        <Column name="ages" type="Vector" flags="0x00000000" />
        <Column name="bb_filter_styles" type="Vector" flags="0x00000000" />
        <Column name="bb_filter_tags" type="Vector" flags="0x00000000" />
        <Column name="cas_allowed_pack" type="Int64" flags="0x00000000" />
        <Column name="cas_idle_asm_key" type="ResourceKey" flags="0x00000000" />
        <Column name="cas_idle_asm_state" type="String" flags="0x00000000" />
        <Column name="cas_selected_icon" type="ResourceKey" flags="0x00000000" />
        <Column name="cas_trait_asm_param" type="String" flags="0x00000000" />
        <Column name="cas_trait_hidden" type="Boolean" flags="0x00000000" />
        <Column name="cas_trait_vfx" type="String" flags="0x00000000" />
        <Column name="conflicting_traits" type="Vector" flags="0x00000000" />
        <Column name="display_name" type="LocalizationKey" flags="0x00000000" />
        <Column name="display_name_gender_neutral" type="LocalizationKey" flags="0x00000000" />
        <Column name="display_overrides" type="Vector" flags="0x00000000" />
        <Column name="genders" type="Vector" flags="0x00000000" />
        <Column name="icon" type="ResourceKey" flags="0x00000000" />
        <Column name="occults" type="Vector" flags="0x00000000" />
        <Column name="refresh_sim_thumbnail" type="Boolean" flags="0x00000000" />
        <Column name="species" type="Vector" flags="0x00000000" />
        <Column name="tags" type="Vector" flags="0x00000000" />
        <Column name="thumbnail_type_asm_param" type="String" flags="0x00000000" />
        <Column name="trait_description" type="LocalizationKey" flags="0x00000000" />
        <Column name="trait_origin_description" type="LocalizationKey" flags="0x00000000" />
        <Column name="trait_type" type="Int64" flags="0x00000000" />
        <Column name="ui_category" type="Variant" flags="0x00000000" />
      </Columns>
    </Schema>
  </Schemas>
</SimData>
```

### チューニングXMLとSimDataの対応表

SimDataではチューニングの値を **異なる形式** で記述する必要があります：

| 項目 | チューニングXML | SimData XML |
|------|----------------|-------------|
| 年齢 | `<E>ADULT</E>` | `<T type="Int64">32</T>` |
| 種族 | `<E />` | `<T type="Int64">1</T>` |
| タグ | `<E>TraitPersonality</E>` | `<T type="Int64">234</T>` |
| タグ | `<E>TraitGroup_Emotional</E>` | `<T type="Int64">753</T>` |
| トレイトタイプ | `<E n="trait_type">PERSONALITY</E>` | `<T name="trait_type">0</T>` |
| アイコンType | `2f7d0004` (Thumbnail) | `00B2D882` (PNG) |
| ブール値 | `True` / `False` | `1` / `0` |

### 年齢コード一覧

| 年齢 | チューニング | SimData (Int64) |
|------|-------------|-----------------|
| BABY | `BABY` | `1` |
| TODDLER | `TODDLER` | `2` |
| CHILD | `CHILD` | `4` |
| TEEN | `TEEN` | `8` |
| YOUNGADULT | `YOUNGADULT` | `16` |
| ADULT | `ADULT` | `32` |
| ELDER | `ELDER` | `64` |

---

## 5. Step 3: 文字列テーブル（STBL）の作成

表示名や説明文は **StringTable (STBL)** で管理します。

### strings.stbl.json（英語・デフォルト）

```json
{
  "locale": "English",
  "group": "0x80000000",
  "instanceBase": "0x8C4A7000000001",
  "entries": {
    "0x8C4A7001": "Trait Display Name",
    "0x8C4A7002": "Trait description text goes here."
  }
}
```

### strings_ja.stbl.json（日本語）

```json
{
  "locale": "Japanese",
  "group": "0x80000000",
  "instanceBase": "0x8C4A7000000001",
  "entries": {
    "0x8C4A7001": "トレイト名",
    "0x8C4A7002": "トレイトの説明文をここに書きます。"
  }
}
```

### STBLキーの設計ルール

- キーは `0xXXXXXXXX` 形式の32bitハッシュ値
- チューニングXMLとSimDataの `display_name` / `trait_description` で同じキーを参照
- 他MODと衝突しないよう、ユニークなプレフィックスを使う

---

## 6. Step 4: S4TKでビルド

### ビルド方法

1. VSCodeで `s4tk.config.json` を開く
2. `"buildInstructions"` の上に表示される **Build** ボタンをクリック
3. または `Ctrl+Shift+P` → "S4TK: Build Packages" を実行

### BuildSummary.json の確認

ビルド後に `BuildSummary.json` が生成されます。以下を確認してください：

```
✅ 正しいビルド結果（SimDataが含まれている）:
- "type": "Tuning (Trait)"      ← チューニング
- "type": "SimData (Trait)"     ← ★ SimDataが含まれていること
- "type": "Tuning (Buff)"       ← バフチューニング
- "type": "SimData (Buff)"      ← ★ SimDataが含まれていること
- "type": "String Table (...)"  ← 文字列テーブル

❌ SimDataが欠けたビルド結果:
- "type": "Tuning (Trait)" のみ → SimDataファイルが見つかっていない
```

**SimDataが含まれていない場合のチェックリスト:**
- [ ] `.SimData.xml` のファイル名がチューニングと一致しているか
- [ ] 同じフォルダに配置されているか
- [ ] 拡張子が `.SimData.xml` になっているか（`.simdata.xml` ではない）

---

## 7. Step 5: テスト

### デプロイ

ビルドされた `.package` ファイルを以下にコピー：

```
C:\Users\<ユーザー名>\Documents\Electronic Arts\The Sims 4\Mods\
```

> **注意**: サブフォルダは1階層まで。2階層以上は読み込まれない。

### ゲーム内テスト

1. ゲームを起動（キャッシュ削除推奨: `localthumbcache.package` を削除）
2. 新規ゲーム or CASに入る
3. トレイト選択画面で自分のトレイトを探す
4. 見つからない場合はチートコンソールでテスト:

```
Ctrl+Shift+C → testingcheats true
traits.equip_trait Kokor_Trait_CareerAutoTasks
```

### トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| CASにトレイトが表示されない | SimDataがない | `.SimData.xml` を作成 |
| CASにトレイトが表示されない | tagsが間違い | `TraitPersonality` を使用 |
| 名前が表示されない | フィールド名が違う | `display_name` を使用 |
| チートでも追加できない | Instance IDが64bit | s属性を32bit範囲に |
| パッケージ読み込みエラー | XML構文エラー | LastException.txt確認 |

---

## 8. よくある間違いと対処法

### 間違い1: SimDataファイルを作らない

S4TK VSCode拡張は **SimDataを自動生成しません**。手動で作成してチューニングと同フォルダに配置してください。

### 間違い2: フィールド名を間違える

```xml
<!-- ❌ 間違い -->
<T n="trait_name">0x8C4A7001</T>

<!-- ✅ 正しい -->
<T n="display_name">0x8C4A7001</T>
```

EA公式のフィールド名は `display_name` です。`trait_name` はゲームに認識されません。

### 間違い3: タグ値を間違える

```xml
<!-- ❌ 間違い -->
<E>Personality</E>

<!-- ✅ 正しい -->
<E>TraitPersonality</E>
```

`Personality` と `TraitPersonality` は別のタグです。CASで表示するには `TraitPersonality` が必要です。

### 間違い4: SimDataの内容がチューニングと不一致

SimDataの `display_name` や `tags` の値は、チューニングXMLの対応するフィールドと一致していなければなりません。片方だけ変更すると動作しなくなります。

### 間違い5: アイコンのType IDを間違える

```xml
<!-- チューニングXML（Thumbnail Type） -->
<T n="icon">2f7d0004:00000000:INSTANCE_ID</T>

<!-- SimData XML（PNG Type） -->
<T name="icon">00B2D882-00000000-INSTANCE_ID</T>
```

チューニングとSimDataでアイコンの **Type ID が異なる** ことに注意。Instance ID部分は同じです。

---

## 9. リファレンス

### 開発ツール

- **S4TK VSCode拡張**: https://vscode.sims4toolkit.com/
- **Sims 4 Studio**: https://sims4studio.com/
- **Lot51 TDESC Viewer**: https://tdesc.lot51.cc/ （チューニングスキーマの確認に便利）

### ドキュメント

- **S4TKドキュメント**: https://sims4toolkit.com/
- **Sims 4 Modding Wiki**: https://sims-4-modding.fandom.com/
- **Sims4CommunityLibrary - カスタムトレイト作成**: https://github.com/ColonolNutty/Sims4CommunityLibrary/wiki/How-To-Create-A-Custom-Trait

### プロジェクト内リファレンス

- `docs/reference/` — EA公式 `trait_Ambitious` のTuning + SimDataサンプル
- `docs/research/` — 各種調査レポート

---

## 付録: バフ SimData テンプレート

バフにもSimDataが必要です。

```xml
<?xml version="1.0" encoding="utf-8"?>
<SimData version="0x00000101" u="0x00000000">
  <Instances>
    <I name="作者名_Buff_名前" schema="Buff" type="Object">
      <T name="audio_sting_on_add">00000000-00000000-0000000000000000</T>
      <T name="audio_sting_on_remove">00000000-00000000-0000000000000000</T>
      <T name="buff_description">0xXXXXXXXX</T>
      <T name="buff_name">0xXXXXXXXX</T>
      <T name="icon">00B2D882-00000000-XXXXXXXXXXXXXXXX</T>
      <T name="mood_type">14632</T>
      <T name="mood_weight">1</T>
      <T name="timeout_string">0x00000000</T>
      <T name="timeout_string_no_next_buff">0x00000000</T>
      <T name="ui_sort_order">3</T>
    </I>
  </Instances>
  <Schemas>
    <Schema name="Buff" schema_hash="0x0D045687">
      <Columns>
        <Column name="audio_sting_on_add" type="ResourceKey" flags="0x00000000" />
        <Column name="audio_sting_on_remove" type="ResourceKey" flags="0x00000000" />
        <Column name="buff_description" type="LocalizationKey" flags="0x00000000" />
        <Column name="buff_name" type="LocalizationKey" flags="0x00000000" />
        <Column name="icon" type="ResourceKey" flags="0x00000000" />
        <Column name="mood_type" type="TableSetReference" flags="0x00000000" />
        <Column name="mood_weight" type="Int32" flags="0x00000000" />
        <Column name="timeout_string" type="LocalizationKey" flags="0x00000000" />
        <Column name="timeout_string_no_next_buff" type="LocalizationKey" flags="0x00000000" />
        <Column name="ui_sort_order" type="Int32" flags="0x00000000" />
      </Columns>
    </Schema>
  </Schemas>
</SimData>
```

### mood_type 主要値

| 値 | ムード |
|----|--------|
| 14632 | Focused（集中） |
| 14634 | Happy（幸福） |
| 14635 | Confident（自信） |
| 14636 | Inspired（閃き） |
| 14637 | Energized（活力） |
| 14638 | Flirty（いちゃいちゃ） |
| 14639 | Playful（おちゃめ） |
| 14640 | Sad（悲しみ） |
| 14641 | Uncomfortable（不快） |
| 14642 | Angry（怒り） |
| 14643 | Tense（緊張） |
| 14644 | Embarrassed（恥ずかしさ） |
| 14645 | Bored（退屈） |

### ui_sort_order 主要値

| 値 | カテゴリ |
|----|----------|
| 1 | Happy |
| 2 | Confident |
| 3 | Focused |
| 4 | Inspired |
| 5 | Energized |
| 6 | Flirty |
| 7 | Playful |
