/* Dynamic hand and board layouts without visible empty-slot grids. */
window.addEventListener("load", () => {
  const style = document.createElement("style");
  style.textContent = `
    .board-slots {
      display: flex !important;
      justify-content: center !important;
      align-items: flex-end !important;
      gap: clamp(10px, 1.4vw, 20px) !important;
      margin-top: 4px !important;
      min-height: 150px !important;
      padding: 8px 12px 0 !important;
      overflow-x: auto;
      overflow-y: visible;
    }

    .board-slots .board-card {
      flex: 0 1 170px;
      width: min(170px, 14vw);
      min-width: 118px;
      max-width: 170px;
      min-height: 196px;
    }

    .board-slots .board-card.empty {
      display: none !important;
    }

    .board-slots.board-drop-ready {
      border-radius: 22px;
      box-shadow: inset 0 0 0 2px rgba(125, 228, 149, .72), inset 0 0 36px rgba(125, 228, 149, .12);
      background: rgba(125, 228, 149, .08);
    }

    .board-hand-divider {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 2px 10px 0;
      color: rgba(249, 235, 207, .46);
      font-size: .72rem;
      letter-spacing: .12em;
      user-select: none;
    }

    .board-hand-divider::before,
    .board-hand-divider::after {
      content: "";
      height: 1px;
      flex: 1;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(249, 235, 207, .2),
        rgba(249, 235, 207, .34),
        rgba(249, 235, 207, .2),
        transparent
      );
    }

    .board-hand-divider span {
      white-space: nowrap;
    }

    .hand-grid {
      display: flex !important;
      justify-content: center !important;
      align-items: flex-end !important;
      gap: 0 !important;
      margin-top: 6px !important;
      min-height: 148px !important;
      padding: 8px 28px 0 !important;
      overflow-x: auto !important;
      overflow-y: visible !important;
    }

    .hand-grid .hand-card {
      flex: 0 0 clamp(104px, 9.5vw, 142px) !important;
      width: clamp(104px, 9.5vw, 142px) !important;
      min-width: 104px !important;
      max-width: 142px !important;
      margin-left: var(--hand-overlap, -14px) !important;
      transform-origin: 50% 120% !important;
      transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease, opacity 120ms ease !important;
    }

    .hand-grid .hand-card:not(.spell):not(.empty) {
      cursor: grab !important;
      touch-action: none;
      user-select: none;
      -webkit-user-drag: none;
    }

    .hand-grid .hand-card:not(.spell):not(.empty):active {
      cursor: grabbing !important;
    }

    .hand-grid .hand-card.hand-pointer-dragging {
      opacity: .28 !important;
      filter: saturate(.55) brightness(.78) !important;
    }

    .hand-drag-ghost {
      position: fixed !important;
      left: 0;
      top: 0;
      z-index: 10000 !important;
      margin: 0 !important;
      pointer-events: none !important;
      opacity: .94 !important;
      transform: translate(-50%, -54%) rotate(0deg) scale(1.04) !important;
      transform-origin: 50% 50% !important;
      box-shadow: 0 22px 44px rgba(0, 0, 0, .48), 0 0 0 2px rgba(255, 231, 168, .42) !important;
      transition: none !important;
    }

    .hand-grid .hand-card:first-child {
      margin-left: 0 !important;
    }

    .hand-grid .hand-card.empty {
      display: none !important;
    }

    .hand-grid .hand-card:not(.empty):hover {
      z-index: 50;
      transform: translateY(-18px) scale(1.08) !important;
    }

    .hand-grid .hand-card.hand-pointer-dragging:hover {
      transform: inherit !important;
    }

    .empty-zone-note {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 72px;
      color: rgba(249, 235, 207, .42);
      font-size: .88rem;
      letter-spacing: .08em;
      pointer-events: none;
    }

    @media (max-width: 900px) {
      .board-slots {
        justify-content: flex-start !important;
      }

      .hand-grid {
        justify-content: flex-start !important;
      }
    }
  `;
  document.head.appendChild(style);

  const divider = document.createElement("div");
  divider.className = "board-hand-divider";
  divider.innerHTML = "<span>盤面　｜　手札</span>";
  handGridEl.parentNode.insertBefore(divider, handGridEl);

  const HAND_DRAG_THRESHOLD = 7;
  let handPointerDrag = null;
  let suppressHandClickUntil = 0;

  function pointInsideBoard(clientX, clientY) {
    const rect = boardSlotsEl.getBoundingClientRect();
    const buffer = 20;
    return clientX >= rect.left - buffer
      && clientX <= rect.right + buffer
      && clientY >= rect.top - buffer
      && clientY <= rect.bottom + buffer;
  }

  function moveHandGhost(drag, clientX, clientY) {
    if (!drag?.ghost) return;
    drag.ghost.style.left = `${clientX}px`;
    drag.ghost.style.top = `${clientY}px`;
  }

  function activateHandPointerDrag(drag, event) {
    if (drag.active) return;
    drag.active = true;
    const rect = drag.node.getBoundingClientRect();
    const ghost = drag.node.cloneNode(true);
    ghost.classList.remove("hand-pointer-dragging");
    ghost.classList.add("hand-drag-ghost");
    ghost.removeAttribute("draggable");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    drag.node.classList.add("hand-pointer-dragging");
    handGridEl.classList.add("hand-drag-active");
    moveHandGhost(drag, event.clientX, event.clientY);
  }

  function clearHandPointerDrag() {
    if (!handPointerDrag) return;
    handPointerDrag.node?.classList.remove("hand-pointer-dragging");
    handPointerDrag.ghost?.remove();
    boardSlotsEl.classList.remove("board-drop-ready");
    handGridEl.classList.remove("hand-drag-active");
    handPointerDrag = null;
  }

  function beginHandPointerDrag(event, node, index) {
    if (state.gameOver || event.button !== 0 || event.isPrimary === false) return;
    const card = state.hand[index];
    if (!card || card.type === "spell") return;

    handPointerDrag = {
      pointerId: event.pointerId,
      index,
      node,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      active: false,
      ghost: null,
    };
  }

  function onHandPointerMove(event) {
    const drag = handPointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.active && distance >= HAND_DRAG_THRESHOLD) {
      activateHandPointerDrag(drag, event);
    }
    if (!drag.active) return;

    event.preventDefault();
    moveHandGhost(drag, event.clientX, event.clientY);
    boardSlotsEl.classList.toggle("board-drop-ready", pointInsideBoard(event.clientX, event.clientY));
  }

  function finishHandPointerDrag(event, cancelled = false) {
    const drag = handPointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const wasActive = drag.active;
    const dropOnBoard = wasActive && !cancelled && pointInsideBoard(event.clientX, event.clientY);
    const handIndex = drag.index;
    clearHandPointerDrag();

    if (!wasActive) return;
    event.preventDefault();
    suppressHandClickUntil = Date.now() + 450;

    if (!dropOnBoard) return;
    const card = state.hand[handIndex];
    if (!card || card.type === "spell") return;
    const targetIndex = getFirstEmptyBoardSlot();
    if (targetIndex < 2) {
      log("盤面がいっぱい。");
      render();
      return;
    }
    playHandCardToSlot(handIndex, targetIndex);
  }

  window.addEventListener("pointermove", onHandPointerMove, { passive: false });
  window.addEventListener("pointerup", event => finishHandPointerDrag(event));
  window.addEventListener("pointercancel", event => finishHandPointerDrag(event, true));

  handGridEl.addEventListener("click", event => {
    if (Date.now() >= suppressHandClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  function wireHandPointerDrag(cards) {
    cards.forEach((node, index) => {
      const card = state.hand[index];
      node.dataset.handIndex = String(index);
      if (!card || card.type === "spell") return;
      node.draggable = false;
      node.addEventListener("pointerdown", event => beginHandPointerDrag(event, node, index));
    });
  }

  function layoutHand() {
    const cards = [...handGridEl.children].filter(node => node.classList.contains("hand-card") && !node.classList.contains("empty"));
    const count = cards.length;

    if (!count) {
      if (!handGridEl.querySelector(".empty-zone-note")) {
        const note = document.createElement("div");
        note.className = "empty-zone-note";
        note.textContent = "手札は空です";
        handGridEl.appendChild(note);
      }
      return;
    }

    handGridEl.querySelector(".empty-zone-note")?.remove();
    const overlap = count <= 5 ? 0 : Math.max(-28, -6 - (count - 5) * 4);
    const middle = (count - 1) / 2;

    cards.forEach((node, index) => {
      const distance = index - middle;
      const angle = Math.max(-8, Math.min(8, distance * 2.2));
      const lift = Math.abs(distance) * 2.6;
      node.style.setProperty("--hand-overlap", `${overlap}px`);
      node.style.setProperty("transform", `translateY(${-lift}px) rotate(${angle}deg)`, "important");
      node.style.zIndex = String(index + 1);
      const card = state.hand[index];
      if (card && card.type !== "spell") {
        node.title = "盤面へドラッグして配置／クリックでも配置できます";
      }
    });

    wireHandPointerDrag(cards);
  }

  function layoutBoard() {
    const cards = [...boardSlotsEl.children].filter(node => !node.classList.contains("empty"));
    if (!cards.length && !boardSlotsEl.querySelector(".empty-zone-note")) {
      const note = document.createElement("div");
      note.className = "empty-zone-note";
      note.textContent = "手札のミニオンを盤面へドラッグ、またはクリック";
      boardSlotsEl.appendChild(note);
    } else if (cards.length) {
      boardSlotsEl.querySelector(".empty-zone-note")?.remove();
    }
  }

  const previousRenderHand = renderHand;
  renderHand = function() {
    clearHandPointerDrag();
    previousRenderHand();
    layoutHand();
  };

  const previousRenderBoard = renderBoard;
  renderBoard = function() {
    previousRenderBoard();
    layoutBoard();
  };

  // Keep native HTML5 drag/drop as a fallback for environments that support it.
  boardSlotsEl.addEventListener("dragover", event => {
    const payload = readDragPayload(event);
    if (!payload || payload.kind !== "hand") return;
    const card = state.hand[payload.index];
    if (!card || card.type === "spell") return;
    event.preventDefault();
    boardSlotsEl.classList.add("board-drop-ready");
  });

  boardSlotsEl.addEventListener("dragleave", event => {
    if (!boardSlotsEl.contains(event.relatedTarget)) {
      boardSlotsEl.classList.remove("board-drop-ready");
    }
  });

  boardSlotsEl.addEventListener("drop", event => {
    event.preventDefault();
    boardSlotsEl.classList.remove("board-drop-ready");
    const payload = readDragPayload(event);
    if (!payload || payload.kind !== "hand") return;
    const card = state.hand[payload.index];
    if (!card || card.type === "spell") return;
    const targetIndex = getFirstEmptyBoardSlot();
    if (targetIndex >= 2) playHandCardToSlot(payload.index, targetIndex);
  });

  layoutHand();
  layoutBoard();
}, { once: true });
