// === TIMELINE BUILDER ===

import { playSound } from '../components/soundSystem.js';
import { getTranslations } from '../core/translations.js';

// Timeline configuration
const MIN_YEAR = 2020;
const MAX_YEAR = 2026;
const CURRENT_YEAR = 2026;
const YEAR_HEIGHT = 100; // pixels per year
const TRUNK_X = 80; // X position of trunk
const BRANCH_OFFSET = 50; // How far branches extend
const LANE_WIDTH = 120; // Width of each lane for overlapping branches

// Unique colors for each entry
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

/**
 * Build the timeline visualization
 */
export function buildTimeline() {
    const trans = getTranslations();
    if (!trans || !trans.timeline || !trans.timeline.entries) return;

    const container = document.getElementById('timelineContainer');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

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
    const assignedLanes = assignLanes(trans.timeline.entries);
    const maxLane = Math.max(...assignedLanes.map(a => a.lane));

    // Calculate the total width needed for timeline content
    const totalTimelineWidth = TRUNK_X + BRANCH_OFFSET + (maxLane * LANE_WIDTH) + 450;
    const containerViewportWidth = container.offsetWidth || 1400;

    // Set minimum width for the timeline content to enable scrolling if needed
    const minContentWidth = Math.max(totalTimelineWidth, containerViewportWidth);

    // Calculate centering offset
    let centerOffset = 0;
    if (totalTimelineWidth < containerViewportWidth) {
        centerOffset = (containerViewportWidth - totalTimelineWidth) / 2;
    }

    // Apply centering and set container properties
    container.style.paddingLeft = `${100 + centerOffset}px`;
    container.style.paddingRight = '100px';
    svg.style.minWidth = `${minContentWidth}px`;

    // Draw branches and entries
    trans.timeline.entries.forEach((entry, index) => {
        drawTimelineEntry(entry, index, container, svg);
    });

    // Close card when clicking outside
    setupOutsideClickHandler();

    // Hide scroll hint after user scrolls
    setupScrollHint(container);
}

/**
 * Assign lanes to timeline entries to avoid overlap
 * @param {Array} entries - Timeline entries
 * @returns {Array} Assigned lanes
 */
