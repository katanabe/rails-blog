import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";

const STORAGE_KEY = "rails_blog_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken: setTokenState }}>
      {children}
    </AuthContext.Provider>
  );
}
