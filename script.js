// Version tracking
const APP_VERSION = '1.0.0';// Import Firebase services (if in a module environment)

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    // Create and add the "Add New Habit" button
    const trackTab = document.getElementById('track-tab');
    if (trackTab) {
        const actionContainer = document.createElement('div');
        actionContainer.className = 'action-container';
        
        const addButton = document.createElement('button');
        addButton.className = 'action-button';
        addButton.textContent = '+ Add New Habit';
        addButton.onclick = showAddHabitModal;
        
        actionContainer.appendChild(addButton);
        trackTab.insertBefore(actionContainer, trackTab.firstChild);
        
        console.log('Add habit button created');
    } else {
        console.error('Track tab not found');
    }

    // Initialize calendar
    const currentDate = new Date();
    const currentMonthElement = document.getElementById('current-month');
    if (currentMonthElement) {
        currentMonthElement.dataset.currentDate = currentDate.toISOString();
        renderCalendar();
    }

    // Add event listeners for month navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        const currentDate = new Date(currentMonthElement.dataset.currentDate);
        currentDate.setMonth(currentDate.getMonth() - 1);
        currentMonthElement.dataset.currentDate = currentDate.toISOString();
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        const currentDate = new Date(currentMonthElement.dataset.currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentMonthElement.dataset.currentDate = currentDate.toISOString();
        renderCalendar();
    });

    // Add tab switching functionality
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab content
            document.querySelectorAll('.tab-content').forEach(content => 
                content.style.display = 'none');
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            
            // Update stats if stats tab is selected
            if (tabId === 'stats') {
                updateStats();
            }
        });
    });

    // Show initial date's habits
    showDateHabits(new Date());
});

