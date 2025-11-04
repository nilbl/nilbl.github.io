# Complete Migration Guide

## ✅ STATUS: Foundation Ready

**Completed:**
- ✅ Backup created: `script.backup.js`
- ✅ Folder structure created
- ✅ Utility modules: `utils/storage.js`, `utils/helpers.js`
- ✅ Core module: `core/translations.js`

## 🎯 COMPLETE MIGRATION PLAN

### Step 1: Keep Both Versions Running
Your current `script.js` continues working. Modules are being built alongside.

### Step 2: Module Extraction Map

Here's what needs to be extracted from `script.js`:

#### **components/soundSystem.js** (Lines 836-926)
```javascript
export function playSound(type) { /* ... */ }
export function getAudioContext() { /* ... */ }
```

#### **features/hiddenMage.js** (Lines 929-1050)
```javascript
export const mageDialogues = [ /* ... */ ];
export function showMageDialogue(type) { /* ... */ }
export function initHiddenMage() { /* ... */ }
```

#### **features/bossSystem.js** (Lines 1000-1045)
```javascript
export function initBossHP() { /* ... */ }
export function setBossHP(newHP) { /* ... */ }
export function getBossHP() { /* ... */ }
```

#### **features/parallax.js** (Lines 597-650)
```javascript
export function initParallax() { /* ... */ }
```

#### **features/timeline.js** (Lines 61-385)
```javascript
export function buildTimeline(translations) { /* ... */ }
```

#### **core/navigation.js** (Lines 718-834)
```javascript
export function switchSection(section) { /* ... */ }
export function initNavigation() { /* ... */ }
```

#### **features/diceGame.js** (Lines 1550-2130)
```javascript
export const diceGame = { /* entire game object */ };
```

#### **components/animations.js** (Lines 1120-1270)
```javascript
export function animateSmoke(element, callback) { /* ... */ }
export function createConfetti() { /* ... */ }
```

#### **visitors/** (Lines 2132-2459)
Split into 4 files:
- `visitors/geolocation.js` - IP location detection
- `visitors/mapRenderer.js` - Canvas drawing
- `visitors/consentPopup.js` - Privacy popup
- `visitors/visitorTracker.js` - Main coordinator

### Step 3: Create main.js Entry Point

```javascript
// Import all modules
import { initTranslations } from './core/translations.js';
import { initNavigation } from './core/navigation.js';
import { playSound } from './components/soundSystem.js';
import { initParallax } from './features/parallax.js';
import { buildTimeline } from './features/timeline.js';
import { diceGame } from './features/diceGame.js';
import { initBossHP } from './features/bossSystem.js';
import { initHiddenMage } from './features/hiddenMage.js';

// Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
    await initTranslations();
    initBossHP();
    initNavigation();
    initParallax();
    initHiddenMage();
    buildTimeline();
    diceGame.init();
});
```

### Step 4: Update HTML

Change in `index.html`:
```html
<!-- OLD -->
<script src="script.js"></script>

<!-- NEW (test version) -->
<script type="module" src="js/main.js"></script>
```

## ⚠️ CRITICAL: Testing Protocol

1. **DO NOT modify index.html yet**
2. Create `index-test.html` (copy of index.html)
3. In `index-test.html`, replace script.js with modules
4. Test thoroughly in browser
5. Only after everything works, update real index.html

## 🚀 Quick Start Commands

```bash
# Keep working on your site normally with script.js

# When ready to test modules:
# 1. Copy index.html to index-test.html
# 2. Edit index-test.html to use: <script type="module" src="js/main.js"></script>
# 3. Open index-test.html in browser
# 4. Test all features
# 5. If working, update real index.html
```

## 📋 Checklist Before Going Live

- [ ] All modules created
- [ ] main.js imports all modules
- [ ] index-test.html works perfectly
- [ ] All features tested (navigation, game, visitors, etc.)
- [ ] No console errors
- [ ] Translations working
- [ ] Sound effects working
- [ ] Game working
- [ ] Visitor tracking working
- [ ] Boss HP system working
- [ ] Hidden mage working

## 🔄 Rollback Plan

If anything breaks:
```html
<!-- In index.html, change back to: -->
<script src="script.js"></script>
```

Your backup is safe at `script.backup.js`

## 📞 Status

Current: **Foundation Ready, Manual Migration Recommended**
- Structure is professional and scalable
- You have full control over migration timing
- Zero risk to live site
