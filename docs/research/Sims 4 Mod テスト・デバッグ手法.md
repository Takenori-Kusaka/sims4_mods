# Sims 4 Mod開発のテスト・デバッグ手法ガイド

本ガイドでは **Package MOD（.package）** と **Script MOD（.ts4script / Python）** の両方のデバッグ手法を網羅します。

---

## 0. Package MOD（.package）のオフラインデバッグ

Package MOD（Tuning XML + SimData + StringTable）はゲームを起動せずに多くの検証が可能です。

### 0.1 npmビルドスクリプトによる検証

各MODフォルダの `npm run build:dry` でDry Runを実行し、リソースの読み込み・ハッシュ生成が正常に完了するか確認できます。

```powershell
cd mods/career_auto_tasks
npm run build:dry
# コンソール出力でリソース数・Instance IDを確認
```

### 0.2 S4TK Dry Run（VSCode拡張）

S4TK VSCode拡張の Dry Run は `BuildSummary.json` を生成し、以下を検出します:
- リソースキー（TGI）の重複
- 欠落ファイルの参照
- StringTableのキー重複
- パッケージ間のリソース重複

```
Ctrl+Shift+P → "S4TK: Dry Run"
```

問題発生時は `s4tk-cache.json` を削除して再ビルドすると解決することがあります。

### 0.3 @s4tk/validation による検証スクリプト

`@s4tk/validation` パッケージを使用して、ビルド成果物の `.package` ファイルをプログラム的に検証できます。

```typescript
import { Package } from "@s4tk/models";
import * as fs from "fs";

// .packageファイルを読み込んで内容を確認
const buffer = fs.readFileSync("dist/MyMod.package");
const pkg = Package.from(Buffer.from(buffer));

console.log(`Total resources: ${pkg.size}`);

// 全リソースのTGIを一覧表示
pkg.entries.forEach((entry) => {
  const key = entry.key;
  console.log(
    `Type: 0x${key.type.toString(16).padStart(8, "0")} ` +
    `Group: 0x${key.group.toString(16).padStart(8, "0")} ` +
    `Instance: 0x${key.instance.toString(16).padStart(16, "0")}`
  );
});
```

### 0.4 外部ツールによる検証

| ツール | 用途 | URL |
|--------|------|-----|
| **Sims 4 Studio (S4S)** | .packageの中身を閲覧・編集、Tuning XMLの確認 | https://sims4studio.com/ |
| **S4TK Package Tools** | Web上で.packageファイルの中身を閲覧 | https://pkg.sims4toolkit.com/ |
| **TDESC Browser** | Tuning Description（TDESC）ファイルの閲覧。XMLの構造が正しいか参照 | ゲームファイルから抽出 |
| **SHAM** | Tuning XMLのハッシュ・構文チェック | https://triplis.github.io/tools/SHAM.html |
| **Tuning Inspector** | Python⇔XML Tuningの対応確認 | https://github.com/MAL22/Sims4-TuningInspector |

### 0.5 Tuning XMLの一般的なエラーパターン

| エラー | 原因 | 対策 |
|--------|------|------|
| Tuning読み込み失敗 | XML構文エラー（閉じタグ欠落等） | XMLリンターで構文チェック |
| SimDataとの不一致 | Tuning XMLとSimData XMLの要素名・構造が異なる | 両ファイルの要素を手動で照合 |
| Instance ID衝突 | 異なるリソースに同じInstance IDを使用 | FNV-1ハッシュの入力文字列を一意にする |
| StringTableキー重複 | 同じキーを複数エントリで使用 | Dry Runの `allowStringKeyOverrides: false` で検出 |
| 最上位ビット未設定 | カスタムコンテンツのGroup/Instanceで0x8000... がない | `generateInstanceId()` で `| 0x8000000000000000n` を適用 |

---

## 0B. ゲーム内でのPackage MODデバッグ（チートコマンド）

Package MOD（バフ、トレイト、インタラクション等）のテストに使用する主要なチートコマンド一覧です。

