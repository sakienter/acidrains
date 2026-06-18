const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const loadCallbacks = [];
const logs = [];

const legacyHiddenRain = {
  id: 'acidic_rain_copy',
  name: '非表示の旧酸性降雨',
  atk: 6,
  hp: 6,
  rerollProgress: 0,
};
const rainA = {
  id: 'acidic_rain_copy',
  name: '酸性降雨A',
  atk: 6,
  hp: 6,
  rerollProgress: 0,
};
const rainB = {
  id: 'acidic_rain_copy',
  name: '酸性降雨B',
  atk: 10,
  hp: 10,
  rerollProgress: 0,
};

const state = {
  board: [null, legacyHiddenRain, rainA, rainB, null],
  hand: [],
  shop: [{ name: '右端ミニオン', atk: 3, hp: 5 }],
  rerolls: 0,
  __resolvedRerolls: 0,
  gold: 10,
  maxGold: 10,
  freeRerolls: 0,
  firstRerollFree: false,
  gameOver: false,
  tavernTier: 3,
  seedGrowth: 0,
};

function createNode() {
  return {
    className: '',
    textContent: '',
    title: '',
    dataset: {},
    style: {},
    classList: { add() {}, remove() {} },
    appendChild() {},
    querySelector() { return null; },
  };
}

const context = {
  console,
  Number,
  Math,
  Date,
  Array,
  state,
  window: null,
  document: {
    head: { appendChild() {} },
    createElement() { return createNode(); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  },
  addEventListener(type, callback) {
    if (type === 'load') loadCallbacks.push(callback);
  },
  initialState() {},
  setupRun() {},
  growSeed() {},
  playHandCardToSlot() { return false; },
  rerollShop() { return false; },
  getRerollCost() { return 1; },
  discoverCards() {},
  gainCardToHand() { return true; },
  drawShop() {},
  updateAuras() {},
  render() {},
  log(message) { logs.push(message); },
  resultBoxEl: { classList: { add() {} } },
  resultScoreEl: { textContent: '' },
  resultTextEl: { innerHTML: '' },
  rerollBtn: { addEventListener() {} },
};
context.window = context;

vm.createContext(context);
vm.runInContext(
  fs.readFileSync('acidic_rain_rebuild.js', 'utf8'),
  context,
  { filename: 'acidic_rain_rebuild.js' },
);
loadCallbacks.forEach(callback => callback());

assert.equal(state.board[1], null, 'the hidden prototype Acidic Rain must be removed');
assert.equal(typeof rainA.onRerollCount, 'function');
assert.equal(typeof rainB.onRerollCount, 'function');

for (let tick = 0; tick < 3; tick += 1) rainA.onRerollCount(state);
rainB.onRerollCount(state);

assert.equal(rainA.rerollProgress, 3);
assert.equal(rainB.rerollProgress, 1);
assert.deepEqual([rainA.atk, rainA.hp], [6, 6]);
assert.deepEqual([rainB.atk, rainB.hp], [10, 10]);

rainA.onRerollCount(state);
assert.equal(rainA.rerollProgress, 0, 'only A must reset after its fourth reroll');
assert.equal(rainB.rerollProgress, 1, 'B progress must stay independent');
assert.deepEqual([rainA.atk, rainA.hp], [9, 11]);
assert.deepEqual([rainB.atk, rainB.hp], [10, 10]);

for (let tick = 0; tick < 3; tick += 1) rainB.onRerollCount(state);
assert.equal(rainA.rerollProgress, 0);
assert.equal(rainB.rerollProgress, 0);
assert.deepEqual([rainA.atk, rainA.hp], [9, 11]);
assert.deepEqual([rainB.atk, rainB.hp], [13, 15]);
assert.equal(logs.filter(message => message.includes('入替4回に反応')).length, 2);

console.log('Acidic Rain per-instance reroll progress test passed.');
