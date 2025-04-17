// Tetris game logic
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const arenaWidth = 12;
const arenaHeight = 20;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let isPaused = false;
let isGameActive = false;

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

let pauseOverlay = document.createElement('div');
pauseOverlay.id = 'pauseOverlay';
pauseOverlay.style.position = 'absolute';
pauseOverlay.style.top = '0';
pauseOverlay.style.left = '0';
pauseOverlay.style.width = '100%';
pauseOverlay.style.height = '100%';
pauseOverlay.style.display = 'none';
pauseOverlay.style.justifyContent = 'center';
pauseOverlay.style.alignItems = 'center';
pauseOverlay.style.background = 'rgba(0,0,0,0.5)';
pauseOverlay.style.color = '#fff';
pauseOverlay.style.fontSize = '2em';
pauseOverlay.style.zIndex = '10';
pauseOverlay.innerText = 'Paused';
document.body.appendChild(pauseOverlay);

let playerName = '';
let difficulty = 'normal';
let leaderboard = [];
const leaderboardKey = 'tetrisLeaderboard';
const dropIntervals = {
    easy: 1200,
    normal: 800,
    hard: 400
};

// --- Touch Controls ---
function showTouchControlsIfNeeded() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch || window.innerWidth < 800) {
        document.getElementById('touch-controls').style.display = 'flex';
    } else {
        document.getElementById('touch-controls').style.display = 'none';
    }
}
window.addEventListener('resize', showTouchControlsIfNeeded);
window.addEventListener('DOMContentLoaded', showTouchControlsIfNeeded);

function touchControlHandler(action) {
    if (!isGameActive || isPaused) return;
    if (action === 'left') playerMove(-1);
    if (action === 'right') playerMove(1);
    if (action === 'rotate') playerRotate(1);
    if (action === 'down') playerDrop();
    if (action === 'drop') {
        while (!collide(arena, player)) player.pos.y++;
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }
}
document.getElementById('touch-left').addEventListener('touchstart', e => { e.preventDefault(); touchControlHandler('left'); });
document.getElementById('touch-right').addEventListener('touchstart', e => { e.preventDefault(); touchControlHandler('right'); });
document.getElementById('touch-rotate').addEventListener('touchstart', e => { e.preventDefault(); touchControlHandler('rotate'); });
document.getElementById('touch-down').addEventListener('touchstart', e => { e.preventDefault(); touchControlHandler('down'); });
document.getElementById('touch-drop').addEventListener('touchstart', e => { e.preventDefault(); touchControlHandler('drop'); });

// --- Leaderboard Modal ---
function showLeaderboardModal() {
    setPause(true);
    document.getElementById('leaderboard-modal').style.display = 'flex';
}
function hideLeaderboardModal() {
    document.getElementById('leaderboard-modal').style.display = 'none';
    setPause(false);
}
document.getElementById('showLeaderboardBtn').onclick = showLeaderboardModal;
document.getElementById('closeLeaderboard').onclick = hideLeaderboardModal;

function fetchLeaderboard() {
    fetch('https://your-leaderboard-api.example.com/leaderboard')
        .then(res => res.json())
        .then(data => {
            leaderboard = data;
            updateLeaderboardUI();
        });
}

function updateLeaderboardUI() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    leaderboard.slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score}`;
        list.appendChild(li);
    });
}

document.getElementById('startBtn').onclick = () => {
    const nameInput = document.getElementById('playerName');
    const diffSelect = document.getElementById('difficulty');
    playerName = nameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to start the game.');
        nameInput.focus();
        return;
    }
    difficulty = diffSelect.value;
    dropInterval = dropIntervals[difficulty];
    score = 0;
    updateScore();
    playerReset();
    setPause(false);
    isGameActive = true;
    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('playerNameDisplay').textContent = `Player: ${playerName}`;
    document.getElementById('playerNameDisplay').style.display = '';
    document.getElementById('pauseBtn').disabled = false;
    update(); // Start the game loop only after game is started
};

document.getElementById('endGameBtn').onclick = () => {
    if (document.getElementById('pauseBtn').disabled) return;
    endGame();
    showLeaderboardModal();
};

function endGame() {
    isGameActive = false;
    fetch('https://your-leaderboard-api.example.com/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score })
    })
    .then(() => fetchLeaderboard())
    .catch(() => fetchLeaderboard());
    document.getElementById('player-setup').style.display = '';
    document.getElementById('playerNameDisplay').style.display = 'none';
    document.getElementById('pauseBtn').disabled = true;
}

function setPause(state) {
    isPaused = state;
    pauseOverlay.style.display = isPaused ? 'flex' : 'none';
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset, styleOverride) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.save();
                context.fillStyle = styleOverride || colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                // Block border
                context.strokeStyle = '#222';
                context.lineWidth = 0.08;
                context.strokeRect(x + offset.x + 0.04, y + offset.y + 0.04, 0.92, 0.92);
                context.restore();
            }
        });
    });
}

function getShadowPosition(matrix, pos) {
    let shadowY = pos.y;
    while (!collide(arena, {matrix, pos: {x: pos.x, y: shadowY + 1}})) {
        shadowY++;
    }
    return {x: pos.x, y: shadowY};
}

function draw() {
    // Use the same colorful gradient as the CSS for the playfield background
    const grad = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#2b5876');
    grad.addColorStop(0.4, '#4e4376');
    grad.addColorStop(1, '#ff9966');
    context.fillStyle = grad;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    context.save();
    context.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let x = 1; x < arenaWidth; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, arenaHeight);
        context.stroke();
    }
    for (let y = 1; y < arenaHeight; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(arenaWidth, y);
        context.stroke();
    }
    context.restore();
    // Draw arena
    drawMatrix(arena, {x:0, y:0});
    // Draw shadow of the falling piece
    const shadowPos = getShadowPosition(player.matrix, player.pos);
    drawMatrix(player.matrix, shadowPos, 'rgba(255,255,255,0.25)');
    // Draw player piece
    drawMatrix(player.matrix, player.pos);
    // Glossy overlay
    context.save();
    let gradOverlay = context.createLinearGradient(0, 0, 0, canvas.height);
    gradOverlay.addColorStop(0, 'rgba(255,255,255,0.10)');
    gradOverlay.addColorStop(0.2, 'rgba(255,255,255,0.04)');
    gradOverlay.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradOverlay;
    context.fillRect(0, 0, arenaWidth, arenaHeight);
    context.restore();
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arenaWidth / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        endGame();
        score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let arena = createMatrix(arenaWidth, arenaHeight);
let player = {
    pos: {x:0, y:0},
    matrix: null,
};

function updateScore() {
    document.getElementById('score').innerText = 'Score: ' + score;
}

function update(time = 0) {
    if (!isGameActive) return; // Stop the game loop if not active
    if (isPaused) {
        draw();
        requestAnimationFrame(update);
        return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

document.getElementById('pauseBtn').addEventListener('click', () => {
    setPause(!isPaused);
});

document.addEventListener('keydown', event => {
    if (event.key === 'p' || event.key === 'P') {
        setPause(!isPaused);
    }
    if (event.key === 'Escape') {
        if (!document.getElementById('pauseBtn').disabled) {
            endGame();
        }
        return;
    }
    if (isPaused) return;
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate(1);
    } else if (event.key === ' ') {
        // Hard drop
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }
});

window.onload = () => {
    fetchLeaderboard();
    document.getElementById('player-setup').style.display = '';
    document.getElementById('playerNameDisplay').style.display = 'none';
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('score').innerText = 'Score: 0';
    showTouchControlsIfNeeded();
};
