/*
 * Shared bridge between the authoritative game actions and card event hooks.
 * Individual card effects stay in the tier-specific card modules.
 */
window.addEventListener('load', () => {
  if (window.__acidCardEventBridgeInstalled) return;
  window.__acidCardEventBridgeInstalled = true;

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const canPlay = card => {
    if (!card) return false;
    if (typeof window.canPlayAcidCard === 'function') {
      return window.canPlayAcidCard(card, state);
    }
    return num(card.unlockTier) <= num(state.tavernTier, 1);
  };

  const explainLock = card => {
    if (typeof window.describeAcidCardLock === 'function') {
      return window.describeAcidCardLock(card, state);
    }
    return `${card.name} は酒場グレード${num(card.unlockTier)}まで使用できない。`;
  };

  if (typeof buyCard === 'function') {
    const inheritedBuyCard = buyCard;
    buyCard = function(index) {
      const card = state.shop?.[index] || null;
      const beforeGold = num(state.gold);
      const result = inheritedBuyCard(index);
      if (result === false) return result;

      const spent = Math.max(0, beforeGold - num(state.gold));
      if (typeof notifyGoldSpent === 'function') notifyGoldSpent(spent);
      if (card?.type === 'spell' && typeof notifyBoard === 'function') {
        notifyBoard('onSpellBought', state, card);
      }
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };
  }

  if (typeof upgradeTavern === 'function') {
    const inheritedUpgradeTavern = upgradeTavern;
    upgradeTavern = function() {
      const beforeTier = num(state.tavernTier, 1);
      const result = inheritedUpgradeTavern();
      if (num(state.tavernTier, 1) > beforeTier && typeof window.refreshAcidCardUnlocks === 'function') {
        window.refreshAcidCardUnlocks(state);
        if (typeof render === 'function') render();
      }
      return result;
    };
  }

  if (typeof playHandCardToSlot === 'function') {
    const inheritedPlayHandCardToSlot = playHandCardToSlot;
    playHandCardToSlot = function(index, targetIndex) {
      const card = state.hand?.[index] || null;
      if (!card) return false;
      if (!canPlay(card)) {
        if (typeof log === 'function') log(explainLock(card));
        if (typeof render === 'function') render();
        return false;
      }

      const wasSpell = card.type === 'spell';
      const doubleCast = wasSpell && num(state.doubleSpellCharges) > 0;
      const result = inheritedPlayHandCardToSlot(index, targetIndex);
      if (!result) return result;

      if (wasSpell) {
        if (doubleCast && typeof card.cast === 'function') {
          state.doubleSpellCharges = Math.max(0, num(state.doubleSpellCharges) - 1);
          card.cast(state);
        }
        if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', state, card);
      } else {
        const played = state.board?.[targetIndex] || null;
        if (played && typeof played.onPlay === 'function') played.onPlay(state);
        if (played?.tribe === 'エレメンタル' && typeof notifyBoard === 'function') {
          notifyBoard('onElementalPlayed', state, played);
        }
      }

      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };
  }

  if (typeof sellBoardCard === 'function') {
    const inheritedSellBoardCard = sellBoardCard;
    sellBoardCard = function(index) {
      const sold = state.board?.[index] || null;
      if (!sold) return false;
      const triggerMultiplier = Math.max(1, num(state.sellTriggerMultiplier, 1));
      const result = inheritedSellBoardCard(index);

      if (typeof notifyBoard === 'function') {
        for (let repeat = 0; repeat < triggerMultiplier; repeat += 1) {
          notifyBoard('onAnySell', state, sold);
          if (sold.tribe === 'エレメンタル') {
            notifyBoard('onElementalSold', state, sold);
          }
        }
      }
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };
  }

  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const cloneTemplate = card => {
    if (!card) return null;
    if (typeof initializedClone === 'function') return initializedClone(card);
    if (typeof cloneCard === 'function') return cloneCard(card);
    return { ...card };
  };
  const eligible = cards => (cards || []).filter(card => card && !card.token && card.shopEligible !== false);
  const randomCard = cards => cards.length ? cards[Math.floor(Math.random() * cards.length)] : null;

  function addCardToHand(gameState, template, message = '') {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      if (typeof log === 'function') log('手札がいっぱい。');
      return false;
    }
    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, cloneTemplate(template), message) !== false;
    }
    gameState.hand.push(cloneTemplate(template));
    if (message && typeof log === 'function') log(message);
    return true;
  }

  function doubleCurrentScore(gameState, sourceName) {
    const before = Math.max(0, num(gameState.score));
    gameState.score = before * 2;
    if (typeof log === 'function') log(`${sourceName}：現在のスコアを${before}から${gameState.score}にした。`);
    return gameState.score;
  }

  function destroyHeatPunchTarget(gameState) {
    let selected = null;
    const predicate = card => card && card.type !== 'spell'
      && (card.tribe === '海賊' || card.name === '冷笑フィン');

    const destroy = (card, boardIndex) => {
      selected = card;
      if (typeof card.deathrattle === 'function') {
        const triggerCount = card.reborn ? 2 : 1;
        for (let repeat = 0; repeat < triggerCount; repeat += 1) {
          card.deathrattle(gameState, boardIndex);
        }
      }
      if (typeof card.onDestroyed === 'function') card.onDestroyed(gameState, boardIndex);
      gameState.board[boardIndex] = null;
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof log === 'function') log(`熱血パンチ：${card.name}を破壊した。`);
    };

    if (typeof selectBoardCard === 'function') {
      selectBoardCard(gameState, predicate, destroy, '熱血パンチ：破壊する海賊または冷笑フィンを選択');
    } else {
      const boardIndex = (gameState.board || []).findIndex((card, index) => index >= 2 && predicate(card));
      if (boardIndex >= 2) destroy(gameState.board[boardIndex], boardIndex);
    }

    if (!selected && typeof log === 'function') {
      log('熱血パンチ：破壊できる海賊または冷笑フィンがいない。');
    }
    return selected;
  }

  function addTurnTime(gameState, seconds) {
    const gain = Math.max(0, num(seconds));
    if (!gain) return 0;
    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof window.pauseAcidTurnTimer === 'function'
      && typeof window.resumeAcidTurnTimer === 'function';
    if (shouldResume) window.pauseAcidTurnTimer();
    gameState.turnTimeRemaining = Math.max(0, num(gameState.turnTimeRemaining)) + gain;
    gameState.turnTimeLimit = Math.max(num(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    if (shouldResume) window.resumeAcidTurnTimer();
    if (typeof log === 'function') log(`お贈り物：残り時間が${gain}秒増えた。`);
    return gain;
  }

  function addPermanentRightmostBuff(gameState, atk, hp) {
    gameState.tier1DuneAfterRerollAtk = num(gameState.tier1DuneAfterRerollAtk) + Math.max(0, num(atk));
    gameState.tier1DuneAfterRerollHp = num(gameState.tier1DuneAfterRerollHp) + Math.max(0, num(hp));
    if (typeof log === 'function') log('お贈り物：今後の酒場入替後、右端のミニオンに+40/+40を付与する。');
  }

  function gainRandomTierSixCards(gameState) {
    const pool = eligible([...(typeof MINIONS !== 'undefined' ? MINIONS : []), ...(typeof SPELLS !== 'undefined' ? SPELLS : [])])
      .filter(card => num(card.tier) === 6);
    let gained = 0;
    for (let index = 0; index < 2; index += 1) {
      if (!addCardToHand(gameState, randomCard(pool), index === 0 ? 'お贈り物：ランダムなティア6カードを2枚得た。' : '')) break;
      gained += 1;
    }
    return gained;
  }

  function discoverTierSixSpell(gameState) {
    const pool = eligible(typeof SPELLS !== 'undefined' ? SPELLS : []).filter(card => num(card.tier) === 6);
    if (!pool.length) {
      if (typeof log === 'function') log('お贈り物：ティア6スペルの候補がない。');
      return false;
    }
    if (typeof discoverCardsBeyondTier === 'function') {
      discoverCardsBeyondTier(gameState, pool, 1, 'お贈り物：ティア6スペルを発見');
      return true;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, pool, 1, 'お贈り物：ティア6スペルを発見');
      return true;
    }
    return addCardToHand(gameState, randomCard(pool), 'お贈り物：ティア6スペルを得た。');
  }

  function awakenRandomBoardCard(gameState) {
    const candidates = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && entry.card && entry.card.type !== 'spell' && !entry.card.awakened);
    const selected = randomCard(candidates);
    if (!selected) {
      if (typeof log === 'function') log('お贈り物：覚醒できる自陣のカードがない。');
      return false;
    }
    selected.card.awakened = true;
    if (selected.card.awakenedText) selected.card.text = selected.card.awakenedText;
    if (typeof log === 'function') log(`お贈り物：${selected.card.name}を覚醒させた。`);
    return true;
  }

  const giftEffects = [
    gameState => addTurnTime(gameState, 60),
    gameState => addPermanentRightmostBuff(gameState, 40, 40),
    gameState => gainRandomTierSixCards(gameState),
    gameState => {
      gameState.freeRerolls = num(gameState.freeRerolls) + 10;
      if (typeof log === 'function') log('お贈り物：次の10回のリロールコストが0になった。');
    },
    gameState => discoverTierSixSpell(gameState),
    gameState => doubleCurrentScore(gameState, 'お贈り物'),
    gameState => awakenRandomBoardCard(gameState),
  ];

  TOKEN_CARDS.heat_punch = {
    id:'token_heat_punch',
    name:'熱血パンチ',
    emoji:'👊',
    tier:6,
    cost:0,
    type:'spell',
    token:true,
    shopEligible:false,
    text:'自陣の海賊、または「冷笑フィン」を破壊する。現在のスコアを2倍にする。',
    cast(gameState) {
      const destroyed = destroyHeatPunchTarget(gameState);
      if (destroyed) doubleCurrentScore(gameState, '熱血パンチ');
      return Boolean(destroyed);
    },
  };

  TOKEN_CARDS.gift = {
    id:'token_gift',
    name:'お贈り物',
    emoji:'🎁',
    tier:6,
    cost:0,
    type:'spell',
    token:true,
    shopEligible:false,
    text:'7種類の効果から1つをランダムに発動する。',
    cast(gameState) {
      const effect = randomCard(giftEffects);
      if (!effect) return false;
      effect(gameState);
      return true;
    },
  };

  function patchTierSixTokenSources() {
    const module = window.AcidCardModules?.get?.('minion', 6) || null;
    if (module) {
      const maxwell = (module.definitions || []).find(card => card.name === 'マクスウェル');
      if (maxwell) {
        maxwell.text = 'このカードを売った時、「お贈り物」を1枚得る。';
        maxwell.awakenedText = 'このカードを売った時、「お贈り物」を2枚得る。';
      }
      const hotblood = (module.definitions || []).find(card => card.name === '熱血フィン');
      if (hotblood) {
        hotblood.text = 'このカードを売った時、「熱血パンチ」を1枚得る。';
        hotblood.awakenedText = 'このカードを売った時、「熱血パンチ」を2枚得る。';
      }
      module.effects['マクスウェル'] = () => ({
        onSell(gameState) {
          if (typeof gainToken === 'function') gainToken(gameState, 'gift', this.awakened ? 2 : 1);
        },
      });
      module.effects['熱血フィン'] = () => ({
        onSell(gameState) {
          if (typeof gainToken === 'function') gainToken(gameState, 'heat_punch', this.awakened ? 2 : 1);
        },
      });
    }

    const maxwellCard = (typeof MINIONS !== 'undefined' ? MINIONS : []).find(card => card.name === 'マクスウェル' && num(card.tier) === 6);
    if (maxwellCard) {
      maxwellCard.text = 'このカードを売った時、「お贈り物」を1枚得る。';
      maxwellCard.awakenedText = 'このカードを売った時、「お贈り物」を2枚得る。';
      maxwellCard.onSell = function(gameState) {
        if (typeof gainToken === 'function') gainToken(gameState, 'gift', this.awakened ? 2 : 1);
      };
    }

    const hotbloodCard = (typeof MINIONS !== 'undefined' ? MINIONS : []).find(card => card.name === '熱血フィン' && num(card.tier) === 6);
    if (hotbloodCard) {
      hotbloodCard.onSell = function(gameState) {
        if (typeof gainToken === 'function') gainToken(gameState, 'heat_punch', this.awakened ? 2 : 1);
      };
    }

    if (window.AcidCardModules?.installed) window.AcidCardModules.reinstall();
  }

  patchTierSixTokenSources();
  window.addEventListener('acid-card-modules-ready', patchTierSixTokenSources, { once:true });
}, { once: true });