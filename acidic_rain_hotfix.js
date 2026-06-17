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

  .stat-bonus {
    display: block;
    margin-top: 2px;
    color: #8dff9d;
    font-size: .62rem;
    font-weight: 900;
    text-align: center;
    text-shadow: 0 0 8px rgba(85,255,117,.65);
  }

  .buff-flash {
    animation: buffFlash .55s ease-out;
  }

  @keyframes buffFlash {
    0% { transform: scale(1); filter: brightness(1); }
    45% { transform: scale(1.045); filter: brightness(1.45); }
    100% { transform: scale(1); filter: brightness(1); }
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
  function ensureBaseStats(card){
    if(!card || card.type === "spell") return card;
    if(card.baseAtk == null) card.baseAtk = Number(card.atk || 0);
    if(card.baseHp == null) card.baseHp = Number(card.hp || 0);
    if(card.bonusAtk == null) card.bonusAtk = Math.max(0, Number(card.atk || 0) - card.baseAtk);
    if(card.bonusHp == null) card.bonusHp = Math.max(0, Number(card.hp || 0) - card.baseHp);
    return card;
  }

  function addStats(card, atk = 0, hp = 0){
    if(!card || card.type === "spell") return false;
    ensureBaseStats(card);
    const attackGain = Number(atk || 0);
    const healthGain = Number(hp || 0);
    card.atk = Number(card.atk || 0) + attackGain;
    card.hp = Number(card.hp || 0) + healthGain;
    card.bonusAtk = Number(card.bonusAtk || 0) + attackGain;
    card.bonusHp = Number(card.bonusHp || 0) + healthGain;
    card.lastBuffAt = Date.now();
    return true;
  }

  window.addStats = addStats;

  function patchRainInstances(){
    const template=MINIONS.find(c=>c.id==="acidic_rain_copy");
    if(!template)return;
    [state.board[1],...state.hand.filter(c=>c&&c.id==="acidic_rain_copy")].forEach(card=>{
      if(!card)return;
      const atk=card.atk||6,hp=card.hp||6;
      Object.assign(card,initializedClone(template),{atk,hp});
      ensureBaseStats(card);
    });
  }

  const originalCloneCard = cloneCard;
  cloneCard = function(card){
    const cloned = originalCloneCard(card);
    return ensureBaseStats(cloned);
  };

  buffRain = function(gameState, atk, hp){
    const rain = gameState.board[1];
    addStats(rain, atk, hp);
  };

  buffAllRains = function(gameState, atk, hp){
    gameState.board.forEach((card,index)=>{
      if(card && (index===1 || card.id==="acidic_rain_copy")) addStats(card,atk,hp);
    });
  };

  const engine = MINIONS.find(c=>c.id==="engine");
  if(engine){
    engine.battlecry=function(gameState){
      const target=getRightmostShopCard(gameState);
      const amount=A(this,7,14);
      if(target&&target.type!=="spell") addStats(target,amount,amount);
    };
  }

  const waverling = MINIONS.find(c=>c.id==="waverling");
  if(waverling){
    waverling.onSpellCast=function(gameState){
      const target=getRightmostShopCard(gameState);
      const amount=A(this,3,6);
      if(target&&target.type!=="spell") addStats(target,amount,amount);
    };
  }

  const rainTemplate = MINIONS.find(c=>c.id==="acidic_rain_copy");
  if(rainTemplate){
    rainTemplate.onRerollCount=function(gameState){
      this.rerollProgress=(this.rerollProgress||0)+1;
      while(this.rerollProgress>=4){
        this.rerollProgress-=4;
        const target=getRightmostShopCard(gameState);
        const multiplier=A(this,1,2);
        if(target&&target.type!=="spell") addStats(this,(target.atk||0)*multiplier,(target.hp||0)*multiplier);
      }
    };
  }

  const acidburst = SPELLS.find(c=>c.id==="acidburst");
  if(acidburst){
    acidburst.cast=function(gameState){
      gameState.board.forEach((card,index)=>{
        if(card&&(index===1||card.id==="acidic_rain_copy")) addStats(card,4,4);
      });
    };
  }

  const tavernstorm = SPELLS.find(c=>c.id==="tavernstorm");
  if(tavernstorm){
    tavernstorm.cast=function(gameState){
      gameState.shop.forEach(card=>{
        if(card&&card.type!=="spell") addStats(card,3,3);
      });
    };
  }

  function decorateStats(container,cards){
    const nodes=[...container.children];
    nodes.forEach((node,index)=>{
      const card=cards[index];
      if(!card||card.type==="spell")return;
      ensureBaseStats(card);
      const stats=node.querySelector(".stats");
      if(!stats)return;
      const old=stats.querySelector(".stat-bonus");
      if(old)old.remove();
      if(card.bonusAtk||card.bonusHp){
        const bonus=document.createElement("span");
        bonus.className="stat-bonus";
        bonus.textContent=`累積 +${card.bonusAtk || 0}/+${card.bonusHp || 0}`;
        stats.appendChild(bonus);
      }
      if(card.lastBuffAt&&Date.now()-card.lastBuffAt<700){
        node.classList.add("buff-flash");
      }
    });
  }

  const originalRenderBoard=renderBoard;
  renderBoard=function(){
    originalRenderBoard();
    decorateStats(boardSlotsEl,state.board.slice(2));
  };

  const originalRenderShop=renderShop;
  renderShop=function(){
    originalRenderShop();
    decorateStats(shopGridEl,state.shop);
  };

  const originalRenderHand=renderHand;
  renderHand=function(){
    originalRenderHand();
    decorateStats(handGridEl,state.hand.slice(0,HAND_LIMIT));
  };

  // Restart must create the full individual-counter version of Acidic Rain too.
  setupRun=function(){
    const result=ACID_ORIGINAL_HANDLERS.setup();
    patchRainInstances();
    state.board.forEach(ensureBaseStats);
    state.hand.forEach(ensureBaseStats);
    state.shop.forEach(ensureBaseStats);
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
      state.shop.forEach(ensureBaseStats);
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
    if(result&&!isSpell&&state.board[targetIndex]) ensureBaseStats(state.board[targetIndex]);
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
  state.board.forEach(ensureBaseStats);
  state.hand.forEach(ensureBaseStats);
  state.shop.forEach(ensureBaseStats);
  updateAuras();
  render();
},{once:true});
