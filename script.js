let peer = null;
let connToHost = null; // Para jugadores
let connections = [];  // Para el host
let isHost = false;
let winnerDeclared = false;
let myName = "";

// Elementos
const btn = document.getElementById('main-buzzer');
const winnerBanner = document.getElementById('winner-banner');
const winnerNameSpan = document.getElementById('winner-name');

function startAsHost() {
    myName = document.getElementById('player-name').value || "Host";
    isHost = true;
    // Generar ID de 4 letras aleatorias
    const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
    peer = new Peer(roomID);

    peer.on('open', (id) => {
        initGameUI(id);
        document.getElementById('host-controls').classList.remove('hidden');
    });

    peer.on('connection', (c) => {
        connections.push(c);
        c.on('data', (data) => {
            if (data.type === 'PRESS') handleGlobalBuzzer(data.name);
        });
    });

    // El host pulsa su propio botón
    btn.onclick = () => handleGlobalBuzzer(myName);
}

function startAsPlayer() {
    myName = document.getElementById('player-name').value || "Invitado";
    const roomID = document.getElementById('join-id').value.toUpperCase();
    if (!roomID) return alert("Introduce el código de sala");

    peer = new Peer();
    peer.on('open', () => {
        connToHost = peer.connect(roomID);
        initGameUI(roomID);

        connToHost.on('data', (data) => {
            if (data.type === 'WINNER') showWinner(data.name);
            if (data.type === 'RESET') resetBuzzer();
        });
    });
}

function handleGlobalBuzzer(name) {
    if (!winnerDeclared) {
        winnerDeclared = true;
        // 1. Mostrar en mi pantalla (Host)
        showWinner(name);
        // 2. Avisar a todos los conectados
        connections.forEach(c => c.send({ type: 'WINNER', name: name }));
    }
}

function showWinner(name) {
    winnerDeclared = true;
    winnerNameSpan.innerText = name;
    winnerBanner.classList.remove('hidden');
    btn.disabled = true;
}

function resetBuzzer() {
    winnerDeclared = false;
    winnerBanner.classList.add('hidden');
    btn.disabled = false;
}

// Botón de pulsar para jugadores
btn.onclick = () => {
    if (!isHost && connToHost) {
        connToHost.send({ type: 'PRESS', name: myName });
        btn.disabled = true;
    }
};

// Botón de reiniciar para el host
document.getElementById('reset-btn').onclick = () => {
    resetBuzzer();
    connections.forEach(c => c.send({ type: 'RESET' }));
};

function initGameUI(id) {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('room-display').innerText = `SALA: ${id}`;
    document.getElementById('player-display').innerText = `YO: ${myName}`;
}
