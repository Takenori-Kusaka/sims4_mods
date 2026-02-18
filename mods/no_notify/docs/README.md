# Kokor No Notify MOD

通知・電話・ダイアログの自動応答MODです。ゲーム中の中断を最小化し、シムがより自律的に動作し続けられるようにします。

## 機能

| 機能 | 説明 | デフォルト |
|------|------|-----------|
| **ダイアログ自動応答** | OkCancel型ダイアログ（職場/学校への同行、訪問リクエスト等）を自動でOK応答 | ON |
| **お知らせ自動応答** | Ok型の確認ダイアログを自動で承認 | ON |
| **通知自動破棄** | ポップアップ通知を自動で閉じる | ON |
| **電話自動処理** | 電話着信ダイアログを自動応答 | ON |
| **ゲーム速度維持** | 電話やダイアログでゲーム速度が変わるのを防止 | ON |

### 自動応答の対象

- 職場や学校への「一緒に行く」/「一人で行かせる」選択
- 訪問リクエスト（「〇〇が遊びに来たがっています」）
- 電話着信の応答
- チャンスカード（仕事中のイベント選択）
- その他の中断を伴うポップアップダイアログ

### 自動応答の対象外

以下のダイアログは自動応答から除外されます（プレイヤーの操作が必要なもの）:

- テキスト入力ダイアログ
- CASアイテムピッカー
- オブジェクトピッカー
- シムピッカー
- その他選択型ピッカーダイアログ

## インストール

### 前提条件

- The Sims 4 （最新バージョン推奨）
- 他のMODとの依存関係なし（単独で動作）

### 導入手順

1. `KokorNoNotify.ts4script` を以下のフォルダに配置:
   ```
   Documents\Electronic Arts\The Sims 4\Mods\
   ```
2. ゲームを起動
3. MODが自動的に読み込まれます

### アンインストール

1. `KokorNoNotify.ts4script` をModsフォルダから削除
2. ゲームを再起動

## 設定（チートコマンド）

ゲーム内で `Ctrl+Shift+C` を押してチートコンソールを開き、以下のコマンドを入力:

| コマンド | 説明 |
|----------|------|
| `kokor_no_notify.toggle` | MOD全体のON/OFF切替 |
| `kokor_no_notify.status` | 現在の設定を表示 |
| `kokor_no_notify.dialogs` | ダイアログ自動応答のON/OFF切替 |
| `kokor_no_notify.notifications` | 通知自動破棄のON/OFF切替 |
| `kokor_no_notify.speed` | ゲーム速度維持のON/OFF切替 |
| `kokor_no_notify.help` | コマンド一覧を表示 |

## ビルド方法

### 必要な環境

- Node.js
- TypeScript (`ts-node`)

### コマンド

```powershell
cd mods/no_notify
npm ci                        # 依存インストール（初回のみ）
npm run build:script          # .ts4script をビルド → dist/ に出力
npm run deploy:script         # ビルド + Modsフォルダへデプロイ
npm run test                  # テスト実行
npm run typecheck             # TypeScript型チェック
```

## トラブルシューティング

### MODが動作しない

1. `Documents\Electronic Arts\The Sims 4\` の `lastException.txt` を確認
2. ゲーム設定でScript MODが有効になっているか確認:
   - ゲームオプション → その他 → 「Script MODを許可」にチェック
3. Modsフォルダの直下（1階層のみ）に `.ts4script` を配置しているか確認

### 特定のダイアログだけ自動応答したくない

チートコマンドで個別にON/OFFを切り替えてください:
- `kokor_no_notify.dialogs` - OkCancel型ダイアログの切替
- `kokor_no_notify.notifications` - 通知の切替

### ゲーム速度が変わってしまう

`kokor_no_notify.speed` コマンドでゲーム速度維持機能がONになっているか確認してください。

### ログの確認

Sims Log Enabler を導入していれば、`KokorNoNotify` タグのログが出力されます。どのダイアログが自動応答されているか確認できます。

## 技術仕様

- **MODタイプ**: Script MOD (.ts4script)
- **Python バージョン**: 3.7 (Sims 4 ランタイム互換)
- **フックポイント**:
  - `ui.ui_dialog.UiDialogOkCancel.show_dialog`
  - `ui.ui_dialog.UiDialogOk.show_dialog`
  - `ui.ui_dialog_notification.UiDialogNotification.show_dialog`
  - `situations.situation_phone_ring.PhoneRingSituation._on_phone_ring`
  - `phone.phone.Phone.ring`
- **ゲーム速度管理**: `services.game_clock_service()` で速度保存・復元
