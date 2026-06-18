const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function makeClassList() {
  const values = new Set();
  return {
    add(...items) { items.forEach(item => values.add(item)); },
    remove(...items) { items.forEach(item => values.delete(item)); },
    contains(item) { return values.has(item); },
  };
}

function createScenario({ turn = 1, maxTurns = 16, endlessMode = false } = {}) {
  const loadCallbacks = [];
  const timeouts = [];
  const intervals = [];
  const logs = [];
  const elements = new Map();
  let inheritedCalls = 0;

  function createElement(tagName) {
    return {
      tagName,
      id: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: makeClassList(),
      children: [],
      setAttribute() {},
      appendChild(child) { this.children.push(child); return child; },
      querySelector(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, { textContent: '', style: {}, classList: makeClassList() });
        }
        return elements.get(selector);
      },
    };
  }

  const document = {
    head: { appendChild() {} },
    body: {
      classList: makeClassList(),
      appendChild(element) { this.lastChild = element; return element; },
    },
    createElement,
  };

  const state = {
    turn,
    maxTurns,
    endlessMode,
    gameOver: false,
    hasStarted: true,
    turnTransitioning: false,
  };

  const context = {
    console,
    Number,
    Boolean,
    Date: { now: () => 1000 },
    state,
    document,
    window: null,
    addEventListener(type, callback) {
      if (type === 'load') loadCallbacks.push(callback);
    },
    setTimeout(callback, delay) {
      const id = timeouts.length + 1;
      timeouts.push({ id, callback, delay, cleared: false });
      return id;
    },
    clearTimeout(id) {
      const timer = timeouts.find(item => item.id === id);
      if (timer) timer.cleared = true;
    },
    setInterval(callback, delay) {
      const id = intervals.length + 1;
      intervals.push({ id, callback, delay, cleared: false });
      return id;
    },
    clearInterval(id) {
      const timer = intervals.find(item => item.id === id);
      if (timer) timer.cleared = true;
    },
    endTurn() {
      inheritedCalls += 1;
      state.turn += 1;
      if (!state.endlessMode && state.turn > state.maxTurns) state.gameOver = true;
      return true;
    },
    log(message) { logs.push(message); },
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync('acidic_rain_turn_transition_rules.js', 'utf8'),
    context,
    { filename: 'acidic_rain_turn_transition_rules.js' },
  );
  loadCallbacks.forEach(callback => callback());

  return {
    context,
    state,
    timeouts,
    intervals,
    logs,
    get inheritedCalls() { return inheritedCalls; },
  };
}

{
  const scenario = createScenario();
  assert.equal(scenario.context.endTurn(), true);
  assert.equal(scenario.state.turn, 1, 'next turn must not begin immediately');
  assert.equal(scenario.state.turnTransitioning, true);
  assert.equal(scenario.state.hasStarted, false, 'turn timer must pause during preparation');
  assert.equal(scenario.timeouts.length, 1);
  assert.equal(scenario.timeouts[0].delay, 5000);
  assert.equal(scenario.context.ACID_TURN_PREPARATION_MS, 5000);
  assert.equal(scenario.logs.includes('次のターンの準備中。'), true);

  scenario.timeouts[0].callback();
  assert.equal(scenario.inheritedCalls, 1);
  assert.equal(scenario.state.turn, 2);
  assert.equal(scenario.state.turnTransitioning, false);
  assert.equal(scenario.state.hasStarted, true);
}

{
  const scenario = createScenario({ turn: 16, maxTurns: 16 });
  assert.equal(scenario.context.endTurn(), true);
  assert.equal(scenario.inheritedCalls, 1, 'final turn must bypass the preparation screen');
  assert.equal(scenario.timeouts.length, 0);
  assert.equal(scenario.state.turn, 17);
}

console.log('Turn transition smoke test passed.');
