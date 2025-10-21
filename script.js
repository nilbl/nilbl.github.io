// Generate stars
const starsContainer = document.getElementById('stars');
for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    starsContainer.appendChild(star);
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
        progress += Math.floor(Math.random() * 10) + 5;
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
                }, 400);
            }, 500);
        }
    }, 200);
}


function toggleMenu(element) {
    playSound('menu');

    const allMenuItems = document.querySelectorAll('.menu-item');
    allMenuItems.forEach(item => {
        if (item !== element && item.classList.contains('active')) {
            item.classList.remove('active');
        }
    });

    element.classList.toggle('active');
}

function switchSection(section) {
    playSound('menu');

    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    document.querySelectorAll('.taskbar-item').forEach(item => {
        item.classList.remove('active');
    });

    if (section === 'stats') {
        document.getElementById('statsSection').classList.add('active');
        document.querySelectorAll('.taskbar-item')[0].classList.add('active');
    } else if (section === 'missions') {
        document.getElementById('missionsSection').classList.add('active');
        document.querySelectorAll('.taskbar-item')[1].classList.add('active');
    } else if (section === 'contact') {
        document.getElementById('contactSection').classList.add('active');
        document.querySelectorAll('.taskbar-item')[2].classList.add('active');
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function playSound(type) {
    console.log(`Playing ${type} sound effect`);

    try {
        const audioContext = new(window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'menu') {
            oscillator.frequency.value = 600;
        } else {
            oscillator.frequency.value = 800;
        }

        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Audio not available');
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && document.getElementById('titleScreen').style.display !== 'none') {
        startGame();
    }
});

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
            }, 2000);
        }
    }

    typeNextLetter();
}


document.querySelectorAll('.more-info-link').forEach(link => {
    link.addEventListener('click', function() {
        playSound('menu');
        switchSection('missions');
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const mage = document.querySelector('.hidden-mage');
    if (mage) {
        mage.addEventListener('click', showMageDialogue);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.hidden-mage').style.display = 'none';
});

// === EASTER EGG: SHOW CONTROLLER AFTER 4 CLICKS ON PORTRAIT ===
document.addEventListener('DOMContentLoaded', () => {
    const portrait = document.querySelector('.portrait-sprite');
    console.log('Portrait:', portrait);

    let clickCount = 0;
    const controller = document.getElementById('controllerOverlay');

    if (portrait && controller) {
        portrait.addEventListener('click', () => {
            clickCount++;
            console.log('Clicked!', clickCount);
            if (clickCount >= 4) {
                controller.classList.remove('hidden');
                playSound('menu');
            }
            setTimeout(() => (clickCount = 0), 1500);
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

function checkKonamiCode(key) {
    if (key === konamiCode[konamiIndex]) {
        konamiIndex++;
        console.log(`Konami progress: ${konamiIndex}/${konamiCode.length}`);

        if (konamiIndex === konamiCode.length) {
            if (!konamiActivated) {
                konamiActivated = true;
                triggerKonamiEasterEgg();
            }
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
}

function triggerKonamiEasterEgg() {
    console.log('🎮 KONAMI CODE ACTIVATED! 🎮');
    console.log('Secret unlocked!');
    playSound('start');
    // Konami code
}

document.addEventListener('keydown', e => {
    checkKonamiCode(e.code);
});