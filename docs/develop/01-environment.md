# 01. 開発環境セットアップ

## 必須ソフトウェア

### Node.js + npm
- **Node.js**: v18以上推奨
- TypeScriptビルドスクリプト、S4TKパッケージの実行に必要
- インストール確認: `node -v` / `npm -v`

### TypeScript
- 各MODフォルダ内で `npm ci` すると `ts-node` がインストールされる
- グローバルインストールは不要

### VSCode + S4TK拡張
- **S4TK (Sims 4 Toolkit) VSCode拡張**: `.package` ファイルのビルドに必須
- インストール: VSCode Extensions → "S4TK" で検索
- 公式: https://marketplace.visualstudio.com/items?itemName=sims4toolkit.s4tk-vscode
- ドキュメント: https://vscode.sims4toolkit.com/

### Python（オプション）
- `.ts4script` の動作確認やゲームPythonの調査に使用
- **ゲーム内Python**: 3.7（Python 3.7の構文制約に従うこと）
- **ローカルPython**: 3.10+でも可（ビルド時は .py をそのまま同梱するため）
- `.pyc` のバイトコードバージョンが異なるため、**ローカルでコンパイルした .pyc はゲームで読めない**

## パス設定

| 項目 | パス |
|------|------|
| リポジトリ | `C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods` |
| MODデプロイ先 | `C:\Users\kokor\Documents\Electronic Arts\The Sims 4\Mods` |
| ゲーム本体 | `E:\SteamLibrary\steamapps\common\The Sims 4` |
| ゲームPython | `E:\SteamLibrary\steamapps\common\The Sims 4\Data\Simulation\Gameplay\simulation.zip` |

## 初回セットアップ

```powershell
# 1. リポジトリをクローン
git clone <repo-url>
cd sims4_mods

# 2. 各MODフォルダで依存インストール
cd mods/career_auto_tasks
npm ci

cd ../education_auto_tasks
npm ci

# 3. ツールの依存インストール（任意）
cd ../../src/tools
npm ci
```

## 推奨ツール（任意）

| ツール | 用途 |
|--------|------|
| [Sims 4 Studio](https://sims4studio.com/) | .package の GUI 閲覧・編集 |
| [S4PE](https://github.com/s4ptacle/Sims4Tools) | .package のリソース管理 |
| [MCCC](https://deaderpool-mccc.com/) | ゲーム内デバッグ・ログ出力 |
| [Better Exceptions](https://www.srslysims.net/2020/04/better-exceptions.html) | エラー原因MOD特定 |
| [uncompyle6](https://pypi.org/project/uncompyle6/) | .pyc → .py の逆コンパイル |
