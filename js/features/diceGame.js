// === DICE GAME (21 / BLACKJACK) ===

import { playSound } from '../components/soundSystem.js';
import { getBossHP, setBossHP } from './bossSystem.js';
import { getTranslations } from '../core/translations.js';
import { DEV_MODE } from '../utils/helpers.js';

// Game sound system
let consecutiveRolls = 0;

/**
 * Play game sound effect
 * @param {string} soundFile - Sound file name
 * @param {boolean} pitchScale - Whether to scale pitch based on consecutive rolls
 */
function playGameSound(soundFile, pitchScale = false) {
    const audio = new Audio(`assets/sounds/${soundFile}`);
    audio.volume = 0.6;

    if (pitchScale) {
        const pitchRate = Math.min(1.0 + (consecutiveRolls * 0.2), 3.0);
        audio.playbackRate = pitchRate;
    }

    audio.play().catch(err => {
        if (DEV_MODE) console.log('Game sound play error:', err);
    });
}

/**
 * Reset pitch scaling counter
 */
function resetPitch() {
    consecutiveRolls = 0;
}

/**
 * Show game mage dialogue
 * @param {string} context - Context (roll, win, lose)
 */
function showGameMageDialogue(context) {
    // Import dynamically to avoid circular dependency
    if (window.showGameMageDialogue) {
        window.showGameMageDialogue(context);
    }
}

/**
 * Dice game object
 */
