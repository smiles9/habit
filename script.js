document.getElementById('habit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const habitInput = document.getElementById('habit-input');
    const habitList = document.getElementById('habit-list');
    const habitName = habitInput.value.trim();

    if (habitName) {
        const li = document.createElement('li');
        li.textContent = habitName;
        habitList.appendChild(li);
        habitInput.value = '';
    }
});
