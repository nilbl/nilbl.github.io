// Zoom and pan state
let mapScale = 1;
let mapOffsetX = 0;
let mapOffsetY = 0;
let visitorPositions = [];
let cachedMapData = null;
let currentVisitors = [];
let canvasElement = null;

// Constants
const MIN_SCALE = 1;
const MAX_SCALE = 3; // Reduced from 5 to prevent map disappearing
const HOVER_RADIUS = 15;

// Pixelated world map with visitor markers
export async function drawWorldMap(canvas, visitors) {
    currentVisitors = visitors;
    canvasElement = canvas;
    const ctx = canvas.getContext('2d');

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    // Auto-zoom for mobile to fill the frame
    const isMobile = window.innerWidth <= 768;
    if (isMobile && mapScale === 1) {
        // On mobile, zoom to fill the vertical space (2:1 aspect ratio map)
        mapScale = 2; // Fill the frame by zooming 2x
        mapOffsetY = 0; // Center vertically
    }

    // Load and cache map data if not already loaded
    if (!cachedMapData) {
        const geojsonUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
        const response = await fetch(geojsonUrl);
        const world = await response.json();

        if (typeof topojson === 'undefined') {
            console.error('TopoJSON library not loaded');
            return;
        }
        cachedMapData = topojson.feature(world, world.objects.countries);
    }

    renderMap(canvas, ctx);
}

// Render map with current zoom and pan
function renderMap(canvas, ctx) {
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, width, height);

    // Clamp vertical offset to prevent scrolling too far up/down
    const maxVerticalOffset = Math.max(0, (height * mapScale - height) / 2);
    mapOffsetY = Math.max(-maxVerticalOffset, Math.min(maxVerticalOffset, mapOffsetY));

    // Normalize horizontal offset for wrapping (don't use modulo directly)
    const mapWidth = width * mapScale;

    // Keep offset in reasonable range for wrapping calculations
    while (mapOffsetX < -mapWidth) {
        mapOffsetX += mapWidth;
    }
    while (mapOffsetX > mapWidth) {
        mapOffsetX -= mapWidth;
    }

    // Mercator projection
    function mercatorProjection(lon, lat) {
        const x = ((lon + 180) * width) / 360;
        const latRad = (lat * Math.PI) / 180;
        const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
        const y = height / 2 - (width * mercN) / (2 * Math.PI);
        return [x, y];
    }

    // Draw map function (can be called multiple times for wrapping)
    function drawMapContent(offsetX) {
        ctx.save();
        ctx.translate(offsetX, mapOffsetY);
        ctx.scale(mapScale, mapScale);

        // Draw continents (pixelated)
        ctx.fillStyle = '#2a834a';
        if (cachedMapData) {
            cachedMapData.features.forEach(feature => {
                feature.geometry.coordinates.forEach(polygon => {
                    const rings = feature.geometry.type === 'Polygon' ? [polygon] : polygon;
                    rings.forEach(ring => {
                        ring.forEach(([lon, lat]) => {
                            const [x, y] = mercatorProjection(lon, lat);
                            ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
                        });
                    });
                });
            });
        }

        // Draw visitor dots
        ctx.fillStyle = '#ffd700';
        currentVisitors.forEach(visitor => {
            const [x, y] = mercatorProjection(visitor.longitude, visitor.latitude);
            const dotX = Math.round(x);
            const dotY = Math.round(y);
            ctx.fillRect(dotX, dotY, 4, 4);
        });

        ctx.restore();
    }

    // Draw map with wrapping - always render multiple instances for seamless scrolling
    const instances = [
        mapOffsetX - mapWidth,
        mapOffsetX,
        mapOffsetX + mapWidth
    ];

    instances.forEach(offset => {
        drawMapContent(offset);
    });

    // Update visitor positions for hit detection (with wrapping)
    visitorPositions = [];
    currentVisitors.forEach(visitor => {
        const [x, y] = mercatorProjection(visitor.longitude, visitor.latitude);
        const baseX = Math.round(x) * mapScale;
        const baseY = Math.round(y) * mapScale + mapOffsetY;

        // Add positions for all visible instances
        instances.forEach(offset => {
            const transformedX = baseX + offset;
            // Only add if visible on canvas
            if (transformedX >= -50 && transformedX <= width + 50) {
                visitorPositions.push({
                    x: transformedX,
                    y: baseY,
                    city: visitor.city,
                    country: visitor.country
                });
            }
        });
    });
}