function assignLanes(entries) {
    const assignedLanes = [];
    let maxLane = 0;

    entries.forEach(entry => {
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

    return assignedLanes;
}

/**
 * Draw a single timeline entry
 * @param {Object} entry - Timeline entry data
 * @param {number} index - Entry index
 * @param {HTMLElement} container - Timeline container
 * @param {SVGElement} svg - SVG element for paths
 */
function drawTimelineEntry(entry, index, container, svg) {
    const startYear = entry.yearStart || entry.year;
    let endYear = entry.yearEnd || CURRENT_YEAR;
    const isOngoing = entry.yearEnd === null;

    // If project starts and ends in the same year, make it span half a year
    const isSameYearProject = entry.yearStart === entry.yearEnd && entry.yearStart !== null;
    if (isSameYearProject) {
        endYear = startYear + 0.5;
    }
    const lane = entry.assignedLane;

    // Assign unique color
    const entryColor = ENTRY_COLORS[index % ENTRY_COLORS.length];

    // Calculate positions
    const startY = ((startYear - MIN_YEAR) * YEAR_HEIGHT) + 50;
    const endY = ((endYear - MIN_YEAR) * YEAR_HEIGHT) + 50;
    const branchX = TRUNK_X + BRANCH_OFFSET + (lane * LANE_WIDTH);

    // Create branch path
    drawBranchPath(svg, startY, endY, branchX, isOngoing, isSameYearProject, entry.type, entryColor);

    // Calculate middle position
    const middleY = (startY + endY) / 2;

    // Create marker
    createMarker(container, entry, index, branchX, middleY, entryColor);

    // Create tooltip
    createTooltip(container, entry.title, branchX, middleY, entryColor);

    // Create card
    createCard(container, entry, index, startYear, endYear, isOngoing, branchX, middleY, entryColor);
}

/**
 * Draw SVG branch path
 */
function drawBranchPath(svg, startY, endY, branchX, isOngoing, isSameYearProject, type, color) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('timeline-branch-path', type);
    if (isOngoing) {
        path.classList.add('ongoing');
    }

    path.style.stroke = color;
    path.style.filter = `drop-shadow(0 0 8px ${color}80)`;

    let pathD;
    if (isOngoing) {
        pathD = `
            M ${TRUNK_X} ${startY}
            Q ${TRUNK_X + 15} ${startY}, ${TRUNK_X + BRANCH_OFFSET} ${startY + 20}
            L ${branchX} ${startY + 30}
            L ${branchX} ${endY}
            L ${branchX} ${endY + 40}
        `;
    } else if (isSameYearProject) {
        pathD = `
            M ${TRUNK_X} ${startY}
            Q ${TRUNK_X + 15} ${startY + 10}, ${TRUNK_X + BRANCH_OFFSET} ${startY + 25}
            L ${branchX} ${startY + 35}
            L ${branchX} ${endY - 35}
            L ${TRUNK_X + BRANCH_OFFSET} ${endY - 25}
            Q ${TRUNK_X + 15} ${endY - 10}, ${TRUNK_X} ${endY}
        `;
    } else {
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
}

/**
 * Create timeline marker
 */
function createMarker(container, entry, index, x, y, color) {
    const marker = document.createElement('div');
    marker.className = `timeline-marker ${entry.type}`;
    marker.setAttribute('data-entry-id', `entry-${index}`);

    const startYear = entry.yearStart || entry.year;
    const icon = entry.type === 'education' ? 'hat.png' : (startYear >= 2024 ? 'hammer.png' : 'star.png');
    marker.innerHTML = `<img src="assets/${icon}" alt="${entry.type}" class="timeline-icon">`;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.borderColor = color;
    marker.style.boxShadow = `0 0 15px ${color}99`;
    container.appendChild(marker);

    return marker;
}

/**
 * Create tooltip
 */
function createTooltip(container, title, x, y, color) {
    const tooltip = document.createElement('div');
    tooltip.className = 'timeline-tooltip';
    tooltip.textContent = title;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y - 70}px`;
    tooltip.style.borderColor = color;
    tooltip.style.transform = 'translateX(-50%)';
    container.appendChild(tooltip);

    return tooltip;
}

/**
 * Create entry card
 */
function createCard(container, entry, index, startYear, endYear, isOngoing, x, y, color) {
    const card = document.createElement('div');
    card.className = 'timeline-entry-card';
    card.setAttribute('data-entry-id', `entry-${index}`);

    // Smart positioning
    const cardWidth = 350;
    const timelineFullContainer = document.querySelector('.timeline-full-container');
    const viewportWidth = timelineFullContainer ? timelineFullContainer.offsetWidth : 1400;
    const spaceOnRight = viewportWidth - x;
    const spaceOnLeft = x;

    if (spaceOnRight >= cardWidth + 100) {
        card.style.left = `${x + 70}px`;
        card.style.right = 'auto';
    } else if (spaceOnLeft >= cardWidth + 100) {
        const leftPosition = Math.max(20, x - cardWidth - 70);
        card.style.left = `${leftPosition}px`;
        card.style.right = 'auto';
        card.classList.add('card-left');
    } else {
        card.style.left = `${x + 30}px`;
        card.style.right = 'auto';
        card.style.maxWidth = '280px';
    }

    card.style.top = `${y - 60}px`;

    const dateRange = isOngoing ?
        `${startYear} - Present` :
        (startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`);

    card.innerHTML = `
        <div class="timeline-content">
            <div class="timeline-date">${dateRange}</div>
            <div class="timeline-title" style="color: ${color};">${entry.title}</div>
            <div class="timeline-subtitle">${entry.subtitle}</div>
            <div class="timeline-description">${entry.description}</div>
        </div>
    `;
    container.appendChild(card);

    // Setup interactions
    setupMarkerInteractions(container, index, card);

    return card;
}

/**
 * Setup marker hover and click interactions
 */
function setupMarkerInteractions(container, index, card) {
    const marker = container.querySelector(`.timeline-marker[data-entry-id="entry-${index}"]`);
    const tooltip = marker.nextElementSibling;

    // Hover for tooltip
    marker.addEventListener('mouseenter', () => {
        tooltip.classList.add('visible');
    });

    marker.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });

    // Click to show card
    marker.addEventListener('click', (e) => {
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
}

/**
 * Setup click outside to close cards
 */
function setupOutsideClickHandler() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.timeline-marker') && !e.target.closest('.timeline-entry-card')) {
            document.querySelectorAll('.timeline-entry-card.visible').forEach(c => {
                c.classList.remove('visible');
            });
        }
    });
}

/**
 * Setup scroll hint fade
 */
function setupScrollHint(container) {
    let hasScrolled = false;
    container.addEventListener('scroll', () => {
        if (!hasScrolled && container.scrollLeft > 10) {
            hasScrolled = true;
            const timelineFullContainer = document.querySelector('.timeline-full-container');
            if (timelineFullContainer) {
                timelineFullContainer.style.setProperty('--scroll-hint-opacity', '0');
            }
        }
    });
}
