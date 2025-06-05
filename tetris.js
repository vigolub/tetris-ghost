// Tetris game logic

// Debug logging function
function debugLog(message) {
    console.log(`[DEBUG] ${message}`);
}

// Ensure game controls are always visible and accessible
function ensureControlsVisible() {
    debugLog('Ensuring game controls are visible');
    
    const gameControls = document.querySelector('.game-controls');
    const gameStats = document.querySelector('.game-stats');
    const instructions = document.querySelector('.compact-instructions');
    
    // Make sure all control elements are visible
    [gameControls, gameStats, instructions].forEach(element => {
        if (element) {
            element.style.display = element.style.display || (element === gameControls ? 'flex' : 'block');
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            element.style.zIndex = '10';
        }
    });
    
    // Ensure all buttons in game controls are accessible
    if (gameControls) {
        const buttons = gameControls.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.display = 'inline-block';
            button.style.visibility = 'visible';
            button.style.pointerEvents = 'auto';
        });
    }
    
    debugLog('Game controls visibility ensured');
}

// Main canvas initialization
function initMainCanvas() {
    debugLog('Initializing main canvas');
    try {
        const mainCanvas = document.getElementById('tetris');
        if (!mainCanvas) {
            console.error('Main tetris canvas not found in DOM');
            return false;
        }
        
        const mainContext = mainCanvas.getContext('2d');
        if (!mainContext) {
            console.error('Failed to get 2D context from tetris canvas');
            return false;
        }
        
        // Set the scale for the main context
        mainContext.scale(20, 20);
        debugLog('Main canvas initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing main canvas:', error);
        return false;
    }
}

const canvas = document.getElementById('tetris');
if (!canvas) {
    console.error('Main tetris canvas not found in DOM');
}
const context = canvas ? canvas.getContext('2d') : null;
if (context) {
    context.scale(20, 20);
} else {
    console.error('Failed to get 2D context from tetris canvas');
}

// Canvas references for next and hold pieces
let nextCanvas, nextContext, nextScale;
let holdCanvas, holdContext, holdScale;

// Initialize these in window.onload to ensure DOM is ready
function initCanvases() {
    debugLog('Initializing canvases');
    
    try {
        // First, try to find the existing containers
        const holdContainer = document.getElementById('hold-piece-container');
        const nextContainer = document.getElementById('next-piece-container');
        
        if (!holdContainer || !nextContainer) {
            debugLog('Containers not found!');
            console.error('Hold or Next piece containers not found in the DOM');
            return false;
        }
        
        debugLog(`Found containers: holdContainer=${!!holdContainer}, nextContainer=${!!nextContainer}`);
        
        // Clear existing canvases if any
        while (holdContainer.querySelector('canvas')) {
            holdContainer.querySelector('canvas').remove();
        }
        
        while (nextContainer.querySelector('canvas')) {
            nextContainer.querySelector('canvas').remove();
        }
        
        // Create new canvases with more explicit styles
        holdCanvas = document.createElement('canvas');
        holdCanvas.id = 'holdCanvas';
        holdCanvas.width = 80;
        holdCanvas.height = 80;
        holdCanvas.style.display = 'block'; // Make sure it's visible
        holdCanvas.style.border = '1px solid rgba(255,255,255,0.2)';
        holdCanvas.style.backgroundColor = 'rgba(0,0,0,0.2)';
        holdCanvas.style.margin = '0 auto';
        holdContainer.appendChild(holdCanvas);
        
        nextCanvas = document.createElement('canvas');
        nextCanvas.id = 'nextCanvas';
        nextCanvas.width = 80;
        nextCanvas.height = 80;
        nextCanvas.style.display = 'block'; // Make sure it's visible
        nextCanvas.style.border = '1px solid rgba(255,255,255,0.2)';
        nextCanvas.style.backgroundColor = 'rgba(0,0,0,0.2)';
        nextCanvas.style.margin = '0 auto';
        nextContainer.appendChild(nextCanvas);
        
        debugLog('Created canvas elements');
        
        // Get contexts and set scale
        try {
            nextContext = nextCanvas.getContext('2d');
            if (!nextContext) {
                debugLog('Failed to get nextContext');
                return false;
            }
            
            nextScale = 20;
            nextContext.scale(nextScale, nextScale);
            
            holdContext = holdCanvas.getContext('2d');
            if (!holdContext) {
                debugLog('Failed to get holdContext');
                return false;
            }
            
            holdScale = 20;
            holdContext.scale(holdScale, holdScale);
            
            debugLog('Canvas initialization successful');
            
            return true;
        } catch (contextError) {
            debugLog(`Error getting canvas contexts: ${contextError.message}`);
            console.error('Canvas context error:', contextError);
            return false;
        }
    } catch (error) {
        debugLog(`Error initializing canvases: ${error.message}`);
        console.error('Canvas initialization error:', error);
        return false;
    }
}

