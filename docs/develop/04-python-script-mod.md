# 04. Python Script MOD（.ts4script）開発

## 概要

Script MOD はゲーム内で Python コードを実行するMOD。XML チューニングだけでは実現できない動的な制御（キャリア日課の検出、定期的なシムのスキャン等）に使用する。

## .ts4script の構造

`.ts4script` は**リネームされた .zip ファイル**。以下の構造を持つ:

```
KokorCareerAutoTasks.ts4script (= ZIP)
└── kokor_career_auto_tasks/          # Pythonパッケージフォルダ
    ├── __init__.py                    # パッケージ初期化
    └── career_autonomy.py             # メインロジック
```

### 重要な制約

| 項目 | 内容 |
|------|------|
| Python バージョン | ゲームは **Python 3.7** |
| バイトコード | ゲームのマジックナンバー: 3394、ローカルPython 3.10: 3439 |
| 同梱形式 | **.py ファイルをそのまま同梱**する（.pyc はバージョン不一致で読めない） |
| ロード方式 | `zipimport` で .ts4script から直接読み込み、ランタイムでコンパイル |
| 実行タイミング | モジュールレベルコードはゲーム起動時（ゾーンロード前）に実行 |

### Python 3.7 の制約事項

- `f-string` は使用可能（Python 3.6+）
- `:=` （ウォルラス演算子）は使用不可（Python 3.8+）
- `TypedDict` の class 構文は使用不可（Python 3.8+）
- `dict` の `|` マージ演算子は使用不可（Python 3.9+）
- `match` 文は使用不可（Python 3.10+）

## 初期化パターン: Zone Injection

ゲーム起動時にはまだゾーンが存在しないため、`services.current_zone()` は `None` を返す。ゾーンロード後に初期化するには **Zone クラスの monkey-patch** を使う。

```python
import services
import sims4.log

logger = sims4.log.Logger('MyMod', default_owner='kokor')

_original_on_loading_screen_finished = None

def _injected_on_loading_screen_finished(self, *args, **kwargs):
    """Zone.on_loading_screen_animation_finished に注入するフック"""
    result = _original_on_loading_screen_finished(self, *args, **kwargs)
    try:
        _setup_alarm()  # ゾーンロード後の初期化処理
    except Exception as e:
        logger.error('Error in zone load hook: {}', e)
    return result

def _inject():
    """Zone クラスにフックを注入"""
    global _original_on_loading_screen_finished
    try:
        import zone
        _original_on_loading_screen_finished = zone.Zone.on_loading_screen_animation_finished
        zone.Zone.on_loading_screen_animation_finished = _injected_on_loading_screen_finished
        logger.info('Zone injection successful')
    except Exception as e:
        logger.error('Failed to inject: {}', e)

# モジュールレベルで実行（ゲーム起動時）
_inject()
logger.info('Module loaded')
```

### 別の初期化パターン: Instance Manager

LittleMsSam の MOD で使用されているパターン:

```python
services.affordance_manager().add_on_load_complete(on_load_callback)
```

## 定期実行: alarms API

ゲーム内時間に基づく定期実行:

```python
import alarms
from date_and_time import create_time_span

def _setup_alarm():
    global _alarm_handle
    zone = services.current_zone()
    _alarm_handle = alarms.add_alarm(
        zone,                              # owner（ゾーンオブジェクト）
        create_time_span(minutes=30),      # 間隔（ゲーム内30分）
        _my_callback,                      # コールバック関数
        repeating=True                     # 繰り返し
    )

def _my_callback(alarm_handle):
    """30分ごとに呼ばれるコールバック"""
    household = services.active_household()
    if household is None:
        return
    for sim_info in household.sim_info_gen():
        # シムごとの処理
        pass
```

## Static Commodity Boosting

特定のインタラクション（書く、料理する等）の自律スコアを動的に上げる手法:

