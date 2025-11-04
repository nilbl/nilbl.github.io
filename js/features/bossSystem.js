import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage.js';
import { createConfetti } from '../components/animations.js';

const MAX_BOSS_HP = 100;
let bossHP = MAX_BOSS_HP; // Lazy init to detect hard refresh
let hpAnimationTimeout = null;

export function getBossHP() {
    return bossHP;
}

export function setBossHP(newHP) {
    bossHP = Math.max(0, Math.min(MAX_BOSS_HP, newHP));
    safeSetLocalStorage('bossHP', bossHP);
    animateBossHP(bossHP);

    if (bossHP <= 0) {
        onBossDefeated();
    }
}

function animateBossHP(targetHP) {
    const hpFill = document.getElementById('bossHpFill');
    if (!hpFill) return;

    if (hpAnimationTimeout) {
        clearTimeout(hpAnimationTimeout);
    }

    const targetPercent = (targetHP / MAX_BOSS_HP) * 100;
    hpFill.style.width = `${targetPercent}%`;
}

export function initBossHP() {
    // Hard refresh (Ctrl+Shift+R) should reset HP, normal refresh preserves it
    const isHardRefresh = performance.navigation && performance.navigation.type === 1;

    if (isHardRefresh) {
        bossHP = MAX_BOSS_HP;
        safeSetLocalStorage('bossHP', MAX_BOSS_HP.toString());
        console.log('Hard refresh detected - Boss HP reset to 100');
    } else {
        const storedHP = parseInt(safeGetLocalStorage('bossHP', MAX_BOSS_HP.toString()));

        if (isNaN(storedHP) || storedHP > MAX_BOSS_HP || storedHP < 0) {
            bossHP = MAX_BOSS_HP;
            safeSetLocalStorage('bossHP', MAX_BOSS_HP.toString());
        } else {
            bossHP = storedHP;
        }
    }

    const hpFill = document.getElementById('bossHpFill');
    if (hpFill) {
        const currentPercent = (bossHP / MAX_BOSS_HP) * 100;
        hpFill.style.width = `${currentPercent}%`;
        console.log('Boss HP initialized:', bossHP, '/', MAX_BOSS_HP, '=', currentPercent + '%');
    }
}

function onBossDefeated() {
    console.log('🎉 BOSS DEFEATED!');
    createConfetti();
}

export function getMaxBossHP() {
    return MAX_BOSS_HP;
}
