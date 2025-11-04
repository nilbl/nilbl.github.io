// === UI INITIALIZATION ===

import { playSound } from '../components/soundSystem.js';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage.js';
import { changeLanguage } from '../core/translations.js';

// Constants
const STAR_COUNT = 100;
const LOADING_INTERVAL = 200;
const LOADING_STEP_MIN = 5;
const LOADING_STEP_MAX = 15;
const THEME_TRANSITION_DELAY = 400;

/**
 * Generate stars in background
 */
export function initStars() {
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
        for (let i = 0; i < STAR_COUNT; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starsContainer.appendChild(star);
        }
        console.log(`✅ ${STAR_COUNT} stars generated`);
    }
}

/**
 * Start game function (character select)
 */
export function startGame() {
    playSound('start');
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingFill = document.getElementById('loadingFill');
    const loadingPercent = document.getElementById('loadingPercent');
    const titleScreen = document.getElementById('titleScreen');
    const characterMenu = document.getElementById('characterMenu');
    const loadingText = document.querySelector('.loading-text');

    const messages = [
        "WAKING UP...",
        "LOADING CHARACTER EGO...",
        "OPTIMIZING CV...",
        "PRETENDING TO LOAD SOMETHING...",
        "MAKING EVERYTHING LOOK COOL...",
        "READY!"
    ];

    // Show loading screen and hide global mage
    loadingScreen.classList.add('active');
    const globalMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');
    if (globalMage) globalMage.style.display = 'none';

    let progress = 0;
    let nextMessageIndex = 0;
    let nextThreshold = 100 / (messages.length - 1);

    const fakeLoading = setInterval(() => {
        progress += Math.floor(Math.random() * (LOADING_STEP_MAX - LOADING_STEP_MIN)) + LOADING_STEP_MIN;
        if (progress > 100) progress = 100;

        loadingFill.style.width = progress + '%';
        loadingPercent.textContent = progress + '%';

        if (progress >= nextThreshold * nextMessageIndex && nextMessageIndex < messages.length) {
            loadingText.textContent = messages[nextMessageIndex];
            playSound('menu');
            nextMessageIndex++;
        }

        if (progress >= 100) {
            clearInterval(fakeLoading);
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                titleScreen.style.opacity = '0';
                setTimeout(() => {
                    titleScreen.style.display = 'none';
                    // Show global mage only (not game mage)
                    const globalMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');
                    if (globalMage) globalMage.style.display = 'block';

                    // Show taskbar when entering character menu
                    const taskbar = document.querySelector('.taskbar');
                    if (taskbar) taskbar.classList.add('visible');

                    // Hide title screen world selector and show footer one
                    const titleSelector = document.querySelector('.world-selector-title');
                    const footerSelector = document.querySelector('.world-selector-footer');
                    if (titleSelector) {
                        titleSelector.style.opacity = '0';
                        titleSelector.style.pointerEvents = 'none';
                    }
                    if (footerSelector) {
                        footerSelector.style.display = 'block';
                    }

                    characterMenu.classList.add('active');
                    characterMenu.style.opacity = '0';
                    setTimeout(() => {
                        characterMenu.style.transition = 'opacity 0.4s ease-in';
                        characterMenu.style.opacity = '1';

                        // Visitor tracking temporarily disabled for legal compliance
                        // import('../visitors/visitorTracker.js').then(module => {
                        //     module.captureVisitorLocation();
                        // });
                    }, 50);
                }, THEME_TRANSITION_DELAY);
            }, 500);
        }
    }, LOADING_INTERVAL);
}

/**
 * Initialize visit counter
 */
export function initVisitCounter() {
    const countElement = document.getElementById('visitCount');
    if (!countElement) return;

    // CountAPI service is down, use simple localStorage counter
    let localCount = parseInt(safeGetLocalStorage('local-visit-count', '0'));
    localCount++;
    safeSetLocalStorage('local-visit-count', localCount.toString());
    countElement.textContent = localCount.toLocaleString();
    countElement.title = 'Your visit count (visit VISITORS tab for global map)';
}

/**
 * Initialize language dropdown
 */
export function initLanguageDropdown() {
    const langDropdownBtn = document.getElementById('langDropdownBtn');
    const langDropdownMenu = document.getElementById('langDropdownMenu');
    const langOptions = document.querySelectorAll('.lang-option');

    if (langDropdownBtn && langDropdownMenu) {
        // Toggle dropdown
        langDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdownMenu.classList.toggle('active');
            playSound('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!langDropdownBtn.contains(e.target) && !langDropdownMenu.contains(e.target)) {
                langDropdownMenu.classList.remove('active');
            }
        });

        // Handle language selection
        langOptions.forEach(opt => {
            opt.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                changeLanguage(lang, true);
                langDropdownMenu.classList.remove('active');
            });
        });

        console.log('✅ Language dropdown initialized');
    }
}

/**
 * Initialize start button
 */
export function initStartButton() {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startGame);
        console.log('✅ Start button initialized');
    }
}

/**
 * Initialize game mage click handler
 */
export function initGameMage() {
    const balatrOJoker = document.getElementById('balatrOJoker');
    if (balatrOJoker) {
        balatrOJoker.addEventListener('click', () => {
            // Always speak when clicked directly
            if (window.showGameMageDialogue) {
                window.showGameMageDialogue('roll');
            }
        });
    }
}

/**
 * Initialize all UI components
 */
export function initUI() {
    initStars();
    initVisitCounter();
    initLanguageDropdown();
    initStartButton();
    initGameMage();

    console.log('✅ UI initialization complete');
}