function renderCalendar() {
    const currentMonthElement = document.getElementById('current-month');
    if (!currentMonthElement) return;

    const currentDate = new Date(currentMonthElement.dataset.currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthElement.textContent = new Date(year, month).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });

    const calendar = document.getElementById('calendar-days');
    if (!calendar) return;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    
    let calendarHTML = '';
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if any habits are scheduled for this date
        const hasCompletions = habits.some(habit => {
            if (!habit.createdAt) return false;
            
            const habitStartDate = new Date(habit.createdAt);
            habitStartDate.setHours(0, 0, 0, 0);
            
            // Calculate days since start
            const daysFromStart = Math.floor((date - habitStartDate) / (1000 * 60 * 60 * 24));
            
            // Check if within goal duration
            if (daysFromStart >= habit.goalDays) return false;
            if (date < habitStartDate) return false;

            const dayOfWeek = date.getDay();
            switch (habit.frequency) {
                case 'daily':
                    return true;
                case 'weekdays':
                    return dayOfWeek >= 1 && dayOfWeek <= 5;
                case 'weekends':
                    return dayOfWeek === 0 || dayOfWeek === 6;
                case 'weekly':
                    return dayOfWeek === habitStartDate.getDay();
                default:
                    return false;
            }
        });

        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasCompletions ? 'has-completion' : ''}"
                 onclick="handleDateClick(${year}, ${month}, ${day})">
                ${day}
            </div>
        `;
    }
    
    calendar.innerHTML = calendarHTML;
}

function handleDateClick(year, month, day) {
    const date = new Date(year, month, day);
    showDateHabits(date);
}

function showDateHabits(date) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habitsContainer = document.getElementById('selected-date-habits');
    const dateStr = date.toISOString().split('T')[0];
    
    if (!habitsContainer) return;

    // Update header
    const headerElement = document.getElementById('selected-date-header');
    if (headerElement) {
        headerElement.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Filter habits that should appear on this date
    const applicableHabits = habits.filter(habit => {
        if (!habit.createdAt) return false;
        
        const habitStartDate = new Date(habit.createdAt);
        habitStartDate.setHours(0, 0, 0, 0);
        
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);
        
        // Calculate days since start
        const daysFromStart = Math.floor((currentDate - habitStartDate) / (1000 * 60 * 60 * 24));
        
        // Check if within goal duration
        if (daysFromStart >= habit.goalDays) return false;
        if (currentDate < habitStartDate) return false;

        const dayOfWeek = date.getDay();
        switch (habit.frequency) {
            case 'daily':
                return true;
            case 'weekdays':
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'weekends':
                return dayOfWeek === 0 || dayOfWeek === 6;
            case 'weekly':
                return dayOfWeek === habitStartDate.getDay();
            default:
                return false;
        }
    });

    // Show "Free Day" message if no habits
    if (applicableHabits.length === 0) {
        habitsContainer.innerHTML = `
            <div class="free-day">
                <div class="free-day-content">
                    <span class="free-day-emoji">🌟</span>
                    <h3>Free Day!</h3>
                    <p>No habits scheduled for today</p>
                </div>
            </div>
        `;
        return;
    }

    // Show filtered habits
    habitsContainer.innerHTML = applicableHabits.map(habit => {
        const isCompleted = habit.completedDates && habit.completedDates.includes(dateStr);
        const startDate = new Date(habit.createdAt);
        startDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(dateStr);
        currentDate.setHours(0, 0, 0, 0);
        const daysFromStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="habit-item ${isCompleted ? 'completed' : ''}">
                <div class="habit-info">
                    <span class="habit-emoji">${habit.emoji || '📌'}</span>
                    <div class="habit-details">
                        <span class="habit-name">${habit.name}</span>
                        <span class="habit-progress">Day ${daysFromStart + 1} of ${habit.goalDays}</span>
                    </div>
                </div>
                <div class="habit-controls">
                    <button onclick="editHabit('${habit.name}')" class="edit-btn">✏️</button>
                    <button onclick="toggleHabitCompletion('${habit.name}', '${dateStr}')" class="toggle-btn">
                        ${isCompleted ? '✓' : '○'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleHabitCompletion(habitName, dateStr) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habit = habits.find(h => h.name === habitName);
    
    if (!habit) return;

    if (!habit.completedDates) {
        habit.completedDates = [];
    }

    const isCompleted = habit.completedDates.includes(dateStr);
    
    // Create confirmation message
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Show confirmation popup
    const popup = document.createElement('div');
    popup.className = 'completion-popup';
    popup.innerHTML = `
        <div class="completion-popup-content">
            <h3>${habit.emoji} ${habit.name}</h3>
            <p>${dateFormatted}</p>
            <div class="completion-buttons">
                <button class="completion-btn ${!isCompleted ? 'complete-btn' : ''}" 
                        onclick="confirmHabitToggle('${habitName}', '${dateStr}', true)">
                    ✓ Completed
                </button>
                <button class="completion-btn ${isCompleted ? 'incomplete-btn' : ''}" 
                        onclick="confirmHabitToggle('${habitName}', '${dateStr}', false)">
                    ✕ Not Completed
                </button>
            </div>
            <button class="close-popup">Cancel</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Check if this completion marks the achievement of the habit goal
    const completedDays = habit.completedDates.length;
    if (completedDays === habit.goalDays - 1 && !isCompleted) {
        // Will show congratulations after confirming completion
        popup.querySelector('.complete-btn').addEventListener('click', () => {
            setTimeout(() => showCongratulationsModal(habit), 500);
        });
    }

    // Close button functionality
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.onclick = () => {
        document.body.removeChild(popup);
    };

    // Close popup when clicking outside
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

function confirmHabitToggle(habitName, dateStr, setCompleted) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habit = habits.find(h => h.name === habitName);
    
    if (!habit) return;

    if (!habit.completedDates) {
        habit.completedDates = [];
    }

    const dateIndex = habit.completedDates.indexOf(dateStr);
    
    if (setCompleted && dateIndex === -1) {
        // Add date to completedDates
        habit.completedDates.push(dateStr);
        habit.completedDates.sort(); // Keep dates in order
    } else if (!setCompleted && dateIndex !== -1) {
        // Remove date from completedDates
        habit.completedDates.splice(dateIndex, 1);
    }

    // Save updated habits
    localStorage.setItem('habits', JSON.stringify(habits));
    
    // Remove popup
    const popup = document.querySelector('.completion-popup');
    if (popup) {
        document.body.removeChild(popup);
    }

    // Update UI
    renderCalendar();
    showDateHabits(new Date(dateStr));
}

