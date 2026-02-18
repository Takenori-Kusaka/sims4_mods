このプロジェクトの内容を理解してから進めましょう
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\AGENTS.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\CLAUDE.md
C:\Users\kokor\OneDrive\Document\GitHub\sims4_mods\docs\research\sims4_mod_development_guide.md
以下の要件を満たすmodを作ってください

## 目的

より自律的に仕事や学校をで好成績を収めるための日課、昇進条件をこなすためのmodを作成する

## 要件

- SIMS4で動作するmodであること
- 現在のゲームバージョンで動作すること
- 現在の仕事や高校、大学といった学業システムにおける昇進条件、日課を取得できていること
- 取得した条件をもとに、シムが自律的に行動できるようにすること
- modの導入、設定方法についてのドキュメントを提供すること

## 開発フォルダ

mods/
    career_auto_tasks/      ; キャリア自動タスクmod
    education_auto_tasks/   ; 学業自動タスクmod

## その他

不明点があれば教えてください

## QA

1. 対象となるキャリア/学業の範囲
以下のどれを対象としますか？（複数選択可）

 大人の仕事（キャリア）： 全キャリア
 高校 (High School Years DLC)：含む
 大学 (Discover University DLC)：含む
 パートタイムジョブ (Teen/Elder向け)：含む

2. 自律行動の範囲
どのような自律行動を期待されますか？

スキル上げ: 昇進に必要なスキルを自動的に練習：含む
日課（Daily Tasks）: 同僚との交流、本を読む等を自動実行：含む
宿題: 学生の場合、宿題を自動的にこなす：含む
勤務時間外の準備: 出勤前にニーズを満たす等：含む

3. 設定のカスタマイズ性
シムごとにON/OFFを切り替えたい？：いいえ
行動の優先度を設定したい？：いいえ
特定の時間帯のみ有効にしたい？：いいえ

4. 技術的なアプローチ
上記要件を満たす柔軟性と拡張性を重視してください