/* Advanced rules for the expanded Acidic Rain card pool. */

const TOKEN_CARDS = {
  change: { id:"token_change", name:"おつり", emoji:"🪙", tier:1, cost:0, type:"spell", text:"効果未設定のトークン。", cast(){ log("『おつり』の効果は未設定です。"); } },
  dream_essence: { id:"token_dream_essence", name:"夢のエッセンス", emoji:"💭", tier:2, cost:0, type:"spell", text:"効果未設定のトークン。", cast(){ log("『夢のエッセンス』の効果は未設定です。"); } },
  gift: { id:"token_gift", name:"贈り物", emoji:"🎁", tier:3, cost:0, type:"spell", text:"贈り物タグの仮トークン。", cast(){ log("贈り物タグの効果は未設定です。"); } },
  time_transcendence: { id:"token_time_transcendence", name:"時空の超越", emoji:"⌛", tier:3, cost:0, type:"spell", text:"効果未設定のトークン。", cast(){ log("『時空の超越』の効果は未設定です。"); } },
  east_wind: { id:"token_east_wind", name:"東よりの風", emoji:"🌬️", tier:2, cost:0, type:"spell", text:"効果未設定。自動で唱えられる。", cast(){ log("『東よりの風』を唱えた。効果は未設定です。"); } },
  cat: { id:"token_cat", name:"猫トークン", emoji:"🐈", tier:1, cost:0, atk:1, hp:1, tribe:"獣", text:"野良猫が召喚した猫。" },
};

function initializedClone(card){
  if(!card) return null;
  const clone={...card};
  if(typeof clone.init==="function") clone.init(clone);
  return clone;
}

function chooseFromCards(cards,title){
  if(!cards.length) return null;
  const candidates=[];
  const source=[...cards];
  while(source.length&&candidates.length<3){
    const index=Math.floor(Math.random()*source.length);
    candidates.push(source.splice(index,1)[0]);
  }
  const lines=candidates.map((c,i)=>`${i+1}. ${c.name} [Tier ${c.tier}]`).join("\n");
  const answer=window.prompt(`${title}\n${lines}\n番号を入力してください。`,"1");
  const selected=Number(answer)-1;
  return candidates[selected]||candidates[0];
}

function discoverCards(gameState,pool,count,title){
  for(let i=0;i<count;i+=1){
    if(gameState.hand.length>=HAND_LIMIT){log("手札がいっぱい。");break;}
    const selected=chooseFromCards(pool,title);
    if(selected) gainCardToHand(gameState,selected,`${selected.name} を獲得した。`);
  }
}

function gainToken(gameState,key,count=1){
  const token=TOKEN_CARDS[key];
  for(let i=0;i<count;i+=1){
    if(!gainCardToHand(gameState,token,`${token.name} を獲得した。`)) break;
  }
}

function castTokenSpell(gameState,key){
  const token=TOKEN_CARDS[key];
  if(token&&typeof token.cast==="function") token.cast(gameState);
  notifyBoard("onSpellCast",gameState,token);
}

function summonToken(gameState,key,count=1){
  const token=TOKEN_CARDS[key];
  for(let i=0;i<count;i+=1){
    const slot=gameState.board.findIndex((c,index)=>index>=2&&!c);
    if(slot<0){log("盤面がいっぱい。");break;}
    gameState.board[slot]=initializedClone(token);
  }
}

function selectBoardCard(gameState,predicate,action,title){
  const entries=gameState.board.map((card,index)=>({card,index})).filter(x=>x.index>=2&&x.card&&predicate(x.card));
  if(!entries.length){log("対象がいない。");return null;}
  const lines=entries.map((x,i)=>`${i+1}. ${x.card.name} (${x.card.atk}/${x.card.hp})`).join("\n");
  const answer=window.prompt(`${title}\n${lines}`,"1");
  const selected=entries[Number(answer)-1]||entries[0];
  action(selected.card,selected.index);
  return selected.card;
}

function returnBoardCardToHand(gameState,predicate){
  if(gameState.hand.length>=HAND_LIMIT){log("手札がいっぱい。");return;}
  selectBoardCard(gameState,predicate,(card,index)=>{gameState.hand.push(card);gameState.board[index]=null;},"手札に戻すカードを選択");
}

function awakenBoardElementals(gameState,count,excludeId){
  for(let i=0;i<count;i+=1){
    const target=selectBoardCard(gameState,c=>c.tribe==="エレメンタル"&&!c.awakened&&c.id!==excludeId,c=>{c.awakened=true;c.text=c.awakenedText||c.text;},"覚醒させるエレメンタルを選択");
    if(!target) break;
  }
}

function copyHandSpell(gameState,count){
  const entries=gameState.hand.map((card,index)=>({card,index})).filter(x=>x.card&&x.card.type==="spell");
  if(!entries.length){log("手札にスペルがない。");return;}
  const lines=entries.map((x,i)=>`${i+1}. ${x.card.name}`).join("\n");
  const answer=window.prompt(`コピーするスペルを選択\n${lines}`,"1");
  const selected=(entries[Number(answer)-1]||entries[0]).card;
  for(let i=0;i<count;i+=1){if(!gainCardToHand(gameState,selected,`${selected.name} のコピーを得た。`))break;}
}

