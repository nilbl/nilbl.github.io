// === PORTFOLIO APP MODULE ===
(function() {
    'use strict';

    // === CONSTANTS ===
    const DEV_MODE = false; // Development mode flag - set to false for production
    const STAR_COUNT = 100;
    const LOADING_INTERVAL = 200; // milliseconds
    const LOADING_STEP_MIN = 5;
    const LOADING_STEP_MAX = 15;
    const CLICK_RESET_TIMEOUT = 1500; // milliseconds
    const PORTRAIT_CLICK_THRESHOLD = 5;
    const KONAMI_TIMEOUT = 3000; // milliseconds
    const CONFETTI_COUNT = 150;
    const CONFETTI_CLEANUP_DELAY = 6000; // milliseconds
    const MAGE_HIDE_DELAY = 2000; // milliseconds
    const THEME_TRANSITION_DELAY = 400; // milliseconds
    const PARALLAX_SMOOTHING = 0.1;

    // === CACHED DOM ELEMENTS ===
    let cachedElements = {};

    // === REUSABLE AUDIO CONTEXT ===
    let audioContext = null;

    // Initialize audio context once
    function getAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new(window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                if (DEV_MODE) console.log('Audio not available');
            }
        }
        return audioContext;
    }

    // Generate stars
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
    }

    function startGame() {
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

        // Show loading screen and hide mage
        loadingScreen.classList.add('active');
        document.querySelector('.hidden-mage').style.display = 'none';

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
                        document.querySelector('.hidden-mage').style.display = 'block'; // show mage only now
                        characterMenu.classList.add('active');
                        characterMenu.style.opacity = '0';
                        setTimeout(() => {
                            characterMenu.style.transition = 'opacity 0.4s ease-in';
                            characterMenu.style.opacity = '1';
                        }, 50);
                    }, THEME_TRANSITION_DELAY);
                }, 500);
            }
        }, LOADING_INTERVAL);
    }


    function toggleMenu(element) {
        playSound('menu');

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

    function switchSection(section) {
        playSound('menu');

        if (!cachedElements.contentSections) {
            cachedElements.contentSections = document.querySelectorAll('.content-section');
        }
        if (!cachedElements.taskbarItems) {
            cachedElements.taskbarItems = document.querySelectorAll('.taskbar-item');
        }

        cachedElements.contentSections.forEach(sec => {
            sec.classList.remove('active');
        });

        cachedElements.taskbarItems.forEach(item => {
            item.classList.remove('active');
        });

        const sectionMap = {
            'stats': {
                element: document.getElementById('statsSection'),
                index: 0
            },
            'missions': {
                element: document.getElementById('missionsSection'),
                index: 1
            },
            'contact': {
                element: document.getElementById('contactSection'),
                index: 2
            }
        };

        if (sectionMap[section]) {
            sectionMap[section].element.classList.add('active');
            cachedElements.taskbarItems[sectionMap[section].index].classList.add('active');
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function playSound(type) {
        const ctx = getAudioContext();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'menu') {
                oscillator.frequency.value = 600;
            } else {
                oscillator.frequency.value = 800;
            }

            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            if (DEV_MODE) console.log('Audio playback error:', e);
        }
    }


    // === HIDDEN MAGE FUNCTIONALITY ===
    const mageDialogues = [
        "My favourite series is ANDOR. 'Revolution is not for the sane!'",
        "I love building LEGO... not the paying part tho.",
        "I love cats but I'm allergic to them. My life is basically Schrödinger's nightmare.",
        "I can cast JavaScript spells!",
        "I master the art of debugging... which is just shouting: WHY?!",
        "Favourite animal: dogs!",
        "I play a lot of videogames, like A LOT!",
        "Do or do not. There is no try.",
        "Try clicking my selfie 5 times!"
    ];

    let lastDialogueIndex = -1;
    let mageTypingInterval = null;
    let hideTimeout = null;

    function showMageDialogue() {
        playSound('menu');

        const dialogue = document.querySelector('.mage-dialogue');

        if (mageTypingInterval) clearTimeout(mageTypingInterval); // changed to clearTimeout
        if (hideTimeout) clearTimeout(hideTimeout);

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * mageDialogues.length);
        } while (randomIndex === lastDialogueIndex && mageDialogues.length > 1);

        lastDialogueIndex = randomIndex;
        const fullText = mageDialogues[randomIndex];

        dialogue.textContent = '';
        dialogue.classList.add('active');

        let i = 0;

        function typeNextLetter() {
            dialogue.textContent += fullText.charAt(i);
            i++;

            if (i < fullText.length) {
                const randomSpeed = Math.floor(Math.random() * 75) + 30;
                mageTypingInterval = setTimeout(typeNextLetter, randomSpeed);
            } else {
                mageTypingInterval = null;
                hideTimeout = setTimeout(() => {
                    dialogue.classList.remove('active');
                    hideTimeout = null;
                }, MAGE_HIDE_DELAY);
            }
        }

        typeNextLetter();
    }


    // === CONSOLIDATED DOM CONTENT LOADED ===
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize hidden mage
        const hiddenMage = document.querySelector('.hidden-mage');
        if (hiddenMage) {
            hiddenMage.style.display = 'none';
            hiddenMage.addEventListener('click', showMageDialogue);
        }

        // Start button event listener
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', startGame);
        }

        // Enter key to start game
        document.addEventListener('keydown', function(event) {
            const titleScreen = document.getElementById('titleScreen');
            if (event.key === 'Enter' && titleScreen && titleScreen.style.display !== 'none') {
                startGame();
            }
        });

        // Taskbar navigation
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        taskbarItems.forEach(item => {
            item.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                if (section) switchSection(section);
            });

            // Keyboard accessibility for taskbar
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const section = this.getAttribute('data-section');
                    if (section) switchSection(section);
                }
            });
        });

        // Menu items toggle
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                toggleMenu(this);
            });

            // Keyboard accessibility for menu items
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMenu(this);
                }
            });
        });

        // More info links
        const moreInfoLinks = document.querySelectorAll('.more-info-link');
        moreInfoLinks.forEach(link => {
            link.addEventListener('click', function() {
                playSound('menu');
                switchSection('missions');
            });
        });

        // === EASTER EGG: Portrait Click ===
        const portrait = document.querySelector('.portrait-sprite');
        const controller = document.getElementById('controllerOverlay');
        let clickCount = 0;

        if (portrait && controller) {
            portrait.addEventListener('click', () => {
                clickCount++;
                if (clickCount >= PORTRAIT_CLICK_THRESHOLD) {
                    controller.classList.remove('hidden');
                    playSound('menu');
                    clickCount = 0;
                }
                setTimeout(() => (clickCount = 0), CLICK_RESET_TIMEOUT);
            });
        }
    });


    // === CONTROLLER INTERACTIVITY ===
    function pressButton(key) {
        const btn = document.querySelector(`.btn[data-key="${key}"]`);
        if (!btn) return;
        btn.classList.add('pressed');
        playSound('menu');
        setTimeout(() => btn.classList.remove('pressed'), 150);
    }

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

    // === KONAMI CODE EASTER EGG ===
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let konamiIndex = 0;
    let konamiActivated = false;
    let konamiTimeoutId = null;

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

    function activateKonamiEasterEgg() {
        playSound('start');
        if (DEV_MODE) {
            console.log('🎉 KONAMI CODE ACTIVATED! 🎉');
            console.log('Secret hero mode unlocked!');
        }

        createConfetti();
    }

    function createConfetti() {
        const colors = ['#ffd700', '#87ceeb', '#ff69b4', '#00ff00', '#ff6347', '#9370db'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99999;
        overflow: hidden;
    `;
        document.body.appendChild(confettiContainer);

        // Create single style element for all animations
        const styleElement = document.createElement('style');
        let allKeyframes = '';

        for (let i = 0; i < CONFETTI_COUNT; i++) {
            const confetti = document.createElement('div');
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const startX = Math.random() * window.innerWidth;
            const endX = startX + (Math.random() - 0.5) * 200;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 0.5;
            const rotation = Math.random() * 360;
            const rotationSpeed = Math.random() * 720 - 360;

            confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            top: -20px;
            left: ${startX}px;
            opacity: 1;
            transform: rotate(${rotation}deg);
            animation: confettiFall${i} ${duration}s ease-in ${delay}s forwards;
        `;

            // Append keyframes to single string
            allKeyframes += `
            @keyframes confettiFall${i} {
                0% {
                    transform: translateY(0) translateX(0) rotate(${rotation}deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(${window.innerHeight + 20}px) translateX(${endX - startX}px) rotate(${rotation + rotationSpeed}deg);
                    opacity: 0;
                }
            }
        `;

            confettiContainer.appendChild(confetti);
        }

        // Add all keyframes at once
        styleElement.textContent = allKeyframes;
        document.head.appendChild(styleElement);

        // Clean up everything after animation completes
        setTimeout(() => {
            confettiContainer.remove();
            styleElement.remove();
        }, CONFETTI_CLEANUP_DELAY);
    }

    // === PARALLAX SCROLL EFFECT ===
    let layers = document.querySelectorAll('.parallax .layer');
    let lastScroll = 0;
    let parallaxAnimationId = null;
    let isParallaxActive = false;

    function animateParallax() {
        if (!isParallaxActive) return;

        lastScroll += (window.scrollY - lastScroll) * PARALLAX_SMOOTHING;
        layers.forEach(layer => {
            const speed = parseFloat(layer.dataset.speed);
            layer.style.transform = `translateY(${lastScroll * speed}px)`;
        });
        parallaxAnimationId = requestAnimationFrame(animateParallax);
    }

    function startParallax() {
        if (!isParallaxActive) {
            isParallaxActive = true;
            animateParallax();
        }
    }

    function stopParallax() {
        isParallaxActive = false;
        if (parallaxAnimationId) {
            cancelAnimationFrame(parallaxAnimationId);
            parallaxAnimationId = null;
        }
    }

    // Start parallax when page is visible
    if (document.visibilityState === 'visible') {
        startParallax();
    }

    // Stop/start parallax based on page visibility
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopParallax();
        } else {
            startParallax();
        }
    });


    // === MULTI-THEME PARALLAX SELECTOR ===
    const parallaxContainer = document.querySelector('.parallax');
    const themeSelector = document.getElementById('themeSelector');

    const themes = {
        forest: [{
                src: 'assets/forest/forest_sky.png',
                speed: 0.02
            },
            {
                src: 'assets/forest/forest_moon.png',
                speed: 0.03
            },
            {
                src: 'assets/forest/forest_mountain.png',
                speed: 0.06
            },
            {
                src: 'assets/forest/forest_back.png',
                speed: 0.12
            },
            {
                src: 'assets/forest/forest_mid.png',
                speed: 0.2
            },
            {
                src: 'assets/forest/forest_short.png',
                speed: 0.3
            },
            {
                src: 'assets/forest/forest_long.png',
                speed: 0.45
            },
        ],
        skies: [{
                src: 'assets/skies/Sky_sky.png',
                speed: 0.01
            },
            {
                src: 'assets/skies/Sky_back_mountain.png',
                speed: 0.03
            },
            {
                src: 'assets/skies/sky_moon.png',
                speed: 0.04
            },
            {
                src: 'assets/skies/sky_clouds.png',
                speed: 0.06
            },
            {
                src: 'assets/skies/sky_cloud_floor_2.png',
                speed: 0.09
            },
            {
                src: 'assets/skies/sky_cloud_floor.png',
                speed: 0.12
            },
            {
                src: 'assets/skies/Sky_cloud_single.png',
                speed: 0.15
            },
            {
                src: 'assets/skies/sky_front_mountain.png',
                speed: 0.22
            },
            {
                src: 'assets/skies/Sky_front_cloud.png',
                speed: 0.3
            },
        ],
        moon: [{
                src: 'assets/moon/moon_sky.png',
                speed: 0.01
            },
            {
                src: 'assets/moon/moon_earth.png',
                speed: 0.03
            },
            {
                src: 'assets/moon/moon_back.png',
                speed: 0.06
            },
            {
                src: 'assets/moon/moon_mid.png',
                speed: 0.12
            },
            {
                src: 'assets/moon/moon_floor.png',
                speed: 0.22
            },
            {
                src: 'assets/moon/moon_front.png',
                speed: 0.32
            },
        ],
        desert: [{
                src: 'assets/desert/desert_sky.png',
                speed: 0.01
            },
            {
                src: 'assets/desert/desert_mountain.png',
                speed: 0.04
            },
            {
                src: 'assets/desert/desert_moon.png',
                speed: 0.05
            },
            {
                src: 'assets/desert/desert_cloud.png',
                speed: 0.08
            },
            {
                src: 'assets/desert/desert_dunemid.png',
                speed: 0.18
            },
            {
                src: 'assets/desert/desert_dunefront.png',
                speed: 0.28
            },
        ]
    };

    function setParallaxTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) return;

        // Add loading indicator
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.disabled = true;
            themeSelector.style.opacity = '0.5';
        }

        parallaxContainer.style.opacity = 0;

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

            layers = document.querySelectorAll('.parallax .layer');

            parallaxContainer.style.opacity = 1;
            safeSetLocalStorage('selectedTheme', themeName);

            // Remove loading indicator
            if (themeSelector) {
                themeSelector.disabled = false;
                themeSelector.style.opacity = '1';
            }
        }, THEME_TRANSITION_DELAY);
    }

    // === SAFE LOCALSTORAGE ACCESS ===
    function safeSetLocalStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (DEV_MODE) console.log('localStorage not available:', e);
            return false;
        }
    }

    function safeGetLocalStorage(key, defaultValue) {
        try {
            return localStorage.getItem(key) || defaultValue;
        } catch (e) {
            if (DEV_MODE) console.log('localStorage not available:', e);
            return defaultValue;
        }
    }

    const savedTheme = safeGetLocalStorage('selectedTheme', 'forest');
    setParallaxTheme(savedTheme);
    if (themeSelector) themeSelector.value = savedTheme;

    if (themeSelector) {
        themeSelector.addEventListener('change', e => {
            setParallaxTheme(e.target.value);
        });
    }


    document.addEventListener('keydown', e => {
        checkKonamiCode(e.code);
    });

})(); // End of module