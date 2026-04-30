# Inertia.js 導入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inertia.js + vite_ruby を導入し、`ArticlesController` の view を ERB から React ページに置き換える。

**Architecture:** `vite_ruby` gem で Vite を Rails に統合し、`inertia_rails` gem でコントローラーが `render inertia: 'Articles/Index', props: {...}` を返せるようにする。Devise セッション認証はそのまま使い、JWT/CORS/AuthContext/fetch は不要になる。

**Tech Stack:** Ruby 3.3 / Rails 8.1 / inertia_rails / vite_ruby / @inertiajs/react / React 19 / TypeScript / Tailwind CSS v4

---

## ファイルマップ

| 操作 | パス | 役割 |
|------|------|------|
| 追加 | `app/views/layouts/inertia.html.erb` | Inertia用レイアウト (vite_client_tag + vite_javascript_tag) |
| 追加 | `app/frontend/entrypoints/application.tsx` | Inertia初期化エントリポイント |
| 追加 | `app/frontend/pages/Articles/Index.tsx` | 記事一覧 React ページ |
| 追加 | `app/frontend/pages/Articles/Show.tsx` | 記事詳細 React ページ |
| 追加 | `app/frontend/pages/Articles/New.tsx` | 記事作成フォーム |
| 追加 | `app/frontend/pages/Articles/Edit.tsx` | 記事編集フォーム |
| 変更 | `Gemfile` | inertia_rails + vite_ruby 追加 |
| 変更 | `package.json` | ルートに新設 (npm パッケージ定義) |
| 自動生成 | `vite.config.ts` | vite install が生成、その後 react plugin 追加 |
| 自動生成 | `config/vite.json` | vite_ruby の設定 |
| 自動更新 | `Procfile.dev` | `vite: bin/vite dev` が追加される |
| 変更 | `app/controllers/application_controller.rb` | inertia_share でユーザー情報を全ページに共有 |
| 変更 | `app/controllers/articles_controller.rb` | `render :index` → `render inertia:` に変更 |
| 保持 | `frontend/` | Phase 2 の学習記録として残す |
| 保持 | `app/controllers/api/v1/` | Phase 2 の学習記録として残す |

---

## Task 1: gem を追加して vite_ruby をセットアップ

**Files:**
- Modify: `Gemfile`
- Auto-create: `vite.config.ts`, `config/vite.json`, `bin/vite`, `Procfile.dev`

- [ ] **Step 1: Gemfile に inertia_rails と vite_ruby を追加**

`Gemfile` の `gem "jbuilder"` の下に追加:

```ruby
gem "inertia_rails"
gem "vite_ruby"
```

- [ ] **Step 2: bundle install**

```bash
bundle install
```

- [ ] **Step 3: vite_ruby の初期セットアップ**

```bash
bundle exec vite install
```

実行後に以下が自動生成・更新される:
- `vite.config.ts` (基本設定)
- `config/vite.json` (vite_ruby の設定)
- `bin/vite` (実行スクリプト)
- `Procfile.dev` に `vite: bin/vite dev` が追記される

- [ ] **Step 4: 生成されたファイルを確認**

```bash
cat vite.config.ts
cat config/vite.json
cat Procfile.dev
```

Procfile.dev が以下のようになっていることを確認:
```
web: bin/rails server
css: bin/rails tailwindcss:watch
vite: bin/vite dev
```

- [ ] **Step 5: コミット**

```bash
git add Gemfile Gemfile.lock vite.config.ts config/vite.json bin/vite Procfile.dev
git commit -m "chore: add inertia_rails + vite_ruby, run vite install"
```

---

## Task 2: npm パッケージをインストール

**Files:**
- Create: `package.json` (プロジェクトルートに)
- Modify: `vite.config.ts`

- [ ] **Step 1: ルートに package.json を作成**

```json
{
  "name": "rails-blog",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build"
  },
  "dependencies": {
    "@inertiajs/react": "^2.0",
    "react": "^19.0",
    "react-dom": "^19.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0",
    "@types/react": "^19.0",
    "@types/react-dom": "^19.0",
    "vite-plugin-rails": "^0.9"
  }
}
```

- [ ] **Step 2: pnpm でインストール**

```bash
pnpm install
```

- [ ] **Step 3: vite.config.ts に React plugin を追加**

`bundle exec vite install` で生成された `vite.config.ts` を以下に書き換え:

```ts
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-rails'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    react(),
  ],
})
```

- [ ] **Step 4: Vite dev サーバーを起動して動作確認**

```bash
bin/vite dev
```

