/* Dynamic hand and board layouts without visible empty-slot grids. */
window.addEventListener("load", () => {
  const style = document.createElement("style");
  style.textContent = `
    .board-slots {
      display: flex !important;
      justify-content: center !important;
      align-items: flex-end !important;
      gap: clamp(10px, 1.4vw, 20px) !important;
      min-height: 220px;
      padding: 18px 12px 8px !important;
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
      box-shadow: inset 0 0 0 2px rgba(125, 228, 149, .5);
      background: rgba(125, 228, 149, .06);
    }

    .board-hand-divider {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 10px 10px 0;
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
      min-height: 220px !important;
      padding: 24px 28px 8px !important;
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
      transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease !important;
    }

    .hand-grid .hand-card:not(.spell):not(.empty) {
      cursor: grab !important;
    }

    .hand-grid .hand-card:not(.spell):not(.empty):active {
      cursor: grabbing !important;
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

    .empty-zone-note {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
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

  function layoutHand() {
    const cards = [...handGridEl.children].filter(node => !node.classList.contains("empty"));
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
      node.style.setProperty("transform", `translateY(${lift}px) rotate(${angle}deg)`, "important");
      node.style.zIndex = String(index + 1);
      const card = state.hand[index];
      if (card && card.type !== "spell") {
        node.title = "クリックで盤面に配置／ドラッグでも配置できます";
      }
    });
  }

  function layoutBoard() {
    const cards = [...boardSlotsEl.children].filter(node => !node.classList.contains("empty"));
    if (!cards.length && !boardSlotsEl.querySelector(".empty-zone-note")) {
      const note = document.createElement("div");
      note.className = "empty-zone-note";
      note.textContent = "手札のミニオンをクリック、またはここへドラッグ";
      boardSlotsEl.appendChild(note);
    } else if (cards.length) {
      boardSlotsEl.querySelector(".empty-zone-note")?.remove();
    }
  }

  const previousRenderHand = renderHand;
  renderHand = function() {
    previousRenderHand();
    layoutHand();
  };

  const previousRenderBoard = renderBoard;
  renderBoard = function() {
    previousRenderBoard();
    layoutBoard();
  };

  // The board itself becomes the drop target. Cards are placed into the first
  // free board position, so visible placeholder cards are unnecessary.
  boardSlotsEl.addEventListener("dragover", event => {
    const payload = readDragPayload(event);
    if (!payload || payload.kind !== "hand") return;
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
    const targetIndex = getFirstEmptyBoardSlot();
    if (targetIndex >= 2) playHandCardToSlot(payload.index, targetIndex);
  });

  layoutHand();
  layoutBoard();
}, { once: true });
