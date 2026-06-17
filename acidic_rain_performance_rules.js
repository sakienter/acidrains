/* Performance optimizations for board-card drag and reordering. */
window.addEventListener("load", () => {
  let lastReorderTarget = null;
  let pendingPointerFrame = 0;
  let latestPointerEvent = null;

  // Reordering does not change any aura membership, card ownership, stats,
  // counters, hand, or shop state. Re-render only the board instead of the
  // entire game UI and avoid running awakening resolution on every swap.
  moveBoardCard = function(fromIndex, toIndex) {
    if (fromIndex < 2 || toIndex < 2 || fromIndex === toIndex) return false;
    const moving = state.board[fromIndex];
    if (!moving || state.gameOver) return false;

    const target = state.board[toIndex];
    state.board[toIndex] = moving;
    state.board[fromIndex] = target;

    state.statusMessage = `${moving.emoji} ${moving.name} を並べ替えた。`;
    boardStatusEl.textContent = state.statusMessage;
    renderBoard();
    return true;
  };

  function clearLastReorderTarget() {
    if (lastReorderTarget) {
      lastReorderTarget.classList.remove("reorder-target");
      lastReorderTarget = null;
    }
  }

  function processPointerMove(event) {
    pendingPointerFrame = 0;
    if (!state.dragging) return;

    const drag = state.dragging;
    drag.lastY = event.clientY;
    drag.lastX = event.clientX;
    drag.clone.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%) scale(1.04)`;
    drag.clone.style.left = "0";
    drag.clone.style.top = "0";

    const tradeLineRect = tradeLineEl.getBoundingClientRect();
    const sellTriggerY = tradeLineRect.top - SELL_TRIGGER_BUFFER;
    const buyTriggerY = tradeLineRect.bottom;
    const activeTradeTarget =
      (drag.sourceKind === "shop" && event.clientY > buyTriggerY) ||
      (drag.sourceKind === "board" && event.clientY < sellTriggerY);
    tradeLineEl.classList.toggle("drop-target", activeTradeTarget);

    drag.boardTargetIndex = null;
    if (drag.sourceKind !== "board" || event.clientY < sellTriggerY) {
      clearLastReorderTarget();
      return;
    }

    const hovered = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-board-slot]");
    const targetIndex = hovered ? Number(hovered.dataset.boardSlot) : -1;

    if (targetIndex >= 2 && targetIndex !== drag.index) {
      drag.boardTargetIndex = targetIndex;
      if (lastReorderTarget !== hovered) {
        clearLastReorderTarget();
        hovered.classList.add("reorder-target");
        lastReorderTarget = hovered;
      }
    } else {
      clearLastReorderTarget();
    }
  }

  // Limit drag hit-testing and DOM writes to at most once per animation frame.
  onThresholdDragMove = function(event) {
    if (!state.dragging) return;
    latestPointerEvent = event;
    if (pendingPointerFrame) return;
    pendingPointerFrame = requestAnimationFrame(() => processPointerMove(latestPointerEvent));
  };

  const originalDragEnd = onThresholdDragEnd;
  onThresholdDragEnd = function() {
    if (pendingPointerFrame) {
      cancelAnimationFrame(pendingPointerFrame);
      pendingPointerFrame = 0;
    }
    clearLastReorderTarget();
    return originalDragEnd();
  };

  const performanceStyle = document.createElement("style");
  performanceStyle.textContent = `
    .dragging-card {
      will-change: transform;
      contain: layout paint style;
    }

    .board-card {
      contain: layout paint style;
    }
  `;
  document.head.appendChild(performanceStyle);
}, { once: true });