const arenaWidth = 12;
const arenaHeight = 20;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let isPaused = false;
let isGameActive = false;

// Game statistics
let totalPiecesPlaced = 0;
let singleLinesCleared = 0;
let doubleLinesCleared = 0;
let tripleLinesCleared = 0;
let tetrisLinesCleared = 0;

// Next piece
let nextPiece = null;

// Hold piece
let holdPiece = null;
let canHold = true;

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

// Piece type mapping
const pieceTypes = {
    'T': 1,
    'O': 2,
    'L': 3,
    'J': 4,
    'I': 5,
    'S': 6,
    'Z': 7
};

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

// --- Mobile & Touch Controls ---
let isMobileDevice = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let lastTouchTime = 0;
let isDoubleTouch = false;

// Mobile detection and setup
function detectMobile() {
    isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 430 || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    return isMobileDevice;
}

// Dynamic canvas scaling for mobile
function resizeGameCanvas() {
    if (!canvas) return;
    
    const container = document.getElementById('playfield-container');
    if (!container) return;
    
    if (isMobileDevice || window.innerWidth <= 430) {
        // Mobile optimized sizing - use more available space
        const availableWidth = window.innerWidth - 120; // Account for side pieces (80px) + gaps
        const availableHeight = window.innerHeight - 220; // Account for header, controls, stats
        
        // Maintain Tetris aspect ratio (3:5 ratio)
        const aspectRatio = 3 / 5;
        let newWidth = Math.min(availableWidth, 280);
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > availableHeight) {
            newHeight = availableHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        // Ensure minimum playable size
        newWidth = Math.max(newWidth, 180);
        newHeight = Math.max(newHeight, 300);
        
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        
        debugLog(`Canvas resized for mobile: ${newWidth}x${newHeight}`);
    } else {
        // Desktop sizing
        canvas.style.width = '240px';
        canvas.style.height = '400px';
    }
}

function showTouchControlsIfNeeded() {
    const isTouch = detectMobile();
    const touchControls = document.getElementById('touch-controls');
    
    if (isTouch || window.innerWidth < 800) {
        if (touchControls) {
            touchControls.style.display = 'grid';
            touchControls.style.visibility = 'visible';
        }
        // Resize canvas for mobile
        resizeGameCanvas();
    } else {
        if (touchControls) {
            touchControls.style.display = 'none';
        }
        resizeGameCanvas();
    }
}

// Enhanced touch control handler with feedback
function touchControlHandler(action, event) {
    // Visual feedback for touch
    if (event && event.target) {
        event.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            event.target.style.transform = 'scale(1)';
        }, 100);
    }
    
    // Haptic feedback on supported devices
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Handle pause action regardless of game state
    if (action === 'pause') {
        togglePause();
        return;
    }
    
    // Other actions only work during gameplay
    if (gameState !== GameState.PLAYING) return;
    
    if (action === 'left') playerMove(-1);
    if (action === 'right') playerMove(1);
    if (action === 'rotate') playerRotate(1);
    if (action === 'down') playerDrop();
    if (action === 'drop') {
        while (!collide(arena, player)) player.pos.y++;
        player.pos.y--;
        playSound('drop');
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }
}

// Gesture-based controls on canvas
function setupCanvasGestures() {
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouchStart(e) {
    e.preventDefault();
    
    if (gameState !== GameState.PLAYING) return;
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    
    // Double tap detection
    const timeSinceLastTouch = touchStartTime - lastTouchTime;
    if (timeSinceLastTouch < 300) {
        isDoubleTouch = true;
        // Double tap = rotate
        touchControlHandler('rotate');
    } else {
        isDoubleTouch = false;
    }
    lastTouchTime = touchStartTime;
}

function handleTouchMove(e) {
    e.preventDefault();
    // Prevent scrolling while playing
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    if (gameState !== GameState.PLAYING || isDoubleTouch) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    const deltaTime = endTime - touchStartTime;
    
    const minSwipeDistance = 30;
    const maxSwipeTime = 500;
    
    if (deltaTime > maxSwipeTime) return;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > minSwipeDistance || absY > minSwipeDistance) {
        if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0) {
                touchControlHandler('right');
            } else {
                touchControlHandler('left');
            }
        } else {
            // Vertical swipe
            if (deltaY > 0 && deltaY > minSwipeDistance * 2) {
                // Long downward swipe = hard drop
                touchControlHandler('drop');
            } else if (deltaY > 0) {
                // Short downward swipe = soft drop
                touchControlHandler('down');
            } else {
                // Upward swipe = rotate
                touchControlHandler('rotate');
            }
        }
    } else if (deltaTime < 200) {
        // Quick tap = rotate
        touchControlHandler('rotate');
    }
}

