// === TRANSLATION SYSTEM ===
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage.js';

const DEV_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

let translations = {};
let currentLanguage = safeGetLocalStorage('language', 'en');

/**
 * Load translation JSON file
 * @param {string} lang - Language code (en, es, ca)
 * @returns {Promise<Object>} Translation data
 */
async function loadTranslations(lang) {
    try {
        const cacheBuster = new Date().getTime();
        const response = await fetch(`translations/${lang}.json?v=${cacheBuster}`);
        if (!response.ok) throw new Error('Translation file not found');
        return await response.json();
    } catch (error) {
        if (DEV_MODE) console.log(`Error loading ${lang} translations:`, error);
        if (lang !== 'en') {
            return await loadTranslations('en');
        }
        return {};
    }
}

/**
 * Initialize translation system
 */
export async function initTranslations() {
    translations[currentLanguage] = await loadTranslations(currentLanguage);
    updatePageLanguage();
}

/**
 * Change current language
 * @param {string} lang - Language code
 * @param {Function} playSound - Sound callback
 */
export async function changeLanguage(lang, playSound) {
    currentLanguage = lang;
    safeSetLocalStorage('language', lang);

    if (!translations[lang]) {
        translations[lang] = await loadTranslations(lang);
    }

    updatePageLanguage();
    if (playSound) playSound('success');
}

/**
 * Get current language
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Get translations for current language
 */
export function getTranslations() {
    return translations[currentLanguage] || {};
}

/**
 * Update all page elements with translations
 */
export function updatePageLanguage() {
    const trans = translations[currentLanguage];
    if (!trans) return;

    // Update language dropdown
    const langText = document.querySelector('.lang-text');
    if (langText) {
        langText.textContent = currentLanguage.toUpperCase();
    }

    // Update navigation tabs
    updateNavigationTabs(trans);

    // Update sections
    updateStatsSection(trans);
    updateTimelineSection(trans);
    updateMissionsSection(trans);
    updateContactSection(trans);
    updateGameSection(trans);
    updateVisitorsSection(trans);
    updateFooter(trans);

    // Update language dropdown active state
    updateLanguageDropdownState();
}

function updateNavigationTabs(trans) {
    if (!trans.navigation) return;

    const statsTab = document.querySelector('[data-section="stats"] span');
    const timelineTab = document.querySelector('[data-section="timeline"] span');
    const missionsTab = document.querySelector('[data-section="missions"] span');
    const contactTab = document.querySelector('[data-section="contact"] span');
    const gameTab = document.querySelector('[data-section="game"] span');
    const visitorsTab = document.querySelector('[data-section="visitors"] span');

    if (statsTab) statsTab.textContent = trans.navigation.stats;
    if (timelineTab) timelineTab.textContent = trans.navigation.timeline;
    if (missionsTab) missionsTab.textContent = trans.navigation.missions;
    if (contactTab) contactTab.textContent = trans.navigation.contact;
    if (gameTab) gameTab.textContent = trans.navigation.game;
    if (visitorsTab) visitorsTab.textContent = trans.navigation.visitors;
}

function updateStatsSection(trans) {
    const statsSection = document.getElementById('statsSection');
    if (statsSection && trans.stats) {
        const heroTitle = statsSection.querySelector('.hero-title');
        if (heroTitle && trans.stats.heroTitle) {
            heroTitle.innerHTML = trans.stats.heroTitle;
        }
        // Additional stats section updates...
    }
}

function updateTimelineSection(trans) {
    const timelineSection = document.getElementById('timelineSection');
    if (timelineSection && trans.timeline) {
        const timelineHeader = timelineSection.querySelector('.timeline-main-header span');
        const timelineSubtitle = timelineSection.querySelector('.timeline-subtitle');

        if (timelineHeader) timelineHeader.textContent = trans.timeline.header;
        if (timelineSubtitle) timelineSubtitle.textContent = trans.timeline.info;
    }
}

function updateMissionsSection(trans) {
    const missionsSection = document.getElementById('missionsSection');
    if (missionsSection && trans.missions) {
        // Missions section updates...
    }
}

function updateContactSection(trans) {
    const contactSection = document.getElementById('contactSection');
    if (contactSection && trans.contact) {
        const title = contactSection.querySelector('.section-title');
        if (title) title.textContent = trans.contact.title;
    }
}

function updateGameSection(trans) {
    const gameSection = document.getElementById('gameSection');
    if (gameSection && trans.game) {
        const gameTitle = gameSection.querySelector('.game-title span');
        const gameSubtitle = gameSection.querySelector('.game-subtitle');
        const playerLabel = gameSection.querySelector('.player-score h3');
        const computerLabel = gameSection.querySelector('.computer-score h3');
        const gameStart = gameSection.querySelector('.game-message');
        const rollButton = gameSection.querySelector('#rollBtn');
        const standButton = gameSection.querySelector('#standBtn');
        const resetButton = gameSection.querySelector('#resetBtn');

        if (gameTitle) gameTitle.textContent = trans.game.title;
        if (gameSubtitle) gameSubtitle.textContent = trans.game.subtitle;
        if (playerLabel) playerLabel.textContent = trans.game.playerLabel;
        if (computerLabel) computerLabel.textContent = trans.game.computerLabel;
        if (gameStart) gameStart.textContent = trans.game.gameStart;
        if (rollButton) rollButton.textContent = '🎲 ' + trans.game.rollButton;
        if (standButton) standButton.textContent = '✋ ' + trans.game.standButton;
        if (resetButton) resetButton.textContent = '🔄 ' + trans.game.resetButton;
    }
}

function updateVisitorsSection(trans) {
    const visitorsSection = document.getElementById('visitorsSection');
    if (visitorsSection && trans.visitors) {
        const visitorsTitle = visitorsSection.querySelector('.section-title span');
        const visitorsSubtitle = visitorsSection.querySelector('.section-subtitle');
        const totalVisitsLabel = visitorsSection.querySelector('[data-i18n="visitorsTotalVisits"]');
        const locationsLabel = visitorsSection.querySelector('[data-i18n="visitorsLocations"]');
        const yourLocationLabel = visitorsSection.querySelector('[data-i18n="visitorsYourLocation"]');
        const recentHeading = visitorsSection.querySelector('[data-i18n="visitorsRecentHeading"]');

        if (visitorsTitle) visitorsTitle.textContent = trans.visitors.title;
        if (visitorsSubtitle) visitorsSubtitle.textContent = trans.visitors.subtitle;
        if (totalVisitsLabel) totalVisitsLabel.textContent = trans.visitors.totalVisits || 'Total Visits';
        if (locationsLabel) locationsLabel.textContent = trans.visitors.locations || 'Locations';
        if (yourLocationLabel) yourLocationLabel.textContent = trans.visitors.yourLocation || 'Your Location';
        if (recentHeading) recentHeading.textContent = trans.visitors.recentHeading || 'Recent Visitors';
    }
}

function updateFooter(trans) {
    if (trans.footer) {
        const footerText = document.querySelector('.footer-info span');
        const visitCounterLabel = document.querySelector('.visit-counter span:first-child');
        if (footerText) footerText.textContent = trans.footer.text;
        if (visitCounterLabel) visitCounterLabel.textContent = trans.footer.visitCounter;
    }
}

function updateLanguageDropdownState() {
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(opt => {
        if (opt.getAttribute('data-lang') === currentLanguage) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}
