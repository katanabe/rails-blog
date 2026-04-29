# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このプロジェクトの位置付け

**このリポジトリはオーナーが Rails を学習するためのプロジェクト**。プロダクション運用や納期駆動の開発ではない。協業時は以下を優先すること:

- **何をしたかではなく、なぜそうするかを説明する**。差分だけ出して終わらせない。Rails / Hotwire / Active Storage / Devise のイディオムが出てきたら、その背景や代替案を一言添える。
- **黙って自動修正しない**。`bin/rubocop -a` や大規模リファクタを走らせる前に「これは何を直すか」を伝えてから実行。学習機会を奪わない。
- **既存コードに学べる箇所があれば指摘する**。「ここは Rails 標準で言うと◯◯パターン」のような補足はむしろ歓迎。
- **抽象化を急がない**。教科書的な「3 個出てきたら DRY」より、まずは素直に書いて Rails の機能を体感してもらう方を選ぶ。
- **暗黙知に出会ったら [`docs/rails-idioms.md`](docs/rails-idioms.md) に書き留める**。Rails 規約由来で「コードに直接出てこないけど知らないと書けない」類のものに触れたら、テンプレに沿って追記。陳腐化前提のドキュメントなので、参照時は記録日と Rails バージョンを必ず確認する。

## スタック

- Rails 8.1.3 / Ruby 3.3.11(`.ruby-version` 参照)
- SQLite に全部寄せている: 主 DB に加えて `solid_cache`・`solid_queue`・`solid_cable`(Redis/Postgres は無し)。本番は `storage/` 配下に 4 つの SQLite DB を分けて配置(`config/database.yml`)。
- Hotwire(Turbo + Stimulus)+ `importmap-rails` — **Node もバンドラーも無し**。JS 依存の追加は `bin/importmap pin` で行うこと(npm は使わない)。
- Tailwind は `tailwindcss-rails`(`bin/dev` がサイドプロセスとして watch を起動)、アセットパイプラインは Propshaft。
- 認証は Devise。
- 画像は Active Storage + `image_processing`(libvips)。
- デプロイは Kamal + Thruster。
- Minitest(Rails 標準)。`parallelize(workers: :number_of_processors)` 有効、`fixtures :all`。

## コマンド

```bash
bin/setup              # gem 導入・DB 準備・ログ削除のあと bin/dev を exec
bin/setup --skip-server
bin/dev                # Procfile.dev: rails server + tailwindcss:watch
bin/rails test                                       # unit / integration テスト
bin/rails test test/models/article_test.rb           # ファイル単位
bin/rails test test/models/article_test.rb:42        # 行番号で単体実行
bin/rails test:system                                # system テスト(Capybara + Selenium)
bin/rubocop                                          # Lint(rubocop-rails-omakase)
bin/rubocop -a                                       # 自動修正
bin/brakeman                                         # セキュリティスキャン
bin/bundler-audit                                    # gem の CVE チェック
bin/importmap audit                                  # JS 依存の CVE チェック
bin/ci                                               # ローカル CI 一式(rubocop・各種 audit・brakeman・テスト・seed replant)
```

GitHub Actions(`.github/workflows/ci.yml`)では以下 5 ジョブが個別に走る: `scan_ruby`(brakeman + bundler-audit)/ `scan_js`(importmap audit)/ `lint`(rubocop)/ `test` / `system-test`。`test` ジョブは `libvips` を入れているので、ローカルで image_processing 関連のテストを走らせる際にも libvips が必要。

## アーキテクチャ

シングルリソースのブログ: `User`(Devise)が `has_many :articles, dependent: :destroy`。`Article` は `belongs_to :user`、`has_one_attached :image`、`title` と `body` の presence バリデーション、`scope :published`(`published_at` がセットされている)と `scope :draft`(nil)を持つ。

**公開範囲 / 認可ロジックはモデルではなく `ArticlesController` 側にある:**

- `index`: 未ログインには `Article.published` のみ。ログイン済みは公開記事 + 自分の下書きを見られる(`Article.published.or(current_user.articles.draft)`)。
- 書き込み系(`new`/`create`/`edit`/`update`/`destroy`)は `authenticate_user!` が必須。
- 所有者限定アクション(`edit`/`update`/`destroy`)は `authorize_user!` を通り、`@article.user != current_user` の場合は flash を出して `root_path` にリダイレクト。

article 関連の新規アクションを追加する際は、上記 3 階層(公開 / ログイン必須 / 所有者限定)のどれに該当するかを判断し、対応する `before_action` を必ず差すこと。

ルーティングは最小: `devise_for :users`、`resources :articles`、`root → articles#index`、ヘルスチェックの `/up`。

ユーザー向けの flash・ラベルは**日本語**(例: `"記事を投稿しました"`)。新規メッセージを足す時も日本語に揃える。

## 規約

- スタイルは `rubocop-rails-omakase` のみ —— `.rubocop.yml` にカスタム上書きは無し。コミット前に `bin/rubocop -a` を回す。CI の lint ジョブは必ずグリーンにする。
- テストは `test/{models,controllers,system,…}` を `app/` のディレクトリ構造に揃える。現状はモデルテストのみ存在。コントローラの挙動や UI フローを変えるときは、対応するテストを足すこと。
- マイグレーションは Rails 8.1 ターゲット(`ActiveRecord::Migration[8.1]`)。
- `.zed/settings.json` で Ruby は `ruby-lsp` による format-on-save が有効。

## ハマりどころ

- `ApplicationController` で `allow_browser versions: :modern` を有効化済み。古い User-Agent やレガシー headless ドライバは 406 を返されて沈黙ブロックされるので、システムテスト追加時の Selenium バージョンに注意。
- `bin/ci` の最終ステップは `RAILS_ENV=test bin/rails db:seed:replant`。`db/seeds.rb` を編集すると CI が**テスト DB に対して** seed を流す。冪等に保つこと。
- Dependabot(`.github/dependabot.yml`)が `bundler` と `github-actions` を毎週 bump する。直近のコミット履歴がバージョン更新で埋まりやすい。
- Kamal デプロイのシークレットは `.kamal/secrets`(コミット禁止)。