// Touch button event listeners with improved handling
function setupTouchButtons() {
    const touchButtons = [
        { id: 'touch-left', action: 'left' },
        { id: 'touch-right', action: 'right' },
        { id: 'touch-rotate', action: 'rotate' },
        { id: 'touch-down', action: 'down' },
        { id: 'touch-drop', action: 'drop' },
        { id: 'touch-pause', action: 'pause' }
    ];
    
    touchButtons.forEach(({ id, action }) => {
        const button = document.getElementById(id);
        if (button) {
            // Remove any existing listeners
            button.replaceWith(button.cloneNode(true));
            const newButton = document.getElementById(id);
            
            newButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchControlHandler(action, e);
            }, { passive: false });
            
            // Prevent context menu on long press
            newButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    });
}

// Window resize handler with mobile optimizations
window.addEventListener('resize', () => {
    showTouchControlsIfNeeded();
    resizeGameCanvas();
});

window.addEventListener('DOMContentLoaded', () => {
    detectMobile();
    showTouchControlsIfNeeded();
    setupCanvasGestures();
    setupTouchButtons();
    resizeGameCanvas();
});

// --- Leaderboard Modal ---
function showLeaderboardModal() {
    const prevState = gameState;
    if (prevState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
    }
    document.getElementById('leaderboard-modal').style.display = 'flex';
}
function hideLeaderboardModal() {
    document.getElementById('leaderboard-modal').style.display = 'none';
    if (gameState === GameState.PAUSED && isGameActive) {
        setGameState(GameState.PLAYING);
    }
}
document.getElementById('showLeaderboardBtn').onclick = showLeaderboardModal;
document.getElementById('closeLeaderboard').onclick = hideLeaderboardModal;

function fetchLeaderboard() {
    // Try to get from API first
    fetch('https://your-leaderboard-api.example.com/leaderboard')
        .then(res => res.json())
        .then(data => {
            leaderboard = data;
            // Save to local storage as backup
            localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
            updateLeaderboardUI();
        })
        .catch(() => {
            // If API fails, try to load from local storage
            const storedLeaderboard = localStorage.getItem(leaderboardKey);
            if (storedLeaderboard) {
                leaderboard = JSON.parse(storedLeaderboard);
                updateLeaderboardUI();
            }
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
    console.log('Start button clicked!');
    try {
        const nameInput = document.getElementById('playerName');
        const diffSelect = document.getElementById('difficulty');
        
        if (!nameInput || !diffSelect) {
            console.error('Required form elements not found:', {nameInput, diffSelect});
            alert('Game setup error - please refresh the page.');
            return;
        }
        
        playerName = nameInput.value.trim();
        console.log('Player name:', playerName);
        
        if (!playerName) {
            alert('Please enter your name to start the game.');
            nameInput.focus();
            return;
        }
    } catch (error) {
        console.error('Error in start button handler:', error);
        alert('Game initialization error - please refresh the page.');
        return;
    }
    
    // Mobile optimizations on game start
    if (isMobileDevice) {
        console.log('Applying mobile optimizations...');
        // Hide address bar on mobile
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 100);
        
        // Prevent screen sleep if available
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').catch(() => {
                debugLog('Wake lock not available');
            });
        }
    }
    
    // Ensure controls are visible before starting the game
    console.log('Ensuring controls are visible...');
    ensureControlsVisible();
    
    // Force canvas re-initialization to ensure they're visible
    console.log('Initializing canvases...');
    debugLog('Starting game - reinitializing canvases');
    
    // Initialize main canvas first
    if (!initMainCanvas()) {
        console.error('Failed to initialize main canvas');
        alert('Main game canvas failed to initialize. Please refresh the page.');
        return;
    }
    
    // Then initialize side piece canvases
    if (!initCanvases()) {
        console.error('Failed to initialize canvases on game start - retrying once');
        debugLog('Failed to initialize canvases on game start - retrying once');
        setTimeout(() => {
            if (!initCanvases()) {
                alert('Canvas initialization failed. Please refresh the page.');
            }
        }, 100);
        return;
    }
    
    console.log('Setting up game state...');
    try {
        // Validate main canvas is ready
        if (!canvas || !context) {
            console.error('Main canvas or context not available:', {canvas, context});
            alert('Game canvas not ready. Please refresh the page.');
            return;
        }
        
        difficulty = diffSelect.value;
        dropInterval = dropIntervals[difficulty];
        score = 0;
        level = 1;
        linesCleared = 0;
        document.getElementById('level').textContent = `Level: ${level}`;
        updateScore();
        playerReset();
        setGameState(GameState.PLAYING);
        
        console.log('Hiding player setup and showing game...');
        document.getElementById('player-setup').style.display = 'none';
        document.getElementById('leaderboard-container').style.display = 'none';
        document.getElementById('playerNameDisplay').textContent = `Player: ${playerName}`;
        document.getElementById('playerNameDisplay').style.display = '';
        document.getElementById('pauseBtn').disabled = false;
        
        // Mobile-specific adjustments
        resizeGameCanvas();
        showTouchControlsIfNeeded();
        
        // Ensure controls remain visible after game state change
        setTimeout(ensureControlsVisible, 100);
        
        console.log('Starting game loop...');
        update(); // Start the game loop only after game is started
    } catch (error) {
        console.error('Error setting up game:', error);
        alert('Game setup error - please refresh the page.');
    }
};

