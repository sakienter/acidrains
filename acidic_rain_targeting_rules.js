/* Arrow targeting for cards that explicitly choose a target. */
window.addEventListener('load', () => {
  const TARGET_NAMES = new Set([
    'シェフのおすすめ',
    '夢のエッセンス',
    '超覚醒化',
    '覚醒化',
    'ドッペルゲンガーの奇策',
    '熱血パンチ',
    'ゼレク'
  ]);

  let active = null;
  let suppressClickUntil = 0;
  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const style = document.createElement('style');
  style.textContent = `
    .targeting-valid{outline:3px solid rgba(255,213,92,.98)!important;outline-offset:4px;box-shadow:0 0 24px rgba(255,190,58,.72)!important}
    .targeting-hover{outline-color:rgba(113,255,166,1)!important;box-shadow:0 0 30px rgba(92,255,151,.88)!important}
    .targeting-source{outline:3px solid rgba(125,211,255,.95)!important;outline-offset:4px}
    #targetingArrowLayer{position:fixed;inset:0;z-index:5000;pointer-events:none;overflow:visible}
    #targetingArrowPath{fill:none;stroke:#ffd35a;stroke-width:8;stroke-linecap:round;filter:drop-shadow(0 0 7px rgba(255,174,31,.9))}
    #targetingArrowHead{fill:#ffd35a;filter:drop-shadow(0 0 6px rgba(255,174,31,.9))}
  `;
  document.head.appendChild(style);

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.id = 'targetingArrowLayer';
  svg.setAttribute('width','100%');
  svg.setAttribute('height','100%');
  svg.innerHTML = `<defs><marker id="targetingArrowMarker" markerWidth="14" markerHeight="14" refX="11" refY="5" orient="auto" markerUnits="strokeWidth"><path id="targetingArrowHead" d="M 0 0 L 12 5 L 0 10 z"></path></marker></defs><path id="targetingArrowPath" marker-end="url(#targetingArrowMarker)"></path>`;
  svg.style.display = 'none';
  document.body.appendChild(svg);
  const path = svg.querySelector('#targetingArrowPath');

  function nameOf(card){ return String(card?.name || '').trim(); }
  function isTargeted(card){ return Boolean(card && card.type === 'spell' && TARGET_NAMES.has(nameOf(card))); }

  function validTarget(spell, card, zone){
    if (!spell || !card) return false;
    switch(nameOf(spell)){
      case 'シェフのおすすめ':
        return (zone==='shop'||zone==='board') && card.type!=='spell' && card.tribe && !['なし','育成','贈り物'].includes(card.tribe);
      case '夢のエッセンス':
        return zone==='board' && typeof card.battlecry==='function';
      case '超覚醒化':
        return zone==='board' && card.type!=='spell' && Number(card.tier)<=5 && !card.awakened && !card.gift;
      case '覚醒化':
        return zone==='board' && card.type!=='spell' && !card.awakened && !card.gift;
      case 'ドッペルゲンガーの奇策':
        return zone==='board' && card.type!=='spell' && typeof card.battlecry==='function';
      case '熱血パンチ':
        return zone==='board' && card.type!=='spell' && (card.tribe==='海賊' || nameOf(card)==='冷笑フィン');
      case 'ゼレク':
        return zone==='board' && card.type!=='spell';
      default:
        return false;
    }
  }

  function targetAt(element){
    const shopNode = element?.closest?.('.shop-card[data-shop-index]');
    if (shopNode){
      const index=Number(shopNode.dataset.shopIndex), card=state.shop[index];
      if(validTarget(active?.spell,card,'shop')) return {zone:'shop',index,card,node:shopNode};
    }
    const boardNode = element?.closest?.('.board-card[data-board-slot]');
    if (boardNode){
      const index=Number(boardNode.dataset.boardSlot), card=state.board[index];
      if(validTarget(active?.spell,card,'board')) return {zone:'board',index,card,node:boardNode};
    }
    return null;
  }

  function clear(){ document.querySelectorAll('.targeting-valid,.targeting-hover,.targeting-source').forEach(n=>n.classList.remove('targeting-valid','targeting-hover','targeting-source')); }
  function highlight(){
    clear();
    if(!active)return;
    active.source.classList.add('targeting-source');
    document.querySelectorAll('.shop-card[data-shop-index]').forEach(n=>{const c=state.shop[Number(n.dataset.shopIndex)];if(validTarget(active.spell,c,'shop'))n.classList.add('targeting-valid')});
    document.querySelectorAll('.board-card[data-board-slot]').forEach(n=>{const c=state.board[Number(n.dataset.boardSlot)];if(validTarget(active.spell,c,'board'))n.classList.add('targeting-valid')});
  }
  function arrow(x,y){
    if(!active)return;
    const {x:sx,y:sy}=active.start, bend=Math.max(40,Math.abs(x-sx)*.25);
    path.setAttribute('d',`M ${sx} ${sy} C ${sx} ${sy-bend}, ${x} ${y+bend}, ${x} ${y}`);
  }

  function begin(index,node,event){
    const spell=state.hand[index];
    if(!isTargeted(spell)||state.gameOver)return false;
    const r=node.getBoundingClientRect();
    active={index,spell,source:node,start:{x:r.left+r.width/2,y:r.top+r.height/2}};
    highlight();
    if(!document.querySelector('.targeting-valid')){log(`${spell.name}の対象にできるカードがない。`);active=null;clear();return false;}
    event.preventDefault();event.stopPropagation();
    svg.style.display='block';arrow(event.clientX,event.clientY);
    log(`${spell.name}：対象まで矢印を伸ばして離してください。`);
    return true;
  }

  function move(event){
    if(!active)return;
    event.preventDefault();arrow(event.clientX,event.clientY);
    document.querySelectorAll('.targeting-hover').forEach(n=>n.classList.remove('targeting-hover'));
    targetAt(document.elementFromPoint(event.clientX,event.clientY))?.node.classList.add('targeting-hover');
  }

  function resolveHeatPunch(target){
    if(!target?.card || state.board[target.index]!==target.card)return false;
    const card=target.card;
    if(typeof card.deathrattle==='function'){
      const triggerCount=card.reborn?2:1;
      for(let index=0;index<triggerCount;index+=1)card.deathrattle(state,target.index);
    }
    if(typeof card.onDestroyed==='function')card.onDestroyed(state,target.index);
    state.board[target.index]=null;
    const before=Math.max(0,num(state.score));
    state.score=before*2;
    log(`熱血パンチ：${card.name}を破壊し、現在のスコアを${before}から${state.score}にした。`);
    return true;
  }

  function resolveTarget(spell,target){
    const name=nameOf(spell);
    if(name==='シェフのおすすめ'){
      const pool=MINIONS.filter(c=>c.tribe===target.card.tribe && c.name!==target.card.name && Number(c.tier)<=Number(state.tavernTier));
      if(pool.length) gainCardToHand(state,randomFrom(pool),`${target.card.tribe}のカードを1枚得た。`);
      return;
    }
    if(name==='夢のエッセンス'){
      target.card.battlecry?.(state);return;
    }
    if(name==='超覚醒化'||name==='覚醒化'){
      target.card.awakened=true;
      if(target.card.awakenedText)target.card.text=target.card.awakenedText;
      log(`${target.card.name}を覚醒させた。`);return;
    }
    if(name==='熱血パンチ'){
      resolveHeatPunch(target);return;
    }
    if(name==='ゼレク'){
      if(state.hand.length<HAND_LIMIT)state.hand.push(typeof initializedClone==='function'?initializedClone(target.card):cloneCard(target.card));
      return;
    }
    if(name==='ドッペルゲンガーの奇策'){
      if(state.hand.length>=HAND_LIMIT-1)return;
      const original=MINIONS.find(c=>c.name===target.card.name) || target.card;
      state.hand.push(target.card);
      state.hand.push(typeof initializedClone==='function'?initializedClone(original):cloneCard(original));
      state.board[target.index]=null;
    }
  }

  function cloneHistoryCard(spell){
    return typeof initializedClone==='function' ? initializedClone(spell) : typeof cloneCard==='function' ? cloneCard(spell) : {...spell};
  }

  function recordSpellUse(spell){
    state.cardsPlayedThisTurn=num(state.cardsPlayedThisTurn)+1;
    if([1,2].includes(num(spell.tier))){
      state.tier2SpellHistory=Array.isArray(state.tier2SpellHistory)?state.tier2SpellHistory:[];
      state.tier2SpellHistory.push(cloneHistoryCard(spell));
    }
    state.spellHistoryThisTurn=Array.isArray(state.spellHistoryThisTurn)?state.spellHistoryThisTurn:[];
    state.spellHistoryThisTurn.push(cloneHistoryCard(spell));
  }

  function additionalActivations(spell){
    let repeats=0;
    if(typeof window.consumeAcidTaurenSpellRepeats==='function') repeats+=Math.max(0,num(window.consumeAcidTaurenSpellRepeats()));
    if(nameOf(spell)!=='一時的な時間改竄' && num(state.timeRewriteCharges)>0){
      state.timeRewriteCharges=Math.max(0,num(state.timeRewriteCharges)-1);
      repeats+=1;
    }
    if(num(state.doubleSpellCharges)>0){
      state.doubleSpellCharges=Math.max(0,num(state.doubleSpellCharges)-1);
      repeats+=1;
    }
    return repeats;
  }

  function finish(event){
    if(!active)return;
    event.preventDefault();event.stopPropagation();
    const targeting=active, target=targetAt(document.elementFromPoint(event.clientX,event.clientY));
    active=null;svg.style.display='none';path.setAttribute('d','');clear();suppressClickUntil=Date.now()+500;
    if(!target){log(`${targeting.spell.name}の対象指定をキャンセルした。`);render();return;}

    const repeats=additionalActivations(targeting.spell);
    resolveTarget(targeting.spell,target);
    for(let index=0;index<repeats;index+=1) resolveTarget(targeting.spell,target);
    recordSpellUse(targeting.spell);
    if(typeof notifyBoard==='function'){
      for(let index=0;index<=repeats;index+=1) notifyBoard('onSpellCast',state,targeting.spell);
    }

    state.hand.splice(targeting.index,1);
    updateAuras();
    render();
  }

  const oldShop=renderShop;
  renderShop=function(){oldShop();[...shopGridEl.children].forEach((n,i)=>n.dataset.shopIndex=i)};
  const oldBoard=renderBoard;
  renderBoard=function(){oldBoard();[...boardSlotsEl.children].forEach(n=>{if(n.dataset.boardSlot==null)return;})};
  const oldHand=renderHand;
  renderHand=function(){oldHand();[...handGridEl.children].forEach((n,i)=>{n.dataset.handIndex=i;const c=state.hand[i];if(isTargeted(c)){n.draggable=false;n.title='カードから対象へ矢印を伸ばして使用'}})};

  document.addEventListener('pointerdown',event=>{const n=event.target.closest?.('.hand-card[data-hand-index]');if(n)begin(Number(n.dataset.handIndex),n,event)},true);
  document.addEventListener('pointermove',move,true);
  document.addEventListener('pointerup',finish,true);
  document.addEventListener('pointercancel',finish,true);
  document.addEventListener('click',event=>{const n=event.target.closest?.('.hand-card[data-hand-index]');if(!n)return;const c=state.hand[Number(n.dataset.handIndex)];if(isTargeted(c)||Date.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()}},true);

  render();
},{once:true});