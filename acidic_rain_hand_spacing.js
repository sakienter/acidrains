/* Final hand fan tuning: keep all ten cards readable inside the fixed viewport. */
window.addEventListener("load", () => {
  if (window.__acidHandSpacingApplied) return;
  window.__acidHandSpacingApplied = true;

  function tuneHandFan() {
    const cards = [...handGridEl.children].filter(node =>
      node.classList.contains("hand-card") && !node.classList.contains("empty")
    );
    const count = cards.length;
    if (!count) return;

    const middle = (count - 1) / 2;
    const overlap = count <= 8 ? 0 : count === 9 ? -3 : -5;

    cards.forEach((node, index) => {
      const distance = index - middle;
      const angle = Math.max(-4.5, Math.min(4.5, distance * 1.05));
      const lift = Math.abs(distance) * 1.15;
      node.style.setProperty("--hand-overlap", `${overlap}px`);
      node.style.setProperty("transform", `translateY(${-lift}px) rotate(${angle}deg)`, "important");
      node.style.zIndex = String(Math.round(100 - Math.abs(distance) * 3));
    });
  }

  const previousRenderHand = renderHand;
  renderHand = function() {
    previousRenderHand();
    tuneHandFan();
  };

  window.addEventListener("resize", tuneHandFan);
  tuneHandFan();
}, { once: true });
