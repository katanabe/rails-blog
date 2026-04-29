import { useEffect, useState } from "react";
import { fetchArticles, login, type ArticlePayload } from "./api";
import { useAuth } from "./auth-context";

export default function App() {
  const { token } = useAuth();
  return token ? <ArticleList /> : <LoginForm />;
}

function LoginForm() {
  const { setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { token } = await login(email, password);
      setToken(token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        required
      />
      <button type="submit" disabled={busy}>
        {busy ? "..." : "Login"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

function ArticleList() {
  const { token, setToken } = useAuth();
  const [articles, setArticles] = useState<ArticlePayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles(token)
      .then(setArticles)
      .catch((err) => setError((err as Error).message));
  }, [token]);

  return (
    <div>
      <button onClick={() => setToken(null)}>Logout</button>
      <h1>Articles</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {articles.map((a) => (
          <li key={a.id}>
            <strong>{a.title}</strong>
            {a.published_at == null && " (draft)"}
            <p>{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
