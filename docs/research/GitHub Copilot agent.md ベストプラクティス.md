# GitHub Copilot agent.md 開発ベストプラクティス 完全レポート

## エグゼクティブサマリー

GitHub Copilot では、AIエージェントへの指示を定義するために複数のMarkdownファイル形式が存在する。本レポートでは、**AGENTS.md**（クロスツール互換のオープンフォーマット）と**カスタムエージェント（.agent.md）**（Copilot専用のペルソナ定義）の両方について、ベストプラクティスを包括的に整理する。

GitHubが2,500以上のリポジトリを分析した結果、効果的なエージェント設定には**具体的なペルソナ・実行コマンド・明確な境界線・コード例**が不可欠であることが明らかになっている[^14]。

---

## 1. agent.md エコシステムの全体像

### 関連ファイルの種類と役割

GitHub Copilot Coding Agent が読み込むカスタム指示ファイルは以下の通りである[^2][^29]:

| ファイル | 配置場所 | 用途 | 適用範囲 |
|---|---|---|---|
| `copilot-instructions.md` | `.github/` | リポジトリ全体の方針・規約 | Chat, Code Review, Agent |
| `*.instructions.md` | `.github/instructions/` | パス別の詳細ルール | glob パターンで指定 |
| `AGENTS.md` | リポジトリ任意の場所 | AIエージェント向けREADME | Coding Agent（自動読み込み） |
| `.agent.md` | `.github/agents/` | カスタムエージェントのペルソナ | 手動選択で切り替え |
| `CLAUDE.md` / `GEMINI.md` | リポジトリルート | 各ツール固有の指示 | 対応ツールのみ |

### AGENTS.md とカスタムエージェント（.agent.md）は別物

名前が似ているが**全く異なる概念**である[^27]:

| 項目 | AGENTS.md | Custom Agents (.agent.md) |
|---|---|---|
| 正体 | クロスツール互換のオープンフォーマット | Copilot専用のフェーズ別作業空間 |
| 配置場所 | リポジトリ任意（ネスト可能） | `.github/agents/` |
| 適用方法 | Coding Agent実行時に**自動読み込み** | ドロップダウンから**手動選択** |
| 互換性 | Copilot, Claude Code, Cursor, Codex 等 | GitHub Copilot 専用 |
| 管理 | Linux Foundation (AAIF) | GitHub |
| 用途 | プロジェクト指示（コマンド・境界線） | ペルソナ定義（設計者・テスター等） |

---

## 2. AGENTS.md のベストプラクティス

### 2.1 背景：OpenAI発のオープン標準

AGENTS.md は2025年8月にOpenAIが提案した「AIコーディングエージェント向けのREADME」である[^28][^38]。2025年12月にはLinux FoundationのAgentic AI Foundation（AAIF）の管理下に移り、Anthropic の MCP、Block の goose と並ぶオープンインフラ基盤として位置づけられている[^30][^32]。60,000以上のOSSプロジェクトで採用されている[^32]。

### 2.2 GitHubが2,500+リポジトリから導いた6つの成功パターン

GitHubの公式ブログが2,500以上のAGENTS.mdファイルを分析した結果、以下の6つのコアエリアをカバーしているファイルがトップティアであることが判明した[^14]:

#### ① コマンド（Commands）
```markdown
## コマンド
npm ci          # 依存インストール
npm run build   # ビルド
npm test        # テスト実行（Jest）
npm run lint:fix # リント自動修正
```
- **コマンドを先頭に配置する**。エージェントは頻繁にこれらを参照する[^14]
- ツール名だけでなく、**フラグやオプションまで記載する**（例: `pytest -v --coverage`）

#### ② テスト（Testing）
- テストフレームワークと実行方法を明記
- テストファイルの配置場所を指定

#### ③ プロジェクト構造（Project Structure）
```markdown
## プロジェクト構造
- `src/` – アプリケーションソースコード
- `docs/` – ドキュメント
- `tests/` – ユニット・統合・E2Eテスト
```

