const socket = io();
let currentUser = localStorage.getItem('username') || null;
let userColors = {};

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('loginContainer');
    const choreContainer = document.getElementById('choreContainer');
    const loginForm = document.getElementById('loginForm');
    const choreForm = document.getElementById('choreForm');
    const logoutButton = document.getElementById('logoutButton');

    if (!loginContainer || !choreContainer || !loginForm || !choreForm || !logoutButton) {
        console.error('One or more elements not found in the DOM.');
        return;
    }

    if (currentUser) {
        loginContainer.classList.add('hidden');
        choreContainer.classList.remove('hidden');
        initializeChoreApp();
    } else {
        loginContainer.classList.remove('hidden');
        choreContainer.classList.add('hidden');
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser = document.getElementById('usernameInput').value;
        if (currentUser) {
            localStorage.setItem('username', currentUser);
            loginContainer.classList.add('hidden');
            choreContainer.classList.remove('hidden');
            initializeChoreApp();
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('username');
        currentUser = null;
        loginContainer.classList.remove('hidden');
        choreContainer.classList.add('hidden');
    });

    function initializeChoreApp() {
        choreForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const choreInput = document.getElementById('choreInput');
            const choreFrequency = document.getElementById('choreFrequency').value;
            const chore = choreInput.value;
            if (chore) {
                socket.emit('new chore', { text: chore, user: currentUser, frequency: choreFrequency });
                choreInput.value = '';
            }
        });

        socket.on('initial chores', (chores) => {
            document.getElementById('weeklyChoreList').innerHTML = '';
            document.getElementById('monthlyChoreList').innerHTML = '';
            document.getElementById('yearlyChoreList').innerHTML = '';
            chores.forEach(chore => {
                addChoreToList(chore);
            });
        });

        socket.on('new chore', (chore) => {
            addChoreToList(chore);
        });

        socket.on('toggle chore', ({ id, user, done }) => {
            const choreItem = document.getElementById(id);
            if (choreItem) {
                const choreText = choreItem.querySelector('span');
                choreText.classList.toggle('completed', done);
                choreText.style.color = done ? getUserColor(user) : '#000'; // Default to black if not done
            }
        });

        socket.on('delete chore', (choreId) => {
            const choreItem = document.getElementById(choreId);
            if (choreItem) {
                choreItem.remove();
            }
        });
    }

    function addChoreToList(chore) {
        // Validate the frequency
        const validFrequencies = ['weekly', 'monthly', 'yearly'];
        if (!validFrequencies.includes(chore.frequency)) {
            console.error(`Unsupported frequency: ${chore.frequency}`);
            return;
        }
    
        const choreList = document.getElementById(`${chore.frequency}ChoreList`);
        
        if (!choreList) {
            console.error(`Chore list for frequency ${chore.frequency} not found`);
            return;
        }
    
        const li = document.createElement('li');
        li.id = chore._id;
    
        const choreText = document.createElement('span');
        choreText.textContent = chore.text;
        if (chore.done) {
            choreText.classList.add('completed');
            choreText.style.color = getUserColor(chore.user);
        }
        choreText.addEventListener('click', () => {
            socket.emit('toggle chore', { id: chore._id, user: currentUser });
        });
    
        const deleteButtonContainer = document.createElement('div');
        deleteButtonContainer.classList.add('delete-button-container');
    
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => {
            socket.emit('delete chore', chore._id);
        });
    
        deleteButtonContainer.appendChild(deleteButton);
        li.appendChild(choreText);
        li.appendChild(deleteButtonContainer);
        choreList.appendChild(li);
    
        if (!userColors[chore.user]) {
            userColors[chore.user] = getRandomColor();
        }
    }    

    function getUserColor(user) {
        if (!user) return '#000'; // Default to black if user is null
        if (!userColors[user]) {
            userColors[user] = getRandomColor();
        }
        return userColors[user];
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});
