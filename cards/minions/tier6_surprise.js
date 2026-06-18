/* Tier 6 Surprise Elemental wildcard definition. */
(() => {
  const moduleDefinition = window.AcidCardModules?.get?.('minion', 6) || null;
  if (!moduleDefinition) {
    throw new Error('Tier 6 minion module must load before Surprise Elemental.');
  }

  const definition = {
    id: 'surprise_elemental',
    name: '意外精',
    emoji: '❓',
    cost: 3,
    atk: 10,
    hp: 10,
    tribe: 'エレメンタル',
    text: 'エレメンタルを覚醒させる際、同名カード1枚分として扱える。（「意外精」を除く）',
    awakenedText: 'このカードは覚醒の代用素材として扱われる。',
  };

  const definitions = Array.isArray(moduleDefinition.definitions)
    ? moduleDefinition.definitions
    : (moduleDefinition.definitions = []);

  const existing = definitions.find(card => card?.id === definition.id || card?.name === definition.name);
  if (existing) Object.assign(existing, definition);
  else definitions.push(definition);

  window.__tier6SurpriseElementalDefined = true;

  if (window.AcidCardModules?.installed) {
    window.AcidCardModules.reinstall();
  }
})();