export const diceGame = {
    playerScore: 0,
    computerScore: 0,
    isPlayerTurn: true,
    gameOver: false,

    /**
     * Initialize the game
     */
    init() {
        this.rollBtn = document.getElementById('rollBtn');
        this.standBtn = document.getElementById('standBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.playerScoreEl = document.getElementById('playerScore');
        this.computerScoreEl = document.getElementById('computerScore');
        this.gameMessageEl = document.getElementById('gameMessage');
        this.dice1 = document.getElementById('dice1');
        this.dice2 = document.getElementById('dice2');
        this.historyEl = document.getElementById('gameHistory');

        if (!this.rollBtn) return; // Game section not loaded yet

        this.rollBtn.addEventListener('click', () => this.playerRoll());
        this.standBtn.addEventListener('click', () => this.playerStand());
        this.resetBtn.addEventListener('click', () => this.resetGame());

        this.resetGame();
    },

    /**
     * Roll two dice
     * @returns {Array} Array of [dice1, dice2] values
     */
    rollDice() {
        return [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
    },

    /**
     * Animate dice rolling
     * @param {number} dice1Val - Final value for dice 1
     * @param {number} dice2Val - Final value for dice 2
     */
    animateDice(dice1Val, dice2Val) {
        const dice1Img = this.dice1.querySelector('.dice-img');
        const dice2Img = this.dice2.querySelector('.dice-img');

        this.dice1.classList.add('rolling');
        this.dice2.classList.add('rolling');

        const whiteRollFrames = [
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-9.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-10.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-11.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-12.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-13.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-14.png'
        ];

        const blackRollFrames = [
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-3.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-4.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-5.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-6.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-7.png',
            'assets/1-6 Pip Angled Dice/Angled_And_ISO_Dice-8.png'
        ];

        let frameIndex = 0;
        const frameInterval = setInterval(() => {
            dice1Img.src = whiteRollFrames[frameIndex];
            dice2Img.src = blackRollFrames[frameIndex];
            frameIndex = (frameIndex + 1) % whiteRollFrames.length;
        }, 100);

        setTimeout(() => {
            clearInterval(frameInterval);
            dice1Img.src = `assets/1-6 Pip Flat Dice (Stlye 1)/Dice 1-6 Light (${dice1Val}).png`;
            const blackNum = dice2Val.toString().padStart(2, '0');
            dice2Img.src = `assets/1-6 Pip Flat Dice (Stlye 1)/1-6 Dice Dark (${blackNum}).png`;
            this.dice1.classList.remove('rolling');
            this.dice2.classList.remove('rolling');
        }, 600);
    },

    /**
     * Update game message
     * @param {string} message - Message text
     * @param {boolean} isError - Whether this is an error message
     */
    updateMessage(message, isError = false) {
        this.gameMessageEl.textContent = message;
        this.gameMessageEl.style.color = isError ? '#ff6b6b' : '#5effb2';
    },

    /**
     * Handle player roll
     */
    playerRoll() {
        if (this.gameOver || !this.isPlayerTurn) return;

        playSound('tab');
        const [dice1, dice2] = this.rollDice();
        const roll = dice1 + dice2;

        this.animateDice(dice1, dice2);

        consecutiveRolls++;
        playGameSound('multhit2.ogg', true);

        setTimeout(() => {
            this.playerScore += roll;
            this.playerScoreEl.textContent = this.playerScore;

            const trans = getTranslations()?.game || {};

            if (this.playerScore === 21) {
                this.updateMessage(trans.playerWins21 || 'YOU WIN! Perfect 21!');
                this.gameOver = true;
                this.endGame(true, 'perfect21');
                playGameSound('win.ogg');
                resetPitch();
            } else if (this.playerScore > 21) {
                this.updateMessage(trans.playerBust || `You went over 21! (${this.playerScore}) You lose!`, true);
                this.gameOver = true;
                this.endGame(false);
                playGameSound('timpani.ogg');
                resetPitch();
            } else {
                this.updateMessage(trans.playerRolled?.replace('{roll}', roll).replace('{score}', this.playerScore) || `You rolled ${roll}! Total: ${this.playerScore}. Roll again or Stand?`);
                this.standBtn.disabled = false;

                // 40% chance for joker to speak (desktop only)
                if (Math.random() < 0.4 && window.innerWidth > 1400) {
                    setTimeout(() => {
                        showGameMageDialogue('roll');
                        resetPitch();
                    }, 300);
                }
            }
        }, 650);
    },

    /**
     * Handle player stand
     */
    playerStand() {
        if (this.gameOver || !this.isPlayerTurn) return;

        playSound('open');
        this.isPlayerTurn = false;
        this.rollBtn.disabled = true;
        this.standBtn.disabled = true;

        const trans = getTranslations()?.game || {};
        this.updateMessage(trans.playerStands?.replace('{score}', this.playerScore) || `You stand at ${this.playerScore}. Computer's turn...`);

        setTimeout(() => {
            this.computerPlay();
        }, 1500);
    },

    /**
     * Computer AI play
     */
    computerPlay() {
        const trans = getTranslations()?.game || {};

        // Computer AI: Roll if score < 17, or if player is ahead
        if (this.computerScore < 17 || (this.computerScore < this.playerScore && this.computerScore < 21)) {
            playSound('tab');
            const [dice1, dice2] = this.rollDice();
            const roll = dice1 + dice2;

            this.animateDice(dice1, dice2);

            consecutiveRolls++;
            playGameSound('multhit2.ogg', true);

            setTimeout(() => {
                this.computerScore += roll;
                this.computerScoreEl.textContent = this.computerScore;

                if (this.computerScore === 21) {
                    this.updateMessage(trans.computerWins21 || 'Computer got 21! Computer wins!', true);
                    this.gameOver = true;
                    this.endGame(false, 'bossPerfect21');
                    playGameSound('timpani.ogg');
                    resetPitch();
                } else if (this.computerScore > 21) {
                    this.updateMessage(trans.computerBust || `Computer went over 21! (${this.computerScore}) You win!`);
                    this.gameOver = true;
                    this.endGame(true, 'normal');
                    playGameSound('win.ogg');
                    resetPitch();
                } else if (this.computerScore > this.playerScore) {
                    this.updateMessage(trans.computerWinsHigher?.replace('{playerScore}', this.playerScore).replace('{computerScore}', this.computerScore) || `Computer wins! ${this.computerScore} vs ${this.playerScore}`, true);
                    this.gameOver = true;
                    this.endGame(false);
                    playGameSound('timpani.ogg');
                    resetPitch();
                } else {
                    this.updateMessage(trans.computerRolled?.replace('{roll}', roll).replace('{score}', this.computerScore) || `Computer rolled ${roll}! Total: ${this.computerScore}...`);
                    setTimeout(() => this.computerPlay(), 1500);
                }
            }, 650);
        } else {
            this.updateMessage(trans.computerStands?.replace('{score}', this.computerScore) || `Computer stands at ${this.computerScore}...`);
            setTimeout(() => this.determineWinner(), 1500);
        }
    },

    /**
     * Determine final winner
     */
    determineWinner() {
        const trans = getTranslations()?.game || {};

        if (this.playerScore > this.computerScore) {
            this.updateMessage(trans.playerWinsHigher?.replace('{playerScore}', this.playerScore).replace('{computerScore}', this.computerScore) || `You win! ${this.playerScore} vs ${this.computerScore}`);
            playGameSound('win.ogg');
            this.endGame(true, 'normal');
            resetPitch();
        } else if (this.computerScore > this.playerScore) {
            this.updateMessage(trans.computerWinsHigher?.replace('{playerScore}', this.playerScore).replace('{computerScore}', this.computerScore) || `Computer wins! ${this.computerScore} vs ${this.playerScore}`, true);
            playGameSound('timpani.ogg');
            this.endGame(false);
            resetPitch();
        } else {
            this.updateMessage(trans.tie?.replace('{score}', this.playerScore) || `It's a tie at ${this.playerScore}!`);
            playGameSound('whoosh.ogg');
            this.endGame(null);
            resetPitch();
        }

        this.gameOver = true;
    },

    /**
     * End game and update boss HP
     * @param {boolean|null} playerWon - True if player won, false if lost, null if tie
     * @param {string} winType - Type of win (perfect21, normal, bossPerfect21)
     */
    endGame(playerWon, winType = 'normal') {
        this.rollBtn.disabled = true;
        this.standBtn.disabled = true;

        const trans = getTranslations()?.game || {};
        let result = playerWon === true ? (trans.victory || 'VICTORY!') :
            playerWon === false ? (trans.defeat || 'DEFEAT') :
            (trans.draw || '🤝 DRAW');

        this.historyEl.textContent = result;

        // Update Boss HP based on outcome
        if (playerWon === true) {
            if (winType === 'perfect21') {
                setBossHP(getBossHP() - 50);
            } else {
                setBossHP(getBossHP() - 30);
            }
        } else if (playerWon === false) {
            if (winType === 'bossPerfect21') {
                setBossHP(getBossHP() + 50);
            } else {
                setBossHP(getBossHP() + 15);
            }
        }

        // Joker comments on game outcome (desktop only)
        if (window.innerWidth > 1400) {
            if (playerWon === true) {
                setTimeout(() => {
                    showGameMageDialogue('win');
                }, 800);
            } else if (playerWon === false) {
                setTimeout(() => {
                    showGameMageDialogue('lose');
                }, 800);
            }
        }
    },

    /**
     * Reset game to initial state
     */
    resetGame() {
        playSound('hover');
        resetPitch();
        this.playerScore = 0;
        this.computerScore = 0;
        this.isPlayerTurn = true;
        this.gameOver = false;

        this.playerScoreEl.textContent = '0';
        this.computerScoreEl.textContent = '0';

        // Reset dice images
        const dice1Img = this.dice1.querySelector('.dice-img');
        const dice2Img = this.dice2.querySelector('.dice-img');
        if (dice1Img) dice1Img.src = 'assets/1-6 Pip Flat Dice (Stlye 1)/Dice 1-6 Light (1).png';
        if (dice2Img) dice2Img.src = 'assets/1-6 Pip Flat Dice (Stlye 1)/1-6 Dice Dark (01).png';

        this.rollBtn.disabled = false;
        this.standBtn.disabled = true;

        const trans = getTranslations()?.game || {};
        this.updateMessage(trans.gameStart || 'Click "Roll Dice" to start!');
        this.historyEl.textContent = '';
    }
};

/**
 * Initialize dice game
 */
export function initDiceGame() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => diceGame.init());
    } else {
        diceGame.init();
    }
}
