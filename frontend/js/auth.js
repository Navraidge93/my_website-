// Authentication module

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.classList.add('hidden');
    const originalText = submitBtn.innerHTML;
    Utils.showLoading(submitBtn);

    try {
        const data = await Utils.apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        Utils.setAuthToken(data.token);
        Utils.setUser(data.user);
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
        Utils.hideLoading(submitBtn, originalText);
    }
});

// Register
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.classList.add('hidden');
    const originalText = submitBtn.innerHTML;
    Utils.showLoading(submitBtn);

    try {
        const data = await Utils.apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        Utils.setAuthToken(data.token);
        Utils.setUser(data.user);
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
        Utils.hideLoading(submitBtn, originalText);
    }
});

// Logout
const logout = () => {
    Utils.clearAuth();
    window.location.href = 'index.html';
};

// Check authentication
const requireAuth = () => {
    if (!Utils.getAuthToken()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
};

// Initialize user in header
const initUser = async () => {
    try {
        const data = await Utils.apiRequest('/auth/me');
        Utils.setUser(data.user);
        
        // Update header if exists
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar && data.user.avatar) {
            userAvatar.src = data.user.avatar;
        }
        if (userName) {
            userName.textContent = data.user.username;
        }
    } catch (error) {
        console.error('Failed to load user:', error);
        Utils.clearAuth();
        window.location.href = 'index.html';
    }
};

// Export
window.Auth = {
    logout,
    requireAuth,
    initUser
};
