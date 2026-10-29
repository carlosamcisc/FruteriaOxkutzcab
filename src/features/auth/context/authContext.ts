import { createContext } from "react";
import type { User } from "firebase/auth";

export interface AuthContextValue {
  user: User | null;
  /** `true` mientras Firebase restaura la sesión guardada. */
  isLoading: boolean;
  /** Mensaje si no se pudo conectar con Firebase Authentication. */
  error: string | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
