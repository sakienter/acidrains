/* Tier 6 spell definitions, effects, and lifecycle hooks. */
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

  function addCard(gameState, template, message = '') {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      say('手札がいっぱい。');
      return false;
    }
    const card = clone(template);
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

  function adjustTurnTime(gameState, delta) {
    const change = num(delta);
    if (!change) return 0;
    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof pauseAcidTurnTimer === 'function'
      && typeof resumeAcidTurnTimer === 'function';
    if (shouldResume) pauseAcidTurnTimer();
    const before = Math.max(0, num(gameState.turnTimeRemaining));
    gameState.turnTimeRemaining = Math.max(0, before + change);
    if (change > 0) gameState.turnTimeLimit = Math.max(num(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    if (shouldResume) resumeAcidTurnTimer();
    return gameState.turnTimeRemaining - before;
  }

  function extendTurnLimit(gameState) {
    if (gameState.endlessMode) {
      say('エンドレスモードではリミットターンは増減しない。');
      return false;
    }
    gameState.maxTurns = Math.max(num(gameState.turn, 1), num(gameState.maxTurns)) + 1;
    say(`リミットターンが1増え、${gameState.maxTurns}ターンになった。`);
    return true;
  }

  function chooseBoardMinion(gameState, predicate, title, action) {
    if (typeof selectBoardCard === 'function') return selectBoardCard(gameState, predicate, action, title);
    const entries = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && entry.card && predicate(entry.card));
    if (!entries.length) {
      say('対象となるミニオンがいない。');
      return null;
    }
    const lines = entries.map((entry, index) => `${index + 1}. ${entry.card.name}`).join('\n');
    const answer = window.prompt(`${title}\n${lines}`, '1');
    const selected = entries[Number(answer) - 1] || entries[0];
    action(selected.card, selected.index);
    return selected.card;
  }

  function castDoppelganger(gameState) {
    if (handLimit() - gameState.hand.length < 2) {
      say('手札に2枚分の空きがないため、ドッペルゲンガーの奇策は不発だった。');
      return false;
    }
    return Boolean(chooseBoardMinion(
      gameState,
      card => card.type !== 'spell' && typeof card.battlecry === 'function',
      'ドッペルゲンガーの奇策：手札に戻す雄叫びミニオンを選択',
      (card, index) => {
        const template = MINIONS.find(candidate => candidate.id === card.id || candidate.name === card.name);
        gameState.board[index] = null;
        gameState.hand.push(card);
        if (template) addCard(gameState, template, `${card.name}の同名カードを1枚得た。`);
        if (typeof updateAuras === 'function') updateAuras();
      },
    ));
  }

  function castSuperAwakening(gameState) {
    return Boolean(chooseBoardMinion(
      gameState,
      card => card.type !== 'spell' && num(card.tier) <= 5 && !card.awakened,
      '超覚醒化：覚醒させるティア5以下のミニオンを選択',
      card => {
        card.awakened = true;
        card.text = card.awakenedText || card.text;
        say(`✨ ${card.name} を覚醒させた。`);
      },
    ));
  }

  function spellPool(gameState) {
    const tier = Math.max(1, num(gameState.tavernTier, 1));
    return eligible(SPELLS).filter(card => {
      const cost = num(card.cost);
      return num(card.tier) <= tier && cost >= 1 && cost <= 10;
    });
  }

  function canBuild(pool, cost, count, memo = new Map()) {
    const key = `${cost}:${count}`;
    if (memo.has(key)) return memo.get(key);
    if (count === 0) return cost === 0;
    if (cost <= 0) return false;
    const result = pool.some(card => num(card.cost) <= cost && canBuild(pool, cost - num(card.cost), count - 1, memo));
    memo.set(key, result);
    return result;
  }

  function createBundle(gameState, targetCost) {
    const pool = spellPool(gameState);
    const freeSlots = Math.max(0, handLimit() - gameState.hand.length);
    if (!pool.length || !freeSlots) {
      say('スペルボックスを開ける手札枠がない。');
      return [];
    }
    const counts = [];
    for (let count = 1; count <= Math.min(targetCost, freeSlots); count += 1) {
      if (canBuild(pool, targetCost, count)) counts.push(count);
    }
    if (!counts.length) {
      say(`合計${targetCost}コストになるスペルの組み合わせがない。`);
      return [];
    }
    const selectedCount = pick(counts);
    const bundle = [];
    let cost = targetCost;
    let count = selectedCount;
    while (count > 0) {
      const candidates = pool.filter(card => num(card.cost) <= cost && canBuild(pool, cost - num(card.cost), count - 1));
      const card = pick(candidates);
      if (!card) break;
      bundle.push(card);
      cost -= num(card.cost);
      count -= 1;
    }
    return cost === 0 && bundle.length === selectedCount ? bundle : [];
  }

  function castLargeSpellBox(gameState) {
    const bundle = createBundle(gameState, 10);
    bundle.forEach((card, index) => addCard(gameState, card, index === 0 ? `でかいスペルボックスから${bundle.length}枚のスペルを得た。` : ''));
    return bundle.length;
  }

  function castBingeEating(gameState) {
    adjustTurnTime(gameState, -30);
    const pool = eligible([...MINIONS, ...SPELLS]).filter(card => num(card.tier) === 5);
    let gained = 0;
    for (let i = 0; i < 3; i += 1) {
      if (!addCard(gameState, pick(pool), i === 0 ? 'ティア5カードをランダムに3枚得た。' : '')) break;
      gained += 1;
    }
    return gained;
  }

  function castHumanError(gameState) {
    if (!gameState.endlessMode) {
      gameState.maxTurns = Math.max(num(gameState.turn, 1), num(gameState.maxTurns) - 2);
      say(`リミットターンが2減り、${gameState.maxTurns}ターンになった。`);
    } else {
      say('エンドレスモードではリミットターンは減少しない。');
    }
    discover(gameState, MINIONS.filter(card => num(card.tier) === 6), 3, 'ヒューマンエラー：ティア6ミニオンを発見');
  }

  function repeatSpellWithoutDoubleEndTurn(gameState, source) {
    if (source.name === 'エンドロール') {
      const bonus = Math.floor(Math.max(0, num(gameState.turnTimeRemaining)) / 10);
      gameState.nextTurnGoldBonus = num(gameState.nextTurnGoldBonus) + bonus;
      say(`エンドロールが追加発動し、次のターンの追加ゴールドがさらに${bonus}増えた。`);
      return;
    }
    source.cast(gameState);
  }

  const DEFINITIONS = [
    { id:'time_transcendence', name:'時空の超越', emoji:'⏳', cost:8, text:'リミットターンの猶予を1増やす。' },
    { id:'temporary_time_rewrite', name:'一時的な時間改竄', emoji:'🕰️', cost:3, text:'このターン、次に使うスペルは追加で1回発動される。' },
    { id:'doppelganger_tactic', name:'ドッペルゲンガーの奇策', emoji:'👥', cost:5, text:'自陣の雄叫びミニオンを1枚手札に戻す。その同名カードを1枚得る。' },
    { id:'super_awakening', name:'超覚醒化', emoji:'🌟', cost:5, text:'自陣のティア5以下のミニオンを1枚選び、覚醒させる。' },
    { id:'large_spell_box', name:'でかいスペルボックス', emoji:'🧰', cost:4, text:'合計10コストになるように、ランダムにスペルを得る。' },
    { id:'binge_eating', name:'ドカ食い', emoji:'🍱', cost:4, text:'残り時間を30秒減らす。ティア5カードをランダムに3枚得る。' },
    { id:'human_error', name:'ヒューマンエラー', emoji:'⚠️', cost:4, text:'リミットターンを2ターン減らす。ティア6ミニオンを3回発見する。' },
  ];

  modules.register({
    kind:'spell', tier:6, label:'ティア6・スペル', definitions:DEFINITIONS,
    effects:{
      '時空の超越': () => ({ cast: extendTurnLimit }),
      '一時的な時間改竄': () => ({ cast(gameState){ gameState.timeRewriteCharges = num(gameState.timeRewriteCharges) + 1; say('このターン、次に使うスペルが追加で1回発動する。'); } }),
      'ドッペルゲンガーの奇策': () => ({ cast: castDoppelganger }),
      '超覚醒化': () => ({ cast: castSuperAwakening }),
      'でかいスペルボックス': () => ({ cast: castLargeSpellBox }),
      'ドカ食い': () => ({ cast: castBingeEating }),
      'ヒューマンエラー': () => ({ cast: castHumanError }),
    },
    apply(){
      if (typeof state !== 'undefined') state.timeRewriteCharges = 0;
      if (!window.__tier6InitialStatePatched && typeof initialState === 'function') {
        window.__tier6InitialStatePatched = true;
        const previous = initialState;
        initialState = function(){ const result = previous(); state.timeRewriteCharges = 0; return result; };
      }
      if (!window.__tier6TimeRewritePatched && typeof playHandCardToSlot === 'function') {
        window.__tier6TimeRewritePatched = true;
        const previous = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex){
          const source = state.hand?.[index] || null;
          const repeat = Boolean(source && source.type === 'spell' && source.name !== '一時的な時間改竄' && num(state.timeRewriteCharges) > 0);
          const result = previous(index, targetIndex);
          if (result && repeat && typeof source.cast === 'function') {
            state.timeRewriteCharges = Math.max(0, num(state.timeRewriteCharges) - 1);
            repeatSpellWithoutDoubleEndTurn(state, source);
            if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', state, source);
            if (typeof updateAuras === 'function') updateAuras();
            say(`${source.name} が追加でもう1回発動した。`);
            if (typeof render === 'function') render();
          }
          return result;
        };
      }
      if (!window.__tier6PerTurnResetPatched && typeof resetPerTurnCardState === 'function') {
        window.__tier6PerTurnResetPatched = true;
        const previous = resetPerTurnCardState;
        resetPerTurnCardState = function(){ const result = previous(); state.timeRewriteCharges = 0; return result; };
      }
      window.__tier6SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();