import { Link } from "@inertiajs/react";
import { Article, SharedProps } from "../../types";

type PageProps = SharedProps & {
  articles: Article[];
};

export default function Index({ articles, auth, flash }: PageProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      {flash.notice && (
        <p className="mb-4 text-green-700 bg-green-100 p-3 rounded">
          {flash.notice}
        </p>
      )}
      {flash.alert && (
        <p className="mb-4 text-red-700 bg-red-100 p-3 rounded">
          {flash.alert}
        </p>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">記事一覧</h1>
        {auth.user && (
          <Link
            href="/articles/new"
            className="bg-blue-600 text-white px-4 py-2 rounded
  hover:bg-blue-700"
          >
            新規作成
          </Link>
        )}
      </div>
      <ul className="space-y-3">
        {articles.map((a) => (
          <li key={a.id} className="border rounded p-4 hover:bg-gray-50">
            <Link
              href={`/articles/${a.id}`}
              className="text-lg font-semibold hover:underline"
            >
              {a.title}
            </Link>
            {a.published_at == null && (
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                下書き
              </span>
            )}
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{a.body}</p>
            <p className="mt-1 text-xs text-gray-400">
              {a.published_at
                ? new Date(a.published_at).toLocaleDateString("ja-JP")
                : "未公開"}
            </p>
          </li>
        ))}
      </ul>
      {auth.user == null && (
        <p className="mt-6 text-center">
          <a
            href="/users/sign_in"
            className="text-blue-600
  hover:underline"
          >
            ログイン
          </a>
          して記事を投稿しよう
        </p>
      )}
    </div>
  );
}
