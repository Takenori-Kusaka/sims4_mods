# 07. 技術リファレンス

## リソースタイプ ID

| タイプ | Type ID | 説明 |
|--------|---------|------|
| Tuning (buff) | `0xCB5FDDC7` | バフチューニング |
| Tuning (trait) | `0xCB5FDDC7` | トレイトチューニング |
| Tuning (snippet) | `0xCB5FDDC7` | スニペットチューニング |
| SimData | `0x545AC67A` | SimData バイナリデータ |
| StringTable (STBL) | `0x220557DA` | 文字列テーブル |

**注**: チューニングの Type ID はすべて同じ `0xCB5FDDC7`。種別は XML 内の `i` 属性で区別される。

## FNV ハッシュ

Sims 4 はリソース名から FNV-1 ハッシュを計算して Instance ID として使用する。

### ハッシュ関数の使い分け

| 用途 | 関数 | ビット幅 |
|------|------|---------|
| CAS Personality Trait | FNV32 | 32bit（最大 4,294,967,295） |
| Buff, Snippet, その他チューニング | FNV64 | 64bit |
| StringTable キー | FNV32 | 32bit |

### 計算方法

```typescript
import { fnv32, fnv64 } from '@s4tk/hashing';

// 32bit（Trait用）
fnv32('Kokor_Trait_CareerAutoTasks')  // → 数値

// 64bit（Buff, Snippet用）
fnv64('Kokor_Buff_CareerFocused')    // → BigInt
```

### このプロジェクトで使用中のハッシュ値

| 名前 | FNV64 | 用途 |
|------|-------|------|
| `Kokor_Snippet_CareerAutoTasks` | `0x614754D6227ED43D` (7009664623703938109) | キャリアMODスニペット |
| `Kokor_Buff_CareerFocused` | `0x7524859ECEAA67DF` (8441018518717753311) | キャリアMODバフ |
| `Kokor_Snippet_EducationAutoTasks` | `0xC3199DE5DACF48D` | 教育MODスニペット |
| `Kokor_Buff_EducationFocused` | `0x53553347FAAE41A7` | 教育MODバフ |

## EA 公式年齢トレイト ID

XmlInjector でバフを注入する際のターゲットトレイト:

| トレイト名 | Instance ID |
|-----------|-------------|
| trait_Infant | 不明 |
| trait_Toddler | 不明 |
| trait_child | 34316 |
| trait_teen | 34317 |
| trait_youngAdult | 34318 |
| trait_adult | 34319 |
| trait_elder | 34320 |

## SimData スキーマハッシュ

動作確認済み MOD（LittleMsSam_AutoEmployee）から抽出:

### Trait スキーマ（14カラム）

| 項目 | 値 |
|------|-----|
| スキーマハッシュ | `0x53D584C8` |
| カラム数 | 14 |

### Buff スキーマ（9カラム）

| 項目 | 値 |
|------|-----|
| スキーマハッシュ | `0x0D045687` |
| カラム数 | 9 |
| 注意 | `timeout_string_no_next_buff` カラムなし |

**重要**: スキーマハッシュはゲームアップデートで変更される可能性がある。`src/tools/extract-schema.ts` で動作する MOD から最新値を抽出して確認すること。

## Static Commodity ID 一覧

### キャリア関連

| 名前 | ID | 対応キーワード |
|------|-----|--------------|
| staticCommodity_SkillWriting | 109845 | write, paper, report |
| staticCommodity_SkillProgramming | 115774 | program, code, hack |
| staticCommodity_SkillCooking | 105606 | cook, bake, meal |
| staticCommodity_SkillFitness | 16707 | exercise, workout |
| staticCommodity_SkillPainting | 108831 | paint, draw, art |
| staticCommodity_Socialize | 16714 | social, talk, friend |
| staticCommodity_ReadBook | 24727 | read, study, book |
| staticCommodity_SkillGuitar | 109847 | music, instrument |
| staticCommodity_SkillGardening | 188890 | garden, plant |
| staticCommodity_SkillLogic | 25291 | science, logic, analyze |

### 教育関連

| 名前 | ID | 対応キーワード |
|------|-----|--------------|
| StaticCommodity_Study_Homework | 27683 | homework |
| staticCommodity_SkillResearch | 198588 | research |

## 宿題インタラクション ID

LittleMsSam の BetterAutonomousHomework から取得:

### 子供用

| ID | 名前 |
|----|------|
| 37253 | Book_Homework_Child |
| 9210 | Book_Homework_Child-Creative |
| 33901 | Book_Homework_Child-ExtraCredit |
| 9211 | Book_Homework_Child-Logic |
| 33895 | Book_Homework_Child-Makeup |
| 9213 | Book_Homework_Child-Motor |
| 9212 | Book_Homework_Child-Social |

### ティーン用

| ID | 名前 |
|----|------|
| 36774 | Book_Homework_Teen |
| 284518 | book_Homework_Teen_Overachiever_ExtraCredit |
| 287859 | book_Homework_Teen_Prepare_For_Test |
| 33902 | Book_Homework_Teen-ExtraCredit |
| 33903 | Book_Homework_Teen-Makeup |

## 大学 Enum 値

ゲームの `university_enums.py` から抽出:

### FinalCourseRequirement

| 値 | 名前 | 説明 |
|----|------|------|
| 0 | NONE | 最終要件なし |
| 1 | EXAM | 試験 |
| 2 | PAPER | レポート/論文 |
| 3 | PRESENTATION | プレゼンテーション |

### EnrollmentStatus

| 値 | 名前 |
|----|------|
| 1 | ENROLLED |
| 3 | PROBATION |

## ゲーム Python モジュールパス

Script MOD で import 可能な主要モジュール:

```python
import services                    # ゲームサービス全般
import sims4.log                   # ロギング
import sims4.resources             # リソースタイプ定義
import alarms                      # アラーム（定期実行）
import zone                        # ゾーン管理
from date_and_time import create_time_span
from interactions.context import InteractionContext, QueueInsertStrategy
from interactions.priority import Priority
from sims.sim_info_types import Age
```
