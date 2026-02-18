このプロジェクトの内容を理解してから進めましょう
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\AGENTS.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\CLAUDE.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\develop
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\research\sims4_mod_development_guide.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\research\Sims 4 Mod テスト・デバッグ手法.md
以下の要件を満たすmodを作ってください
既存のmodの実装やテストレベルを参考にしてください
ビルドはS4TK buildで行うことに注意してください

## 目的

より自律的にイベントを達成するためのmodを作成する

## 要件

- SIMS4で動作するmodであること
- 現在のゲームバージョンで動作すること
- 現在発生中のイベントにおける条件を取得できていること(例えば海賊の日のイベントなら海賊らしい発言をする等)
- 取得した条件をもとに、シムが自律的に行動できるようにすること
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

## QA

1. 対象となる年齢の範囲→すべての年齢

2. 自律行動の範囲
どのような自律行動を期待されますか？

コミュニケーション: イベント達成に必要な人との交流を自動的に実行：含む
趣味活動: イベント達成に必要な趣味活動を自動的に実行：含む

3. 設定のカスタマイズ性
シムごとにON/OFFを切り替えたい？：いいえ
行動の優先度を設定したい？：いいえ
特定の時間帯のみ有効にしたい？：いいえ

4. 技術的なアプローチ
上記要件を満たす柔軟性と拡張性を重視してください