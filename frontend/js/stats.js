// Statistics module

// Get dashboard statistics
async function getDashboardStats(period = 30) {
    try {
        const data = await Utils.apiRequest(`/stats/dashboard?period=${period}`);
        return data;
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return null;
    }
}

// Get category breakdown
async function getCategoryStats(period = 30) {
    try {
        const data = await Utils.apiRequest(`/stats/by-category?period=${period}`);
        return data.categories;
    } catch (error) {
        console.error('Failed to fetch category stats:', error);
        return [];
    }
}

// Get heatmap data
async function getHeatmapData(year = new Date().getFullYear()) {
    try {
        const data = await Utils.apiRequest(`/stats/heatmap?year=${year}`);
        return data.heatmap;
    } catch (error) {
        console.error('Failed to fetch heatmap data:', error);
        return [];
    }
}

// Get hourly productivity
async function getHourlyStats(period = 30) {
    try {
        const data = await Utils.apiRequest(`/stats/by-hour?period=${period}`);
        return data.hours;
    } catch (error) {
        console.error('Failed to fetch hourly stats:', error);
        return [];
    }
}

// Get weekly report
async function getWeeklyReport() {
    try {
        const data = await Utils.apiRequest('/stats/weekly-report');
        return data;
    } catch (error) {
        console.error('Failed to fetch weekly report:', error);
        return null;
    }
}

// Get leaderboard
async function getLeaderboard(limit = 50) {
    try {
        const data = await Utils.apiRequest(`/stats/leaderboard?limit=${limit}`);
        return data.leaderboard;
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        return [];
    }
}

// Calculate streak from stats
function calculateStreak(stats) {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    for (let stat of stats) {
        const statDate = new Date(stat.date).toISOString().split('T')[0];
        const expectedDate = checkDate.toISOString().split('T')[0];

        if (statDate === expectedDate && parseFloat(stat.completion_rate) >= 70) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// Format stats for display
function formatStatsForDisplay(stats) {
    return {
        totalTasks: stats.total_tasks || 0,
        completedTasks: stats.completed_tasks || 0,
        completionRate: parseFloat(stats.completion_rate || 0).toFixed(1),
        streak: stats.streak || 0
    };
}

// Create heatmap visualization (simple version)
function renderHeatmap(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxRate = Math.max(...data.map(d => parseFloat(d.completion_rate)));
    
    container.innerHTML = data.map(day => {
        const rate = parseFloat(day.completion_rate);
        const intensity = rate / maxRate;
        const color = intensity > 0.7 ? '#10b981' : intensity > 0.4 ? '#f59e0b' : '#ef4444';
        
        return `
            <div class="heatmap-day" 
                 style="background-color: ${color}; opacity: ${0.3 + (intensity * 0.7)}"
                 title="${new Date(day.date).toLocaleDateString()}: ${rate.toFixed(0)}%">
            </div>
        `;
    }).join('');
}

// Generate productivity insights
function generateInsights(stats, categories) {
    const insights = [];

    // Completion rate insight
    const avgCompletionRate = stats.reduce((sum, s) => sum + parseFloat(s.completion_rate || 0), 0) / stats.length;
    if (avgCompletionRate >= 80) {
        insights.push({
            type: 'success',
            message: 'Excellent! You\'re maintaining a high completion rate.'
        });
    } else if (avgCompletionRate < 50) {
        insights.push({
            type: 'warning',
            message: 'Your completion rate could use improvement. Try breaking down tasks into smaller chunks.'
        });
    }

    // Category balance insight
    if (categories.length > 0) {
        const totalTasks = categories.reduce((sum, c) => sum + parseInt(c.total), 0);
        const mostUsedCategory = categories.reduce((max, c) => 
            parseInt(c.total) > parseInt(max.total) ? c : max
        );
        
        if (parseInt(mostUsedCategory.total) / totalTasks > 0.6) {
            insights.push({
                type: 'info',
                message: `You're heavily focused on ${mostUsedCategory.category}. Consider diversifying your tasks.`
            });
        }
    }

    // Streak insight
    const currentStreak = stats[stats.length - 1]?.streak || 0;
    if (currentStreak >= 7) {
        insights.push({
            type: 'success',
            message: `Amazing ${currentStreak}-day streak! Keep it up!`
        });
    }

    return insights;
}

// Export progress data for reports
function exportProgressData(stats) {
    const csvContent = [
        ['Date', 'Total Tasks', 'Completed Tasks', 'Completion Rate', 'Streak'].join(','),
        ...stats.map(s => [
            s.date,
            s.total_tasks,
            s.completed_tasks,
            s.completion_rate,
            s.streak
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Export
window.Stats = {
    getDashboardStats,
    getCategoryStats,
    getHeatmapData,
    getHourlyStats,
    getWeeklyReport,
    getLeaderboard,
    calculateStreak,
    formatStatsForDisplay,
    renderHeatmap,
    generateInsights,
    exportProgressData
};
