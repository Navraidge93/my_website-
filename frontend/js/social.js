// Social features module

// Follow/Unfollow user
async function followUser(userId) {
    try {
        const data = await Utils.apiRequest(`/users/${userId}/follow`, {
            method: 'POST'
        });
        
        Utils.showToast(data.message, 'success');
        return data.following;
    } catch (error) {
        console.error('Failed to follow/unfollow user:', error);
        Utils.showToast('Failed to follow/unfollow user', 'error');
        return null;
    }
}

// Like/Unlike planning
async function likePlanning(planningId) {
    try {
        const data = await Utils.apiRequest(`/plannings/${planningId}/like`, {
            method: 'POST'
        });
        
        return data.liked;
    } catch (error) {
        console.error('Failed to like/unlike planning:', error);
        Utils.showToast('Failed to like planning', 'error');
        return null;
    }
}

// Add comment to planning
async function addComment(planningId, content) {
    try {
        const data = await Utils.apiRequest(`/plannings/${planningId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        Utils.showToast('Comment added successfully!', 'success');
        return data.comment;
    } catch (error) {
        console.error('Failed to add comment:', error);
        Utils.showToast('Failed to add comment', 'error');
        return null;
    }
}

// Get user followers
async function getFollowers(userId) {
    try {
        const data = await Utils.apiRequest(`/users/${userId}/followers`);
        return data.followers;
    } catch (error) {
        console.error('Failed to fetch followers:', error);
        return [];
    }
}

// Get user following
async function getFollowing(userId) {
    try {
        const data = await Utils.apiRequest(`/users/${userId}/following`);
        return data.following;
    } catch (error) {
        console.error('Failed to fetch following:', error);
        return [];
    }
}

// Search users
async function searchUsers(query) {
    try {
        const data = await Utils.apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
        return data.users;
    } catch (error) {
        console.error('Failed to search users:', error);
        Utils.showToast('Failed to search users', 'error');
        return [];
    }
}

// Get notifications
async function getNotifications() {
    try {
        const data = await Utils.apiRequest('/users/me/notifications');
        return data.notifications;
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
    }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        await Utils.apiRequest(`/users/me/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        return true;
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
    }
}

// Render notifications
function renderNotifications(notifications, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-sm text-center py-4">No notifications</p>';
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition ${notification.read ? 'opacity-60' : ''}" 
             onclick="handleNotificationClick(${notification.id})">
            <i data-lucide="${getNotificationIcon(notification.type)}" size="18" class="text-blue-500 mt-1"></i>
            <div class="flex-1">
                <h4 class="font-semibold text-sm text-slate-900">${notification.title}</h4>
                <p class="text-xs text-slate-600">${notification.message}</p>
                <p class="text-xs text-slate-400 mt-1">${Utils.formatTime(notification.created_at)}</p>
            </div>
            ${!notification.read ? '<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>' : ''}
        </div>
    `).join('');

    lucide.createIcons();
}

function getNotificationIcon(type) {
    const icons = {
        'like': 'heart',
        'comment': 'message-circle',
        'follow': 'user-plus',
        'achievement': 'award',
        'reminder': 'bell'
    };
    return icons[type] || 'bell';
}

async function handleNotificationClick(notificationId) {
    await markNotificationRead(notificationId);
    // Optionally navigate to related content
}

// Export
window.Social = {
    followUser,
    likePlanning,
    addComment,
    getFollowers,
    getFollowing,
    searchUsers,
    getNotifications,
    markNotificationRead,
    renderNotifications
};
