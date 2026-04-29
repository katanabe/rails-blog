import { createContext, useContext } from "react";

export type AuthValue = {
  token: string | null;
  setToken: (token: string | null) => void;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
