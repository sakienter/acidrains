/* Tier 3 spell implementations. */

function activateTemporaryTimeRewrite(gameState) {
  gameState.timeRewriteCharges = (gameState.timeRewriteCharges || 0) + 3;
  log("次に使う3回のスペルが追加で1回発動する。");
}

function chooseTierThreeSpellTarget(entries, title) {
  if (!entries.length) return null;
  const lines = entries.map((entry, index) =>
    `${index + 1}. ${entry.card.emoji || "🃏"} ${entry.card.name}［Tier ${entry.card.tier || "-"}］`
  ).join("\n");
  const answer = window.prompt(`${title}\n${lines}\n番号を入力してください。`, "1");
  return entries[Number(answer) - 1] || entries[0];
}

function castZerek(gameState) {
  if (gameState.hand.length >= HAND_LIMIT) {
    log("手札がいっぱいのため、ゼレクは不発だった。");
    return;
  }

  const entries = gameState.board
    .map((card, index) => ({ card, index }))
    .filter(entry => entry.index >= 1 && entry.card && entry.card.type !== "spell");
  const selected = chooseTierThreeSpellTarget(entries, "ゼレク：コピーする自陣のカードを選択");
  if (!selected) {
    log("コピーできる自陣のカードがないため、ゼレクは不発だった。");
    return;
  }

  const copy = typeof initializedClone === "function"
    ? initializedClone(selected.card)
    : cloneCard(selected.card);
  delete copy.frozen;
  gameState.hand.push(copy);
  log(`${selected.card.name} のコピーを1枚得た。`);
}

function extendTurnLimit(gameState) {
  gameState.maxTurns = Number(gameState.maxTurns || 0) + 1;
  log(`リミットターンが1増え、${gameState.maxTurns}ターンになった。`);
}

function castAwakeningSpell(gameState) {
  const entries = gameState.board
    .map((card, index) => ({ card, index }))
    .filter(entry =>
      entry.index >= 2 &&
      entry.card &&
      entry.card.type !== "spell" &&
      entry.card.tier === 1 &&
      !entry.card.awakened
    );
  const selected = chooseTierThreeSpellTarget(entries, "覚醒化：覚醒させる自陣のTier1カードを選択");
  if (!selected) {
    log("覚醒できる自陣のTier1カードがないため、覚醒化は不発だった。");
    return;
  }

  const target = selected.card;
  target.awakened = true;
  if (target.awakenedText) target.text = target.awakenedText;
  log(`✨ ${target.name} を覚醒させた。`);
}

window.addEventListener("load", () => {
  const oldInitialState = initialState;
  initialState = function() {
    oldInitialState();
    state.timeRewriteCharges = 0;
  };
  if (typeof state.timeRewriteCharges !== "number") state.timeRewriteCharges = 0;

  const oldPlayHandCardToSlot = playHandCardToSlot;
  playHandCardToSlot = function(index, targetIndex) {
    const card = state.hand[index];
    const shouldRepeat = Boolean(
      card &&
      card.type === "spell" &&
      card.id !== "temporary_time_rewrite" &&
      state.timeRewriteCharges > 0
    );

    if (shouldRepeat) state.timeRewriteCharges -= 1;
    const result = oldPlayHandCardToSlot(index, targetIndex);

    if (result && shouldRepeat && typeof card.cast === "function") {
      card.cast(state);
      updateAuras();
      log(`${card.emoji || "✨"} ${card.name} が追加でもう1回発動した。残り${state.timeRewriteCharges}回。`);
      render();
    }
    return result;
  };

  const oldEndTurn = endTurn;
  endTurn = function() {
    const beforeTurn = state.turn;
    const result = oldEndTurn();
    if (state.turn > beforeTurn && state.timeRewriteCharges > 0) {
      state.timeRewriteCharges = 0;
      log("一時的な時間改竄の未使用回数はターン終了時に失われた。");
      render();
    }
    return result;
  };

  render();
}, { once: true });
