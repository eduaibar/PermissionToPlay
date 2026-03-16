let peer = null;
let connToHost = null; 
let connections = [];  
let isHost = false;
let winnerDeclared = false;
let myName = "";
let playerNames = []; 

const btn = document.getElementById('main-buzzer');
const winnerBanner = document.getElementById('winner-banner');
const winnerNameSpan = document.getElementById('winner-name');
const resetBtn = document.getElementById('reset-btn');
const playerListDiv = document.getElementById('player-list');

function startAsHost() {
    myName = document.getElementById('player-name').value.trim() || "Anfitrión";
    isHost = true;
    playerNames = [myName];
    
    const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
    peer = new Peer(roomID);

    peer.on('open', (id) => {
        initGameUI(id);
        updatePlayerListUI();
        document.getElementById('host-controls').classList.remove('hidden');
    });

    peer.on('connection', (conn) => {
        connections.push(conn);
        
        conn.on('data', (data) => {
            if (data.type === 'JOIN') {
                if (!playerNames.includes(data.name)) {
                    playerNames.push(data.name);
                }
                updatePlayerListUI();
                broadcastPlayerList(); 
            }
            if (data.type === 'PRESS' && !winnerDeclared) {
                handleGlobalBuzzer(data.name);
            }
        });
    });
}

function startAsPlayer() {
    myName = document.getElementById('player-name').value.trim() || "Jugador";
    const roomID = document.getElementById('join-id').value.toUpperCase().trim();
    
    if (!roomID) return alert("Introduce el código de sala");

    peer = new Peer();
    peer.on('open', () => {
        connToHost = peer.connect(roomID);

        connToHost.on('open', () => {
            initGameUI(roomID);
            // Enviamos el nombre después de un mini retardo para asegurar conexión
            setTimeout(() => {
                connToHost.send({ type: 'JOIN', name: myName });
            }, 500);
        });

        connToHost.on('data', (data) => {
            if (data.type === 'WINNER') showWinnerUI(data.name);
            if (data.type === 'RESET') resetBuzzerUI();
            if (data.type === 'PLAYER_LIST') {
                playerNames = data.list;
                updatePlayerListUI();
            }
        });
    });
}

function broadcastPlayerList() {
    connections.forEach(conn => {
        if (conn.open) {
            conn.send({ type: 'PLAYER_LIST', list: playerNames });
        }
    });
}

function updatePlayerListUI() {
    playerListDiv.innerHTML = "";
    playerNames.forEach(name => {
        const span = document.createElement('span');
        span.className = 'player-tag';
        span.innerText = name;
        playerListDiv.appendChild(span);
    });
}

function handleGlobalBuzzer(name) {
    if (winnerDeclared) return;
    winnerDeclared = true;
    showWinnerUI(name);
    connections.forEach(conn => {
        if (conn.open) conn.send({ type: 'WINNER', name: name });
    });
}

function showWinnerUI(name) {
    winnerDeclared = true;
    winnerNameSpan.innerText = name;
    winnerBanner.classList.remove('hidden');
    btn.disabled = true;
}

function resetBuzzerUI() {
    winnerDeclared = false;
    winnerBanner.classList.add('hidden');
    btn.disabled = false;
    winnerNameSpan.innerText = "---";
}

btn.onclick = () => {
    if (winnerDeclared) return;
    if (isHost) {
        handleGlobalBuzzer(myName);
    } else if (connToHost && connToHost.open) {
        connToHost.send({ type: 'PRESS', name: myName });
        btn.disabled = true;
    }
};

resetBtn.onclick = () => {
    resetBuzzerUI();
    connections.forEach(conn => {
        if (conn.open) conn.send({ type: 'RESET' });
    });
};

function initGameUI(id) {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('room-display').innerText = `SALA: ${id}`;
    document.getElementById('player-display').innerText = `YO: ${myName}`;
}
