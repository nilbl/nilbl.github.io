// === PARALLAX SCROLLING WITH THEME SWITCHING ===

import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage.js';

const PARALLAX_SMOOTHING = 0.1;
const THEME_TRANSITION_DELAY = 400;

let parallaxEnabled = true;
let currentScrollY = 0;
let targetScrollY = 0;
let parallaxContainer = null;
let layers = null;

// Theme definitions
const themes = {
    forest: [
        { src: 'assets/forest/forest_sky.png', speed: 0.02 },
        { src: 'assets/forest/forest_moon.png', speed: 0.03 },
        { src: 'assets/forest/forest_mountain.png', speed: 0.06 },
        { src: 'assets/forest/forest_back.png', speed: 0.12 },
        { src: 'assets/forest/forest_mid.png', speed: 0.2 },
        { src: 'assets/forest/forest_short.png', speed: 0.3 },
        { src: 'assets/forest/forest_long.png', speed: 0.45 }
    ],
    skies: [
        { src: 'assets/skies/Sky_sky.png', speed: 0.01 },
        { src: 'assets/skies/Sky_back_mountain.png', speed: 0.03 },
        { src: 'assets/skies/sky_moon.png', speed: 0.04 },
        { src: 'assets/skies/sky_clouds.png', speed: 0.06 },
        { src: 'assets/skies/sky_cloud_floor_2.png', speed: 0.09 },
        { src: 'assets/skies/sky_cloud_floor.png', speed: 0.12 },
        { src: 'assets/skies/Sky_cloud_single.png', speed: 0.15 },
        { src: 'assets/skies/sky_front_mountain.png', speed: 0.22 },
        { src: 'assets/skies/Sky_front_cloud.png', speed: 0.3 }
    ],
    moon: [
        { src: 'assets/moon/moon_sky.png', speed: 0.01 },
        { src: 'assets/moon/moon_earth.png', speed: 0.03 },
        { src: 'assets/moon/moon_back.png', speed: 0.06 },
        { src: 'assets/moon/moon_mid.png', speed: 0.12 },
        { src: 'assets/moon/moon_floor.png', speed: 0.22 },
        { src: 'assets/moon/moon_front.png', speed: 0.32 }
    ],
    desert: [
        { src: 'assets/desert/desert_sky.png', speed: 0.01 },
        { src: 'assets/desert/desert_mountain.png', speed: 0.04 },
        { src: 'assets/desert/desert_moon.png', speed: 0.05 },
        { src: 'assets/desert/desert_cloud.png', speed: 0.08 },
        { src: 'assets/desert/desert_dunemid.png', speed: 0.18 },
        { src: 'assets/desert/desert_dunefront.png', speed: 0.28 }
    ]
};

/**
 * Set parallax theme
 * @param {string} themeName - Theme name (forest, skies, moon, desert)
 */
export function setParallaxTheme(themeName) {
    const theme = themes[themeName];
    if (!theme || !parallaxContainer) return;

    const themeSelectors = document.querySelectorAll('.theme-selector');
    const themeSelector = themeSelectors[0];

    // Add loading indicator
    if (themeSelector) {
        themeSelector.disabled = true;
        themeSelector.style.opacity = '0.5';
    }

    parallaxContainer.style.opacity = '0';

    setTimeout(() => {
        parallaxContainer.innerHTML = '';

        theme.forEach(layer => {
            const img = document.createElement('img');
            img.src = layer.src;
            img.classList.add('layer');
            img.dataset.speed = layer.speed;
            img.alt = themeName + ' layer';
            img.loading = 'lazy';
            parallaxContainer.appendChild(img);
        });

        layers = parallaxContainer.querySelectorAll('.layer');

        parallaxContainer.style.opacity = '1';
        safeSetLocalStorage('selectedTheme', themeName);

        // Remove loading indicator
        if (themeSelector) {
            themeSelector.disabled = false;
            themeSelector.style.opacity = '1';
        }
    }, THEME_TRANSITION_DELAY);
}

/**
 * Initialize parallax effect
 */
export function initParallax() {
    parallaxContainer = document.querySelector('.parallax');
    if (!parallaxContainer) return;

    // Load saved theme or default to forest
    const savedTheme = safeGetLocalStorage('selectedTheme', 'forest');
    setParallaxTheme(savedTheme);

    // Setup theme selectors
    const themeSelectors = document.querySelectorAll('.theme-selector');
    themeSelectors.forEach(selector => {
        selector.value = savedTheme;
    });

    // Add change event to all theme selectors and sync them
    themeSelectors.forEach(selector => {
        selector.addEventListener('change', e => {
            const newTheme = e.target.value;
            setParallaxTheme(newTheme);

            // Sync all other selectors
            themeSelectors.forEach(otherSelector => {
                if (otherSelector !== selector) {
                    otherSelector.value = newTheme;
                }
            });
        });
    });

    // Start parallax animation
    function updateParallax() {
        if (!parallaxEnabled || !layers) {
            requestAnimationFrame(updateParallax);
            return;
        }

        currentScrollY += (targetScrollY - currentScrollY) * PARALLAX_SMOOTHING;

        layers.forEach(layer => {
            const speed = parseFloat(layer.dataset.speed) || 0;
            const yPos = currentScrollY * speed; // Positive value moves down when scrolling down
            layer.style.transform = `translateY(${yPos}px)`;
        });

        requestAnimationFrame(updateParallax);
    }

    window.addEventListener('scroll', () => {
        targetScrollY = window.pageYOffset;
    });

    updateParallax();

    console.log('✅ Parallax initialized with theme:', savedTheme);
}

/**
 * Enable/disable parallax effect
 */
export function setParallaxEnabled(enabled) {
    parallaxEnabled = enabled;
}
