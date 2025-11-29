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
});

// function handleLogin(event) {
//     event.preventDefault();
//     const collegeCode = document.getElementById('college-code').value;
//     console.log('Login attempt with code:', collegeCode);
//     alert('Login successful! Welcome to College Portal.');
//     // Add your actual login logic here
// }