```python
import sims4.resources

def _boost_commodity(sim_info, commodity_id, amount=100):
    stat_manager = services.get_instance_manager(
        sims4.resources.Types.STATISTIC
    )
    commodity = stat_manager.get(commodity_id)
    tracker = sim_info.statistic_tracker
    stat = tracker.get_statistic(commodity, add=True)
    if stat is not None:
        stat.set_value(stat.get_value() + amount)
```

### 主要 Static Commodity ID

| 名前 | ID | 用途 |
|------|-----|------|
| staticCommodity_SkillWriting | 109845 | 執筆関連 |
| staticCommodity_SkillProgramming | 115774 | プログラミング |
| staticCommodity_SkillCooking | 105606 | 料理 |
| staticCommodity_SkillFitness | 16707 | フィットネス |
| staticCommodity_SkillPainting | 108831 | 絵画 |
| staticCommodity_Socialize | 16714 | 社交 |
| staticCommodity_ReadBook | 24727 | 読書 |
| staticCommodity_SkillGuitar | 109847 | 音楽 |
| staticCommodity_SkillGardening | 188890 | ガーデニング |
| staticCommodity_SkillLogic | 25291 | ロジック |
| StaticCommodity_Study_Homework | 27683 | 宿題 |
| staticCommodity_SkillResearch | 198588 | リサーチ |

## インタラクション直接プッシュ

シムに直接インタラクションを実行させる:

```python
from interactions.context import InteractionContext, QueueInsertStrategy
from interactions.priority import Priority

def _push_interaction(sim, affordance_id, target=None):
    affordance = services.affordance_manager().get(affordance_id)
    if affordance is None:
        return False

    context = InteractionContext(
        sim,
        InteractionContext.SOURCE_SCRIPT_WITH_USER_INTENT,
        Priority.Low,
        insert_strategy=QueueInsertStrategy.LAST
    )
    return sim.push_super_affordance(affordance, target or sim, context)
```

## 主要ゲーム API

### services モジュール

| API | 戻り値 | 用途 |
|-----|--------|------|
| `services.current_zone()` | Zone | 現在のゾーン |
| `services.active_household()` | Household | アクティブ世帯 |
| `services.sim_info_manager()` | SimInfoManager | 全シム情報 |
| `services.object_manager()` | ObjectManager | ゲーム内オブジェクト |
| `services.affordance_manager()` | InstanceManager | インタラクション定義 |
| `services.get_instance_manager(type)` | InstanceManager | 各種リソース取得 |

### キャリア API

```python
sim_info.career_tracker                    # CareerTracker
career_tracker.careers                     # dict {uid: Career}
career.on_assignment                       # bool: 日課中かどうか
career.active_assignments                  # list: アクティブな日課
career_tracker.get_all_career_uncompleted_assignments()  # 未完了日課
```

### 大学 API

```python
sim_info.degree_tracker                    # DegreeTracker
degree_tracker.get_enrollment_status()     # EnrollmentStatus enum
degree_tracker.course_infos                # dict: コース情報

# FinalCourseRequirement enum
# NONE=0, EXAM=1, PAPER=2, PRESENTATION=3

# EnrollmentStatus enum
# ENROLLED=1, PROBATION=3
```

### Sim 情報

```python
sim_info.get_sim_instance()    # Sim（ワールド内にいる場合）
sim_info.sim_id                # ユニークID
sim_info.age                   # Age enum (CHILD, TEEN, YOUNG_ADULT等)
sim_info.statistic_tracker     # 統計トラッカー
sim.queue                      # インタラクションキュー
sim.inventory_component        # インベントリ
```

## ソースファイル配置

```
src/scripts/
└── kokor_<mod_name>/
    ├── __init__.py           # パッケージ初期化（1-2行コメントでOK）
    └── <module_name>.py      # メインロジック
```

## ビルド方法

`build-script.ts` で ZIP 作成 → .ts4script リネーム:

```powershell
npm run build:script          # ビルドのみ
npm run deploy:script         # ビルド + Modsフォルダへデプロイ
```

詳細は [05-build-deploy.md](05-build-deploy.md) 参照。
