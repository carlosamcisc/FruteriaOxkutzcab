import { useState } from "react";
import type { FormEvent } from "react";
import type { Feedback } from "../../../shared/components/FeedbackAlert";
import { loginWithEmail, logout, sendPasswordReset } from "../services/authentication";
import { mapAuthError } from "../utils/mapAuthError";

export function useLogin() {
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoginSubmitting(true);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await loginWithEmail(
        String(formData.get("loginCorreo") ?? ""),
        String(formData.get("loginContrasena") ?? ""),
      );
      form.reset();
      window.location.hash = "#cliente-inicio";
    } catch (error) {
      setFeedback({
        type: "error",
        message: mapAuthError(error, "No pudimos iniciar sesión. Intenta nuevamente."),
      });
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!email.trim()) {
      setFeedback({
        type: "error",
        message: "Escribe tu correo para enviarte el enlace de recuperación.",
      });
      return;
    }

    setIsResetSubmitting(true);
    setFeedback(null);
    try {
      await sendPasswordReset(email);
      setFeedback({ type: "success", message: "Revisa tu correo para restablecer tu contraseña." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: mapAuthError(
          error,
          "No pudimos enviar el enlace. Verifica el correo e intenta nuevamente.",
          { "auth/user-not-found": "No encontramos una cuenta con ese correo." },
        ),
      });
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setFeedback(null);
    try {
      await logout();
      setFeedback({ type: "success", message: "Sesión cerrada correctamente." });
    } catch {
      setFeedback({ type: "error", message: "No pudimos cerrar la sesión. Intenta nuevamente." });
    }
  };

  return {
    isLoginSubmitting,
    isResetSubmitting,
    feedback,
    handleLogin,
    handlePasswordReset,
    handleLogout,
  };
}
