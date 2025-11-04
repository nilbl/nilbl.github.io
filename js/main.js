import { initTranslations } from './core/translations.js';
import { initNavigation } from './core/navigation.js';
import { initAudio } from './components/soundSystem.js';
import { initParallax } from './features/parallax.js';
import { buildTimeline } from './features/timeline.js';
import { initBossHP } from './features/bossSystem.js';
import { initDiceGame } from './features/diceGame.js';
import { initHiddenMage } from './features/hiddenMage.js';
import { initUI } from './features/uiInit.js';
import { initEasterEggs } from './features/easterEggs.js';
import { setupVisitorTracking } from './visitors/visitorTracker.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ Modular system initializing...');

    // Translations must load first
    await initTranslations();

    initAudio();
    initNavigation();
    initUI();
    initParallax();
    buildTimeline();
    initBossHP();
    initDiceGame();
    initHiddenMage();
    initEasterEggs();
    setupVisitorTracking();

    console.log('All modules loaded successfully!');
});

// Timeline needs rebuild on language change
window.addEventListener('languageChanged', () => {
    buildTimeline();
});

// Public API exports
export { initAudio } from './components/soundSystem.js';
export { playSound } from './components/soundSystem.js';
export { animateSmoke, createConfetti } from './components/animations.js';
export { initParallax } from './features/parallax.js';
export { initTranslations, changeLanguage, getTranslations } from './core/translations.js';
export { safeGetLocalStorage, safeSetLocalStorage, getJSON, setJSON } from './utils/storage.js';
export { switchSection } from './core/navigation.js';
export { buildTimeline } from './features/timeline.js';
export { getBossHP, setBossHP, initBossHP } from './features/bossSystem.js';
export { diceGame } from './features/diceGame.js';
export { showMageDialogue, showGameMageDialogue } from './features/hiddenMage.js';
export { initVisitorTracking } from './visitors/visitorTracker.js';
export { startGame, initStars, initVisitCounter } from './features/uiInit.js';
