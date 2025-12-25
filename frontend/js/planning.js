// Planning management module

// State
let currentPlanning = null;
let tasks = [];

// Load user's plannings
async function loadPlannings() {
    try {
        const data = await Utils.apiRequest('/plannings');
        return data.plannings;
    } catch (error) {
        console.error('Failed to load plannings:', error);
        Utils.showToast('Failed to load plannings', 'error');
        return [];
    }
}

// Create new planning
async function createPlanning(planningData) {
    try {
        const data = await Utils.apiRequest('/plannings', {
            method: 'POST',
            body: JSON.stringify(planningData)
        });
        Utils.showToast('Planning created successfully!', 'success');
        return data.planning;
    } catch (error) {
        console.error('Failed to create planning:', error);
        Utils.showToast('Failed to create planning', 'error');
        return null;
    }
}

// Load tasks for a date
async function loadTasksByDate(planningId, date) {
    try {
        const data = await Utils.apiRequest(`/tasks/planning/${planningId}/date/${date}`);
        tasks = data.tasks;
        return tasks;
    } catch (error) {
        console.error('Failed to load tasks:', error);
        Utils.showToast('Failed to load tasks', 'error');
        return [];
    }
}

// Create task
async function createTask(taskData) {
    try {
        const data = await Utils.apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
        Utils.showToast('Task created successfully!', 'success');
        return data.task;
    } catch (error) {
        console.error('Failed to create task:', error);
        Utils.showToast('Failed to create task', 'error');
        return null;
    }
}

// Toggle task completion
async function toggleTask(taskId) {
    try {
        const data = await Utils.apiRequest(`/tasks/${taskId}/toggle`, {
            method: 'POST'
        });
        Utils.showToast('Task updated!', 'success');
        return data.task;
    } catch (error) {
        console.error('Failed to toggle task:', error);
        Utils.showToast('Failed to update task', 'error');
        return null;
    }
}

// Delete task
async function deleteTask(taskId) {
    try {
        await Utils.apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
        Utils.showToast('Task deleted!', 'success');
        return true;
    } catch (error) {
        console.error('Failed to delete task:', error);
        Utils.showToast('Failed to delete task', 'error');
        return false;
    }
}

// Render tasks
function renderTasks(tasksArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tasksArray.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i data-lucide="inbox" size="48" class="mx-auto mb-4 opacity-50"></i>
                <p>No tasks for today. Create one to get started!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = tasksArray.map(task => `
        <div class="task-item flex items-center gap-3 p-4 rounded-xl border ${
            task.completed 
                ? 'bg-gray-50 border-gray-200 opacity-60' 
                : getCategoryClasses(task.category)
        } cursor-pointer" onclick="handleTaskClick(${task.id})">
            <div class="flex-shrink-0">
                ${task.completed 
                    ? '<i data-lucide="check-circle" class="text-emerald-600" size="20"></i>'
                    : `<i data-lucide="${task.icon || 'circle'}" size="20"></i>`
                }
            </div>
            <div class="flex-1">
                <p class="font-semibold text-sm ${task.completed ? 'line-through' : ''}">${task.title}</p>
                ${task.time ? `<p class="text-xs text-slate-500 mt-1">${task.time}</p>` : ''}
            </div>
            <button onclick="event.stopPropagation(); handleDeleteTask(${task.id})" 
                    class="text-slate-400 hover:text-red-500 transition">
                <i data-lucide="trash-2" size="16"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

// Get category classes
function getCategoryClasses(category) {
    const classes = {
        school: 'bg-red-100 border-red-200 text-red-800',
        business: 'bg-emerald-100 border-emerald-200 text-emerald-800',
        health: 'bg-blue-100 border-blue-200 text-blue-800',
        pause: 'bg-gray-100 border-gray-200 text-gray-600',
        perso: 'bg-purple-100 border-purple-200 text-purple-800'
    };
    return classes[category] || 'bg-slate-100 border-slate-200 text-slate-800';
}

// Handle task click (toggle)
async function handleTaskClick(taskId) {
    const updatedTask = await toggleTask(taskId);
    if (updatedTask && currentPlanning) {
        // Reload tasks
        const date = new Date().toISOString().split('T')[0];
        const updatedTasks = await loadTasksByDate(currentPlanning.id, date);
        renderTasks(updatedTasks, 'tasks-container');
        updateProgress(updatedTasks);
    }
}

// Handle delete task
async function handleDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const success = await deleteTask(taskId);
        if (success && currentPlanning) {
            // Reload tasks
            const date = new Date().toISOString().split('T')[0];
            const updatedTasks = await loadTasksByDate(currentPlanning.id, date);
            renderTasks(updatedTasks, 'tasks-container');
            updateProgress(updatedTasks);
        }
    }
}

// Update progress bar
function updateProgress(tasksArray) {
    const total = tasksArray.length;
    const completed = tasksArray.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
}

// Export
window.Planning = {
    loadPlannings,
    createPlanning,
    loadTasksByDate,
    createTask,
    toggleTask,
    deleteTask,
    renderTasks,
    updateProgress,
    currentPlanning,
    tasks
};
