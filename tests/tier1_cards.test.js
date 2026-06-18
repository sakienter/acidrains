const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let installTick = null;
const logs = [];
const context = {
  console,
  Math,
  Date,
  Number,
  String,
  Array,
  Map,
  Set,
  JSON,
  HAND_LIMIT: 10,
  MINIONS: [
    { id: 'alleycat', name: '野良猫', tier: 1, cost: 3, atk: 9, hp: 9, tribe: '獣', text: 'old' },
    { id: 'legacy_boatswain', name: '船頭', tier: 1, cost: 3, atk: 9, hp: 9, tribe: 'マーロック', text: 'old' },
    { id: 'neutral_test', name: '種族なしテスト', tier: 1, cost: 3, atk: 1, hp: 1, tribe: 'なし', text: '' },
  ],
  SPELLS: [
    { id: 'dream_essence', name: '夢のエッセンス', tier: 2, cost: 2, type: 'spell', text: '雄叫びを発動する。' },
    { id: 'tier1_spell', name: 'テスト用ティア1スペル', tier: 1, cost: 1, type: 'spell', text: '' },
  ],
  state: {
    hand: [],
    board: [null, null],
    shop: [{ name: '左', atk: 1, hp: 1 }, { name: '中央', atk: 1, hp: 1 }, { name: '右', atk: 1, hp: 1 }],
    tavernTier: 1,
    rerolls: 0,
    gameOver: false,
    hasStarted: false,
    tier1DuneAfterRerollAtk: 0,
    tier1DuneAfterRerollHp: 0,
  },
  log(message) { logs.push(message); },
  gainCardToHand(gameState, card) { gameState.hand.push({ ...card }); return true; },
  discoverCards(gameState, pool, count) {
    context.lastDiscover = { pool: [...pool], count };
    for (let index = 0; index < count && pool[index]; index += 1) gameState.hand.push({ ...pool[index] });
  },
  summonToken(gameState, key, count) { context.lastSummon = { key, count }; },
  initializedClone(card) { return { ...card }; },
  getBaseShopMinionSlots() { return 3; },
  drawShop() { return context.state.shop; },
  updateAuras() {},
  render() {},
  initialState() {},
  CustomEvent: class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  },
  setInterval(callback) { installTick = callback; return 1; },
  clearInterval() {},
  dispatchEvent() {},
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('cards/common.js', 'utf8'), context, { filename: 'cards/common.js' });
vm.runInContext(fs.readFileSync('cards/minions/tier1.js', 'utf8'), context, { filename: 'cards/minions/tier1.js' });

for (const kind of ['minion', 'spell']) {
  for (let tier = 1; tier <= 6; tier += 1) {
    if (kind === 'minion' && tier === 1) continue;
    context.AcidCardModules.register({ kind, tier, label: `${kind}-${tier}`, effects: {} });
  }
}
assert.equal(typeof installTick, 'function');
installTick();
assert.equal(context.__acidTierModulesReady, true);

const expected = [
  ['野良猫', '獣', 1, 1],
  ['威嚇するわんこ', '獣', 3, 1],
  ['ショールフィン', 'マーロック', 2, 2],
  ['船頭', 'マーロック', 1, 1],
  ['大道芸人', '海賊', 3, 1],
  ['甲板磨き', '海賊', 2, 2],
  ['もりもり砂丘', 'エレメンタル', 3, 2],
  ['苔マン', 'エレメンタル', 4, 1],
  ['ガチ預言者', 'ナーガ', 1, 3],
  ['不吉な預言者', 'ナーガ', 2, 1],
];
for (const [name, tribe, atk, hp] of expected) {
  const cards = context.MINIONS.filter(card => card.name === name);
  assert.equal(cards.length, 1, `${name} must exist exactly once`);
  assert.equal(cards[0].tribe, tribe, `${name} tribe`);
  assert.equal(cards[0].atk, atk, `${name} attack`);
  assert.equal(cards[0].hp, hp, `${name} health`);
  assert.equal(typeof cards[0].cost, 'number', `${name} cost`);
}

const card = name => context.MINIONS.find(item => item.name === name);
card('野良猫').battlecry(context.state);
assert.equal(context.lastSummon.key, 'cat');
assert.equal(context.lastSummon.count, 1);
card('野良猫').awakened = true;
card('野良猫').battlecry(context.state);
assert.equal(context.lastSummon.count, 2);

context.state.hand = [];
card('威嚇するわんこ').onSell(context.state);
assert.equal(context.state.hand[0].name, '夢のエッセンス');
assert.equal(context.state.hand[0].unlockTier, 4);

context.state.hand = [];
card('船頭').onSell(context.state);
assert.equal(context.lastDiscover.count, 1);
assert.equal(context.lastDiscover.pool.some(item => item.name === '船頭'), false);
assert.equal(context.lastDiscover.pool.some(item => item.tribe === 'なし'), false);

context.state.nextTurnGoldBonus = 0;
card('大道芸人').battlecry(context.state);
assert.equal(context.state.nextTurnGoldBonus, 1);

context.state.tavernUpgradeDiscount = 0;
card('甲板磨き').battlecry(context.state);
assert.equal(context.state.tavernUpgradeDiscount, 1);

context.state.tier1DuneAfterRerollAtk = 0;
context.state.tier1DuneAfterRerollHp = 0;
card('もりもり砂丘').battlecry(context.state);
assert.equal(context.state.tier1DuneAfterRerollAtk, 1);
assert.equal(context.state.tier1DuneAfterRerollHp, 1);
context.state.shop = [{ name: '左', atk: 1, hp: 1 }, { name: '中央', atk: 1, hp: 1 }, { name: '右', atk: 1, hp: 1 }];
context.state.rerolls = 1;
context.drawShop();
assert.equal(context.state.shop[2].atk, 2);
assert.equal(context.state.shop[2].hp, 2);

const moss = card('苔マン');
moss.awakened = false;
moss.onTurnEnd(context.state);
assert.equal(context.state.tier1DuneAfterRerollAtk, 2);
assert.equal(context.state.tier1DuneAfterRerollHp, 3);
moss.awakened = true;
moss.onTurnEnd(context.state);
assert.equal(context.state.tier1DuneAfterRerollAtk, 4);
assert.equal(context.state.tier1DuneAfterRerollHp, 7);

context.state.nextSpellDiscount = 0;
card('不吉な預言者').battlecry(context.state);
assert.equal(context.state.nextSpellDiscount, 1);
assert.equal(Array.from(context.__tier1MinionMissingDefinitions).length, 0);
console.log('Tier 1 definition/effect smoke test passed.');
