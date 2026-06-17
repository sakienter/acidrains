/* Tier 2 spell implementations. */

function activateBrannSpell(gameState) {
  gameState.brannSpellActive = true;
  updateAuras();
  log("このターン中、雄叫びが2回発動する。");
}

function activateWarDrum(gameState) {
  gameState.nextBattlecryMultiplier = (gameState.nextBattlecryMultiplier || 0) + 2;
  log("次に使う雄叫びが追加で2回発動する。");
}

function castHeadhunter(gameState) {
  discoverCards(gameState, MINIONS.filter(card => typeof card.battlecry === "function"), 1, "ヘッドハンター：雄叫びミニオンを発見");
}

function castRememberTheBeginning(gameState) {
  const gifts = Array.isArray(window.GIFT_CARDS) ? window.GIFT_CARDS : [];
  if (!gifts.length) {
    log("贈り物カードが設定されていないため、不発だった。");
    return;
  }
  gainCardToHand(gameState, randomFrom(gifts), "「贈り物」カードを1枚得た。");
}

function castScroll(gameState) {
  const tier = Number(gameState.tavernTier || 1);
  discoverCards(gameState, MINIONS.filter(card => Number(card.tier) === tier), 1, `スクロール：Tier${tier}ミニオンを発見`);
  discoverCards(gameState, SPELLS.filter(card => Number(card.tier) === tier && card.id !== "scroll"), 1, `スクロール：Tier${tier}スペルを発見`);
}

function castDreamEssence(gameState) {
  selectBoardCard(gameState, card => typeof card.battlecry === "function", card => card.battlecry(gameState), "夢のエッセンス：雄叫びを発動するミニオンを選択");
}

function castChipBin(gameState) {
  gameState.maxGold = Number(gameState.maxGold || 10) + 2;
  gameState.gold = Math.min(gameState.maxGold, Number(gameState.gold || 0) + 2);
  log(`2コインを得た。上限コインが${gameState.maxGold}になった。`);
}

function activateDrakkari(gameState) {
  gameState.drakkariActive = true;
  log("このターン、ターン終了時効果が2回発動する。");
}

window.addEventListener("load", () => {
  const oldInitialState = initialState;
  initialState = function() {
    oldInitialState();
    state.maxGold = 10;
    state.brannSpellActive = false;
    state.drakkariActive = false;
  };

  const oldUpdateAuras = updateAuras;
  updateAuras = function() {
    oldUpdateAuras();
    if (state.brannSpellActive) state.battlecryMultiplier = Math.max(2, Number(state.battlecryMultiplier || 1));
  };

  if (typeof state.maxGold !== "number") state.maxGold = 10;
  if (typeof state.brannSpellActive !== "boolean") state.brannSpellActive = false;
  if (typeof state.drakkariActive !== "boolean") state.drakkariActive = false;

  updateAuras();
  render();
}, { once: true });