document.getElementById('endGameBtn').onclick = () => {
    if (document.getElementById('pauseBtn').disabled) return;
    endGame();
    showLeaderboardModal();
};

function endGame() {
    setGameState(GameState.GAME_OVER);
    
    // Show game statistics if available
    if (typeof showStats === 'function') {
        setTimeout(showStats, 1000);
    }
}

function setPause(state) {
    isPaused = state;
    pauseOverlay.style.display = isPaused ? 'flex' : 'none';
}

// Game state management
const GameState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

let gameState = GameState.IDLE;

function setGameState(newState) {
    const prevState = gameState;
    gameState = newState;
    
    // Ensure game controls are always visible and accessible
    const gameControls = document.querySelector('.game-controls');
    if (gameControls) {
        gameControls.style.display = 'flex';
        gameControls.style.visibility = 'visible';
        gameControls.style.opacity = '1';
        gameControls.style.pointerEvents = 'auto';
    }
    
    // Handle state transitions
    if (newState === GameState.PLAYING) {
        pauseOverlay.style.display = 'none';
        isPaused = false;
        isGameActive = true;
        document.getElementById('pauseBtn').disabled = false;
        if (prevState === GameState.IDLE || prevState === GameState.GAME_OVER) {
            // Reset game
            score = 0;
            updateScore();
            arena.forEach(row => row.fill(0));
            
            // Reset pieces
            nextPiece = null;
            holdPiece = null;
            canHold = true;
            
            // Reset statistics
            totalPiecesPlaced = 0;
            singleLinesCleared = 0;
            doubleLinesCleared = 0;
            tripleLinesCleared = 0;
            tetrisLinesCleared = 0;
            
            playerReset();
        }
    } else if (newState === GameState.PAUSED) {
        pauseOverlay.style.display = 'flex';
        isPaused = true;
    } else if (newState === GameState.GAME_OVER) {
        isGameActive = false;
        document.getElementById('player-setup').style.display = '';
        document.getElementById('playerNameDisplay').style.display = 'none';
        document.getElementById('pauseBtn').disabled = true;
        
        // Submit score to leaderboard
        saveScore();
    } else if (newState === GameState.IDLE) {
        isPaused = false;
        isGameActive = false;
        document.getElementById('player-setup').style.display = '';
        document.getElementById('playerNameDisplay').style.display = 'none';
        document.getElementById('pauseBtn').disabled = true;
    }
}

function saveScore() {
    if (score > 0) {
        // Add to local leaderboard first
        const newEntry = { name: playerName, score, difficulty };
        
        // Load existing leaderboard from local storage first
        const storedLeaderboard = localStorage.getItem(leaderboardKey);
        if (storedLeaderboard) {
            leaderboard = JSON.parse(storedLeaderboard);
        }
        
        // Add new score
        leaderboard.push(newEntry);
        
        // Sort by score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 scores
        if (leaderboard.length > 100) {
            leaderboard = leaderboard.slice(0, 100);
        }
        
        // Save back to local storage
        localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
        
        // Then try to submit to API
        fetch('https://your-leaderboard-api.example.com/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry)
        })
        .then(() => fetchLeaderboard())
        .catch(() => updateLeaderboardUI()); // Still update UI even if API fails
    }
}

// Level system
let level = 1;
const linesPerLevel = 10;
let linesCleared = 0;

function updateLevel() {
    const newLevel = Math.floor(linesCleared / linesPerLevel) + 1;
    if (newLevel > level) {
        level = newLevel;
        // Increase speed as level increases
        dropInterval = Math.max(100, dropIntervals[difficulty] - (level - 1) * 50);
        document.getElementById('level').textContent = `Level: ${level}`;
    }
}