### チートコンソールの開き方

`Ctrl + Shift + C` でコンソールを開き、まず `testingCheats true` を入力して有効化します。

### バフのテスト

```
sims.add_buff <buff_name>          # バフを追加
sims.remove_buff <buff_name>       # バフを削除
sims.remove_all_buffs              # 全バフ削除
```

例: `sims.add_buff buff_Energized` → 活力バフを付与

カスタムバフの場合は、Tuning XMLの `<I c="Buff" i="buff" ... s="12345">` の `s` 属性（Instance ID）またはバフ名を使用します。

### トレイトのテスト

```
traits.equip_trait <trait_name>    # トレイトを付与
traits.remove_trait <trait_name>   # トレイトを削除
```

例: `traits.equip_trait Active` → 活動的トレイトを付与

### インタラクションのテスト

```
# Shift+クリック（testingCheats有効時）
# Simやオブジェクトをshift+クリックすると、通常表示されないデバッグメニューが表示される
```

### その他の便利なチートコマンド

```
testingCheats true                  # テストチート有効化（必須）
cas.fulleditmode                    # CASでフル編集（トレイト変更等）
bb.showhiddenobjects                # 隠しオブジェクトを表示
bb.showliveeditobjects              # ライブ編集オブジェクトを表示
resetsim <sim_name>                 # Simをリセット（スタック時）
sims.modify_funds <amount>          # シモリオンを増減
stats.set_skill_level <skill> <lv>  # スキルレベルを設定
```

### MCCCによる高度なデバッグ

