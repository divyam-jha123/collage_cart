// Import Supabase client
import { supabase } from './supabaseClient.js';

// Notification helper function
function showNotification(message, type = 'error') {
    const notificationId = type === 'success' ? 'success-notification' : 'notification';
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }
}

// Theme toggle functionality
const STORAGE_THEME = 'login_theme';

function applyThemeFromStorage() {
    const theme = localStorage.getItem(STORAGE_THEME) || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.body.classList.remove('dark');
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isDark) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    applyThemeFromStorage();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    // Set up signup form handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Check if user is already logged in
    checkAuth();
});

// Check authentication status
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // User is already logged in, redirect to main page
        window.location.href = './main.html';
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    
    // Validation
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return false;
    }
    
    // Show loading state
    const signupBtn = document.querySelector('.login-btn');
    const originalText = signupBtn.textContent;
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account...';
    
    try {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/main.html'
            }
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user) {
            showNotification('Account created successfully! Please check your email to verify your account, or you can try logging in now.', 'success');
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
            return false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup failed: ' + (error.message || 'Unable to create account. Please try again.'), 'error');
        signupBtn.disabled = false;
        signupBtn.textContent = originalText;
        return false;
    }
    
    return false;
}