function arenaSweep() {
    let rowCount = 1;
    let clearedLines = [];
    
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        // Add to lines cleared instead of immediately removing
        clearedLines.push(y);
    }
    
    if (clearedLines.length > 0) {
        // Play appropriate sound based on number of lines
        playSound('clear');
        
        // Calculate score increase
        const scoreIncrease = rowCount * 10 * level * clearedLines.length;
        
        // Show floating score text
        if (typeof Animation !== 'undefined') {
            const canvas = document.getElementById('tetris');
            const x = canvas.offsetLeft + canvas.width / 2;
            const y = canvas.offsetTop + canvas.height / 2;
            
            // Different text based on combo
            let scoreText = `+${scoreIncrease}`;
            let color = '#ffffff';
            
            if (clearedLines.length === 4) {
                scoreText = `TETRIS! +${scoreIncrease}`;
                color = '#ffe138';
            } else if (clearedLines.length === 3) {
                scoreText = `TRIPLE! +${scoreIncrease}`;
                color = '#0dff72';
            } else if (clearedLines.length === 2) {
                scoreText = `DOUBLE! +${scoreIncrease}`;
                color = '#0dc2ff';
            }
            
            Animation.showFloatingText(scoreText, x, y, color);
            
            // Flash the lines before clearing them
            Animation.flashLines(clearedLines, () => {
                // Process line clearing after animation
                processLineClear(clearedLines, rowCount);
            });
        } else {
            // No animation, just process the lines
            processLineClear(clearedLines, rowCount);
        }
    }
}

// Helper function to process line clearing
function processLineClear(clearedLines, rowCount) {
    // Track statistics based on number of lines cleared
    switch(clearedLines.length) {
        case 1:
            singleLinesCleared++;
            break;
        case 2:
            doubleLinesCleared++;
            break;
        case 3:
            tripleLinesCleared++;
            break;
        case 4:
            tetrisLinesCleared++;
            break;
    }
    
    // Process line clearing
    clearedLines.forEach(y => {
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        score += rowCount * 10 * level; // Score multiplied by level
        rowCount *= 2;
    });
    
    // Update level based on lines cleared
    const oldLevel = level;
    linesCleared += clearedLines.length;
    updateLevel();
    
    // Show level up animation if level increased
    if (level > oldLevel && typeof Animation !== 'undefined') {
        Animation.levelUpEffect();
    }
    
    updateScore();
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
    debugLog(`Creating piece of type: ${type}`);
    
    // Make sure the type is valid
    if (!type || typeof type !== 'string' || !pieceTypes[type]) {
        debugLog(`Invalid piece type: ${type}, using T as fallback`);
        type = 'T';
    }
    
    // Create piece based on type
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
    
    // If we somehow get here despite the check at the top, return a default T piece
    debugLog('Fallback to T piece');
    return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
    ];
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

function drawNextPiece() {
    debugLog(`drawNextPiece called. nextContext: ${!!nextContext}, nextPiece: ${nextPiece}`);
    
    // Make sure the context is available
    if (!nextContext) {
        debugLog('nextContext not available, reinitializing canvases');
        if (!initCanvases()) {
            console.error('Failed to initialize canvases for next piece');
            return;
        }
        
        if (!nextContext) {
            console.error('Failed to get nextContext even after reinitialization');
            return;
        }
    }
    
    try {
        // Clear the next piece canvas
        nextContext.clearRect(0, 0, 4, 4);  // Clear a 4x4 area in scaled units
        
        // If next piece is not initialized yet, return
        if (!nextPiece) {
            debugLog('nextPiece not initialized');
            return;
        }
        
        debugLog(`Drawing nextPiece: ${nextPiece}`);
        
        // Create the matrix for the next piece
        const matrix = createPiece(nextPiece);
        
        // Calculate center position based on piece size
        const offset = {
            x: (4 - matrix[0].length) / 2,  // Center in 4x4 grid
            y: (4 - matrix.length) / 2
        };
        
        // Draw the piece
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    // Use the color that corresponds to the piece type
                    const colorIndex = pieceTypes[nextPiece] || value;
                    nextContext.fillStyle = colors[colorIndex];
                    nextContext.fillRect(x + offset.x, y + offset.y, 1, 1);
                    nextContext.strokeStyle = '#222';
                    nextContext.lineWidth = 0.08;
                    nextContext.strokeRect(x + offset.x + 0.04, y + offset.y + 0.04, 0.92, 0.92);
                }
            });
        });
        
        debugLog('Next piece drawn successfully');
    } catch (error) {
        console.error('Error drawing next piece:', error);
    }
}

