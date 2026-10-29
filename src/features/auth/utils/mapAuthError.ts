const MISSING_CONFIG_PREFIX = "Falta configurar Firebase";

const PERMISSION_DENIED_MESSAGE =
  "Firebase rechazó el guardado del perfil. Publica las reglas de Firestore y vuelve a intentarlo.";

const messagesByCode: Record<string, string> = {
  "auth/email-already-in-use": "Este correo ya está registrado. Intenta iniciar sesión.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/user-not-found": "El correo o la contraseña no son correctos.",
  "auth/wrong-password": "El correo o la contraseña no son correctos.",
  "auth/user-disabled": "Esta cuenta está deshabilitada. Contacta al administrador.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento y vuelve a intentar.",
  "auth/network-request-failed": "No hay conexión con Firebase. Revisa tu conexión a internet.",
  "auth/operation-not-allowed":
    "El registro con correo y contraseña no está habilitado en Firebase Authentication.",
  "permission-denied": PERMISSION_DENIED_MESSAGE,
  "PERMISSION_DENIED": PERMISSION_DENIED_MESSAGE,
};

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }
  return error instanceof Error ? error.message : "";
}

/**
 * Traduce un error de Firebase a un mensaje para el usuario.
 * `overrides` permite cambiar el mensaje de un código en un flujo concreto.
 */
export function mapAuthError(
  error: unknown,
  fallback: string,
  overrides: Record<string, string> = {},
): string {
  const code = getErrorCode(error);
  if (code.includes(MISSING_CONFIG_PREFIX)) {
    return code;
  }

  const messages = { ...messagesByCode, ...overrides };
  const match = Object.keys(messages).find((key) =>
    code.toLowerCase().includes(key.toLowerCase()),
  );
  return match ? messages[match] : fallback;
}
