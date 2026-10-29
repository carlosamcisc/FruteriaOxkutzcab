import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

/** Estructura común de las páginas de acceso: encabezado simple y contenido centrado. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell auth-page">
      <header className="site-header">
        <nav className="navbar" aria-label="Navegación principal">
          <div className="container">
            <BrandLogo />
          </div>
        </nav>
      </header>
      <main className="login-page-main">{children}</main>
    </div>
  );
}
