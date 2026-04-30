import { Link, router } from "@inertiajs/react";
import { Article, SharedProps } from "../../types";

type PageProps = SharedProps & {
  article: Article;
};

export default function Show({ article, auth, flash }: PageProps) {
  const isOwner = auth.user?.id === article.user_id;

  function handleDelete() {
    if (confirm("本当に削除しますか？")) {
      router.delete(`/articles/${article.id}`);
    }
  }

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
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="mb-4 rounded max-w-full"
        />
      )}
      {article.published_at == null && (
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          下書き
        </span>
      )}
      <p className="mt-4 whitespace-pre-wrap leading-relaxed">{article.body}</p>
      <div className="mt-8 flex gap-3">
        <Link href="/articles" className="text-blue-600 hover:underline">
          ← 一覧へ
        </Link>
        {isOwner && (
          <>
            <Link
              href={`/articles/${article.id}/edit`}
              className="bg-yellow-500 text-white px-4 py-2
  rounded hover:bg-yellow-600"
            >
              編集
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded
  hover:bg-red-600"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
