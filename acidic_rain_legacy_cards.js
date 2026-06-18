const HEROES = [
  { id:"sindragosa", name:"シンドラゴサ", emoji:"🐉", power:"凍結した酒場のカードは、次のターン開始時に +2/+2 を得る。", tag:"凍結育成", onTurnStart(state){ state.shop.forEach(c=>{if(c&&c.frozen){c.atk+=2;c.hp+=2;}}); } },
  { id:"millhouse", name:"ミルハウス", emoji:"⚡", power:"リロールのたびに1コインを得る。", tag:"高速リロール", onReroll(state){ state.gold+=1; } },
  { id:"brann", name:"ブラン", emoji:"🦁", power:"自分の雄叫びは2回発動する。", tag:"雄叫び倍化", battlecryMultiplier:2 },
];

const EVOLUTION_STAGES = [
  { at:0, name:"苗床", emoji:"🫧", text:"まだ弱いが、リロールに反応しはじめた。" },
  { at:3, name:"腐食胞子", emoji:"🦠", text:"育つたびに酸性降雨へ +1/+1。" },
  { at:6, name:"毒雨核", emoji:"☣️", text:"育つたびに酸性降雨へ +2/+2。" },
  { at:9, name:"終末菌床", emoji:"👁️", text:"育つたびに酸性降雨へ +3/+3。" },
];

const A = (card, normal, awakened) => card.awakened ? awakened : normal;
const gainMany = (state, pool, count, message) => { for(let i=0;i<count;i+=1) gainCardToHand(state, randomFrom(pool), i===0?message:null); };
const randomMinions = (predicate) => MINIONS.filter(predicate);
const randomSpells = (predicate) => SPELLS.filter(predicate);

