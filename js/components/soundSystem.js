// === SOUND SYSTEM ===

const DEV_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
let audioContext = null;

/**
 * Get or create AudioContext (lazy initialization)
 */
export function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            if (DEV_MODE) console.log('Audio not supported:', e);
            return null;
        }
    }
    return audioContext;
}

/**
 * Play retro-style sound effect
 * @param {string} type - Sound type (menu, tab, marker, open, start, hover, success)
 */
export function playSound(type) {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const soundProfiles = {
            'menu': { frequency: 800, type: 'square', duration: 0.08, volume: 0.12 },
            'tab': { frequency: 1000, type: 'sine', duration: 0.1, volume: 0.15 },
            'marker': { frequency: 1200, type: 'triangle', duration: 0.06, volume: 0.1 },
            'open': { frequency: 600, type: 'sine', duration: 0.12, volume: 0.13, frequencyEnd: 900 },
            'start': { frequency: 400, type: 'square', duration: 0.15, volume: 0.14, frequencyEnd: 800 },
            'hover': { frequency: 1400, type: 'sine', duration: 0.04, volume: 0.06 },
            'success': { frequency: 800, type: 'sine', duration: 0.2, volume: 0.12, frequencyEnd: 1200 }
        };

        const profile = soundProfiles[type] || soundProfiles['menu'];

        oscillator.type = profile.type;
        oscillator.frequency.setValueAtTime(profile.frequency, ctx.currentTime);

        if (profile.frequencyEnd) {
            oscillator.frequency.exponentialRampToValueAtTime(
                profile.frequencyEnd,
                ctx.currentTime + profile.duration * 0.7
            );
        }

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(profile.volume, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + profile.duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + profile.duration);
    } catch (e) {
        if (DEV_MODE) console.log('Audio playback error:', e);
    }
}

/**
 * Initialize audio context on user interaction
 */
export function initAudio() {
    document.addEventListener('click', () => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    }, { once: true });
}
