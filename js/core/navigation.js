// === NAVIGATION SYSTEM ===

import { playSound } from '../components/soundSystem.js';
import { animateSmoke } from '../components/animations.js';

const cachedElements = {};

/**
 * Section map for navigation
 */
const sectionMap = {
    'stats': {
        element: null, // Lazy loaded
        index: 0
    },
    'timeline': {
        element: null,
        index: 1
    },
    'missions': {
        element: null,
        index: 2
    },
    'contact': {
        element: null,
        index: 3
    },
    'game': {
        element: null,
        index: 4
    },
    'visitors': {
        element: null,
        index: 5
    }
};

/**
 * Initialize section elements (lazy)
 */
function initSectionElements() {
    if (!sectionMap.stats.element) {
        sectionMap.stats.element = document.getElementById('statsSection');
        sectionMap.timeline.element = document.getElementById('timelineSection');
        sectionMap.missions.element = document.getElementById('missionsSection');
        sectionMap.contact.element = document.getElementById('contactSection');
        sectionMap.game.element = document.getElementById('gameSection');
        sectionMap.visitors.element = document.getElementById('visitorsSection');
    }
}

/**
 * Toggle menu item active state
 * @param {HTMLElement} element - Menu item element
 */
export function toggleMenuItem(element) {
    if (!element) return;

    if (!cachedElements.allMenuItems) {
        cachedElements.allMenuItems = document.querySelectorAll('.menu-item');
    }

    cachedElements.allMenuItems.forEach(item => {
        if (item !== element && item.classList.contains('active')) {
            item.classList.remove('active');
        }
    });

    element.classList.toggle('active');
}

/**
 * Switch to a different section
 * @param {string} section - Section name to switch to
 */
export function switchSection(section) {
    playSound('tab');

    if (!cachedElements.contentSections) {
        cachedElements.contentSections = document.querySelectorAll('.content-section');
    }
    if (!cachedElements.taskbarItems) {
        cachedElements.taskbarItems = document.querySelectorAll('.taskbar-item');
    }

    // Get current section before switching
    const currentSection = document.querySelector('.content-section.active');
    const currentIsGame = currentSection && currentSection.id === 'gameSection';
    const nextIsGame = section === 'game';
    const hiddenMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');

    // Handle mage exit from game section
    if (currentIsGame && !nextIsGame) {
        const balatrOJoker = document.getElementById('balatrOJoker');
        if (balatrOJoker && balatrOJoker.classList.contains('visible')) {
            animateSmoke(balatrOJoker, () => {
                balatrOJoker.classList.remove('visible');
            });
        }
        // Show hidden mage when leaving game section
        if (hiddenMage) {
            setTimeout(() => {
                hiddenMage.style.display = 'block';
            }, 600); // After game mage smoke clears
        }
    }

    cachedElements.contentSections.forEach(sec => {
        sec.classList.remove('active');
    });

    cachedElements.taskbarItems.forEach(item => {
        item.classList.remove('active');
    });

    // Initialize section elements if needed
    initSectionElements();

    if (sectionMap[section]) {
        sectionMap[section].element.classList.add('active');
        cachedElements.taskbarItems[sectionMap[section].index].classList.add('active');

        // Handle mage entry to game section
        if (nextIsGame && !currentIsGame) {
            // Hide hidden mage when entering game section
            if (hiddenMage) {
                hiddenMage.style.display = 'none';
            }

            // Show game mage
            const balatrOJoker = document.getElementById('balatrOJoker');
            if (balatrOJoker) {
                setTimeout(() => {
                    animateSmoke(balatrOJoker, () => {
                        balatrOJoker.classList.add('visible');
                    });
                }, 300); // Slight delay after section appears
            }
        }

        // Handle visitors section - initialize tracker
        if (section === 'visitors') {
            setTimeout(() => {
                // Trigger custom event for visitor tracking
                window.dispatchEvent(new Event('visitorsSectionShown'));
            }, 100);
        }
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Initialize hamburger menu
 */
export function initHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const taskbar = document.getElementById('taskbar');

    if (hamburgerMenu && taskbar) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburgerMenu.classList.toggle('active');
            taskbar.classList.toggle('menu-open');
            playSound('open');
        });

        // Close menu when clicking a taskbar item
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        taskbarItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 600) {
                    hamburgerMenu.classList.remove('active');
                    taskbar.classList.remove('menu-open');
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 600 &&
                !hamburgerMenu.contains(e.target) &&
                !taskbar.contains(e.target)) {
                hamburgerMenu.classList.remove('active');
                taskbar.classList.remove('menu-open');
            }
        });
    }
}

/**
 * Initialize navigation system
 */
export function initNavigation() {
    initHamburgerMenu();

    // Setup click handlers for taskbar items
    const taskbarItems = document.querySelectorAll('.taskbar-item');
    taskbarItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            if (section) {
                switchSection(section);
            }
        });
    });

    // Setup click handlers for menu items in stats section
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            playSound('menu');
            toggleMenuItem(item);
        });
    });

    // Make switchSection available globally for any HTML onclick handlers
    window.switchSection = switchSection;

    console.log('✅ Navigation system initialized');
}