#### ④ コードスタイル（Code Style）
- **説明文よりコード例を優先する**。1つのスニペットは3段落の説明に勝る[^14]
- Good/Bad の対比で示す:

```typescript
// ✅ Good - 明確な名前、エラーハンドリング
async function fetchUserById(id: string): Promise<User> {
  if (!id) throw new Error('User ID required');
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ❌ Bad - 曖昧な名前、エラーハンドリングなし
async function get(x) {
  return await api.get('/users/' + x).data;
}
```

#### ⑤ Gitワークフロー（Git Workflow）
- コミットメッセージの規約
- ブランチ戦略（feature branch の使い方など）

#### ⑥ 境界線（Boundaries）— 最も重要
3層の境界線設定が効果的[^14]:

```markdown
## 境界線
- ✅ **Always Do:** テストを書いてから実装、変更したファイルのテストを更新
- ⚠️ **Ask First:** 新しいnpmパッケージの追加、既存API型定義の変更
- 🚫 **Never Do:** .envファイルをコミットしない、console.logを本番コードに残さない
```

「Never commit secrets」は最も一般的で有用な制約だった[^14]。

### 2.3 スタックの具体性

「React project」ではなく「**React 18 with TypeScript, Vite, and Tailwind CSS**」と書く。バージョンと主要な依存関係を含めることで、エージェントが正確なコンテキストで動作する[^14]。

### 2.4 ネスト配置と優先順位

AGENTS.md はサブディレクトリにも配置でき、**編集対象ファイルに最も近いファイルが優先**される[^31][^27]:

```
repo/
├── AGENTS.md                    # リポジトリ全体（優先度: 低）
├── packages/
│   └── frontend/
│       └── AGENTS.md            # frontend固有（優先度: 高）
```

明示的なユーザー指示（チャット内）は全てのAGENTS.mdより優先される[^31]。

---

## 3. カスタムエージェント（.agent.md）のベストプラクティス

### 3.1 YAMLフロントマターの設定

`.github/agents/` 配下に `.agent.md` ファイルを配置してカスタムエージェントを定義する[^3][^12]:

```yaml
---
name: test-specialist
description: テストカバレッジと品質に特化したエージェント
tools: ["read", "search", "edit", "shell"]
---
```

| プロパティ | 必須 | 説明 |
|---|---|---|
| `name` | 任意 | 表示名。省略時はファイル名 |
| `description` | **必須** | エージェントの目的・専門領域 |
| `tools` | 任意 | 利用可能ツールのリスト。省略時は全ツール有効 |
| `target` | 任意 | `vscode` または `github-copilot` に制限 |
| `model` | 任意 | 使用AIモデル指定（IDE環境のみ） |
| `infer` | 任意 | タスクコンテキストに基づく自動選択（デフォルト: `true`） |
| `handoffs` | 任意 | エージェント間の引き継ぎ設定 |

### 3.2 ツールエイリアス一覧

`tools` プロパティで使えるエイリアス[^5][^12]:

| エイリアス | 用途 |
|---|---|
| `shell` / `execute` | シェルコマンド実行（bash, powershell） |
| `read` | ファイル内容の読み取り |
| `edit` | ファイルの編集・作成 |
| `search` / `grep` / `glob` | ファイル・テキスト検索 |
| `web` | Webコンテンツの取得・検索 |
| `agent` / `custom-agent` | 他のカスタムエージェントの呼び出し |

### 3.3 効果的なペルソナ設計

最大の失敗原因は**曖昧さ**である。「You are a helpful coding assistant」は機能しない。「You are a test engineer who writes tests for React components, follows these examples, and never modifies source code」は機能する[^14]。

**良いペルソナ定義のテンプレート:**
```markdown
---
name: docs-agent
description: Expert technical writer for this project
---

You are an expert technical writer for this project.

## Your role
- You are fluent in Markdown and can read TypeScript code
- You write for a developer audience, focusing on clarity and practical examples
- Your task: read code from `src/` and generate or update documentation in `docs/`
```

### 3.4 ハンドオフ（エージェント間連携）

`handoffs` プロパティでエージェント間のワークフロー引き継ぎを設計できる[^16][^18]:

