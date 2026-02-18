# Sims 4 MOD 開発ガイド

このドキュメントは本リポジトリでSims 4 MODを開発するための包括的なガイドです。
新しいMOD開発時にはこのドキュメント群を読めば開発・ビルド・デプロイができます。

## ドキュメント構成

| ファイル | 内容 |
|---------|------|
| [01-environment.md](01-environment.md) | 開発環境セットアップ |
| [02-project-structure.md](02-project-structure.md) | リポジトリ構成とMODフォルダの作り方 |
| [03-xml-package-mod.md](03-xml-package-mod.md) | XML Package MOD（.package）の開発手順 |
| [04-python-script-mod.md](04-python-script-mod.md) | Python Script MOD（.ts4script）の開発手順 |
| [05-build-deploy.md](05-build-deploy.md) | ビルド・デプロイ手順の全体フロー |
| [06-testing-debugging.md](06-testing-debugging.md) | テスト・デバッグ手法 |
| [07-technical-reference.md](07-technical-reference.md) | 技術リファレンス（TGI, FNV, ゲームAPI等） |
| [08-pitfalls.md](08-pitfalls.md) | 既知の落とし穴と解決策 |

## クイックスタート

### 既存MODをビルド・デプロイする場合

```powershell
cd mods/<mod-name>
npm ci                        # 依存インストール（初回のみ）

# Package MOD (.package) のビルド
# → VSCode: Ctrl+Shift+P → "S4TK: Build Packages"

# Script MOD (.ts4script) のビルド + デプロイ
npm run deploy:script

# 両方をデプロイ
npm run deploy:all
```

### 新しいMODを作る場合

1. [02-project-structure.md](02-project-structure.md) を参照してフォルダを作成
2. MODタイプに応じて：
   - XMLチューニングのみ → [03-xml-package-mod.md](03-xml-package-mod.md)
   - Python制御が必要 → [04-python-script-mod.md](04-python-script-mod.md)
3. [05-build-deploy.md](05-build-deploy.md) でビルド・デプロイ
4. [06-testing-debugging.md](06-testing-debugging.md) でゲーム内確認
