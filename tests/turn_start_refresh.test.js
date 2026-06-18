const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createScenario({ frozen = false, turn = 1, maxTurns = 16, endlessMode = false } = {}) {
  const loadCallbacks = [];
  const events = [];
  const logs = [];
  let heroRerolls = 0;
  let drawObservedRerolls = null;

  const context = {
    console,
    Number,
    Boolean,
    state: {
      turn,
      maxTurns,
      endlessMode,
      gameOver: false,
      frozen,
      rerolls: 4,
      __resolvedRerolls: 4,
      tier1DuneLastAppliedReroll: 4,
      tier1DuneAfterRerollAtk: 1,
      tier1DuneAfterRerollHp: 2,
      shop: [
        { name: '旧左', atk: 8, hp: 8 },
        { name: '旧中央', atk: 8, hp: 8 },
        { name: '旧右', atk: 9, hp: 9 },
        { name: '旧スペル', type: 'spell' },
      ],
      hero: {
        onReroll() {
          heroRerolls += 1;
        },
      },
    },
    window: null,
    addEventListener(type, callback) {
      if (type === 'load') loadCallbacks.push(callback);
    },
    notifyBoard(hook, gameState) {
      events.push({
        hook,
        rightmost: gameState.shop[2]
          ? { atk: gameState.shop[2].atk, hp: gameState.shop[2].hp }
          : null,
      });
    },
    updateAuras() {},
    render() {},
    log(message) {
      logs.push(message);
    },
    drawShop() {
      drawObservedRerolls = context.state.rerolls;
      context.state.shop = [
        { name: '新左', atk: 1, hp: 1 },
        { name: '新中央', atk: 1, hp: 1 },
        { name: '新右', atk: 1, hp: 1 },
        { name: '新スペル', type: 'spell' },
      ];

      // Mirror the Tier 1 drawShop wrapper: the persistent buff resolves only
      // when the replacement counter increased before the new shop was drawn.
      if (context.state.rerolls > context.state.tier1DuneLastAppliedReroll) {
        const rightmost = context.state.shop[2];
        rightmost.atk += context.state.tier1DuneAfterRerollAtk;
        rightmost.hp += context.state.tier1DuneAfterRerollHp;
        context.state.tier1DuneLastAppliedReroll = context.state.rerolls;
      }
      return context.state.shop;
    },
    endTurn() {
      if (context.state.gameOver) return false;
      if (!context.state.endlessMode && context.state.turn >= context.state.maxTurns) {
        context.state.gameOver = true;
        return true;
      }

      context.state.turn += 1;
      if (context.state.frozen) {
        context.state.frozen = false;
        context.state.shop.forEach(card => {
          if (card) card.frozen = false;
        });
        return true;
      }

      context.drawShop();
      return true;
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync('acidic_rain_turn_refresh_rules.js', 'utf8'),
    context,
    { filename: 'acidic_rain_turn_refresh_rules.js' },
  );
  loadCallbacks.forEach(callback => callback());

  return {
    context,
    events,
    logs,
    get heroRerolls() { return heroRerolls; },
    get drawObservedRerolls() { return drawObservedRerolls; },
  };
}

{
  const scenario = createScenario({ frozen: false });
  scenario.context.endTurn();

  assert.equal(scenario.context.state.turn, 2);
  assert.equal(scenario.context.state.rerolls, 5, 'unfrozen next-turn tavern must count as one replacement');
  assert.equal(scenario.drawObservedRerolls, 5, 'counter must increase immediately before the new tavern is drawn');
  assert.equal(scenario.context.state.shop[2].name, '新右');
  assert.equal(scenario.context.state.shop[2].atk, 2, 'rightmost attack buff must apply to the newly opened tavern');
  assert.equal(scenario.context.state.shop[2].hp, 3, 'rightmost health buff must apply to the newly opened tavern');
  assert.equal(scenario.heroRerolls, 1, 'reroll-linked hero effects must receive the replacement count');
  assert.equal(scenario.events.filter(event => event.hook === 'onRerollCount').length, 1);
  assert.deepEqual(
    scenario.events.find(event => event.hook === 'onRerollCount').rightmost,
    { atk: 2, hp: 3 },
    'reroll-count effects must resolve after the new tavern and its rightmost buff are ready',
  );
  assert.equal(scenario.context.state.__resolvedRerolls, 5);
  assert.equal(scenario.logs.includes('ターン開始時の新しい酒場を、入替1回として数えた。'), true);
}

{
  const scenario = createScenario({ frozen: true });
  scenario.context.endTurn();

  assert.equal(scenario.context.state.turn, 2);
  assert.equal(scenario.context.state.rerolls, 4, 'frozen taverns must not add a replacement count');
  assert.equal(scenario.drawObservedRerolls, null, 'a frozen tavern must not be redrawn');
  assert.equal(scenario.context.state.shop[2].name, '旧右');
  assert.equal(scenario.context.state.shop[2].atk, 9);
  assert.equal(scenario.context.state.shop[2].hp, 9);
  assert.equal(scenario.heroRerolls, 0);
  assert.equal(scenario.events.some(event => event.hook === 'onRerollCount'), false);
}

{
  const scenario = createScenario({ frozen: false, turn: 16, maxTurns: 16 });
  scenario.context.endTurn();

  assert.equal(scenario.context.state.gameOver, true);
  assert.equal(scenario.context.state.rerolls, 4, 'no replacement is counted when no next turn opens');
  assert.equal(scenario.heroRerolls, 0);
  assert.equal(scenario.events.some(event => event.hook === 'onRerollCount'), false);
}

console.log('Turn-start tavern replacement smoke test passed.');
