/* Tier 6 Surprise Elemental wildcard definition and Tier 6 token corrections. */
(() => {
  const moduleDefinition = window.AcidCardModules?.get?.('minion', 6) || null;
  if (!moduleDefinition) {
    throw new Error('Tier 6 minion module must load before Surprise Elemental.');
  }

  const definition = {
    id: 'surprise_elemental',
    name: '意外精',
    emoji: '❓',
    cost: 3,
    atk: 10,
    hp: 10,
    tribe: 'エレメンタル',
    text: 'エレメンタルを覚醒させる際、同名カード1枚分として扱える。（「意外精」を除く）',
    awakenedText: 'このカードは覚醒の代用素材として扱われる。',
  };

  const definitions = Array.isArray(moduleDefinition.definitions)
    ? moduleDefinition.definitions
    : (moduleDefinition.definitions = []);

  const existing = definitions.find(card => card?.id === definition.id || card?.name === definition.name);
  if (existing) Object.assign(existing, definition);
  else definitions.push(definition);

  window.__tier6SurpriseElementalDefined = true;

  const num = value => Number(value || 0);
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const say = message => { if (typeof log === 'function' && message) log(message); };
  const pick = pool => pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  const clone = card => typeof initializedClone === 'function'
    ? initializedClone(card)
    : typeof cloneCard === 'function' ? cloneCard(card) : { ...card };
  const eligible = cards => (cards || []).filter(card => card && !card.token && card.shopEligible !== false);

  function addCard(gameState, template, message = '') {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      say('手札がいっぱい。');
      return false;
    }
    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, clone(template), message) !== false;
    }
    gameState.hand.push(clone(template));
    say(message);
    return true;
  }

  function addTime(gameState, seconds) {
    const gain = Math.max(0, num(seconds));
    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof window.pauseAcidTurnTimer === 'function'
      && typeof window.resumeAcidTurnTimer === 'function';
    if (shouldResume) window.pauseAcidTurnTimer();
    gameState.turnTimeRemaining = Math.max(0, num(gameState.turnTimeRemaining)) + gain;
    gameState.turnTimeLimit = Math.max(num(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    if (shouldResume) window.resumeAcidTurnTimer();
    say(`贈り物：残り時間が${gain}秒増えた。`);
  }

  function gainTierSixCards(gameState) {
    const pool = eligible([...(typeof MINIONS !== 'undefined' ? MINIONS : []), ...(typeof SPELLS !== 'undefined' ? SPELLS : [])])
      .filter(card => num(card.tier) === 6);
    for (let index = 0; index < 2; index += 1) {
      if (!addCard(gameState, pick(pool), index === 0 ? '贈り物：ランダムなティア6カードを2枚得た。' : '')) break;
    }
  }

  function discoverTierSixSpell(gameState) {
    const pool = eligible(typeof SPELLS !== 'undefined' ? SPELLS : [])
      .filter(card => num(card.tier) === 6);
    if (!pool.length) {
      say('贈り物：ティア6スペルの候補がない。');
      return;
    }
    if (typeof discoverCardsBeyondTier === 'function') {
      discoverCardsBeyondTier(gameState, pool, 1, '贈り物：ティア6スペルを発見');
      return;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, pool, 1, '贈り物：ティア6スペルを発見');
      return;
    }
    addCard(gameState, pick(pool), '贈り物：ティア6スペルを得た。');
  }

  function awakenRandomBoardCard(gameState) {
    const candidates = (gameState.board || [])
      .filter((card, index) => index >= 2 && card && card.type !== 'spell' && !card.awakened);
    const selected = pick(candidates);
    if (!selected) {
      say('贈り物：覚醒できる自陣のカードがない。');
      return;
    }
    selected.awakened = true;
    if (selected.awakenedText) selected.text = selected.awakenedText;
    say(`贈り物：${selected.name}を覚醒させた。`);
  }

  function castGift(gameState) {
    const effects = [
      () => addTime(gameState, 60),
      () => {
        gameState.tier1DuneAfterRerollAtk = num(gameState.tier1DuneAfterRerollAtk) + 40;
        gameState.tier1DuneAfterRerollHp = num(gameState.tier1DuneAfterRerollHp) + 40;
        say('贈り物：今後の酒場入替後、右端のミニオンに+40/+40を付与する。');
      },
      () => gainTierSixCards(gameState),
      () => {
        gameState.freeRerolls = num(gameState.freeRerolls) + 10;
        say('贈り物：次の10回のリロールコストが0になった。');
      },
      () => discoverTierSixSpell(gameState),
      () => {
        const before = Math.max(0, num(gameState.score));
        gameState.score = before * 2;
        say(`贈り物：現在のスコアを${before}から${gameState.score}にした。`);
      },
      () => awakenRandomBoardCard(gameState),
    ];
    const effect = pick(effects);
    if (!effect) return false;
    effect();
    return true;
  }

  function correctGiftName() {
    if (typeof TOKEN_CARDS !== 'undefined') {
      TOKEN_CARDS.gift = {
        id:'token_gift',
        name:'贈り物',
        emoji:'🎁',
        tier:6,
        cost:0,
        type:'spell',
        token:true,
        shopEligible:false,
        text:'7種類の効果から1つをランダムに発動する。',
        cast: castGift,
      };
    }

    const tierSixModule = window.AcidCardModules?.get?.('minion', 6) || null;
    if (tierSixModule) {
      const maxwellDefinition = (tierSixModule.definitions || []).find(card => card?.name === 'マクスウェル');
      if (maxwellDefinition) {
        maxwellDefinition.text = 'このカードを売った時、「贈り物」を1枚得る。';
        maxwellDefinition.awakenedText = 'このカードを売った時、「贈り物」を2枚得る。';
      }
      tierSixModule.effects = tierSixModule.effects || {};
      tierSixModule.effects['マクスウェル'] = () => ({
        onSell(gameState) {
          if (typeof gainToken === 'function') gainToken(gameState, 'gift', this.awakened ? 2 : 1);
        },
      });
    }

    const maxwell = (typeof MINIONS !== 'undefined' ? MINIONS : [])
      .find(card => card?.name === 'マクスウェル' && num(card.tier) === 6);
    if (maxwell) {
      maxwell.text = 'このカードを売った時、「贈り物」を1枚得る。';
      maxwell.awakenedText = 'このカードを売った時、「贈り物」を2枚得る。';
      maxwell.onSell = function(gameState) {
        if (typeof gainToken === 'function') gainToken(gameState, 'gift', this.awakened ? 2 : 1);
      };
    }

    if (typeof state !== 'undefined' && state) {
      [state.hand, state.shop, state.board].forEach(cards => {
        if (!Array.isArray(cards)) return;
        cards.forEach(card => {
          if (card?.name === 'お贈り物' || card?.id === 'token_gift') {
            card.name = '贈り物';
            card.text = '7種類の効果から1つをランダムに発動する。';
            card.cast = castGift;
          }
        });
      });
    }
  }

  correctGiftName();
  window.addEventListener('acid-card-modules-ready', () => window.setTimeout(correctGiftName, 0));
  window.addEventListener('load', () => window.setTimeout(correctGiftName, 0), { once:true });

  if (window.AcidCardModules?.installed) {
    window.AcidCardModules.reinstall();
  }
})();