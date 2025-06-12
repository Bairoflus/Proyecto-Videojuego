/**
 * Módulo centralizado para manejo de autenticación y sesiones
 * Evita duplicación de código entre páginas
 */

// Guardar datos de sesión
export function saveSession({ userId, sessionToken, sessionId }) {
  sessionStorage.setItem("userId", userId);
  sessionStorage.setItem("sessionToken", sessionToken);
  if (sessionId) {
    sessionStorage.setItem("sessionId", sessionId);
  }
}

// Obtener token de sesión
export function getSessionToken() {
  return sessionStorage.getItem("sessionToken");
}

// Obtener userId de sesión
export function getUserId() {
  return sessionStorage.getItem("userId");
}

// Obtener sessionId
export function getSessionId() {
  return sessionStorage.getItem("sessionId");
}

// Obtener todos los datos de sesión
export function getSessionData() {
  return {
    userId: getUserId(),
    sessionToken: getSessionToken(),
    sessionId: getSessionId(),
  };
}

// Limpiar datos de sesión
export function clearSession() {
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("sessionToken");
  sessionStorage.removeItem("sessionId");
  sessionStorage.removeItem("currentRunId");
}

// Verificar si hay sesión activa
export function hasActiveSession() {
  return !!getSessionToken() && !!getUserId();
}

// Requerir login - redirige a login si no hay sesión
export function requireLogin() {
  if (!hasActiveSession()) {
    window.location.href = "/pages/html/login.html";
    return false;
  }
  return true;
}

// Validación simple de email
export function isValidEmail(email) {
  return email && email.includes("@") && email.includes(".");
}

// Validación simple de campos requeridos
export function validateRequired(fields) {
  for (const [name, value] of Object.entries(fields)) {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `El campo ${name} es requerido`;
    }
  }
  return null;
}
