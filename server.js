const express = require('express');
const path = require('path');
const app = express();

// Get port from environment variable or use 8080 as default
const port = process.env.PORT || 8080;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Set proper MIME types for audio files
app.use('/sounds', express.static(path.join(__dirname, 'sounds'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.wav')) {
            res.setHeader('Content-Type', 'audio/wav');
        }
    }
}));

// Route for the main game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for Azure
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start the server
app.listen(port, () => {
    console.log(`Tetris Ghost game is running on port ${port}`);
    console.log(`Local access: http://localhost:${port}`);
});
