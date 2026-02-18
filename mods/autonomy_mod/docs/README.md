# Kokor Event Autonomy MOD

イベント・ホリデー中にシムが自律的にゴール達成行動を行うようにするMODです。

## 概要

Sims 4 のホリデー（Seasons EP）やフェスティバルなどのイベントが発生した際、シムが自律的にイベント関連のアクティビティを優先して実行するようになります。

### 対応イベント

- **ホリデー（Seasons EP）**: ウィンターフェスト、ハーベストフェスト、ラブデー、海賊の日 等
- **フェスティバル**: スパイスフェスティバル、ギークコン、ロマンスフェスティバル 等
- **シチュエーションベースイベント**: ゴール付きのイベント全般

### 動作原理

1. **イベント検出**: アクティブなホリデーのトラディション、フェスティバルのゴール、シムのイベント関連バフを検出
2. **キーワード分析**: イベント名・トラディション名からキーワードを抽出し、必要なアクティビティを判定
3. **自律スコアブースト**: 関連する Static Commodity の値を上昇させ、シムが自律的にイベント活動を選択しやすくする

### キーワード→アクティビティ対応例

| キーワード | ブーストされるアクティビティ |
|-----------|---------------------------|
| cook, meal, feast | 料理、グルメ料理 |
| gift, appreciation | 社交、カリスマ |
| pirate, talk, joke | 社交、いたずら |
| strength, fight | フィットネス |
| decorat, craft | 絵画、工作 |
| carol, sing, music | ギター、ピアノ |
| trick, prank | いたずら |
| garden, plant | ガーデニング |
| geek, hack | プログラミング、論理学 |

## 必要環境

- **Sims 4** 最新版
- **XmlInjector MOD** (Buff注入に必要)
  - ダウンロード: https://scumbumbo.com/modthesims/xml-injector/xml-injector.html
- **Seasons EP** (ホリデー検出に推奨、なくてもフェスティバル検出は動作)

## インストール

### ファイル構成

このMODは以下の2つのファイルで構成されています:

| ファイル | 種類 | 役割 |
|---------|------|------|
| `KokorEventAutonomy.package` | Package MOD | バフ・XmlInjector設定 |
| `KokorEventAutonomy.ts4script` | Script MOD | イベント検出・自律行動制御 |

### 手順

1. **MODファイルを配置**: 以下のフォルダに両方のファイルをコピー
   ```
   Documents\Electronic Arts\The Sims 4\Mods\
   ```

2. **ゲーム設定を確認**:
   - ゲームオプション → その他 → 「スクリプトMODを許可」を**有効**にする
   - 「カスタムコンテンツとMODを有効」を**有効**にする

3. **ゲームを再起動**

### アンインストール

上記2つのファイルを Mods フォルダから削除し、ゲームを再起動してください。

## 開発者向け情報

### ビルド方法

#### Package MOD (.package)

S4TK VSCode拡張を使用:

```
Ctrl+Shift+P → "S4TK: Build Packages"
```

#### Script MOD (.ts4script)

```powershell
cd mods/autonomy_mod
npm ci                    # 初回のみ
npm run build:script      # ビルド
npm run deploy:script     # ビルド + デプロイ
```

#### 全体デプロイ

```powershell
npm run deploy:all        # .package + .ts4script を Mods へデプロイ
```

### テスト

```powershell
npm run test              # 単体テスト実行
npm run typecheck         # TypeScript型チェック
```

### ゲーム内テスト方法

1. `Ctrl+Shift+C` でチートコンソールを開く
2. `testingCheats true` を入力
3. ホリデーを強制開始するか、該当日まで進める
4. シムがイベント関連の自律行動を優先的に行うことを確認

### ログ確認

ゲーム内でエラーが発生した場合:
- `Documents\Electronic Arts\The Sims 4\LastException.txt` を確認
- ログラベル: `KokorEventAutonomy`

### ファイル構造

```
mods/autonomy_mod/
├── package.json          # npm設定
├── tsconfig.json         # TypeScript設定
├── s4tk.config.json      # S4TK ビルド設定
├── build.ts              # Package MOD ビルドスクリプト
├── build-script.ts       # Script MOD ビルドスクリプト
├── .mocharc.json         # テスト設定
├── src/
│   ├── tuning/
│   │   ├── buffs/
│   │   │   ├── Kokor_Buff_EventAutonomy.xml
│   │   │   └── Kokor_Buff_EventAutonomy.SimData.xml
│   │   └── snippets/
│   │       └── Kokor_Snippet_EventAutonomy.xml
│   ├── strings/
│   │   ├── strings.stbl.json
│   │   └── strings_ja.stbl.json
│   └── scripts/
│       └── kokor_event_autonomy/
│           ├── __init__.py
│           └── event_autonomy.py
├── test/
│   └── build.test.ts
├── dist/                 # ビルド出力
└── docs/
    └── README.md
```

## トラブルシューティング

### MODが動作しない場合

1. **スクリプトMODの許可**: ゲーム設定で「スクリプトMODを許可」が有効か確認
2. **XmlInjector**: XmlInjector MODが正しくインストールされているか確認
3. **Seasons EP**: ホリデー検出にはSeasons拡張パックが必要（フェスティバルは不要）
4. **LastException.txt**: エラーログを確認

### 自律行動が弱い場合

- このMODは自律スコアをブースト（加点）する仕組みのため、他に強い欲求（空腹、排泄等）がある場合はそちらが優先されます
- 20ゲーム内分ごとにチェックが実行されます

## ライセンス

EA MODポリシーに準拠。個人使用・非営利目的に限ります。
