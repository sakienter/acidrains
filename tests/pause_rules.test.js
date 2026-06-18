const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function classList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
      return values.has(name);
    },
    contains(name) { return values.has(name); },
  };
}

function element(tagName = 'div') {
  const listeners = {};
  return {
    tagName,
    id: '',
    className: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    children: [],
    classList: classList(),
    attributes: {},
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(type, callback) { listeners[type] = callback; },
    querySelector() { return null; },
    fire(type, event = {}) {
      listeners[type]?.({
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
        ...event,
      });
    },
  };
}

const loadCallbacks = [];
const documentListeners = {};
const board = element('section');
const actions = element('div');
const head = element('head');
const body = element('body');
let pauseTimerCalls = 0;
let resumeTimerCalls = 0;
let rerollCalls = 0;

const state = {
  hasStarted: true,
  gameOver: false,
  turnTransitioning: false,
  isPaused: false,
};

const context = {
  console,
  state,
  window: null,
  document: {
    body,
    head,
    createElement: element,
    querySelector(selector) {
      if (selector === '.table-board') return board;
      if (selector === '.board-actions') return actions;
      return null;
    },
    addEventListener(type, callback) {
      documentListeners[type] ||= [];
      documentListeners[type].push(callback);
    },
  },
  addEventListener(type, callback) {
    if (type === 'load') loadCallbacks.push(callback);
  },
  pauseAcidTurnTimer() { pauseTimerCalls += 1; },
  resumeAcidTurnTimer() { resumeTimerCalls += 1; },
  rerollShop() { rerollCalls += 1; return true; },
  upgradeTavern() { return true; },
  buyCard() { return true; },
  playHandCardToSlot() { return true; },
  sellBoardCard() { return true; },
  endTurn() { return true; },
  setupRun() { return true; },
  finishRun() { return true; },
  render() { return true; },
  log() {},
};
context.window = context;

vm.createContext(context);
vm.runInContext(
  fs.readFileSync('acidic_rain_pause_rules.js', 'utf8'),
  context,
  { filename: 'acidic_rain_pause_rules.js' },
);
loadCallbacks.forEach(callback => callback());

const pauseButton = actions.children.find(child => child.id === 'pauseBtn');
assert.ok(pauseButton, 'pause button must be created');
assert.equal(pauseButton.textContent, '一時停止');
assert.equal(pauseButton.disabled, false);

pauseButton.fire('click');
assert.equal(state.isPaused, true);
assert.equal(pauseTimerCalls, 1);
assert.equal(pauseButton.textContent, '再開');
assert.equal(body.classList.contains('game-paused'), true);

assert.equal(context.rerollShop(), false, 'gameplay functions must be blocked while paused');
assert.equal(rerollCalls, 0);

pauseButton.fire('click');
assert.equal(state.isPaused, false);
assert.equal(resumeTimerCalls, 1);
assert.equal(pauseButton.textContent, '一時停止');
assert.equal(body.classList.contains('game-paused'), false);

assert.equal(context.rerollShop(), true);
assert.equal(rerollCalls, 1);

state.gameOver = true;
context.render();
assert.equal(pauseButton.disabled, true, 'pause button must be disabled after game over');

console.log('Pause controls smoke test passed.');