[MC Command Center (MCCC)](https://deaderpool-mccc.com/) はデバッグに非常に有用です:

- **mc_lastexception.html**: MCCC固有の例外レポート（HTMLで読みやすい）
- **mc_cmd_center.log**: MCCCの動作ログ（`Message Logging` を有効化）
- **クリックメニュー拡張**: Simやオブジェクトのクリックメニューから多彩なデバッグ操作
- MCCCのSettings → 「Message Logging」を有効化してログを出力

### Better Exceptions

[Better Exceptions (TwistedMexi)](https://twistedmexi.com/) は `LastException.txt` を解析して、どのMODが原因かを特定するレポートを生成します:

- `Documents/Electronic Arts/The Sims 4/BE-ExceptionsReport.html` に出力
- MODファイル名の特定、スタックトレースの整形
- 問題のあるMODを自動的にハイライト

### LastException.txt の読み方

`C:\Users\kokor\Documents\Electronic Arts\The Sims 4\` に自動生成されるPython traceback形式のファイルです:

1. **ファイル末尾のトレースバック**を確認 → 最も直近のエラー
2. **`File "..."` 行**でどのモジュールでエラーが発生したか特定
3. **`Error:` 行**でエラーの種類を確認
4. [lastexception.com](https://lastexception.com/) に貼り付けると読みやすく整形

---

*以下はScript MOD（Python .ts4script）のデバッグ手法です。*

***

## 1. ゲーム外での単体テスト（Unit Testing）

### 基本方針

Sims 4のゲームAPIに依存しないロジック部分は、ゲームを起動せずに通常のPython `unittest` フレームワークでテストできます。ポイントは、ゲーム固有のモジュール（`sims4.commands`、`services`、`interactions` など）を **`unittest.mock`** でモック化し、ビジネスロジックを分離することです。[^1]

### 実装例：ゲーム依存部分のモック化

```python
import unittest
from unittest.mock import MagicMock, patch

# テスト対象のモジュール（ゲームAPIを使う関数）
# my_mod/calculator.py
# def calculate_simoleons_bonus(sim_info, base_amount):
#     skill_level = sim_info.get_stat_value(skill_type)
#     return base_amount * (1 + skill_level * 0.1)

class TestSimoleonCalculator(unittest.TestCase):
    def test_bonus_calculation(self):
        # SimInfoオブジェクトをモック化
        mock_sim_info = MagicMock()
        mock_sim_info.get_stat_value.return_value = 5  # スキルレベル5

        from my_mod.calculator import calculate_simoleons_bonus
        result = calculate_simoleons_bonus(mock_sim_info, 1000)
        self.assertEqual(result, 1500)  # 1000 * (1 + 5*0.1)

    def test_zero_skill(self):
        mock_sim_info = MagicMock()
        mock_sim_info.get_stat_value.return_value = 0
        
        from my_mod.calculator import calculate_simoleons_bonus
        result = calculate_simoleons_bonus(mock_sim_info, 1000)
        self.assertEqual(result, 1000)

if __name__ == '__main__':
    unittest.main()
```

### 設計上の工夫

ゲーム外でテスト可能にするために、mod のコードを以下のように分離します。

- **純粋ロジック層**: 計算、データ変換、条件判定などゲームAPIに依存しない処理
- **ゲームAPI層**: `sims4.commands`、`services`、`interactions` などを呼び出すラッパー
- **接続層**: 純粋ロジック層とゲームAPI層をつなぐ薄いレイヤー

この構造により、純粋ロジック層は標準の `unittest` でテスト可能になり、ゲームAPI層は `MagicMock` でモック化してテストできます。[^1]

### スタブモジュールの作成

ゲーム専用モジュール（`sims4`、`services` 等）がインポートできない問題には、スタブモジュールを `sys.modules` に登録する方法が有効です。

```python
import sys
from unittest.mock import MagicMock

# テスト実行前にゲームモジュールのスタブを登録
sys.modules['sims4'] = MagicMock()
sys.modules['sims4.commands'] = MagicMock()
sys.modules['sims4.math'] = MagicMock()
sys.modules['services'] = MagicMock()

# これでゲームモジュールをimportするコードもエラーなく読み込める
```

***

## 2. ゲーム内テスト（S4CL Testing Framework）

### S4CLテストフレームワークの概要

**Sims 4 Community Library（S4CL）** は、ゲーム内で実行できるテストフレームワークを提供しています。テストクラスに `test_class` デコレータを付与し、チートコンソールからテストを実行する仕組みです。テスト結果は `Documents/The Sims 4/mod_logs` フォルダに出力されます。[^2][^3][^4]

### テストの実行方法

ゲーム内のチートコンソール（Ctrl+Shift+C）から以下のコマンドを実行します：

```
s4clib.run_tests <クラス名をスペース区切り>
```

クラス名を指定しない場合は、登録されたすべてのテストが実行されます。[^2]

### テストコードの例

```python
from sims4communitylib.testing.common_test_service import test_class, CommonTestService
from sims4communitylib.mod_support.common_mod_info import CommonModInfo

@test_class('MyModTests')
class MyModTests:
    @staticmethod
    def my_first_test() -> bool:
        """基本的なロジックをテスト"""
        result = 2 + 2
        if result != 4:
            raise AssertionError(f'Expected 4, got {result}')
        return True

    @staticmethod
    def test_sim_utility_function() -> bool:
        """ゲーム内のSim情報を使うテスト"""
        import services
        sim_info_manager = services.sim_info_manager()
        if sim_info_manager is None:
            raise AssertionError('SimInfoManager is None')
        return True
```

### S4CLテストの利点

- 実際のゲーム環境（SimInfo、Services、Tuning等）にアクセスできる
- XML Tuningの読み込みやインタラクションの登録を検証できる
- 同じテスト関数で異なる引数パターンを一括テスト可能[^4]

***

## 3. リモートデバッグ（PyCharm Professional）

### 概要

PyCharm Professionalの **Python Debug Server** を使うと、Sims 4のゲームプロセスにアタッチしてブレークポイントデバッグが可能になります。変数のインスペクション、ステップ実行、コールスタックの確認など、フル機能のデバッグが使えます。[^5][^6]

### セットアップ手順

1. **PyCharm Professionalで Python Debug Server 設定を作成**
   - Run → Edit Configurations → 「+」→ Python Debug Server を選択[^7]
   - Host: `localhost`、Port: `5678`（任意）に設定[^6]

2. **pydevd-pycharm パッケージの準備**
   - PyCharmインストールフォルダの `debug-eggs/pydevd-pycharm.egg` をコピー[^5]
   - 拡張子を `.zip` に変更
   - Python 3.7の `ctypes` フォルダをZIP内に追加[^6]
   - このZIPファイルをSims 4の `Mods` フォルダに配置

3. **デバッグ接続コマンドをmod内に作成**

```python
import sims4.commands

@sims4.commands.Command('start.debug', command_type=sims4.commands.CommandType.Live)
def start_debugging(_connection=None):
    output = sims4.commands.CheatOutput(_connection)
    try:
        import pydevd_pycharm
        pydevd_pycharm.settrace('localhost', port=5678, 
                                 stdoutToServer=True, stderrToServer=True)
        output("Debugger connected!")
    except Exception as e:
        output(f"Debug connection failed: {e}")
```

4. **デバッグ開始手順**
   - PyCharmでDebug Serverを起動（Run → Debug）[^5]
   - Sims 4を起動し、チートコンソールで `start.debug` を実行[^6]
   - 接続成功後、PyCharmでブレークポイントが有効になる

### トラブルシューティング

`pydevd_pycharm is not installed` エラーが出る場合は、ZIP内のファイル構造が正しいか、Sims 4が使用するPythonバージョン（3.7系）と互換性のある `ctypes` が含まれているかを確認してください。PyCharmのバージョンによって `pydevd-pycharm` のAPI変更が起きることもあるため、対応するバージョンの egg を使うことが重要です。[^8][^9]

***

## 4. ログベースデバッグ

### S4CLのログシステム（推奨）

S4CLは開発者向けに強力なログ機能を提供しています。ログはファイルに出力され、DEBUG / INFO / WARN / ERROR の各レベルに対応します。[^10][^2]

```python
from sims4communitylib.utils.common_log_registry import CommonLogRegistry

# ログの登録（ファイル名は "MyMod_Messages.txt" になる）
log = CommonLogRegistry.get().register_log('MyMod', 'my_mod_main')

# ログの有効化（デフォルトでは無効）
log.enable()

# 各レベルのログ出力
log.debug('デバッグメッセージ: 変数の値を確認')
log.info('情報: 処理が正常に完了')
log.warn('警告: 想定外の状態を検出')
log.error('エラー発生', exception=some_exception)

# 引数付きフォーマットログ
log.format_with_message('Sim情報', sim_name='太郎', level=5)
```

ゲーム内のチートコンソールからログの有効/無効を切り替えられます：[^10]

```
s4clib.enable_log my_mod_main
s4clib.disable_log my_mod_main
s4clib.logs  （登録済みログ一覧の表示）
```

ログファイルは `Documents/Electronic Arts/The Sims 4/mod_logs/` に出力されます。[^10]

### S4CLの例外ハンドリング

`CommonExceptionHandler` デコレータを使うと、関数内で発生した例外を自動でキャッチし、ファイルにログ出力し、さらにゲーム内でプレイヤーに通知できます。[^11]

```python
from sims4communitylib.exceptions.common_exceptions_handler import CommonExceptionHandler

class MyModService:
    @staticmethod
    @CommonExceptionHandler.catch_exceptions('MyMod', fallback_return=None)
    def risky_operation(sim_info):
        # この中で例外が発生すると自動的にログ出力される
        result = sim_info.some_method()
        return result
```

スタックトレースの取得も可能です：[^11]

```python
from sims4communitylib.exceptions.common_stacktrace_utils import CommonStacktraceUtil

# 現在のスタックトレースを取得
stack = CommonStacktraceUtil.get_full_stack_trace()

# 完全な例外情報を取得（sys.exc_info()の拡張版）
exc_info = CommonStacktraceUtil.full_exception_info()
```

### Vanilla Logsの有効化

S4CLを使わない場合、ゲーム本体の隠しログシステムを有効化するmod（**Vanilla Logs** や **Sims Log Enabler**）もあります。[^12][^13]

- **Vanilla Logs**（Oops19作）: チートコマンド `logs.enable` / `logs.disable` でログを制御[^12]
- ログレベルは 0〜5（FATAL → ERROR → WARN → INFO → DEBUG → ALWAYS）で設定可能[^12]
- 特定のログ グループのみフィルタリングして出力可能

***

## 5. テスト戦略の全体設計

### 推奨するテストピラミッド

| テスト層 | 実行環境 | ツール | 対象 | 実行頻度 |
|---|---|---|---|---|
| 単体テスト | ゲーム外（ローカルPC） | `unittest` + `mock` | 純粋ロジック、計算処理、データ変換 | コミットごと |
| 結合テスト | ゲーム内 | S4CL Testing Framework | ゲームAPI連携、Tuning読み込み、インタラクション | ビルドごと |
| デバッグ | ゲーム内 + PyCharm | pydevd-pycharm | バグ調査、変数インスペクション | 問題発生時 |
| ログモニタリング | ゲーム内 | S4CL Log / Vanilla Logs | 実行時の動作確認、例外追跡 | 常時 |

### 開発ワークフロー

1. **コーディング**: ロジック部分とゲームAPI部分を分離して実装
2. **単体テスト**: `unittest` + `mock` でゲーム外テストを実行（数秒で完了）
3. **ビルド**: `.ts4script` にコンパイルして `Mods` フォルダに配置[^14]
4. **結合テスト**: ゲーム起動 → `s4clib.run_tests` で結合テスト実行[^2]
5. **デバッグ**: 問題発見時にPyCharm Debug Serverでアタッチし詳細調査[^5]
6. **ログ確認**: `mod_logs` フォルダのログファイルで動作を確認[^10]

### プロジェクト構成例

```
my_sims4_mod/
├── src/
│   ├── my_mod/
│   │   ├── __init__.py
│   │   ├── core/           # 純粋ロジック（ゲーム非依存）
│   │   │   ├── calculator.py
│   │   │   └── data_models.py
│   │   ├── game/           # ゲームAPI連携
│   │   │   ├── commands.py
│   │   │   └── interactions.py
│   │   └── tests_ingame/   # S4CLゲーム内テスト
│   │       └── test_integration.py
├── tests/                  # ゲーム外単体テスト
│   ├── conftest.py         # モック設定・スタブ登録
│   ├── test_calculator.py
│   └── test_data_models.py
├── EA/                     # 逆コンパイルしたEAスクリプト（参照用）
├── S4CL/                   # S4CLソース（参照用）
├── settings.py
├── compile.py
└── decompile_scripts.py
```

テンプレートプロジェクト（S4CL Template ProjectやSims4ScriptingTemplate）をベースに環境を構築すると効率的です。EAのゲームスクリプトを逆コンパイルして `EA/` フォルダに配置すれば、PyCharmの補完とナビゲーションが有効になり、開発効率が大幅に向上します。[^15][^16]

***

## 6. 補足ツールとTips

- **Better Exceptions（BetterExceptions）**: ゲーム内で発生した例外の詳細なトレースバックを `lastException.txt` に出力するmod。ユーザーからのバグ報告時に有用[^17]
- **D3OI / Inspector**: ゲーム内のオブジェクトやSimの状態をリアルタイムで確認できるデバッグmod[^18]
- **型ヒント生成**: `Sims4ScriptingTemplate` は逆コンパイルしたソースから Python型スタブ（`.pyi`）を自動生成でき、IDE上での型チェックが可能になる[^15]
- **チートコンソール出力**: 簡易デバッグには `sims4.commands.CheatOutput` でコンソールに直接値を出力する方法も有効[^14]

```python
@sims4.commands.Command('mymod.check', command_type=sims4.commands.CommandType.Live)
def check_value(_connection=None):
    output = sims4.commands.CheatOutput(_connection)
    output(f"Current value: {some_variable}")
```

---

## References

1. [unittest.mock — mock object library](https://docs.python.org/3/library/unittest.mock.html) - Source code: Lib/unittest/mock.py unittest.mock is a library for testing in Python. It allows you to...

2. [ColonolNutty/Sims4CommunityLibrary](https://github.com/ColonolNutty/Sims4CommunityLibrary) - An open source library with a focus on providing utilities and services to the larger Sims 4 modding...

3. [The Sims 4 Community Library](https://www.nexusmods.com/thesims4/mods/287) - An open source library with a focus on providing utilities and services to the larger Sims 4 modding...

4. [Sims 4 Community Library v3.17 (S4CL) (05.11.2025)](https://synthira.ru/load/drugie_igry/the_sims_4/sims_4_community_library_1_2_14_s4cl/396-1-0-7988) - Это скорее API, а не сам мод. Он предназначен для использования другими разработчиками Sims 4 в каче...

5. [Sims 4 tutorial - how to debug your script mod](https://www.youtube.com/watch?v=RBnS8m0174U) - Sorry for the robot voice, but it's definitely better than my mumbling and stuttering one Pycharm do...

6. [What did I do wrong while debugging a python script mod ...](https://stackoverflow.com/questions/75462348/what-did-i-do-wrong-while-debugging-a-python-script-mod-for-the-sims-4) - I was trying to debug a modified python script for The Sims 4, running the mod's code in the game co...

7. [How to Use PyCharm's Remote Debugging With Maya](https://matiascodesal.com/posts/how-to-use-pycharms-remote-debugging-with-maya/) - I'll show you how to connect PyCharm to Maya so that PyCharm can monitor your code as it runs using ...

8. [Python Mod debugging.](https://sims4studio.com/thread/31841/python-mod-debugging) - I am now trying to set up the debugging using PyCharm Pro and running into an issue. This is the cod...

9. [Python Debug Server with `pydevd-pycharm` stopped ...](https://youtrack.jetbrains.com/projects/PY/issues/PY-77357/Python-Debug-Server-with-pydevd-pycharm-stopped-working-in-2024.3) - Create "Python Debug Server" run configuration · Install pydevd-pycharm as suggested in the run conf...

10. [Logging¶](https://sims4communitylibrary.readthedocs.io/en/latest/sims4communitylib.logging.html)

11. [ExceptionHandling¶](https://sims4communitylibrary.readthedocs.io/en/stable/sims4communitylib.exceptions.html)

12. [Oops19/TS4-VanillaLogs](https://github.com/Oops19/TS4-VanillaLogs) - A technical mod that enables The Sims 4's hidden vanilla logging system at startup. Based on Scumbum...

13. [ModTheSims - Sims Log Enabler](https://modthesims.info/d/606667/sims-log-enabler.html) - Modders tool to enable the game's internal log files

14. [Introduction to writing script mods for the Sims 4](https://hub.uvcemarvel.in/article/bf59daaa-7081-42e4-9f82-a43976752594) - Here, we'll use PyCharm to create our own script mods for the popular video game franchise, The Sims...

15. [Sims 4 Scripting Template Project](https://github.com/mycroftjr/Sims4ScriptingTemplate) - A Sims 4 Script mod template project. The first major change is that decompilation of the game sourc...

16. [GitHub - ColonolNutty/s4cl-template-project: A template that can be used as a starting point for working with S4CL](https://github.com/ColonolNutty/s4cl-template-project) - A template that can be used as a starting point for working with S4CL - ColonolNutty/s4cl-template-p...

17. [Last exception problem | EA Forums - 9290632](https://forums.ea.com/discussions/the-sims-4-mods-and-custom-content-en/last-exception-problem/9290632) - Hello, I have problem with last exception in sims 4, i tried fixing it but nothing works, i can't cl...

18. [Sims 4 debugging?](https://modthesims.info/t/607073) - You can use the injector to tack on to a Python method in the game to log various values from within...