```yaml
---
description: 設計計画エージェント
tools: ["read", "search", "edit"]
handoffs:
  - label: 🚀 Start Implementation
    agent: implementer
    prompt: 計画に基づいて実装を開始してください
    send: true
---
```

計画エージェント → 実装エージェント → テストエージェントのようなパイプラインを構築できる。

### 3.5 構築すべき6つのエージェント

GitHubが推奨する代表的なカスタムエージェント[^14]:

| エージェント | 役割 | 主なコマンド | 境界線 |
|---|---|---|---|
| `@docs-agent` | ドキュメント生成 | `npm run docs:build`, `markdownlint` | `docs/`のみ書き込み、`src/`変更禁止 |
| `@test-agent` | テスト作成 | `npm test`, `pytest -v` | `tests/`のみ、失敗テスト削除禁止 |
| `@lint-agent` | コード整形 | `npm run lint --fix`, `prettier` | スタイル修正のみ、ロジック変更禁止 |
| `@api-agent` | APIエンドポイント構築 | `npm run dev`, `curl localhost` | ルート変更可、スキーマ変更は要確認 |
| `@security-agent` | セキュリティ分析 | 静的解析ツール | レポート作成のみ |
| `@dev-deploy-agent` | ビルド・デプロイ | `npm run build` | dev環境のみ、本番デプロイ禁止 |

---

## 4. copilot-instructions.md との使い分け

### 4.1 3層構造の設計

3つのファイルを併用する場合の推奨構造[^15]:

```
copilot-instructions.md      # 全体の方針（What）
├── *.instructions.md         # ファイル別の詳細ルール（Whatの詳細）
└── AGENTS.md                 # 手順・コマンド・境界線（How）
```

### 4.2 What vs How の分離原則

重複と矛盾を避けるため、**What（何をするか）とHow（どうやるか）**で分離する[^15]:

| 観点 | copilot-instructions.md | AGENTS.md |
|---|---|---|
| 責務 | What（方針・規約・制約） | How（手順・コマンド・境界線） |
| 更新頻度 | 低（安定したルール） | 中〜高（手順は変わりやすい） |
| 適用範囲 | Copilot全機能（Chat, Review含む） | Coding Agent中心 |
| 例 | 「TypeScript strict mode を使用」 | `npm test` で実行 |
| 例 | 「Redux は使わない」 | 「.env をコミットしない」(Never Do) |

### 4.3 判断フローチャート

新しい指示をどこに書くか迷った場合[^15]:

1. **ChatやCode Reviewでも使いたい？** → No なら `AGENTS.md` に書く
2. **「方針」か「手順」か？** → 方針なら `copilot-instructions.md`、手順なら `AGENTS.md`

### 4.4 読み込みの優先順位

複数ファイルは**マージ**されて読み込まれる。競合する指示がある場合の優先順位[^6]:

1. 選択したカスタムエージェント（`.github/agents/backend.agent.md`）
2. マッチするインストラクション（`*.instructions.md` の applyTo パターン一致）
3. 全体のインストラクション（`copilot-instructions.md`）

---

## 5. Coding Agent 運用のベストプラクティス

### 5.1 タスクの選定

Copilot Coding Agent に適したタスク[^29]:
- バグ修正、UIの変更、テストカバレッジ向上
- ドキュメント更新、アクセシビリティ改善、技術的負債の解消

**避けるべきタスク:** 本番クリティカル、セキュリティ関連、曖昧な要件、深いドメイン知識が必要なもの[^29]

### 5.2 Issue の書き方

Copilot に Issue をアサインする場合、Issue をプロンプトとして捉える[^29]:
- 問題の明確な説明
- 受け入れ基準（テストが必要か等）
- 変更が必要なファイルの指示

### 5.3 PRでのイテレーション

`@copilot` をPRコメントでメンションして改善を指示できる。複数のコメントがある場合は「Start a review」でバッチ送信することで、個別ではなくレビュー全体を一度に処理させる[^29]。

### 5.4 依存関係のプリインストール

