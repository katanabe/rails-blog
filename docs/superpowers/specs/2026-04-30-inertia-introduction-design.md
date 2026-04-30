# Inertia.js 導入 設計ドキュメント

Date: 2026-04-30

## 背景・目的

このリポジトリは Rails 学習プロジェクト。学習ロードマップの Phase 3 として Inertia.js を導入する。

- Phase 1: Rails MVC (ERB views + Devise session auth)
- Phase 2: Rails API + React SPA (devise-jwt + fetch + CORS)
- Phase 3: Inertia.js (Rails-driven React, session auth, no API layer)

学習のゴールは「Phase 2 で苦労した JWT / CORS / AuthContext / fetch が Inertia でどう不要になるか」を体感すること。

## アーキテクチャ

### Before (Phase 2)

```
Browser → fetch → Rails /api/v1/* → JSON → React (manual state)
Auth: JWT token in Authorization header (devise-jwt)
```

### After (Phase 3)

```
Browser → link/form → Rails ArticlesController → inertia: → React Page
Auth: Devise session cookie (before_action :authenticate_user!)
```

### 何が消えるか

- `frontend/` スタンドアロン Vite アプリ (参照用に残す)
- `api/v1` への fetch 呼び出し
- JWT / devise-jwt の仕組み
- CORS 設定
- `AuthContext` / `useAuth` / `api.ts`

### 何が残るか

- Devise セッション認証 (Phase 1 から継続)
- `app/controllers/api/v1/` (Phase 2 の学習記録として保持)
- `frontend/` ディレクトリ (Phase 2 の学習記録として保持)
- Tailwind CSS

## ファイル構成

```
Gemfile                          # inertia_rails, vite_ruby 追加
app/
  frontend/
    entrypoints/
      application.tsx            # Inertia 初期化エントリポイント
    pages/
      Articles/
        Index.tsx                # 記事一覧 (props: articles)
        Show.tsx                 # 記事詳細 (props: article)
        New.tsx                  # 記事作成フォーム
        Edit.tsx                 # 記事編集フォーム (props: article)
  views/layouts/
    inertia.html.erb             # Inertia 用レイアウト
  controllers/
    articles_controller.rb       # render inertia: に変更
config/
  vite.json                      # vite_ruby 設定
vite.config.ts                   # Vite 設定 (react plugin + vite-plugin-rails)
Procfile.dev                     # vite dev プロセスを追加
package.json                     # @inertiajs/react, react, react-dom
```

## コントローラー設計

```ruby
# app/controllers/articles_controller.rb
class ArticlesController < ApplicationController
  before_action :authenticate_user!, only: [:new, :create, :edit, :update, :destroy]
  before_action :set_article, only: [:show, :edit, :update, :destroy]
  before_action :authorize_user!, only: [:edit, :update, :destroy]

  def index
    @articles =
      if current_user
        Article.published.or(current_user.articles.draft).order(created_at: :desc)
      else
        Article.published.order(created_at: :desc)
      end
    render inertia: 'Articles/Index', props: {
      articles: @articles.map { |a| serialize_article(a) }
    }
  end

  def show
    render inertia: 'Articles/Show', props: { article: serialize_article(@article) }
  end

  def new
    render inertia: 'Articles/New'
  end

  def create
    @article = current_user.articles.build(article_params)
    if @article.save
      redirect_to @article, notice: '記事を投稿しました'
    else
      render inertia: 'Articles/New', props: { errors: @article.errors.full_messages }
    end
  end

  def edit
    render inertia: 'Articles/Edit', props: { article: serialize_article(@article) }
  end

  def update
    if @article.update(article_params)
      redirect_to @article, notice: '記事を更新しました'
    else
      render inertia: 'Articles/Edit', props: {
        article: serialize_article(@article),
        errors: @article.errors.full_messages
      }
    end
  end

  def destroy
    @article.destroy
    redirect_to root_path, notice: '記事を削除しました'
  end
end
```

## React ページ設計

```tsx
// pages/Articles/Index.tsx
// props: { articles: ArticleProps[] }
// - 記事一覧表示
// - Link コンポーネントで Show へ遷移
// - ログイン済みなら New へのリンク表示

// pages/Articles/Show.tsx
// props: { article: ArticleProps }
// - 記事詳細表示
// - オーナーなら Edit / Delete ボタン表示

// pages/Articles/New.tsx
// props: { errors?: string[] }
// - useForm でフォーム管理
// - router.post('/articles', data) で送信

// pages/Articles/Edit.tsx
// props: { article: ArticleProps, errors?: string[] }
// - useForm で既存データをプリフィル
```

## 認証フロー

Inertia では Devise のセッション Cookie がブラウザに自動付与されるため:
- ログイン: 既存の `GET /users/sign_in` (Devise ERB フォーム) をそのまま使う
- 認可: `before_action :authenticate_user!` が未認証ユーザーをリダイレクト
- ログアウト: `DELETE /users/sign_out` (Deviseデフォルト)

## gem / npm パッケージ

### Gemfile 追加
- `inertia_rails` (~> 2.0)
- `vite_ruby`

### package.json 追加
- `@inertiajs/react`
- `@vitejs/plugin-react`
- `vite`
- `vite-plugin-rails`
- `react`, `react-dom`
- `@types/react`, `@types/react-dom` (devDependencies)

## Tailwind

vite_ruby 導入後は Tailwind を Vite 経由で処理する。
`@tailwindcss/vite` plugin を使用し、`tailwindcss-rails` gem は不要になる。

## 学習ポイントのまとめ

| Phase 2 (API + React) | Phase 3 (Inertia) |
|---|---|
| fetch() で API を叩く | props として受け取る |
| JWT token を管理 | セッション Cookie (自動) |
| CORS 設定が必要 | 同一オリジンなので不要 |
| AuthContext で状態管理 | Rails が認証を管理 |
| React Router でルーティング | Rails ルーティングをそのまま使う |
| useEffect でデータ取得 | コントローラーが初期データを渡す |