export function updateVisitorDisplay(data) {
    const totalVisitsEl = document.getElementById('totalVisits');
    const uniqueLocationsEl = document.getElementById('uniqueLocations');

    if (totalVisitsEl) {
        totalVisitsEl.textContent = data.totalVisits;
    }
    if (uniqueLocationsEl) {
        const uniqueLocations = new Set(data.visitors.map(v => `${v.city}, ${v.country}`));
        uniqueLocationsEl.textContent = uniqueLocations.size;
    }

    // Show only 5 most recent visitors in the list, filtering duplicates within 1 hour
    const listEl = document.getElementById('visitorsList');
    if (listEl) {
        listEl.innerHTML = '';

        const ONE_HOUR_MS = 60 * 60 * 1000;
        const filteredVisitors = [];
        const seenLocations = new Map();

        const sortedVisitors = [...data.visitors].reverse();

        for (const visitor of sortedVisitors) {
            const locationKey = `${visitor.city}, ${visitor.country}`;
            const visitorTime = new Date(visitor.timestamp).getTime();
            const lastSeenTime = seenLocations.get(locationKey);

            if (!lastSeenTime || (visitorTime - lastSeenTime > ONE_HOUR_MS)) {
                filteredVisitors.push(visitor);
                seenLocations.set(locationKey, visitorTime);
            }
        }

        const displayLimit = Math.min(filteredVisitors.length, 5);

        for (let i = 0; i < displayLimit; i++) {
            const visitor = filteredVisitors[i];

            const entry = document.createElement('div');
            entry.className = 'visitor-entry';

            const locationSpan = document.createElement('span');
            locationSpan.className = 'visitor-location';
            locationSpan.textContent = `${visitor.city}, ${visitor.country}`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'visitor-time';
            const date = new Date(visitor.timestamp);
            timeSpan.textContent = date.toLocaleString();

            entry.appendChild(locationSpan);
            entry.appendChild(timeSpan);
            listEl.appendChild(entry);
        }
    }

    // Draw map with visitors
    const canvas = document.getElementById('visitorCanvas');
    if (canvas) {
        drawWorldMap(canvas, data.visitors).then(() => {
            setupMapInteractions(canvas);
        });
    }
}