`copilot-setup-steps.yml` を設定して、エージェントの開発環境に依存関係を事前インストールすることで、試行錯誤を減らし信頼性を向上させる[^29]。

### 5.5 ブランチ運用とコミット

Agent Mode で作業する際は、フィーチャーブランチを使い、小さな WIP コミットを頻繁に行う。複数ファイルを一度に変更するため、差分の明確化とロールバックの安全性が重要[^7]。

---

## 6. 実践的な導入ガイド

### 6.1 最初のエージェント作成手順

1. **1つのシンプルなタスクを選ぶ** — 「汎用ヘルパー」ではなく「テスト作成」「ドキュメント生成」等の具体的なタスク[^14]
2. **最小限で始める** — 名前、説明、ペルソナの3つがあれば十分
3. **Copilot に生成させる** — 以下のプロンプトで `.agent.md` を自動生成:

```
Create a test agent for this repository. It should:
- Have the persona of a QA software engineer.
- Write tests for this codebase
- Run tests and analyzes results
- Write to "/tests/" directory only
- Never modify source code or remove failing tests
- Include specific examples of good test structure
```

4. **YAMLフロントマターを追加**し、コマンドを調整
5. **テストし、間違いが発生したら詳細を追加** — 最良のファイルはイテレーションで成長する[^14]

### 6.2 スターターテンプレート

```markdown
---
name: your-agent-name
description: [このエージェントが何をするかの一文説明]
tools: ["read", "edit", "search", "shell"]
---

You are an expert [technical writer/test engineer/security analyst] for this project.

## Persona
- You specialize in [documentation/testing/security analysis]
- You understand [the codebase/test patterns/security risks]
- Your output: [API docs/unit tests/security reports]

## Project knowledge
- **Tech Stack:** [React 18, TypeScript, Vite, Tailwind CSS]
- **File Structure:**
  - `src/` – Application source code
  - `tests/` – Test files

## Commands
- **Build:** `npm run build`
- **Test:** `npm test`
- **Lint:** `npm run lint --fix`

## Standards
**Naming conventions:**
- Functions: camelCase (`getUserData`)
- Classes: PascalCase (`UserService`)
- Constants: UPPER_SNAKE_CASE (`API_KEY`)

## Boundaries
- ✅ **Always:** Write to `src/` and `tests/`, run tests before commits
- ⚠️ **Ask first:** Database schema changes, adding dependencies
- 🚫 **Never:** Commit secrets, edit `node_modules/`
```

### 6.3 ナレッジの自己蓄積パターン

エージェントにプロジェクト固有のナレッジを記録させる実践例もある[^21]:

```markdown
## ナレッジ
このプロジェクトのナレッジは下記のディレクトリに記録されています。
必要な時に参照してください。
- .agent-doc/knowledge/

## ナレッジの記録
- セッションを通じて学んだことをマークダウンファイルに記録してください
- ユーザーとの指示の差分から、今後も気をつけるべきことだけを記録
- 技術的な一般常識は記録しない
```

---

## 7. 主要な注意点とアンチパターン

### やるべきこと
- コマンドを先頭に配置し、フラグまで記載する
- 説明より具体的なコード例を優先する
- 3層の境界線（Always / Ask First / Never）を必ず設定する
- テックスタックはバージョンまで記載する
- イテレーションで段階的に改善する

### 避けるべきこと
- 「You are a helpful coding assistant」のような曖昧なプロンプト[^14]
- copilot-instructions.md と AGENTS.md に同じ内容を重複記載する[^15]
- 境界線を設定せずにエージェントに自由にファイルを操作させる
- 一度に巨大なエージェント設定を作り込む（小さく始めてイテレーションすべき）
- `*.instructions.md` ファイルをサブフォルダに分類する（フォルダ分けすると読み込まれない）[^6]

---

## 参考リンク