// Draw hold piece
function drawHoldPiece() {
    debugLog(`drawHoldPiece called. holdContext: ${!!holdContext}, holdPiece: ${holdPiece}`);
    
    // Make sure the context is available
    if (!holdContext) {
        debugLog('holdContext not available, reinitializing canvases');
        if (!initCanvases()) {
            console.error('Failed to initialize canvases for hold piece');
            return;
        }
        
        if (!holdContext) {
            console.error('Failed to get holdContext even after reinitialization');
            return;
        }
    }
    
    try {
        // Clear the hold piece canvas
        holdContext.clearRect(0, 0, 4, 4);  // Clear a 4x4 area in scaled units
        
        // If no piece is held yet, return
        if (!holdPiece) {
            debugLog('holdPiece not initialized');
            return;
        }
        
        debugLog(`Drawing holdPiece: ${holdPiece}`);
        
        // Create the matrix for the hold piece
        const matrix = createPiece(holdPiece);
        
        // Calculate center position based on piece size
        const offset = {
            x: (4 - matrix[0].length) / 2,  // Center in 4x4 grid
            y: (4 - matrix.length) / 2
        };
        
        // Draw the piece with opacity if can't hold
        holdContext.globalAlpha = canHold ? 1.0 : 0.4;
        
        // Draw the piece
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    // Use the color that corresponds to the piece type
                    const colorIndex = pieceTypes[holdPiece] || value;
                    holdContext.fillStyle = colors[colorIndex];
                    holdContext.fillRect(x + offset.x, y + offset.y, 1, 1);
                    holdContext.strokeStyle = '#222';
                    holdContext.lineWidth = 0.08;
                    holdContext.strokeRect(x + offset.x + 0.04, y + offset.y + 0.04, 0.92, 0.92);
                }
            });
        });
        
        // Reset opacity
        holdContext.globalAlpha = 1.0;
        
        debugLog('Hold piece drawn successfully');
    } catch (error) {
        console.error('Error drawing hold piece:', error);
    }
}

// Hold piece function
function holdCurrentPiece() {
    if (!canHold || gameState !== GameState.PLAYING) return;
    
    // Play sound
    playSound('move');
    
    if (holdPiece === null) {
        // First hold - store current piece and get a new one
        holdPiece = player.type;
        playerReset();
    } else {
        // Swap current piece with hold piece
        const tempPiece = player.type;
        player.matrix = createPiece(holdPiece);
        player.type = holdPiece;
        holdPiece = tempPiece;
        
        // Reset position
        player.pos.y = 0;
        player.pos.x = (arenaWidth / 2 | 0) - (player.matrix[0].length / 2 | 0);
    }
    
    // Prevent holding again until next piece
    canHold = false;
    
    // Update hold display
    drawHoldPiece();
}

function getGhostPosition() {
    // Create a ghost position based on current player position
    const ghost = {
        pos: {x: player.pos.x, y: player.pos.y},
        matrix: player.matrix
    };
    
    // Move ghost down until collision
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    
    // Move back up one space (to last valid position)
    ghost.pos.y--;
    
    return ghost;
}

// Create background pattern once instead of redrawing every frame
let backgroundCanvas = document.createElement('canvas');
let backgroundContext = backgroundCanvas.getContext('2d');
backgroundCanvas.width = arenaWidth * 20;
backgroundCanvas.height = arenaHeight * 20;
backgroundContext.scale(20, 20);

function initBackgroundPattern() {
    // Draw a colorful grid background with squares matching block size
    for (let y = 0; y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            // Alternate colors for a more colorful look
            const colorIdx = ((x + y) % (colors.length - 1)) + 1;
            backgroundContext.fillStyle = colors[colorIdx];
            backgroundContext.globalAlpha = 0.18 + 0.07 * ((x + y) % 2); // subtle variation
            backgroundContext.fillRect(x, y, 1, 1);
        }
    }
    
    // Draw grid lines
    backgroundContext.globalAlpha = 1;
    backgroundContext.strokeStyle = 'rgba(255,255,255,0.10)';
    for (let x = 1; x < arenaWidth; x++) {
        backgroundContext.beginPath();
        backgroundContext.moveTo(x, 0);
        backgroundContext.lineTo(x, arenaHeight);
        backgroundContext.stroke();
    }
    for (let y = 1; y < arenaHeight; y++) {
        backgroundContext.beginPath();
        backgroundContext.moveTo(0, y);
        backgroundContext.lineTo(arenaWidth, y);
        backgroundContext.stroke();
    }
    
    // Glossy overlay
    let gradOverlay = backgroundContext.createLinearGradient(0, 0, 0, arenaHeight);
    gradOverlay.addColorStop(0, 'rgba(255,255,255,0.10)');
    gradOverlay.addColorStop(0.2, 'rgba(255,255,255,0.04)');
    gradOverlay.addColorStop(1, 'rgba(255,255,255,0)');
    backgroundContext.fillStyle = gradOverlay;
    backgroundContext.fillRect(0, 0, arenaWidth, arenaHeight);
}

