import type { ReactNode } from "react";
import { AuthLayout } from "./AuthLayout";

interface RegistrationPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function RegistrationPageLayout({ title, description, children }: RegistrationPageLayoutProps) {
  return (
    <AuthLayout>
      <section className="registration-section">
        <div className="container">
          <div className="registration-layout">
            <div className="registration-intro">
              <span className="section-kicker">Crea tu cuenta</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}
