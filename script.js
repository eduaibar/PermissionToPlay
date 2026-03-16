let peer = null;
let conn = null;
let connections = [];
let isHost = false;
let winnerDeclared = false;

const statusText = document.getElementById('status-text');
const winnerBox = document.getElementById('winner-box');

// Función para el que crea la partida
function startAsHost() {
    isHost = true;
    const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
    peer = new Peer(roomID);

    peer.on('open', (id) => {
        showGame(id);
        document.getElementById('host-view').classList.remove('hidden');
        statusText.innerText = "Esperando jugadores...";
    });

    peer.on('connection', (c) => {
        connections.push(c);
        c.on('data', (data) => handleBuzzer(data, c.metadata.name));
        statusText.innerText = "¡Jugadores listos!";
    });
}

// Función para el que se une
function startAsPlayer() {
    const roomID = document.getElementById('join-id').value.toUpperCase();
    const name = prompt("Tu nombre:") || "Anónimo";
    peer = new Peer();

    peer.on('open', (id) => {
        conn = peer.connect(roomID, { metadata: { name } });
        showGame(roomID);
        document.getElementById('main-buzzer').classList.remove('hidden');
        
        conn.on('data', (data) => {
            if (data === 'reset') {
                document.getElementById('main-buzzer').disabled = false;
                statusText.innerText = "¡DALE YA!";
            }
        });
    });
}

function handleBuzzer(data, name) {
    if (data === 'press' && !winnerDeclared) {
        winnerDeclared = true;
        winnerBox.innerText = name;
        // Avisar a todos los demás que hay ganador
        connections.forEach(c => c.send('locked'));
    }
}

function showGame(id) {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('room-display').innerText = `SALA: ${id}`;
}

// Eventos de botones
document.getElementById('main-buzzer').onclick = () => {
    if (conn) {
        conn.send('press');
        document.getElementById('main-buzzer').disabled = true;
    }
};

document.getElementById('reset-btn').onclick = () => {
    winnerDeclared = false;
    winnerBox.innerText = "?";
    connections.forEach(c => c.send('reset'));
};
