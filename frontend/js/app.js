// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Utility functions
const getAuthToken = () => localStorage.getItem('auth_token');

const setAuthToken = (token) => {
    localStorage.setItem('auth_token', token);
};

const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
};

const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

const setUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Toast notification
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" size="20"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Loading state
const showLoading = (element) => {
    element.disabled = true;
    element.innerHTML = '<div class="spinner mx-auto"></div>';
};

const hideLoading = (element, originalText) => {
    element.disabled = false;
    element.innerHTML = originalText;
};

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Export utility object
window.Utils = {
    getAuthToken,
    setAuthToken,
    clearAuth,
    getUser,
    setUser,
    apiRequest,
    showToast,
    showLoading,
    hideLoading,
    formatDate,
    formatTime
};
