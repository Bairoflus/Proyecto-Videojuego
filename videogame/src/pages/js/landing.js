/**
 * Landing page functionality with background music and session cleanup
 */
import { clearSessionLocalStorage } from "../../utils/api.js";
import { SimpleAudioManager } from "../../utils/SimpleAudioManager.js";

// Initialize audio manager for menu music
const audioManager = new SimpleAudioManager();

/**
 * Clear any existing session data to ensure clean state
 */
function clearSessionData() {
  console.log("Landing page loaded - clearing any existing session data...");
  try {
    const clearedCount = clearSessionLocalStorage();
    if (clearedCount > 0) {
      console.log(
        `🧹 Landing page cleanup: cleared ${clearedCount} localStorage entries`
      );
    } else {
      console.log("🧹 Landing page: no session data to clear");
    }
  } catch (error) {
    console.error("Failed to clear session data on landing:", error);
    // Fallback: manual cleanup
    [
      "sessionToken",
      "currentUserId",
      "currentSessionId",
      "currentRunId",
      "testMode",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log("🧹 Fallback cleanup completed");
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Landing page initialized");
  clearSessionData();
  audioManager.playMainMenuMusic();
});

// Don't stop music when navigating between menu pages
// Music will continue playing across menu navigation
