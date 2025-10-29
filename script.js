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
            '#ff0080'  // Magenta
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

            // Smart positioning: check if card would overflow on the right
            const cardWidth = 350; // card width from CSS
            const containerWidth = container.offsetWidth || 1400;
            const spaceOnRight = containerWidth - branchX;

            // Position card on left or right of marker based on available space
            if (spaceOnRight < cardWidth + 100) {
                // Position on the left
                card.style.right = `${containerWidth - branchX + 70}px`;
                card.style.left = 'auto';
                card.classList.add('card-left');
            } else {
                // Position on the right (default)
                card.style.left = `${branchX + 70}px`;
                card.style.right = 'auto';
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

        if (statsTab) statsTab.textContent = trans.navigation.stats;
        if (timelineTab) timelineTab.textContent = trans.navigation.timeline;
        if (missionsTab) missionsTab.textContent = trans.navigation.missions;
        if (contactTab) contactTab.textContent = trans.navigation.contact;

        // Update Stats Section
        const statsSection = document.getElementById('statsSection');
        if (statsSection && trans.stats) {
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
            const timelineHeader = timelineSection.querySelector('.menu-header span');
            const timelineInfo = timelineSection.querySelector('.info-box');
            if (timelineHeader) timelineHeader.textContent = trans.timeline.header;
            if (timelineInfo) timelineInfo.textContent = trans.timeline.info;

            // Rebuild timeline with new translations
            buildTimeline();
        }

        // Update Missions Section
        const missionsSection = document.getElementById('missionsSection');
        if (missionsSection && trans.missions) {
            const missionsHeader = missionsSection.querySelector('.menu-header span');
            const missionsInfo = missionsSection.querySelector('.info-box');
            if (missionsHeader) missionsHeader.textContent = trans.missions.header;
            if (missionsInfo) missionsInfo.textContent = trans.missions.info;

            const projectCards = missionsSection.querySelectorAll('.project-card');
            const projectKeys = ['project1', 'project2', 'project3'];
            projectCards.forEach((card, i) => {
                const data = trans.missions.projects[projectKeys[i]];
                if (data) {
                    card.querySelector('.project-title').textContent = data.title;
                    card.querySelector('.project-subtitle').textContent = data.subtitle;
                    card.querySelector('.project-date').textContent = data.date;
                    card.querySelector('.project-description').textContent = data.description;
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
        playSound('tab');

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


    // === VISIT COUNTER ===
    async function initVisitCounter() {
        try {
            const response = await fetch('https://api.countapi.xyz/hit/nilbl.github.io/visits');
            const data = await response.json();
            const countElement = document.getElementById('visitCount');
            if (countElement && data.value) {
                countElement.textContent = data.value;
            }
        } catch (error) {
            if (DEV_MODE) console.log('Visit counter error:', error);
            const countElement = document.getElementById('visitCount');
            if (countElement) {
                countElement.textContent = '---';
            }
        }
    }

    // === CONSOLIDATED DOM CONTENT LOADED ===
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize translations
        await initTranslations();

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

        // Initialize visit counter
        initVisitCounter();

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

})();