/* Requested balance changes for four authoritative minions. */
(() => {
  if (window.__acidRequestedCardChangesApplied) return;
  window.__acidRequestedCardChangesApplied = true;

  const num = value => Number(value || 0);
  const amount = (card, normal, awakened) => card?.awakened ? awakened : normal;
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const writeLog = message => { if (typeof log === 'function' && message) log(message); };

  const CHANGES = Object.freeze({
    '時渡りの預言者': {
      tier: 6,
      definition: {
        atk: 8,
        hp: 8,
        tribe: 'ナーガ',
        text: '雄叫び：次に買う呪文のコストを0にする。',
        awakenedText: '雄叫び：次に買う呪文のコストを0にする。2回',
      },
      effect: () => ({
        aura: undefined,
        battlecry(gameState) {
          const count = amount(this, 1, 2);
          gameState.nextFreeSpellPurchases = Math.max(0, num(gameState.nextFreeSpellPurchases)) + count;
          writeLog(`時渡りの預言者：次に買う呪文${count}枚のコストが0になった。`);
        },
      }),
    },
    'エリーズ': {
      tier: 4,
      definition: {
        atk: 5,
        hp: 5,
        tribe: 'なし',
        text: 'このカードが自陣にいる限り、自分が10回のリロールをすると、酒場のミニオン1体ランダムに覚醒させる。',
        awakenedText: 'このカードが自陣にいる限り、自分が10回のリロールをすると、酒場のミニオン2体ランダムに覚醒させる。',
      },
      effect: () => ({
        init(card) {
          card.rerollProgress = Math.max(0, num(card.rerollProgress));
        },
        onRerollCount(gameState) {
          this.rerollProgress = Math.max(0, num(this.rerollProgress)) + 1;
          while (this.rerollProgress >= 10) {
            this.rerollProgress -= 10;
            awakenRandomShopMinions(gameState, amount(this, 1, 2));
          }
        },
      }),
    },
    '魔術をつかうトーレン': {
      tier: 4,
      definition: {
        atk: 4,
        hp: 4,
        tribe: 'なし',
        text: '1ターンに1度、ティア3以下のスペル1枚が追加でもう1回発動する。',
        awakenedText: '1ターンに2度、ティア3以下のスペル1枚が追加でもう1回発動する。',
      },
      effect: () => ({
        init(card) {
          card.turnTriggers = Math.max(0, num(card.turnTriggers));
        },
      }),
    },
    '聖遺会の従者': {
      tier: 3,
      definition: {
        atk: 7,
        hp: 4,
        tribe: 'エレメンタル',
        text: '1ターンに1度、自分がティア5以下の呪文を使用した後、その呪文のコピーを1枚得る。',
        awakenedText: '1ターンに1度、自分がティア5以下の呪文を使用した後、その呪文のコピーを2枚得る。',
      },
      effect: () => ({
        init(card) {
          card.turnTriggers = Math.max(0, num(card.turnTriggers));
        },
        onSpellCast(gameState, spell) {
          if (!spell || num(spell.tier) > 5 || num(this.turnTriggers) >= 1) return;
          this.turnTriggers = 1;
          gainSpellCopies(gameState, spell, amount(this, 1, 2));
        },
      }),
    },
  });

  function cloneCardSafe(card) {
    if (typeof initializedClone === 'function') return initializedClone(card);
    if (typeof cloneCard === 'function') return cloneCard(card);
    return { ...card };
  }

  function gainSpellCopies(gameState, spell, count) {
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
        writeLog('手札がいっぱい。');
        break;
      }
      const copy = cloneCardSafe(spell);
      const message = index === 0 ? `${spell.name} のコピーを${count}枚得た。` : '';
      const success = typeof gainCardToHand === 'function'
        ? gainCardToHand(gameState, copy, message) !== false
        : (gameState.hand.push(copy), writeLog(message), true);
      if (!success) break;
      gained += 1;
    }
    return gained;
  }

  function awakenRandomShopMinions(gameState, count) {
    const candidates = (gameState.shop || []).filter(card =>
      card && card.type !== 'spell' && !card.awakened
    );
    let awakened = 0;
    while (candidates.length && awakened < count) {
      const index = Math.floor(Math.random() * candidates.length);
      const target = candidates.splice(index, 1)[0];
      target.awakened = true;
      if (target.awakenedText) target.text = target.awakenedText;
      awakened += 1;
      writeLog(`エリーズ：${target.name}をランダムに覚醒させた。`);
    }
    if (!awakened) writeLog('エリーズ：酒場に覚醒できるミニオンがいない。');
    return awakened;
  }

  function patchModule(changeName, change) {
    const moduleDefinition = window.AcidCardModules?.get?.('minion', change.tier);
    if (!moduleDefinition) return;
    const definition = (moduleDefinition.definitions || []).find(card => card?.name === changeName);
    if (definition) Object.assign(definition, change.definition);
    moduleDefinition.effects = moduleDefinition.effects || {};
    moduleDefinition.effects[changeName] = change.effect;
  }

  function patchCard(card, name, change, preserveStats) {
    if (!card || card.name !== name) return;
    const patch = preserveStats
      ? {
          tribe: change.definition.tribe,
          text: card.awakened ? change.definition.awakenedText : change.definition.text,
          awakenedText: change.definition.awakenedText,
        }
      : { ...change.definition };
    Object.assign(card, patch, change.effect());
  }

  Object.entries(CHANGES).forEach(([name, change]) => patchModule(name, change));
  if (window.AcidCardModules?.installed) window.AcidCardModules.reinstall();

  Object.entries(CHANGES).forEach(([name, change]) => {
    (typeof MINIONS !== 'undefined' ? MINIONS : []).forEach(card => patchCard(card, name, change, false));
    (state.hand || []).forEach(card => patchCard(card, name, change, true));
    (state.board || []).forEach(card => patchCard(card, name, change, true));
    (state.shop || []).forEach(card => patchCard(card, name, change, true));
  });

  if (typeof buyCard === 'function' && !window.__acidFreeSpellPurchasePatched) {
    window.__acidFreeSpellPurchasePatched = true;
    const previousBuyCard = buyCard;
    buyCard = function(index) {
      const spell = state.shop?.[index] || null;
      const free = Boolean(
        spell?.type === 'spell' && Math.max(0, num(state.nextFreeSpellPurchases)) > 0
      );
      if (!free) return previousBuyCard(index);

      const originalCost = num(spell.cost);
      const handLength = Array.isArray(state.hand) ? state.hand.length : 0;
      spell.cost = 0;
      try {
        const result = previousBuyCard(index);
        if (result) {
          state.nextFreeSpellPurchases = Math.max(0, num(state.nextFreeSpellPurchases) - 1);
          const purchased = state.hand?.[handLength];
          if (purchased?.type === 'spell') purchased.cost = originalCost;
          writeLog(`${spell.name}を0コストで購入した。`);
        }
        return result;
      } finally {
        if (state.shop?.[index] === spell) spell.cost = originalCost;
      }
    };
  }

  if (typeof renderShop === 'function' && !window.__acidFreeSpellRenderPatched) {
    window.__acidFreeSpellRenderPatched = true;
    const previousRenderShop = renderShop;
    renderShop = function() {
      const free = Math.max(0, num(state.nextFreeSpellPurchases)) > 0;
      if (!free) return previousRenderShop();
      const originals = (state.shop || []).map(card => card?.type === 'spell' ? num(card.cost) : null);
      (state.shop || []).forEach(card => { if (card?.type === 'spell') card.cost = 0; });
      try {
        return previousRenderShop();
      } finally {
        (state.shop || []).forEach((card, index) => {
          if (card?.type === 'spell' && originals[index] !== null) card.cost = originals[index];
        });
      }
    };
  }

  /* The legacy Tier 4 wrapper repeats every spell. Temporarily exhaust Tauren
     triggers while a Tier 4+ spell is being played so only Tier 3 or lower can
     activate the effect. */
  if (typeof playHandCardToSlot === 'function' && !window.__acidTaurenTierRestrictionPatched) {
    window.__acidTaurenTierRestrictionPatched = true;
    const previousPlayHandCardToSlot = playHandCardToSlot;
    playHandCardToSlot = function(index, targetIndex) {
      const spell = state.hand?.[index] || null;
      if (spell?.type !== 'spell' || num(spell.tier) <= 3) {
        return previousPlayHandCardToSlot(index, targetIndex);
      }

      const taurens = (state.board || []).filter((card, boardIndex) =>
        boardIndex >= 2 && card?.name === '魔術をつかうトーレン'
      );
      const saved = taurens.map(card => ({
        card,
        turnTriggers: num(card.turnTriggers),
      }));
      taurens.forEach(card => {
        card.turnTriggers = amount(card, 1, 2);
      });
      try {
        return previousPlayHandCardToSlot(index, targetIndex);
      } finally {
        saved.forEach(entry => {
          entry.card.turnTriggers = entry.turnTriggers;
        });
      }
    };
  }

  state.nextFreeSpellPurchases = Math.max(0, num(state.nextFreeSpellPurchases));
  if (typeof updateAuras === 'function') updateAuras();
  if (typeof render === 'function') render();
})();
