(() => {
  const moduleData = window.AcidTier4Minions;
  if (!moduleData) throw new Error('Tier 4 minion helpers are not loaded.');
  window.AcidCardModules.register({
    kind: 'minion',
    tier: 4,
    label: 'ティア4・ミニオン',
    definitions: moduleData.definitions,
    effects: moduleData.effects,
    apply: moduleData.apply,
  });
})();