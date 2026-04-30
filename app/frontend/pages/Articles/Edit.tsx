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
          <button type="submit" disabled={processing} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {processing ? '更新中...' : '更新する'}
          </button>
          <Link href={`/articles/${article.id}`} className="text-gray-600 hover:underline py-2">キャンセル</Link>
        </div>
      </form>
    </div>
  )
}
