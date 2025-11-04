const CONFETTI_COUNT = 150;
const CONFETTI_CLEANUP_DELAY = 6000;

// Frame-based smoke animation using FX001 sprites
export function animateSmoke(targetElement, onComplete) {
    if (!targetElement) {
        if (onComplete) onComplete();
        return;
    }

    const smokeOverlay = document.createElement('div');
    smokeOverlay.className = 'smoke-effect';

    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    smokeOverlay.style.left = centerX + 'px';
    smokeOverlay.style.top = centerY + 'px';

    document.body.appendChild(smokeOverlay);

    const smokeFrames = [
        'assets/FX001/FX001_01.png',
        'assets/FX001/FX001_02.png',
        'assets/FX001/FX001_03.png',
        'assets/FX001/FX001_04.png',
        'assets/FX001/FX001_05.png'
    ];

    let frameIndex = 0;

    const frameInterval = setInterval(() => {
        if (frameIndex < smokeFrames.length) {
            smokeOverlay.style.backgroundImage = `url('${smokeFrames[frameIndex]}')`;
            frameIndex++;
        } else {
            clearInterval(frameInterval);
            smokeOverlay.remove();
            if (onComplete) onComplete();
        }
    }, 100);
}

export function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;
    document.body.appendChild(confettiContainer);

    const colors = ['#ffd700', '#ff6b35', '#8a2be2', '#00d4ff', '#06ffa5'];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 10 + 5;
        const startX = Math.random() * window.innerWidth;
        const delay = Math.random() * 500;
        const duration = Math.random() * 2000 + 2000;
        const rotation = Math.random() * 360;
        const swing = (Math.random() - 0.5) * 200;

        confetti.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: -20px;
            width: ${size}px;
            height: ${size}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            opacity: 0.9;
            pointer-events: none;
            animation: confettiFall${i} ${duration}ms ease-in ${delay}ms forwards;
            transform: rotate(${rotation}deg);
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes confettiFall${i} {
                0% {
                    transform: translateY(0) translateX(0) rotate(${rotation}deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(${window.innerHeight + 50}px) translateX(${swing}px) rotate(${rotation + 720}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        confettiContainer.appendChild(confetti);
    }

    setTimeout(() => confettiContainer.remove(), CONFETTI_CLEANUP_DELAY);
}
