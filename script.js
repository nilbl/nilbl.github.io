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

    // === TRANSLATIONS ===
    let translations = {};
    let currentLanguage = safeGetLocalStorage('language', 'en');

    // Load translation JSON file
    async function loadTranslations(lang) {
        try {
            // Add cache-busting parameter to force reload
            const cacheBuster = new Date().getTime();
            const response = await fetch(`translations/${lang}.json?v=${cacheBuster}`);
            if (!response.ok) throw new Error('Translation file not found');
            return await response.json();
        } catch (error) {
            if (DEV_MODE) console.log(`Error loading ${lang} translations:`, error);
            // Fallback to English if translation fails
            if (lang !== 'en') {
                return await loadTranslations('en');
            }
            return {};
        }
    }

    // Initialize translations
    async function initTranslations() {
        translations[currentLanguage] = await loadTranslations(currentLanguage);
        updatePageLanguage();
    }

    async function changeLanguage(lang) {
        currentLanguage = lang;
        safeSetLocalStorage('language', lang);

        // Load new language if not cached
        if (!translations[lang]) {
            translations[lang] = await loadTranslations(lang);
        }

        updatePageLanguage();
        playSound('success');
    }

    function buildTimeline() {
        const trans = translations[currentLanguage];
        if (!trans || !trans.timeline || !trans.timeline.entries) return;

        const container = document.getElementById('timelineContainer');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Timeline configuration
        const MIN_YEAR = 2020;
        const MAX_YEAR = 2026;
        const CURRENT_YEAR = 2026;
        const YEAR_HEIGHT = 100; // pixels per year
        const TRUNK_X = 80; // X position of trunk
        const BRANCH_OFFSET = 50; // How far branches extend (increased from 30)
        const LANE_WIDTH = 120; // Width of each lane for overlapping branches (increased from 80)

        // Unique colors for each entry (different shades for visual distinction)
        const ENTRY_COLORS = [
            '#87ceeb', // Light blue
            '#ffd700', // Gold
            '#ff6b9d', // Pink
            '#9d4edd', // Purple
            '#06ffa5', // Mint green
            '#ff9e00', // Orange
            '#00d4ff', // Cyan
            '#ff5757', // Red
            '#b8f740', // Lime
            '#ff0080' // Magenta
        ];

        // Calculate container height
        const totalHeight = (MAX_YEAR - MIN_YEAR + 1) * YEAR_HEIGHT + 100;
        container.style.minHeight = `${totalHeight}px`;

        // Create main trunk - split into solid (up to 2025) and dashed (after 2025)
        const solidTrunkHeight = (2025 - MIN_YEAR) * YEAR_HEIGHT;
        const dashedTrunkHeight = (MAX_YEAR - 2025) * YEAR_HEIGHT;

        // Solid trunk (2020-2025)
        const solidTrunk = document.createElement('div');
        solidTrunk.className = 'timeline-trunk timeline-trunk-solid';
        solidTrunk.style.height = `${solidTrunkHeight}px`;
        container.appendChild(solidTrunk);

        // Dashed trunk (2025-2026)
        const dashedTrunk = document.createElement('div');
        dashedTrunk.className = 'timeline-trunk timeline-trunk-dashed';
        dashedTrunk.style.height = `${dashedTrunkHeight}px`;
        dashedTrunk.style.top = `${50 + solidTrunkHeight}px`;
        container.appendChild(dashedTrunk);

        // Create year markers
        for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
            const yearMarker = document.createElement('div');
            yearMarker.className = 'timeline-year';
            yearMarker.textContent = year;
            const yPos = ((year - MIN_YEAR) * YEAR_HEIGHT) + 50;
            yearMarker.style.top = `${yPos}px`;
            container.appendChild(yearMarker);
        }

        // Create SVG for branch paths
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('timeline-branches-svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', totalHeight);
        container.appendChild(svg);

        // Assign lanes to avoid overlapping branches
        const assignedLanes = [];
        let maxLane = 0;
        trans.timeline.entries.forEach(entry => {
            const startYear = entry.yearStart || entry.year;
            const endYear = entry.yearEnd || CURRENT_YEAR;

            // Find available lane
            let lane = 0;
            let laneFound = false;

            while (!laneFound) {
                let hasConflict = false;
                for (const assigned of assignedLanes) {
                    if (assigned.lane === lane) {
                        // Check for overlap
                        const overlapStart = Math.max(startYear, assigned.startYear);
                        const overlapEnd = Math.min(endYear, assigned.endYear);
                        if (overlapStart <= overlapEnd) {
                            hasConflict = true;
                            break;
                        }
                    }
                }

                if (!hasConflict) {
                    laneFound = true;
                    assignedLanes.push({
                        lane,
                        startYear,
                        endYear,
                        entry
                    });
                    entry.assignedLane = lane;
                    maxLane = Math.max(maxLane, lane);
                } else {
                    lane++;
                }
            }
        });

        // Calculate the total width needed for timeline content
        const totalTimelineWidth = TRUNK_X + BRANCH_OFFSET + (maxLane * LANE_WIDTH) + 450; // +450 for card space
        const containerViewportWidth = container.offsetWidth || 1400;

        // Set minimum width for the timeline content to enable scrolling if needed
        const minContentWidth = Math.max(totalTimelineWidth, containerViewportWidth);

        // Calculate centering offset
        let centerOffset = 0;
        if (totalTimelineWidth < containerViewportWidth) {
            // Content fits within viewport, center it
            centerOffset = (containerViewportWidth - totalTimelineWidth) / 2;
        }

        // Apply centering and set container properties
        container.style.paddingLeft = `${100 + centerOffset}px`;
        container.style.paddingRight = '100px'; // Add padding on the right for symmetry

        // Set a minimum width on the SVG and container to ensure proper layout
        svg.style.minWidth = `${minContentWidth}px`;

        // Draw branches and entries
        trans.timeline.entries.forEach((entry, index) => {
            const startYear = entry.yearStart || entry.year;
            let endYear = entry.yearEnd || CURRENT_YEAR;
            const isOngoing = entry.yearEnd === null;

            // If project starts and ends in the same year, make it span half a year for visibility
            const isSameYearProject = entry.yearStart === entry.yearEnd && entry.yearStart !== null;
            if (isSameYearProject) {
                // We'll adjust the visual representation to span 6 months (0.5 year)
                endYear = startYear + 0.5;
            }
            const lane = entry.assignedLane;

            // Assign unique color to this entry
            const entryColor = ENTRY_COLORS[index % ENTRY_COLORS.length];

            // Calculate positions
            const startY = ((startYear - MIN_YEAR) * YEAR_HEIGHT) + 50;
            const endY = ((endYear - MIN_YEAR) * YEAR_HEIGHT) + 50;
            const branchX = TRUNK_X + BRANCH_OFFSET + (lane * LANE_WIDTH);

            // Create SVG path for branch
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('timeline-branch-path', entry.type);
            if (isOngoing) {
                path.classList.add('ongoing');
            }

            // Apply unique color to the path
            path.style.stroke = entryColor;
            path.style.filter = `drop-shadow(0 0 8px ${entryColor}80)`;

            // Draw path: start from trunk, branch out, run parallel, branch back (or continue dashed)
            let pathD;
            if (isOngoing) {
                // Branch out and continue with dashed line
                pathD = `
                    M ${TRUNK_X} ${startY}
                    Q ${TRUNK_X + 15} ${startY}, ${TRUNK_X + BRANCH_OFFSET} ${startY + 20}
                    L ${branchX} ${startY + 30}
                    L ${branchX} ${endY}
                    L ${branchX} ${endY + 40}
                `;
            } else if (isSameYearProject) {
                // For same-year projects, create a more rectangular/square shape
                pathD = `
                    M ${TRUNK_X} ${startY}
                    Q ${TRUNK_X + 15} ${startY + 10}, ${TRUNK_X + BRANCH_OFFSET} ${startY + 25}
                    L ${branchX} ${startY + 35}
                    L ${branchX} ${endY - 35}
                    L ${TRUNK_X + BRANCH_OFFSET} ${endY - 25}
                    Q ${TRUNK_X + 15} ${endY - 10}, ${TRUNK_X} ${endY}
                `;
            } else {
                // Branch out, run, and merge back
                pathD = `
                    M ${TRUNK_X} ${startY}
                    Q ${TRUNK_X + 15} ${startY}, ${TRUNK_X + BRANCH_OFFSET} ${startY + 20}
                    L ${branchX} ${startY + 30}
                    L ${branchX} ${endY - 30}
                    Q ${branchX - 15} ${endY - 10}, ${TRUNK_X} ${endY}
                `;
            }

            path.setAttribute('d', pathD.trim());
            svg.appendChild(path);

            // Calculate middle position of the branch for marker placement
            const middleY = (startY + endY) / 2;

            // Create marker in the middle of the branch
            const marker = document.createElement('div');
            marker.className = `timeline-marker ${entry.type}`;
            marker.setAttribute('data-entry-id', `entry-${index}`);
            const icon = entry.type === 'education' ? 'hat.png' : (startYear >= 2024 ? 'hammer.png' : 'star.png');
            marker.innerHTML = `<img src="assets/${icon}" alt="${entry.type}" class="timeline-icon">`;
            marker.style.left = `${branchX}px`;
            marker.style.top = `${middleY}px`;
            marker.style.borderColor = entryColor;
            marker.style.boxShadow = `0 0 15px ${entryColor}99`;
            container.appendChild(marker);

            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'timeline-tooltip';
            tooltip.textContent = entry.title;
            tooltip.style.left = `${branchX}px`;
            tooltip.style.top = `${middleY - 70}px`;
            tooltip.style.borderColor = entryColor;
            tooltip.style.transform = 'translateX(-50%)'; // Center the tooltip horizontally
            container.appendChild(tooltip);

            // Create card (hidden by default)
            const card = document.createElement('div');
            card.className = 'timeline-entry-card';
            card.setAttribute('data-entry-id', `entry-${index}`);

            // Smart positioning: check if card would overflow on the right or left
            const cardWidth = 350; // card width from CSS
            const timelineFullContainer = document.querySelector('.timeline-full-container');
            const viewportWidth = timelineFullContainer ? timelineFullContainer.offsetWidth : 1400;
            const spaceOnRight = viewportWidth - branchX;
            const spaceOnLeft = branchX;

            // Determine best position for card
            if (spaceOnRight >= cardWidth + 100) {
                // Position on the right (default, best option)
                card.style.left = `${branchX + 70}px`;
                card.style.right = 'auto';
            } else if (spaceOnLeft >= cardWidth + 100) {
                // Position on the left (only if there's enough space)
                const leftPosition = Math.max(20, branchX - cardWidth - 70);
                card.style.left = `${leftPosition}px`;
                card.style.right = 'auto';
                card.classList.add('card-left');
            } else {
                // Not enough space on either side, position right but closer
                card.style.left = `${branchX + 30}px`;
                card.style.right = 'auto';
                card.style.maxWidth = '280px';
            }

            card.style.top = `${middleY - 60}px`;

            const dateRange = isOngoing ?
                `${startYear} - Present` :
                (startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`);

            card.innerHTML = `
                <div class="timeline-content">
                    <div class="timeline-date">${dateRange}</div>
                    <div class="timeline-title" style="color: ${entryColor};">${entry.title}</div>
                    <div class="timeline-subtitle">${entry.subtitle}</div>
                    <div class="timeline-description">${entry.description}</div>
                </div>
            `;
            container.appendChild(card);

            // Hover events for tooltip
            marker.addEventListener('mouseenter', function() {
                tooltip.classList.add('visible');
            });

            marker.addEventListener('mouseleave', function() {
                tooltip.classList.remove('visible');
            });

            // Click event to show/hide card
            marker.addEventListener('click', function(e) {
                e.stopPropagation();
                const isVisible = card.classList.contains('visible');

                // Hide all other cards and tooltips
                document.querySelectorAll('.timeline-entry-card.visible').forEach(c => {
                    c.classList.remove('visible');
                });
                document.querySelectorAll('.timeline-tooltip.visible').forEach(t => {
                    t.classList.remove('visible');
                });

                // Toggle this card
                if (!isVisible) {
                    card.classList.add('visible');
                }

                playSound('marker');
            });
        });

        // Close card when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.timeline-marker') && !e.target.closest('.timeline-entry-card')) {
                document.querySelectorAll('.timeline-entry-card.visible').forEach(c => {
                    c.classList.remove('visible');
                });
            }
        });

        // Hide scroll hint after user scrolls the timeline
        let hasScrolled = false;
        container.addEventListener('scroll', function() {
            if (!hasScrolled && container.scrollLeft > 10) {
                hasScrolled = true;
                const timelineFullContainer = document.querySelector('.timeline-full-container');
                if (timelineFullContainer) {
                    timelineFullContainer.style.setProperty('--scroll-hint-opacity', '0');
                }
            }
        });
    }

    function updatePageLanguage() {
        const trans = translations[currentLanguage];
        if (!trans) return;

        // Update language dropdown button text
        const langText = document.querySelector('.lang-text');
        if (langText) {
            langText.textContent = currentLanguage.toUpperCase();
        }

        // Update navigation tabs
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

        // Update Stats Section
        const statsSection = document.getElementById('statsSection');
        if (statsSection && trans.stats) {
            // Hero title
            const heroTitle = statsSection.querySelector('.hero-title');
            if (heroTitle && trans.stats.heroTitle) {
                heroTitle.innerHTML = trans.stats.heroTitle;
            }

            // Header
            const statsHeader = statsSection.querySelector('.menu-header span');
            const statsInfo = statsSection.querySelector('.info-box');
            if (statsHeader) statsHeader.textContent = trans.stats.header;
            if (statsInfo) statsInfo.textContent = trans.stats.info;

            // Education
            const eduItems = statsSection.querySelectorAll('.menu-item');
            if (eduItems[0] && trans.stats.education) {
                eduItems[0].querySelector('.menu-item-title span').textContent = trans.stats.education.title;
                eduItems[0].querySelector('.entry-title').textContent = trans.stats.education.degree;
                eduItems[0].querySelector('.entry-subtitle').textContent = trans.stats.education.school;
                eduItems[0].querySelector('.entry-date').textContent = trans.stats.education.date;
                eduItems[0].querySelector('.entry-description').textContent = trans.stats.education.description;
            }

            // Experience
            if (eduItems[1] && trans.stats.experience) {
                eduItems[1].querySelector('.menu-item-title span').textContent = trans.stats.experience.title;
                eduItems[1].querySelector('.entry-title').textContent = trans.stats.experience.job1.title;
                eduItems[1].querySelector('.entry-subtitle').textContent = trans.stats.experience.job1.company;
                eduItems[1].querySelector('.entry-date').textContent = trans.stats.experience.job1.date;
                const taskList = eduItems[1].querySelectorAll('.entry-list li');
                trans.stats.experience.job1.tasks.forEach((task, i) => {
                    if (taskList[i]) taskList[i].textContent = task;
                });
                const moreInfo = eduItems[1].querySelector('.more-info-link');
                if (moreInfo) moreInfo.textContent = trans.stats.experience.moreInfo;
            }

            // Other Experience
            if (eduItems[2] && trans.stats.otherExperience) {
                eduItems[2].querySelector('.menu-item-title span').textContent = trans.stats.otherExperience.title;
                const otherEntries = eduItems[2].querySelectorAll('.content-entry');
                if (otherEntries[0]) {
                    otherEntries[0].querySelector('.entry-title').textContent = trans.stats.otherExperience.job1.title;
                    otherEntries[0].querySelector('.entry-subtitle').textContent = trans.stats.otherExperience.job1.company;
                    otherEntries[0].querySelector('.entry-date').textContent = trans.stats.otherExperience.job1.date;
                    otherEntries[0].querySelector('.entry-description').textContent = trans.stats.otherExperience.job1.description;
                }
                if (otherEntries[1]) {
                    otherEntries[1].querySelector('.entry-title').textContent = trans.stats.otherExperience.job2.title;
                    otherEntries[1].querySelector('.entry-subtitle').textContent = trans.stats.otherExperience.job2.company;
                    otherEntries[1].querySelector('.entry-date').textContent = trans.stats.otherExperience.job2.date;
                    otherEntries[1].querySelector('.entry-description').textContent = trans.stats.otherExperience.job2.description;
                }
            }

            // Skills
            if (eduItems[3] && trans.stats.skills) {
                eduItems[3].querySelector('.menu-item-title span').textContent = trans.stats.skills.title;
            }
        }

        // Update Timeline Section
        const timelineSection = document.getElementById('timelineSection');
        if (timelineSection && trans.timeline) {
            const timelineHeader = timelineSection.querySelector('.timeline-main-header span');
            const timelineInfo = timelineSection.querySelector('.timeline-subtitle');
            if (timelineHeader) timelineHeader.textContent = trans.timeline.header;
            if (timelineInfo) timelineInfo.textContent = trans.timeline.info;

            // Rebuild timeline with new translations
            buildTimeline();
        }

        // Update Missions Section
        const missionsSection = document.getElementById('missionsSection');
        if (missionsSection && trans.missions) {
            // Update hero titles
            const missionsHeroName = missionsSection.querySelector('.hero-name');
            const missionsHeroTitle = missionsSection.querySelector('.character-portrait .hero-title');
            if (missionsHeroName && trans.missions.heroName) {
                missionsHeroName.textContent = trans.missions.heroName;
            }
            if (missionsHeroTitle && trans.missions.heroSubtitle) {
                missionsHeroTitle.innerHTML = trans.missions.heroSubtitle;
            }

            // Update header and info
            const missionsHeader = missionsSection.querySelector('.menu-header span');
            const missionsInfo = missionsSection.querySelector('.info-box');
            if (missionsHeader) missionsHeader.textContent = trans.missions.header;
            if (missionsInfo) missionsInfo.textContent = trans.missions.info;

            // Update project entries
            const projectEntries = missionsSection.querySelectorAll('.content-entry');
            const projectKeys = ['project1', 'project2', 'project3'];
            projectEntries.forEach((entry, i) => {
                const data = trans.missions.projects[projectKeys[i]];
                if (data) {
                    const title = entry.querySelector('.entry-title');
                    const subtitle = entry.querySelector('.entry-subtitle');
                    const date = entry.querySelector('.entry-date');
                    const description = entry.querySelector('.entry-description');

                    // Update title (preserve icon)
                    if (title) {
                        const icon = title.querySelector('img');
                        if (icon) {
                            title.innerHTML = '';
                            title.appendChild(icon);
                            title.appendChild(document.createTextNode(data.title));
                        } else {
                            title.textContent = data.title;
                        }
                    }
                    if (subtitle) subtitle.textContent = data.subtitle;
                    if (date) date.textContent = data.date;
                    if (description) description.textContent = data.description;
                }
            });
        }

        // Update Contact Section
        const contactSection = document.getElementById('contactSection');
        if (contactSection && trans.contact) {
            const contactHeader = contactSection.querySelector('.menu-header span');
            const contactInfo = contactSection.querySelector('.info-box');
            if (contactHeader) contactHeader.textContent = trans.contact.header;
            if (contactInfo) contactInfo.textContent = trans.contact.info;

            const contactTitle = contactSection.querySelector('.contact-title');
            const contactSubtitle = contactSection.querySelector('.contact-subtitle');
            if (contactTitle) contactTitle.textContent = trans.contact.title;
            if (contactSubtitle) contactSubtitle.innerHTML = trans.contact.subtitle;

            const contactLabels = contactSection.querySelectorAll('.contact-label');
            if (contactLabels[0]) contactLabels[0].textContent = trans.contact.fields.email;
            if (contactLabels[1]) contactLabels[1].textContent = trans.contact.fields.linkedin;
            if (contactLabels[2]) contactLabels[2].textContent = trans.contact.fields.github;
            if (contactLabels[3]) contactLabels[3].textContent = trans.contact.fields.portfolio;
        }

        // Update Game Section
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

        // Update Visitors Section
        const visitorsSection = document.getElementById('visitorsSection');
        if (visitorsSection && trans.visitors) {
            const visitorsTitle = visitorsSection.querySelector('.section-title span');
            const visitorsSubtitle = visitorsSection.querySelector('.section-subtitle');

            if (visitorsTitle) visitorsTitle.textContent = trans.visitors.title;
            if (visitorsSubtitle) visitorsSubtitle.textContent = trans.visitors.subtitle;
        }

        // Update Footer
        if (trans.footer) {
            const footerText = document.querySelector('.footer-info span');
            const visitCounterLabel = document.querySelector('.visit-counter span:first-child');
            if (footerText) footerText.textContent = trans.footer.text;
            if (visitCounterLabel) visitCounterLabel.textContent = trans.footer.visitCounter;
        }

        // Update language dropdown options active state
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.getAttribute('data-lang') === currentLanguage) {
                opt.classList.add('active');
            }
        });
    }

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
                        }, 50);
                    }, THEME_TRANSITION_DELAY);
                }, 500);
            }
        }, LOADING_INTERVAL);
    }


    function toggleMenu(element) {
        // Sound is played in the click handler

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

        const sectionMap = {
            'stats': {
                element: document.getElementById('statsSection'),
                index: 0
            },
            'timeline': {
                element: document.getElementById('timelineSection'),
                index: 1
            },
            'missions': {
                element: document.getElementById('missionsSection'),
                index: 2
            },
            'contact': {
                element: document.getElementById('contactSection'),
                index: 3
            },
            'game': {
                element: document.getElementById('gameSection'),
                index: 4
            },
            'visitors': {
                element: document.getElementById('visitorsSection'),
                index: 5
            }
        };

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

            // Handle visitors section - force widget to recalculate dimensions
            if (section === 'visitors') {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            }
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Enhanced retro sound system with multiple sound categories
    function playSound(type) {
        const ctx = getAudioContext();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Sound configurations for different interactions
            const soundProfiles = {
                // Navigation and menu clicks
                'menu': {
                    frequency: 800,
                    type: 'square',
                    duration: 0.08,
                    volume: 0.12
                },
                // Tab/section switching
                'tab': {
                    frequency: 1000,
                    type: 'sine',
                    duration: 0.1,
                    volume: 0.15
                },
                // Timeline markers and icons
                'marker': {
                    frequency: 1200,
                    type: 'triangle',
                    duration: 0.06,
                    volume: 0.1
                },
                // Dropdown and modal opens
                'open': {
                    frequency: 600,
                    type: 'sine',
                    duration: 0.12,
                    volume: 0.13,
                    frequencyEnd: 900
                },
                // Start/confirm actions
                'start': {
                    frequency: 400,
                    type: 'square',
                    duration: 0.15,
                    volume: 0.14,
                    frequencyEnd: 800
                },
                // Hover effects (very subtle)
                'hover': {
                    frequency: 1400,
                    type: 'sine',
                    duration: 0.04,
                    volume: 0.06
                },
                // Success/completion
                'success': {
                    frequency: 800,
                    type: 'sine',
                    duration: 0.2,
                    volume: 0.12,
                    frequencyEnd: 1200
                }
            };

            const profile = soundProfiles[type] || soundProfiles['menu'];

            oscillator.type = profile.type;
            oscillator.frequency.setValueAtTime(profile.frequency, ctx.currentTime);

            // Add frequency sweep for certain sounds
            if (profile.frequencyEnd) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    profile.frequencyEnd,
                    ctx.currentTime + profile.duration * 0.7
                );
            }

            // Volume envelope for smoother sound
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(profile.volume, ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + profile.duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + profile.duration);
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

    // Game-specific mage dialogues
    const mageGameDialogues = {
        roll: [
            "Feeling lucky, are we?",
            "Let's see if fortune favors you...",
            "The dice whisper secrets to me...",
            "Bold move! Or foolish?",
            "My magic senses trouble ahead...",
            "Interesting choice, mortal...",
            "The fates are watching...",
            "Roll wisely, young apprentice!",
            "I've seen this before... it never ends well.",
            "Your confidence amuses me!"
        ],
        win: [
            "Impressive! But can you do it again?",
            "You've bested me... this time.",
            "Lucky roll! My turn next time.",
            "Beginner's luck, surely!",
            "The mystical forces smiled upon you today."
        ],
        lose: [
            "As I predicted! The dice never lie.",
            "Better luck next time, apprentice!",
            "The mystic arts triumph again!",
            "Perhaps more practice is needed?",
            "The mage always wins in the end!"
        ]
    };

    let lastDialogueIndex = -1;
    let lastGameDialogueIndex = {
        roll: -1,
        win: -1,
        lose: -1
    };
    let mageTypingInterval = null;
    let hideTimeout = null;

    function showMageDialogue() {
        playSound('success'); // Mystical discovery sound

        // Get hidden mage (not game mage) dialogue box
        const hiddenMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');
        if (!hiddenMage) return;

        const dialogue = hiddenMage.querySelector('.mage-dialogue');
        if (!dialogue) return;

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

    // Boss HP System
    const MAX_BOSS_HP = 100;
    let bossHP = parseInt(safeGetLocalStorage('bossHP', MAX_BOSS_HP));
    let hpAnimationTimeout = null;

    function getBossHP() {
        return bossHP;
    }

    function setBossHP(newHP) {
        bossHP = Math.max(0, Math.min(MAX_BOSS_HP, newHP));
        safeSetLocalStorage('bossHP', bossHP);
        animateBossHP(bossHP);

        // Check if boss is defeated
        if (bossHP <= 0) {
            onBossDefeated();
        }
    }

    function animateBossHP(targetHP) {
        const hpFill = document.getElementById('bossHpFill');
        if (!hpFill) return;

        // Clear any existing animation
        if (hpAnimationTimeout) {
            clearTimeout(hpAnimationTimeout);
        }

        // Animate to target HP percentage
        const targetPercent = (targetHP / MAX_BOSS_HP) * 100;
        hpFill.style.width = `${targetPercent}%`;
    }

    function initBossHP() {
        const hpFill = document.getElementById('bossHpFill');
        if (hpFill) {
            const currentPercent = (bossHP / MAX_BOSS_HP) * 100;
            hpFill.style.width = `${currentPercent}%`;
        }
    }

    function onBossDefeated() {
        console.log('🎉 BOSS DEFEATED! This will trigger special events later...');
        createConfetti();
        // TODO: Implement special victory sequence
    }

    // Game sound system
    let consecutiveRolls = 0; // Track consecutive rolls without game ending

    function playGameSound(soundFile, pitchScale = false) {
        const audio = new Audio(`assets/sounds/${soundFile}`);
        audio.volume = 0.6;

        if (pitchScale) {
            // Increase pitch much more aggressively: 0.2 per consecutive roll (max 3.0)
            // Start at 1.0 for first roll, then increase
            const pitchRate = Math.min(1.0 + (consecutiveRolls * 0.2), 3.0);
            audio.playbackRate = pitchRate;
        }

        audio.play().catch(err => {
            if (DEV_MODE) console.log('Game sound play error:', err);
        });
    }

    function resetPitch() {
        consecutiveRolls = 0;
    }

    // Voice sound system for joker
    let currentVoiceAudio = null;
    let voiceSoundInterval = null;
    let lastVoiceNum = null;

    function playRandomVoiceSound() {
        // Stop previous voice sound if playing
        if (currentVoiceAudio) {
            currentVoiceAudio.pause();
            currentVoiceAudio = null;
        }

        // Play random voice sound (1-11), avoiding repetition
        let voiceNum;
        do {
            voiceNum = Math.floor(Math.random() * 11) + 1;
        } while (voiceNum === lastVoiceNum && lastVoiceNum !== null);

        lastVoiceNum = voiceNum;

        currentVoiceAudio = new Audio(`assets/sounds/voice${voiceNum}.ogg`);
        currentVoiceAudio.volume = 0.5;
        currentVoiceAudio.playbackRate = 2.1; // Double speed

        currentVoiceAudio.play().catch(err => {
            if (DEV_MODE) console.log('Voice sound play error:', err);
        });

        // When this sound ends, play the next one
        currentVoiceAudio.addEventListener('ended', () => {
            if (voiceSoundInterval) {
                playRandomVoiceSound();
            }
        });
    }

    function startVoiceSounds() {
        // Don't play voice sounds on mobile (when joker is hidden)
        if (window.innerWidth <= 1400) return;

        voiceSoundInterval = true;
        playRandomVoiceSound();
    }

    function stopVoiceSounds() {
        voiceSoundInterval = null;
        lastVoiceNum = null; // Reset so any voice can play next time
        if (currentVoiceAudio) {
            currentVoiceAudio.pause();
            currentVoiceAudio = null;
        }
    }

    // Show game-specific mage dialogue
    function showGameMageDialogue(type) {
        const balatrOJoker = document.getElementById('balatrOJoker');
        if (!balatrOJoker || !balatrOJoker.classList.contains('visible')) return;

        playSound('success');
        const dialogue = balatrOJoker.querySelector('.joker-dialogue');

        // Get dialogues from translations, fallback to hardcoded English
        const trans = translations[currentLanguage] ?.game ?.mageDialogues || {};
        const dialogueArray = trans[type] || mageGameDialogues[type];

        if (!dialogue || !dialogueArray) return;

        // Clear any existing timeouts and stop trembling/voice sounds
        if (mageTypingInterval) clearTimeout(mageTypingInterval);
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            balatrOJoker.classList.remove('trembling');
        }
        stopVoiceSounds();

        // Select random dialogue (avoid repetition)
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * dialogueArray.length);
        } while (randomIndex === lastGameDialogueIndex[type] && dialogueArray.length > 1);

        lastGameDialogueIndex[type] = randomIndex;
        const fullText = dialogueArray[randomIndex];

        dialogue.textContent = '';
        dialogue.classList.add('active');

        // Start trembling animation and voice sounds
        balatrOJoker.classList.add('trembling');
        startVoiceSounds();

        let i = 0;

        function typeNextLetter() {
            dialogue.textContent += fullText.charAt(i);
            i++;

            if (i < fullText.length) {
                const randomSpeed = Math.floor(Math.random() * 75) + 30;
                mageTypingInterval = setTimeout(typeNextLetter, randomSpeed);
            } else {
                // Stop trembling and voice sounds when typing finishes
                balatrOJoker.classList.remove('trembling');
                stopVoiceSounds();
                mageTypingInterval = null;
                hideTimeout = setTimeout(() => {
                    dialogue.classList.remove('active');
                    hideTimeout = null;
                }, MAGE_HIDE_DELAY);
            }
        }

        typeNextLetter();
    }

    // === SMOKE EFFECT ANIMATION ===
    function animateSmoke(targetElement, onComplete) {
        if (!targetElement) {
            if (onComplete) onComplete();
            return;
        }

        // Create smoke overlay element
        const smokeOverlay = document.createElement('div');
        smokeOverlay.className = 'smoke-effect';

        // Position smoke centered on target element's location
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        smokeOverlay.style.left = centerX + 'px';
        smokeOverlay.style.top = centerY + 'px';

        document.body.appendChild(smokeOverlay);

        // Smoke frames array
        const smokeFrames = [
            'assets/FX001/FX001_01.png',
            'assets/FX001/FX001_02.png',
            'assets/FX001/FX001_03.png',
            'assets/FX001/FX001_04.png',
            'assets/FX001/FX001_05.png'
        ];

        let frameIndex = 0;

        // Animate through frames
        const frameInterval = setInterval(() => {
            if (frameIndex < smokeFrames.length) {
                smokeOverlay.style.backgroundImage = `url('${smokeFrames[frameIndex]}')`;
                frameIndex++;
            } else {
                // Animation complete
                clearInterval(frameInterval);
                smokeOverlay.remove();
                if (onComplete) onComplete();
            }
        }, 100); // 100ms per frame (matching dice animation)

        playSound('tab'); // Smoke sound effect
    }


    // === VISIT COUNTER ===
    async function initVisitCounter() {
        const countElement = document.getElementById('visitCount');
        if (!countElement) return;

        // Show loading state
        countElement.textContent = '...';

        try {
            // Use a simpler API endpoint that's more reliable
            const response = await fetch('https://api.countapi.xyz/hit/nilbl.github.io/visits', {
                method: 'GET',
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('CountAPI response:', data); // Debug log
                if (data && typeof data.value === 'number') {
                    countElement.textContent = data.value.toLocaleString();
                    countElement.title = 'Global visitor count';
                    return;
                }
            } else {
                console.log('CountAPI status:', response.status);
            }
        } catch (e) {
            console.log('CountAPI error:', e);
        }

        // Fallback: Use localStorage for local counting (better than showing ---)
        let localCount = parseInt(safeGetLocalStorage('local-visit-count', '0'));
        localCount++;
        safeSetLocalStorage('local-visit-count', localCount.toString());
        countElement.textContent = localCount.toLocaleString() + '*';
        countElement.title = 'Local counter (API unavailable - this counts your visits only)';
    }

    // === CONSOLIDATED DOM CONTENT LOADED ===
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize translations
        await initTranslations();

        // Initialize Boss HP bar
        initBossHP();

        // Language dropdown functionality
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
                    changeLanguage(lang);
                    langDropdownMenu.classList.remove('active');
                });
            });
        }

        // Hamburger menu functionality
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

        // Initialize visit counter
        initVisitCounter();

        // Initialize hidden mage (global)
        const hiddenMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');
        if (hiddenMage) {
            hiddenMage.style.display = 'none';
            hiddenMage.addEventListener('click', showMageDialogue);
        }

        // Initialize game section mage
        const balatrOJoker = document.getElementById('balatrOJoker');
        if (balatrOJoker) {
            balatrOJoker.addEventListener('click', () => {
                // Random chance to show roll dialogue when clicked
                showGameMageDialogue('roll');
            });
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
                playSound('open');
                toggleMenu(this);
            });

            // Keyboard accessibility for menu items
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playSound('open');
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
                playSound('hover'); // Subtle click feedback
                if (clickCount >= PORTRAIT_CLICK_THRESHOLD) {
                    controller.classList.remove('hidden');
                    playSound('success'); // Success sound for unlocking
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
            console.log('KONAMI CODE ACTIVATED!');
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
    const themeSelectors = document.querySelectorAll('.theme-selector');

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
        const themeSelector = themeSelectors[0];
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

    // Set initial value for all theme selectors
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


    document.addEventListener('keydown', e => {
        checkKonamiCode(e.code);
    });

    // === DICE GAME ===
    const diceGame = {
        playerScore: 0,
        computerScore: 0,
        isPlayerTurn: true,
        gameOver: false,

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

        rollDice() {
            return [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ];
        },

        animateDice(dice1Val, dice2Val) {
            const dice1Img = this.dice1.querySelector('.dice-img');
            const dice2Img = this.dice2.querySelector('.dice-img');

            // Add rolling class to trigger spin animation
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
            }, 100); // Change frame every 100ms (6 frames = 600ms total)

            // After animation completes, show final result
            setTimeout(() => {
                clearInterval(frameInterval);
                // White dice results: Dice 1-6 Light (1).png to (6).png
                dice1Img.src = `assets/1-6 Pip Flat Dice (Stlye 1)/Dice 1-6 Light (${dice1Val}).png`;
                // Black dice results: 1-6 Dice Dark (01).png to (06).png
                const blackNum = dice2Val.toString().padStart(2, '0');
                dice2Img.src = `assets/1-6 Pip Flat Dice (Stlye 1)/1-6 Dice Dark (${blackNum}).png`;
                this.dice1.classList.remove('rolling');
                this.dice2.classList.remove('rolling');
            }, 600);
        },

        updateMessage(message, isError = false) {
            this.gameMessageEl.textContent = message;
            this.gameMessageEl.style.color = isError ? '#ff6b6b' : '#5effb2';
        },

        playerRoll() {
            if (this.gameOver || !this.isPlayerTurn) return;

            playSound('tab');
            const [dice1, dice2] = this.rollDice();
            const roll = dice1 + dice2;

            this.animateDice(dice1, dice2);

            // Play multhit2 with pitch scaling
            consecutiveRolls++;
            playGameSound('multhit2.ogg', true);

            setTimeout(() => {
                this.playerScore += roll;
                this.playerScoreEl.textContent = this.playerScore;

                const trans = translations[currentLanguage] ?.game || {};

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
                    this.updateMessage(trans.playerRolled ?.replace('{roll}', roll).replace('{score}', this.playerScore) || `You rolled ${roll}! Total: ${this.playerScore}. Roll again or Stand?`);
                    this.standBtn.disabled = false;

                    // 40% chance for joker to speak, only if not already speaking and joker is visible (desktop)
                    if (Math.random() < 0.4 && !mageTypingInterval && window.innerWidth > 1400) {
                        setTimeout(() => {
                            showGameMageDialogue('roll');
                            resetPitch(); // Reset when joker speaks
                        }, 300);
                    }
                }
            }, 650);
        },

        playerStand() {
            if (this.gameOver || !this.isPlayerTurn) return;

            playSound('open');
            this.isPlayerTurn = false;
            this.rollBtn.disabled = true;
            this.standBtn.disabled = true;

            const trans = translations[currentLanguage] ?.game || {};
            this.updateMessage(trans.playerStands ?.replace('{score}', this.playerScore) || `You stand at ${this.playerScore}. Computer's turn...`);

            setTimeout(() => {
                this.computerPlay();
            }, 1500);
        },

        computerPlay() {
            const trans = translations[currentLanguage] ?.game || {};

            // Computer AI: Roll if score < 17, or if player is ahead and computer < 21
            if (this.computerScore < 17 || (this.computerScore < this.playerScore && this.computerScore < 21)) {
                playSound('tab');
                const [dice1, dice2] = this.rollDice();
                const roll = dice1 + dice2;

                this.animateDice(dice1, dice2);

                // Play multhit2 with pitch scaling
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
                        // Computer wins immediately if it beats player's score without busting
                        this.updateMessage(trans.computerWinsHigher ?.replace('{playerScore}', this.playerScore).replace('{computerScore}', this.computerScore) || `Computer wins! ${this.computerScore} vs ${this.playerScore}`, true);
                        this.gameOver = true;
                        this.endGame(false);
                        playGameSound('timpani.ogg');
                        resetPitch();
                    } else {
                        this.updateMessage(trans.computerRolled ?.replace('{roll}', roll).replace('{score}', this.computerScore) || `Computer rolled ${roll}! Total: ${this.computerScore}...`);
                        setTimeout(() => this.computerPlay(), 1500);
                    }
                }, 650);
            } else {
                this.updateMessage(trans.computerStands ?.replace('{score}', this.computerScore) || `Computer stands at ${this.computerScore}...`);
                setTimeout(() => this.determineWinner(), 1500);
            }
        },

        determineWinner() {
            const trans = translations[currentLanguage] ?.game || {};

            if (this.playerScore > this.computerScore) {
                this.updateMessage(trans.playerWinsHigher ?.replace('{playerScore}', this.playerScore).replace('{computerScore}', this.computerScore) || `You win! ${this.playerScore} vs ${this.computerScore}`);
                playGameSound('win.ogg');
                this.endGame(true, 'normal');
                resetPitch();
            } else if (this.computerScore > this.playerScore) {
                this.updateMessage(trans.computerWinsHigher ?.replace('{playerScore}', this.playerScore).replace('{computerScore}', this.computerScore) || `Computer wins! ${this.computerScore} vs ${this.playerScore}`, true);
                playGameSound('timpani.ogg');
                this.endGame(false);
                resetPitch();
            } else {
                this.updateMessage(trans.tie ?.replace('{score}', this.playerScore) || `It's a tie at ${this.playerScore}!`);
                playGameSound('whoosh.ogg');
                this.endGame(null);
                resetPitch();
            }

            this.gameOver = true;
        },

        endGame(playerWon, winType = 'normal') {
            this.rollBtn.disabled = true;
            this.standBtn.disabled = true;

            const trans = translations[currentLanguage] ?.game || {};
            let result = playerWon === true ? (trans.victory || 'VICTORY!') :
                playerWon === false ? (trans.defeat || 'DEFEAT') :
                (trans.draw || '🤝 DRAW');

            this.historyEl.textContent = result;

            // Update Boss HP based on outcome
            if (playerWon === true) {
                if (winType === 'perfect21') {
                    // Perfect 21: Take 50 HP
                    setBossHP(getBossHP() - 50);
                } else {
                    // Normal win: Take 30 HP (increased from 20)
                    setBossHP(getBossHP() - 30);
                }
            } else if (playerWon === false) {
                if (winType === 'bossPerfect21') {
                    // Boss perfect 21: Recover half HP (changed from full)
                    setBossHP(getBossHP() + 50);
                } else {
                    // Boss wins: Recover 15 HP
                    setBossHP(getBossHP() + 15);
                }
            }
            // Draw: No HP change

            // Joker comments on game outcome (only on desktop)
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

        resetGame() {
            playSound('hover');
            resetPitch(); // Reset pitch for new game
            this.playerScore = 0;
            this.computerScore = 0;
            this.isPlayerTurn = true;
            this.gameOver = false;

            this.playerScoreEl.textContent = '0';
            this.computerScoreEl.textContent = '0';

            // Reset dice images to initial state
            const dice1Img = this.dice1.querySelector('.dice-img');
            const dice2Img = this.dice2.querySelector('.dice-img');
            if (dice1Img) dice1Img.src = 'assets/1-6 Pip Flat Dice (Stlye 1)/Dice 1-6 Light (1).png'; // White dice showing 1
            if (dice2Img) dice2Img.src = 'assets/1-6 Pip Flat Dice (Stlye 1)/1-6 Dice Dark (01).png'; // Black dice showing 1

            this.rollBtn.disabled = false;
            this.standBtn.disabled = true;

            const trans = translations[currentLanguage] ?.game || {};
            this.updateMessage(trans.gameStart || 'Click "Roll Dice" to start!');
            this.historyEl.textContent = '';
        }
    };

    // Initialize game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => diceGame.init());
    } else {
        diceGame.init();
    }

})();