エラーなく起動することを確認して Ctrl+C で停止。

- [ ] **Step 5: コミット**

```bash
git add package.json pnpm-lock.yaml vite.config.ts
git commit -m "chore: add npm packages (@inertiajs/react, react, vite-plugin-rails)"
```

---

## Task 3: Inertia エントリポイントとレイアウトを作成

**Files:**
- Create: `app/frontend/entrypoints/application.tsx`
- Create: `app/views/layouts/inertia.html.erb`

- [ ] **Step 1: ディレクトリを作成**

```bash
mkdir -p app/frontend/entrypoints
mkdir -p app/frontend/pages/Articles
```

- [ ] **Step 2: エントリポイントを作成**

`app/frontend/entrypoints/application.tsx`:

```tsx
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
    return pages[`../pages/${name}.tsx`] as any
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
```

- [ ] **Step 3: Inertia 用レイアウトを作成**

`app/views/layouts/inertia.html.erb`:

```erb
<!DOCTYPE html>
<html>
  <head>
    <title>Rails Blog</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <%= csrf_meta_tags %>
    <%= stylesheet_link_tag "tailwind", "data-turbo-track": "reload" %>
    <%= vite_client_tag %>
    <%= vite_javascript_tag 'application', type: 'module' %>
  </head>
  <body>
    <%= yield %>
  </body>
</html>
```

- [ ] **Step 4: コミット**

```bash
git add app/frontend/entrypoints/application.tsx app/views/layouts/inertia.html.erb
git commit -m "chore: add Inertia entrypoint and inertia layout"
```

---

## Task 4: ApplicationController に共有データを設定

**Files:**
- Modify: `app/controllers/application_controller.rb`

`inertia_share` で設定したデータは全 React ページで `props` として受け取れる。
ここでは「ログイン中のユーザー情報」と「flash メッセージ」を共有する。

- [ ] **Step 1: inertia_share を追加**

`app/controllers/application_controller.rb` を以下に変更:

```ruby
class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  inertia_share do
    {
      auth: {
        user: current_user ? { id: current_user.id, email: current_user.email } : nil
      },
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      }
    }
  end
end
```

- [ ] **Step 2: コミット**

```bash
git add app/controllers/application_controller.rb
git commit -m "feat(inertia): share auth user and flash via inertia_share"
```

---

## Task 5: 記事一覧ページ (Articles/Index)

**Files:**
- Modify: `app/controllers/articles_controller.rb`
- Create: `app/frontend/pages/Articles/Index.tsx`

- [ ] **Step 1: コントローラーに layout と article_props を追加し、index を変更**

`app/controllers/articles_controller.rb` を以下に変更。
`layout 'inertia'` を追加、`index` アクションを `render inertia:` に変更、
`private` に `article_props` メソッドを追加する:

```ruby
class ArticlesController < ApplicationController
  layout 'inertia'
  before_action :authenticate_user!, only: [ :new, :create, :edit, :update, :destroy ]
  before_action :set_article, only: [ :show, :edit, :update, :destroy ]
  before_action :authorize_user!, only: [ :edit, :update, :destroy ]

  def index
    articles =
      if current_user
        Article.published.or(current_user.articles.draft).order(created_at: :desc)
      else
        Article.published.order(created_at: :desc)
      end
    render inertia: 'Articles/Index', props: {
      articles: articles.map { |a| article_props(a) }
    }
  end

  def show
  end

  def new
    @article = current_user.articles.build
  end

  def create
    @article = current_user.articles.build(article_params)
    if @article.save
      redirect_to @article, notice: "記事を投稿しました"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @article.update(article_params)
      redirect_to @article, notice: "記事を更新しました"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @article.destroy
    redirect_to articles_path, notice: "記事を削除しました"
  end

  private

  def set_article
    @article = Article.find(params[:id])
  end

  def authorize_user!
    redirect_to root_path, alert: "権限がありません" unless @article.user == current_user
  end

  def article_params
    params.require(:article).permit(:title, :body, :image, :published_at)
  end

  def article_props(article)
    {
      id: article.id,
      title: article.title,
      body: article.body,
      published_at: article.published_at,
      created_at: article.created_at,
      user_id: article.user_id,
      image_url: article.image.attached? ? url_for(article.image) : nil
    }
  end
end
```

- [ ] **Step 2: Articles/Index.tsx を作成**

`app/frontend/pages/Articles/Index.tsx`:

```tsx
import { Link } from '@inertiajs/react'

type Article = {
  id: number
  title: string
  body: string
  published_at: string | null
  image_url: string | null
  user_id: number
}

type PageProps = {
  articles: Article[]
  auth: { user: { id: number; email: string } | null }
  flash: { notice: string | null; alert: string | null }
}

export default function Index({ articles, auth, flash }: PageProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      {flash.notice && <p className="mb-4 text-green-700 bg-green-100 p-3 rounded">{flash.notice}</p>}
      {flash.alert && <p className="mb-4 text-red-700 bg-red-100 p-3 rounded">{flash.alert}</p>}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">記事一覧</h1>
        {auth.user && (
          <Link href="/articles/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            新規作成
          </Link>
        )}
      </div>
      <ul className="space-y-3">
        {articles.map((a) => (
          <li key={a.id} className="border rounded p-4 hover:bg-gray-50">
            <Link href={`/articles/${a.id}`} className="text-lg font-semibold hover:underline">
              {a.title}
            </Link>
            {a.published_at == null && (
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">下書き</span>
            )}
          </li>
        ))}
      </ul>
      {auth.user == null && (
        <p className="mt-6 text-center">
          <a href="/users/sign_in" className="text-blue-600 hover:underline">ログイン</a>して記事を投稿しよう
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: bin/dev で起動してブラウザ確認**

```bash
bin/dev
```

`http://localhost:3000` を開いて記事一覧が React コンポーネントで表示されることを確認。

- [ ] **Step 4: コミット**

```bash
git add app/controllers/articles_controller.rb app/frontend/pages/Articles/Index.tsx
git commit -m "feat(inertia): articles index page (React)"
```

---

## Task 6: 記事詳細ページ (Articles/Show)

**Files:**
- Modify: `app/controllers/articles_controller.rb`
- Create: `app/frontend/pages/Articles/Show.tsx`

- [ ] **Step 1: show アクションを Inertia に変更**

`articles_controller.rb` の `show` を:

```ruby
def show
  render inertia: 'Articles/Show', props: { article: article_props(@article) }
end
```

- [ ] **Step 2: Articles/Show.tsx を作成**

`app/frontend/pages/Articles/Show.tsx`:

