# TetrisGhost

This is a modern web-based Tetris game built with HTML, CSS, and JavaScript. It features ghost pieces, sound effects, progressive difficulty, and leaderboard functionality.

## Features

- Ghost piece preview showing where the current piece will land
- Next piece preview to see upcoming piece
- Hold piece functionality to store a piece for later use
- Sound effects for movements, rotations, line clears, and game over
- Progressive difficulty with increasing speed as you level up
- Local leaderboard with score tracking
- Responsive design for desktop and mobile
- Touch controls for mobile devices
- Multiple difficulty levels
- Pause/resume functionality
- Game statistics tracking

## How to Run Locally

1. Open a terminal in this project directory.
2. Start a local web server. If you have Python installed, you can run:

    ```
    python3 -m http.server
    ```

3. Open your browser and go to: http://localhost:8000

## Controls

- Left/Right Arrow: Move
- Up Arrow: Rotate
- Down Arrow: Soft Drop
- Space: Hard Drop
- C: Hold Piece
- P: Pause/Resume
- Esc: End Game

For mobile devices, touch controls are automatically enabled.

## Development

The game is built using vanilla JavaScript without any frameworks. It uses:

- HTML5 Canvas for rendering
- CSS3 for styling
- LocalStorage for saving high scores
- Web Audio API for sound effects

## Sound Credits

Sound effects should be placed in the `sounds` folder. Currently, the following sound files are required:

- clear.wav - For line clears
- rotate.wav - For piece rotation
- move.wav - For piece movement
- drop.wav - For hard drops
- gameover.wav - For game over

Enjoy playing TetrisGhost!
