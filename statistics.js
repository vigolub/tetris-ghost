// Game Statistics Tracker
const statsModal = document.createElement('div');
statsModal.id = 'stats-modal';
statsModal.style.display = 'none';
statsModal.innerHTML = `
    <div id="game-stats">
        <h2>Game Statistics</h2>
        <div id="stats-content">
            <p>Total Pieces: <span id="stat-pieces">0</span></p>
            <p>Single Lines: <span id="stat-singles">0</span></p>
            <p>Double Lines: <span id="stat-doubles">0</span></p>
            <p>Triple Lines: <span id="stat-triples">0</span></p>
            <p>Tetris: <span id="stat-tetris">0</span></p>
        </div>
        <button id="closeStats">Close</button>
    </div>
`;
document.body.appendChild(statsModal);

// Add button to show stats
const statsButton = document.createElement('button');
statsButton.id = 'showStatsBtn';
statsButton.textContent = 'Statistics';
statsButton.onclick = showStats;
document.querySelector('.game-controls').appendChild(statsButton);

document.getElementById('closeStats').onclick = hideStats;

function showStats() {
    // Update stats display
    document.getElementById('stat-pieces').textContent = totalPiecesPlaced;
    document.getElementById('stat-singles').textContent = singleLinesCleared;
    document.getElementById('stat-doubles').textContent = doubleLinesCleared;
    document.getElementById('stat-triples').textContent = tripleLinesCleared;
    document.getElementById('stat-tetris').textContent = tetrisLinesCleared;
    
    // Show modal
    statsModal.style.display = 'flex';
    
    // Pause game if it's running
    if (gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
    }
}

function hideStats() {
    statsModal.style.display = 'none';
    
    // Resume game if it was paused
    if (gameState === GameState.PAUSED && isGameActive) {
        setGameState(GameState.PLAYING);
    }
}
