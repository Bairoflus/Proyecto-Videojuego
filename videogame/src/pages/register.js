/**
 * JavaScript to handle user registration
 * Connects the HTML form with the Shattered Timeline API
 */

// Import API configuration
import { API_CONFIG } from './config.js';

// DOM elements
let form, usernameInput, emailInput, passwordInput, confirmPasswordInput, submitButton, messageContainer;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    form = document.getElementById('registerForm');
    usernameInput = document.getElementById('username');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    confirmPasswordInput = document.getElementById('confirmPassword');
    submitButton = document.getElementById('registerButton');
    messageContainer = document.getElementById('messageContainer');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    form.addEventListener('submit', handleSubmit);
    
    // Real-time validation
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    passwordInput.addEventListener('input', validatePasswordMatch);
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value
    };
    
    // Validate data before sending
    const validation = validateForm(formData);
    if (!validation.isValid) {
        showError(validation.message);
        return;
    }
    
    // Disable button during submission
    setLoading(true);
    
    try {
        // Send data to API
        const response = await registerUser({
            username: formData.username,
            email: formData.email,
            password: formData.password
        });
        
        if (response.success) {
            showSuccess('Account created successfully!');
            
            // Save user information to localStorage
            localStorage.setItem('shattered_timeline_user', JSON.stringify({
                user_id: response.user_id,
                username: response.username,
                email: response.email,
                created_at: response.created_at
            }));
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Error creating account. Please try again.');
    } finally {
        setLoading(false);
    }
}

/**
 * Send registration data to API
 */
async function registerUser(userData) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        // Handle specific API errors
        if (response.status === 409) {
            throw new Error(data.message || 'Email or username already in use');
        } else if (response.status === 400) {
            // Validation errors
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessages = data.errors.map(err => err.message).join(', ');
                throw new Error(errorMessages);
            } else {
                throw new Error(data.message || 'Invalid data');
            }
        } else {
            throw new Error(data.message || 'Server error');
        }
    }
    
    return {
        success: true,
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        created_at: data.created_at
    };
}

/**
 * Validate form before submission
 */
function validateForm(data) {
    // Validate username
    if (!data.username || data.username.length < 3) {
        return { isValid: false, message: 'Username must be at least 3 characters long' };
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(data.username)) {
        return { isValid: false, message: 'Username can only contain letters and numbers' };
    }
    
    // Validate email
    if (!data.email || !isValidEmail(data.email)) {
        return { isValid: false, message: 'Please enter a valid email' };
    }
    
    // Validate password
    if (!data.password || data.password.length < 6) {
        return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    
    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password match in real time
 */
function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Passwords do not match');
        confirmPasswordInput.style.borderColor = '#ff4444';
    } else {
        confirmPasswordInput.setCustomValidity('');
        confirmPasswordInput.style.borderColor = '';
    }
}

/**
 * Show error message
 */
function showError(message) {
    messageContainer.innerHTML = `
        <div class="message error">
            <span class="message-icon">✗</span>
            <span class="message-text">${message}</span>
        </div>
    `;
    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Show success message
 */
function showSuccess(message) {
    messageContainer.innerHTML = `
        <div class="message success">
            <span class="message-icon">✓</span>
            <span class="message-text">${message}</span>
        </div>
    `;
    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Handle loading state
 */
function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Creating account...' : 'Create Account';
    
    // Disable inputs during loading
    const inputs = [usernameInput, emailInput, passwordInput, confirmPasswordInput];
    inputs.forEach(input => {
        input.disabled = isLoading;
    });
} 