/* Discover rule: a card can never Discover another copy of itself. */
window.addEventListener("load", () => {
  function withoutSource(pool, sourceId) {
    return (pool || []).filter(card => card && card.id !== sourceId);
  }

  function discoverExcludingSelf(gameState, pool, count, title, sourceId) {
    return discoverCards(gameState, withoutSource(pool, sourceId), count, title);
  }

  window.discoverExcludingSelf = discoverExcludingSelf;

  const scout = MINIONS.find(card => card.id === "scout");
  if (scout) {
    scout.onSell = function(gameState) {
      discoverExcludingSelf(
        gameState,
        MINIONS.filter(card => card.tribe === "なし"),
        A(this, 1, 2),
        "種族なしカードを発見",
        this.id
      );
    };
  }

  const rodeo = MINIONS.find(card => card.id === "rodeo");
  if (rodeo) {
    rodeo.battlecry = function(gameState) {
      discoverExcludingSelf(
        gameState,
        SPELLS,
        A(this, 1, 2),
        "スペルを発見",
        this.id
      );
    };
  }

  const shoreExplorer = MINIONS.find(card => card.id === "shore_explorer");
  if (shoreExplorer) {
    shoreExplorer.battlecry = function(gameState) {
      const ownedTribes = new Set(
        gameState.board.filter(Boolean).map(card => card.tribe)
      );
      discoverExcludingSelf(
        gameState,
        MINIONS.filter(card => card.tribe !== "なし" && !ownedTribes.has(card.tribe)),
        A(this, 1, 2),
        "自陣にいない種族を発見",
        this.id
      );
    };
  }

  const boatswain = MINIONS.find(card => card.id === "boatswain");
  if (boatswain) {
    boatswain.onSell = function(gameState) {
      discoverExcludingSelf(
        gameState,
        MINIONS.filter(card => card.tier === 1 && card.tribe !== "なし"),
        A(this, 1, 2),
        "Tier1の種族ありカードを発見",
        this.id
      );
    };
  }

  const luckyWind = MINIONS.find(card => card.id === "lucky_wind");
  if (luckyWind) {
    luckyWind.onSell = function(gameState) {
      discoverExcludingSelf(
        gameState,
        MINIONS.filter(card => card.tribe === "エレメンタル"),
        A(this, 1, 2),
        "エレメンタルを発見",
        this.id
      );
    };
  }

  const outlands = MINIONS.find(card => card.id === "outlands");
  if (outlands) {
    outlands.battlecry = function(gameState) {
      const pool = SPELLS.filter(card => card.tier >= 1 && card.tier <= 3);
      if (typeof discoverCardsBeyondTier === "function") {
        discoverCardsBeyondTier(
          gameState,
          withoutSource(pool, this.id),
          A(this, 1, 2),
          "Tier1～3のスペルを発見"
        );
      } else {
        discoverExcludingSelf(
          gameState,
          pool,
          A(this, 1, 2),
          "Tier1～3のスペルを発見",
          this.id
        );
      }
    };
  }

  render();
}, { once: true });
