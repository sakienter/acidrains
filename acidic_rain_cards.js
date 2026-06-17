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
    { id:"brann_spell", name:"ブランスペル", emoji:"🦁", tier:2, cost:3, text:"このターン中、雄叫びが2回発動する。", type:"spell", cast(state){ activateBrannSpell(state); } },
    { id:"war_drum", name:"陣太鼓", emoji:"🥁", tier:2, cost:1, text:"このターン中、次に使う雄叫びは追加で2回発動する。", type:"spell", cast(state){ activateWarDrum(state); } },
    { id:"headhunter", name:"ヘッドハンター", emoji:"🎯", tier:2, cost:3, text:"雄叫びミニオンを1体発見する。", type:"spell", cast(state){ castHeadhunter(state); } },
    { id:"scroll", name:"スクロール", emoji:"📜", tier:2, cost:5, text:"現在の自分のTierのミニオン1枚と、スペル1枚を発見する。", type:"spell", cast(state){ castScroll(state); } },
    { id:"dream_essence", name:"夢のエッセンス", emoji:"💭", tier:2, cost:2, text:"自陣の雄叫びミニオンを選ぶ。その雄叫びを発動する。", type:"spell", cast(state){ castDreamEssence(state); } },
    { id:"chip_bin", name:"チップビン", emoji:"🪙", tier:2, cost:3, text:"2コイン得る。このゲームの上限コインが2コイン増える。", type:"spell", cast(state){ castChipBin(state); } },
    { id:"drakkari", name:"ドラッカリ", emoji:"🌙", tier:2, cost:3, text:"このターン、ターン終了時効果が2回発動する。", type:"spell", cast(state){ activateDrakkari(state); } },
    { id:"temporary_time_rewrite", name:"一時的な時間改竄", emoji:"🕰️", tier:3, cost:5, text:"このターン、次に使う3回のスペルは追加で1回発動される。", type:"spell", cast(state){ activateTemporaryTimeRewrite(state); } },
    { id:"zerek", name:"ゼレク", emoji:"🧬", tier:3, cost:6, text:"自陣のカードのコピーを1枚得る。", type:"spell", cast(state){ castZerek(state); } },
    { id:"time_transcendence", name:"時空の超越", emoji:"⏳", tier:3, cost:7, text:"リミットターンの猶予を1増やす。", type:"spell", cast(state){ extendTurnLimit(state); } },
    { id:"awakening", name:"覚醒化", emoji:"✨", tier:3, cost:4, text:"自陣のTier1カードを1枚選んで覚醒させる。", type:"spell", cast(state){ castAwakeningSpell(state); } }
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
document.write('<script defer src="./acidic_rain_engine_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_turn_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_hud_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_mode_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_discover_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_tier3_spell_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_tier2_spell_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_targeting_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_auto_tier_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_tier6_progression_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_discover_ui_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_rightmost_slot_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_start_screen_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_shop_size_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_excel_cards.js"><\/script>');
document.write('<script defer src="./acidic_rain_display_fix.js"><\/script>');
document.write('<script defer src="./acidic_rain_named_icons.js"><\/script>');
document.write('<script defer src="./acidic_rain_turn_schedule.js"><\/script>');
document.write('<script defer src="./acidic_rain_katakana_cleanup.js"><\/script>');
document.write('<script defer src="./acidic_rain_authoritative_patch.js"><\/script>');
