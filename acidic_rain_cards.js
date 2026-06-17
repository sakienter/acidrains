/*
 * Loader for the expanded Acidic Rain card set.
 * The immutable card-data snapshot is loaded first, then the rule extension
 * is deferred until the main game script has finished defining its engine.
 */
document.write('<script src="https://cdn.jsdelivr.net/gh/sakienter/acidrains@eccf3cffd645d8d07df07e3056c1c0b2c42085fb/acidic_rain_cards.js"><\/script>');
document.write('<script defer src="./acidic_rain_rules.js"><\/script>');
