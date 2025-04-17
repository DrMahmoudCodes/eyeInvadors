/**
 * Eye Drop Invaders - Educational Game Logic
 *
 * Author: Gemini AI Assistant
 * Date: 2025-04-16
 * Version: 1.2 (Includes debugging logs and fixes)
 */

// Wrap the entire script in DOMContentLoaded to ensure the HTML is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Finding elements..."); // Verify DOMContentLoaded fires

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
    console.log("Elements:", { gameContainer, startScreen, gameScreen, endScreen, scoreDisplay, timerDisplay, gameArea, playerElement, shootButton, moveLeftButton, moveRightButton, playAgainButton });
    if (!playerElement || !gameArea || !scoreDisplay || !timerDisplay || !startScreen || !gameScreen || !endScreen) {
        console.error("CRITICAL: One or more essential HTML elements not found! Check IDs in index.html.");
        // Display an error message to the user on the page itself
        document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Error: Failed to load game elements. Please check the HTML structure and element IDs.</h1>';
        return; // Stop script execution if core elements are missing
    }

    // --- Game State Variables ---
    let score = 0;
    let timeLeft = 180; // 3 minutes in seconds
    let gameInterval = null; // Use null initially
    let timerInterval = null;
    let enemySpawnInterval = null;
    let isGameOver = false;
    let playerX = 50; // Player position percentage
    let shots = []; // Array to hold active shot objects { element, type, x, y }
    let enemies = []; // Array to hold active enemy objects { element, type, correctShot, x, y }
    let selectedShotType = 'lubricant'; // Default shot type
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let difficulty = 'medium'; // Default difficulty
    let touchStartX = null; // For touch controls

    // --- Game Configuration ---
    // Use functions to get dimensions dynamically if needed, ensures up-to-date values
    const gameWidth = () => gameArea.offsetWidth;
    const gameHeight = () => gameArea.offsetHeight;
    const playerSpeed = 2; // Percentage move per input trigger
    const shotSpeed = 8; // Pixels per frame
    const enemySpeed = { easy: 0.5, medium: 1, hard: 1.5 }; // Pixels per frame
    const enemySpawnRate = { easy: 7000, medium: 5000, hard: 3000 }; // Milliseconds
    const pointsCorrect = 100;
    const pointsWrong = -20; // Penalty for wrong shot

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
        console.log("init() called. Adding listeners..."); // Verify init runs

        // Add event listeners for difficulty selection
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log("Difficulty button clicked:", button.getAttribute('data-difficulty'));
                difficulty = button.getAttribute('data-difficulty');
                startGame();
            });
        });

        // Add event listeners for shot selection
        shotSelectionButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedShotType = button.getAttribute('data-shot-type');
                console.log("Shot selection button clicked. New type:", selectedShotType);
                updateSelectedShotButton();
            });
        });
        updateSelectedShotButton(); // Set initial selection highlight

        // --- Player Movement Listeners ---
        document.addEventListener('keydown', handleKeyDown);
        console.log("Added keydown listener to document.");

        moveLeftButton.addEventListener('click', () => {
             console.log("Move Left Button Clicked"); // Verify button click
             movePlayer('left');
        });
        moveRightButton.addEventListener('click', () => {
            console.log("Move Right Button Clicked"); // Verify button click
            movePlayer('right');
        });
        console.log("Added click listeners to move buttons.");

        // --- Shooting Listener ---
        shootButton.addEventListener('click', () => {
            console.log("Shoot Button Clicked"); // Verify button click
            shoot();
        });
        console.log("Added click listener to shoot button.");

        // --- Touch Listeners ---
         gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
         gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
         gameArea.addEventListener('touchend', handleTouchEnd);
         console.log("Added touch listeners to gameArea.");

        // --- Play Again Listener ---
        playAgainButton.addEventListener('click', resetGame);
        console.log("Added click listener to play again button.");

        console.log("Initial game state:", { score, timeLeft, isGameOver, playerX, selectedShotType, difficulty });
        showScreen('start'); // Show start screen initially
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
        // Add a throttled log to check if it runs without flooding the console
        // if (Math.random() < 0.01) console.log("Game loop tick. isGameOver:", isGameOver);
        if (isGameOver) return; // Stop updates if game over

        // Core game updates
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
                 // Optional: Deduct score or implement game over condition here
                 // score -= 50;
                 // score = Math.max(0, score);
                 // updateScore();
                 removeElement(enemy.element);
                 enemies.splice(i, 1);
                 // endGame(); // Uncomment if enemies reaching bottom ends the game
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
        let badgeImgSrc = 'novice_badge.png'; // Placeholder paths

        // Define badge thresholds (adjust as needed)
        const legendScore = 5000;
        const heroScore = 2000;
        const legendAcc = 80;
        const heroAcc = 60;

        if (score >= legendScore && accuracy >= legendAcc) {
            badgeName = 'Legend';
            badgeImgSrc = 'legend_badge.png';
        } else if (score >= heroScore && accuracy >= heroAcc) {
            badgeName = 'Hero';
            badgeImgSrc = 'hero_badge.png';
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
// // --- Add near the top ---
// console.log("Script loaded. Initializing...");

// document.addEventListener('DOMContentLoaded', () => {
//     console.log("DOM Loaded. Finding elements..."); // Verify DOMContentLoaded fires

//     // --- DOM Elements ---
//     const gameContainer = document.getElementById('game-container');
//     // ... (other elements)
//     const playerElement = document.getElementById('player');
//     // ... (other elements)
//     const shootButton = document.getElementById('shoot-btn');
//     const moveLeftButton = document.getElementById('move-left');
//     const moveRightButton = document.getElementById('move-right');


//     // --- Check if elements were found ---
//     console.log("Elements:", { playerElement, shootButton, moveLeftButton, moveRightButton, gameArea });
//     if (!playerElement || !gameArea) {
//         console.error("CRITICAL: Player or Game Area element not found!");
//         return; // Stop if core elements are missing
//     }

//     // ... (rest of variables)
//     let isGameOver = false; // Ensure it starts false
//     console.log("Initial game state:", { score, timeLeft, isGameOver, playerX, selectedShotType, difficulty });


//     // --- In init() or where listeners are added ---
//     function init() {
//         console.log("init() called. Adding listeners..."); // Verify init runs
//         // ... (difficulty button listeners)

//         // --- Player Movement Listeners ---
//         document.addEventListener('keydown', handleKeyDown);
//         console.log("Added keydown listener to document.");

//         moveLeftButton.addEventListener('click', () => {
//              console.log("Move Left Button Clicked"); // Verify button click
//              movePlayer('left');
//         });
//         moveRightButton.addEventListener('click', () => {
//             console.log("Move Right Button Clicked"); // Verify button click
//             movePlayer('right');
//         });
//         console.log("Added click listeners to move buttons.");

//         // --- Shooting Listener ---
//         shootButton.addEventListener('click', () => {
//             console.log("Shoot Button Clicked"); // Verify button click
//             shoot();
//         });
//         console.log("Added click listener to shoot button.");

//         // --- Touch Listeners ---
//          gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
//          gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
//          gameArea.addEventListener('touchend', handleTouchEnd);
//          console.log("Added touch listeners to gameArea.");

//         // ... (rest of init)
//         showScreen('start');
//     }


//     // --- Inside handleKeyDown ---
//     function handleKeyDown(e) {
//         console.log("Key pressed:", e.key, "isGameOver:", isGameOver); // Log key press
//         if (isGameOver) {
//              console.log("Game is over, ignoring key press.");
//              return;
//         }
//         switch (e.key) {
//             case 'ArrowLeft':
//             case 'a':
//                 console.log("ArrowLeft/a detected");
//                 movePlayer('left');
//                 break;
//             case 'ArrowRight':
//             case 'd':
//                  console.log("ArrowRight/d detected");
//                 movePlayer('right');
//                 break;
//             case ' ': // Space bar
//             case 'Enter':
//                  console.log("Space/Enter detected");
//                 shoot();
//                 e.preventDefault();
//                 break;
//              // ... (number keys)
//         }
//     }

//     // --- Inside movePlayer ---
//     function movePlayer(direction) {
//         console.log("movePlayer called with direction:", direction, "isGameOver:", isGameOver); // Log function call
//         if (isGameOver) return;

//         const gameW = gameWidth(); // Get width inside function
//          if (!gameW) {
//              console.error("Game width is zero or invalid!");
//              return;
//          }
//          const playerW = playerElement.offsetWidth;
//          const playerHalfWidthPercent = (playerW / gameW * 100) / 2; // Calculate half-width percentage

//         if (direction === 'left') {
//             playerX -= playerSpeed;
//         } else if (direction === 'right') {
//             playerX += playerSpeed;
//         }

//         // Clamp player position using calculated percentage width
//         playerX = Math.max(playerHalfWidthPercent, Math.min(100 - playerHalfWidthPercent, playerX));
//         console.log("New playerX:", playerX); // Log calculated position

//         updatePlayerPosition();
//     }

//     // --- Inside updatePlayerPosition ---
//     function updatePlayerPosition() {
//         // Check if playerElement exists before styling
//         if (playerElement) {
//              console.log("Updating player style.left to:", playerX + "%"); // Log style update
//              playerElement.style.left = `${playerX}%`;
//         } else {
//             console.error("updatePlayerPosition: playerElement is null!");
//         }
//     }


//     // --- Inside shoot() ---
//     // Keep the debug logs from the previous step inside shoot() as well
//     function shoot() {
//         console.log("Shoot function entered. isGameOver:", isGameOver); // Log function entry
//         if (isGameOver) return;
//         console.log("Shoot triggered. Selected type:", selectedShotType);

//         // ... (rest of the shoot function from the previous step)
//         // Make sure the console.log statements added previously are still there
//     }

//     // --- Game Start ---
//     function startGame() {
//         console.log("startGame() called."); // Verify game start
//         isGameOver = false; // Explicitly set false
//         score = 0;
//         // ... (reset other variables)
//         playerX = 50; // Reset player position percentage

//         // ... (clear elements)
//         console.log("Adding playerElement back to gameArea");
//         gameArea.appendChild(playerElement); // Ensure player is re-added if cleared

//         updatePlayerPosition(); // Set initial position visually
//         updateScore();
//         updateTimerDisplay();

//         showScreen('game');

//         // Start intervals
//         console.log("Starting game intervals...");
//         // Clear previous intervals just in case
//         clearInterval(gameInterval);
//         clearInterval(timerInterval);
//         clearInterval(enemySpawnInterval);

//         gameInterval = setInterval(gameLoop, 1000 / 60);
//         timerInterval = setInterval(updateTimer, 1000);
//         enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate[difficulty]);
//         console.log("Intervals started.");
//     }

//      // --- Game Loop ---
//      function gameLoop() {
//          // Add a throttled log to check if it runs without flooding
//          // if (Math.random() < 0.01) console.log("Game loop tick");
//          if (isGameOver) return;

//          moveShots();
//          moveEnemies();
//          checkCollisions();
//          removeOffscreenElements();
//      }

//     // ... (rest of your script.js code)

//     console.log("Running init()...");
//     init(); // Make sure init is called
// });
// document.addEventListener('DOMContentLoaded', () => {
//     // --- DOM Elements ---
//     const gameContainer = document.getElementById('game-container');
//     const startScreen = document.getElementById('start-screen');
//     const gameScreen = document.getElementById('game-screen');
//     const endScreen = document.getElementById('end-screen');
//     const difficultyButtons = document.querySelectorAll('.difficulty-btn');
//     const scoreDisplay = document.getElementById('score');
//     const timerDisplay = document.getElementById('timer');
//     const gameArea = document.getElementById('game-area');
//     const playerElement = document.getElementById('player');
//     const shotSelectionButtons = document.querySelectorAll('.shot-btn');
//     const moveLeftButton = document.getElementById('move-left');
//     const moveRightButton = document.getElementById('move-right');
//     const shootButton = document.getElementById('shoot-btn');
//     const finalScoreDisplay = document.getElementById('final-score');
//     const correctAnswersDisplay = document.getElementById('correct-answers');
//     const wrongAnswersDisplay = document.getElementById('wrong-answers');
//     const badgeDisplay = document.getElementById('badge-name');
//     const badgeImage = document.getElementById('badge-image'); // Assuming you have badge images
//     const playAgainButton = document.getElementById('play-again-btn');

//     // --- Game State Variables ---
//     let score = 0;
//     let timeLeft = 180; // 3 minutes in seconds
//     let gameInterval;
//     let timerInterval;
//     let enemySpawnInterval;
//     let isGameOver = false;
//     let playerX = 50; // Player position percentage
//     let shots = []; // Array to hold active shot objects { element, type, x, y }
//     let enemies = []; // Array to hold active enemy objects { element, type, correctShot, x, y }
//     let selectedShotType = 'lubricant'; // Default shot type
//     let correctAnswers = 0;
//     let wrongAnswers = 0;
//     let difficulty = 'medium'; // Default difficulty
//     let touchStartX = null; // For touch controls

//     // --- Game Configuration ---
//     const gameWidth = () => gameArea.offsetWidth;
//     const gameHeight = () => gameArea.offsetHeight;
//     const playerSpeed = 2; // Percentage per frame/event
//     const shotSpeed = 8; // Pixels per frame
//     const enemySpeed = { easy: 1, medium: 1.5, hard: 2 };
//     const enemySpawnRate = { easy: 2000, medium: 1500, hard: 1000 }; // Milliseconds
//     const pointsCorrect = 100;
//     const pointsWrong = -20; // Penalty for wrong shot

//     const enemyTypes = [
//         { type: 'dry-eye', label: 'Dry', correctShot: 'lubricant', color: '#17a2b8' },
//         { type: 'allergic-conjunctivitis', label: 'Allergy', correctShot: 'antihistaminic', color: '#ffc107' },
//         { type: 'sore-eye', label: 'Sore', correctShot: 'decongestant', color: '#fd7e14' },
//         { type: 'red-eyes', label: 'Red', correctShot: 'cs', color: '#dc3545' },
//         { type: 'glaucoma', label: 'Glauc', correctShot: 'ts', color: '#6f42c1' }
//     ];

//     const shotTypes = {
//         'lubricant': { color: '#ADD8E6' },
//         'antihistaminic': { color: '#FFD700' },
//         'decongestant': { color: '#FFA07A' },
//         'cs': { color: '#F08080' },
//         'ts': { color: '#9370DB' }
//     };

//     // --- Initialization ---
//     function init() {
//         // Add event listeners for difficulty selection
//         difficultyButtons.forEach(button => {
//             button.addEventListener('click', () => {
//                 difficulty = button.getAttribute('data-difficulty');
//                 startGame();
//             });
//         });

//         // Add event listeners for shot selection
//         shotSelectionButtons.forEach(button => {
//             button.addEventListener('click', () => {
//                 selectedShotType = button.getAttribute('data-shot-type');
//                 updateSelectedShotButton();
//             });
//         });
//         updateSelectedShotButton(); // Set initial selection highlight

//         // Add event listeners for controls
//         document.addEventListener('keydown', handleKeyDown);
//         moveLeftButton.addEventListener('click', () => movePlayer('left'));
//         moveRightButton.addEventListener('click', () => movePlayer('right'));
//         shootButton.addEventListener('click', shoot);
//         playAgainButton.addEventListener('click', resetGame);

//         // Touch controls for player movement (alternative to buttons)
//         gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
//         gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
//         gameArea.addEventListener('touchend', handleTouchEnd);


//         showScreen('start'); // Show start screen initially
//     }

//     // --- Screen Management ---
//     function showScreen(screenId) {
//         document.querySelectorAll('.screen').forEach(screen => {
//             screen.classList.remove('active');
//         });
//         document.getElementById(`${screenId}-screen`).classList.add('active');
//     }

//     // --- Game Start ---
//     function startGame() {
//         isGameOver = false;
//         score = 0;
//         timeLeft = 180;
//         correctAnswers = 0;
//         wrongAnswers = 0;
//         shots = [];
//         enemies = [];
//         playerX = 50; // Reset player position

//         // Clear any existing elements
//         gameArea.innerHTML = ''; // Clear previous game elements
//         gameArea.appendChild(playerElement); // Re-add player
//         updatePlayerPosition();
//         updateScore();
//         updateTimerDisplay();


//         showScreen('game');

//         // Start intervals
//         gameInterval = setInterval(gameLoop, 1000 / 60); // ~60 FPS
//         timerInterval = setInterval(updateTimer, 1000);
//         enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate[difficulty]);
//     }

//     // --- Game Loop (Update and Render) ---
//     function gameLoop() {
//         if (isGameOver) return;

//         moveShots();
//         moveEnemies();
//         checkCollisions();
//         removeOffscreenElements();
//     }

//     // --- Timer ---
//     function updateTimer() {
//         timeLeft--;
//         updateTimerDisplay();
//         if (timeLeft <= 0) {
//             endGame();
//         }
//     }

//     function updateTimerDisplay() {
//         const minutes = Math.floor(timeLeft / 60);
//         const seconds = timeLeft % 60;
//         timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//     }

//     // --- Score ---
//     function updateScore() {
//         scoreDisplay.textContent = `Score: ${score}`;
//     }

//     // --- Player Movement ---
//     function movePlayer(direction) {
//         if (isGameOver) return;
//         if (direction === 'left') {
//             playerX -= playerSpeed;
//         } else if (direction === 'right') {
//             playerX += playerSpeed;
//         }
//         // Clamp player position within game area
//         playerX = Math.max(0 + (playerElement.offsetWidth / gameWidth() * 50), Math.min(100 - (playerElement.offsetWidth / gameWidth() * 50), playerX));
//         updatePlayerPosition();
//     }

//     function updatePlayerPosition() {
//         playerElement.style.left = `${playerX}%`;
//     }

//     // --- Shooting ---
//     function shoot() {
//         if (isGameOver) return;
//         console.log("Shoot triggered. Selected type:", selectedShotType); // Debug log
    
//         const shot = document.createElement('div');
//         shot.classList.add('shot', selectedShotType);
//         // shot.style.backgroundColor = shotTypes[selectedShotType].color; // Already handled by CSS classes, but explicit doesn't hurt
    
//         // --- Revised Position Calculation ---
//         // Get player's current dimensions and position relative to the gameArea
//         const playerRect = playerElement.getBoundingClientRect();
//         const gameAreaRect = gameArea.getBoundingClientRect();
    
//         // Define shot dimensions based on CSS (more reliable than getComputedStyle right after creation)
//         const shotWidth = 8; // Match CSS .shot width
//         const shotHeight = 15; // Match CSS .shot height
    
//         // Calculate center of the player top edge relative to gameArea
//         const playerTopCenterX = playerElement.offsetLeft + playerElement.offsetWidth / 2;
    
//         // Initial position for the shot (centered above the player)
//         const shotX = playerTopCenterX - shotWidth / 2;
//         // Start slightly above the player element's top edge
//         const shotY = playerElement.offsetTop - shotHeight;
    
//         // Apply styles
//         shot.style.left = `${shotX}px`;
//         shot.style.top = `${shotY}px`;
//         // Ensure dimensions are set if not relying purely on CSS class
//         shot.style.width = `${shotWidth}px`;
//         shot.style.height = `${shotHeight}px`;
    
//         // Add to DOM and array
//         gameArea.appendChild(shot);
//         shots.push({ element: shot, type: selectedShotType, x: shotX, y: shotY });
    
//         console.log("Shot created:", { x: shotX, y: shotY, type: selectedShotType }, shot); // Debug log
//         console.log("Current shots array:", shots); // Debug log
//     }

//     // --- Enemy Spawning and Movement ---
//     function spawnEnemy() {
//         if (isGameOver) return;

//         const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
//         const enemy = document.createElement('div');
//         enemy.classList.add('enemy', randomEnemyType.type);
//         enemy.textContent = randomEnemyType.label; // Display short label
//         // enemy.style.backgroundColor = randomEnemyType.color; // Can use classes or inline style

//         // Random horizontal position
//         const enemyWidth = 45; // Match CSS approx
//         const spawnX = Math.random() * (gameWidth() - enemyWidth);
//         const spawnY = -50; // Start above the screen

//         enemy.style.left = `${spawnX}px`;
//         enemy.style.top = `${spawnY}px`;

//         gameArea.appendChild(enemy);
//         enemies.push({
//             element: enemy,
//             type: randomEnemyType.type,
//             correctShot: randomEnemyType.correctShot,
//             x: spawnX,
//             y: spawnY
//         });
//     }

//     function moveShots() {
//         shots.forEach(shot => {
//             shot.y -= shotSpeed;
//             shot.element.style.top = `${shot.y}px`;
//         });
//     }

//     function moveEnemies() {
//         const currentEnemySpeed = enemySpeed[difficulty];
//         enemies.forEach(enemy => {
//             enemy.y += currentEnemySpeed;
//             enemy.element.style.top = `${enemy.y}px`;

//             // Optional: Game over if enemy reaches bottom (like Space Invaders)
//             if (enemy.y + enemy.element.offsetHeight > gameHeight()) {
//                  // console.log("Enemy reached bottom - Game Over condition could be added here");
//                  // Optional: Remove enemy or trigger game over
//                  // removeElement(enemy.element);
//                  // enemies = enemies.filter(e => e !== enemy);
//                  // endGame(); // Or just lose points?
//             }
//         });
//     }

//     // --- Collision Detection ---
//     function checkCollisions() {
//         shots.forEach((shot, shotIndex) => {
//             enemies.forEach((enemy, enemyIndex) => {
//                 if (isColliding(shot.element, enemy.element)) {
//                     // Collision detected!
//                     handleCollision(shot, enemy, shotIndex, enemyIndex);
//                 }
//             });
//         });
//     }

//     function isColliding(el1, el2) {
//         const rect1 = el1.getBoundingClientRect();
//         const rect2 = el2.getBoundingClientRect();
//         return !(
//             rect1.right < rect2.left ||
//             rect1.left > rect2.right ||
//             rect1.bottom < rect2.top ||
//             rect1.top > rect2.bottom
//         );
//     }

//     function handleCollision(shot, enemy, shotIndex, enemyIndex) {
//         // Check if shot type is correct
//         if (shot.type === enemy.correctShot) {
//             score += pointsCorrect;
//             correctAnswers++;
//             // Add positive feedback (e.g., visual effect)
//         } else {
//             score += pointsWrong; // Penalty
//             wrongAnswers++;
//              // Add negative feedback (e.g., different sound/visual)
//         }

//         // Ensure score doesn't go below zero
//         score = Math.max(0, score);
//         updateScore();

//         // Visual explosion effect (optional)
//         createExplosion(enemy.x + enemy.element.offsetWidth / 2, enemy.y + enemy.element.offsetHeight / 2, enemy.element.style.backgroundColor || 'orange');


//         // Remove shot and enemy
//         removeElement(shot.element);
//         removeElement(enemy.element);
//         shots.splice(shotIndex, 1);
//         enemies.splice(enemyIndex, 1);

//          // Adjust indices might be needed if removing multiple per frame,
//          // but iterating backwards or filtering arrays after loop is safer.
//          // For simplicity here, assuming one collision per check cycle is handled.
//     }

//     function createExplosion(x, y, color) {
//         const explosion = document.createElement('div');
//         explosion.style.position = 'absolute';
//         explosion.style.left = `${x - 15}px`; // Center explosion
//         explosion.style.top = `${y - 15}px`;
//         explosion.style.width = '30px';
//         explosion.style.height = '30px';
//         explosion.style.borderRadius = '50%';
//         explosion.style.backgroundColor = color;
//         explosion.style.opacity = '0.7';
//         explosion.classList.add('explosion'); // Apply CSS animation
//         gameArea.appendChild(explosion);

//         // Remove explosion element after animation completes
//         setTimeout(() => {
//             removeElement(explosion);
//         }, 300); // Match animation duration
//     }


//     // --- Element Removal ---
//     function removeOffscreenElements() {
//         // Remove shots that go off-screen (top)
//         shots = shots.filter(shot => {
//             if (shot.y < -shot.element.offsetHeight) {
//                 removeElement(shot.element);
//                 return false;
//             }
//             return true;
//         });

//         // Remove enemies that go off-screen (bottom) - if not handled as game over
//         enemies = enemies.filter(enemy => {
//              if (enemy.y > gameHeight()) {
//                  removeElement(enemy.element);
//                  // Maybe deduct points if they get past?
//                  // score -= 50;
//                  // score = Math.max(0, score);
//                  // updateScore();
//                  return false;
//              }
//              return true;
//          });
//     }

//     function removeElement(element) {
//         if (element && element.parentNode) {
//             element.parentNode.removeChild(element);
//         }
//     }

//     // --- Input Handling ---
//     function handleKeyDown(e) {
//         if (isGameOver) return;
//         switch (e.key) {
//             case 'ArrowLeft':
//             case 'a': // WASD controls optional
//                 movePlayer('left');
//                 break;
//             case 'ArrowRight':
//             case 'd':
//                 movePlayer('right');
//                 break;
//             case ' ': // Space bar
//             case 'Enter':
//                 shoot();
//                 e.preventDefault(); // Prevent space scrolling page
//                 break;
//             // Optional: Number keys to select shots
//             case '1': selectShotByIndex(0); break;
//             case '2': selectShotByIndex(1); break;
//             case '3': selectShotByIndex(2); break;
//             case '4': selectShotByIndex(3); break;
//             case '5': selectShotByIndex(4); break;
//         }
//     }

//     function selectShotByIndex(index) {
//          if (index >= 0 && index < shotSelectionButtons.length) {
//              selectedShotType = shotSelectionButtons[index].getAttribute('data-shot-type');
//              updateSelectedShotButton();
//          }
//     }

//     // Touch Controls Logic
//     function handleTouchStart(e) {
//         if (isGameOver || e.touches.length !== 1) return;
//         // Check if touch is on a button first
//         if (e.target.closest('button')) return;

//         touchStartX = e.touches[0].clientX;
//         e.preventDefault(); // Prevent default scroll/zoom behavior
//     }

//     function handleTouchMove(e) {
//         if (isGameOver || touchStartX === null || e.touches.length !== 1) return;

//         const touchCurrentX = e.touches[0].clientX;
//         const deltaX = touchCurrentX - touchStartX;

//         // Calculate movement relative to game area width for consistency
//         const movePercentage = (deltaX / gameWidth()) * 100;

//         // Update player position directly based on drag percentage
//         // Need to calculate targetX based on initial playerX + movePercentage
//         // This simple delta calculation is okay for continuous movement feel:
//         const moveDirection = deltaX > 0 ? 'right' : 'left';
//         // Adjust sensitivity if needed
//         const sensitivity = 1.5;
//         playerX += (deltaX / gameWidth()) * 100 * sensitivity;


//         // Clamp player position
//         playerX = Math.max(0 + (playerElement.offsetWidth / gameWidth() * 50), Math.min(100 - (playerElement.offsetWidth / gameWidth() * 50), playerX));
//         updatePlayerPosition();

//         touchStartX = touchCurrentX; // Update start position for next move segment
//          e.preventDefault();
//     }

//      function handleTouchEnd(e) {
//          touchStartX = null;
//      }


//     // --- Game End ---
//     function endGame() {
//         if (isGameOver) return; // Prevent running multiple times

//         isGameOver = true;
//         clearInterval(gameInterval);
//         clearInterval(timerInterval);
//         clearInterval(enemySpawnInterval);

//         // Clear remaining elements visually (or let them fade)
//         // shots.forEach(shot => removeElement(shot.element));
//         // enemies.forEach(enemy => removeElement(enemy.element));
//         // shots = []; // Clear arrays if needed, or keep for final calcs
//         // enemies = [];

//         // Calculate Badge
//         const totalAnswers = correctAnswers + wrongAnswers;
//         const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
//         let badgeName = 'Novice';
//         let badgeImgSrc = 'novice_badge.png'; // Placeholder paths

//         if (score >= 5000 && accuracy >= 85) {
//             badgeName = 'Legend';
//             badgeImgSrc = 'legend_badge.png';
//         } else if (score >= 2500 && accuracy >= 65) {
//             badgeName = 'Hero';
//             badgeImgSrc = 'hero_badge.png';
//         }

//         // Display End Screen
//         finalScoreDisplay.textContent = `Final Score: ${score}`;
//         correctAnswersDisplay.textContent = `Correct Shots: ${correctAnswers}`;
//         wrongAnswersDisplay.textContent = `Wrong Shots: ${wrongAnswers}`;
//         badgeDisplay.textContent = badgeName;
//         badgeImage.src = badgeImgSrc; // Set the image source
//         badgeImage.alt = `${badgeName} Badge`;

//         showScreen('end');
//     }

//     // --- Reset Game ---
//     function resetGame() {
//          // Clear leftover elements just in case
//         enemies.forEach(e => removeElement(e.element));
//         shots.forEach(s => removeElement(s.element));
//         enemies = [];
//         shots = [];

//         showScreen('start'); // Go back to start screen
//     }


//     // --- Start the application ---
//     init();
// });