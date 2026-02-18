# 03. XML Package MOD（.package）開発

## 概要

Package MODはゲームのチューニングXML、SimData、文字列テーブルを `.package` コンテナにまとめたもの。S4TK VSCode拡張でビルドする。

## リソースキー（TGI）

ゲーム内の全リソースは **Type + Group + Instance** の3つのIDで一意に識別される。

| フィールド | サイズ | 説明 |
|-----------|--------|------|
| Type | 32bit | リソースの種類（Buff, Trait, SimData等） |
| Group | 32bit | グループ分け（通常 `0x00000000`） |
| Instance | 64bit | 個別のリソースID |

### カスタムコンテンツのID規則

- Instance ID の**最上位ビットを1**にすると EA 公式と衝突しない
- S4TK は XML の `s` 属性値をそのまま Instance ID に使用する

## チューニング XML

ゲームの動作を定義する XML。Buff、Trait、Interaction、Snippet 等の種類がある。

### 基本構造

```xml
<?xml version="1.0" encoding="utf-8"?>
<I c="クラス名" i="タイプ" m="モジュールパス" n="チューニング名" s="InstanceID">
  <!-- フィールド定義 -->
</I>
```

| 属性 | 説明 |
|------|------|
| `c` | Pythonクラス名（例: `Buff`, `Trait`, `XmlInjector`） |
| `i` | チューニングタイプ（例: `buff`, `trait`, `snippet`） |
| `m` | Pythonモジュールパス（例: `buffs.buff`） |
| `n` | チューニング名（**FNVハッシュの入力値**） |
| `s` | Instance ID（**n のFNVハッシュ値でなければならない**） |

### s属性のハッシュ計算ルール（最重要）

| チューニング種別 | ハッシュ関数 | ビット幅 | 最大値 |
|-----------------|-------------|---------|--------|
| CAS Personality Trait | FNV32 | 32bit | 4,294,967,295 |
| Buff, Snippet, その他 | FNV64 | 64bit | 非常に大きい |

```typescript
import { fnv32, fnv64 } from '@s4tk/hashing';

// Trait の場合: FNV32
const traitInstanceId = fnv32('Kokor_Trait_CareerAutoTasks');

// Buff / Snippet の場合: FNV64
const buffInstanceId = fnv64('Kokor_Buff_CareerFocused');
```

**検証ツール**: `src/tools/hash-check.ts` で確認可能。

### Buff の例

```xml
<?xml version="1.0" encoding="utf-8"?>
<I c="Buff" i="buff" m="buffs.buff" n="Kokor_Buff_CareerFocused" s="8441018518717753311">
  <T n="buff_name">0x12345678</T>
  <T n="buff_description">0x12345679</T>
  <E n="visible">False</E>
  <L n="static_commodity_score_multipliers">
    <U>
      <T n="key">109845<!--staticCommodity_SkillWriting--></T>
      <T n="value">2.0</T>
    </U>
  </L>
</I>
```

### XmlInjector Snippet の例

XmlInjector は既存のEAチューニングにデータを注入するコミュニティツール。

```xml
<?xml version="1.0" encoding="utf-8"?>
<I c="XmlInjector" i="snippet" m="xml_injector.snippet" n="Kokor_Snippet_CareerAutoTasks" s="7009664623703938109">
  <L n="add_buffs_to_trait">
    <U>
      <T n="trait">34317<!--trait_teen--></T>
      <L n="buffs">
        <U>
          <T n="buff_type">8441018518717753311<!--Kokor_Buff_CareerFocused--></T>
        </U>
      </L>
    </U>
    <!-- trait_youngAdult, trait_adult, trait_elder にも同様に注入 -->
  </L>
</I>
```

**EA年齢トレイトID（注入先として使用）:**

| トレイト | Instance ID |
|----------|-------------|
| trait_child | 34316 |
| trait_teen | 34317 |
| trait_youngAdult | 34318 |
| trait_adult | 34319 |
| trait_elder | 34320 |

## SimData

チューニングXMLと対になるバイナリデータ。**S4TKは自動生成しない**ため手動作成が必須。

### 命名規則

チューニングXMLと**同じ名前** + `.SimData.xml` 拡張子で、**同じフォルダ**に配置:

```
src/tuning/buffs/
  Kokor_Buff_CareerFocused.xml            # Tuning XML
  Kokor_Buff_CareerFocused.SimData.xml    # SimData（同名）
```

### SimData の基本構造

```xml
<?xml version="1.0" encoding="utf-8"?>
<SimData version="0x00000101" u="0x00000000">
  <Instances>
    <I name="チューニング名" schema="スキーマ名" type="スキーマハッシュ"/>
  </Instances>
  <Schemas>
    <Schema name="スキーマ名" schema_hash="ハッシュ" num_rows="1">
      <Columns>
        <!-- カラム定義 -->
      </Columns>
    </Schema>
  </Schemas>
</SimData>
```

### 検証済みスキーマハッシュ

| スキーマ | ハッシュ | カラム数 | 検証元 |
|---------|---------|---------|--------|
| Trait | `0x53D584C8` | 14 | LittleMsSam_AutoEmployee |
| Buff | `0x0D045687` | 9 | LittleMsSam_AutoEmployee |

**注意**: スキーマハッシュはゲームバージョンで変わる可能性がある。動作する既存MODから `src/tools/extract-schema.ts` で抽出して確認すること。

## StringTable（文字列テーブル）

ゲーム内テキストのローカライズ。JSON形式で管理。

### strings.stbl.json（英語デフォルト）

```json
{
  "entries": [
    {
      "key": "0x12345678",
      "value": "Career Focused"
    },
    {
      "key": "0x12345679",
      "value": "This sim is focused on career advancement."
    }
  ]
}
```

### strings_ja.stbl.json（日本語）

```json
{
  "entries": [
    {
      "key": "0x12345678",
      "value": "キャリア集中"
    },
    {
      "key": "0x12345679",
      "value": "このシムはキャリアアップに集中しています。"
    }
  ]
}
```

S4TK設定で `generateMissingLocales: true` にすると、不足ロケールはデフォルト（英語）のテキストで自動補完される。

## s4tk.config.json 設定

```json
{
  "buildInstructions": {
    "source": "src",
    "destinations": ["dist", "C:\\...\\Mods"],
    "packages": [{
      "filename": "パッケージ名",
      "include": ["**/*"],
      "exclude": ["scripts/**"]
    }]
  }
}
```

| 設定 | 説明 |
|------|------|
| `source` | ソースファイルのルートディレクトリ |
| `destinations` | ビルド出力先（複数指定可。Modsフォルダへの直接出力推奨） |
| `include` | 含めるファイルパターン |
| `exclude` | 除外パターン（Script MODの .py ファイルを除外） |
| `outputBuildSummary` | `"full"` で詳細なBuildSummary.json出力 |

## ビルド方法

**S4TK VSCode拡張を使用（推奨）**:

1. `Ctrl+Shift+P` → "S4TK: Build Packages"
2. または `s4tk.config.json` を右クリック → ビルド
3. BuildSummary.json でリソース一覧を確認

詳細は [05-build-deploy.md](05-build-deploy.md) 参照。
