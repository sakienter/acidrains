/* Tier 5 spell definitions, effects, and lifecycle hooks. */
(() => {
  const modules = window.AcidCardModules;
  const num = value => Number(value || 0);
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const say = message => { if (typeof log === 'function' && message) log(message); };
  const pick = pool => pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  const eligible = cards => (cards || []).filter(card => card && !card.token && card.shopEligible !== false);
  const clone = card => typeof initializedClone === 'function'
    ? initializedClone(card)
    : typeof cloneCard === 'function' ? cloneCard(card) : { ...card };

  function addCard(gameState, template, message = '', extra = {}) {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      say('手札がいっぱい。');
      return false;
    }
    const card = { ...clone(template), ...extra };
    if (card.lockedUntilTurn !== undefined && card.originalTextBeforeLock === undefined) {
      card.originalTextBeforeLock = card.text || '';
      card.text = `${card.originalTextBeforeLock}（このターンは使用不可）`;
    }
    if (typeof gainCardToHand === 'function') return gainCardToHand(gameState, card, message) !== false;
    gameState.hand.push(card);
    say(message);
    return true;
  }

  function discover(gameState, pool, count, title) {
    const candidates = eligible(pool);
    if (!candidates.length) {
      say(`${title}：候補がない。`);
      return 0;
    }
    if (typeof discoverCardsBeyondTier === 'function') {
      discoverCardsBeyondTier(gameState, candidates, count, title);
      return count;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, candidates, count, title);
      return count;
    }
    let gained = 0;
    for (let i = 0; i < count; i += 1) {
      if (!addCard(gameState, pick(candidates), i === 0 ? title : '')) break;
      gained += 1;
    }
    return gained;
  }

  function castGrowthScroll(gameState) {
    const tier = Math.max(1, Math.min(6, num(gameState.tavernTier, 1)));
    discover(gameState, MINIONS.filter(card => num(card.tier) === tier), 1, `成長のスクロール：ティア${tier}ミニオンを発見`);
    discover(gameState, SPELLS.filter(card => num(card.tier) === tier && card.name !== '成長のスクロール'), 1, `成長のスクロール：ティア${tier}スペルを発見`);
  }

  function castKaleidoscope(gameState) {
    const turn = num(gameState.turn);
    const pool = eligible(MINIONS)
      .filter(card => num(card.tier) === 6)
      .map(template => {
        const card = clone(template);
        card.lockedUntilTurn = turn;
        card.originalTextBeforeLock = card.text || '';
        card.text = `${card.originalTextBeforeLock}（このターンは使用不可）`;
        return card;
      });
    return discover(gameState, pool, 1, '万華鏡：ティア6ミニオンを発見');
  }

  function gainNamedMinion(gameState, name) {
    const template = MINIONS.find(card => card?.name === name);
    if (!template) {
      say(`${name} がミニオンプールに見つからない。`);
      return false;
    }
    return addCard(gameState, template, `${name} を得た。`);
  }

  function resolveRebound(gameState) {
    let pending = Math.max(0, Math.floor(num(gameState.reboundPending)));
    gameState.reboundPending = 0;
    if (!pending) return 0;
    const multiplier = Math.max(
      gameState.drakkariActive ? 2 : 1,
      Math.max(1, num(gameState.endTurnMultiplier, 1)),
    );
    pending *= multiplier;
    const history = Array.isArray(gameState.spellHistoryThisTurn)
      ? gameState.spellHistoryThisTurn.filter(card => card?.type === 'spell')
      : [];
    if (!history.length) {
      say('リバウンド：このターンに使ったスペルがない。');
      return 0;
    }
    const total = pending * 3;
    let gained = 0;
    for (let i = 0; i < total; i += 1) {
      if (!addCard(gameState, pick(history), i === 0 ? `リバウンドでスペルを${total}枚得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function castDreamEssence(gameState) {
    if (typeof selectBoardCard === 'function') {
      return selectBoardCard(
        gameState,
        card => card && typeof card.battlecry === 'function',
        card => card.battlecry(gameState),
        '夢のエッセンス：雄叫びを発動するミニオンを選択',
      );
    }
    const target = (gameState.board || []).find((card, index) => index >= 2 && card && typeof card.battlecry === 'function');
    if (!target) {
      say('雄叫びミニオンがいないため、夢のエッセンスは不発だった。');
      return null;
    }
    target.battlecry(gameState);
    return target;
  }

  function castHighTea(gameState) {
    const minions = eligible(MINIONS).filter(card => num(card.tier) === 5);
    const spells = eligible(SPELLS).filter(card => num(card.tier) === 5);
    const minionCount = typeof getBaseShopMinionSlots === 'function' ? getBaseShopMinionSlots(gameState.tavernTier) : 5;
    const spellCount = 1 + Math.max(0, num(gameState.extraSpellShop));
    const shop = [];
    for (let i = 0; i < minionCount; i += 1) shop.push(minions.length ? clone(pick(minions)) : null);
    for (let i = 0; i < spellCount; i += 1) shop.push(spells.length ? clone(pick(spells)) : null);

    gameState.shop = shop;
    gameState.frozen = false;
    gameState.rerolls = num(gameState.rerolls) + 1;
    if (typeof applyEastWindToRightmost === 'function') applyEastWindToRightmost(gameState);
    if (typeof applyHallelujahAfterRefresh === 'function') applyHallelujahAfterRefresh(gameState);
    if (gameState.hero?.onReroll) gameState.hero.onReroll(gameState);
    if (typeof notifyBoard === 'function') notifyBoard('onRerollCount', gameState);
    gameState.__resolvedRerolls = num(gameState.rerolls);
    if (typeof updateAuras === 'function') updateAuras();
    say('ハイティー：ティア5カードだけの酒場に入れ替えた。');
    return true;
  }

  const DEFINITIONS = [
    { id:'growth_scroll', name:'成長のスクロール', emoji:'📜', cost:4, text:'自分のグレードのミニオン1枚とスペル1枚を発見する。' },
    { id:'kaleidoscope', name:'万華鏡', emoji:'🔮', cost:3, text:'ティア6のミニオンを発見する。それはこのターン使えない。' },
    { id:'marimo_portrait', name:'マリモの肖像画', emoji:'🖼️', cost:5, text:'「酸性降雨」と「エンジン」を1枚ずつ得る。' },
    { id:'rebound', name:'リバウンド', emoji:'↩️', cost:2, text:'ターンの終了時：このターンに使ったスペルをランダムに3枚得る。' },
    { id:'dream_essence', name:'夢のエッセンス', emoji:'💭', cost:3, text:'自陣の雄叫びミニオンを選ぶ。その雄叫びを発動する。' },
    { id:'flash', name:'閃光', emoji:'⚡', cost:1, text:'6回分のリロールコストを0にする。' },
    { id:'high_tea', name:'ハイティー', emoji:'🫖', cost:4, text:'酒場をリロールする。そのリロールには、ティア5のカードしか並ばない。' },
  ];

  modules.register({
    kind:'spell', tier:5, label:'ティア5・スペル', definitions:DEFINITIONS,
    effects:{
      '成長のスクロール': () => ({ cast: castGrowthScroll }),
      '万華鏡': () => ({ cast: castKaleidoscope }),
      'マリモの肖像画': () => ({ cast(gameState){ gainNamedMinion(gameState, '酸性降雨'); gainNamedMinion(gameState, 'エンジン'); } }),
      'リバウンド': () => ({ cast(gameState){ gameState.reboundPending = num(gameState.reboundPending) + 1; say('このターンの終了時に、使用したスペルをランダムに3枚得る。'); } }),
      '夢のエッセンス': () => ({ cast: castDreamEssence }),
      '閃光': () => ({ cast(gameState){ gameState.freeRerolls = num(gameState.freeRerolls) + 6; say('次の6回のリロールコストが0になった。'); } }),
      'ハイティー': () => ({ cast: castHighTea }),
    },
    apply(){
      if (typeof state !== 'undefined') { state.reboundPending = 0; state.spellHistoryThisTurn = []; }
      if (!window.__tier5InitialStatePatched && typeof initialState === 'function') {
        window.__tier5InitialStatePatched = true;
        const previous = initialState;
        initialState = function(){ const result = previous(); state.reboundPending = 0; state.spellHistoryThisTurn = []; return result; };
      }
      if (!window.__tier5SpellHistoryPatched && typeof playHandCardToSlot === 'function') {
        window.__tier5SpellHistoryPatched = true;
        const previous = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex){
          const source = state.hand?.[index]?.type === 'spell' ? clone(state.hand[index]) : null;
          const result = previous(index, targetIndex);
          if (result && source) {
            state.spellHistoryThisTurn = Array.isArray(state.spellHistoryThisTurn) ? state.spellHistoryThisTurn : [];
            state.spellHistoryThisTurn.push(source);
          }
          return result;
        };
      }
      if (!window.__tier5EndTurnPatched && typeof endTurn === 'function') {
        window.__tier5EndTurnPatched = true;
        const previous = endTurn;
        endTurn = function(){ if (!state.gameOver) resolveRebound(state); return previous(); };
      }
      if (!window.__tier5PerTurnResetPatched && typeof resetPerTurnCardState === 'function') {
        window.__tier5PerTurnResetPatched = true;
        const previous = resetPerTurnCardState;
        resetPerTurnCardState = function(){ const result = previous(); state.spellHistoryThisTurn = []; return result; };
      }
      window.__tier5SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();