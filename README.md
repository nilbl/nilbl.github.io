# Nil's Portfolio

My personal portfolio built as a retro RPG-themed interactive experience. This started as a simple CV page but turned into something way more fun.

## What's This?

A playable portfolio site where you can:
- Pick a character and explore different worlds
- Check out my experience and education through an interactive timeline
- Play a dice game against a Balatro-inspired joker
- Find hidden easter eggs (yes, there's a Konami code)

## Tech Stack

- **Vanilla JS** (ES6 modules) - No framework needed, just clean modular code
- **CSS3** - All the retro pixel art styling

## Project Structure

```
js/
├── components/          # Reusable UI components
│   ├── soundSystem.js   # Audio management
│   └── animations.js    # Smoke effects, confetti
├── core/                # Core systems
│   ├── translations.js  # i18n (EN, ES, CA)
│   └── navigation.js    # Section switching
├── features/            # Game features
│   ├── diceGame.js      # Dice rolling mechanics
│   ├── bossSystem.js    # HP bar persistence
│   ├── hiddenMage.js    # Easter egg dialogues
│   ├── parallax.js      # Theme switching
│   ├── timeline.js      # Experience timeline
│   └── easterEggs.js    # Konami code, secrets
└── utils/               # Helper functions
```

## Cool Features

### Boss HP Persistence
The boss HP bar remembers your progress between normal refreshes (F5) but resets on hard refresh (Ctrl+Shift+R). Uses `performance.navigation.type` detection.

### Theme Switcher
Four parallax backgrounds (Forest, Skies, Moon, Desert) that change the entire world dynamically.

### Modular Architecture
Migrated from a 2000-line monolithic script to clean ES6 modules. Each feature is self-contained and importable.

### Hidden Secrets
- Click the portrait 5 times for something special
- Try the Konami code (↑↑↓↓←→←→BA)
- Gamepad support for navigation
- Random mage dialogues with typewriter effects

## Running Locally

1. Clone the repo
2. Serve with any static server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
3. Open `http://localhost:8000`

## Languages

The site supports three languages:
- English (default)
- Spanish
- Catalan

Translations are in `translations/` and switch instantly with the language selector.

## Known Issues

- Hard refresh detection using `performance.navigation` is deprecated but still works everywhere
- Voice sounds for the joker don't play on mobile (intentional, would be annoying)

## Credits

- Pixel art and sprites: Various game asset packs
- Sound effects: Freesound.org
- Balatro joker design inspired by LocalThunk's game

## License

Code is MIT. Assets belong to their respective creators.

---

Built with way too much free time.
