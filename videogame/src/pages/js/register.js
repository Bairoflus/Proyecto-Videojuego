/**
 * Registration page functionality
 */
import { registerUser } from "../../utils/api.js";
import { SimpleAudioManager } from "../../utils/SimpleAudioManager.js";

// Initialize audio manager for menu music
const audioManager = new SimpleAudioManager();

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  console.log("Register page initialized");

  // Start menu music
  audioManager.playMainMenuMusic();

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous messages
    errorMessage.style.display = "none";
    successMessage.style.display = "none";

    // Get form data
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Validate passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = "Passwords do not match";
      errorMessage.style.display = "block";
      return;
    }

    // Validate password length
    if (password.length < 6) {
      errorMessage.textContent = "Password must be at least 6 characters long";
      errorMessage.style.display = "block";
      return;
    }

    try {
      // Disable submit button during request
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";

      // Call API to register user
      const result = await registerUser(username, email, password);

      // Show success message
      successMessage.textContent =
        "Account created successfully! Redirecting to login...";
      successMessage.style.display = "block";

      // Clear form
      form.reset();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } catch (error) {
      // Show error message
      errorMessage.textContent =
        error.message || "Failed to create account. Please try again.";
      errorMessage.style.display = "block";
    } finally {
      // Re-enable submit button
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "Create Account";
    }
  });
});