- [GitHub Blog: How to write a great agents.md – Lessons from over 2,500 repositories](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- [GitHub Docs: Adding repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)
- [GitHub Docs: Creating custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [GitHub Docs: Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [GitHub Docs: Best practices for using Copilot to work on tasks](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
- [OpenAI AGENTS.md Repository](https://github.com/openai/agents.md)
- [Linux Foundation: Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)


---

## References

2. [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) - Create repository custom instructions files that give Copilot additional context on how to understan...

3. [Creating custom agents - GitHub Docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents) - You can create specialized agents with tailored expertise for specific development tasks.

5. [GitHub Copilot カスタムエージェントのための agents.md 作成 ...](https://zenn.dev/studypocket/articles/github-copilot-agents-md-best-practices) - agents.md ファイルの冒頭には、YAML フロントマターでエージェントのメタデータを定義します。以下は設定可能なプロパティの一覧です。 --- name: test- ...

6. [GitHub Copilotのエージェントとインストラクションの設定方法](https://developer.mamezou-tech.com/blogs/2026/01/30/copilot-agent-setting/) - 本記事では、GitHub Copilotのエージェント（Agents）およびインストラクション（Instructions）の設定方法について説明します。 Agents（エージェント）と ...

7. [Episode 1: GitHub Copilot Agent Mode - Best Practices October 2025](https://www.linkedin.com/pulse/episode-1-github-copilot-agent-mode-best-practices-october-liebeck-vjbue) - Having worked extensively with Agent Mode in Visual Studio over the past three months, I’ve gathered...

12. [Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration) - Reference for configuring custom agents.

14. [Starter Template](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) - Learn how to write effective agents.md files for GitHub Copilot with practical tips, real examples, ...

15. [copilot-instructions.md と AGENTS.md、どっちに何を書く？](https://tech-lab.sios.jp/archives/51144) - copilot-instructions.mdとAGENTS.mdの公式推奨セクションを整理。両方使う場合の重複・矛盾を避ける判断フローチャートと具体例で使い分けを解説。

16. [GitHub Copilot エージェントの作成はエージェントに任せよう](https://zenn.dev/openjny/articles/264b7b02b406f0) - ### ハンドオフ エージェント間のハンドオフを適切に設計すると、ワークフローがスムーズになります。 ```md:namespace.role.agent.md ...

18. [計画→実行のVS Code Planエージェント。カスタム ...](https://dev.classmethod.jp/articles/vscode-copilot-plan-mode-as-custom-agents/) - GitHub Copilotは、ユーザーが独自のエージェントを作成できる機能 ... エージェント間の引き継ぎ(Handoffs). 設定項目にある handoffs は、日本 ...

21. [GitHub Copilot Agent を上手に扱うために試していること（社内 ...](https://zenn.dev/dotdtech_blog/articles/4ef9e36e7558fa)

27. [AGENTS.md vs Custom Agents【5つの比較表で混乱解消】](https://tech-lab.sios.jp/archives/51135) - 名前は似ているが全く別物。AGENTS.mdはクロスツール互換、Custom AgentsはCopilot専用のフェーズ切り替え。5つの比較表とフローチャートで使い分けを ...

28. [うさぎでもわかる🐰AGENTS.md - コーディングエージェント向け ...](https://note.com/taku_sid/n/neb3b241f3a08) - 2025年8月19日、OpenAIから新しい提案が発表されました。それがAGENTS.mdという、コーディングエージェント（AI）向けの設定ファイルフォーマットです。

29. [Best practices for using GitHub Copilot to work on tasks](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results) - Learn how to get the best results from Copilot coding agent.

30. [Linux Foundation founds Agentic AI Foundation](https://www.theregister.com/2025/12/09/linux_foundation_agentic_ai_foundation/) - : An attempt to provide vendor-neutral oversight as the agent train barrels on

31. [Format Specification | openai/agents.md | DeepWiki](https://deepwiki.com/openai/agents.md/5.1-format-specification) - This document defines the AGENTS.md format specification, including its purpose, file structure, con...

32. [Linux Foundation Announces the Formation of the Agentic AI ...](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) - Linux Foundation Announces the Formation of the Agentic AI Foundation

38. [AGENTS.md — a simple, open format for guiding coding agents](https://github.com/openai/agents.md) - AGENTS.md — a simple, open format for guiding coding agents - openai/agents.md

