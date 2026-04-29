const API_BASE = "http://localhost:3000/api/v1";

export type ArticlePayload = {
  id: number;
  title: string;
  body: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
  image_url: string | null;
};

export type LoginResult = {
  token: string;
  user: { id: number; email: string };
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ user: { email, password } }),
  });
  if (!res.ok) throw new Error("login failed");

  const token = res.headers.get("Authorization");
  if (!token) throw new Error("missing Authorization header");

  const body = await res.json();
  return { token, user: body.user };
}

export async function fetchArticles(
  token: string | null,
): Promise<ArticlePayload[]> {
  const res = await fetch(`${API_BASE}/articles`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });
  if (!res.ok) throw new Error(`fetchArticles failed: ${res.status}`);
  return res.json();
}
