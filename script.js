let peer = null;
let connToHost = null; 
let connections = [];  
let isHost = false;
let winnerDeclared = false;
let myName = "";
let myAvatar = "imagenes/avatar1.png"; 

const btn = document.getElementById('main-buzzer');
const winnerBanner = document.getElementById('winner-banner');
const winnerNameSpan = document.getElementById('winner-name');
const winnerPhotoImg = document.getElementById('winner-photo');
const resetBtn = document.getElementById('reset-btn');
const mainTitle = document.getElementById('main-title');
const joinBtnFinal = document.getElementById('join-btn-final');

function goToStep2() {
    const nameInput = document.getElementById('player-name').value.trim();
    if (!nameInput) return alert("Por favor, introduce tu nombre");
    myName = nameInput;
    document.getElementById('setup-step-1').classList.add('hidden');
    document.getElementById('setup-step-2').classList.remove('hidden');
}

function selectAvatar(element) {
    document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
    element.classList.add('selected');
    myAvatar = element.getAttribute('data-img');
}

function startAsHost() {
    isHost = true;
    const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
    peer = new Peer(roomID);

    peer.on('open', (id) => {
        initGameUI(id);
        document.getElementById('host-controls').classList.remove('hidden');
    });

    peer.on('connection', (conn) => {
        connections.push(conn);
        conn.on('data', (data) => {
            if (data.type === 'PRESS' && !winnerDeclared) {
                handleGlobalBuzzer(data.name, data.avatar);
            }
        });
    });

    peer.on('error', (err) => alert("Error de sala: " + err.type));
}

function startAsPlayer() {
    const roomID = document.getElementById('join-id').value.toUpperCase().trim();
    if (!roomID) return alert("Introduce el código de sala");

    joinBtnFinal.innerText = "Conectando...";
    joinBtnFinal.disabled = true;

    peer = new Peer();

    peer.on('error', (err) => {
        joinBtnFinal.innerText = "Unirse";
        joinBtnFinal.disabled = false;
        if (err.type === 'peer-not-found') {
            alert("La sala " + roomID + " no existe. Verifica el código.");
        } else {
            alert("Error de conexión: " + err.type);
        }
    });

    peer.on('open', () => {
        connToHost = peer.connect(roomID);

        connToHost.on('open', () => {
            initGameUI(roomID);
        });

        connToHost.on('data', (data) => {
            if (data.type === 'WINNER') showWinnerUI(data.name, data.avatar);
            if (data.type === 'RESET') resetBuzzerUI();
        });

        connToHost.on('close', () => {
            alert("Conexión perdida con el anfitrión.");
            location.reload();
        });
    });
}

function handleGlobalBuzzer(name, avatar) {
    if (winnerDeclared) return;
    winnerDeclared = true;
    showWinnerUI(name, avatar);
    connections.forEach(conn => {
        if (conn.open) conn.send({ type: 'WINNER', name: name, avatar: avatar });
    });
}

function showWinnerUI(name, avatar) {
    winnerDeclared = true;
    winnerNameSpan.innerText = name;
    winnerPhotoImg.src = avatar; 
    winnerBanner.classList.remove('hidden');
    btn.disabled = true;
}

function resetBuzzerUI() {
    winnerDeclared = false;
    winnerBanner.classList.add('hidden');
    btn.disabled = false;
}

btn.onclick = () => {
    if (winnerDeclared) return;
    if (isHost) {
        handleGlobalBuzzer(myName, myAvatar);
    } else if (connToHost && connToHost.open) {
        connToHost.send({ type: 'PRESS', name: myName, avatar: myAvatar });
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
    document.getElementById('setup-step-2').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    mainTitle.classList.add('hidden');
    document.getElementById('room-display').innerText = `SALA: ${id}`;
    document.getElementById('player-display').innerText = `YO: ${myName}`;
}
