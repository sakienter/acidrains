/*
 * Acidic Rain card bootstrap.
 *
 * Card data is loaded first. Tier-specific effect implementations live only in
 * cards/minions/tier1.js ... tier6.js and cards/spells/tier1.js ... tier6.js.
 * Root-level rule files are reserved for game-wide systems shared by cards.
 */
document.write('<script src="./acidic_rain_legacy_cards.js"><\/script>');
document.write(`<script>
  /* Temporary spell-pool declarations. Effect handlers are attached by the
     corresponding cards/spells/tier*.js module. */
  SPELLS.splice(0, SPELLS.length,
    { id:"chef_recommendation", name:"シェフのおすすめ", emoji:"🍽️", tier:1, cost:2, text:"酒場または、自分の盤面の種族ありカード1枚を選ぶ。同名ではない同じ種族のカードをランダムに1枚得る。", type:"spell" },
    { id:"east_wind", name:"東からの風", emoji:"🌬️", tier:1, cost:1, text:"このゲーム中、酒場の右端のカードは+6/+6を得る。", type:"spell" },
    { id:"careful_investment", name:"慎重な投資", emoji:"💰", tier:1, cost:1, text:"次のターン、2コイン得る。", type:"spell" },
    { id:"telescope", name:"望遠鏡", emoji:"🔭", tier:1, cost:4, text:"自分の盤面で一番多い種族のカードを発見する。", type:"spell" },
    { id:"kaleidoscope", name:"万華鏡", emoji:"🔮", tier:1, cost:5, text:"自分の盤面で一番多い種族のTier3カードを発見する。ただし、このターンはそのカードを手札から使えない。", type:"spell" },
    { id:"catalog_flip", name:"カタログパラパラ", emoji:"📖", tier:1, cost:1, text:"リロールを2回分0コストにする。", type:"spell" },
    { id:"losing_ticket", name:"はずれくじ", emoji:"🎟️", tier:1, cost:1, text:"ランダムなTier1カードを1枚得る。", type:"spell" },
    { id:"brann_spell", name:"ブランスペル", emoji:"🦁", tier:2, cost:3, text:"このターン中、雄叫びが2回発動する。", type:"spell" },
    { id:"war_drum", name:"陣太鼓", emoji:"🥁", tier:2, cost:1, text:"このターン中、次に使う雄叫びは追加で2回発動する。", type:"spell" },
    { id:"headhunter", name:"ヘッドハンター", emoji:"🎯", tier:2, cost:3, text:"雄叫びミニオンを1体発見する。", type:"spell" },
    { id:"scroll", name:"スクロール", emoji:"📜", tier:2, cost:5, text:"現在の自分のTierのミニオン1枚と、スペル1枚を発見する。", type:"spell" },
    { id:"dream_essence", name:"夢のエッセンス", emoji:"💭", tier:2, cost:2, text:"自陣の雄叫びミニオンを選ぶ。その雄叫びを発動する。", type:"spell" },
    { id:"chip_bin", name:"チップビン", emoji:"🪙", tier:2, cost:3, text:"2コインを得る。このゲーム中、初期ゴールドを2増やす。", type:"spell" },
    { id:"drakkari", name:"ドラッカリ", emoji:"🌙", tier:2, cost:3, text:"このターン、ターン終了時効果が2回発動する。", type:"spell" },
    { id:"temporary_time_rewrite", name:"一時的な時間改竄", emoji:"🕰️", tier:3, cost:5, text:"このターン、次に使う3回のスペルは追加で1回発動される。", type:"spell" },
    { id:"zerek", name:"ゼレク", emoji:"🧬", tier:3, cost:6, text:"自陣のカードのコピーを1枚得る。", type:"spell" },
    { id:"time_transcendence", name:"時空の超越", emoji:"⏳", tier:3, cost:7, text:"リミットターンの猶予を1増やす。", type:"spell" },
    { id:"awakening", name:"覚醒化", emoji:"✨", tier:3, cost:4, text:"自陣のTier1カードを1枚選んで覚醒させる。", type:"spell" }
  );
<\/script>`);

/* Shared game systems. These files must not contain individual card effects. */
document.write('<script defer src="./acidic_rain_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_stat_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_awaken_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_layout_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_turn_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_hud_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_discover_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_play_restrictions.js"><\/script>');
document.write('<script defer src="./acidic_rain_targeting_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_start_screen_rules.js"><\/script>');

/* The only authoritative locations for tier-specific card effects. */
document.write('<script defer src="./cards/common.js"><\/script>');
document.write('<script defer src="./cards/minions/tier1.js"><\/script>');
document.write('<script defer src="./cards/minions/tier1_pool_guard.js"><\/script>');
document.write('<script defer src="./cards/minions/tier2.js"><\/script>');
document.write('<script defer src="./cards/minions/tier3.js"><\/script>');
document.write('<script defer src="./cards/minions/tier4.js"><\/script>');
document.write('<script defer src="./cards/minions/tier5.js"><\/script>');
document.write('<script defer src="./cards/minions/tier6.js"><\/script>');
document.write('<script defer src="./cards/spells/tier1.js"><\/script>');
document.write('<script defer src="./cards/spells/tier2.js"><\/script>');
document.write('<script defer src="./cards/spells/tier3.js"><\/script>');
document.write('<script defer src="./cards/spells/tier4.js"><\/script>');
document.write('<script defer src="./cards/spells/tier5.js"><\/script>');
document.write('<script defer src="./cards/spells/tier6.js"><\/script>');

document.write('<link rel="stylesheet" href="./acidic_rain_card_theme.css">');
document.write('<link rel="stylesheet" href="./acidic_rain_hand_fit.css">');
document.write('<link rel="stylesheet" href="./acidic_rain_requested_ui.css">');
document.write('<link rel="stylesheet" href="./acidic_rain_reference_layout_fix.css">');
document.write('<link rel="stylesheet" href="./acidic_rain_visual_refresh.css">');
document.write('<script defer src="./acidic_rain_hand_spacing.js"><\/script>');
document.write('<script defer src="./acidic_rain_rebuild.js"><\/script>');
document.write('<script defer src="./acidic_rain_core_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_card_event_bridge.js"><\/script>');
document.write('<script defer src="./acidic_rain_turn_refresh_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_timer_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_discover_ui_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_awakening_reward_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_turn_transition_rules.js"><\/script>');
document.write('<script defer src="./acidic_rain_reference_layout.js"><\/script>');
