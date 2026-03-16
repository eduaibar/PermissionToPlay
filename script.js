let peer = null;
let connToHost = null; // Usado por los jugadores para hablar con el host
let connections = [];  // Usado por el host para hablar con todos los jugadores
let isHost = false;
let winnerDeclared = false;
let myName = "";

// Elementos del DOM
const btn = document.getElementById('main-buzzer');
const winnerBanner = document.getElementById('winner-banner');
const winnerNameSpan = document.getElementById('winner-name');
const resetBtn = document.getElementById('reset-btn');

// --- LÓGICA PARA EL ANFITRIÓN (HOST) ---
function startAsHost() {
    myName = document.getElementById('player-name').value.trim() || "Host";
    isHost = true;
    
    // Generamos un ID de sala corto y único
    const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Creamos el Peer con ese ID específico
    peer = new Peer(roomID);

    peer.on('open', (id) => {
        initGameUI(id);
        document.getElementById('host-controls').classList.remove('hidden');
    });

    // El host escucha cuando alguien se intenta conectar a su sala
    peer.on('connection', (conn) => {
        connections.push(conn);
        
        conn.on('data', (data) => {
            if (data.type === 'PRESS' && !winnerDeclared) {
                handleGlobalBuzzer(data.name);
            }
        });

        // Si un jugador se desconecta, lo quitamos de la lista
        conn.on('close', () => {
            connections = connections.filter(c => c !== conn);
        });
    });

    peer.on('error', (err) => {
        alert("Error en la sala: " + err.type);
    });
}

// --- LÓGICA PARA EL JUGADOR ---
function startAsPlayer() {
    myName = document.getElementById('player-name').value.trim() || "Jugador";
    const roomID = document.getElementById('join-id').value.toUpperCase().trim();
    
    if (!roomID) {
        alert("Por favor, introduce un código de sala.");
        return;
    }

    // El jugador crea un Peer con ID aleatorio
    peer = new Peer();

    peer.on('open', () => {
        // Intentamos conectar con el ID de la sala del Host
        connToHost = peer.connect(roomID);

        connToHost.on('open', () => {
            initGameUI(roomID);
        });

        connToHost.on('data', (data) => {
            if (data.type === 'WINNER') {
                showWinnerUI(data.name);
            }
            if (data.type === 'RESET') {
                resetBuzzerUI();
            }
        });

        connToHost.on('close', () => {
            alert("La conexión con la sala se ha perdido.");
            location.reload();
        });
    });

    peer.on('error', (err) => {
        if (err.type === 'peer-not-found') {
            alert("La sala " + roomID + " no existe. Revisa el código.");
        } else {
            alert("Error de conexión: " + err.type);
        }
    });
}

// --- GESTIÓN DEL JUEGO (DENTRO DE LA SALA) ---

// Esta función solo se ejecuta en el móvil del HOST
function handleGlobalBuzzer(name) {
    if (winnerDeclared) return; // Si ya hay ganador, ignoramos el resto
    
    winnerDeclared = true;
    
    // 1. Actualizar la propia pantalla del Host
    showWinnerUI(name);
    
    // 2. Avisar a todos los jugadores conectados quién ha ganado
    connections.forEach(conn => {
        if (conn.open) {
            conn.send({ type: 'WINNER', name: name });
        }
    });
}

// Actualiza la interfaz para mostrar al ganador
function showWinnerUI(name) {
    winnerDeclared = true;
    winnerNameSpan.innerText = name;
    winnerBanner.classList.remove('hidden');
    btn.disabled = true;
}

// Reinicia la interfaz para una nueva ronda
function resetBuzzerUI() {
    winnerDeclared = false;
    winnerBanner.classList.add('hidden');
    btn.disabled = false;
    winnerNameSpan.innerText = "---";
}

// --- EVENTOS DE BOTONES ---

// El botón de "¡PULSAR!" principal
btn.onclick = () => {
    if (winnerDeclared) return;

    if (isHost) {
        // Si soy el host, proceso mi pulsación directamente
        handleGlobalBuzzer(myName);
    } else {
        // Si soy jugador, envío mi nombre al host para que él decida
        if (connToHost && connToHost.open) {
            connToHost.send({ type: 'PRESS', name: myName });
            btn.disabled = true; // Lo deshabilitamos para evitar doble click
        }
    }
};

// El botón de reiniciar (Solo lo tiene el Host)
resetBtn.onclick = () => {
    if (isHost) {
        resetBuzzerUI();
        // Avisar a todos los jugadores que pueden volver a pulsar
        connections.forEach(conn => {
            if (conn.open) {
                conn.send({ type: 'RESET' });
            }
        });
    }
};

// Función para cambiar de pantalla de inicio a juego
function initGameUI(id) {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('room-display').innerText = `SALA: ${id}`;
    document.getElementById('player-display').innerText = `YO: ${myName}`;
}