function editHabit(habitName) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habit = habits.find(h => h.name === habitName);
    
    if (!habit) return;

    // Calculate progress with proper date handling and null checks
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const startDate = new Date(habit.createdAt);
    startDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const daysFromStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const completedDays = habit.completedDates ? habit.completedDates.length : 0;
    const goalDays = parseInt(habit.goalDays) || 0; // Ensure goalDays is a number
    
    // Calculate progress percentage and days left
    const progressPercentage = goalDays > 0 ? Math.min(Math.round((completedDays / goalDays) * 100), 100) : 0;
    const daysLeft = Math.max(goalDays - completedDays, 0);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';

    // Define emoji categories
    const emojiCategories = {
        'Health & Fitness': ['🏃‍♂️', '💪', '🧘‍♀️', '🚴‍♂️', '🏋️‍♀️', '🧗‍♂️', '🤸‍♀️', '🎯', '⛹️‍♂️', '🏊‍♂️'],
        'Mindfulness & Wellness': ['🧠', '🧘‍♂️', '📖', '🎨', '🎵', '🌱', '🌿', '🍵', '😌', '💭'],
        'Productivity': ['💻', '📚', '✍️', '📝', '⏰', '📅', '✅', '📈', '💡', '🎯'],
        'Lifestyle': ['😴', '🥗', '🥤', '🚰', '🌅', '🌙', '🏠', '💰', '📱', '🌿'],
        'Self-Care': ['💆‍♀️', '🛁', '💇‍♂️', '🧴', '💊', '🌺', '🎭', '💝', '🌸', '✨']
    };

    modal.innerHTML = `
        <div class="modal-content edit-habit-modal">
            <span class="close-modal">&times;</span>
            <h2>Edit Habit</h2>
            
            <!-- Progress Summary -->
            <div class="habit-progress-summary">
                <div class="progress-circle" style="--progress: ${progressPercentage}%">
                    <div class="progress-circle-inner">
                        <span class="progress-percentage">${progressPercentage}%</span>
                        <span class="progress-label">Complete</span>
                    </div>
                </div>
                <div class="progress-stats">
                    <div class="stat-item">
                        <span class="stat-value">${completedDays}</span>
                        <span class="stat-label">Days Completed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${daysLeft}</span>
                        <span class="stat-label">Days Left</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${daysFromStart + 1}</span>
                        <span class="stat-label">Days Since Start</span>
                    </div>
                </div>
            </div>

            <form id="edit-habit-form">
                <div class="form-group">
                    <label for="habit-name">Habit Name</label>
                    <input type="text" id="habit-name" value="${habit.name}" required>
                </div>
                
                <div class="form-group">
                    <label>Choose Icon</label>
                    <div class="emoji-picker">
                        ${Object.entries(emojiCategories).map(([category, emojis]) => `
                            <div class="emoji-category">
                                <h4>${category}</h4>
                                <div class="emoji-grid">
                                    ${emojis.map(emoji => `
                                        <button type="button" class="emoji-btn ${emoji === habit.emoji ? 'selected' : ''}" 
                                                data-emoji="${emoji}">
                                            ${emoji}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="habit-emoji" value="${habit.emoji}">
                </div>

                <div class="form-group">
                    <label for="habit-frequency">Frequency</label>
                    <select id="habit-frequency">
                        <option value="daily" ${habit.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="weekdays" ${habit.frequency === 'weekdays' ? 'selected' : ''}>Weekdays</option>
                        <option value="weekends" ${habit.frequency === 'weekends' ? 'selected' : ''}>Weekends</option>
                        <option value="weekly" ${habit.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="habit-goal">Goal Duration (days)</label>
                    <input type="number" id="habit-goal" value="${habit.goalDays}" min="${daysFromStart + 1}" required>
                    <small class="goal-info">Goal can't be shorter than days elapsed</small>
                </div>

                <div class="form-actions">
                    <button type="submit" class="submit-btn">Save Changes</button>
                    <button type="button" class="delete-btn" onclick="confirmDeleteHabit('${habit.name}')">Delete Habit</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add emoji selection functionality
    const emojiButtons = modal.querySelectorAll('.emoji-btn');
    const emojiInput = modal.querySelector('#habit-emoji');
    
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            emojiInput.value = btn.dataset.emoji;
        });
    });

    // Close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };

    // Form submission
    const form = modal.querySelector('#edit-habit-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const newName = document.getElementById('habit-name').value;
        const newEmoji = document.getElementById('habit-emoji').value;
        const newFrequency = document.getElementById('habit-frequency').value;
        const newGoalDays = parseInt(document.getElementById('habit-goal').value);

        updateHabit(habit.name, newName, newEmoji, newFrequency, newGoalDays);
        document.body.removeChild(modal);
    };
}

function updateStats() {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate overall statistics
    const totalHabits = habits.length;
    const activeHabits = habits.filter(habit => {
        const startDate = new Date(habit.createdAt);
        const daysFromStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        return daysFromStart < habit.goalDays;
    }).length;

    const completedToday = habits.filter(habit => 
        habit.completedDates && 
        habit.completedDates.includes(today.toISOString().split('T')[0])
    ).length;

    // Calculate overall success rate
    const totalCompletions = habits.reduce((sum, habit) => 
        sum + (habit.completedDates ? habit.completedDates.length : 0), 0);
    const totalPossibleDays = habits.reduce((sum, habit) => {
        const startDate = new Date(habit.createdAt);
        const daysFromStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        return sum + Math.min(daysFromStart, habit.goalDays);
    }, 0);
    const overallSuccess = totalPossibleDays > 0 
        ? Math.round((totalCompletions / totalPossibleDays) * 100) 
        : 0;

    // Update overview cards
    document.getElementById('total-habits').innerHTML = `
        <h3>Total Habits</h3>
        <div class="stat-value">${totalHabits}</div>
    `;

    document.getElementById('active-habits').innerHTML = `
        <h3>Active Habits</h3>
        <div class="stat-value">${activeHabits}</div>
    `;

    document.getElementById('completed-today').innerHTML = `
        <h3>Completed Today</h3>
        <div class="stat-value">${completedToday}</div>
    `;

    document.getElementById('overall-success').innerHTML = `
        <h3>Overall Success Rate</h3>
        <div class="stat-value">${overallSuccess}%</div>
    `;

    // Generate individual habit statistics
    const habitsList = document.getElementById('habits-stats-list');
    habitsList.innerHTML = habits.map(habit => {
        const startDate = new Date(habit.createdAt);
        const daysFromStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const completedDays = habit.completedDates ? habit.completedDates.length : 0;
        const successRate = Math.round((completedDays / Math.min(daysFromStart, habit.goalDays)) * 100) || 0;
        const isActive = daysFromStart <= habit.goalDays;

        return `
            <div class="habit-stat-card ${isActive ? 'active' : 'completed'}">
                <div class="habit-stat-header">
                    <span class="habit-emoji">${habit.emoji}</span>
                    <h3>${habit.name}</h3>
                    <span class="habit-status ${isActive ? 'active-status' : 'completed-status'}">
                        ${isActive ? 'Active' : 'Completed'}
                    </span>
                </div>
                <div class="habit-stat-grid">
                    <div class="stat-box">
                        <div class="stat-value">${completedDays}</div>
                        <div class="stat-label">Days Completed</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${Math.max(habit.goalDays - completedDays, 0)}</div>
                        <div class="stat-label">Days Left</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${successRate}%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${habit.frequency}</div>
                        <div class="stat-label">Frequency</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${successRate}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function confirmDeleteHabit(habitName) {
    if (confirm(`Are you sure you want to delete "${habitName}"?\nThis action cannot be undone.`)) {
        deleteHabit(habitName);
    }
}

function deleteHabit(habitName) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const updatedHabits = habits.filter(h => h.name !== habitName);
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    renderCalendar();
    showDateHabits(new Date());
}

function updateHabit(oldName, newName, newEmoji, newFrequency, newGoalDays) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habitIndex = habits.findIndex(h => h.name === oldName);
    
    if (habitIndex === -1) return;

    // Update habit properties
    habits[habitIndex] = {
        ...habits[habitIndex],
        name: newName,
        emoji: newEmoji,
        frequency: newFrequency,
        goalDays: newGoalDays
    };

    localStorage.setItem('habits', JSON.stringify(habits));
    renderCalendar();
    showDateHabits(new Date());
}

