このプロジェクトの内容を理解してから進めましょう
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\AGENTS.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\CLAUDE.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\develop
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\research\sims4_mod_development_guide.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\research\Sims 4 Mod テスト・デバッグ手法.md
以下の要件を満たすmodを作ってください
既存のmodの実装やテストレベルを参考にしてください

## 目的

より自律的に動作し続けるためのmodを作成する

## 要件

- SIMS4で動作するmodであること
- 現在のゲームバージョンで動作すること
- 通知や電話などに対して自動選択し続けること
  - 職場や学校へ"一緒に行く"、"一人で行かせる"の選択を自動化
  - 誰かが訪問したいというリクエストの選択を自動化
  - 電話の応答を自動化
  - その他、中断が発生しうるイベントを調査して自動化
  ― 電話が鳴ったとしてもゲームスピードを変更しないこと(バニラの設定やMCCCにあるかも？)
- modの導入、設定方法についてのドキュメントを提供すること

## 開発フォルダ

mod/
    autonomy_mod/
        src/
            (ソースコード)
        docs/
            (ドキュメント)
        tests/
            (テストコード)
            
## その他

不明点があれば教えてください
