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

### `namespace :api do devise_for :users` は別 scope を作る — 既存 `:user` scope に追加するなら `devise_scope`

- **記録日:** 2026-04-29 / Rails 8.1 / devise 5.0.3 / devise-jwt 0.13.0
- **遭遇箇所:** `config/routes.rb`
- **規約:** 既存 HTML 側で `devise_for :users`(scope = `:user`)があるアプリで API 用 `/api/v1/login` 等を生やすとき、`namespace :api do namespace :v1 do devise_for :users` と書くと **`:api_v1_user` という別 scope が作られる**。Warden は `params[:api_v1_user][:email/:password]` を読むようになり、JWT のペイロードも `"scp":"api_v1_user"` になる。同じ `:user` scope に追加ルートだけ生やしたい場合は `devise_scope :user do post "/api/v1/login", to: "api/v1/sessions#create" ... end` を使う。
- **背景:** Devise の scope は「複数ユーザモデル(User と AdminUser 等)」を想定した名前空間機能。route helper のプレフィックスではなく、Warden 認証ユーザーの引き当て名・params キー・`current_<scope>` ヘルパ名すべてに影響する。`namespace :api { devise_for :users }` は「API 用に別ユーザモデルを切る」と Devise が解釈してしまうので、フロント側の payload 構造が `{user: ...}` のつもりで送ると `params[:user]` には何も入らず、Warden の `database_authenticatable` strategy が「資格情報無し」と判断して 401 を返す(エラーメッセージにも出ないので原因が掴みにくい)。`devise_scope :user do ... end` は「このルートも `:user` scope のものとして扱う」を Devise に明示する DSL。
- **検証手段:** ログイン成功時の JWT を [jwt.io](https://jwt.io) 等でデコードしてペイロードの `scp` を確認。`"scp":"user"` なら正しい。`"scp":"api_v1_user"` なら scope が分かれてる。

### Devise 5.x の `verify_signed_out_user` は JWT logout と相性が悪い — destroy で skip する

- **記録日:** 2026-04-29 / Rails 8.1 / devise 5.0.3 / devise-jwt 0.13.0
- **遭遇箇所:** `app/controllers/api/v1/sessions_controller.rb`
- **規約:** `Devise::SessionsController` を継承して JWT 用の logout (`DELETE /api/v1/logout`) を作るとき、**`prepend_before_action :verify_signed_out_user`(Devise 既定)が 401 を返してくる**ので、API コントローラ側で `skip_before_action :verify_signed_out_user, only: :destroy` が必要。
- **背景:** `verify_signed_out_user` は「全 scope についてログアウト状態か?」を `all_signed_out?` で確認する before_action。HTML フロー(セッション cookie で認証維持)を前提に書かれていて、warden の Warden state が走る前の段階で「未認証なら早期 401」を返す目的。一方 JWT API では「Authorization ヘッダから毎リクエスト warden が認証する」モデルなので、`all_signed_out?` 判定の段階で warden の認証フックが期待通りに走らず、結果として「ログアウト前のリクエストでも all_signed_out が true」と判定されて `respond_to_on_destroy(:unauthorized)` 経路に流れて 401 になる。warden-jwt_auth 自体の `RevocationManager` ミドルウェアはレスポンス後に jti をローテするので、jti は実際には回るが HTTP 応答だけは 401 になる、というねじれた状態が観測される。
- **検証手段:** logout 前後で `users.jti` の値を見比べると変わっている(失効処理は走った)が、HTTP ステータスは 401 になる、という症状。`skip_before_action :verify_signed_out_user, only: :destroy` を入れた瞬間に 204 + jti ローテに揃う。

### Devise 5.x で `respond_to_on_destroy` のシグネチャがキーワード引数化された

- **記録日:** 2026-04-29 / Rails 8.1 / devise 5.0.3
- **遭遇箇所:** `app/controllers/api/v1/sessions_controller.rb`
- **規約:** カスタム `Devise::SessionsController` 派生で `respond_to_on_destroy` を override する場合、シグネチャは `def respond_to_on_destroy(non_navigational_status: :no_content)` で受ける。Devise 5.x は呼び元で `respond_to_on_destroy(non_navigational_status: :no_content)` または `respond_to_on_destroy(non_navigational_status: :unauthorized)` とキーワード引数で渡してくるので、引数なしの override は `wrong number of arguments (given 1, expected 0)` で爆発する。
- **背景:** Devise 4.x までは `respond_to_on_destroy` は引数無しで、ステータスはメソッド内部で組み立てていた。5.x で「成功時(204)」「未認証時(401)」のステータスを呼び元から渡せるよう refactor された(`devise/lib/devise/sessions_controller.rb` 参照)。継承する側はシグネチャを揃えるか `(*args, **kwargs)` で吸収する必要がある。
- **検証手段:** `bundle show devise | xargs -I{} grep -n "respond_to_on_destroy" {}/app/controllers/devise/sessions_controller.rb` で本家のシグネチャを直接確認できる。Devise gem を上げた直後に該当する継承クラスがあるかは grep で洗うのが確実。
