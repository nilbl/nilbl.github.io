// === CONSENT POPUP ===

/**
 * Show consent popup for visitor tracking
 * @returns {Promise<boolean>} True if user consented, false otherwise
 */
export function showConsentPopup() {
    console.log('🎨 showConsentPopup() - Creating popup...');
    return new Promise((resolve) => {
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease;
        `;

        // Create popup box
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: rgba(42, 42, 78, 0.95);
            border: 4px solid #8b4513;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            box-shadow: 0 0 0 2px #ffd700, 0 8px 30px rgba(0, 0, 0, 0.5);
            text-align: center;
        `;

        popup.innerHTML = `
            <h3 style="font-family: 'Press Start 2P', monospace; color: #ffd700; font-size: 0.9rem; margin-bottom: 1rem; text-shadow: 2px 2px 0 #000;">
                🌍 Anonymous Visitor Stats
            </h3>
            <p style="font-family: 'Courier New', monospace; color: #fff; font-size: 0.8rem; line-height: 1.8; margin-bottom: 1rem; text-align: left;">
                <strong style="color: #ffd700;">What we collect:</strong><br>
                • Your country name only (e.g., "Spain")<br>
                • No precise location, no IP address<br>
                • No personal data<br><br>
                <strong style="color: #ffd700;">Why?</strong><br>
                To display an anonymous visitor map showing which countries visitors are from.<br><br>
                <strong style="color: #ffd700;">GDPR Compliant:</strong><br>
                You can decline with no impact on site functionality.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="consentYes" style="
                    font-family: 'Press Start 2P', monospace;
                    background: rgba(255, 215, 0, 0.3);
                    color: #ffd700;
                    border: 3px solid #8b4513;
                    padding: 0.8rem 1.5rem;
                    font-size: 0.65rem;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                ">ALLOW</button>
                <button id="consentNo" style="
                    font-family: 'Press Start 2P', monospace;
                    background: rgba(0, 0, 0, 0.5);
                    color: #8a2be2;
                    border: 3px solid #8b4513;
                    padding: 0.8rem 1.5rem;
                    font-size: 0.65rem;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                ">DECLINE</button>
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Add hover effects
        const yesBtn = popup.querySelector('#consentYes');
        const noBtn = popup.querySelector('#consentNo');

        yesBtn.addEventListener('mouseenter', () => {
            yesBtn.style.transform = 'scale(1.05)';
            yesBtn.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        });
        yesBtn.addEventListener('mouseleave', () => {
            yesBtn.style.transform = 'scale(1)';
            yesBtn.style.boxShadow = 'none';
        });

        noBtn.addEventListener('mouseenter', () => {
            noBtn.style.transform = 'scale(1.05)';
        });
        noBtn.addEventListener('mouseleave', () => {
            noBtn.style.transform = 'scale(1)';
        });

        // Handle button clicks
        yesBtn.addEventListener('click', () => {
            console.log('✅ User clicked ALLOW');
            document.body.removeChild(overlay);
            resolve(true);
        });

        noBtn.addEventListener('click', () => {
            console.log('❌ User clicked DECLINE');
            document.body.removeChild(overlay);
            resolve(false);
        });
    });
}
