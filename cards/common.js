/* Shared registry for the 12 tier-specific card modules. */
(() => {
  if (window.AcidCardModules) return;

  const EXPECTED_MODULES = 12;
  const registry = {
    minion: new Map(),
    spell: new Map(),
  };

  const api = {
    registry,
    installed: false,
    report: null,

    register(moduleDefinition) {
      const kind = String(moduleDefinition?.kind || '').trim();
      const tier = Number(moduleDefinition?.tier);
      if (!['minion', 'spell'].includes(kind)) {
        throw new Error(`Unknown card module kind: ${kind}`);
      }
      if (!Number.isInteger(tier) || tier < 1 || tier > 6) {
        throw new Error(`Invalid card module tier: ${tier}`);
      }
      if (registry[kind].has(tier)) {
        throw new Error(`Duplicate card module: ${kind} tier ${tier}`);
      }

      registry[kind].set(tier, {
        source: 'repository card pool',
        effects: {},
        ...moduleDefinition,
        kind,
        tier,
        cards: [],
        rows: [],
      });
    },

    get(kind, tier) {
      return registry[kind]?.get(Number(tier)) || null;
    },

    reinstall() {
      return installAll(true);
    },
  };

  window.AcidCardModules = api;

  function getPool(kind) {
    if (kind === 'minion') {
      return typeof MINIONS !== 'undefined' && Array.isArray(MINIONS) ? MINIONS : [];
    }
    return typeof SPELLS !== 'undefined' && Array.isArray(SPELLS) ? SPELLS : [];
  }

  function moduleCount() {
    return registry.minion.size + registry.spell.size;
  }

  function cardPoolReady() {
    return getPool('minion').length > 0 && getPool('spell').length > 0;
  }

  function normalizeName(value) {
    return String(value || '').trim();
  }

  function toRow(card, kind) {
    return {
      id: card?.id || '',
      name: normalizeName(card?.name),
      type: kind,
      tier: Number(card?.tier || 0),
      cost: Number(card?.cost || 0),
      tribe: kind === 'minion' ? String(card?.tribe || 'なし') : '',
      atk: kind === 'minion' ? Number(card?.atk || 0) : null,
      hp: kind === 'minion' ? Number(card?.hp || 0) : null,
      text: String(card?.text || ''),
      awakenedText: String(card?.awakenedText || ''),
    };
  }

  function applyPatch(card, patch, context) {
    if (!card || !patch) return;
    const resolved = typeof patch === 'function' ? patch(card, context) : patch;
    if (resolved && typeof resolved === 'object') Object.assign(card, resolved);
  }

  function installModule(moduleDefinition) {
    const pool = getPool(moduleDefinition.kind);
    const cards = pool.filter(card => Number(card?.tier) === moduleDefinition.tier);
    moduleDefinition.cards = cards;
    moduleDefinition.rows = cards.map(card => toRow(card, moduleDefinition.kind));

    const context = {
      kind: moduleDefinition.kind,
      tier: moduleDefinition.tier,
      cards,
      pool,
      minions: getPool('minion'),
      spells: getPool('spell'),
      findByName(name) {
        const target = normalizeName(name);
        return cards.find(card => normalizeName(card?.name) === target) || null;
      },
      patch(name, patch) {
        const card = this.findByName(name);
        if (!card) return false;
        applyPatch(card, patch, this);
        return true;
      },
    };

    Object.entries(moduleDefinition.effects || {}).forEach(([name, patch]) => {
      context.patch(name, patch);
    });
    if (typeof moduleDefinition.apply === 'function') moduleDefinition.apply(context);
  }

  function duplicateNames(cards) {
    const counts = new Map();
    cards.forEach(card => {
      const name = normalizeName(card?.name);
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));
  }

  function createReport() {
    const modules = [];
    for (const kind of ['minion', 'spell']) {
      for (let tier = 1; tier <= 6; tier += 1) {
        const moduleDefinition = registry[kind].get(tier);
        modules.push({
          kind,
          tier,
          label: moduleDefinition?.label || '',
          count: moduleDefinition?.cards?.length || 0,
          names: (moduleDefinition?.cards || []).map(card => normalizeName(card?.name)),
          overrideNames: Object.keys(moduleDefinition?.effects || {}),
        });
      }
    }
    const allCards = [...getPool('minion'), ...getPool('spell')];
    return {
      installedAt: new Date().toISOString(),
      modules,
      duplicateNames: duplicateNames(allCards),
      invalidTierCards: allCards
        .filter(card => !Number.isInteger(Number(card?.tier)) || Number(card?.tier) < 1 || Number(card?.tier) > 6)
        .map(card => ({ id: card?.id || '', name: normalizeName(card?.name), tier: card?.tier })),
    };
  }

  function installAll(force = false) {
    if (api.installed && !force) return true;
    if (!cardPoolReady() || moduleCount() !== EXPECTED_MODULES) return false;

    for (const kind of ['minion', 'spell']) {
      for (let tier = 1; tier <= 6; tier += 1) {
        installModule(registry[kind].get(tier));
      }
    }

    api.installed = true;
    api.report = createReport();
    window.__acidTierModulesReady = true;
    window.dispatchEvent(new CustomEvent('acid-card-modules-ready', { detail: api.report }));
    console.info('[AcidCardModules] Tier modules installed.', api.report);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (installAll()) {
      window.clearInterval(timer);
    } else if (attempts >= 400) {
      window.clearInterval(timer);
      console.error('[AcidCardModules] Card modules could not be installed.', {
        registeredModules: moduleCount(),
        expectedModules: EXPECTED_MODULES,
        cardPoolReady: cardPoolReady(),
      });
    }
  }, 25);
})();