window.showAddHabitModal = function() {
    console.log('Opening add habit modal');
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';  // Make sure modal is visible

    // Define emoji categories
    const emojiCategories = {
        'Health & Fitness': ['🏃‍♂️', '💪', '🧘‍♀️', '🚴‍♂️', '🏋️‍♀️', '🧗‍♂️', '🤸‍♀️', '🎯', '⛹️‍♂️', '🏊‍♂️'],
        'Mindfulness & Wellness': ['🧠', '🧘‍♂️', '📖', '🎨', '🎵', '🌱', '🌿', '🍵', '😌', '💭'],
        'Productivity': ['💻', '📚', '✍️', '📝', '⏰', '📅', '✅', '📈', '💡', '🎯'],
        'Lifestyle': ['😴', '🥗', '🥤', '🚰', '🌅', '🌙', '🏠', '💰', '📱', '🌿'],
        'Self-Care': ['💆‍♀️', '🛁', '💇‍♂️', '🧴', '💊', '🌺', '🎭', '💝', '🌸', '✨']
    };

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Add New Habit</h2>
            <form id="add-habit-form">
                <div class="form-group">
                    <label for="habit-name">Habit Name</label>
                    <input type="text" id="habit-name" required placeholder="Enter habit name">
                </div>
                
                <div class="form-group">
                    <label>Choose Icon</label>
                    <div class="emoji-picker">
                        ${Object.entries(emojiCategories).map(([category, emojis]) => `
                            <div class="emoji-category">
                                <h4>${category}</h4>
                                <div class="emoji-grid">
                                    ${emojis.map(emoji => `
                                        <button type="button" class="emoji-btn" data-emoji="${emoji}">
                                            ${emoji}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="habit-emoji" value="📝">
                </div>

                <div class="form-group">
                    <label for="habit-frequency">Frequency</label>
                    <select id="habit-frequency">
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekends">Weekends</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="habit-goal">Goal Duration</label>
                    <div class="goal-setting">
                        <button type="button" class="goal-preset" data-days="21">21 days</button>
                        <button type="button" class="goal-preset" data-days="30">30 days</button>
                        <button type="button" class="goal-preset" data-days="66">66 days</button>
                        <button type="button" class="goal-preset" data-days="90">90 days</button>
                        <button type="button" class="goal-preset custom-preset" data-days="custom">Custom</button>
                    </div>
                    <div class="custom-goal-input" style="display: none;">
                        <input type="number" 
                               id="habit-goal" 
                               min="1" 
                               placeholder="Enter number of days"
                               class="goal-input">
                        <small class="custom-goal-hint">Enter a number between 1-365 days</small>
                    </div>
                    <small class="goal-info">Research suggests it takes 21-66 days to form a new habit</small>
                </div>
                
                <button type="submit" class="submit-btn">Add Habit</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Add emoji selection functionality
    const emojiButtons = modal.querySelectorAll('.emoji-btn');
    const emojiInput = modal.querySelector('#habit-emoji');
    
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            emojiInput.value = btn.dataset.emoji;
        });
    });

    // Enhanced goal preset functionality
    const goalPresets = modal.querySelectorAll('.goal-preset');
    const goalInput = modal.querySelector('#habit-goal');
    const customGoalInput = modal.querySelector('.custom-goal-input');
    
    goalPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            goalPresets.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            if (btn.dataset.days === 'custom') {
                customGoalInput.style.display = 'block';
                goalInput.value = '';
                goalInput.focus();
            } else {
                customGoalInput.style.display = 'none';
                goalInput.value = btn.dataset.days;
            }
        });
    });

    // Add validation for custom goal input
    goalInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 1) {
            e.target.value = 1;
        } else if (value > 365) {
            e.target.value = 365;
        }
    });

    // Close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };

    // Form submission
    const form = modal.querySelector('#add-habit-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const name = document.getElementById('habit-name').value;
        const emoji = document.getElementById('habit-emoji').value;
        const frequency = document.getElementById('habit-frequency').value;
        const goalDays = parseInt(document.getElementById('habit-goal').value);

        // Validate the goal days
        if (isNaN(goalDays) || goalDays < 1 || goalDays > 365) {
            alert('Please enter a valid number of days between 1 and 365');
            return;
        }

        addHabit(name, emoji, frequency, goalDays);
        document.body.removeChild(modal);
    };
};

