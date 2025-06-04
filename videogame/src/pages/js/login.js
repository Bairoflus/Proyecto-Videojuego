/**
 * Login page functionality
 */
import { loginUser, createRun } from '../../utils/api.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
        
        // Get form data
        const email = form.querySelector('input[type="email"]').value.trim();
        const password = form.querySelector('input[type="password"]').value;
        
        try {
            // Disable submit button during request
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
            
            // Call API to login user
            const result = await loginUser(email, password);
            
            // Store session token, userId, and sessionId
            localStorage.setItem('sessionToken', result.sessionToken);
            localStorage.setItem('currentUserId', result.userId);
            localStorage.setItem('currentSessionId', result.sessionId);
            
            // Create a new run for the login session
            try {
                console.log("Creating run for new login session...");
                const runData = await createRun(result.userId);
                console.log("Run created on login:", runData);
                
                // Store current run ID for potential future use
                localStorage.setItem('currentRunId', runData.runId);
            } catch (runError) {
                console.error("Failed to create run on login:", runError);
                // Don't block login if run creation fails
            }
            
            // Show success message
            if (successMessage) {
                successMessage.textContent = 'Login successful! Starting new game...';
                successMessage.style.display = 'block';
            }
            
            // Redirect to game after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1500);
            
        } catch (error) {
            // Show error message
            if (errorMessage) {
                errorMessage.textContent = error.message || 'Invalid email or password. Please try again.';
                errorMessage.style.display = 'block';
            }
        } finally {
            // Re-enable submit button
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Log In';
        }
    });
}); 