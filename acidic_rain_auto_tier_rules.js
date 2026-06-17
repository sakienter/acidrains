/* Automatic Tier 1-6 assignment based on effect strength, scaling, and engine value. */
window.addEventListener("load", () => {
  const AUTO_TIER_ASSIGNMENTS = {
    prophet: 1,
    busker: 1,
    "uremental": 1,
    drake: 1,
    alleycat: 1,
    coldlight: 1,
    brewmaster: 1,

    sakamaki: 2,
    shark: 2,
    okamon: 2,
    snow_elemental: 2,
    swapbody: 2,
    reborn_snake: 2,
    shore_explorer: 2,
    beacon: 2,
    shell_whistler: 2,

    scout: 3,
    lucky_wind: 3,
    rodeo: 3,
    recycle: 3,
    hamul: 3,
    arcadas: 3,
    akari: 3,
    wavecaller: 3,
    sporebat: 3,
    waverling: 3,
    draconic_deathscale_naga: 3,
    draconic_deathscale_dragon: 3,

    engine: 4,
    trumpeter: 4,
    lyrak: 4,
    elise_minion: 4,
    outlands: 4,
    ghastcoiler: 4,
    maxwell: 4,
    reno: 4,

    minion_brann: 5,
    air_revenant: 5,
    lantern_larva: 5,
    timewarped_seer: 5,

    tauren: 6,
    acidic_rain_copy: 6,
    surprise_elemental: 6,
    magicfin: 6,
  };

  const tierCounts = new Map();
  MINIONS.forEach(card => {
    const assignedTier = AUTO_TIER_ASSIGNMENTS[card.id];
    if (assignedTier) card.tier = assignedTier;
    card.autoTierAssigned = Boolean(assignedTier);
    tierCounts.set(card.tier, (tierCounts.get(card.tier) || 0) + 1);
  });

  window.AUTO_TIER_ASSIGNMENTS = AUTO_TIER_ASSIGNMENTS;

  if (!state.gameOver) {
    state.frozen = false;
    drawShop();
    updateAuras();
  }

  const summary = [1, 2, 3, 4, 5, 6]
    .map(tier => `T${tier}:${tierCounts.get(tier) || 0}`)
    .join(" / ");
  log(`カード効果に基づく自動Tier配分を適用しました。${summary}`);
  render();
}, { once: true });
