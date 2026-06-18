const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const loadCallbacks = [];
let basePlayCalls = 0;
let spent = 0;
const context = {
  console,
  Number,
  Math,
  state: {
    gold: 10,
    tavernTier: 1,
    hand: [{
      name: '夢のエッセンス',
      type: 'spell',
      unlockTier: 4,
      originalTextBeforeUnlock: 'effect',
      text: 'locked',
    }],
    shop: [{ name: '買うカード', type: 'minion', cost: 3 }],
    board: [null, null, null],
    doubleSpellCharges: 0,
  },
  window: null,
  document: { addEventListener() {} },
  addEventListener(type, callback) {
    if (type === 'load') loadCallbacks.push(callback);
  },
  log() {},
  render() {},
  updateAuras() {},
  notifyGoldSpent(value) { spent += value; },
  notifyBoard() {},
  buyCard(index) {
    context.state.gold -= context.state.shop[index].cost;
    return true;
  },
  upgradeTavern() {
    context.state.tavernTier += 1;
    return true;
  },
  playHandCardToSlot() {
    basePlayCalls += 1;
    return true;
  },
  sellBoardCard() { return true; },
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('acidic_rain_play_restrictions.js', 'utf8'), context, {
  filename: 'acidic_rain_play_restrictions.js',
});
vm.runInContext(fs.readFileSync('acidic_rain_card_event_bridge.js', 'utf8'), context, {
  filename: 'acidic_rain_card_event_bridge.js',
});
loadCallbacks.forEach(callback => callback());

context.buyCard(0);
assert.equal(spent, 3);
assert.equal(context.playHandCardToSlot(0, 2), false);
assert.equal(basePlayCalls, 0);
context.upgradeTavern();
context.upgradeTavern();
context.upgradeTavern();
assert.equal(context.state.tavernTier, 4);
assert.equal(context.state.hand[0].text, 'effect');
assert.equal(context.playHandCardToSlot(0, 2), true);
assert.equal(basePlayCalls, 1);
console.log('Shared event bridge/restriction smoke test passed.');
