# Card effect modules

Card-specific effects are implemented only in the 12 tier files below.

```text
cards/
├── common.js
├── minions/
│   ├── tier1.js
│   ├── tier2.js
│   ├── tier3.js
│   ├── tier4.js
│   ├── tier5.js
│   └── tier6.js
└── spells/
    ├── tier1.js
    ├── tier2.js
    ├── tier3.js
    ├── tier4.js
    ├── tier5.js
    └── tier6.js
```

## Responsibilities

- `common.js`: module registration, card lookup, effect patching, and diagnostics.
- `minions/tierN.js`: all effects and tier-specific hooks for Tier N minions.
- `spells/tierN.js`: all effects and tier-specific hooks for Tier N spells.
- Root-level `acidic_rain_*_rules.js`: game-wide systems only. Do not add an individual card effect there.

Each tier file registers exactly one module:

```js
modules.register({
  kind: 'minion', // or 'spell'
  tier: 1,
  label: 'ティア1・ミニオン',
  effects: {
    'カード名': () => ({
      battlecry(gameState) {
        // effect
      },
    }),
  },
  apply(context) {
    // Tier-wide lifecycle hooks only when necessary.
  },
});
```

Use `battlecry`, `onSell`, `onTurnEnd`, `deathrattle`, `cast`, and other engine event names on the patched card object. Shared helpers used by several tiers belong in `common.js` or a game-wide rule file; helpers used by one tier stay inside that tier file.