function addHabit(name, emoji, frequency, goalDays) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    
    if (habits.some(h => h.name === name)) {
        alert('A habit with this name already exists!');
        return;
    }

    // Set createdAt to the start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newHabit = {
        name,
        emoji,
        frequency,
        goalDays,
        createdAt: today.toISOString(),
        completedDates: []
    };

    habits.push(newHabit);
    localStorage.setItem('habits', JSON.stringify(habits));
    
    renderCalendar();
    showDateHabits(today);
}

function showCongratulationsModal(habit) {
    const modal = document.createElement('div');
    modal.className = 'modal congratulations-modal';
    modal.style.display = 'block';

    modal.innerHTML = `
        <div class="modal-content congratulations-content">
            <div class="congratulations-header">
                <span class="congratulations-emoji">🎉</span>
                <h2>Congratulations!</h2>
                <span class="congratulations-emoji">🎉</span>
            </div>
            
            <div class="achievement-details">
                <p class="achievement-text">
                    You've completed your habit:
                </p>
                <div class="completed-habit">
                    <span class="habit-emoji">${habit.emoji}</span>
                    <span class="habit-name">${habit.name}</span>
                </div>
                <p class="achievement-stats">
                    <span class="stat-highlight">${habit.goalDays} days</span> of dedication!
                </p>
            </div>

            <div class="achievement-message">
                <p>"Success is not final, failure is not fatal: it is the courage to continue that counts."</p>
                <small>- Winston Churchill</small>
            </div>

            <button class="close-congratulations">Continue Your Journey</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add confetti effect
    const confettiColors = ['#FDE68A', '#93C5FD', '#C084FC', '#34D399', '#F472B6'];
    const confettiCount = 200;
    
    for (let i = 0; i < confettiCount; i++) {
        createConfetti(confettiColors[Math.floor(Math.random() * confettiColors.length)]);
    }

    // Close button functionality
    const closeBtn = modal.querySelector('.close-congratulations');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
        // Clean up any remaining confetti
        const confetti = document.querySelectorAll('.confetti');
        confetti.forEach(c => c.remove());
    };
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.backgroundColor = color;
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
    confetti.style.opacity = Math.random();
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
        confetti.remove();
    }, 5000);
}

// Authentication functions
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // If remember me is checked, store the email
    if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }
    
    // Existing login logic
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    
    showApp();
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Here you would typically make an API call to your backend
    // For now, we'll just simulate a successful registration
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    
    showApp();
}

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-header').style.display = 'flex';
    
    // Update user name in header
    const userName = localStorage.getItem('userName') || 'User';
    document.getElementById('user-name').textContent = userName;
}

function handleLogout() {
    // Clear all stored data
    localStorage.clear();
    
    // Hide app and show login
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('user-header').style.display = 'none';
    
    // Reset forms
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    
    // Show login form
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

// Check login status when page loads
window.addEventListener('load', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showApp();
    } else {
        // Check for remembered email
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            document.getElementById('login-email').value = rememberedEmail;
            document.getElementById('remember-me').checked = true;
        }
    }
});

function togglePasswordRecovery() {
    const loginForm = document.getElementById('login-form');
    const recoveryForm = document.getElementById('password-recovery-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm.style.display !== 'none') {
        loginForm.style.display = 'none';
        recoveryForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'block';
        recoveryForm.style.display = 'none';
        registerForm.style.display = 'none';
    }
}

function handlePasswordRecovery(event) {
    event.preventDefault();
    const email = document.getElementById('recovery-email').value;
    
    // Here you would typically make an API call to your backend
    // For demo purposes, we'll just show a success message
    
    // Create success message if it doesn't exist
    let successMessage = document.querySelector('.success-message');
    if (!successMessage) {
        successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        const recoveryForm = document.getElementById('password-recovery-form');
        recoveryForm.insertBefore(successMessage, recoveryForm.firstChild);
    }
    
    // Show success message
    successMessage.style.display = 'block';
    successMessage.textContent = `Password reset link has been sent to ${email}`;
    
    // Clear the form
    document.getElementById('recovery-email').value = '';
    
    // Hide success message after 5 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
        togglePasswordRecovery(); // Return to login form
    }, 5000);
}
