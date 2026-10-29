import { useRef } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useLogin } from "../../features/auth/hooks/useLogin";
import { AuthLayout } from "../../shared/components/AuthLayout";
import { FeedbackAlert } from "../../shared/components/FeedbackAlert";

export function InicioSesionPage() {
  const { user, error: authError } = useAuth();
  const {
    isLoginSubmitting,
    isResetSubmitting,
    feedback,
    handleLogin,
    handlePasswordReset,
    handleLogout,
  } = useLogin();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const visibleFeedback = feedback ?? (authError ? { type: "error" as const, message: authError } : null);

  return (
    <AuthLayout>
      <section className="login-section" aria-labelledby="login-title">
        <div className="container">
          <div className="login-layout">
            <div className="login-intro">
              <span className="section-kicker">Acceso a tu cuenta</span>
              <h1 id="login-title">Vuelve a lo que hace crecer tu negocio.</h1>
              <p>
                Inicia sesión para consultar tus productos, cotizaciones y
                pedidos en un solo lugar.
              </p>
            </div>

            <div className="registration-card login-card">
              {user ? (
                <div className="authenticated-state text-center">
                  <div className="authenticated-icon" aria-hidden="true">
                    <i className="bi bi-person-check-fill" />
                  </div>
                  <h2>Sesión iniciada</h2>
                  <p>
                    Accediste como <strong>{user.email}</strong>.
                  </p>
                  <FeedbackAlert feedback={visibleFeedback} />
                  <button className="btn btn-outline-success w-100" type="button" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <>
                  <div className="registration-heading">
                    <h2>Iniciar sesión</h2>
                    <p>Usa el correo y la contraseña de tu cuenta.</p>
                  </div>
                  <FeedbackAlert feedback={visibleFeedback} />
                  <form onSubmit={handleLogin}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="loginCorreo">Correo electrónico</label>
                      <input ref={emailInputRef} className="form-control" id="loginCorreo" name="loginCorreo" type="email" required autoComplete="email" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label" htmlFor="loginContrasena">Contraseña</label>
                      <input className="form-control" id="loginContrasena" name="loginContrasena" type="password" required autoComplete="current-password" />
                    </div>
                    <button
                      className="forgot-password"
                      type="button"
                      onClick={() => handlePasswordReset(emailInputRef.current?.value ?? "")}
                      disabled={isResetSubmitting}
                    >
                      {isResetSubmitting ? "Enviando enlace..." : "¿Olvidaste tu contraseña?"}
                    </button>
                    <button className="btn btn-primary w-100 mt-3" type="submit" disabled={isLoginSubmitting}>
                      {isLoginSubmitting ? "Ingresando..." : "Iniciar sesión"}
                      {!isLoginSubmitting && <i className="bi bi-arrow-right ms-2" aria-hidden="true" />}
                    </button>
                  </form>
                  <p className="login-register-link">
                    ¿Aún no tienes cuenta? <a href="#seleccion-rol">Regístrate aquí</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}