function gainReplayToken(gameState,spell){
  const token={id:`replay_${spell.id}_${Date.now()}`,name:`${spell.name}の再演`,emoji:"🔁",tier:spell.tier,cost:0,type:"spell",text:`雄叫び：${spell.name}を発動する。`,cast(s){spell.cast(s);}};
  gainCardToHand(gameState,token,`${spell.name}の再演を得た。`);
}

function makeShopSpellsFree(gameState,count){
  gameState.shop.filter(c=>c&&c.type==="spell").slice(0,count).forEach(c=>{c.cost=0;c.freeBySeer=true;});
}

function triggerAdjacentBattlecries(gameState,index,times){
  [index-1,index+1].forEach(i=>{
    const card=gameState.board[i];
    if(card&&typeof card.battlecry==="function") for(let n=0;n<times;n+=1) card.battlecry(gameState);
  });
}

function rerollShopByDominantTribe(gameState,times){
  const counts={};
  gameState.board.filter(Boolean).forEach(c=>{if(c.tribe&&c.tribe!=="なし"&&c.tribe!=="育成")counts[c.tribe]=(counts[c.tribe]||0)+1;});
  const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  if(!dominant){drawShop();return;}
  const pool=MINIONS.filter(c=>c.tier<=gameState.tavernTier&&c.tribe===dominant);
  for(let r=0;r<times;r+=1){gameState.shop=[];const count=Math.min(6,3+gameState.tavernTier);for(let i=0;i<count;i+=1)gameState.shop.push(createSpecificShopCard(pool));gameState.shop.push(createSpecificShopCard(SPELLS.filter(c=>c.tier<=gameState.tavernTier)));}
}

function notifyBoard(hook,...args){
  state.board.slice().forEach(card=>{if(card&&typeof card[hook]==="function")card[hook](...args);});
}

function notifyGoldSpent(amount){
  if(amount>0) notifyBoard("onGoldSpent",state,amount);
}

function resetPerTurnCardState(){
  state.board.forEach(card=>{if(card){if("turnTriggers" in card)card.turnTriggers=0;}});
}

function installAdvancedRules(){
  const oldCloneCard=cloneCard;
  cloneCard=function(card){return initializedClone(card||oldCloneCard(card));};

  const oldUpdateAuras=updateAuras;
  updateAuras=function(){state.doubleSpellCharges=0;oldUpdateAuras();};

  // Replace the two initial prototype rain cards with full card instances.
  const rainTemplate=MINIONS.find(c=>c.id==="acidic_rain_copy");
  [state.board[1],...state.hand.filter(c=>c&&c.id==="acidic_rain_copy")].forEach(card=>{
    if(!card)return;
    Object.assign(card,initializedClone(rainTemplate),{atk:card.atk||6,hp:card.hp||6});
  });

  const oldReroll=rerollShop;
  rerollShop=function(){
    const beforeGold=state.gold,beforeRerolls=state.rerolls;
    const result=oldReroll();
    if(state.rerolls>beforeRerolls){notifyGoldSpent(Math.max(0,beforeGold-state.gold));notifyBoard("onRerollCount",state);}
    render();return result;
  };

  const oldBuy=buyCard;
  buyCard=function(index){
    const card=state.shop[index];const beforeGold=state.gold;
    const result=oldBuy(index);
    if(result){notifyGoldSpent(Math.max(0,beforeGold-state.gold));if(card&&card.type==="spell")notifyBoard("onSpellBought",state,card);}
    render();return result;
  };

  const oldUpgrade=upgradeTavern;
  upgradeTavern=function(){const beforeGold=state.gold,beforeTier=state.tavernTier;const result=oldUpgrade();if(state.tavernTier>beforeTier)notifyGoldSpent(Math.max(0,beforeGold-state.gold));render();return result;};

  const oldPlay=playHandCardToSlot;
  playHandCardToSlot=function(index,targetIndex){
    const card=state.hand[index];if(!card)return false;
    const wasSpell=card.type==="spell";
    const doubleCast=wasSpell&&state.doubleSpellCharges>0;
    const result=oldPlay(index,targetIndex);
    if(!result)return result;
    if(wasSpell){
      if(doubleCast){state.doubleSpellCharges-=1;card.cast(state);}
      notifyBoard("onSpellCast",state,card);
    }else{
      const played=state.board[targetIndex];if(played&&typeof played.onPlay==="function")played.onPlay(state);
      if(played&&played.tribe==="エレメンタル")notifyBoard("onElementalPlayed",state,played);
    }
    updateAuras();render();return result;
  };

  const oldSell=sellBoardCard;
  sellBoardCard=function(index){
    const sold=state.board[index];if(!sold)return;
    oldSell(index);
    notifyBoard("onAnySell",state,sold);
    if(sold.tribe==="エレメンタル")notifyBoard("onElementalSold",state,sold);
    render();
  };

  const oldEndTurn=endTurn;
  endTurn=function(){
    const beforeTurn=state.turn;
    const bonus=state.nextTurnGoldBonus||0;
    state.nextTurnGoldBonus=0;
    const result=oldEndTurn();
    if(state.turn>beforeTurn&&!state.gameOver){
      state.gold+=bonus;
      resetPerTurnCardState();
      notifyBoard("onTurnStart",state);
      updateAuras();render();
    }
    return result;
  };

  updateAuras();render();
}

window.addEventListener("load",installAdvancedRules,{once:true});