function draw() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw cached background
    context.drawImage(backgroundCanvas, 0, 0);
    
    // Draw arena
    drawMatrix(arena, {x:0, y:0});
    
    // Draw ghost piece
    if (isGameActive && !isPaused) {
        const ghost = getGhostPosition();
        drawGhostMatrix(ghost.matrix, ghost.pos, 'rgba(255, 255, 255, 0.1)');
    }
    
    // Draw player piece
    drawMatrix(player.matrix, player.pos);
    
    // Draw next and hold pieces if contexts are available
    if (isGameActive) {
        try {
            if (!nextContext || !holdContext) {
                debugLog('Contexts not available in draw(), reinitializing canvases');
                initCanvases();
            } else {
                drawNextPiece();
                drawHoldPiece();
            }
        } catch (error) {
            debugLog(`Error drawing next/hold pieces: ${error.message}`);
        }
    }
    
    // Glossy overlay (optional, can be removed for a more flat look)
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
        playSound('drop');
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
    } else {
        playSound('move');
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    
    debugLog(`playerReset called. Current nextPiece: ${nextPiece}`);
    
    // If nextPiece is null (first piece), generate it
    if (nextPiece === null) {
        nextPiece = pieces[pieces.length * Math.random() | 0];
        debugLog(`Generated initial nextPiece: ${nextPiece}`);
    }
    
    // Use the next piece
    player.matrix = createPiece(nextPiece);
    player.type = nextPiece;
    
    debugLog(`Using piece: ${nextPiece}`);
    
    // Generate a new next piece
    nextPiece = pieces[pieces.length * Math.random() | 0];
    
    debugLog(`Generated new nextPiece: ${nextPiece}`);
    
    // Update the next piece display
    drawNextPiece();
    
    // Also update hold piece display to show opacity change
    drawHoldPiece();
    
    // Reset position
    player.pos.y = 0;
    player.pos.x = (arenaWidth / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    // Enable hold again after a new piece
    canHold = true;
    
    // Check for game over
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        playSound('gameOver');
        endGame();
        score = 0;
        updateScore();
    }
    
    // Track statistics
    totalPiecesPlaced++;
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
    playSound('rotate');
}

// Sound effects
const sounds = {};
try {
    sounds.clear = new Audio('sounds/clear.wav');
    sounds.rotate = new Audio('sounds/rotate.wav');
    sounds.move = new Audio('sounds/move.wav');
    sounds.drop = new Audio('sounds/drop.wav');
    sounds.gameOver = new Audio('sounds/gameover.wav');
} catch (error) {
    console.warn('Error loading sound files:', error);
}

// Optional mute functionality
let isMuted = false;
function toggleMute() {
    isMuted = !isMuted;
    document.getElementById('muteBtn').textContent = isMuted ? '🔇' : '🔊';
}

function playSound(sound) {
    if (!isMuted && sounds[sound]) {
        sounds[sound].currentTime = 0;
        sounds[sound].play().catch(err => console.log('Audio play failed:', err));
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
    type: null,
};

function updateScore() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('lines').innerText = 'Lines: ' + linesCleared;
}

function update(time = 0) {
    if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) return; // Stop the game loop if not active
    
    if (gameState === GameState.PAUSED) {
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
    if (gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
        setGameState(GameState.PLAYING);
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'p' || event.key === 'P') {
        if (gameState === GameState.PLAYING) {
            setGameState(GameState.PAUSED);
        } else if (gameState === GameState.PAUSED) {
            setGameState(GameState.PLAYING);
        }
    }
    if (event.key === 'Escape') {
        if (!document.getElementById('pauseBtn').disabled) {
            endGame();
        }
        return;
    }
    if (gameState !== GameState.PLAYING) return;
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
        playSound('drop');
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    } else if (event.key === 'c' || event.key === 'C') {
        // Hold piece
        holdCurrentPiece();
    }
});

// Add event listener for the hold button
document.getElementById('holdBtn').addEventListener('click', () => {
    holdCurrentPiece();
});

function adjustCanvasSize() {
    const container = document.getElementById('playfield-container');
    const maxWidth = container.clientWidth;
    const maxHeight = container.clientHeight;
    
    // Calculate the maximum size while maintaining aspect ratio
    const blockSize = Math.min(
        Math.floor(maxWidth / arenaWidth),
        Math.floor(maxHeight / arenaHeight)
    );
    
    canvas.width = arenaWidth * blockSize;
    canvas.height = arenaHeight * blockSize;
    
    // Re-apply scaling
    context.scale(blockSize, blockSize);
    
    // Also resize the background canvas
    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;
    backgroundContext.scale(blockSize, blockSize);
    
    // Redraw the background
    initBackgroundPattern();
}

