// Login functionality for Shattered Timeline
import { API_CONFIG } from './config.js';

class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginButton = document.getElementById('loginButton');
        this.messageContainer = document.getElementById('messageContainer');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Real-time validation
        this.emailInput.addEventListener('input', () => this.validateEmail());
        this.passwordInput.addEventListener('input', () => this.validatePassword());
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showFieldError(this.emailInput, 'Please enter a valid email address');
            return false;
        } else {
            this.clearFieldError(this.emailInput);
            return true;
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;
        
        if (password && password.length < 6) {
            this.showFieldError(this.passwordInput, 'Password must be at least 6 characters long');
            return false;
        } else {
            this.clearFieldError(this.passwordInput);
            return true;
        }
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        // Clear previous messages
        this.clearMessage();
        
        // Get form data
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        // Validate inputs
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (!isEmailValid || !isPasswordValid) {
            this.showError('Please fix the validation errors above');
            return;
        }
        
        // Show loading state
        this.setLoading(true);
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Login successful
                this.handleLoginSuccess(data);
            } else {
                // Handle different error types
                if (response.status === 401) {
                    this.showError('Invalid email or password. Please try again.');
                } else if (response.status === 400 && data.errors) {
                    this.handleValidationErrors(data.errors);
                } else {
                    this.showError(data.message || 'Login failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoading(false);
        }
    }

    handleLoginSuccess(data) {
        // Store session data
        localStorage.setItem('sessionToken', data.session_token);
        localStorage.setItem('sessionId', data.session_id);
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('isLoggedIn', 'true');
        
        this.showSuccess('Login successful! Redirecting to game...');
        
        // Redirect to game after short delay
        setTimeout(() => {
            window.location.href = './game.html';
        }, 1500);
    }

    handleValidationErrors(errors) {
        errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (field) {
                this.showFieldError(field, error.message);
            }
        });
        
        this.showError('Please fix the validation errors above');
    }

    setLoading(isLoading) {
        this.loginButton.disabled = isLoading;
        this.loginButton.textContent = isLoading ? 'Logging in...' : 'Log In';
        
        // Disable form inputs during loading
        this.emailInput.disabled = isLoading;
        this.passwordInput.disabled = isLoading;
    }

    showSuccess(message) {
        this.messageContainer.innerHTML = `
            <div class="message success">
                <span class="message-icon">✓</span>
                <span class="message-text">${message}</span>
            </div>
        `;
        this.messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        this.messageContainer.innerHTML = `
            <div class="message error">
                <span class="message-icon">✗</span>
                <span class="message-text">${message}</span>
            </div>
        `;
        this.messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    clearMessage() {
        this.messageContainer.innerHTML = '';
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Check if user is already logged in
if (localStorage.getItem('isLoggedIn') === 'true') {
    // Optionally redirect to game if already logged in
    // window.location.href = './game.html';
} 