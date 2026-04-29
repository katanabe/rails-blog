# Rails イディオム集

このリポジトリで遭遇した Rails / Hotwire / Devise / Active Storage / Kamal の暗黙知を、出会った瞬間に書き留める場所。

## 読むときの心構え

**陳腐化する前提で疑ってかかる。**

- Rails のメジャーバージョンが上がる、gem の major bump が入る、Hotwire / Active Storage の API 変更が入る — どれが起きてもこのドキュメントは黙って古びる。
- 各項目には**記録日**と**Rails バージョン**が付いている。記録日から半年以上経った項目は、参照する前に「これは今も有効か?」を一度疑う。
  - 一次情報を当たる: [Rails Guides](https://guides.rubyonrails.org/) / 該当 gem の README / `bin/rails -T` / `rails routes` / 実コード。
  - 該当バージョンの Rails ソース(`bundle show rails` で場所を確認)を読むのが最も信頼できる。
- 内容が現状と食い違っていたら、**項目を消すのではなく更新して履歴を残す**(末尾に `### 更新 (YYYY-MM-DD / Rails X.Y)` 節を追記)。なぜ変わったかが将来の学びになる。

## 書くときのルール

新しいイディオムに遭遇したら、Claude / 自分が以下のテンプレで追記する。背景(「なぜそうなっているか」)を省かない — そこが学習の本体。

```
### {タイトル}

- **記録日:** YYYY-MM-DD / Rails X.Y
- **遭遇箇所:** {ファイルパス:行番号 か、関連コミット SHA}
- **規約:** {何が暗黙知/慣習か。1〜2 行で}
- **背景:** {なぜそうなっているか。歴史・思想・代替案との比較}
- **検証手段:** {今も有効かを確認するコマンドや参照先。任意}
```

書く対象の例:

- 「これ知らないと書けない」けどコードに直接出てこないもの(規約由来の自動配線など)
- 「明示的な行はないのに動く」もの(autoload・asset pipeline・routing の暗黙のヘルパー)
- gem 固有の DSL のうち、READMEで強調されていない地味な振る舞い
- 失敗してから初めて気づくタイプの落とし穴(例: 命名規約を外れたときの挙動)

書かない対象:

- Rails Guides に明確に書いてあって、ググれば即出てくる定番(`belongs_to` の意味、など)
- このリポジトリ固有の設計判断 — それは `CLAUDE.md` 側に書く

---

## 項目

<!-- 新しいエントリは下に追記。古い順に並べる。 -->

### `devise-jwt` は CORS で `expose: ["Authorization"]` が必須

- **記録日:** 2026-04-29 / Rails 8.1 / devise-jwt 0.13.0 / rack-cors 3.0.0
- **遭遇箇所:** `config/initializers/cors.rb`
- **規約:** `devise-jwt` はログイン成功時にレスポンスの `Authorization: Bearer <token>` ヘッダで JWT を返す。CORS 越しでこれを React 側 JS から `response.headers.get("Authorization")` で読むには、`rack-cors` の `expose` に `"Authorization"` を**明示する必要がある**。
- **背景:** Fetch / XHR の仕様上、ブラウザは「[CORS-safelisted response header](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_response_header)」(`Cache-Control`・`Content-Language`・`Content-Length`・`Content-Type`・`Expires`・`Last-Modified`・`Pragma`)以外のヘッダを **デフォルトで JS に晒さない**。`Authorization` は安全リスト外。`Access-Control-Expose-Headers: Authorization` を返すことでブラウザが当該ヘッダを `response.headers` 経由で読めるようになる。`headers: :any` は **リクエスト** 側ヘッダの許可なので向きが違う。両方向の設定が必要、という非対称性に注意。
- **検証手段:** ログインの fetch を投げて `response.headers.get("Authorization")` を `console.log`。`null` なら expose 不足。サーバ側で `curl -i -X POST http://localhost:3000/login ...` の生レスポンスに `Access-Control-Expose-Headers: Authorization` があるかでも確認可能。
