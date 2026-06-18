/*
 * Legacy compatibility shim.
 *
 * Tavern tiers, upgrade discounts, turn gold, and turn timers are now handled
 * by acidic_rain_core_rules.js, acidic_rain_turn_rules.js, and
 * acidic_rain_timer_rules.js. This file remains only because older entry pages
 * may still request it.
 */
window.__legacyTavernProgressionLoaded = true;
