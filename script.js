/**
 * Eye Drop Invaders - Educational Game Logic
 *
 * Author: Dr Mahmoud hesham
 * Date: 2025-04-17
 * Version: 1.2 (Includes debugging logs and fixes)
 */

// Wrap the entire script in DOMContentLoaded to ensure the HTML is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Finding elements...");

    // --- DOM Elements ---
    const gameContainer = document.getElementById('game-container');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const gameArea = document.getElementById('game-area');
    const playerElement = document.getElementById('player');
    const shotSelectionButtons = document.querySelectorAll('.shot-btn');
    const moveLeftButton = document.getElementById('move-left');
    const moveRightButton = document.getElementById('move-right');
    const shootButton = document.getElementById('shoot-btn');
    const finalScoreDisplay = document.getElementById('final-score');
    const correctAnswersDisplay = document.getElementById('correct-answers');
    const wrongAnswersDisplay = document.getElementById('wrong-answers');
    const badgeDisplay = document.getElementById('badge-name');
    const badgeImage = document.getElementById('badge-image');
    const playAgainButton = document.getElementById('play-again-btn');

    // --- Check if critical elements were found ---
    if (!playerElement || !gameArea || !scoreDisplay || !timerDisplay || !startScreen || !gameScreen || !endScreen) {
        document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Error: Failed to load game elements. Please check the HTML structure and element IDs.</h1>';
        return;
    }

    // --- Game State Variables ---
    let score = 0;
    let timeLeft = 180;
    let gameInterval = null;
    let timerInterval = null;
    let enemySpawnInterval = null;
    let isGameOver = false;
    let playerX = 50;
    let shots = [];
    let enemies = [];
    let selectedShotType = 'lubricant';
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let difficulty = 'medium';
    let touchStartX = null;
    let maxHealth = 100;
    let currentHealth = maxHealth;
    let isMovingLeft = false; // Added for hold movement
    let isMovingRight = false; // Added for hold movement

    // --- Game Configuration ---
    const gameWidth = () => gameArea.offsetWidth;
    const gameHeight = () => gameArea.offsetHeight;
    const playerSpeed = 2;
    const shotSpeed = 8;
    const enemySpeed = { easy: 0.5, medium: 1, hard: 1.5 };
    const enemySpawnRate = { easy: 7000, medium: 5000, hard: 3000 };
    const pointsCorrect = 100;
    const pointsWrong = -20;
    currentHealth = maxHealth;
updateHealthDisplay();

