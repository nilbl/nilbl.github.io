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
const MAX_SCALE = 3;
const HOVER_RADIUS = 15;

// Country center coordinates (approximate)
const COUNTRY_COORDS = {
    'Spain': { lat: 40.4, lon: -3.7 },
    'France': { lat: 46.2, lon: 2.2 },
    'Germany': { lat: 51.2, lon: 10.4 },
    'Italy': { lat: 41.9, lon: 12.6 },
    'United Kingdom': { lat: 55.4, lon: -3.4 },
    'Portugal': { lat: 39.4, lon: -8.2 },
    'Netherlands': { lat: 52.1, lon: 5.3 },
    'Belgium': { lat: 50.5, lon: 4.5 },
    'Switzerland': { lat: 46.8, lon: 8.2 },
    'Austria': { lat: 47.5, lon: 14.6 },
    'Poland': { lat: 51.9, lon: 19.1 },
    'Sweden': { lat: 60.1, lon: 18.6 },
    'Norway': { lat: 60.5, lon: 8.5 },
    'Denmark': { lat: 56.3, lon: 9.5 },
    'Finland': { lat: 61.9, lon: 25.7 },
    'Greece': { lat: 39.1, lon: 21.8 },
    'Czech Republic': { lat: 49.8, lon: 15.5 },
    'Romania': { lat: 45.9, lon: 24.9 },
    'Hungary': { lat: 47.2, lon: 19.5 },
    'Ireland': { lat: 53.4, lon: -8.2 },
    'Croatia': { lat: 45.1, lon: 15.2 },
    'United States': { lat: 37.1, lon: -95.7 },
    'Canada': { lat: 56.1, lon: -106.3 },
    'Mexico': { lat: 23.6, lon: -102.5 },
    'Brazil': { lat: -14.2, lon: -51.9 },
    'Argentina': { lat: -38.4, lon: -63.6 },
    'Chile': { lat: -35.7, lon: -71.5 },
    'Colombia': { lat: 4.6, lon: -74.1 },
    'Peru': { lat: -9.2, lon: -75.0 },
    'China': { lat: 35.9, lon: 104.2 },
    'Japan': { lat: 36.2, lon: 138.3 },
    'India': { lat: 20.6, lon: 78.9 },
    'South Korea': { lat: 35.9, lon: 127.8 },
    'Australia': { lat: -25.3, lon: 133.8 },
    'New Zealand': { lat: -40.9, lon: 174.9 },
    'Russia': { lat: 61.5, lon: 105.3 },
    'South Africa': { lat: -30.6, lon: 22.9 },
    'Egypt': { lat: 26.8, lon: 30.8 },
    'Morocco': { lat: 31.8, lon: -7.1 },
    'Turkey': { lat: 38.9, lon: 35.2 },
    'Saudi Arabia': { lat: 23.9, lon: 45.1 },
    'UAE': { lat: 23.4, lon: 53.8 },
    'Israel': { lat: 31.0, lon: 34.9 },
    'Singapore': { lat: 1.4, lon: 103.8 },
    'Thailand': { lat: 15.9, lon: 100.9 },
    'Vietnam': { lat: 14.1, lon: 108.3 },
    'Philippines': { lat: 12.9, lon: 121.8 },
    'Indonesia': { lat: -0.8, lon: 113.9 },
    'Malaysia': { lat: 4.2, lon: 101.9 },
    'Unknown': { lat: 0, lon: 0 }
};

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

        // Draw visitor dots using country center coordinates
        ctx.fillStyle = '#ffd700';
        currentVisitors.forEach(visitor => {
            const coords = COUNTRY_COORDS[visitor.country] || COUNTRY_COORDS['Unknown'];
            const [x, y] = mercatorProjection(coords.lon, coords.lat);
            const dotX = Math.round(x);
            const dotY = Math.round(y);

            // Draw larger dot based on visitor count
            const size = Math.min(8, 4 + Math.log(visitor.count || 1));
            ctx.fillRect(dotX - size/2, dotY - size/2, size, size);
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
        const coords = COUNTRY_COORDS[visitor.country] || COUNTRY_COORDS['Unknown'];
        const [x, y] = mercatorProjection(coords.lon, coords.lat);
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
                    country: visitor.country,
                    count: visitor.count || 1
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
        const uniqueCountries = new Set(data.visitors.map(v => v.country));
        uniqueLocationsEl.textContent = uniqueCountries.size;
    }

    // Draw map with visitors (no recent visitors list for privacy)
    const canvas = document.getElementById('visitorCanvas');
    if (canvas) {
        // Aggregate visitors by country
        const countryData = new Map();
        data.visitors.forEach(visitor => {
            const count = countryData.get(visitor.country) || 0;
            countryData.set(visitor.country, count + 1);
        });

        const aggregatedVisitors = Array.from(countryData.entries()).map(([country, count]) => {
            const visitor = data.visitors.find(v => v.country === country);
            return {
                country: country,
                countryCode: visitor.countryCode,
                count: count
            };
        });

        drawWorldMap(canvas, aggregatedVisitors).then(() => {
            setupMapInteractions(canvas, aggregatedVisitors);
        });
    }
}

// Setup zoom, pan interactions (no hover tooltips)
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
        } else {
            // Check hover for cursor change only
            let found = false;
            for (const visitor of visitorPositions) {
                const distance = Math.sqrt(
                    Math.pow(mouseX - visitor.x, 2) +
                    Math.pow(mouseY - visitor.y, 2)
                );

                if (distance < HOVER_RADIUS) {
                    found = true;
                    canvas.style.cursor = 'pointer';
                    break;
                }
            }

            if (!found) {
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
                // Single touch - pan start
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
