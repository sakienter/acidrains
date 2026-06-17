/* Loaded after the main engine and advanced rules, before window.load. */
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
