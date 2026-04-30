# Rails Blog

Rails 8.1 + Inertia.js + React 19 で構築した学習用ブログアプリ。

## スタック

- Ruby 3.3 / Rails 8.1
- Inertia.js + React 19 + TypeScript (vite_ruby)
- Tailwind CSS v4
- SQLite (Solid Cache / Queue / Cable)
- Devise 認証

## セットアップ

```bash
bin/setup
bin/dev
```

`http://localhost:3000` にアクセス。

## テスト

```bash
bin/rails test
bin/rails test:system
bin/ci  # rubocop + audit + brakeman + test 一式
```
