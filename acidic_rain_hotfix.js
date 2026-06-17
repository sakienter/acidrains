/* Loaded after the main engine and advanced rules, before window.load. */
const handLayoutStyle = document.createElement("style");
handLayoutStyle.textContent = `
  .hand-grid {
    display: grid !important;
    grid-template-columns: repeat(10, minmax(88px, 1fr)) !important;
    align-items: end !important;
    justify-content: stretch !important;
    gap: 8px !important;
    min-height: 206px !important;
    padding: 14px 8px 10px !important;
    overflow-x: auto !important;
    overflow-y: visible !important;
  }

  .hand-card,
  .hand-grid .hand-card:first-child {
    width: 100% !important;
    min-width: 88px !important;
    max-width: 138px !important;
    min-height: 180px !important;
    margin-left: 0 !important;
    transform: none !important;
    padding: 12px 8px 10px !important;
    border-radius: 18px 18px 12px 12px !important;
    transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease !important;
  }

  .hand-card:not(.empty):hover {
    position: relative;
    z-index: 20;
    transform: translateY(-12px) scale(1.05) !important;
    filter: brightness(1.08);
    box-shadow: 0 20px 38px rgba(0, 0, 0, 0.48) !important;
  }

  .hand-card .card-emoji {
    font-size: clamp(32px, 3vw, 46px) !important;
    margin-top: 4px !important;
  }

  .hand-card .card-name {
    font-size: clamp(.72rem, 1vw, .9rem) !important;
    line-height: 1.22 !important;
    min-height: 2.45em;
    overflow-wrap: anywhere;
  }

  .hand-card .card-text {
    min-height: 48px !important;
    max-height: 62px;
    overflow: hidden;
    font-size: clamp(.58rem, .76vw, .7rem) !important;
    line-height: 1.35 !important;
  }

  .hand-card .stats {
    font-size: clamp(.88rem, 1.4vw, 1.15rem) !important;
  }

  .hand-card.empty {
    min-height: 156px !important;
    align-self: end;
    opacity: .16 !important;
  }

  .hand-card.empty .card-text {
    display: none;
  }

  @media (max-width: 1050px) {
    .hand-grid {
      grid-template-columns: repeat(10, 108px) !important;
      justify-content: start !important;
    }
  }
`;
document.head.appendChild(handLayoutStyle);

const discoverUiScript = document.createElement("script");
discoverUiScript.src = "./acidic_rain_discover_ui.js";
discoverUiScript.async = false;
document.head.appendChild(discoverUiScript);

const ACID_ORIGINAL_HANDLERS = {
  reroll: rerollShop,
  upgrade: upgradeTavern,
  endTurn: endTurn,
  setup: setupRun,
};

window.addEventListener("load", () => {
  function patchRainInstances(){
    const template=MINIONS.find(c=>c.id==="acidic_rain_copy");
    if(!template)return;
    [state.board[1],...state.hand.filter(c=>c&&c.id==="acidic_rain_copy")].forEach(card=>{
      if(!card)return;
      const atk=card.atk||6,hp=card.hp||6;
      Object.assign(card,initializedClone(template),{atk,hp});
    });
  }

  // Restart must create the full individual-counter version of Acidic Rain too.
  setupRun=function(){
    const result=ACID_ORIGINAL_HANDLERS.setup();
    patchRainInstances();
    updateAuras();
    return result;
  };

  // The original button callbacks were registered before the wrappers existed.
  upgradeBtn.removeEventListener("click",ACID_ORIGINAL_HANDLERS.upgrade);
  rerollBtn.removeEventListener("click",ACID_ORIGINAL_HANDLERS.reroll);
  endTurnBtn.removeEventListener("click",ACID_ORIGINAL_HANDLERS.endTurn);

  const advancedUpgrade=upgradeTavern;
  const advancedEndTurn=endTurn;

  // Count the actual reroll price, not the net gold difference (Millhouse may refund it).
  rerollShop=function(){
    if(state.gameOver)return;
    const cost=getRerollCost(state);
    const before=state.rerolls;
    const result=ACID_ORIGINAL_HANDLERS.reroll();
    if(state.rerolls>before){
      notifyGoldSpent(cost);
      notifyBoard("onRerollCount",state);
    }
    render();
    return result;
  };

  upgradeTavern=advancedUpgrade;
  endTurn=advancedEndTurn;
  upgradeBtn.addEventListener("click",upgradeTavern);
  rerollBtn.addEventListener("click",rerollShop);
  endTurnBtn.addEventListener("click",endTurn);

  // Tauren charges belong to each individual card and reset only at turn change.
  const advancedUpdateAuras=updateAuras;
  updateAuras=function(){
    advancedUpdateAuras();
    state.doubleSpellCharges=0;
  };

  const advancedPlay=playHandCardToSlot;
  playHandCardToSlot=function(index,targetIndex){
    const card=state.hand[index];
    const isSpell=card&&card.type==="spell";
    let tauren=null;
    if(isSpell){
      tauren=state.board.find(c=>c&&c.id==="tauren"&&(c.turnTriggers||0)<A(c,1,2))||null;
    }
    const result=advancedPlay(index,targetIndex);
    if(result&&isSpell&&tauren){
      tauren.turnTriggers=(tauren.turnTriggers||0)+1;
      card.cast(state);
      notifyBoard("onSpellCast",state,card);
      log(`${tauren.name} により ${card.name} をもう一度唱えた。`);
      updateAuras();
      render();
    }
    return result;
  };

  patchRainInstances();
  updateAuras();
  render();
},{once:true});