// Setup zoom, pan, and hover interactions
function setupMapInteractions(canvas) {
    const isMobile = 'ontouchstart' in window;

    // Remove old listeners
    if (canvas._listeners) {
        canvas._listeners.forEach(({ event, handler }) => {
            canvas.removeEventListener(event, handler);
        });
    }
    canvas._listeners = [];

    const ctx = canvas.getContext('2d');

    // Create tooltip
    let tooltip = document.getElementById('mapTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'mapTooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: #ffd700;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Press Start 2P', monospace;
            pointer-events: none;
            z-index: 1000;
            display: none;
            white-space: nowrap;
            border: 2px solid #ffd700;
            transform-origin: bottom center;
        `;
        document.body.appendChild(tooltip);
    }

    // Zoom with mouse wheel (desktop)
    const wheelHandler = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, mapScale * delta));

        // Zoom towards mouse position
        const scaleChange = newScale / mapScale;
        mapOffsetX = mouseX - (mouseX - mapOffsetX) * scaleChange;
        mapOffsetY = mouseY - (mouseY - mapOffsetY) * scaleChange;
        mapScale = newScale;

        renderMap(canvas, ctx);
    };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    canvas._listeners.push({ event: 'wheel', handler: wheelHandler });

    // Pan with drag (desktop)
    let isPanning = false;
    let lastX, lastY;

    const mouseDownHandler = (e) => {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    };

    const mouseMoveHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isPanning) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            mapOffsetX += dx;
            mapOffsetY += dy;
            lastX = e.clientX;
            lastY = e.clientY;
            renderMap(canvas, ctx);
            tooltip.style.display = 'none';
        } else {
            // Check hover for tooltip
            let found = false;
            for (const visitor of visitorPositions) {
                const distance = Math.sqrt(
                    Math.pow(mouseX - visitor.x, 2) +
                    Math.pow(mouseY - visitor.y, 2)
                );

                if (distance < HOVER_RADIUS) {
                    tooltip.textContent = `${visitor.city}, ${visitor.country}`;
                    tooltip.style.display = 'block';

                    // Position just above the dot, accounting for canvas CSS scaling
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = rect.width / canvas.width;
                    const scaleY = rect.height / canvas.height;

                    const tooltipX = rect.left + (visitor.x * scaleX);
                    const tooltipY = rect.top + (visitor.y * scaleY) - 35; // 35px above

                    tooltip.style.fontSize = '10px';
                    tooltip.style.left = tooltipX + 'px';
                    tooltip.style.top = tooltipY + 'px';
                    tooltip.style.transform = 'translateX(-50%)';

                    found = true;
                    canvas.style.cursor = 'pointer';
                    break;
                }
            }

            if (!found) {
                tooltip.style.display = 'none';
                canvas.style.cursor = 'grab';
            }
        }
    };

    const mouseUpHandler = () => {
        isPanning = false;
        canvas.style.cursor = 'grab';
    };

    const mouseLeaveHandler = () => {
        isPanning = false;
        tooltip.style.display = 'none';
        canvas.style.cursor = 'default';
    };

    if (!isMobile) {
        canvas.addEventListener('mousedown', mouseDownHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);
        canvas.addEventListener('mouseup', mouseUpHandler);
        canvas.addEventListener('mouseleave', mouseLeaveHandler);
        canvas._listeners.push(
            { event: 'mousedown', handler: mouseDownHandler },
            { event: 'mousemove', handler: mouseMoveHandler },
            { event: 'mouseup', handler: mouseUpHandler },
            { event: 'mouseleave', handler: mouseLeaveHandler }
        );
        canvas.style.cursor = 'grab';
    }

    // Touch controls (mobile)
    if (isMobile) {
        let lastTouchDistance = 0;
        let touchStartX = 0;
        let touchStartY = 0;

        const touchStartHandler = (e) => {
            if (e.touches.length === 1) {
                // Single touch - check for tap on visitor dot
                const rect = canvas.getBoundingClientRect();
                const touchX = e.touches[0].clientX - rect.left;
                const touchY = e.touches[0].clientY - rect.top;

                for (const visitor of visitorPositions) {
                    const distance = Math.sqrt(
                        Math.pow(touchX - visitor.x, 2) +
                        Math.pow(touchY - visitor.y, 2)
                    );

                    if (distance < HOVER_RADIUS * 2) {
                        // Show tooltip on tap
                        tooltip.textContent = `${visitor.city}, ${visitor.country}`;
                        tooltip.style.display = 'block';

                        // Position just above the dot, accounting for canvas CSS scaling
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = rect.width / canvas.width;
                        const scaleY = rect.height / canvas.height;

                        const tooltipX = rect.left + (visitor.x * scaleX);
                        const tooltipY = rect.top + (visitor.y * scaleY) - 35; // 35px above

                        tooltip.style.fontSize = '10px';
                        tooltip.style.left = tooltipX + 'px';
                        tooltip.style.top = tooltipY + 'px';
                        tooltip.style.transform = 'translateX(-50%)';

                        setTimeout(() => {
                            tooltip.style.display = 'none';
                        }, 3000);

                        return;
                    }
                }

                // Pan start
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch zoom start
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const touchMoveHandler = (e) => {
            e.preventDefault();

            if (e.touches.length === 1) {
                // Pan
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                mapOffsetX += dx;
                mapOffsetY += dy;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                renderMap(canvas, ctx);
            } else if (e.touches.length === 2) {
                // Pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastTouchDistance > 0) {
                    const rect = canvas.getBoundingClientRect();
                    const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
                    const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

                    const delta = distance / lastTouchDistance;
                    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, mapScale * delta));

                    const scaleChange = newScale / mapScale;
                    mapOffsetX = centerX - (centerX - mapOffsetX) * scaleChange;
                    mapOffsetY = centerY - (centerY - mapOffsetY) * scaleChange;
                    mapScale = newScale;

                    renderMap(canvas, ctx);
                }

                lastTouchDistance = distance;
            }
        };

        const touchEndHandler = () => {
            lastTouchDistance = 0;
        };

        canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        canvas.addEventListener('touchend', touchEndHandler);
        canvas._listeners.push(
            { event: 'touchstart', handler: touchStartHandler },
            { event: 'touchmove', handler: touchMoveHandler },
            { event: 'touchend', handler: touchEndHandler }
        );
    }

    // Reset zoom button
    addResetButton(canvas, ctx);
}

// Add reset zoom button
function addResetButton(canvas, ctx) {
    let resetBtn = document.getElementById('mapResetZoom');
    if (!resetBtn) {
        resetBtn = document.createElement('button');
        resetBtn.id = 'mapResetZoom';
        resetBtn.textContent = '⟲ Reset View';
        resetBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffd700;
            border: 2px solid #ffd700;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            z-index: 999;
        `;

        const mapContainer = canvas.parentElement;
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(resetBtn);
    }

    resetBtn.onclick = () => {
        mapScale = 1;
        mapOffsetX = 0;
        mapOffsetY = 0;
        renderMap(canvas, ctx);
    };
}
