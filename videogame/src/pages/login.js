/**
 * Login page functionality
 */
import { loginUser } from "../utils/api.js";

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous messages
    if (errorMessage) errorMessage.style.display = "none";
    if (successMessage) successMessage.style.display = "none";

    // Get form data
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;

    try {
      // Disable submit button during request
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";

      // Call API to login user
      const result = await loginUser(email, password);

      // Store session token
      localStorage.setItem("sessionToken", result.sessionToken);

      // Show success message
      if (successMessage) {
        successMessage.textContent = "Login successful! Redirecting to game...";
        successMessage.style.display = "block";
      }

      // Redirect to game after 1 second
      setTimeout(() => {
        window.location.href = "game.html";
      }, 1000);
    } catch (error) {
      // Show error message
      if (errorMessage) {
        errorMessage.textContent =
          error.message || "Invalid email or password. Please try again.";
        errorMessage.style.display = "block";
      }
    } finally {
      // Re-enable submit button
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "Log In";
    }
  });
});
