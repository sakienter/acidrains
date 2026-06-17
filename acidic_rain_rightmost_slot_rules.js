/* Rightmost effects always refer to the shop's fixed final slot. */
window.addEventListener("load", () => {
  getRightmostShopCard = function(gameState) {
    if (!gameState || !Array.isArray(gameState.shop) || !gameState.shop.length) return null;
    return gameState.shop[gameState.shop.length - 1] || null;
  };

  render();
}, { once: true });
