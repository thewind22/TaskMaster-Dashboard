document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskPriority = document.getElementById('task-priority');
    const taskDueDate = document.getElementById('task-due-date');
    const taskList = document.getElementById('task-list');
    const sortByPriorityBtn = document.getElementById('sort-by-priority');
    const sortByDateBtn = document.getElementById('sort-by-date');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const kpiTotal = document.getElementById('kpi-total');
    const kpiCompleted = document.getElementById('kpi-completed');
    const kpiOverdue = document.getElementById('kpi-overdue');
    let priorityChart = null;
    let statusChart = null;
    
    const getTasks = () => JSON.parse(localStorage.getItem('tasks')) || [];
    const saveTasks = (tasks) => localStorage.setItem('tasks', JSON.stringify(tasks));

    const createSampleTasks = () => {
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const toISODate = (date) => date.toISOString().split('T')[0];
        const sampleTasks = [
            { id: Date.now() + '1', text: 'Fix display bug on Safari', priority: 'high', dueDate: toISODate(yesterday), completed: false },
            { id: Date.now() + '2', text: 'Write API documentation', priority: 'high', dueDate: toISODate(tomorrow), completed: false },
            { id: Date.now() + '3', text: 'Design the landing page', priority: 'medium', dueDate: toISODate(nextWeek), completed: false },
            { id: Date.now() + '4', text: 'Have coffee with the team', priority: 'low', dueDate: '', completed: true },
            { id: Date.now() + '5', text: 'Refactor and clean up code', priority: 'low', dueDate: '', completed: false },
        ];
        saveTasks(sampleTasks);
    };

    const fullRender = () => {
        const tasks = getTasks();
        renderTaskList(tasks);
        updateUIData(tasks);
    }

    const renderTaskList = (tasks) => {
        taskList.innerHTML = '';
        if (tasks.length === 0) {
             taskList.innerHTML = `<p class="text-center text-gray-500 py-4">No tasks yet. Add a new one!</p>`;
        }
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item flex items-center bg-gray-50 p-3 rounded-lg shadow-sm priority-${task.priority}`;
            li.dataset.id = task.id;
            const today = new Date(); today.setHours(0,0,0,0);
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                if (dueDate < today) li.classList.add('overdue');
            }
            if (task.completed) li.classList.add('completed');
            const dueDateString = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'None';
            li.innerHTML = `
                <button class="complete-btn text-gray-300 hover:text-green-500 p-2 mr-2 transition"><i class="fas fa-check-circle fa-lg"></i></button>
                <div class="flex-grow">
                    <p class="task-text text-gray-800 font-medium">${task.text}</p>
                    <div class="flex items-center text-xs text-gray-500 mt-1">
                        <span class="capitalize">${task.priority}</span><span class="mx-2">|</span><i class="fas fa-calendar-alt mr-1"></i><span>${dueDateString}</span>
                    </div>
                </div>
                <button class="delete-btn text-red-400 hover:text-red-600 p-2 ml-2 transition"><i class="fas fa-trash-alt fa-lg"></i></button>`;
            taskList.appendChild(li);
        });
    };

    const updateUIData = (tasks) => {
        const completedCount = tasks.filter(t => t.completed).length;
        const today = new Date(); today.setHours(0,0,0,0);
        const overdueCount = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length;
        kpiTotal.textContent = tasks.length;
        kpiCompleted.textContent = completedCount;
        kpiOverdue.textContent = overdueCount;
        
        const priorityCounts = { high: 0, medium: 0, low: 0 };
        tasks.forEach(t => priorityCounts[t.priority]++);
        const priorityData = {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{ label: 'Tasks', data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low], backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'], hoverOffset: 4 }]
        };
        if(priorityChart) priorityChart.destroy();
        priorityChart = new Chart(document.getElementById('priority-chart'), { type: 'doughnut', data: priorityData, options: { responsive: true, maintainAspectRatio: false } });

        const activeCount = tasks.length - completedCount - overdueCount;
        const statusData = {
            labels: ['Active', 'Completed', 'Overdue'],
            datasets: [{ label: 'Number of Tasks', data: [activeCount < 0 ? 0 : activeCount, completedCount, overdueCount], backgroundColor: ['#3b82f6', '#16a34a', '#ef4444'] }]
        }
        if(statusChart) statusChart.destroy();
        statusChart = new Chart(document.getElementById('status-chart'), { type: 'bar', data: statusData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    };

    taskForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;
        let tasks = getTasks();
        tasks.unshift({ id: Date.now().toString(), text, priority: taskPriority.value, dueDate: taskDueDate.value, completed: false });
        saveTasks(tasks);
        fullRender();
        taskForm.reset();
    });
    taskList.addEventListener('click', e => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        let tasks = getTasks();
        const taskId = taskItem.dataset.id;
        if (e.target.closest('.delete-btn')) {
            tasks = tasks.filter(t => t.id !== taskId);
        } else if (e.target.closest('.complete-btn')) {
            const task = tasks.find(t => t.id === taskId);
            if (task) task.completed = !task.completed;
        }
        saveTasks(tasks);
        fullRender();
    });
    clearCompletedBtn.addEventListener('click', () => {
        saveTasks(getTasks().filter(t => !t.completed));
        fullRender();
    });
    sortByPriorityBtn.addEventListener('click', () => {
        let tasks = getTasks();
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        saveTasks(tasks);
        fullRender();
    });
    sortByDateBtn.addEventListener('click', () => {
        let tasks = getTasks();
        tasks.sort((a, b) => {
            if (!a.dueDate) return 1; if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        saveTasks(tasks);
        fullRender();
    });

    const initApp = () => {
        if (getTasks().length === 0) {
            createSampleTasks();
        }
        fullRender();
    }

    initApp();
});
