// Pixelated world map with visitor markers
export async function drawWorldMap(canvas, visitors) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Render small and scale up for pixel art effect
    const scale = 2;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width / scale;
    offCanvas.height = height / scale;
    const offCtx = offCanvas.getContext('2d');

    // Disable smoothing on both contexts
    offCtx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    offCtx.fillStyle = '#0a0a2e';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    const geojsonUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
    const response = await fetch(geojsonUrl);
    const world = await response.json();

    if (typeof topojson === 'undefined') {
        console.error('TopoJSON library not loaded');
        return;
    }
    const geoData = topojson.feature(world, world.objects.countries);

    function mercatorProjection(lon, lat) {
        const x = ((lon + 180) * offCanvas.width) / 360;
        const latRad = (lat * Math.PI) / 180;
        const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
        const y = offCanvas.height / 2 - (offCanvas.width * mercN) / (2 * Math.PI);
        return [x, y];
    }

    // Draw continents
    offCtx.fillStyle = '#2a834a';
    geoData.features.forEach(feature => {
        feature.geometry.coordinates.forEach(polygon => {
            const rings = feature.geometry.type === 'Polygon' ? [polygon] : polygon;
            rings.forEach(ring => {
                ring.forEach(([lon, lat]) => {
                    const [x, y] = mercatorProjection(lon, lat);
                    offCtx.fillRect(Math.round(x), Math.round(y), 1, 1);
                });
            });
        });
    });

    // Draw visitor dots (2x2 pixels for visibility)
    offCtx.fillStyle = '#ffd700';
    visitors.forEach(visitor => {
        const [x, y] = mercatorProjection(visitor.longitude, visitor.latitude);
        offCtx.fillRect(Math.round(x), Math.round(y), 2, 2);
    });

    // Scale up to create chunky pixel effect
    ctx.drawImage(offCanvas, 0, 0, width, height);
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

    // Show only 5 most recent visitors in the list
    const listEl = document.getElementById('visitorsList');
    if (listEl) {
        listEl.innerHTML = '';

        const recentVisitors = data.visitors.slice(-5).reverse();
        const displayLimit = Math.min(recentVisitors.length, 5);

        for (let i = 0; i < displayLimit; i++) {
            const visitor = recentVisitors[i];

            const entry = document.createElement('div');
            entry.className = 'visitor-entry';

            const locationSpan = document.createElement('span');
            locationSpan.className = 'visitor-location';
            // Show City, Country
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
        drawWorldMap(canvas, data.visitors);
    }
}