const MINIONS = [
  { id:"scout", name:"斥候", emoji:"🔭", tier:1, cost:3, atk:1, hp:1, tribe:"なし", text:"売却時：種族なしカードを1枚発見する。", awakenedText:"売却時：種族なしカードを2枚発見する。", onSell(state){ discoverCards(state, randomMinions(c=>c.tribe==="なし"&&c.id!==this.id), A(this,1,2), "種族なしカードを発見"); } },
  { id:"sakamaki", name:"坂巻風", emoji:"🌀", tier:1, cost:3, atk:4, hp:4, tribe:"エレメンタル", text:"雄叫び：ランダムなエレメンタルを1枚得る。", awakenedText:"雄叫び：ランダムなエレメンタルを2枚得る。", battlecry(state){ gainMany(state, randomMinions(c=>c.tribe==="エレメンタル"&&c.id!==this.id), A(this,1,2), "坂巻風がエレメンタルを呼んだ。"); } },
  { id:"lyrak", name:"ライラク", emoji:"🦌", tier:1, cost:3, atk:3, hp:4, tribe:"獣", text:"断末魔：隣接するカードの雄叫びを発動する。", awakenedText:"断末魔：隣接するカードの雄叫びを2回発動する。", deathrattle(state,index){ triggerAdjacentBattlecries(state,index,A(this,1,2)); } },
  { id:"shark", name:"サメ", emoji:"🦈", tier:1, cost:3, atk:2, hp:2, tribe:"獣", text:"雄叫び：ランダムな獣を1枚得る。", awakenedText:"雄叫び：ランダムな獣を2枚得る。", battlecry(state){ gainMany(state, randomMinions(c=>c.tribe==="獣"&&c.id!==this.id), A(this,1,2), "サメが獣を連れてきた。"); } },
  { id:"okamon", name:"おかもん", emoji:"🥛", tier:1, cost:3, atk:3, hp:4, tribe:"エレメンタル", text:"酒場にスペルが1枚多く並ぶ。", awakenedText:"酒場にスペルが2枚多く並ぶ。", aura(state){ state.extraSpellShop+=A(this,1,2); } },
  { id:"swapbody", name:"入れ替え異常体", emoji:"🔀", tier:1, cost:3, atk:2, hp:4, tribe:"エレメンタル", text:"雄叫び：次のリロールコストが0になるを2回得る。", awakenedText:"雄叫び：次のリロールコストが0になるを4回得る。", battlecry(state){ state.freeRerolls+=A(this,2,4); } },
  { id:"engine", name:"エンジン", emoji:"⚙️", tier:1, cost:3, atk:4, hp:4, tribe:"エレメンタル", text:"雄叫び：酒場の右端のミニオンに+7/+7。", awakenedText:"雄叫び：酒場の右端のミニオンに+14/+14。", battlecry(state){ const t=getRightmostShopCard(state); const n=A(this,7,14); if(t&&t.type!=="spell"){t.atk+=n;t.hp+=n;} } },
  { id:"trumpeter", name:"トランペッター", emoji:"🎺", tier:1, cost:3, atk:5, hp:5, tribe:"エレメンタル", text:"カードを4枚売ると、自身以外のランダムなエレメンタルを1枚得る。", awakenedText:"カードを4枚売ると、自身以外のランダムなエレメンタルを2枚得る。", init(card){ card.sellProgress=0; }, onAnySell(state){ this.sellProgress=(this.sellProgress||0)+1; while(this.sellProgress>=4){this.sellProgress-=4;gainMany(state,randomMinions(c=>c.tribe==="エレメンタル"&&c.id!==this.id),A(this,1,2),"トランペッターがエレメンタルを呼んだ。");} } },
  { id:"prophet", name:"不吉な預言者", emoji:"🌑", tier:1, cost:3, atk:2, hp:1, tribe:"ナーガ", text:"雄叫び：次に買う呪文は1コイン値下げされる。", awakenedText:"雄叫び：次に買う呪文は2コイン値下げされる。", battlecry(state){ state.nextSpellDiscount+=A(this,1,2); } },
  { id:"snow_elemental", name:"雪のエレメンタル", emoji:"❄️", tier:1, cost:3, atk:3, hp:3, tribe:"エレメンタル", text:"酒場にエレメンタルが1枚追加で並ぶ。", awakenedText:"酒場にエレメンタルが2枚追加で並ぶ。", aura(state){ state.extraElementalShop+=A(this,1,2); } },
  { id:"busker", name:"大道芸人", emoji:"🎪", tier:1, cost:3, atk:3, hp:1, tribe:"海賊", text:"雄叫び：次のフェーズのコイン上限を1引き上げる。", awakenedText:"雄叫び：次のフェーズのコイン上限を2引き上げる。", battlecry(state){ state.nextTurnGoldBonus=(state.nextTurnGoldBonus||0)+A(this,1,2); } },
  { id:"drake", name:"ブルークロマドレイク", emoji:"🐲", tier:1, cost:3, atk:3, hp:3, tribe:"ドラゴン", text:"雄叫び：ランダムなTier1スペルを1枚得る。", awakenedText:"雄叫び：ランダムなTier1スペルを2枚得る。", battlecry(state){ gainMany(state,randomSpells(c=>c.tier===1),A(this,1,2),"Tier1スペルを得た。"); } },
  { id:"uremental", name:"ウレメンタル", emoji:"💧", tier:1, cost:3, atk:3, hp:3, tribe:"エレメンタル", text:"売却時：「おつり」を1枚得る。", awakenedText:"売却時：「おつり」を2枚得る。", onSell(state){ gainToken(state,"change",A(this,1,2)); } },
  { id:"rodeo", name:"ロデオ名人", emoji:"🤠", tier:1, cost:3, atk:4, hp:4, tribe:"なし", text:"雄叫び：スペルを1枚発見する。", awakenedText:"雄叫び：スペルを2枚発見する。", battlecry(state){ discoverCards(state,SPELLS,A(this,1,2),"スペルを発見"); } },
  { id:"beacon", name:"ビーコンオブホープ", emoji:"🕯️", tier:1, cost:3, atk:5, hp:5, tribe:"なし", text:"雄叫び：現在のTierのカードをランダムに1枚得る。", awakenedText:"雄叫び：現在のTierのカードをランダムに2枚得る。", battlecry(state){ gainMany(state,MINIONS.filter(c=>c.tier===state.tavernTier&&c.id!==this.id),A(this,1,2),"同Tierカードを得た。"); } },
  { id:"tauren", name:"トーレン", emoji:"🐮", tier:1, cost:3, atk:4, hp:4, tribe:"なし", text:"1ターンに1回、スペルを2回唱える。", awakenedText:"1ターンに2回、スペルを2回唱える。", aura(state){ state.doubleSpellCharges+=A(this,1,2); } },
  { id:"wavecaller", name:"雪崩のよびて", emoji:"🏔️", tier:1, cost:3, atk:3, hp:3, tribe:"エレメンタル", text:"雄叫び：次に売るカードのスタッツを全ての酸性降雨に乗せる。", awakenedText:"雄叫び：次の2回、売るカードのスタッツを全ての酸性降雨に乗せる。", battlecry(state){ state.pendingSellRainAbsorb+=A(this,1,2); } },
  { id:"shell_whistler", name:"貝笛師", emoji:"🐚", tier:1, cost:3, atk:2, hp:3, tribe:"ナーガ", text:"ランダムなTier2スペルを1枚得る。", awakenedText:"ランダムなTier2スペルを2枚得る。", onPlay(state){ gainMany(state,randomSpells(c=>c.tier===2),A(this,1,2),"Tier2スペルを得た。"); } },
  { id:"reborn_snake", name:"蘇りヘビ", emoji:"🐍", tier:1, cost:3, atk:5, hp:1, tribe:"獣", text:"雄叫び：獣に蘇りを付与する。", awakenedText:"雄叫び：獣に蘇りを付与する。", battlecry(state){ selectBoardCard(state,c=>c.tribe==="獣",c=>{c.reborn=true;},"蘇りを付ける獣を選択"); } },
  { id:"waverling", name:"ウェーブリング", emoji:"🌊", tier:1, cost:3, atk:5, hp:1, tribe:"エレメンタル", text:"スペルを唱えるたび、酒場右端のミニオンに+3/+3。", awakenedText:"スペルを唱えるたび、酒場右端のミニオンに+6/+6。", onSpellCast(state){ const t=getRightmostShopCard(state),n=A(this,3,6);if(t&&t.type!=="spell"){t.atk+=n;t.hp+=n;} } },
  { id:"alleycat", name:"野良猫", emoji:"🐈", tier:1, cost:3, atk:1, hp:1, tribe:"獣", text:"雄叫び：猫トークンを1匹召喚する。", awakenedText:"雄叫び：猫トークンを2匹召喚する。", battlecry(state){ summonToken(state,"cat",A(this,1,2)); } },
  { id:"sporebat", name:"スポアバット", emoji:"🦇", tier:1, cost:3, atk:3, hp:1, tribe:"獣", text:"断末魔：Tier1・2のランダムなスペルを2枚得る。", awakenedText:"断末魔：Tier1・2のランダムなスペルを4枚得る。", deathrattle(state){ gainMany(state,randomSpells(c=>c.tier<=2),A(this,2,4),"スポアバットの断末魔。"); } },
  { id:"coldlight", name:"コールドライト", emoji:"🐟", tier:1, cost:3, atk:3, hp:1, tribe:"マーロック", text:"ランダムなTier1スペルを1枚得る。", awakenedText:"ランダムなTier1スペルを2枚得る。", onPlay(state){ gainMany(state,randomSpells(c=>c.tier===1),A(this,1,2),"Tier1スペルを得た。"); } },
  { id:"shore_explorer", name:"磯の探検家", emoji:"🧭", tier:1, cost:3, atk:1, hp:1, tribe:"なし", text:"雄叫び：自陣にいない種族のミニオンを1体発見する。", awakenedText:"雄叫び：自陣にいない種族のミニオンを2体発見する。", battlecry(state){ const tribes=new Set(state.board.filter(Boolean).map(c=>c.tribe));discoverCards(state,MINIONS.filter(c=>c.tribe!=="なし"&&!tribes.has(c.tribe)),A(this,1,2),"未所持種族を発見"); } },
  { id:"boatswain", name:"船頭", emoji:"⛵", tier:1, cost:3, atk:1, hp:1, tribe:"マーロック", text:"売却時：ランダムなTier1の種族ありカードを発見する。", awakenedText:"売却時：ランダムなTier1の種族ありカードを2枚発見する。", onSell(state){ discoverCards(state,MINIONS.filter(c=>c.tier===1&&c.tribe!=="なし"),A(this,1,2),"Tier1種族カードを発見"); } },
  { id:"brewmaster", name:"酒場の酒造大師", emoji:"🍺", tier:1, cost:3, atk:2, hp:2, tribe:"なし", text:"雄叫び：自身以外の自陣カード1枚を手札に戻す。", awakenedText:"雄叫び：自身以外の自陣カード1枚を手札に戻す。", battlecry(state){ returnBoardCardToHand(state,c=>c.id!==this.id); } },

  { id:"lucky_wind", name:"不運を吹き去る風雲児", emoji:"🍃", tier:2, cost:3, atk:4, hp:4, tribe:"エレメンタル", text:"売却時：エレメンタルを1枚発見する。", awakenedText:"売却時：エレメンタルを2枚発見する。", onSell(state){ discoverCards(state,MINIONS.filter(c=>c.tribe==="エレメンタル"),A(this,1,2),"エレメンタルを発見"); } },
  { id:"minion_brann", name:"ブラン", emoji:"🦁", tier:2, cost:3, atk:2, hp:4, tribe:"なし", text:"自分の雄叫びは2回発動する。", awakenedText:"自分の雄叫びは3回発動する。", aura(state){ state.battlecryMultiplier=Math.max(state.battlecryMultiplier,A(this,2,3)); } },
  { id:"recycle", name:"リサイクルレイス", emoji:"♻️", tier:2, cost:3, atk:5, hp:4, tribe:"エレメンタル", text:"エレメンタルを場に出すたび、次の1回のリロールコストが0になる。", awakenedText:"エレメンタルを場に出すたび、次の2回のリロールコストが0になる。", onElementalPlayed(state){ state.freeRerolls+=A(this,1,2); } },
  { id:"air_revenant", name:"エアーレヴナント", emoji:"🌬️", tier:2, cost:3, atk:6, hp:6, tribe:"エレメンタル", text:"自陣にいる限り、7コイン使う度に「東よりの風」を唱える。", awakenedText:"自陣にいる限り、7コイン使う度に「東よりの風」を2回唱える。", init(card){card.goldProgress=0;}, onGoldSpent(state,amount){this.goldProgress=(this.goldProgress||0)+amount;while(this.goldProgress>=7){this.goldProgress-=7;for(let i=0;i<A(this,1,2);i+=1)castTokenSpell(state,"east_wind");}} },
  { id:"hamul", name:"ハムウル", emoji:"🦌", tier:2, cost:3, atk:4, hp:4, tribe:"なし", text:"雄叫び：酒場をリロールし、自陣の最多種族だけを並べる。", awakenedText:"雄叫び：酒場を2回リロールし、自陣の最多種族だけを並べる。", battlecry(state){ rerollShopByDominantTribe(state,A(this,1,2)); } },
  { id:"elise_minion", name:"エリーズ", emoji:"🌿", tier:2, cost:3, atk:5, hp:5, tribe:"なし", text:"6回リロールするたび、ランダムなTier3カードを1枚得る。", awakenedText:"6回リロールするたび、ランダムなTier3カードを2枚得る。", init(card){card.rerollProgress=0;}, onRerollCount(state){this.rerollProgress=(this.rerollProgress||0)+1;while(this.rerollProgress>=6){this.rerollProgress-=6;gainMany(state,MINIONS.filter(c=>c.tier===3),A(this,1,2),"エリーズがTier3カードを届けた。");}} },
  { id:"arcadas", name:"アーケイダス", emoji:"🗿", tier:2, cost:3, atk:6, hp:6, tribe:"なし", text:"雄叫び：自身を除くランダムなTier2カードを1枚得る。", awakenedText:"雄叫び：自身を除くランダムなTier2カードを2枚得る。", battlecry(state){gainMany(state,MINIONS.filter(c=>c.tier===2&&c.id!==this.id),A(this,1,2),"Tier2カードを得た。");} },
  { id:"draconic_deathscale_naga", name:"ドラコニック・デススケイル", emoji:"🐉", tier:2, cost:3, atk:5, hp:5, tribe:"ナーガ", text:"雄叫び：「夢のエッセンス」を1枚得る。", awakenedText:"雄叫び：「夢のエッセンス」を2枚得る。", battlecry(state){gainToken(state,"dream_essence",A(this,1,2));} },
  { id:"draconic_deathscale_dragon", name:"ドラコニック・デススケイル", emoji:"🐲", tier:2, cost:3, atk:5, hp:5, tribe:"ドラゴン", text:"雄叫び：「夢のエッセンス」を1枚得る。", awakenedText:"雄叫び：「夢のエッセンス」を2枚得る。", battlecry(state){gainToken(state,"dream_essence",A(this,1,2));} },
  { id:"ghastcoiler", name:"ガストコイラー", emoji:"🐍", tier:2, cost:3, atk:6, hp:6, tribe:"獣", text:"断末魔：Tier1・2のランダムミニオンを3枚得る。", awakenedText:"断末魔：Tier1・2のランダムミニオンを6枚得る。", deathrattle(state){gainMany(state,MINIONS.filter(c=>c.tier<=2),A(this,3,6),"ガストコイラーの断末魔。");} },
  { id:"akari", name:"アカリ", emoji:"🔥", tier:2, cost:3, atk:3, hp:3, tribe:"獣", text:"雄叫び：手札のスペル1枚を選び、コピーを1枚追加する。", awakenedText:"雄叫び：コピーを2枚追加する。", battlecry(state){copyHandSpell(state,A(this,1,2));} },
  { id:"outlands", name:"アウトランズ", emoji:"🌋", tier:2, cost:3, atk:4, hp:4, tribe:"エレメンタル", text:"雄叫び：Tier1～3のスペルを1枚発見する。", awakenedText:"雄叫び：Tier1～3のスペルを2枚発見する。", battlecry(state){discoverCards(state,SPELLS,A(this,1,2),"スペルを発見");} },

  { id:"acidic_rain_copy", name:"酸性降雨", emoji:"🌧️", tier:3, cost:3, atk:6, hp:6, tribe:"エレメンタル", text:"4回リロールするたび、酒場右端のミニオンのスタッツを得る。", awakenedText:"4回リロールするたび、酒場右端のミニオンのスタッツを2倍得る。", init(card){card.rerollProgress=0;}, onRerollCount(state){this.rerollProgress=(this.rerollProgress||0)+1;while(this.rerollProgress>=4){this.rerollProgress-=4;const t=getRightmostShopCard(state),m=A(this,1,2);if(t&&t.type!=="spell"){this.atk+=(t.atk||0)*m;this.hp+=(t.hp||0)*m;}}} },
  { id:"surprise_elemental", name:"意外精", emoji:"✨", tier:3, cost:3, atk:6, hp:6, tribe:"エレメンタル", text:"雄叫び：自陣のエレメンタル1枚を覚醒させる。", awakenedText:"雄叫び：自陣のエレメンタル2枚を覚醒させる。", battlecry(state){awakenBoardElementals(state,A(this,1,2),this.id);} },
  { id:"magicfin", name:"マジックフィン", emoji:"🪄", tier:3, cost:3, atk:3, hp:5, tribe:"マーロック", text:"スペルを買うと、買ったスペルを発動するトークンを得る（1ターンに1度）。", awakenedText:"同効果（1ターンに2度）。", init(card){card.turnTriggers=0;}, onSpellBought(state,spell){const limit=A(this,1,2);if((this.turnTriggers||0)<limit){this.turnTriggers+=1;gainReplayToken(state,spell);}} },
  { id:"lantern_larva", name:"ランタンラーバ", emoji:"🏮", tier:3, cost:3, atk:4, hp:4, tribe:"エレメンタル", text:"エレメンタルを売った時、その未強化コピーを得る（1ターンに1度）。", awakenedText:"同効果（1ターンに2度）。", init(card){card.turnTriggers=0;}, onElementalSold(state,sold){const limit=A(this,1,2);if((this.turnTriggers||0)<limit){this.turnTriggers+=1;const base=MINIONS.find(c=>c.id===sold.id);if(base)gainCardToHand(state,base,"未強化コピーを得た。");}} },
  { id:"timewarped_seer", name:"時渡りの預言者", emoji:"⏳", tier:3, cost:3, atk:8, hp:8, tribe:"ナーガ", text:"毎ターン、酒場の呪文2つのコストが0になる（あと2回）。", awakenedText:"毎ターン、酒場の呪文4つのコストが0になる（あと4回）。", onTurnStart(state){makeShopSpellsFree(state,A(this,2,4));} },
  { id:"maxwell", name:"マクスウェル", emoji:"🎁", tier:3, cost:3, atk:1, hp:1, tribe:"獣", text:"売却時：ランダムな贈り物タグカードを1枚得る。", awakenedText:"売却時：ランダムな贈り物タグカードを2枚得る。", onSell(state){gainToken(state,"gift",A(this,1,2));} },
  { id:"reno", name:"レノ", emoji:"🎩", tier:3, cost:3, atk:5, hp:5, tribe:"なし", text:"売却時：「時空の超越」を1枚得る。", awakenedText:"売却時：「時空の超越」を2枚得る。", onSell(state){gainToken(state,"time_transcendence",A(this,1,2));} },
];

const SPELLS = [
  { id:"fertilizer", name:"酸性肥料", emoji:"🧪", tier:1, cost:1, text:"苗床の育成値+2。", type:"spell", cast(state){state.seedGrowth+=2;} },
  { id:"forecast", name:"予報更新", emoji:"📜", tier:1, cost:1, text:"次のリロールを1回無料にする。", type:"spell", cast(state){state.freeRerolls+=1;} },
  { id:"acidburst", name:"酸裂き", emoji:"💥", tier:2, cost:2, text:"酸性降雨に+4/+4。", type:"spell", cast(state){buffRain(state,4,4);} },
  { id:"germinate", name:"培養暴走", emoji:"🫗", tier:2, cost:2, text:"苗床を即座に1段階進化させる。", type:"spell", cast(state){state.seedGrowth=Math.max(state.seedGrowth,nextStageThreshold(state.seedGrowth));} },
  { id:"tavernstorm", name:"暴風の酒場", emoji:"🌪️", tier:3, cost:3, text:"酒場の全ミニオンに+3/+3。", type:"spell", cast(state){state.shop.forEach(c=>{if(c&&c.type!=="spell"){c.atk+=3;c.hp+=3;}});} },
];
