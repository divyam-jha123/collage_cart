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

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set up login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Set up Google login handler
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
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
        showNotification('Please enter both email and college code', 'error');
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
                showNotification('Please check your email and click the confirmation link before logging in.', 'error');
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
        showNotification('Login failed: ' + (error.message || 'Invalid email or password'), 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
        return false;
    }

    return false;
}

// Handle Google Login
async function handleGoogleLogin(event) {
    event.preventDefault();

    const googleBtn = document.getElementById('google-login-btn');
    const originalText = googleBtn.innerHTML;
    googleBtn.disabled = true;
    googleBtn.innerHTML = '<span>Connecting...</span>';

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/main.html'
            }
        });

        if (error) throw error;

        // OAuth redirect happens automatically, so we might not reach here if successful
    } catch (error) {
        console.error('Google login error:', error);
        showNotification('Google login failed: ' + error.message, 'error');
        googleBtn.disabled = false;
        googleBtn.innerHTML = originalText;
    }
}

// Handle password reset
async function handlePasswordReset() {
    const email = document.getElementById('college-code').value.trim();

    if (!email) {
        // Show inline email input instead of prompt
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.placeholder = 'Enter your email address';
        emailInput.style.cssText = 'width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;';

        const form = document.getElementById('login-form');
        const existingInput = form.querySelector('#reset-email-input');
        if (existingInput) existingInput.remove();

        emailInput.id = 'reset-email-input';
        form.insertBefore(emailInput, form.firstChild);

        emailInput.focus();
        emailInput.addEventListener('blur', async () => {
            const emailValue = emailInput.value.trim();
            if (emailValue) {
                emailInput.remove();
                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
                        redirectTo: window.location.origin + '/login.html'
                    });

                    if (error) {
                        showNotification('Error: ' + error.message, 'error');
                    } else {
                        showNotification('Password reset email sent! Please check your inbox.', 'success');
                    }
                } catch (error) {
                    showNotification('Error sending reset email: ' + error.message, 'error');
                }
            } else {
                emailInput.remove();
            }
        });

        emailInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                emailInput.blur();
            }
        });
        return;
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/login.html'
        });

        if (error) {
            showNotification('Error: ' + error.message, 'error');
        } else {
            showNotification('Password reset email sent! Please check your inbox.', 'success');
        }
    } catch (error) {
        showNotification('Error sending reset email: ' + error.message, 'error');
    }
}

