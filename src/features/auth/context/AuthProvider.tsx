import { useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { observeAuthState } from "../services/authentication";
import { AuthContext } from "./authContext";

/** Mantiene una única suscripción al estado de sesión para toda la aplicación. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      return observeAuthState((nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos conectar con Firebase Authentication.",
      );
      setIsLoading(false);
      return undefined;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
