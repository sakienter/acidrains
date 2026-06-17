/* Remove pronunciation/analysis annotations imported from the spreadsheet. */
(() => {
  const tribes = ['エレメンタル','獣','ナーガ','ドラゴン','マーロック','海賊','悪魔','アンデッド','メカ','キルボア','なし'];
  const markers = [
    'オタケビ','シュウリョウジ','ノコリジカン','ノコリジカ','ツギノ','ツギニ','ツカウ','ツイカ','ハツドウ',
    'ジジン','エランデ','ジョキョスル','エル','ハッケン','ゲンザイ','バイ','カクセイ','フエル','サンセイ',
    'ヨゲンシャ','ジカン','ランダム','トク','ウッタトキ','ツカエナイ','コスト','セイチョウ','カイゾク',
    'ケモノ','ショウシュウ','シンメ','セキユ','ダイロッカン','ボウエンキョウ','マンゲキョウ','ジクウ',
    'チョウエツ','ショウゾウガ','タイコ','ユメ','ガケ','トオザカル','ヒガシ','カゼ','カクシ','トビラ',
    'ハケン','サギョウ','モエタ','カイゾクキ','ハタ','ハジケタ','イチジテキナ','ジカンカ'
  ];
  const markerPattern = new RegExp(`(?:${markers.sort((a,b)=>b.length-a.length).join('|')})(?:[ァ-ヶーA-Za-z0-9０-９Ｇ・ー ]*)$`, 'u');

  function cleanEffect(value) {
    let text = String(value || '').trim();
    text = text.replace(/([。！？])(?:[ァ-ヶーA-Za-z0-9０-９Ｇ・ー ]+)$/u, '$1');
    text = text.replace(markerPattern, '');
    text = text.replace(/\s{2,}/g, ' ').trim();
    return text;
  }

  function cleanTribe(value) {
    const raw = String(value || '').trim();
    const found = tribes.find(tribe => raw.startsWith(tribe));
    return found || raw;
  }

  function cleanCard(card) {
    if (!card) return;
    card.tribe = cleanTribe(card.tribe);
    card.text = cleanEffect(card.text);
    if (card.awakenedText) card.awakenedText = cleanEffect(card.awakenedText);
  }

  function cleanAll() {
    if (typeof MINIONS !== 'undefined' && Array.isArray(MINIONS)) MINIONS.forEach(cleanCard);
    if (typeof SPELLS !== 'undefined' && Array.isArray(SPELLS)) SPELLS.forEach(cleanCard);
    if (typeof state !== 'undefined' && state) {
      (state.shop || []).forEach(cleanCard);
      (state.hand || []).forEach(cleanCard);
      (state.board || []).forEach(cleanCard);
    }
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    cleanAll();
    if (typeof render === 'function') render();
    if (tries >= 100) clearInterval(timer);
  }, 50);

  window.addEventListener('load', cleanAll);

  const finalRules = document.createElement('script');
  finalRules.src = './acidic_rain_final_rules.js';
  finalRules.async = false;
  document.head.appendChild(finalRules);
})();