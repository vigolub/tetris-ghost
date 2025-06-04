// Animation effects for Tetris
class Animation {
    static flashLines(lines, callback) {
        // Get the canvas and context
        const canvas = document.getElementById('tetris');
        const context = canvas.getContext('2d');
        const blockSize = canvas.width / arenaWidth;
        
        let flashCount = 0;
        const maxFlashes = 4;
        const flashDelay = 100;
        let isWhite = true;
        
        const flash = () => {
            if (flashCount >= maxFlashes) {
                if (callback) callback();
                return;
            }
            
            // Draw flashing effect
            lines.forEach(y => {
                context.fillStyle = isWhite ? 'white' : 'rgba(255,255,255,0.2)';
                context.fillRect(0, y * blockSize, canvas.width, blockSize);
            });
            
            // Toggle flash state and increment counter
            isWhite = !isWhite;
            flashCount++;
            
            // Schedule next flash
            setTimeout(flash, flashDelay);
        };
        
        // Start animation
        flash();
    }
    
    static levelUpEffect(callback) {
        // Add a level up animation
        const levelElement = document.getElementById('level');
        const originalColor = levelElement.style.color;
        const originalSize = levelElement.style.fontSize;
        
        // Animation sequence
        levelElement.style.transition = 'all 0.3s ease-in-out';
        levelElement.style.color = '#ffe138';
        levelElement.style.fontSize = '1.5em';
        
        // Play sound
        playSound('clear');
        
        // Reset after animation
        setTimeout(() => {
            levelElement.style.fontSize = originalSize;
            
            // Second phase
            setTimeout(() => {
                levelElement.style.color = originalColor;
                levelElement.style.transition = '';
                
                if (callback) callback();
            }, 300);
        }, 300);
    }
    
    static showFloatingText(text, x, y, color = '#ffe138') {
        // Create floating score text
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.position = 'absolute';
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        floatingText.style.color = color;
        floatingText.style.fontWeight = 'bold';
        floatingText.style.fontSize = '1.2em';
        floatingText.style.pointerEvents = 'none';
        floatingText.style.zIndex = '1000';
        floatingText.style.textShadow = '0 0 3px black';
        
        // Add to DOM
        document.body.appendChild(floatingText);
        
        // Animate
        floatingText.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-50px)' }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => {
            document.body.removeChild(floatingText);
        };
    }
}

// Export to global scope
window.Animation = Animation;
