/* Keep the active Tier 4 minion pool aligned with the authoritative list. */
(() => {
  if (typeof MINIONS === 'undefined' || !Array.isArray(MINIONS)) {
    throw new Error('Tier 4 pool guard requires the MINIONS card pool.');
  }

  const expectedNames = Object.freeze([
    'サメ',
    'ライラク',
    '指示フィン',
    'ママコメフィン',
    '夜型の海賊',
    '物好きな海賊',
    'まりも船長',
    'エンジン',
    'さかまき',
    '入れ替え異常体',
    '夢見るナーガ',
    '友達のナーガ',
    '磯の探検家',
    'ブランの卵',
    '魔術をつかうトーレン',
    'エリーズ',
    '音楽家',
  ]);
  const allowed = new Set(expectedNames);
  const removed = [];

  for (let index = MINIONS.length - 1; index >= 0; index -= 1) {
    const card = MINIONS[index];
    if (Number(card?.tier) !== 4) continue;
    const name = String(card?.name || '').trim();
    if (allowed.has(name)) continue;
    removed.push(name || String(card?.id || '(名称なし)'));
    MINIONS.splice(index, 1);
  }

  window.__tier4ExpectedMinionNames = [...expectedNames];
  window.__tier4RemovedLegacyMinionNames = removed.reverse();
})();