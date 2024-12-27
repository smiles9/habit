const habitForm = document.getElementById('habit-form');
const habitInput = document.getElementById('habit-input');
const goalDaysInput = document.getElementById('goal-days');
const habitCalendar = document.getElementById('habit-calendar');
const streakDisplay = document.getElementById('streak');
const progressDisplay = document.getElementById('progress');

let goalDays = 0;
let streak = 0;
let progress = 0;
let habitDays = [];

// Generate a calendar
function generateCalendar() {
    habitCalendar.innerHTML = '';
    for (let i = 1; i <= 30; i++) { // Example: 30 days for simplicity
        const day = document.createElement('div');
        day.classList.add('day');
        day.textContent = i;
        day.dataset.day = i;
        day.addEventListener('click', toggleDay);
        habitCalendar.appendChild(day);
    }
}

// Add habit and goal
habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const habitName = habitInput.value.trim();
    goalDays = parseInt(goalDaysInput.value, 10);

    if (habitName && goalDays > 0) {
        streak = 0;
        progress = 0;
        habitDays = new Array(30).fill(false); // Reset progress
        updateStats();
        generateCalendar();
        habitInput.value = '';
        goalDaysInput.value = '';
    }
});

// Toggle day completion
function toggleDay(event) {
    const day = event.target;
    const dayIndex = parseInt(day.dataset.day, 10) - 1;

    if (!habitDays[dayIndex]) {
        habitDays[dayIndex] = true;
        day.classList.add('completed');
        progress++;
        streak++;
    } else {
        habitDays[dayIndex] = false;
        day.classList.remove('completed');
        progress--;
        streak = Math.max(0, streak - 1);
    }
    updateStats();
}

// Update streak and progress stats
function updateStats() {
    streakDisplay.textContent = `Streak: ${streak}`;
    progressDisplay.textContent = `Progress: ${progress}/${goalDays}`;

    if (progress >= goalDays) {
        alert('Congratulations! You achieved your habit goal!');
    }
}

// Initial calendar generation
generateCalendar();
