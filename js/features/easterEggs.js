// === EASTER EGGS ===

import { playSound } from '../components/soundSystem.js';
import { createConfetti } from '../components/animations.js';
import { DEV_MODE } from '../utils/helpers.js';

const PORTRAIT_CLICK_THRESHOLD = 5;
const CLICK_RESET_TIMEOUT = 1500;
const KONAMI_TIMEOUT = 3000;

// Konami code
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiIndex = 0;
let konamiActivated = false;
let konamiTimeoutId = null;

/**
 * Check Konami code input
 * @param {string} key - Key code
 */
function checkKonamiCode(key) {
    // Clear existing timeout
    if (konamiTimeoutId) {
        clearTimeout(konamiTimeoutId);
    }

    if (key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (DEV_MODE) console.log(`Konami progress: ${konamiIndex}/${konamiCode.length}`);

        if (konamiIndex === konamiCode.length) {
            if (!konamiActivated) {
                konamiActivated = true;
                activateKonamiEasterEgg();
            }
            konamiIndex = 0;
            konamiTimeoutId = null;
        } else {
            // Set timeout to reset if user doesn't continue within 3 seconds
            konamiTimeoutId = setTimeout(() => {
                konamiIndex = 0;
                konamiTimeoutId = null;
                if (DEV_MODE) console.log('Konami code reset due to timeout');
            }, KONAMI_TIMEOUT);
        }
    } else {
        konamiIndex = 0;
    }
}

/**
 * Activate Konami code easter egg
 */
function activateKonamiEasterEgg() {
    playSound('start');
    if (DEV_MODE) {
        console.log('🎮 KONAMI CODE ACTIVATED!');
    }

    createConfetti();

    // Show special message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 215, 0, 0.95);
        color: #000;
        padding: 2rem 3rem;
        border: 4px solid #8b4513;
        border-radius: 8px;
        font-family: 'Press Start 2P', monospace;
        font-size: 1.2rem;
        z-index: 10000;
        text-align: center;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
    `;
    message.textContent = '🎮 KONAMI CODE! 🎮';
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

/**
 * Press controller button visual effect
 * @param {string} key - Key code
 */
function pressButton(key) {
    const btn = document.querySelector(`.btn[data-key="${key}"]`);
    if (!btn) return;
    btn.classList.add('pressed');
    playSound('menu');
    setTimeout(() => btn.classList.remove('pressed'), 150);
}

/**
 * Initialize portrait click easter egg
 */
function initPortraitClick() {
    const portrait = document.querySelector('.portrait-sprite');
    const controller = document.getElementById('controllerOverlay');
    let clickCount = 0;

    if (portrait && controller) {
        portrait.addEventListener('click', () => {
            clickCount++;
            playSound('hover');
            if (clickCount >= PORTRAIT_CLICK_THRESHOLD) {
                controller.classList.remove('hidden');
                playSound('success');
                clickCount = 0;
            }
            setTimeout(() => (clickCount = 0), CLICK_RESET_TIMEOUT);
        });
        console.log('✅ Portrait click easter egg initialized');
    }
}

/**
 * Initialize controller interactivity
 */
function initController() {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            pressButton(key);
        });
    });

    document.addEventListener('keydown', e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyB'].includes(e.code)) {
            pressButton(e.code);
        }
    });

    console.log('✅ Controller initialized');
}

/**
 * Initialize Konami code
 */
function initKonamiCode() {
    document.addEventListener('keydown', e => {
        checkKonamiCode(e.code);
    });

    console.log('✅ Konami code listener initialized');
}

/**
 * Initialize all easter eggs
 */
export function initEasterEggs() {
    initPortraitClick();
    initController();
    initKonamiCode();
}
