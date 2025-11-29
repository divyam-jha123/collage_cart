// Import Supabase client
import { supabase } from './supabaseClient.js';

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

    // Set up login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Set up password reset link
    const resetLink = document.getElementById('reset-password-link');
    if (resetLink) {
        resetLink.addEventListener('click', (e) => {
            e.preventDefault();
            handlePasswordReset();
        });
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

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const email = document.getElementById('college-code').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and college code');
        return false;
    }
    
    // Show loading state
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    
    try {
        // Sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Supabase auth error:', error);
            // More specific error messages
            let errorMessage = 'Invalid email or password';
            if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please verify your email address first. Check your inbox for a confirmation email.';
            } else if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please check your credentials or use the signup page to create an account.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            throw new Error(errorMessage);
        }
        
        if (data.user) {
            // Check if email is confirmed
            if (!data.user.email_confirmed_at && data.user.confirmation_sent_at) {
                alert('Please check your email and click the confirmation link before logging in.');
                loginBtn.disabled = false;
                loginBtn.textContent = originalText;
                return false;
            }
            
            // Store user session
            localStorage.setItem('user_email', email);
            
            console.log('Login successful, redirecting...');
            // Small delay to ensure session is set
            setTimeout(() => {
                window.location.href = './main.html';
            }, 100);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + (error.message || 'Invalid email or password'));
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
        return false;
    }
    
    return false;
}

// Handle password reset
async function handlePasswordReset() {
    const email = document.getElementById('college-code').value.trim();
    
    if (!email) {
        const emailInput = prompt('Enter your email address to reset password:');
        if (!emailInput) return;
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
                redirectTo: window.location.origin + '/login.html'
            });
            
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert('Password reset email sent! Please check your inbox.');
            }
        } catch (error) {
            alert('Error sending reset email: ' + error.message);
        }
    } else {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/login.html'
            });
            
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert('Password reset email sent! Please check your inbox.');
            }
        } catch (error) {
            alert('Error sending reset email: ' + error.message);
        }
    }
}

