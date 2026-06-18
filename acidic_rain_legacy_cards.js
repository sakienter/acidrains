/*
 * Legacy bootstrap data retained only for non-card game primitives.
 *
 * The old prototype card pool used to live in this file. Loading those cards
 * before the tier modules caused old and new versions of the same card to
 * coexist or retain stale effect methods. The authoritative card pool is now
 * built exclusively from cards/minions/tier*.js and cards/spells/tier*.js.
 */

const HEROES = [
  {
    id: 'sindragosa',
    name: 'シンドラゴサ',
    emoji: '🐉',
    power: '凍結した酒場のカードは、次のターン開始時に +2/+2 を得る。',
    tag: '凍結育成',
    onTurnStart(state) {
      state.shop.forEach(card => {
        if (card?.frozen) {
          card.atk += 2;
          card.hp += 2;
        }
      });
    },
  },
  {
    id: 'millhouse',
    name: 'ミルハウス',
    emoji: '⚡',
    power: 'リロールのたびに1コインを得る。',
    tag: '高速リロール',
    onReroll(state) {
      state.gold += 1;
    },
  },
  {
    id: 'brann',
    name: 'ブラン',
    emoji: '🦁',
    power: '自分の雄叫びは2回発動する。',
    tag: '雄叫び倍化',
    battlecryMultiplier: 2,
  },
];

const EVOLUTION_STAGES = [
  { at: 0, name: '苗床', emoji: '🫧', text: 'まだ弱いが、リロールに反応しはじめた。' },
  { at: 3, name: '腐食胞子', emoji: '🦠', text: '育つたびに酸性降雨へ +1/+1。' },
  { at: 6, name: '毒雨核', emoji: '☣️', text: '育つたびに酸性降雨へ +2/+2。' },
  { at: 9, name: '終末菌床', emoji: '👁️', text: '育つたびに酸性降雨へ +3/+3。' },
];

const A = (card, normal, awakened) => card?.awakened ? awakened : normal;
const gainMany = (state, pool, count, message) => {
  for (let index = 0; index < count; index += 1) {
    gainCardToHand(state, randomFrom(pool), index === 0 ? message : null);
  }
};
const randomMinions = predicate => MINIONS.filter(predicate);
const randomSpells = predicate => SPELLS.filter(predicate);

// Authoritative tier modules populate these arrays after registration.
const MINIONS = [];
const SPELLS = [];
