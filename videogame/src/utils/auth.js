/**
 * Centralized module for authentication and session handling
 * Avoids code duplication between pages
 */

// Save session data
export function saveSession({ userId, sessionToken, sessionId }) {
  sessionStorage.setItem("userId", userId);
  sessionStorage.setItem("sessionToken", sessionToken);
  if (sessionId) {
    sessionStorage.setItem("sessionId", sessionId);
  }
}

// Get session token
export function getSessionToken() {
  return sessionStorage.getItem("sessionToken");
}

// Get user ID from session
export function getUserId() {
  return sessionStorage.getItem("userId");
}

// Get session ID
export function getSessionId() {
  return sessionStorage.getItem("sessionId");
}

// Get all session data
export function getSessionData() {
  return {
    userId: getUserId(),
    sessionToken: getSessionToken(),
    sessionId: getSessionId(),
  };
}

// Clear session data
export function clearSession() {
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("sessionToken");
  sessionStorage.removeItem("sessionId");
  sessionStorage.removeItem("currentRunId");
}

// Check if there is an active session
export function hasActiveSession() {
  return !!getSessionToken() && !!getUserId();
}

// Require login - redirects to login if there is no session
export function requireLogin() {
  if (!hasActiveSession()) {
    window.location.href = "/pages/html/login.html";
    return false;
  }
  return true;
}

// Simple email validation
export function isValidEmail(email) {
  return email && email.includes("@") && email.includes(".");
}

// Simple required fields validation
export function validateRequired(fields) {
  for (const [name, value] of Object.entries(fields)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `The field ${name} is required`;
    }
  }
  return null;
} 