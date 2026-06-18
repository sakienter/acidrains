(() => {
  const n=v=>Number(v||0), A=(c,a,b)=>c?.awakened?b:a, H=()=>typeof HAND_LIMIT==='number'?HAND_LIMIT:10;
  const logx=m=>{if(typeof log==='function'&&m)log(m)}, pick=p=>p.length?p[Math.floor(Math.random()*p.length)]:null;
  const clone=c=>typeof initializedClone==='function'?initializedClone(c):typeof cloneCard==='function'?cloneCard(c):{...c};
  const pool=a=>(a||[]).filter(c=>c&&!c.token&&c.shopEligible!==false);
  const fragNames=new Set(['円盤の破片']);

  function add(s,t,msg='',extra={}){
    if(!t)return false;
    if(!Array.isArray(s.hand)||s.hand.length>=H()){logx('手札がいっぱい。');return false;}
    const c={...clone(t),...extra}, u=Math.max(0,n(c.unlockTier));
    if(u&&n(s.tavernTier,1)<u&&c.originalTextBeforeUnlock===undefined){c.originalTextBeforeUnlock=c.text||'';c.text=`${c.originalTextBeforeUnlock}（酒場グレード${u}になるまで使用不可）`;}
    if(typeof gainCardToHand==='function')return gainCardToHand(s,c,msg)!==false;
    s.hand.push(c);logx(msg);return true;
  }
  function many(s,t,c,msg='',extra={}){let g=0;for(let i=0;i<c;i++){if(!add(s,t,i?'' :msg,extra))break;g++;}return g;}
  function spell(s,name,c){const t=SPELLS.find(x=>x?.name===name);return t?many(s,t,c,`${name} を得た。`):(logx(`${name} が見つからない。`),0);}
  function discover(s,p,c,title){const q=pool(p);if(!q.length){logx(`${title}：候補がない。`);return 0;}if(typeof discoverCards==='function'){discoverCards(s,q,c,title);return c;}let g=0;for(let i=0;i<c;i++){if(!add(s,pick(q),i?'':title))break;g++;}return g;}
  function time(s,sec){const x=Math.max(0,n(sec)),resume=!s.isPaused&&s.hasStarted&&!s.gameOver&&typeof pauseAcidTurnTimer==='function'&&typeof resumeAcidTurnTimer==='function';if(resume)pauseAcidTurnTimer();s.turnTimeRemaining=Math.max(0,n(s.turnTimeRemaining))+x;s.turnTimeLimit=Math.max(n(s.turnTimeLimit),s.turnTimeRemaining);if(resume)resumeAcidTurnTimer();logx(`残り時間が${x}秒増えた。`);}
  function reward(){return typeof createAwakeningRewardSpell==='function'?createAwakeningRewardSpell():{id:'awakening_reward',name:'覚醒報酬',emoji:'🌟',tier:0,cost:0,type:'spell',token:true,shopEligible:false,text:'現在の酒場グレード+1のミニオンを発見する。'};}
  function combine(s){let changed=false;while(Array.isArray(s?.hand)){const ix=s.hand.map((c,i)=>fragNames.has(c?.name)||c?.fragmentMaterial?i:-1).filter(i=>i>=0);if(ix.length<2)break;s.hand.splice(ix[1],1);s.hand.splice(ix[0],1);s.hand.push(reward());changed=true;logx('円盤の破片2枚が「覚醒報酬」になった。');}return changed;}
  function addFrag(s){const t=SPELLS.find(x=>x?.name==='円盤の破片');if(!t){logx('円盤の破片が見つからない。');return false;}const ok=add(s,t,'円盤の破片を得た。');if(ok)combine(s);return ok;}
  function rightBuff(s,v){s.tier1DuneAfterRerollAtk=n(s.tier1DuneAfterRerollAtk)+v;s.tier1DuneAfterRerollHp=n(s.tier1DuneAfterRerollHp)+v;}
  function adjacent(s,self,times){const i=s.board.indexOf(self);if(i<2)return;[i-1,i+1].forEach(k=>{const c=s.board[k];if(c&&typeof c.battlecry==='function')for(let r=0;r<times;r++)c.battlecry(s);});}
  function awaken(c){if(!c||c.type==='spell'||c.awakened)return false;c.awakened=true;if(c.awakenedText)c.text=c.awakenedText;return true;}
  function awakenShop(s,count){for(let x=0;x<count;x++){const e=(s.shop||[]).map((c,i)=>({c,i})).filter(v=>v.c&&v.c.type!=='spell'&&!v.c.awakened);if(!e.length){logx('酒場に覚醒できるミニオンがいない。');break;}let z=e[0];if(e.length>1&&typeof prompt==='function'){const lines=e.map((v,i)=>`${i+1}. ${v.c.name} (${v.c.atk}/${v.c.hp})`).join('\n');z=e[Number(prompt(`エリーズ：覚醒させるミニオンを選択\n${lines}`,'1'))-1]||e[0];}if(awaken(z.c))logx(`${z.c.name}を覚醒させた。`);}}
  function repeatSpell(s,sp){if(!sp||typeof sp.cast!=='function')return;if(sp.name==='エンドロール'){const b=Math.floor(Math.max(0,n(s.turnTimeRemaining))/10);s.nextTurnGoldBonus=n(s.nextTurnGoldBonus)+b;return;}sp.cast(s);}
  function taurenRepeats(s){const a=(s.board||[]).filter((c,i)=>i>=2&&c?.name==='魔術をつかうトーレン'&&n(c.turnTriggers)<A(c,1,2));a.forEach(c=>c.turnTriggers=n(c.turnTriggers)+1);return a;}

  const definitions=[
    {id:'tier4_shark',name:'サメ',emoji:'🦈',cost:3,atk:4,hp:4,tribe:'獣',text:'雄叫び：獣を1枚発見する。',awakenedText:'雄叫び：獣を2枚発見する。'},
    {id:'tier4_lyrak',name:'ライラク',emoji:'🦜',cost:3,atk:3,hp:4,tribe:'獣',text:'ターン終了時：このカードに隣接する雄叫びを発動する。',awakenedText:'ターン終了時：このカードに隣接する雄叫びを2回発動する。'},
    {id:'tier4_instruction_fin',name:'指示フィン',emoji:'👉',cost:3,atk:1,hp:1,tribe:'マーロック',text:'雄叫び：「燃えた海賊旗」を1枚得る。',awakenedText:'雄叫び：「燃えた海賊旗」を2枚得る。'},
    {id:'tier4_mamakome_fin',name:'ママコメフィン',emoji:'🐟',cost:3,atk:1,hp:5,tribe:'マーロック',text:'雄叫び：このターンの残り時間を15秒追加する。',awakenedText:'雄叫び：このターンの残り時間を30秒追加する。'},
    {id:'tier4_night_pirate',name:'夜型の海賊',emoji:'🌙',cost:3,atk:5,hp:6,tribe:'海賊',text:'ターン終了時：次のターン4G得る。',awakenedText:'ターン終了時：次のターン8G得る。'},
    {id:'tier4_curious_pirate',name:'物好きな海賊',emoji:'🧐',cost:3,atk:1,hp:4,tribe:'海賊',text:'このカードが自陣にいる限り、自分が8回のリロールをすると、「円盤の破片」を1枚得る。',awakenedText:'このカードが自陣にいる限り、自分が4回のリロールをすると、「円盤の破片」を1枚得る。'},
    {id:'tier4_marimo_captain',name:'まりも船長',emoji:'🏴‍☠️',cost:3,atk:4,hp:4,tribe:'海賊',text:'このカードが破壊された時、この対戦中に酒場を入替した後、その右端のミニオン1体に+12/+12を付与する。',awakenedText:'このカードが破壊された時、この対戦中に酒場を入替した後、その右端のミニオン1体に+24/+24を付与する。'},
    {id:'tier4_engine',name:'エンジン',emoji:'⚙️',cost:3,atk:4,hp:4,tribe:'エレメンタル',text:'雄叫び：この対戦中に酒場を入替した後、その右端のミニオン1体に+7/+7を付与する。',awakenedText:'雄叫び：この対戦中に酒場を入替した後、その右端のミニオン1体に+14/+14を付与する。'},
    {id:'tier4_sakamaki',name:'さかまき',emoji:'🌪️',cost:3,atk:2,hp:2,tribe:'エレメンタル',text:'雄叫び：ランダムなエレメンタルを1枚得る。',awakenedText:'雄叫び：ランダムなエレメンタルを2枚得る。'},
    {id:'tier4_swap_anomaly',name:'入れ替え異常体',emoji:'🔄',cost:3,atk:2,hp:4,tribe:'エレメンタル',text:'雄叫び：次のリロールコストが0になる効果を2回得る。',awakenedText:'雄叫び：次のリロールコストが0になる効果を4回得る。'},
    {id:'tier4_dreaming_naga',name:'夢見るナーガ',emoji:'💤',cost:3,atk:4,hp:1,tribe:'ナーガ',text:'雄叫び：ティア6カードをランダムに1枚得る。それは酒場をグレード6にするまで使えない。',awakenedText:'雄叫び：ティア6カードをランダムに2枚得る。それらは酒場をグレード6にするまで使えない。'},
    {id:'tier4_friend_naga',name:'友達のナーガ',emoji:'🤝',cost:3,atk:3,hp:5,tribe:'ナーガ',text:'このカードを売った時、ティア3以下のナーガを1枚発見する。',awakenedText:'このカードを売った時、ティア3以下のナーガを2枚発見する。'},
    {id:'tier4_shore_explorer',name:'磯の探検家',emoji:'🧭',cost:3,atk:4,hp:4,tribe:'なし',text:'雄叫び：自陣にいない種族のミニオンを1体発見する。',awakenedText:'雄叫び：自陣にいない種族のミニオンを2体発見する。'},
    {id:'tier4_brann_egg',name:'ブランの卵',emoji:'🥚',cost:3,atk:1,hp:1,tribe:'なし',text:'ターン終了時：ランダムな雄叫びミニオンを2枚得る。',awakenedText:'ターン終了時：ランダムな雄叫びミニオンを4枚得る。'},
    {id:'tier4_magic_tauren',name:'魔術をつかうトーレン',emoji:'🪄',cost:3,atk:4,hp:4,tribe:'なし',text:'1ターンに1度、スペル1枚が追加でもう1回発動する。',awakenedText:'1ターンに2度、スペル1枚が追加でもう1回発動する。'},
    {id:'tier4_elise',name:'エリーズ',emoji:'🗺️',cost:3,atk:5,hp:5,tribe:'なし',text:'このカードが自陣にいる限り、自分が5回のリロールをすると、酒場のミニオン1体を覚醒させる。',awakenedText:'このカードが自陣にいる限り、自分が5回のリロールをすると、酒場のミニオン2体を覚醒させる。'},
    {id:'tier4_musician',name:'音楽家',emoji:'🎵',cost:3,atk:5,hp:4,tribe:'なし',text:'売却時：「ビートチェック」を1枚得る。',awakenedText:'売却時：「ビートチェック」を2枚得る。'}
  ];

  const effects={
    'サメ':()=>({battlecry(s){discover(s,MINIONS.filter(c=>c.tribe==='獣'&&n(c.tier)<=n(s.tavernTier)&&c.name!==this.name),A(this,1,2),'サメ：獣を発見');}}),
    'ライラク':()=>({onTurnEnd(s){adjacent(s,this,A(this,1,2));}}),
    '指示フィン':()=>({battlecry(s){spell(s,'燃えた海賊旗',A(this,1,2));}}),
    'ママコメフィン':()=>({battlecry(s){time(s,A(this,15,30));}}),
    '夜型の海賊':()=>({onTurnEnd(s){s.nextTurnGoldBonus=n(s.nextTurnGoldBonus)+A(this,4,8);}}),
    '物好きな海賊':()=>({init(c){c.rerollProgress=n(c.rerollProgress);},onRerollCount(s){const t=A(this,8,4);this.rerollProgress=n(this.rerollProgress)+1;while(this.rerollProgress>=t){this.rerollProgress-=t;addFrag(s);}}}),
    'まりも船長':()=>({onDestroyed(s){rightBuff(s,A(this,12,24));}}),
    'エンジン':()=>({battlecry(s){rightBuff(s,A(this,7,14));}}),
    'さかまき':()=>({battlecry(s){const p=pool(MINIONS).filter(c=>c.tribe==='エレメンタル'&&n(c.tier)<=n(s.tavernTier));for(let i=0;i<A(this,1,2);i++)add(s,pick(p),i?'':'ランダムなエレメンタルを得た。');}}),
    '入れ替え異常体':()=>({battlecry(s){s.freeRerolls=n(s.freeRerolls)+A(this,2,4);}}),
    '夢見るナーガ':()=>({battlecry(s){const p=pool([...MINIONS,...SPELLS]).filter(c=>n(c.tier)===6);for(let i=0;i<A(this,1,2);i++)add(s,pick(p),i?'':'ティア6カードを得た。',{unlockTier:6});}}),
    '友達のナーガ':()=>({onSell(s){discover(s,MINIONS.filter(c=>c.tribe==='ナーガ'&&n(c.tier)<=3&&c.name!==this.name),A(this,1,2),'友達のナーガ：ナーガを発見');}}),
    '磯の探検家':()=>({battlecry(s){const have=new Set((s.board||[]).filter((c,i)=>i>=2&&c&&!['なし','育成',''].includes(c.tribe)).map(c=>c.tribe));discover(s,MINIONS.filter(c=>c.tribe&&!['なし','育成'].includes(c.tribe)&&!have.has(c.tribe)&&n(c.tier)<=n(s.tavernTier)&&c.name!==this.name),A(this,1,2),'磯の探検家：未所持種族を発見');}}),
    'ブランの卵':()=>({onTurnEnd(s){const p=pool(MINIONS).filter(c=>typeof c.battlecry==='function'&&n(c.tier)<=n(s.tavernTier));for(let i=0;i<A(this,2,4);i++)add(s,pick(p),i?'':`雄叫びミニオンを${A(this,2,4)}枚得た。`);}}),
    '魔術をつかうトーレン':()=>({init(c){c.turnTriggers=n(c.turnTriggers);}}),
    'エリーズ':()=>({init(c){c.rerollProgress=n(c.rerollProgress);},onRerollCount(s){this.rerollProgress=n(this.rerollProgress)+1;while(this.rerollProgress>=5){this.rerollProgress-=5;awakenShop(s,A(this,1,2));}}}),
    '音楽家':()=>({onSell(s){spell(s,'ビートチェック',A(this,1,2));}})
  };

  function apply(){
    if(typeof state!=='undefined'){state.tier1DuneAfterRerollAtk=n(state.tier1DuneAfterRerollAtk);state.tier1DuneAfterRerollHp=n(state.tier1DuneAfterRerollHp);combine(state);}
    window.consumeAcidTaurenSpellRepeats=()=>taurenRepeats(state).length;
    if(!window.__tier4FragPlay&&typeof playHandCardToSlot==='function'){
      window.__tier4FragPlay=true;const prev=playHandCardToSlot;
      playHandCardToSlot=function(i,t){combine(state);const c=state.hand?.[i];if(c&&(fragNames.has(c.name)||c.fragmentMaterial)){logx('円盤の破片は使用できない。');render?.();return false;}return prev(i,t);};
    }
    if(!window.__tier4TaurenRepeat&&typeof playHandCardToSlot==='function'){
      window.__tier4TaurenRepeat=true;const prev=playHandCardToSlot;
      playHandCardToSlot=function(i,t){const sp=state.hand?.[i],src=sp?.type==='spell'?taurenRepeats(state):[];const r=prev(i,t);if(!r){src.forEach(c=>c.turnTriggers=Math.max(0,n(c.turnTriggers)-1));return r;}for(let x=0;x<src.length;x++){repeatSpell(state,sp);if(typeof notifyBoard==='function')notifyBoard('onSpellCast',state,sp);}if(src.length)logx(`${sp.name}が追加で${src.length}回発動した。`);return r;};
    }
    window.__tier4MinionEffectsImplemented=definitions.map(c=>c.name);
  }

  window.AcidTier4Minions={definitions,effects,apply};
})();