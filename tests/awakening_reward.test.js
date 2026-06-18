const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const loadCallbacks = [];
const logs = [];
const discovers = [];

const state = {
  tavernTier: 2,
  hand: [{ id: 'awakened_one', name: '覚醒ミニオン', type: 'minion', awakened: true }],
  board: [null, null, null, null],
};

const context = {
  console,
  Number,
  Boolean,
  MINIONS: [
    { id: 'tier2', name: 'Tier2', tier: 2 },
    { id: 'tier3a', name: 'Tier3 A', tier: 3 },
    { id: 'tier3b', name: 'Tier3 B', tier: 3 },
    { id: 'tier6', name: 'Tier6', tier: 6 },
  ],
  state,
  window: null,
  addEventListener(type, callback) {
    if (type === 'load') loadCallbacks.push(callback);
  },
  playHandCardToSlot(index, targetIndex) {
    const card = state.hand[index];
    if (!card || targetIndex < 2 || state.board[targetIndex]) return false;
    state.board[targetIndex] = { ...card };
    state.hand.splice(index, 1);
    return true;
  },
  gainCardToHand(gameState, card, message) {
    gameState.hand.push({ ...card });
    if (message) logs.push(message);
    return true;
  },
  discoverCardsBeyondTier(gameState, pool, count, title) {
    discovers.push({ gameState, pool, count, title });
  },
  render() {},
  log(message) { logs.push(message); },
};
context.window = context;

vm.createContext(context);
vm.runInContext(
  fs.readFileSync('acidic_rain_awakening_reward_rules.js', 'utf8'),
  context,
  { filename: 'acidic_rain_awakening_reward_rules.js' },
);
loadCallbacks.forEach(callback => callback());

assert.equal(context.playHandCardToSlot(0, 2), true);
assert.equal(state.board[2].name, '覚醒ミニオン');
assert.equal(state.hand.length, 1);
assert.equal(state.hand[0].id, 'awakening_reward');
assert.equal(state.hand[0].cost, 0);
assert.equal(logs.some(message => message.includes('覚醒報酬')), true);

state.hand[0].cast(state);
assert.equal(discovers.length, 1);
assert.equal(discovers[0].count, 1);
assert.equal(discovers[0].pool.length, 2);
assert.equal(discovers[0].pool.every(card => card.tier === 3), true);
assert.match(discovers[0].title, /グレード3/);

state.tavernTier = 6;
context.createAwakeningRewardSpell().cast(state);
assert.equal(discovers.length, 2);
assert.equal(discovers[1].pool.length, 1);
assert.equal(discovers[1].pool[0].tier, 6);
assert.match(discovers[1].title, /グレード6/);

state.hand = [{ id: 'normal_one', name: '通常ミニオン', type: 'minion', awakened: false }];
state.board[3] = null;
assert.equal(context.playHandCardToSlot(0, 3), true);
assert.equal(state.hand.length, 0, 'normal minions must not grant an awakening reward');

console.log('Awakening reward smoke test passed.');
