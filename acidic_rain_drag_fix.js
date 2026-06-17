/* Reliable hand-to-board drag and drop. Loaded after all layout modules. */
window.addEventListener("load", () => {
  let draggedHandIndex = null;

  function bindHandDragSources() {
    [...handGridEl.querySelectorAll(".hand-card:not(.empty)")].forEach((node, index) => {
      const card = state.hand[index];
      if (!card || card.type === "spell") return;

      node.draggable = true;
      node.addEventListener("dragstart", event => {
        draggedHandIndex = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "hand", index }));
        node.classList.add("is-dragging-from-hand");
      });

      node.addEventListener("dragend", () => {
        draggedHandIndex = null;
        node.classList.remove("is-dragging-from-hand");
        boardSlotsEl.classList.remove("board-drop-ready");
      });
    });
  }

  // Capture phase ensures the board accepts the drop even when the pointer is
  // currently above an existing board card.
  boardSlotsEl.addEventListener("dragenter", event => {
    if (draggedHandIndex == null) return;
    event.preventDefault();
    boardSlotsEl.classList.add("board-drop-ready");
  }, true);

  boardSlotsEl.addEventListener("dragover", event => {
    if (draggedHandIndex == null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    boardSlotsEl.classList.add("board-drop-ready");
  }, true);

  boardSlotsEl.addEventListener("drop", event => {
    if (draggedHandIndex == null) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    boardSlotsEl.classList.remove("board-drop-ready");

    let index = draggedHandIndex;
    try {
      const payload = JSON.parse(event.dataTransfer.getData("text/plain") || "null");
      if (payload?.kind === "hand" && Number.isInteger(payload.index)) {
        index = payload.index;
      }
    } catch {
      // Use the index recorded at dragstart.
    }

    draggedHandIndex = null;
    const card = state.hand[index];
    if (!card || card.type === "spell") return;

    const targetIndex = getFirstEmptyBoardSlot();
    if (targetIndex < 2) {
      log("盤面がいっぱい。");
      render();
      return;
    }

    playHandCardToSlot(index, targetIndex);
  }, true);

  const previousRenderHand = renderHand;
  renderHand = function() {
    previousRenderHand();
    bindHandDragSources();
  };

  const style = document.createElement("style");
  style.textContent = `
    .hand-card.is-dragging-from-hand {
      opacity: .42 !important;
    }

    .board-slots.board-drop-ready {
      box-shadow:
        inset 0 0 0 2px rgba(125, 228, 149, .78),
        inset 0 0 28px rgba(125, 228, 149, .12) !important;
    }
  `;
  document.head.appendChild(style);

  bindHandDragSources();
}, { once: true });