window.onload = () => {
    debugLog('Window loaded');
    
    // Initialize mobile detection first
    detectMobile();
    
    // Set up mobile optimizations
    if (isMobileDevice) {
        // Prevent zoom on input focus
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Add mobile-specific styles
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'manipulation';
        
        // Optimize canvas for mobile
        if (canvas) {
            canvas.style.imageRendering = 'pixelated';
            canvas.style.imageRendering = '-moz-crisp-edges';
            canvas.style.imageRendering = 'crisp-edges';
        }
    }
    
    // Initialize global variables
    score = 0;
    level = 1;
    linesCleared = 0;
    isPaused = false;
    isGameActive = false;
    gameState = GameState.IDLE;
    nextPiece = null;
    holdPiece = null;
    canHold = true;
    
    // Ensure controls are visible from the start
    ensureControlsVisible();
    
    // Initialize canvases with retry mechanism
    const maxRetries = 3;
    let retryCount = 0;
    
    function initCanvasesWithRetry() {
        debugLog(`Canvas initialization attempt ${retryCount + 1} of ${maxRetries}`);
        const canvasesInitialized = initCanvases();
        
        if (!canvasesInitialized) {
            retryCount++;
            if (retryCount < maxRetries) {
                // Increase delay with each retry
                const delay = 300 * retryCount;
                debugLog(`Canvas initialization failed, retrying in ${delay}ms`);
                setTimeout(initCanvasesWithRetry, delay);
            } else {
                console.error('Failed to initialize canvases after multiple attempts');
            }
        } else {
            debugLog('Canvas initialization succeeded');
        }
    }
    
    // Start canvas initialization with retry
    initCanvasesWithRetry();
    
    // Reset statistics
    totalPiecesPlaced = 0;
    singleLinesCleared = 0;
    doubleLinesCleared = 0;
    tripleLinesCleared = 0;
    tetrisLinesCleared = 0;
    
    // Initialize UI
    fetchLeaderboard();
    document.getElementById('player-setup').style.display = '';
    document.getElementById('playerNameDisplay').style.display = 'none';
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('score').innerText = 'Score: 0';
    document.getElementById('level').innerText = 'Level: 1';
    document.getElementById('lines').innerText = 'Lines: 0';
    
    // Add hold piece to touch controls
    const touchControls = document.getElementById('touch-controls');
    const existingHoldGroup = document.getElementById('touch-group-hold');
    
    if (!existingHoldGroup) {
        const touchGroupHold = document.createElement('div');
        touchGroupHold.className = 'touch-group';
        touchGroupHold.id = 'touch-group-hold';
        
        const touchHoldBtn = document.createElement('button');
        touchHoldBtn.id = 'touch-hold';
        touchHoldBtn.textContent = '🔄';
        touchHoldBtn.addEventListener('touchstart', e => {
            e.preventDefault();
            holdCurrentPiece();
        });
        
        touchGroupHold.appendChild(touchHoldBtn);
        touchControls.appendChild(touchGroupHold);
    }
    
    // Initialize canvas and touch controls with mobile support
    showTouchControlsIfNeeded();
    setupCanvasGestures();
    setupTouchButtons();
    resizeGameCanvas();
    initBackgroundPattern();
    adjustCanvasSize();
    
    // Final check to ensure controls are visible
    setTimeout(ensureControlsVisible, 500);
}

window.addEventListener('resize', adjustCanvasSize);

// Debug function for game state
function debugGameState() {
    console.log('Game State:', {
        gameState,
        isGameActive,
        isPaused,
        score,
        level,
        linesCleared,
        difficulty,
        dropInterval,
        nextPiece,
        holdPiece,
        canHold,
        totalPiecesPlaced,
        singleLinesCleared,
        doubleLinesCleared,
        tripleLinesCleared,
        tetrisLinesCleared
    });
}

window.debugGame = debugGameState; // Make available in console

// Debug function for game state with canvas info
function debugCanvasState() {
    console.log('Canvas State:', {
        holdCanvas: holdCanvas ? {
            width: holdCanvas.width,
            height: holdCanvas.height,
            style: {
                display: holdCanvas.style.display,
                border: holdCanvas.style.border,
                backgroundColor: holdCanvas.style.backgroundColor
            },
            contextExists: !!holdContext
        } : 'Not initialized',
        nextCanvas: nextCanvas ? {
            width: nextCanvas.width,
            height: nextCanvas.height,
            style: {
                display: nextCanvas.style.display,
                border: nextCanvas.style.border,
                backgroundColor: nextCanvas.style.backgroundColor
            },
            contextExists: !!nextContext
        } : 'Not initialized',
        holdContainer: document.getElementById('hold-piece-container') ? {
            visible: document.getElementById('hold-piece-container').offsetParent !== null,
            childCanvasExists: !!document.getElementById('hold-piece-container').querySelector('canvas')
        } : 'Not found',
        nextContainer: document.getElementById('next-piece-container') ? {
            visible: document.getElementById('next-piece-container').offsetParent !== null,
            childCanvasExists: !!document.getElementById('next-piece-container').querySelector('canvas')
        } : 'Not found'
    });
}

window.debugCanvases = debugCanvasState; // Make available in console

function drawGhostMatrix(matrix, offset, fillStyle) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.save();
                context.fillStyle = fillStyle;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                // Much more transparent border for ghost piece
                context.strokeStyle = 'rgba(34, 34, 34, 0.05)';
                context.lineWidth = 0.08;
                context.strokeRect(x + offset.x + 0.04, y + offset.y + 0.04, 0.92, 0.92);
                context.restore();
            }
        });
    });
}
