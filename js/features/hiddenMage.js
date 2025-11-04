// === HIDDEN MAGE EASTER EGG ===

import { playSound } from '../components/soundSystem.js';
import { getTranslations } from '../core/translations.js';
import { DEV_MODE } from '../utils/helpers.js';

const MAGE_HIDE_DELAY = 2000; // milliseconds

// Hidden mage dialogues (global Easter egg)
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

// Voice sound system for game joker
let currentVoiceAudio = null;
let voiceSoundInterval = null;
let lastVoiceNum = null;

/**
 * Play random voice sound
 */
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
    currentVoiceAudio.playbackRate = 2.1;

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

/**
 * Start voice sounds loop
 */
function startVoiceSounds() {
    // Don't play voice sounds on mobile
    if (window.innerWidth <= 1400) return;

    voiceSoundInterval = true;
    playRandomVoiceSound();
}

/**
 * Stop voice sounds
 */
function stopVoiceSounds() {
    voiceSoundInterval = null;
    lastVoiceNum = null;
    if (currentVoiceAudio) {
        currentVoiceAudio.pause();
        currentVoiceAudio = null;
    }
}

/**
 * Show dialogue with typewriter effect
 * @param {HTMLElement} dialogue - Dialogue element
 * @param {string} text - Text to display
 * @param {Function} onComplete - Optional callback when done
 */
function typewriterEffect(dialogue, text, onComplete) {
    dialogue.textContent = '';
    dialogue.classList.add('active');

    let i = 0;

    function typeNextLetter() {
        dialogue.textContent += text.charAt(i);
        i++;

        if (i < text.length) {
            const randomSpeed = Math.floor(Math.random() * 75) + 30;
            mageTypingInterval = setTimeout(typeNextLetter, randomSpeed);
        } else {
            mageTypingInterval = null;
            hideTimeout = setTimeout(() => {
                dialogue.classList.remove('active');
                hideTimeout = null;
                if (onComplete) onComplete();
            }, MAGE_HIDE_DELAY);
        }
    }

    typeNextLetter();
}

/**
 * Show hidden mage dialogue (global Easter egg)
 */
export function showMageDialogue() {
    playSound('success');

    const hiddenMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');
    if (!hiddenMage) return;

    const dialogue = hiddenMage.querySelector('.mage-dialogue');
    if (!dialogue) return;

    if (mageTypingInterval) clearTimeout(mageTypingInterval);
    if (hideTimeout) clearTimeout(hideTimeout);

    // Select random dialogue (avoid repetition)
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * mageDialogues.length);
    } while (randomIndex === lastDialogueIndex && mageDialogues.length > 1);

    lastDialogueIndex = randomIndex;
    const fullText = mageDialogues[randomIndex];

    typewriterEffect(dialogue, fullText);
}

export function showGameMageDialogue(type) {
    const balatrOJoker = document.getElementById('balatrOJoker');
    if (!balatrOJoker || !balatrOJoker.classList.contains('visible')) return;

    const dialogue = balatrOJoker.querySelector('.joker-dialogue');
    const trans = getTranslations()?.game?.mageDialogues || {};
    const dialogueArray = trans[type] || mageGameDialogues[type];

    if (!dialogue || !dialogueArray) return;

    // Don't interrupt ongoing dialogue
    if (mageTypingInterval || dialogue.classList.contains('active')) {
        return;
    }

    playSound('success');

    if (hideTimeout) {
        clearTimeout(hideTimeout);
        balatrOJoker.classList.remove('trembling');
    }
    stopVoiceSounds();

    // Pick random dialogue, avoid repeating the last one
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * dialogueArray.length);
    } while (randomIndex === lastGameDialogueIndex[type] && dialogueArray.length > 1);

    lastGameDialogueIndex[type] = randomIndex;
    const fullText = dialogueArray[randomIndex];

    balatrOJoker.classList.add('trembling');
    startVoiceSounds();

    typewriterEffect(dialogue, fullText, () => {
        balatrOJoker.classList.remove('trembling');
        stopVoiceSounds();
    });
}

export function initHiddenMage() {
    const hiddenMage = document.querySelector('.hidden-mage:not(#balatrOJoker)');
    if (hiddenMage) {
        hiddenMage.style.display = 'none';
        hiddenMage.addEventListener('click', showMageDialogue);
    }

    // Make showGameMageDialogue available globally for diceGame
    window.showGameMageDialogue = showGameMageDialogue;

    console.log('✅ Hidden mage initialized');
}
