/* Keep the active Tier 1 minion pool aligned with cards/minions/tier1.js. */
(() => {
  if (typeof MINIONS === 'undefined' || !Array.isArray(MINIONS)) {
    throw new Error('Tier 1 pool guard requires the MINIONS card pool.');
  }

  const expectedNames = Object.freeze([
    '野良猫',
    '威嚇するわんこ',
    'ショールフィン',
    '船頭',
    '大道芸人',
    '甲板磨き',
    'もりもり砂丘',
    '苔マン',
    'ガチ預言者',
    '不吉な預言者',
  ]);
  const allowedNames = new Set(expectedNames);
  const removedNames = [];

  for (let index = MINIONS.length - 1; index >= 0; index -= 1) {
    const card = MINIONS[index];
    if (Number(card?.tier) !== 1) continue;
    const name = String(card?.name || '').trim();
    if (allowedNames.has(name)) continue;
    removedNames.push(name || String(card?.id || '(名称なし)'));
    MINIONS.splice(index, 1);
  }

  window.__tier1ExpectedMinionNames = [...expectedNames];
  window.__tier1RemovedLegacyMinionNames = removedNames.reverse();
})();
