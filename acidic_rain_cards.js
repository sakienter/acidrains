/*
 * Acidic Rain card bootstrap.
 *
 * Base card data is loaded first. Tier-specific definitions and effects are
 * installed by cards/minions/tier*.js and cards/spells/tier*.js.
 */
document.write('<script src="./acidic_rain_legacy_cards.js"><\/script>');
document.write(`<script>
  /* Authoritative tavern spell pool for Tiers 1 through 6. */
  SPELLS.splice(0, SPELLS.length,
    { id:"coin", name:"コイン", emoji:"🪙", tier:1, cost:1, text:"1ゴールド得る。", type:"spell" },
    { id:"sprout", name:"新芽", emoji:"🌱", tier:1, cost:3, text:"ティア1のミニオンを1枚発見する。", type:"spell" },
    { id:"recruit", name:"召集", emoji:"📯", tier:1, cost:2, text:"ティア1のミニオンを1枚得る。", type:"spell" },
    { id:"disk_fragment", name:"円盤の破片", emoji:"💿", tier:1, cost:3, text:"このカードは手札で2枚集めると、合体して消滅し「覚醒報酬」になる。", type:"spell" },
    { id:"magic_area", name:"マジックエリア", emoji:"🪄", tier:1, cost:2, text:"酒場に呪文を並べる。", type:"spell" },
    { id:"muddy_water", name:"どろみず", emoji:"🟤", tier:1, cost:1, text:"このターンの残り時間を5秒追加する。", type:"spell" },

    { id:"chef_recommendation", name:"シェフのおすすめ", emoji:"🍽️", tier:2, cost:2, text:"酒場または、自分の盤面の種族ありカード1枚を選ぶ。同名ではない同じ種族のカードをランダムに1枚得る。", type:"spell" },
    { id:"losing_ticket", name:"はずれくじ", emoji:"🎟️", tier:2, cost:2, text:"ランダムなティア1カードを1枚得る。", type:"spell" },
    { id:"careful_investment", name:"慎重な投資", emoji:"💰", tier:2, cost:1, text:"次のターン、2ゴールド得る。", type:"spell" },
    { id:"burst_coin_pouch", name:"弾けたコインポーチ", emoji:"👛", tier:2, cost:1, text:"3ゴールド得る。次のターンの開始時2ゴールド失う。", type:"spell" },
    { id:"catalog_flip", name:"カタログパラパラ", emoji:"📖", tier:2, cost:1, text:"2回分のリロールコストを0にする。", type:"spell" },
    { id:"letter_pack", name:"レターパック", emoji:"📮", tier:2, cost:2, text:"20秒操作不能になる。次のターン3ゴールド得る。", type:"spell" },
    { id:"end_roll", name:"エンドロール", emoji:"🎬", tier:2, cost:2, text:"自分のターンを終了する。発動時の残り時間10秒につき、次のターン1ゴールドを得る。", type:"spell" },
    { id:"oil", name:"石油", emoji:"🛢️", tier:2, cost:3, text:"このゲームのゴールドの上限を1増やす。", type:"spell" },

    { id:"sixth_sense", name:"第六感", emoji:"👁️", tier:3, cost:4, text:"このターンの終了時：自分のグレードと同じティアのミニオンとスペルを1枚ずつ得る。", type:"spell" },
    { id:"burnt_pirate_flag", name:"燃えた海賊旗", emoji:"🏴", tier:3, cost:2, text:"自陣の海賊を破壊する。ランダムなスペルを2枚得る。", type:"spell" },
    { id:"step_away_from_cliff", name:"崖から遠ざかる", emoji:"🧗", tier:3, cost:1, text:"次のターン、1ゴールド得て、時間が15秒増える。", type:"spell" },
    { id:"pilfering", name:"ちょろまかし", emoji:"🫳", tier:3, cost:2, text:"次に発動する、ミニオンを売った時の効果は2回発動する。", type:"spell" },
    { id:"beat_check", name:"ビートチェック", emoji:"🎧", tier:3, cost:3, text:"酒場グレードアップのコストを半分にする。（小数点は切り上げ）", type:"spell" },
    { id:"east_wind", name:"東からの風", emoji:"🌬️", tier:3, cost:1, text:"このゲーム中、酒場の右端のカードは+6/+6を得る。", type:"spell" },
    { id:"desperate_reach", name:"喉から手がでる", emoji:"✋", tier:3, cost:1, text:"残り時間を30秒減らす。4ゴールド得る。", type:"spell" },
    { id:"hallelujah", name:"ハレルヤ", emoji:"🎶", tier:3, cost:1, text:"この対戦中に酒場を入れ替えた後、酒場の右端のミニオン1体に+X/+Xを付与する。（Xはこのターン使用したカードの数）", type:"spell" },
    { id:"info_product", name:"情報商材", emoji:"💻", tier:3, cost:3, text:"「石油」を1枚得る。「慎重な投資」を1枚得る。", type:"spell" },

    { id:"spell_box", name:"スペルボックス", emoji:"📦", tier:4, cost:3, text:"合計5コストになるように、スペルをランダムな枚数得る。", type:"spell" },
    { id:"hidden_door", name:"隠し扉", emoji:"🚪", tier:4, cost:1, text:"このターンの残り時間を30秒追加する。", type:"spell" },
    { id:"telescope", name:"望遠鏡", emoji:"🔭", tier:4, cost:4, text:"自分の盤面で一番多い種族のカードを発見する。", type:"spell" },
    { id:"dispatch_work", name:"派遣作業", emoji:"🧰", tier:4, cost:3, text:"ランダムな種族なしミニオンを1枚得る。", type:"spell" },
    { id:"drakkari", name:"ドラッカリ", emoji:"🌙", tier:4, cost:2, text:"このターン、ターン終了時の効果は2回発動される。（重複しない）", type:"spell" },
    { id:"premium_moisture_pack", name:"高級保湿パック", emoji:"🧴", tier:4, cost:5, text:"ティア3、ティア4のエレメンタルをランダムに1枚ずつ得る。", type:"spell" },
    { id:"war_drum", name:"陣太鼓", emoji:"🥁", tier:4, cost:2, text:"このターン、次に使う雄叫びは3回発動する。", type:"spell" },

    { id:"growth_scroll", name:"成長のスクロール", emoji:"📜", tier:5, cost:4, text:"自分のグレードのミニオン1枚とスペル1枚を発見する。", type:"spell" },
    { id:"kaleidoscope", name:"万華鏡", emoji:"🔮", tier:5, cost:3, text:"ティア6のミニオンを発見する。それはこのターン使えない。", type:"spell" },
    { id:"marimo_portrait", name:"マリモの肖像画", emoji:"🖼️", tier:5, cost:5, text:"「酸性降雨」と「エンジン」を1枚ずつ得る。", type:"spell" },
    { id:"rebound", name:"リバウンド", emoji:"↩️", tier:5, cost:2, text:"ターンの終了時：このターンに使ったスペルをランダムに3枚得る。", type:"spell" },
    { id:"dream_essence", name:"夢のエッセンス", emoji:"💭", tier:5, cost:3, text:"自陣の雄叫びミニオンを選ぶ。その雄叫びを発動する。", type:"spell" },
    { id:"flash", name:"閃光", emoji:"⚡", tier:5, cost:1, text:"6回分のリロールコストを0にする。", type:"spell" },
    { id:"high_tea", name:"ハイティー", emoji:"🫖", tier:5, cost:4, text:"酒場をリロールする。そのリロールには、ティア5のカードしか並ばない。", type:"spell" },

    { id:"time_transcendence", name:"時空の超越", emoji:"⏳", tier:6, cost:8, text:"リミットターンの猶予を1増やす。", type:"spell" },
    { id:"temporary_time_rewrite", name:"一時的な時間改竄", emoji:"🕰️", tier:6, cost:3, text:"このターン、次に使うスペルは追加で1回発動される。", type:"spell" },
    { id:"doppelganger_tactic", name:"ドッペルゲンガーの奇策", emoji:"👥", tier:6, cost:5, text:"自陣の雄叫びミニオンを1枚手札に戻す。その同名カードを1枚得る。", type:"spell" },
    { id:"super_awakening", name:"超覚醒化", emoji:"🌟", tier:6, cost:5, text:"自陣のティア5以下のミニオンを1枚選び、覚醒させる。", type:"spell" },
    { id:"large_spell_box", name:"でかいスペルボックス", emoji:"🧰", tier:6, cost:4, text:"合計10コストになるように、ランダムにスペルを得る。", type:"spell" },
    { id:"binge_eating", name:"ドカ食い", emoji:"🍱", tier:6, cost:4, text:"残り時間を30秒減らす。ティア5カードをランダムに3枚得る。", type:"spell" },
    { id:"human_error", name:"ヒューマンエラー", emoji:"⚠️", tier:6, cost:4, text:"リミットターンを2ターン減らす。ティア6ミニオンを3回発見する。", type:"spell" }
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
document.write('<script defer src="./cards/minions/tier4_helpers.js"><\/script>');
document.write('<script defer src="./cards/minions/tier4.js"><\/script>');
document.write('<script defer src="./cards/minions/tier5.js"><\/script>');
document.write('<script defer src="./cards/minions/tier6.js"><\/script>');
document.write('<script defer src="./cards/minions/tier6_surprise.js"><\/script>');
document.write('<script defer src="./cards/minions/neutral_expansion.js"><\/script>');
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
document.write('<link rel="stylesheet" href="./acidic_rain_card_containment_fix.css">');
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
document.write('<script defer src="./acidic_rain_pause_rules.js"><\/script>');