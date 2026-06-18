/* Tier 2 spell effects and tier-specific lifecycle hooks. */
(() => {
  const modules = window.AcidCardModules;
  const num = value => Number(value || 0);

  function say(message) {
    if (typeof log === 'function' && message) log(message);
  }

  function activateBrannSpell(gameState) {
    gameState.brannSpellActive = true;
    if (typeof updateAuras === 'function') updateAuras();
    say('このターン中、雄叫びが2回発動する。');
  }

  function activateWarDrum(gameState) {
    gameState.nextBattlecryMultiplier = num(gameState.nextBattlecryMultiplier) + 2;
    say('次に使う雄叫びが追加で2回発動する。');
  }

  function castHeadhunter(gameState) {
    const pool = MINIONS.filter(card => typeof card.battlecry === 'function');
    discoverCards(gameState, pool, 1, 'ヘッドハンター：雄叫びミニオンを発見');
  }

  function castScroll(gameState) {
    const tier = Math.max(1, num(gameState.tavernTier));
    discoverCards(
      gameState,
      MINIONS.filter(card => num(card.tier) === tier),
      1,
      `スクロール：Tier${tier}ミニオンを発見`,
    );
    discoverCards(
      gameState,
      SPELLS.filter(card => num(card.tier) === tier && card.id !== 'scroll'),
      1,
      `スクロール：Tier${tier}スペルを発見`,
    );
  }

  function castDreamEssence(gameState) {
    selectBoardCard(
      gameState,
      card => typeof card.battlecry === 'function',
      card => card.battlecry(gameState),
      '夢のエッセンス：雄叫びを発動するミニオンを選択',
    );
  }

  function castChipBin(gameState) {
    if (typeof window.increaseStartingGold === 'function') {
      window.increaseStartingGold(gameState, 2, true);
    } else {
      gameState.startingGoldBonus = num(gameState.startingGoldBonus) + 2;
      gameState.maxGold = num(gameState.maxGold) + 2;
      gameState.gold = num(gameState.gold) + 2;
    }
    say(`2コインを得た。このゲーム中の初期ゴールドが${gameState.maxGold}になった。`);
  }

  function activateDrakkari(gameState) {
    gameState.drakkariActive = true;
    say('このターン、ターン終了時効果が2回発動する。');
  }

  modules.register({
    kind: 'spell',
    tier: 2,
    label: 'ティア2・スペル',
    effects: {
      'ブランスペル': () => ({
        cast(gameState) {
          activateBrannSpell(gameState);
        },
      }),

      '陣太鼓': () => ({
        cast(gameState) {
          activateWarDrum(gameState);
        },
      }),

      'ヘッドハンター': () => ({
        cast(gameState) {
          castHeadhunter(gameState);
        },
      }),

      'スクロール': () => ({
        cast(gameState) {
          castScroll(gameState);
        },
      }),

      '夢のエッセンス': () => ({
        cast(gameState) {
          castDreamEssence(gameState);
        },
      }),

      'チップビン': () => ({
        text: '2コインを得る。このゲーム中、初期ゴールドを2増やす。',
        cast(gameState) {
          castChipBin(gameState);
        },
      }),

      'ドラッカリ': () => ({
        cast(gameState) {
          activateDrakkari(gameState);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.startingGoldBonus = num(state.startingGoldBonus);
        state.brannSpellActive = Boolean(state.brannSpellActive);
        state.drakkariActive = Boolean(state.drakkariActive);
      }

      if (!window.__tier2SpellInitialStatePatched && typeof initialState === 'function') {
        window.__tier2SpellInitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.startingGoldBonus = 0;
          state.brannSpellActive = false;
          state.drakkariActive = false;
          return result;
        };
      }

      if (!window.__tier2SpellAuraPatched && typeof updateAuras === 'function') {
        window.__tier2SpellAuraPatched = true;
        const previousUpdateAuras = updateAuras;
        updateAuras = function() {
          const result = previousUpdateAuras();
          if (state.brannSpellActive) {
            state.battlecryMultiplier = Math.max(2, num(state.battlecryMultiplier) || 1);
          }
          return result;
        };
      }

      if (typeof updateAuras === 'function') updateAuras();
      window.__tier2SpellEffectsImplemented = [
        'ブランスペル',
        '陣太鼓',
        'ヘッドハンター',
        'スクロール',
        '夢のエッセンス',
        'チップビン',
        'ドラッカリ',
      ];
    },
  });
})();
