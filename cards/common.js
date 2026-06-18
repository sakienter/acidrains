/* Shared registry for the 12 tier-specific card modules. */
(() => {
  if (window.AcidCardModules) return;

  const EXPECTED_MODULES = 12;
  const registry = {
    minion: new Map(),
    spell: new Map(),
  };

  const normalizeName = value => String(value || '').trim();
  const normalizeId = value => String(value || '').trim();

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
        definitions: [],
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
  window.__acidCardModuleVersion = 3;

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
    if (!card || !patch) return false;
    const resolved = typeof patch === 'function' ? patch(card, context) : patch;
    if (!resolved || typeof resolved !== 'object') return false;
    Object.assign(card, resolved);
    return true;
  }

  function upsertDefinitions(moduleDefinition) {
    const pool = getPool(moduleDefinition.kind);
    let changed = false;

    (moduleDefinition.definitions || []).forEach(rawDefinition => {
      if (!rawDefinition || typeof rawDefinition !== 'object') return;
      const definition = {
        ...rawDefinition,
        tier: moduleDefinition.tier,
        ...(moduleDefinition.kind === 'spell' ? { type: 'spell' } : {}),
      };
      const id = normalizeId(definition.id);
      const name = normalizeName(definition.name);
      if (!id || !name) {
        throw new Error(`Card definition requires id and name: ${moduleDefinition.kind} tier ${moduleDefinition.tier}`);
      }

      const matchingIndexes = [];
      pool.forEach((card, index) => {
        if (normalizeId(card?.id) === id || normalizeName(card?.name) === name) {
          matchingIndexes.push(index);
        }
      });

      if (!matchingIndexes.length) {
        pool.push({ ...definition });
        changed = true;
        return;
      }

      const targetIndex = matchingIndexes[0];
      const target = pool[targetIndex];
      const before = JSON.stringify(toRow(target, moduleDefinition.kind));
      Object.assign(target, definition);
      const after = JSON.stringify(toRow(target, moduleDefinition.kind));
      if (before !== after) changed = true;

      for (let matchIndex = matchingIndexes.length - 1; matchIndex >= 1; matchIndex -= 1) {
        pool.splice(matchingIndexes[matchIndex], 1);
        changed = true;
      }
    });

    return changed;
  }

  function installModule(moduleDefinition) {
    const definitionsChanged = upsertDefinitions(moduleDefinition);
    const pool = getPool(moduleDefinition.kind);
    const cards = pool.filter(card => Number(card?.tier) === moduleDefinition.tier);
    moduleDefinition.cards = cards;

    const context = {
      kind: moduleDefinition.kind,
      tier: moduleDefinition.tier,
      cards,
      pool,
      minions: getPool('minion'),
      spells: getPool('spell'),
      definitionsChanged,

      findByName(name) {
        const target = normalizeName(name);
        return cards.find(card => normalizeName(card?.name) === target) || null;
      },

      findAllByName(name) {
        const target = normalizeName(name);
        return cards.filter(card => normalizeName(card?.name) === target);
      },

      findById(id) {
        const target = normalizeId(id);
        return cards.find(card => normalizeId(card?.id) === target) || null;
      },

      patch(name, patch) {
        const targets = this.findAllByName(name);
        let patched = 0;
        targets.forEach(card => {
          if (applyPatch(card, patch, this)) patched += 1;
        });
        return patched;
      },

      patchById(id, patch) {
        const card = this.findById(id);
        return card && applyPatch(card, patch, this) ? 1 : 0;
      },
    };

    Object.entries(moduleDefinition.effects || {}).forEach(([name, patch]) => {
      context.patch(name, patch);
    });
    if (typeof moduleDefinition.apply === 'function') moduleDefinition.apply(context);

    moduleDefinition.rows = cards.map(card => toRow(card, moduleDefinition.kind));
    return definitionsChanged;
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
          definitionNames: (moduleDefinition?.definitions || []).map(card => normalizeName(card?.name)),
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

  function refreshInitialShopIfNeeded(definitionsChanged) {
    if (!definitionsChanged || typeof state === 'undefined' || !state) return;
    if (state.hasStarted || state.gameOver) return;
    if (typeof drawShop === 'function') drawShop();
    if (typeof updateAuras === 'function') updateAuras();
    if (typeof render === 'function') render();
  }

  function installAll(force = false) {
    if (api.installed && !force) return true;
    if (!cardPoolReady() || moduleCount() !== EXPECTED_MODULES) return false;

    let definitionsChanged = false;
    for (const kind of ['minion', 'spell']) {
      for (let tier = 1; tier <= 6; tier += 1) {
        definitionsChanged = installModule(registry[kind].get(tier)) || definitionsChanged;
      }
    }

    api.installed = true;
    api.report = createReport();
    window.__acidTierModulesReady = true;
    refreshInitialShopIfNeeded(definitionsChanged);
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