```tsx
import { Link, router } from '@inertiajs/react'

type Article = {
  id: number
  title: string
  body: string
  published_at: string | null
  image_url: string | null
  user_id: number
}

type PageProps = {
  article: Article
  auth: { user: { id: number; email: string } | null }
  flash: { notice: string | null; alert: string | null }
}

export default function Show({ article, auth, flash }: PageProps) {
  const isOwner = auth.user?.id === article.user_id

  function handleDelete() {
    if (confirm('本当に削除しますか？')) {
      router.delete(`/articles/${article.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {flash.notice && <p className="mb-4 text-green-700 bg-green-100 p-3 rounded">{flash.notice}</p>}
      {flash.alert && <p className="mb-4 text-red-700 bg-red-100 p-3 rounded">{flash.alert}</p>}
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="mb-4 rounded max-w-full" />
      )}
      {article.published_at == null && (
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">下書き</span>
      )}
      <p className="mt-4 whitespace-pre-wrap leading-relaxed">{article.body}</p>
      <div className="mt-8 flex gap-3">
        <Link href="/articles" className="text-blue-600 hover:underline">← 一覧へ</Link>
        {isOwner && (
          <>
            <Link
              href={`/articles/${article.id}/edit`}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              編集
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: ブラウザで確認**

記事タイトルをクリックして詳細ページが表示されることを確認。
ログイン状態で自分の記事には編集・削除ボタンが出ることを確認。

- [ ] **Step 4: コミット**

```bash
git add app/controllers/articles_controller.rb app/frontend/pages/Articles/Show.tsx
git commit -m "feat(inertia): articles show page (React)"
```

---

## Task 7: 記事作成ページ (Articles/New)

**Files:**
- Modify: `app/controllers/articles_controller.rb`
- Create: `app/frontend/pages/Articles/New.tsx`

- [ ] **Step 1: new / create アクションを変更**

`articles_controller.rb` の `new` と `create` を:

```ruby
def new
  render inertia: 'Articles/New'
end

def create
  @article = current_user.articles.build(article_params)
  if @article.save
    redirect_to @article, notice: "記事を投稿しました"
  else
    render inertia: 'Articles/New', props: {
      errors: @article.errors.full_messages
    }, status: :unprocessable_entity
  end
end
```

- [ ] **Step 2: Articles/New.tsx を作成**

`app/frontend/pages/Articles/New.tsx`:

```tsx
import { useForm, Link } from '@inertiajs/react'

type ArticleForm = {
  article: {
    title: string
    body: string
    published_at: string
  }
}

type PageProps = {
  errors?: string[]
}

export default function New({ errors }: PageProps) {
  const { data, setData, post, processing } = useForm<ArticleForm>({
    article: { title: '', body: '', published_at: '' },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/articles')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">記事を作成</h1>
      {errors && errors.length > 0 && (
        <ul className="mb-4 text-red-700 bg-red-100 p-3 rounded space-y-1">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">タイトル</label>
          <input
            type="text"
            value={data.article.title}
            onChange={(e) => setData('article', { ...data.article, title: e.target.value })}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">本文</label>
          <textarea
            value={data.article.body}
            onChange={(e) => setData('article', { ...data.article, body: e.target.value })}
            className="w-full border rounded px-3 py-2 h-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">公開日時 <span className="text-gray-500 text-sm">(空欄で下書き保存)</span></label>
          <input
            type="datetime-local"
            value={data.article.published_at}
            onChange={(e) => setData('article', { ...data.article, published_at: e.target.value })}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={processing}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? '送信中...' : '投稿する'}
          </button>
          <Link href="/articles" className="text-gray-600 hover:underline py-2">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: ブラウザで確認**

ログイン後「新規作成」をクリックしてフォームが出ることを確認。
タイトルと本文を入れて投稿し、詳細ページに遷移することを確認。

- [ ] **Step 4: コミット**

```bash
git add app/controllers/articles_controller.rb app/frontend/pages/Articles/New.tsx
git commit -m "feat(inertia): articles new/create page (React)"
```

---

## Task 8: 記事編集ページ (Articles/Edit)

**Files:**
- Modify: `app/controllers/articles_controller.rb`
- Create: `app/frontend/pages/Articles/Edit.tsx`

- [ ] **Step 1: edit / update / destroy アクションを変更**

`articles_controller.rb` の `edit`、`update`、`destroy` を:

```ruby
def edit
  render inertia: 'Articles/Edit', props: { article: article_props(@article) }
end

def update
  if @article.update(article_params)
    redirect_to @article, notice: "記事を更新しました"
  else
    render inertia: 'Articles/Edit', props: {
      article: article_props(@article),
      errors: @article.errors.full_messages
    }, status: :unprocessable_entity
  end
end

def destroy
  @article.destroy
  redirect_to articles_path, notice: "記事を削除しました"
end
```

- [ ] **Step 2: Articles/Edit.tsx を作成**

`app/frontend/pages/Articles/Edit.tsx`:

```tsx
import { useForm, Link } from '@inertiajs/react'

type Article = {
  id: number
  title: string
  body: string
  published_at: string | null
}

type ArticleForm = {
  article: {
    title: string
    body: string
    published_at: string
  }
}

type PageProps = {
  article: Article
  errors?: string[]
}

export default function Edit({ article, errors }: PageProps) {
  const { data, setData, patch, processing } = useForm<ArticleForm>({
    article: {
      title: article.title,
      body: article.body,
      published_at: article.published_at ?? '',
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    patch(`/articles/${article.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">記事を編集</h1>
      {errors && errors.length > 0 && (
        <ul className="mb-4 text-red-700 bg-red-100 p-3 rounded space-y-1">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">タイトル</label>
          <input
            type="text"
            value={data.article.title}
            onChange={(e) => setData('article', { ...data.article, title: e.target.value })}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">本文</label>
          <textarea
            value={data.article.body}
            onChange={(e) => setData('article', { ...data.article, body: e.target.value })}
            className="w-full border rounded px-3 py-2 h-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">公開日時 <span className="text-gray-500 text-sm">(空欄で下書き)</span></label>
          <input
            type="datetime-local"
            value={data.article.published_at ?? ''}
            onChange={(e) => setData('article', { ...data.article, published_at: e.target.value })}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={processing}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? '更新中...' : '更新する'}
          </button>
          <Link href={`/articles/${article.id}`} className="text-gray-600 hover:underline py-2">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: ブラウザで全機能を通しテスト**

1. 一覧 → 詳細 → 編集 → 更新 の流れを確認
2. 削除ボタンで記事が消えることを確認
3. ログアウトして `/articles/new` にアクセス → Devise のログインページにリダイレクトされることを確認
4. 他人の記事の `/articles/:id/edit` → トップページにリダイレクトされることを確認

- [ ] **Step 4: コミット**

```bash
git add app/controllers/articles_controller.rb app/frontend/pages/Articles/Edit.tsx
git commit -m "feat(inertia): articles edit/update/destroy (React)"
```
