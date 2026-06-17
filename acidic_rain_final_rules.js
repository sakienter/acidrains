/* Final authoritative rules: tier-capped generation, freeze, end-turn compatibility, centered shop, and tribe visuals. */
window.addEventListener('load', () => {
  const TRIBES = ['エレメンタル','獣','ナーガ','ドラゴン','マーロック','海賊','悪魔','アンデッド','メカ','キルボア','なし'];

  function currentTier(gameState = state) {
    return Math.max(1, Number(gameState?.tavernTier || 1));
  }

  function capPoolToTier(gameState, pool) {
    if (gameState?.allowBeyondTierGeneration) return Array.isArray(pool) ? pool : [];
    const tier = currentTier(gameState);
    return (Array.isArray(pool) ? pool : []).filter(card => Number(card?.tier || 0) <= tier);
  }

  /* Explicit helper for effects whose text specifically allows a higher tier. */
  window.withBeyondTierGeneration = function(gameState, callback) {
    const previous = Boolean(gameState.allowBeyondTierGeneration);
    gameState.allowBeyondTierGeneration = true;
    try { return callback(); }
    finally { gameState.allowBeyondTierGeneration = previous; }
  };

  if (typeof discoverCards === 'function') {
    const baseDiscoverCards = discoverCards;
    discoverCards = function(gameState, pool, count, title) {
      return baseDiscoverCards(gameState, capPoolToTier(gameState, pool), count, title);
    };
  }

  if (typeof gainMany === 'function') {
    const baseGainMany = gainMany;
    gainMany = function(gameState, pool, count, message) {
      return baseGainMany(gameState, capPoolToTier(gameState, pool), count, message);
    };
  }

  if (typeof gainRandomSpellToHand === 'function') {
    const baseRandomSpell = gainRandomSpellToHand;
    gainRandomSpellToHand = function(gameState, predicate = () => true, message) {
      const tier = currentTier(gameState);
      return baseRandomSpell(gameState, card => {
        const permitted = gameState?.allowBeyondTierGeneration || Number(card?.tier || 0) <= tier;
        return permitted && predicate(card);
      }, message);
    };
  }

  if (typeof gainRandomCardToHand === 'function') {
    const baseRandomCard = gainRandomCardToHand;
    gainRandomCardToHand = function(gameState, predicate = () => true, message) {
      const tier = currentTier(gameState);
      return baseRandomCard(gameState, card => {
        const permitted = gameState?.allowBeyondTierGeneration || Number(card?.tier || 0) <= tier;
        return permitted && predicate(card);
      }, message);
    };
  }

  /* Normalize alternative turn-end method names used by imported cards. */
  function normalizeTurnEndHooks() {
    if (typeof MINIONS === 'undefined') return;
    MINIONS.forEach(card => {
      if (!card) return;
      if (!card.onTurnEnd && typeof card.turnEnd === 'function') card.onTurnEnd = card.turnEnd;
      if (!card.onTurnEnd && typeof card.endTurnEffect === 'function') card.onTurnEnd = card.endTurnEffect;
      if (!card.onTurnEnd && typeof card.atTurnEnd === 'function') card.onTurnEnd = card.atTurnEnd;
    });
  }
  normalizeTurnEndHooks();

  /* Freeze button. A frozen shop survives exactly into the next turn without a reroll. */
  let freezeBtn = document.querySelector('#freezeBtn');
  if (!freezeBtn) {
    freezeBtn = document.createElement('button');
    freezeBtn.id = 'freezeBtn';
    freezeBtn.className = 'reroll-chip';
    const actions = document.querySelector('.board-actions');
    if (actions) actions.insertBefore(freezeBtn, endTurnBtn || null);
  }

  function updateFreezeButton() {
    if (!freezeBtn) return;
    freezeBtn.textContent = state.frozen ? 'フリーズ解除' : 'フリーズ';
    freezeBtn.classList.toggle('active-freeze', Boolean(state.frozen));
    freezeBtn.disabled = Boolean(state.gameOver);
  }

  freezeBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    state.frozen = !state.frozen;
    (state.shop || []).forEach(card => { if (card) card.frozen = state.frozen; });
    log(state.frozen ? '酒場をフリーズした。次のターン開始時に入れ替わらない。' : '酒場のフリーズを解除した。');
    updateFreezeButton();
    render();
  }, true);

  /* Skip only the automatic turn-start shop draw when frozen. */
  if (typeof drawShop === 'function') {
    const baseDrawShop = drawShop;
    drawShop = function() {
      if (state.skipTurnStartShopDraw) {
        state.skipTurnStartShopDraw = false;
        (state.shop || []).forEach(card => { if (card) card.frozen = false; });
        return state.shop;
      }
      return baseDrawShop();
    };
  }

  if (typeof endTurn === 'function') {
    const baseEndTurn = endTurn;
    endTurn = function() {
      if (state.gameOver) return false;
      const preserveShop = Boolean(state.frozen);
      if (preserveShop) state.skipTurnStartShopDraw = true;
      const result = baseEndTurn();
      state.frozen = false;
      updateFreezeButton();
      return result;
    };
  }

  endTurnBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    endTurn();
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    .shop-grid {
      display: flex !important;
      justify-content: center !important;
      align-items: stretch !important;
      flex-wrap: nowrap !important;
      gap: 10px !important;
      width: 100% !important;
    }

    .shop-grid .shop-card {
      flex: 0 0 146px !important;
      width: 146px !important;
      max-width: 146px !important;
    }

    .shop-card[data-tribe="エレメンタル"], .board-card[data-tribe="エレメンタル"], .hand-card[data-tribe="エレメンタル"] { --tribe-accent:#58cfe8; --tribe-dark:#153b4d; }
    .shop-card[data-tribe="獣"], .board-card[data-tribe="獣"], .hand-card[data-tribe="獣"] { --tribe-accent:#8bd36c; --tribe-dark:#263f1f; }
    .shop-card[data-tribe="ナーガ"], .board-card[data-tribe="ナーガ"], .hand-card[data-tribe="ナーガ"] { --tribe-accent:#8f7de8; --tribe-dark:#2b2451; }
    .shop-card[data-tribe="ドラゴン"], .board-card[data-tribe="ドラゴン"], .hand-card[data-tribe="ドラゴン"] { --tribe-accent:#e46d62; --tribe-dark:#4b2020; }
    .shop-card[data-tribe="マーロック"], .board-card[data-tribe="マーロック"], .hand-card[data-tribe="マーロック"] { --tribe-accent:#63d9c0; --tribe-dark:#17483f; }
    .shop-card[data-tribe="海賊"], .board-card[data-tribe="海賊"], .hand-card[data-tribe="海賊"] { --tribe-accent:#d59a58; --tribe-dark:#4b2f18; }
    .shop-card[data-tribe="悪魔"], .board-card[data-tribe="悪魔"], .hand-card[data-tribe="悪魔"] { --tribe-accent:#d65b9d; --tribe-dark:#4a1936; }
    .shop-card[data-tribe="アンデッド"], .board-card[data-tribe="アンデッド"], .hand-card[data-tribe="アンデッド"] { --tribe-accent:#9a86b9; --tribe-dark:#302640; }
    .shop-card[data-tribe="メカ"], .board-card[data-tribe="メカ"], .hand-card[data-tribe="メカ"] { --tribe-accent:#aab9c8; --tribe-dark:#303a43; }
    .shop-card[data-tribe="キルボア"], .board-card[data-tribe="キルボア"], .hand-card[data-tribe="キルボア"] { --tribe-accent:#d58b72; --tribe-dark:#4d2b22; }
    .shop-card[data-tribe="なし"], .board-card[data-tribe="なし"], .hand-card[data-tribe="なし"] { --tribe-accent:#d8c28f; --tribe-dark:#40351f; }

    .shop-card:not(.spell)[data-tribe], .board-card[data-tribe], .hand-card:not(.spell)[data-tribe] {
      border: 2px solid var(--tribe-accent) !important;
      background:
        radial-gradient(circle at 50% 24%, color-mix(in srgb, var(--tribe-accent) 75%, white), var(--tribe-dark) 54%, #111827 82%) !important;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--tribe-accent) 30%, transparent), 0 12px 24px rgba(0,0,0,.35) !important;
    }

    .shop-card.spell, .hand-card.spell {
      --tribe-accent:#d38fe5;
      border: 2px solid #d38fe5 !important;
    }

    .card-tier {
      font-size: .78rem !important;
      font-weight: 900 !important;
      padding: 5px 10px !important;
      min-width: 62px !important;
      text-align: center !important;
    }

    .tagline {
      font-size: .69rem !important;
      font-weight: 800 !important;
      color: #f4e6bf !important;
    }

    .card-text {
      font-size: .68rem !important;
      line-height: 1.3 !important;
      font-weight: 650 !important;
      min-height: 42px !important;
    }

    .card-name {
      font-size: .9rem !important;
      font-weight: 900 !important;
      text-shadow: 0 2px 3px rgba(0,0,0,.75) !important;
    }

    .stats {
      font-size: 1.28rem !important;
      font-weight: 1000 !important;
      padding: 2px 8px 0 !important;
      text-shadow: 0 2px 3px rgba(0,0,0,.75) !important;
    }

    .stats .atk, .stats .hp {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 30px !important;
      height: 30px !important;
      border-radius: 50% !important;
      background: rgba(12,18,27,.76) !important;
      border: 2px solid currentColor !important;
    }

    #freezeBtn.active-freeze {
      background: linear-gradient(180deg,#73c7e8,#315f80) !important;
      color: white !important;
      box-shadow: 0 0 0 2px rgba(137,219,255,.35), 0 0 18px rgba(100,205,255,.35) !important;
    }
  `;
  document.head.appendChild(style);

  function decorateRenderedCards() {
    const decorate = (nodes, cards) => {
      [...nodes].forEach((node, index) => {
        const card = cards[index];
        if (!node || !card) return;
        const tribe = TRIBES.includes(card.tribe) ? card.tribe : 'なし';
        node.dataset.tribe = tribe;
      });
    };
    decorate(document.querySelectorAll('#shopGrid .shop-card'), state.shop || []);
    const boardCards = (state.board || []).slice(2).filter(Boolean);
    decorate(document.querySelectorAll('#boardSlots .board-card:not(.empty)'), boardCards);
    decorate(document.querySelectorAll('#handGrid .hand-card:not(.empty)'), state.hand || []);
    updateFreezeButton();
  }

  if (typeof render === 'function') {
    const baseRender = render;
    render = function() {
      const result = baseRender();
      decorateRenderedCards();
      return result;
    };
  }

  decorateRenderedCards();
  render();
}, { once: true });
