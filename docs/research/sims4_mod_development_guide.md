# Sims 4 MOD開発 リサーチ結果

## 1. EA公式MODポリシー

**出典**: [The Sims 4 Policy on Mods](https://help.ea.com/en/articles/the-sims/the-sims-4/mods-policy/)

### 許可されていること
- 非商用のMOD作成・配布
- 早期アクセスモデル（合理的な期間後に無料公開が必須）
- Webサイト広告・寄付による開発コスト回収

### 禁止事項
- MODの販売・ライセンス・有料配布
- EA/Maxis/The Simsとの提携を示唆するプロモーション
- 公式パックアートに似た宣伝素材の使用
- EA公式ロゴ（Plumbob等）の使用
- 攻撃的・違法・わいせつなコンテンツ

---

## 2. ゲームファイル構造

### リソースキー（TGI）

ゲーム内の全リソースは **TGI (Type, Group, Instance)** で一意に識別される。

| 要素 | サイズ | 説明 |
|------|--------|------|
| **Type** | 32bit | ファイルの種類（テクスチャ、ジオメトリ等）。拡張子に相当 |
| **Group** | 32bit | リソースタイプごとに自由に使用。カスタムコンテンツでは**最上位ビットを1**に設定 |
| **Instance** | 64bit | リソース名のFNV-1ハッシュ。カスタムコンテンツでは**最上位ビットを1**に設定 |

**出典**: [SimsWiki - TS4 CC Basics](https://simswiki.info/wiki.php?title=Game_Help:TS4_CC_Basics)

### ベストプラクティス
- Instanceは必ず**FNV-1ハッシュ**で生成（作者名+MOD名等のユニークな文字列から）
- Groupの最上位ビットを1にして公式コンテンツとの衝突を防ぐ
- Instanceの最上位ビットを1にしてカスタムコンテンツとしてフラグ付け

### 主要ファイル形式

#### 外部形式（MODの配布形式）

| 形式 | 説明 |
|------|------|
| `.package` | MODのメインコンテナ。チューニング、画像、文字列等のリソースを格納 |
| `.ts4script` | リネームされた.zip。Pythonスクリプトmod（.py/.pyc）を格納 |
| `.world` | ワールド定義。ライティングオーバーライド等に使用 |

#### パッケージ内部のリソースタイプ

| リソース | 説明 |
|----------|------|
| **Tuning (XML)** | ゲーム動作の設定ファイル。バフ、トレイト、インタラクション等を定義 |
| **SimData** | チューニングと対になるバイナリデータ。UIやシミュレーションパラメータ |
| **StringTable (STBL)** | ゲーム内テキストのローカライズテーブル |
| **CAS Part** | CAS（シム作成）アイテム。フラグや使用制限を含む |
| **Object Definition** | 建築/購入アイテムの仕様とコンポーネント |
| **Buff** | ムードレット。可視的な感情エフェクトまたは不可視の行動制御 |

**出典**: [File Types - The Sims 4 Modders Reference](https://thesims4moddersreference.org/reference/file-types/)

### SimDataについて
- `.SimData.xml` で終わるファイルがSimData
- 多くのチューニングタイプでSimDataとのペアリングが**必須**
- チューニングとSimDataで共通する要素は**必ず一致**させる必要がある
- 不一致は「原因不明の挙動」を引き起こす

---

## 3. MODの読み込みとコンフリクト

### 読み込み場所
```
C:\Users\kokor\Documents\Electronic Arts\The Sims 4\Mods
```

### 読み込みの仕組み
- ゲーム起動時にModsフォルダ内の`.package`と`.ts4script`を読み込む
- サブフォルダは**1階層のみ**対応（デフォルト設定）
- 深い階層のフォルダ対応は`Resource.cfg`で設定可能
- 同じTGIを持つリソースが複数あると**後から読み込まれた方が優先**（上書き）

### コンフリクト対策
- ユニークなInstance IDを使用（FNV-1ハッシュ）
- 他のMODと同じチューニングを変更する場合はコンフリクトが不可避
- XML Injector等のツールで非破壊的な変更を行うアプローチもある

**出典**: [XML Injector — Scumbumbo](https://scumbumbomods.com/xml-injector)

---

## 4. デバッグ手法

### LastException.txt
- 場所: `Documents\Electronic Arts\The Sims 4\`
- ゲーム読み込み時またはプレイ中にエラーが発生すると自動生成
- 古いMODや互換性のないMODが原因であることが多い
- Python traceback形式でエラー内容が記録される

### チートコンソール
`Ctrl+Shift+C` で開く

| コマンド | 説明 |
|----------|------|
| `testingCheats true` | テストモード有効化（shift-clickデバッグ操作が可能に） |
| `bb.showHiddenObjects` | 隠しオブジェクトを購入モードに表示 |
| `bb.showLiveEditObjects` | さらに多くの隠しオブジェクト（1200以上）を表示 |
| `sims.get_sim_id_by_name first last` | Sim IDの取得 |
| `ui.dialog.auto_respond` | ダイアログの自動応答 |

### カスタムチートコマンド（Pythonスクリプト）
```python
import sims4.commands

@sims4.commands.Command('mymod.debug', command_type=sims4.commands.CommandType.Live)
def debug_command(_connection=None):
    output = sims4.commands.CheatOutput(_connection)
    output('Debug info here')
```

### Shift-Click デバッグ
`testingCheats true` 有効時にShift-Clickで:
- Simに対して: ニーズリセット、特性追加、年齢変更等
- オブジェクトに対して: リセット、状態変更等
- 地面に対して: テレポート等

---

## 5. 開発ツール

### S4TK (Sims 4 Toolkit) — TypeScript/Node.js
**推奨**: このリポジトリのメイン開発ツール

- **VSCode拡張**: [S4TK for VSCode](https://marketplace.visualstudio.com/items?itemName=sims4toolkit.s4tk-vscode)
- **ドキュメント**: https://vscode.sims4toolkit.com/
- `s4tk.config.json` でプロジェクト設定、コード不要でビルド可能
- Tuning XML、SimData XML、StringTable JSONをソースとして管理
- Build / Dry Run / Release の3つのビルドモード

#### 主要npmパッケージ
| パッケージ | 説明 |
|-----------|------|
| `@s4tk/models` | パッケージとリソースのモデル（コアライブラリ）⭐14 |
| `@s4tk/hashing` | FNV-1ハッシュ等の文字列ハッシュユーティリティ |
| `@s4tk/xml-dom` | チューニングXMLのDOM操作 |
| `@s4tk/tunables` | チューナブルノードの操作ユーティリティ |
| `@s4tk/extraction` | ゲームファイルの抽出・インデックス |
| `@s4tk/validation` | パッケージ・リソースの検証 |
| `@s4tk/encoding` | バイナリファイルの読み書き |
| `@s4tk/compression` | ファイル圧縮ユーティリティ |
| `@s4tk/images` | 画像処理モデル・アルゴリズム |

#### S4TK関連Webツール
- [STBL Studio](https://stbl.sims4toolkit.com/) — StringTableのオンライン編集
- [S4TK Sandbox](https://github.com/sims4toolkit/s4tk-sandbox) — オンラインS4TKスクリプト実行環境

### Sims 4 Studio
- GUIベースのMOD作成・編集ツール
- CAS Part、オブジェクト、チューニングの編集に使用
- .packageファイルの中身を視覚的に確認・編集可能
- https://sims4studio.com/

### S4PE (Sims 4 Package Editor)
- **GitHub**: [s4ptacle/Sims4Tools](https://github.com/s4ptacle/Sims4Tools) ⭐240
- C#製のパッケージエディタ
- .packageファイルの低レベル編集
- TGIベースのリソース操作

### その他のツール
- [SHAM (Sims Hash Assistant to the Modder)](https://triplis.github.io/tools/SHAM.html) — ハッシュ計算ツール
- [XML Extractor](https://github.com/BigBadBleuCheese/XML-Extractor) — ゲームからXMLチューニングを抽出

---

## 6. GitHub上の参考リポジトリ

### Pythonスクリプトmod開発

| リポジトリ | ⭐ | 説明 |
|-----------|-----|------|
| [junebug12851/Sims4ScriptingBPProj](https://github.com/junebug12851/Sims4ScriptingBPProj) | 57 | Pythonスクリプトmodのボイラープレート。モダンな開発環境 |
| [mycroftjr/Sims4ScriptingTemplate](https://github.com/mycroftjr/Sims4ScriptingTemplate) | 16 | スクリプトmodテンプレート。並列デコンパイル対応 |
| [thepancake1/_s4animtools](https://github.com/thepancake1/_s4animtools) | 32 | ポーズ・アニメーション作成ツール |

### S4TK関連

| リポジトリ | ⭐ | 説明 |
|-----------|-----|------|
| [sims4toolkit/models](https://github.com/sims4toolkit/models) | 14 | S4TKコアライブラリ |
| [sims4toolkit/s4tk-vscode](https://github.com/sims4toolkit/s4tk-vscode) | 12 | VSCode拡張 |
| [sims4toolkit/stbl-studio-web](https://github.com/sims4toolkit/stbl-studio-web) | 7 | STBL編集Webアプリ |
| [sims4toolkit/extraction](https://github.com/sims4toolkit/extraction) | — | ゲームファイル抽出 |
| [sims4toolkit/package-builder-template](https://github.com/sims4toolkit/package-builder-template) | — | パッケージビルダーのテンプレート |

### ツール系

| リポジトリ | ⭐ | 説明 |
|-----------|-----|------|
| [s4ptacle/Sims4Tools](https://github.com/s4ptacle/Sims4Tools) | 240 | S4PE — .packageエディタ（C#） |
| [Lot51](https://lot51.cc/) | — | MODツール・コアライブラリ提供。Simdexリソース集 |

---

## 7. MODが壊れる主な原因

| 原因 | 説明 |
|------|------|
| **ゲームアップデート** | EAのパッチでAPI/チューニング構造が変更される |
| **Python バージョン変更** | ゲームのPythonランタイム更新で.pyc互換性が失われる |
| **TGI衝突** | 他のMODと同じリソースキーを使用 |
| **SimDataの不一致** | チューニングとSimDataの要素が一致しない |
| **廃止されたチューニング参照** | 削除されたゲームリソースへの参照が残っている |

---

## 8. 参考リンク集

### 公式・準公式
- [EA MODポリシー](https://help.ea.com/en/articles/the-sims/the-sims-4/mods-policy/)
- [EA Forums - Mods and CC](https://forums.ea.com/discussions/the-sims-4-mods-and-custom-content-en/)

### ドキュメント・Wiki
- [The Sims 4 Modders Reference](https://thesims4moddersreference.org/reference/file-types/)
- [Sims 4 Modding Wiki (Fandom)](https://sims-4-modding.fandom.com/wiki/Python_Scripting)
- [SimsWiki - TS4 CC Basics](https://simswiki.info/wiki.php?title=Game_Help:TS4_CC_Basics)
- [Lot51 Simdex リソース集](https://lot51.cc/simdex/resources)

### ツール
- [S4TK ドキュメント](https://sims4toolkit.com/)
- [S4TK VSCode拡張ドキュメント](https://vscode.sims4toolkit.com/)
- [STBL Studio](https://stbl.sims4toolkit.com/)
- [Sims 4 Studio](https://sims4studio.com/)
- [SHAM ハッシュツール](https://triplis.github.io/tools/SHAM.html)

### チュートリアル
- [S4TK Beginner's Guide (Medium)](https://frankkmods.medium.com/beginners-guide-to-sims-4-toolkit-5307132f02c0)
- [Build Packages with S4TK (Medium)](https://frankkmods.medium.com/build-packages-with-sims-4-toolkit-74a795f188c1)
- [Python Scripting Tutorial (EA Forums)](https://forums.ea.com/discussions/the-sims-4-mods-and-custom-content-en/tutorial-write-the-sims-4-script-mod-with-python/374705)
- [Sims 4 Studio - Python Scripting](https://sims4studio.com/thread/15145/started-python-scripting)