// Add new function
    function updateHealthDisplay() {
        const healthBar = document.getElementById('health-bar');
        if (healthBar) {
            healthBar.style.width = `${(currentHealth / maxHealth) * 100}%`;
        }
    }

    const enemyTypes = [
        { type: 'dry-eye', label: 'Dry eye', correctShot: 'lubricant', color: '#17a2b8' },
        { type: 'allergic-conjunctivitis', label: 'Conjunctivitis', correctShot: 'antihistaminic', color: '#ffc107' },
        { type: 'sore-eye', label: 'Sore eye', correctShot: 'decongestant', color: '#fd7e14' },
        { type: 'red-eyes', label: 'Rhinitis', correctShot: 'cs', color: '#dc3545' },
        { type: 'glaucoma', label: 'Glaucoma', correctShot: 'ts', color: '#6f42c1' }
    ];

    const shotTypes = {
        'lubricant': { color: '#ADD8E6' },
        'antihistaminic': { color: '#FFD700' },
        'decongestant': { color: '#FFA07A' },
        'cs': { color: '#F08080' },
        'ts': { color: '#9370DB' }
    };

    // --- Initialization ---
    function init() {
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                difficulty = button.getAttribute('data-difficulty');
                startGame();
            });
        });

        shotSelectionButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedShotType = button.getAttribute('data-shot-type');
                updateSelectedShotButton();
            });
        });
        updateSelectedShotButton();

        // Modified movement controls
        function startMoving(direction) {
            if (isGameOver) return;
            if (direction === 'left') isMovingLeft = true;
            if (direction === 'right') isMovingRight = true;
        }

        function stopMoving(direction) {
            if (direction === 'left') isMovingLeft = false;
            if (direction === 'right') isMovingRight = false;
        }

        // Left Button
        moveLeftButton.addEventListener('mousedown', () => startMoving('left'));
        moveLeftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startMoving('left');
        });
        moveLeftButton.addEventListener('mouseup', () => stopMoving('left'));
        moveLeftButton.addEventListener('mouseleave', () => stopMoving('left'));
        moveLeftButton.addEventListener('touchend', () => stopMoving('left'));

        // Right Button
        moveRightButton.addEventListener('mousedown', () => startMoving('right'));
        moveRightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startMoving('right');
        });
        moveRightButton.addEventListener('mouseup', () => stopMoving('right'));
        moveRightButton.addEventListener('mouseleave', () => stopMoving('right'));
        moveRightButton.addEventListener('touchend', () => stopMoving('right'));

        shootButton.addEventListener('click', shoot);
        document.addEventListener('keydown', handleKeyDown);

        gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameArea.addEventListener('touchend', handleTouchEnd);
        playAgainButton.addEventListener('click', resetGame);

        showScreen('start');
    }

    // --- Screen Management ---
    function showScreen(screenId) {
        console.log(`Switching to screen: ${screenId}-screen`);
        // Hide all screens first
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        // Show the target screen
        const targetScreen = document.getElementById(`${screenId}-screen`);
        if (targetScreen) {
             targetScreen.classList.add('active');
        } else {
            console.error(`Screen element not found: ${screenId}-screen`);
        }
    }

    // --- Game Start ---
    function startGame() {
        console.log("startGame() called. Difficulty:", difficulty); // Verify game start & difficulty
        isGameOver = false; // Explicitly set false
        score = 0;
        timeLeft = 180; // Reset timer
        correctAnswers = 0;
        wrongAnswers = 0;
        shots = []; // Clear previous shots
        enemies = []; // Clear previous enemies
        playerX = 50; // Reset player position percentage

        // Clear previous game elements from gameArea
        // Avoid removing the player element itself if it's already in gameArea
        while (gameArea.firstChild && gameArea.firstChild !== playerElement) {
            console.log("Removing old element:", gameArea.firstChild);
            gameArea.removeChild(gameArea.firstChild);
        }
         // Ensure playerElement is a child of gameArea
        if (playerElement.parentNode !== gameArea) {
             console.log("Adding playerElement to gameArea");
            gameArea.appendChild(playerElement);
        }

        console.log("Game state reset. PlayerX:", playerX);

        updatePlayerPosition(); // Set initial position visually
        updateScore();
        updateTimerDisplay(); // Display initial time

        showScreen('game');

        // Start intervals
        console.log("Starting game intervals...");
        // Clear previous intervals defensively
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        clearInterval(enemySpawnInterval);

        gameInterval = setInterval(gameLoop, 1000 / 60); // ~60 FPS
        timerInterval = setInterval(updateTimer, 1000);
        enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate[difficulty]);
        console.log("Intervals started. Game loop:", gameInterval, "Timer:", timerInterval, "Enemy Spawn:", enemySpawnInterval);
    }

    // --- Game Loop (Update and Render) ---
    function gameLoop() {
        if (isGameOver) return;

        // Handle continuous movement
        if (isMovingLeft) movePlayer('left');
        if (isMovingRight) movePlayer('right');

        moveShots();
        moveEnemies();
        checkCollisions();
        removeOffscreenElements();
    }

    // --- Timer ---
    function updateTimer() {
        if (isGameOver) return; // Stop timer updates if game over
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            console.log("Time's up! Ending game.");
            endGame();
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        // Ensure timerDisplay element exists before updating
        if (timerDisplay) {
            timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // This shouldn't happen if the initial check passed, but good for robustness
            console.error("timerDisplay element not found during update!");
        }
    }

    // --- Score ---
    function updateScore() {
         if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
         } else {
            console.error("scoreDisplay element not found during update!");
         }
    }

    // --- Player Movement ---
    function movePlayer(direction) {
        console.log("movePlayer called with direction:", direction, "isGameOver:", isGameOver); // Log function call
        if (isGameOver) return;

        const gameW = gameWidth(); // Get current width
         if (!gameW || gameW <= 0) {
             console.error("Cannot move player: Game width is zero or invalid!", gameW);
             return; // Prevent division by zero or weird behavior
         }
         const playerW = playerElement.offsetWidth;
         // Calculate player's half-width as a percentage of the game area width
         const playerHalfWidthPercent = (playerW / gameW * 50); // Corrected: (width / totalWidth) * 100 / 2 => width/totalWidth * 50

        if (direction === 'left') {
            playerX -= playerSpeed;
        } else if (direction === 'right') {
            playerX += playerSpeed;
        }

        // Clamp player position using calculated percentage width
        // Ensure player center stays within bounds
        playerX = Math.max(playerHalfWidthPercent, Math.min(100 - playerHalfWidthPercent, playerX));
        console.log("Calculated new playerX:", playerX); // Log calculated position

        updatePlayerPosition();
    }

    function updatePlayerPosition() {
        // Check if playerElement exists before styling
        if (playerElement) {
             // console.log("Updating player style.left to:", playerX + "%"); // Log style update - can be spammy
             playerElement.style.left = `${playerX}%`;
             // transform: translateX(-50%) in CSS handles centering based on the left percentage
        } else {
            console.error("updatePlayerPosition: playerElement is null!");
        }
    }

    // --- Shooting ---
    function shoot() {
        console.log("Shoot function entered. isGameOver:", isGameOver); // Log function entry
        if (isGameOver) {
             console.log("Shoot prevented: Game Over.");
             return;
        }
        console.log("Executing shoot. Selected type:", selectedShotType);

        const shot = document.createElement('div');
        shot.classList.add('shot', selectedShotType); // Apply base and type-specific class

        // --- Position Calculation ---
        // Define shot dimensions based on CSS
        const shotWidth = 8;
        const shotHeight = 15;

        // Calculate center of the player's top edge relative to the gameArea's coordinate system
        // playerElement.offsetLeft gives position relative to gameArea (offsetParent)
        // playerElement.offsetWidth gives the player's rendered width
        const playerTopCenterX = playerElement.offsetLeft + playerElement.offsetWidth / 2;

        // Initial position for the shot (centered above the player's top edge)
        const shotX = playerTopCenterX - shotWidth / 2;
        const shotY = playerElement.offsetTop - shotHeight; // Start just above the player

        // Apply styles
        shot.style.left = `${shotX}px`;
        shot.style.top = `${shotY}px`;
        // Explicit dimensions (optional if CSS is reliable, but safer)
        shot.style.width = `${shotWidth}px`;
        shot.style.height = `${shotHeight}px`;

        // Add to DOM and array
        gameArea.appendChild(shot);
        shots.push({ element: shot, type: selectedShotType, x: shotX, y: shotY });

        console.log("Shot created and added:", { x: shotX, y: shotY, type: selectedShotType }, "DOM element:", shot); // Debug log
        // console.log("Current shots array:", shots); // Can be spammy
    }


    function updateSelectedShotButton() {
        shotSelectionButtons.forEach(btn => {
            if (btn.getAttribute('data-shot-type') === selectedShotType) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        console.log("Updated selected shot button highlight for:", selectedShotType);
    }

    // --- Enemy Spawning and Movement ---
    function spawnEnemy() {
        if (isGameOver) return;

        const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = document.createElement('div');
        enemy.classList.add('enemy', randomEnemyType.type); // Apply base and type class
        enemy.textContent = randomEnemyType.label; // Display short label

        // Define enemy dimensions (should match CSS)
        const enemyWidth = 45; // Approx width from CSS
        const gameW = gameWidth();
        if (!gameW || gameW <= 0) {
            console.error("Cannot spawn enemy: Game area width is invalid.");
            return;
        }

        // Random horizontal position within bounds
        const spawnX = Math.random() * (gameW - enemyWidth);
        const spawnY = -60; // Start slightly further above the screen

        enemy.style.left = `${spawnX}px`;
        enemy.style.top = `${spawnY}px`;

        gameArea.appendChild(enemy);
        enemies.push({
            element: enemy,
            type: randomEnemyType.type,
            correctShot: randomEnemyType.correctShot,
            x: spawnX,
            y: spawnY
        });
        // console.log("Spawned enemy:", randomEnemyType.type, "at", spawnX, spawnY); // Can be spammy
    }
    function moveEnemies() {
    const currentEnemySpeed = enemySpeed[difficulty];
    const gameH = gameHeight();

    // Iterate backwards for safe removal
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += currentEnemySpeed;
        enemy.element.style.top = `${enemy.y}px`;

        // Check if enemy reached bottom
        if (gameH > 0 && enemy.y + enemy.element.offsetHeight > gameH) {
            console.log("Enemy reached bottom:", enemy.type);
            
            // Add health penalty here
            currentHealth -= 15; // Penalty amount
            currentHealth = Math.max(0, currentHealth);
            updateHealthDisplay();
            
            // Check for game over
            if (currentHealth <= 0) {
                endGame();
            }
            
            removeElement(enemy.element);
            enemies.splice(i, 1);
        }
    }
}

    function moveShots() {
        // Iterate backwards for safe removal while iterating
        for (let i = shots.length - 1; i >= 0; i--) {
            const shot = shots[i];
            shot.y -= shotSpeed;
            shot.element.style.top = `${shot.y}px`;

            // Check for off-screen removal here as well
            if (shot.y < -shot.element.offsetHeight) {
                // console.log("Removing off-screen shot");
                removeElement(shot.element);
                shots.splice(i, 1);
            }
        }
    }

    function moveEnemies() {
        const currentEnemySpeed = enemySpeed[difficulty];
        const gameH = gameHeight();
    
        // Iterate backwards for safe removal
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.y += currentEnemySpeed;
            enemy.element.style.top = `${enemy.y}px`;
    
            // Check if enemy reached bottom
            if (gameH > 0 && enemy.y + enemy.element.offsetHeight > gameH) {
                console.log("Enemy reached bottom:", enemy.type);
                
                // Add health penalty here
                currentHealth -= 15; // Penalty amount
                currentHealth = Math.max(0, currentHealth);
                updateHealthDisplay();
                
                // Check for game over
                if (currentHealth <= 0) {
                    endGame();
                }
                
                removeElement(enemy.element);
                enemies.splice(i, 1);
            }
        }
    }

    // --- Collision Detection ---
    function checkCollisions() {
        // Iterate backwards through shots and enemies for safe removal
        for (let i = shots.length - 1; i >= 0; i--) {
            const shot = shots[i];
            let shotRemoved = false; // Flag to prevent removing shot multiple times if it hits multiple enemies at once (rare)

            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];

                if (isColliding(shot.element, enemy.element)) {
                    console.log("Collision detected between shot:", shot.type, "and enemy:", enemy.type);
                    handleCollision(shot, enemy);

                    // Remove enemy
                    removeElement(enemy.element);
                    enemies.splice(j, 1);

                    // Remove shot (only once per shot)
                    if (!shotRemoved) {
                        removeElement(shot.element);
                        shots.splice(i, 1);
                        shotRemoved = true;
                    }
                    // Since shot is removed, break inner loop for this shot
                    break;
                }
            }
        }
    }

    function isColliding(el1, el2) {
        // Ensure elements exist before getting rect
        if (!el1 || !el2) return false;
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    function handleCollision(shot, enemy) {
        // Check if shot type is correct
        if (shot.type === enemy.correctShot) {
            console.log("Correct hit!");
            score += pointsCorrect;
            correctAnswers++;
        } else {
            console.log("Wrong hit! Shot:", shot.type, "Needed:", enemy.correctShot);
            score += pointsWrong; // Penalty
            wrongAnswers++;
        }

        // Ensure score doesn't go below zero
        score = Math.max(0, score);
        updateScore(); // Update score display immediately

        // Visual explosion effect (optional)
        // Use enemy's current position for explosion
        const enemyRect = enemy.element.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        const explosionX = enemyRect.left - gameAreaRect.left + enemyRect.width / 2;
        const explosionY = enemyRect.top - gameAreaRect.top + enemyRect.height / 2;
        createExplosion(explosionX, explosionY, enemy.element.style.backgroundColor || 'orange');
    }

    function createExplosion(x, y, color) {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        // Center the explosion div on the impact point
        explosion.style.left = `${x - 15}px`;
        explosion.style.top = `${y - 15}px`;
        explosion.style.width = '30px';
        explosion.style.height = '30px';
        explosion.style.borderRadius = '50%';
        explosion.style.backgroundColor = color;
        explosion.style.opacity = '0.7';
        explosion.style.zIndex = '6'; // Ensure explosion is visible above player/enemies
        explosion.classList.add('explosion'); // Apply CSS animation
        gameArea.appendChild(explosion);

        // Remove explosion element after animation completes
        setTimeout(() => {
            removeElement(explosion);
        }, 300); // Match animation duration in CSS
    }


    // --- Element Removal ---
    function removeOffscreenElements() {
        // Note: Offscreen shots are now handled in moveShots()
        // Note: Offscreen enemies are now handled in moveEnemies()
        // This function could be used for other cleanup if needed later.
    }

    function removeElement(element) {
        if (element && element.parentNode) {
            // console.log("Removing element:", element); // Can be spammy
            element.parentNode.removeChild(element);
        }
    }

    // --- Input Handling ---
    function handleKeyDown(e) {
        // Log outside the isGameOver check to see all key presses
        console.log("Key pressed:", e.key, "isGameOver:", isGameOver);
        if (isGameOver) {
             // console.log("Game is over, ignoring key press.");
             return;
        }
        switch (e.key) {
            case 'ArrowLeft':
            case 'a': // WASD controls optional
                // console.log("ArrowLeft/a detected for move");
                movePlayer('left');
                e.preventDefault(); // Prevent potential page scroll
                break;
            case 'ArrowRight':
            case 'd':
                // console.log("ArrowRight/d detected for move");
                movePlayer('right');
                e.preventDefault(); // Prevent potential page scroll
                break;
            case ' ': // Space bar
            case 'Enter':
                 console.log("Space/Enter detected for shoot");
                shoot();
                e.preventDefault(); // Prevent space scrolling page or Enter submitting forms
                break;
            // Optional: Number keys to select shots
            case '1': selectShotByIndex(0); break;
            case '2': selectShotByIndex(1); break;
            case '3': selectShotByIndex(2); break;
            case '4': selectShotByIndex(3); break;
            case '5': selectShotByIndex(4); break;
        }
    }

    function selectShotByIndex(index) {
         if (isGameOver) return;
         if (index >= 0 && index < shotSelectionButtons.length) {
             const button = shotSelectionButtons[index];
             selectedShotType = button.getAttribute('data-shot-type');
             console.log("Shot selected by key:", index + 1, "Type:", selectedShotType);
             updateSelectedShotButton();
         }
    }

    // --- Touch Controls Logic ---
    function handleTouchStart(e) {
        console.log("Touch Start detected. Touches:", e.touches.length);
        if (isGameOver || e.touches.length !== 1) return;
        // Check if touch is on a button within the game area (unlikely but possible)
        if (e.target.closest('button')) {
             console.log("Touch started on a button, ignoring for player move.");
             return;
        }

        touchStartX = e.touches[0].clientX;
        console.log("Touch Start X:", touchStartX);
        e.preventDefault(); // Prevent default scroll/zoom behavior ONLY if touch is not on a button
    }

    function handleTouchMove(e) {
        // console.log("Touch Move detected. Touches:", e.touches.length); // Spammy
        if (isGameOver || touchStartX === null || e.touches.length !== 1) return;

        const touchCurrentX = e.touches[0].clientX;
        const deltaX = touchCurrentX - touchStartX;
        // console.log("Touch Move deltaX:", deltaX); // Spammy

        // --- More direct player position update based on touch position ---
        const gameW = gameWidth();
        if (!gameW || gameW <= 0) return; // Need game width

        // Calculate the touch position as a percentage of the game width
        const touchXPercent = (touchCurrentX - gameArea.getBoundingClientRect().left) / gameW * 100;

        // Update playerX directly to the touch percentage, clamped
        const playerW = playerElement.offsetWidth;
        const playerHalfWidthPercent = (playerW / gameW * 50);
        playerX = Math.max(playerHalfWidthPercent, Math.min(100 - playerHalfWidthPercent, touchXPercent));

        updatePlayerPosition();

        // We don't update touchStartX here, movement is based on current touch position, not delta
        // touchStartX = touchCurrentX; // Remove this line for direct position control

        e.preventDefault(); // Prevent scroll/zoom during drag
    }

     function handleTouchEnd(e) {
         console.log("Touch End detected.");
         touchStartX = null; // Reset starting touch position
     }


    // --- Game End ---
    function endGame() {
        console.log("endGame() called.");
        if (isGameOver) {
            console.log("endGame called but game already over.");
            return; // Prevent running multiple times
        }

        isGameOver = true;
        console.log("Setting isGameOver = true");

        // Stop all game intervals
        console.log("Clearing intervals:", gameInterval, timerInterval, enemySpawnInterval);
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        clearInterval(enemySpawnInterval);
        gameInterval = null; // Clear interval IDs
        timerInterval = null;
        enemySpawnInterval = null;

        // Optional: Clear remaining elements visually after a short delay?
        // setTimeout(() => {
        //     enemies.forEach(e => removeElement(e.element));
        //     shots.forEach(s => removeElement(s.element));
        //     enemies = [];
        //     shots = [];
        // }, 500); // Delay to let player see final state


        // Calculate Badge
        const totalAnswers = correctAnswers + wrongAnswers;
        const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        let badgeName = 'Novice';
        let badgeImgSrc = 'novice.png'; // Placeholder paths

        // Define badge thresholds (adjust as needed)
        const legendScore = 3000;
        const heroScore = 1000;
        const legendAcc = 80;
        const heroAcc = 60;

        if (score >= legendScore && accuracy >= legendAcc) {
            badgeName = 'Legend';
            badgeImgSrc = 'superhero.png';
        } else if (score >= heroScore && accuracy >= heroAcc) {
            badgeName = 'Hero';
            badgeImgSrc = 'hero.png';
        }
        console.log(`Score: ${score}, Accuracy: ${accuracy.toFixed(1)}%, Badge: ${badgeName}`);

        // Display End Screen with results
        if(finalScoreDisplay) finalScoreDisplay.textContent = `Final Score: ${score}`;
        if(correctAnswersDisplay) correctAnswersDisplay.textContent = `Correct Shots: ${correctAnswers}`;
        if(wrongAnswersDisplay) wrongAnswersDisplay.textContent = `Wrong Shots: ${wrongAnswers}`;
        if(badgeDisplay) badgeDisplay.textContent = badgeName;
        if(badgeImage) {
            badgeImage.src = badgeImgSrc;
            badgeImage.alt = `${badgeName} Badge`;
        } else {
            console.warn("Badge image element not found.");
        }


        showScreen('end');
    }

    // --- Reset Game ---
    function resetGame() {
         console.log("resetGame() called.");
         // Ensure game over state is handled if reset is called unexpectedly
         if (!isGameOver) {
             console.warn("Resetting game before it was over. Clearing intervals.");
             clearInterval(gameInterval);
             clearInterval(timerInterval);
             clearInterval(enemySpawnInterval);
             gameInterval = null;
             timerInterval = null;
             enemySpawnInterval = null;
         }

         // Clear leftover elements from the game area
         enemies.forEach(e => removeElement(e.element));
         shots.forEach(s => removeElement(s.element));
         // Also clear any explosions that might be mid-animation
         gameArea.querySelectorAll('.explosion').forEach(exp => removeElement(exp));

         enemies = []; // Reset arrays
         shots = [];

         // Reset game state variables explicitly
         score = 0;
         timeLeft = 180;
         correctAnswers = 0;
         wrongAnswers = 0;
         playerX = 50;
         selectedShotType = 'lubricant'; // Reset to default
         isGameOver = false; // Ensure game is ready to start again

         console.log("Game reset complete. Switching to start screen.");
         showScreen('start'); // Go back to start screen
         updateSelectedShotButton(); // Update button visuals
    }


    // --- Start the application ---
    console.log("Running init()...");
    init(); // Call initialization function to set everything up
    console.log("Initialization complete. Waiting for player interaction.");

}); // End of DOMContentLoaded
// 
// 