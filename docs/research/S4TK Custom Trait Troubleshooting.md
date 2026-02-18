# S4TK カスタムトレイトがCASに表示されない問題 - 調査レポート

## 調査概要
S4TK VS Code Extension v0.2.4で作成したカスタムトレイトがCASに表示されず、チートにも反応しない問題について調査を実施。

## 調査結果

### 1. SimDataファイルの必要性
Sims 4のカスタムトレイト（およびほとんどのチューニングリソース）には、Tuning XMLファイルとSimDataファイルの両方が必要。SimDataはバイナリ形式で、Tuning XMLと同じインスタンスキーを持つ必要がある。[^1][^2]

Sims4CommunityLibraryのガイドでは、トレイト作成時にTuning XMLとSimDataの両方をクローンして編集する手順が明記されている。SimDataが欠落するとゲームがトレイトを読み込めない。[^2]

### 2. tags フィールドの重要性
Sims 4 Modding Wikiによると、`tags`はSimData Inclusiveなフィールドであり、「Need to distinguish among 'Personality Traits', 'Achievement Traits' and 'Walkstyle Traits'」と記載されている。[^3]

提出されたXMLには`tags`フィールドが含まれておらず、これがCASに表示されない主要な原因と考えられる。動画チュートリアルでも、tagsはトレイトがCASのどこに配置されるかを決定すると説明されている。[^4][^5]

### 3. FNV32 vs FNV64 問題
ColonolNuttyのガイドによると、PERSONALITYタイプのトレイトはFNV32ハッシュをインスタンスIDとして使用する必要がある。FNV64を使用するとゲームが正しく認識できない。[^2]

Zerbuの投稿（2020年のパッチ修正時）でも、新しいsim profilesが64-bit trait IDsを認識しないことが報告されている。[^6]

### 4. species フィールド
2017年のPets パッチ以降、traits にspeciesコードが必要になったという報告がある。[^7]

### 5. S4TK VS Code Extension の特性
S4TK VS Code Extension（v0.2.4）はSims 4 Toolkitに基づく開発環境。ビルドプロセスがSimDataを自動生成するかどうかはドキュメントで確認が必要。S4TKのリポジトリにはSimDataの変換ユーティリティ（s4tk-server）が存在する。[^8][^9]

### 6. パッケージ読み込み確認方法
- lastException.txt の確認
- S4TK Package Viewer でリソース確認
- localthumbcache.package の削除
- testingcheats true → traits.equip_trait でのテスト

### 7. 一般的なトラブルシューティング
- Modsフォルダ直下配置は確認済み
- MOD有効化設定は確認済み
- ゲーム再起動は確認済み
- cache削除が推奨される[^10]

## 結論
最も可能性が高い原因は以下の複合要因：
1. SimDataファイルの欠落
2. tagsフィールドの欠落
3. FNV32/FNV64のミスマッチ

## 参考ソース
- Sims4CommunityLibrary Wiki - How To Create A Custom Trait[^2]
- Sims 4 Modding Wiki - Traits[^3]
- Sims 4 Studio Forum - Traits/SimData discussions[^1][^6]
- Mod tutorial videos[^5][^4]
- S4TK GitHub repositories[^9][^8]

---

## References

1. [Why do we have SimData AND tuning XML for things like buffs? | Sims 4 Studio](https://sims4studio.com/thread/23833/why-simdata-tuning-xml-buffs) - I hope this is in the correct place, it's literally my second post here so sorry if I misunderstood ...

2. [How To Create A Custom Trait - ColonolNutty/Sims4CommunityLibrary GitHub Wiki](https://github-wiki-see.page/m/ColonolNutty/Sims4CommunityLibrary/wiki/How-To-Create-A-Custom-Trait)

3. [Traits | Sims 4 Modding Wiki - Fandom](https://sims-4-modding.fandom.com/wiki/Traits) - A trait (TDESC: Trait) is a defining characteristic of a Sim. Traits affect a Sim's behavior, either...

4. [How to Create Traits | Sims 4 Mod Tutorials 2025](https://www.youtube.com/watch?v=uB3PQpoODYI) - What I was wondering now was if you could make a tutorial on traits that can be exchanged/replaced b...

5. [The Sims 4 Modding Tutorial Part 11: Creating A Custom Trait With Mod Constructor V5](https://www.youtube.com/watch?v=QUQybNVu63g) - Part 11 of our modding series explores creation of traits using Zerbu's Mod Constructor: V5 (Downloa...

6. [Manually Fixing Custom Traits for New Patch | Sims 4 Studio](https://sims4studio.com/thread/22900/manually-fixing-custom-traits-patch) - I'm so sorry to bother everyone, but I was wondering if anyone happened to know how to fix custom tr...

7. [Traits Disappearing Patch 1.36.99.1020](https://sims4studio.com/thread/10861/traits-disappearing-patch-36-1020) - Traits now need to have species code in them for them to appear properly. Here's an example of the u...

8. [GitHub - sims4toolkit/s4tk-server: Example of how to set up an S4TK server for use with any language.](https://github.com/sims4toolkit/s4tk-server) - Example of how to set up an S4TK server for use with any language. - sims4toolkit/s4tk-server

9. [GitHub - sims4toolkit/s4tk-vscode: S4TK extension for Visual Studio Code.](https://github.com/sims4toolkit/s4tk-vscode) - S4TK extension for Visual Studio Code. Contribute to sims4toolkit/s4tk-vscode development by creatin...

10. [Troubleshooting Traits in the Sims 4: Why They Might Not ...](https://www.oreateai.com/blog/troubleshooting-traits-in-the-sims-4-why-they-might-not-show-up-in-cas/c679188778cfda0df185892de784d180) - Explore common reasons why traits may not appear in Create-A-Sim (CAS) for The Sims 4 and discover e...

