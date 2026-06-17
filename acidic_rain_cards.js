/*
 * Loader for the expanded Acidic Rain card set.
 * The immutable card-data snapshot is loaded first, then the spell pool is
 * replaced locally before the game engine starts.
 */
document.write('<script src="https://cdn.jsdelivr.net/gh/sakienter/acidrains@eccf3cffd645d8d07df07e3056c1c0b2c42085fb/acidic_rain_cards.js"><\/script>');
document.write(`<script>
  SPELLS.splice(0, SPELLS.length,
    { id:"chef_recommendation", name:"シェフのおすすめ", emoji:"🍽️", tier:1, cost:2, text:"酒場または自分の盤面の種族ありカード1枚を選ぶ。同名ではない同じ種族のカードをランダムに1枚得る。", type:"spell", cast(state){ castChefRecommendation(state); } },
    { id:"east_wind", name:"東からの風", emoji:"🌬️", tier:1, cost:1, text:"このゲーム中、酒場の右端のカードは+6/+6を得る。", type:"spell", cast(state){ state.eastWindStacks=(state.eastWindStacks||0)+1; applyEastWindToRightmost(state); } },
    { id:"careful_investment", name:"慎重な投資", emoji:"💰", tier:1, cost:1, text:"次のターン、2コイン得る。", type:"spell", cast(state){ state.nextTurnGoldBonus=(state.nextTurnGoldBonus||0)+2; } },
    { id:"telescope", name:"望遠鏡", emoji:"🔭", tier:1, cost:4, text:"自分の盤面で一番多い種族のカードを発見する。", type:"spell", cast(state){ discoverDominantTribeCard(state,false); } },
    { id:"kaleidoscope", name:"万華鏡", emoji:"🔮", tier:1, cost:5, text:"自分の盤面で一番多い種族のTier3カードを発見する。ただし、このターンはそのカードを手札から使えない。", type:"spell", cast(state){ discoverDominantTribeCard(state,true); } },
    { id:"catalog_flip", name:"カタログパラパラ", emoji:"📖", tier:1, cost:1, text:"リロールを2回分0コストにする。", type:"spell", cast(state){ state.freeRerolls=(state.freeRerolls||0)+2; } },
    { id:"losing_ticket", name:"はずれくじ", emoji:"🎟️", tier:1, cost:1, text:"ランダムなTier1カードを1枚得る。", type:"spell", cast(state){ gainRandomTierOneCard(state); } },

    { id:"brann_spell", name:"ブランスペル", emoji:"🦁", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"war_drum", name:"陣太鼓", emoji:"🥁", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"flowing_branch", name:"流れ枝", emoji:"🌿", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"remember_the_beginning", name:"初心を忘れない", emoji:"🌱", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"scroll", name:"スクロール", emoji:"📜", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"dream_essence", name:"夢のエッセンス", emoji:"💭", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"chip_bin", name:"チップビン", emoji:"🪙", tier:2, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },

    { id:"sindragosa_mode", name:"シンドラゴサモード", emoji:"🐉", tier:3, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"millhouse_mode", name:"ミルハウスモード", emoji:"⚡", tier:3, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"time_transcendence", name:"時空の超越", emoji:"⏳", tier:3, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} },
    { id:"awakening", name:"覚醒化", emoji:"✨", tier:3, cost:0, text:"コスト・効果未設定", type:"spell", cast(state){} }
  );
<\/script>`);
document.write('<script defer src="./acidic_rain_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_hotfix.js"><\/script>');
document.write('<script defer src="./acidic_rain_stat_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_awaken_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_progress_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_performance_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_layout_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_spell_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_drag_fix.js"><\/script>');
