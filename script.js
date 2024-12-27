const habitForm = document.getElementById('habit-form');
const habitInput = document.getElementById('habit-input');
const goalDaysInput = document.getElementById('goal-days');
const calendarContainer = document.getElementById('calendar-container');
const streakDisplay = document.getElementById('streak');
const progressDisplay = document.getElementById('progress');
const encouragementDisplay = document.getElementById('encouragement');

let goalDays = 0;
let streak = 0;
let progress = 0;
let habitName = '';
let startDate = new Date();
const habits = {};

// Generate a full calendar for the habit duration
function generateCalendar() {
    const calendar = document.createElement('div');
    calendar.classList.add('calendar');
    console.log("Calendar HTML:", calendarContainer.innerHTML);


    if (!goalDays || goalDays <= 0) {
        console.error("Invalid goalDays:", goalDays);
        return; // Stop if no valid goalDays
    }

    for (let i = 0; i < goalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const day = document.createElement('div');
        day.classList.add('day');
        day.dataset.date = currentDate.toISOString().split('T')[0];
        day.textContent = currentDate.getDate();

        day.addEventListener('click', () => toggleDayCompletion(day));

        calendar.appendChild(day);
    }

    calendarContainer.innerHTML = ''; // Clear previous calendar
    calendarContainer.appendChild(calendar);
    console.log("Calendar rendered successfully!");
}

// Toggle completion status for a day
function toggleDayCompletion(dayElement) {
    const date = dayElement.dataset.date;

    if (!habits[date]) {
        habits[date] = true;
        dayElement.classList.add('completed');
        progress++;
        streak++;
    } else {
        habits[date] = false;
        dayElement.classList.remove('completed');
        progress--;
        streak = Math.max(0, streak - 1);
    }

    updateStats();
}

// Update stats and encouragement messages
function updateStats() {
    streakDisplay.textContent = `Streak: ${streak}`;
    progressDisplay.textContent = `Progress: ${progress}/${goalDays}`;

    if (progress === goalDays) {
        encouragementDisplay.textContent = '🎉 Fantastic! You completed your goal! Keep it up!';
    } else if (streak > 5) {
        encouragementDisplay.textContent = '🔥 Amazing streak! You\'re doing great!';
    } else if (streak === 0) {
        encouragementDisplay.textContent = '🌟 Let\'s get started! You can do it!';
    } else {
        encouragementDisplay.textContent = '';
    }
}

// Add a new habit and initialize the calendar
habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    habitName = habitInput.value.trim();
    goalDays = parseInt(goalDaysInput.value, 10);

    if (habitName && goalDays > 0) {
        startDate = new Date(); // Set start date to today
        progress = 0;
        streak = 0;
        Object.keys(habits).forEach((key) => delete habits[key]); // Reset habit tracking

        updateStats();
        generateCalendar();
        habitInput.value = '';
        goalDaysInput.value = '';
    }
});

console.log("Calendar container:", calendarContainer);
console.log("Goal Days:", goalDays);

