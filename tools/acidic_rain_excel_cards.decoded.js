/* Generated from acidcards.xlsx. Excel is the authoritative card list. */
(async () => {
  const EXCEL_CARD_DATA = {"spells":[{"id":"excel_spell_1","name":"コイン","tier":1,"cost":1,"text":"１G 得る。エル"},{"id":"excel_spell_2","name":"新芽","tier":1,"cost":3,"text":"ティア１のミニオンを1枚発見する。ハッケンスル"},{"id":"excel_spell_3","name":"召集","tier":1,"cost":2,"text":"ティア１のミニオンを1枚得る。エル"},{"id":"excel_spell_4","name":"未知の円盤の破片","tier":1,"cost":3,"text":"このカードは手札で２枚集めると、合体して消滅し「覚醒報酬」になる。テフダニ アツメルト ガッタイシテ ショウメツシ カクセイ ホウシュウ"},{"id":"excel_spell_5","name":"石油","tier":1,"cost":3,"text":"このゲームのゴールドの上限を１増やす。ジョウゲン フヤス"},{"id":"excel_spell_6","name":"シェフのおすすめ","tier":2,"cost":2,"text":"酒場または、自分の盤面の種族ありカードに打てる。同名ではない同じ種族のカードをランダムに1枚得る。"},{"id":"excel_spell_7","name":"はずれくじ","tier":2,"cost":2,"text":"ランダムなティア１カードを1枚得る。エル"},{"id":"excel_spell_8","name":"慎重な投資","tier":2,"cost":1,"text":"次のターン、２コイン得る。"},{"id":"excel_spell_9","name":"弾けたコインポーチ","tier":2,"cost":1,"text":"3ゴールド得る。次のターンの開始時2ゴールド失う。lツギノターン カイシジ ウシナウ"},{"id":"excel_spell_10","name":"カタログパラパラ","tier":2,"cost":1,"text":"２回分のリロールコストを0にする。ブン"},{"id":"excel_spell_11","name":"第六感","tier":3,"cost":4,"text":"次、グレードを上げた時、そのグレードのミニオン1枚と、スペル1枚をそれぞれ発見する。ツギ アゲタトキ ハッケン"},{"id":"excel_spell_12","name":"燃えた海賊旗","tier":3,"cost":2,"text":"自陣の海賊を破壊する。ランダムなスペルを2枚得る。ジジン カイゾク ハカイスル エル"},{"id":"excel_spell_13","name":"崖から遠ざかる","tier":3,"cost":1,"text":"次のターン、１コイン得て、時間が10秒増える。ツギ エル ジカン フエル"},{"id":"excel_spell_14","name":"ちょろまかし","tier":3,"cost":2,"text":"次に発動する、「ミニオンを売った時に」という効果は２回発動する。ツギ ハツドウ ウッタトキ コウカ ハツドウ"},{"id":"excel_spell_15","name":"ビートチェック","tier":3,"cost":3,"text":"グレ上げコストを半分にする。（小数点は切り上げ）ハンブン ショウスウテン キリアゲ"},{"id":"excel_spell_16","name":"東からの風","tier":3,"cost":1,"text":"このゲーム中、酒場の右端のカードは+6/+6を得る。ナカ サカバ ミギハシ エル"},{"id":"excel_spell_17","name":"スペルボックス","tier":4,"cost":3,"text":"合計5コストになる様に、スペルをランダムな枚数得る。ゴウケイ マイスウ エル"},{"id":"excel_spell_18","name":"隠し扉","tier":4,"cost":1,"text":"このターンの残り時間を10秒追加する。"},{"id":"excel_spell_19","name":"望遠鏡","tier":4,"cost":4,"text":"自分の盤面で一番多い種族のカードを発見する。ジブン バンメン イチバン オオイ シュゾク ハッケン"},{"id":"excel_spell_20","name":"派遣作業","tier":4,"cost":3,"text":"ランダムな種族なしミニオンを1枚得る。シュゾク エル"},{"id":"excel_spell_21","name":"ドラッカリ","tier":4,"cost":2,"text":"このターン、「ターン終了時」の効果は２回発動される。（重複しない）ジ コウカ ハツドウ チョウフク"},{"id":"excel_spell_22","name":"成長のスクロール","tier":5,"cost":4,"text":"自分のグレードの、ミニオン１枚と、スペル1枚を発見する。ジブン ノマイ ハッケン"},{"id":"excel_spell_23","name":"万華鏡","tier":5,"cost":3,"text":"ティア６のミニオンを発見する。それはこのターン使えない。ハッケンスル ツカエナイ"},{"id":"excel_spell_24","name":"マリモの肖像画","tier":5,"cost":5,"text":"「酸性降雨」と「エンジン」を1枚ずつ得る。サンセイkエル"},{"id":"excel_spell_25","name":"リバウンド","tier":5,"cost":2,"text":"ターンの終了時：このターンに使ったスペルをランダムに5枚得る。シュウリョウジ ツカッタ エル"},{"id":"excel_spell_26","name":"陣太鼓","tier":5,"cost":2,"text":"このターン中、次に使う雄叫びは＋２回発動する。ナカ ツギニ ツカウ オタケビ カイ ハツドウ"},{"id":"excel_spell_27","name":"夢のエッセンス","tier":5,"cost":3,"text":"自陣の雄叫びミニオンを選ぶ。その雄叫びを発動する。"},{"id":"excel_spell_28","name":"時空の超越","tier":6,"cost":7,"text":"リミットターンの猶予を１増やす。ユウヨ フヤス"},{"id":"excel_spell_29","name":"一時的な時間改竄","tier":6,"cost":4,"text":"このターン、次に使う2回のスペルは追加で１回発動される。ツギニ ツカウ ツイカ ハツドウ"},{"id":"excel_spell_30","name":"ドッペルゲンガーの奇策","tier":6,"cost":5,"text":"自陣の雄叫びミニオンを1枚手札に戻す。その同名カードを1枚得る。ジジン オタケビ テフダニ モドス ドウメイカード エル"},{"id":"excel_spell_31","name":"超覚醒化","tier":6,"cost":7,"text":"自陣のカードを1枚選び、覚醒させる。ジジン ノエラビ カクセイ"},{"id":"excel_spell_32","name":"でかいスペルボックス","tier":6,"cost":4,"text":"合計10コストになる様に、ランダムにスペルを得る。ゴウケイ エル"}],"minions":[{"id":"excel_minion_1","name":"野良猫","tier":1,"tribe":"獣","atk":1,"hp":1,"text":"雄叫び：猫を１匹召喚する。オタケビ ネコ ショウカン","awakenedText":"雄叫び：猫を2匹召喚する。オタケビ ネコ ショウカン"},{"id":"excel_minion_2","name":"威嚇するわんこ","tier":1,"tribe":"獣","atk":3,"hp":1,"text":"このカードを売った時、「夢のエッセンス」を1枚得る。それは、自分がグレード４に到達するまで使えない。ウッタトキ ユメ エル ジブン トウタツ ツカエナイ","awakenedText":"このカードを売った時、「夢のエッセンス」を2枚得る。それは、自分がグレード４に到達するまで使えない。ウッタトキ ユメ エル ジブン トウタツ ツカエナイ"},{"id":"excel_minion_3","name":"ショールフィン","tier":1,"tribe":"マーロック","atk":2,"hp":2,"text":"このカードが自陣にいる限り、8コイン使う度に、ランダムなマーロックを1枚得る。","awakenedText":"このカードが自陣にいる限り、8コイン使う度に、ランダムなマーロックを2枚得る。"},{"id":"excel_minion_4","name":"船頭","tier":1,"tribe":"マーロック","atk":1,"hp":1,"text":"このカードを売った時、ランダムなティア１ミニオンを１枚得る。ウッタトキ マイ エル","awakenedText":"このカードを売った時、ランダムなティア１ミニオンを2枚得る。ウッタトキ マイ エル"},{"id":"excel_minion_5","name":"大道芸人","tier":1,"tribe":"海賊","atk":3,"hp":1,"text":"雄叫び：次のターン１G獲得する。オタケビ ツギ カクトク","awakenedText":"雄叫び：次のターン2G獲得する。オタケビ ツギ カクトク"},{"id":"excel_minion_6","name":"甲板磨き","tier":1,"tribe":"海賊","atk":2,"hp":2,"text":"雄叫び：グレード上げのコストを１さげる。オタケビ アゲル","awakenedText":"雄叫び：グレード上げのコストを2さげる。オタケビ アゲル"},{"id":"excel_minion_7","name":"もりもり砂丘","tier":1,"tribe":"エレメンタル","atk":3,"hp":2,"text":"雄叫び：この対戦中に酒場を入替した後、その右端のミニオン1体に+1/+1を付与する。オタケビ ネコ ショウカン","awakenedText":"雄叫び：この対戦中に酒場を入替した後、その右端のミニオン1体に+2/+2を付与する。オタケビ ネコ ショウカン"},{"id":"excel_minion_8","name":"苔マン","tier":1,"tribe":"エレメンタル","atk":4,"hp":1,"text":"ターン終了時：ランダムなエレメンタルを1枚得る。（2ターン毎に１回）シュウリョウジ エル。 ゴト","awakenedText":"ターン終了時：ランダムなエレメンタルを2枚得る。（2ターン毎に１回）シュウリョウジ エル。 ゴト"},{"id":"excel_minion_9","name":"ガチ預言者","tier":1,"tribe":"ナーガ","atk":1,"hp":3,"text":"このカードを売った時、ランダムなティア１スペルを1枚得る。ヲウッタトキ L","awakenedText":"このカードを売った時、ランダムなティア１スペルを2枚得る。ヲウッタトキ L"},{"id":"excel_minion_10","name":"不吉な預言者","tier":1,"tribe":"ナーガ","atk":2,"hp":1,"text":"雄叫び：次に買う呪文は１コイン値下げされる。オタケビ カウ ジュモン ネサゲ","awakenedText":"雄叫び：次に買う呪文は2コイン値下げされる。オタケビ カウ ジュモン ネサゲ"},{"id":"excel_minion_11","name":"癒されるねこ","tier":2,"tribe":"獣","atk":2,"hp":3,"text":"雄叫び：このターンの残り時間を5秒追加する。オタケビ ：ノコリジカ ジカン ツイカ","awakenedText":"雄叫び：このターンの残り時間を10秒追加する。オタケビ ：ノコリジカ ジカン ツイカ"},{"id":"excel_minion_12","name":"物拾いする猿","tier":2,"tribe":"獣","atk":5,"hp":1,"text":"雄叫び：このターンに使ったティア1or2のスペルをランダムに1枚得る。オタケビ ツカッタ エル","awakenedText":"雄叫び：このターンに使ったティア1or2のスペルをランダムに2枚得る。オタケビ ツカッタ エル"},{"id":"excel_minion_13","name":"ネタバラシフィン","tier":2,"tribe":"マーロック","atk":3,"hp":1,"text":"雄叫び：ティア4のスペルをランダムに1枚得る。それはこのターン使えない。オタケビ エル ツカエナイ","awakenedText":"雄叫び：ティア4のスペルをランダムに2枚得る。それはこのターン使えない。オタケビ エル ツカエナイ"},{"id":"excel_minion_14","name":"爆笑フィン","tier":2,"tribe":"マーロック","atk":4,"hp":2,"text":"このカードが場にいる状態でグレードを上げると、「はずれくじ」を２回発動する。バニ ジョウタイデ アゲルト ハツドウ","awakenedText":"このカードが場にいる状態でグレードを上げると、「はずれくじ」を4回発動する。バニ ジョウタイデ アゲルト ハツドウ"},{"id":"excel_minion_15","name":"コインマン","tier":2,"tribe":"海賊","atk":2,"hp":4,"text":"ターン終了時：「コイン」を1枚得る。シュウリョウジ エル","awakenedText":"ターン終了時：「コイン」を2枚得る。シュウリョウジ エル"},{"id":"excel_minion_16","name":"よいごし","tier":2,"tribe":"海賊","atk":1,"hp":3,"text":"このカードは３コインで売れる。ウルコトガ","awakenedText":"このカードは6コインで売れる。ウルコトガ"},{"id":"excel_minion_17","name":"ウレメンタル","tier":2,"tribe":"エレメンタル","atk":2,"hp":2,"text":"このカードを売った時、「おつり」を１体獲得する。ウッタトキ 🆚カクトクスル","awakenedText":"このカードを売った時、「おつり」を2体獲得する。ウッタトキ 🆚カクトクスル"},{"id":"excel_minion_18","name":"イーストサーキット","tier":2,"tribe":"エレメンタル","atk":4,"hp":1,"text":"このカードが場にいる状態でグレードを上げると、「東からの風」を1回発動する。バニ ジョウタイデ アゲルト ハツドウ","awakenedText":"このカードが場にいる状態でグレードを上げると、「東からの風」を2回発動する。バニ ジョウタイデ アゲルト ハツドウ"},{"id":"excel_minion_19","name":"投資家ナーガ","tier":2,"tribe":"ナーガ","atk":2,"hp":3,"text":"雄叫び：「慎重な投資」を1枚得る。オタケビ シンチョウナ トウシ エル","awakenedText":"雄叫び：「慎重な投資」を2枚得る。オタケビ シンチョウナ トウシ エル"},{"id":"excel_minion_20","name":"テキ屋ナーガ","tier":2,"tribe":"ナーガ","atk":1,"hp":4,"text":"ターン終了時：「はずれくじ」を1枚得る。シュウリョウジ エル","awakenedText":"ターン終了時：「はずれくじ」を2枚得る。シュウリョウジ エル"},{"id":"excel_minion_21","name":"身代わり","tier":2,"tribe":"なし","atk":1,"hp":1,"text":"このカードを売った時、「このカードを売った時」がテキストにあるカードを1枚発見する。ウッタトキ ウッタトキ ハッケン","awakenedText":"このカードを売った時、「このカードを売った時」がテキストにあるカードを2枚発見する。ウッタトキ ウッタトキ ハッケン"},{"id":"excel_minion_22","name":"ビーコンオブホープ","tier":2,"tribe":"なし","atk":3,"hp":3,"text":"雄叫び：自分の現在のグレードと同じティアのカードをランダムに1枚得る。オタケビ ジブン ゲンザイ オナジ エル","awakenedText":"雄叫び：自分の現在のグレードと同じティアのカードをランダムに2枚得る。オタケビ ジブン ゲンザイ オナジ エル"},{"id":"excel_minion_23","name":"斥候","tier":2,"tribe":"なし","atk":1,"hp":1,"text":"このカードを売った時、ティア１カードを1枚発見する。ウッタトキ ハッケン","awakenedText":"このカードを売った時、ティア１カードを2枚発見する。ウッタトキ ハッケン"},{"id":"excel_minion_24","name":"ケルベロスの赤ちゃん","tier":3,"tribe":"獣","atk":5,"hp":3,"text":"雄叫び：３回リロールする。オタケビ","awakenedText":"雄叫び：6回リロールする。オタケビ"},{"id":"excel_minion_25","name":"スポアバット","tier":3,"tribe":"獣","atk":5,"hp":1,"text":"雄叫び：ランダムなスペルを1枚得る。オタケビ エル","awakenedText":"雄叫び：ランダムなスペルを2枚得る。オタケビ エル"},{"id":"excel_minion_26","name":"トリックフィン","tier":3,"tribe":"マーロック","atk":4,"hp":4,"text":"ターン終了時：「スペルボックス」を1枚得る。シュウリョウジ エル","awakenedText":"ターン終了時：「スペルボックス」を2枚得る。シュウリョウジ エル"},{"id":"excel_minion_27","name":"ミラージュフィン","tier":3,"tribe":"マーロック","atk":1,"hp":1,"text":"雄叫び；酒場または、自陣のマーロックのコピーになる。オタケビ サカバ ジジン","awakenedText":"雄叫び；酒場または、自陣のマーロックのコピーになる。オタケビ サカバ ジジン"},{"id":"excel_minion_28","name":"海賊狩りの海賊","tier":3,"tribe":"海賊","atk":3,"hp":3,"text":"ターン終了時：「燃えた海賊旗」を1枚得る。シュウリョウジ エル","awakenedText":"ターン終了時：「燃えた海賊旗」を2枚得る。シュウリョウジ エル"},{"id":"excel_minion_29","name":"本気の海賊","tier":3,"tribe":"海賊","atk":7,"hp":7,"text":"効果なし。コウカナシ","awakenedText":"効果なし。コウカナシ"},{"id":"excel_minion_30","name":"チビアゼ","tier":3,"tribe":"エレメンタル","atk":4,"hp":3,"text":"スペルを唱えるたび、酒場の右端のミニオンに+2/+1をする。","awakenedText":"スペルを唱えるたび、酒場の右端のミニオンに+4/+2をする。"},{"id":"excel_minion_31","name":"リロールブースター","tier":3,"tribe":"エレメンタル","atk":4,"hp":4,"text":"ターン終了時：4回リロールする。シュウリョウジ","awakenedText":"ターン終了時：8回リロールする。シュウリョウジ"},{"id":"excel_minion_32","name":"聖遺会の従者","tier":3,"tribe":"エレメンタル","atk":7,"hp":4,"text":"１ターンに1度、自分が呪文を使用した後、その呪文のコピーを1枚得る。ジブン ジュモン シヨウシタアト ジュモン エル","awakenedText":"１ターンに1度、自分が呪文を使用した後、その呪文のコピーを2枚得る。ジブン ジュモン シヨウシタアト ジュモン エル"},{"id":"excel_minion_33","name":"悪銭ナーガ","tier":3,"tribe":"ナーガ","atk":4,"hp":1,"text":"雄叫び：「弾けたコインポーチ」を1枚得る。オタケビ エル","awakenedText":"雄叫び：「弾けたコインポーチ」を2枚得る。オタケビ エル"},{"id":"excel_minion_34","name":"貝笛師","tier":3,"tribe":"ナーガ","atk":3,"hp":2,"text":"雄叫び：ランダムなコスト２のスペルを1枚得る。オタケビ","awakenedText":"雄叫び：ランダムなコスト２のスペルを1枚得る。オタケビ"},{"id":"excel_minion_35","name":"建設業","tier":3,"tribe":"なし","atk":2,"hp":6,"text":"ターン終了時：グレード上げのコストを2減らす。シュウリョウジ アゲ","awakenedText":"ターン終了時：グレード上げのコストを4減らす。シュウリョウジ アゲ"},{"id":"excel_minion_36","name":"COした占い師","tier":3,"tribe":"なし","atk":3,"hp":3,"text":"雄叫び：次に買う呪文は3コイン値下げされる。オタケビ","awakenedText":"雄叫び：次に買う呪文は6コイン値下げされる。オタケビ"},{"id":"excel_minion_37","name":"見習いマリモ使い","tier":3,"tribe":"なし","atk":1,"hp":1,"text":"このカードは覚醒すると効果が変わる。カクセイ コウカガ カワル","awakenedText":"このカードを売った時、グレードを無視して「酸性降雨」を1枚得る。ウッタトキ ムシシテ サンセイエル"},{"id":"excel_minion_38","name":"サメ","tier":4,"tribe":"獣","atk":4,"hp":4,"text":"雄叫び：獣を1枚発見する。オタケビ ケモノ ハッケン","awakenedText":"雄叫び：獣を2枚発見する。オタケビ ケモノ ハッケン"},{"id":"excel_minion_39","name":"ライラク","tier":4,"tribe":"獣","atk":3,"hp":4,"text":"ターン終了時：このカードに隣接する雄叫びを発動する。","awakenedText":"ターン終了時：このカードに隣接する雄叫びを2回発動する。"},{"id":"excel_minion_40","name":"指示フィン","tier":4,"tribe":"マーロック","atk":1,"hp":1,"text":"雄叫び：自陣のカードを1枚選んで除去する。２G 得る。オタケビ ジジン エランデ ジョキョスル エル","awakenedText":"雄叫び：自陣のカードを1枚選んで除去する。4G 得る。オタケビ ジジン エランデ ジョキョスル エル"},{"id":"excel_minion_41","name":"ママコメフィン","tier":4,"tribe":"マーロック","atk":1,"hp":5,"text":"雄叫び；このターンの残り時間を15秒追加する。オタケビ","awakenedText":"雄叫び；このターンの残り時間を30秒追加する。オタケビ"},{"id":"excel_minion_42","name":"夜型の海賊","tier":4,"tribe":"海賊","atk":5,"hp":6,"text":"ターン終了時：次のターン4G 得る。シュウリョウジ ツギノ エル","awakenedText":"ターン終了時：次のターン8G 得る。シュウリョウジ ツギノ エル"},{"id":"excel_minion_43","name":"物好きな海賊","tier":4,"tribe":"海賊","atk":1,"hp":4,"text":"このカードが自陣にいる限り、自分が6回のリロールをすると、「未知の円盤の破片」を1枚得る。","awakenedText":"このカードが自陣にいる限り、自分が3回のリロールをすると、「未知の円盤の破片」を1枚得る。"},{"id":"excel_minion_44","name":"エンジン","tier":4,"tribe":"エレメンタル","atk":4,"hp":4,"text":"雄叫び：この対戦中に酒場を入替した後、その右端のミニオン1体に+7/+7を付与する。","awakenedText":"雄叫び：この対戦中に酒場を入替した後、その右端のミニオン1体に+14/+14を付与する。"},{"id":"excel_minion_45","name":"さかまき","tier":4,"tribe":"エレメンタル","atk":2,"hp":2,"text":"雄叫び：ランダムなエレメンタルを1枚得る。オタケビ エル","awakenedText":"雄叫び：ランダムなエレメンタルを2枚得る。オタケビ エル"},{"id":"excel_minion_46","name":"入れ替え異常体","tier":4,"tribe":"エレメンタル","atk":2,"hp":4,"text":"雄叫び：次のリロールコストが０になるを２回得る。オタケビ ツギノ エル","awakenedText":"雄叫び：次のリロールコストが０になるを4回得る。オタケビ ツギノ エル"},{"id":"excel_minion_47","name":"超越を夢見るナーガ","tier":4,"tribe":"ナーガ","atk":4,"hp":1,"text":"雄叫び：「時空の超越」を1枚得る。それは、30リロールしないと使えない。オタケビ ジクウ チョウエツ エル ツカエナイ","awakenedText":"雄叫び：「時空の超越」を2枚得る。それらは、30リロールしないと使えない。オタケビ ジクウ チョウエツ エル ツカエナイ"},{"id":"excel_minion_48","name":"友達のナーガ","tier":4,"tribe":"ナーガ","atk":3,"hp":5,"text":"このカードを売った時、ティア３以下のナーガを1枚発見する。ウッタトキ イカ ハッケン","awakenedText":"このカードを売った時、ティア３以下のナーガを2枚発見する。ウッタトキ イカ ハッケン"},{"id":"excel_minion_49","name":"磯の探検家","tier":4,"tribe":"なし","atk":4,"hp":4,"text":"雄叫び：自陣にいない種族のミニオンを１体発見する。","awakenedText":"雄叫び：自陣にいない種族のミニオンを2体発見する。"},{"id":"excel_minion_50","name":"ブランの卵","tier":4,"tribe":"なし","atk":1,"hp":1,"text":"ターン終了時：ランダムな雄叫びミニオンを2枚得る。シュウリョウジ オタケビ エル","awakenedText":"ターン終了時：ランダムな雄叫びミニオンを4枚得る。シュウリョウジ オタケビ エル"},{"id":"excel_minion_51","name":"魔術をつかうトーレン","tier":4,"tribe":"なし","atk":4,"hp":4,"text":"1ターンに1度、スペル1枚が追加でもう1回発動する。","awakenedText":"１ターンに2度、スペル1枚が追加でもう1回発動する。"},{"id":"excel_minion_52","name":"エリーズ","tier":4,"tribe":"なし","atk":5,"hp":5,"text":"このカードが自陣にいる限り、自分が5回のリロールをすると、酒場のミニオン1体を覚醒させる。サカバ 🆚カクセイ","awakenedText":"このカードが自陣にいる限り、自分が5回のリロールをすると、酒場のミニオン2体を覚醒させる。サカバ 🆚カクセイ"},{"id":"excel_minion_53","name":"成長したケルベロス","tier":5,"tribe":"獣","atk":8,"hp":8,"text":"雄叫び：3回リロールする。このターンの残り時間を15秒追加する。オタケビ カイ","awakenedText":"雄叫び：6回リロールする。このターンの残り時間を30秒追加する。オタケビ カイ"},{"id":"excel_minion_54","name":"ゴールデンポメラニアン","tier":5,"tribe":"獣","atk":5,"hp":5,"text":"ターン終了時：自分の手札のミニオン1枚を覚醒させる。","awakenedText":"ターン終了時：自分の手札のミニオン2枚を覚醒させる。"},{"id":"excel_minion_55","name":"見張りフィン","tier":5,"tribe":"マーロック","atk":5,"hp":2,"text":"雄叫び：自陣にマーロックがいるなら、マーロックを1枚発見する。オタケビ ジジン ハッケン","awakenedText":"雄叫び：自陣にマーロックがいるなら、マーロックを2枚発見する。オタケビ ジジン ハッケン"},{"id":"excel_minion_56","name":"冷笑フィン","tier":5,"tribe":"マーロック","atk":2,"hp":8,"text":"雄叫び：自陣に覚醒したミニオンがいるなら、自分のティアのスペルを1枚発見する。オタケビ ジジン カクセイ ジブン ハッケン","awakenedText":"雄叫び：自陣に覚醒したミニオンがいるなら、自分のティアのスペルを2枚発見する。オタケビ ジジン カクセイ ジブン ハッケン"},{"id":"excel_minion_57","name":"先見性のある海賊","tier":5,"tribe":"海賊","atk":4,"hp":5,"text":"自分がゴールドを4回獲得した後、ランダムなスペルを1枚得る。ジブン カクトク アト エル","awakenedText":"自分がゴールドを4回獲得した後、ランダムなスペルを2枚得る。ジブン カクトク アト エル"},{"id":"excel_minion_58","name":"金の亡者","tier":5,"tribe":"海賊","atk":8,"hp":4,"text":"このカードが自陣にいる限り、10Gを消費するたび、ゴールドの上限を1増やす。ショウヒ ジョウゲン フヤス","awakenedText":"このカードが自陣にいる限り、10Gを消費するたび、ゴールドの上限を2増やす。ショウヒ ジョウゲン フヤス"},{"id":"excel_minion_59","name":"風雲児","tier":5,"tribe":"エレメンタル","atk":4,"hp":4,"text":"このカード売った時、エレメンタルを1枚発見する。ウッタ トキ ハッケン","awakenedText":"このカード売った時、エレメンタルを2枚発見する。ウッタ トキ ハッケン"},{"id":"excel_minion_60","name":"エアーレヴナント","tier":5,"tribe":"エレメンタル","atk":4,"hp":8,"text":"このカードが自陣にいる限り、6コイン使う度に、「東からの風」を1枚得る。エル","awakenedText":"このカードが自陣にいる限り、6コイン使う度に、「東からの風」を2枚得る。エル"},{"id":"excel_minion_61","name":"リサイクルレイス","tier":5,"tribe":"エレメンタル","atk":4,"hp":6,"text":"このカードが自陣にいる限り、エレメンタルを場に出すたび、次の１回のリロールコストが０になる。ガバ ダスタビ ツギノ","awakenedText":"このカードが自陣にいる限り、エレメンタルを場に出すたび、次の2回のリロールコストが０になる。ガバ ダスタビ ツギノ"},{"id":"excel_minion_62","name":"ダーククレスト","tier":5,"tribe":"ナーガ","atk":4,"hp":5,"text":"このカードが場に出た時、ランダムなナーガを1枚得る。ターンの開始時、手札に空きがあれば、ランダムなナーガを1枚得る。バ デタ トキ エル カイシジ テフダニ アキガアレバ","awakenedText":"このカードが場に出た時、ランダムなナーガを2枚得る。ターンの開始時、手札に空きがあれば、ランダムなナーガを2枚得る。バ デタ トキ エル カイシジ テフダニ アキガアレバ"},{"id":"excel_minion_63","name":"ゴニックスケイル","tier":5,"tribe":"ナーガ","atk":5,"hp":5,"text":"このカードが場に出た時、「夢のエッセンス」を1枚得る。ターンの開始時、手札に空きがあれば、「夢のエッセンス」を1枚得る。バ デタ トキ ユメノ エル カイシジ テフダニ アキガアレバ ユメ","awakenedText":"このカードが場に出た時、「夢のエッセンス」を2枚得る。ターンの開始時、手札に空きがあれば、「夢のエッセンス」を2枚得る。バ デタ トキ ユメノ エル カイシジ テフダニ アキガアレバ ユメ"},{"id":"excel_minion_64","name":"磯の探検家","tier":5,"tribe":"なし","atk":4,"hp":4,"text":"雄叫び：自陣にいない種族のミニオンを１体発見する。","awakenedText":"雄叫び：自陣にいない種族のミニオンを2体発見する。"},{"id":"excel_minion_65","name":"贋作売り","tier":5,"tribe":"なし","atk":3,"hp":6,"text":"このカードが自陣にいる限り、自分のミニオンを売った時の効果は2回発動する。ジブン ノウッタトキ コウカ ハツドウ","awakenedText":"このカードが自陣にいる限り、自分のミニオンを売った時の効果は3回発動する。ジブン ノウッタトキ コウカ ハツドウ"},{"id":"excel_minion_66","name":"ブラン","tier":5,"tribe":"なし","atk":2,"hp":4,"text":"このカードが自陣にいる限り、自分の雄叫びは２回発動する。","awakenedText":"このカードが自陣にいる限り、自分の雄叫びは3回発動する。"},{"id":"excel_minion_67","name":"ドラッカリ","tier":5,"tribe":"なし","atk":1,"hp":5,"text":"自分のターンの終了時に 発動する効果は 2回発動する。","awakenedText":"自分のターンの終了時に 発動する効果は 3回発動する。"},{"id":"excel_minion_68","name":"ロデオ名人","tier":5,"tribe":"なし","atk":3,"hp":4,"text":"雄叫び：呪文を1枚発見する。ジュモン ハッケン","awakenedText":"雄叫び：呪文を2枚発見する。ジュモン ハッケン"},{"id":"excel_minion_69","name":"アカリ","tier":6,"tribe":"獣","atk":6,"hp":6,"text":"雄叫び：手札のスペルを1枚選んで、コピーを手札に追加する。オタケビ テフダ マイ エランデ テフダニ ツイカ","awakenedText":"雄叫び：手札のスペルを1枚選んで、コピーを2枚手札に追加する。オタケビ テフダ マイ エランデ テフダニ ツイカ"},{"id":"excel_minion_70","name":"マクスウェル","tier":6,"tribe":"獣","atk":1,"hp":1,"text":"このカードを売った時、「贈り物」を1枚得る。ウッタトキ オクリモノ エル","awakenedText":"このカードを売った時、「贈り物」を2枚得る。ウッタトキ オクリモノ エル"},{"id":"excel_minion_71","name":"熱血フィン","tier":6,"tribe":"マーロック","atk":25,"hp":25,"text":"このカードを売った時、「熱血パンチ」を1枚得る。ヲウッタトキ ネッケツ エル","awakenedText":"このカードを売った時、「熱血パンチ」を2枚得る。ヲウッタトキ ネッケツ エル"},{"id":"excel_minion_72","name":"マジックフィン","tier":6,"tribe":"マーロック","atk":3,"hp":5,"text":"このカードが自陣にいる限り、自分がスペルを買うと、「雄叫び：買ったスペルを発動する。」を持つ、トークンカードを獲得する。（１ターンに1度）ガカウ オタケビ カッタ ハツドウ モツ カクトクスル","awakenedText":"このカードが自陣にいる限り、自分がスペルを買うと、「雄叫び：買ったスペルを発動する。」を持つ、トークンカードを獲得する。（１ターンに2度）ガカウ オタケビ カッタ ハツドウ モツ カクトクスル"},{"id":"excel_minion_73","name":"熱を愛す男","tier":6,"tribe":"海賊","atk":10,"hp":8,"text":"このカードが自陣いる際に、残り時間が増えた時、この対戦中に酒場を入替した後、その右端のミニオン1体に+X/+Xを付与する。（Xは増えた時間）（1ターンに2回）ジカン フエタ トキ _x0000__x000F__x0002__x0004__x0012__x0001__x0008__x0015__x0001__x000B_=_x0001__x000C_","awakenedText":"このカードが自陣いる際に、残り時間が増えた時、この対戦中に酒場を入替した後、その右端のミニオン1体に+X/+Xを付与する。（Xは増えた時間）（1ターンに4回）ジカン フエタ トキ _x0000__x000F__x0002__x0004__x0012__x0001__x0008__x0015__x0001__x000B_=_x0001__x000C_"},{"id":"excel_minion_74","name":"タイムキーパー","tier":6,"tribe":"ナーガ","atk":6,"hp":6,"text":"このカードが自陣にいる限り、自分が5回スペルを使うと、このターンの残り時間を15秒増やす。（1ターンに3回）ツカウ ノコリ ジカン ビョウ フヤス","awakenedText":"このカードが自陣にいる限り、自分が5回スペルを使うと、このターンの残り時間を30秒増やす。（1ターンに3回）ツカウ ノコリ ジカン ビョウ フヤス"},{"id":"excel_minion_75","name":"時渡りの預言者","tier":6,"tribe":"ナーガ","atk":8,"hp":8,"text":"このカードが自陣にいる限り、スペルが３コスト軽く買える。ただし０にはならない。カルク カエル","awakenedText":"このカードが自陣にいる限り、スペルが３コスト軽く買える。カルク カエル"},{"id":"excel_minion_76","name":"酸性降雨","tier":6,"tribe":"エレメンタル","atk":6,"hp":6,"text":"このカードが自陣にいる限り、自分が4回のリロールをすると、酒場の右端のミニオンのスタッツを得る。","awakenedText":"このカードが自陣にいる限り、自分が4回のリロールをすると、酒場の右端のミニオンのスタッツを2倍得る。"},{"id":"excel_minion_77","name":"アウトランドの日光","tier":6,"tribe":"エレメンタル","atk":4,"hp":5,"text":"雄叫び：３以上の呪文を1枚発見する。オタケビ イジョウノ ジュモン ハッケン","awakenedText":"雄叫び：コスト３以上の呪文を2枚発見する。オタケビ イジョウノ ジュモン ハッケン"},{"id":"excel_minion_78","name":"ランタンラーバ","tier":6,"tribe":"エレメンタル","atk":5,"hp":5,"text":"自分がエレメンタルを売った時、そのカードの未強化コピーを獲得する。（１ターンに1度）ジブン ウッタトキ ミキョウカ カクトクスル","awakenedText":"自分がエレメンタルを売った時、そのカードの未強化コピーを獲得する。（１ターンに2度）ジブン ウッタトキ ミキョウカ カクトクスル"},{"id":"excel_minion_79","name":"レノ","tier":6,"tribe":"なし","atk":10,"hp":10,"text":"このカードを売った時、残り時間が0秒から20秒なら、60秒追加する。ウッタトキ ノコリジカン ビョウ ビョウ ツイカ","awakenedText":"このカードを売った時、残り時間が0秒から20秒なら、120秒追加する。ウッタトキ ノコリジカン ビョウ ビョウ ツイカ"},{"id":"excel_minion_80","name":"スカイフォルム","tier":6,"tribe":"なし","atk":10,"hp":1,"text":"雄叫び：自陣の７枠ではなく、８枠にする。オタケビ ジジン ワク","awakenedText":"雄叫び：自陣の７枠ではなく、８枠にする。オタケビ ジジン ワク"}]};
  const n = (card, normal, awakened) => card.awakened ? awakened : normal;
  const clone = card => (typeof cloneCard === "function" ? cloneCard(card) : {...card});
  const spellByName = name => SPELLS.find(c => c.name === name);
  const minionByName = name => MINIONS.find(c => c.name === name);
  const addHand = (gameState, card, count=1, message="") => {
    if (!card) return;
    for (let i=0;i<count;i++) {
      if (gameState.hand.length >= HAND_LIMIT) break;
      gameState.hand.push(clone(card));
    }
    if (message) log(message);
  };
  const randomPick = pool => pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
  const gainRandom = (gameState,pool,count=1,message="") => {
    for(let i=0;i<count;i++) addHand(gameState,randomPick(pool),1,i===0?message:"");
  };
  const discover = (gameState,pool,count=1,title="カードを発見") => {
    const unique=[...new Map(pool.filter(Boolean).map(c=>[c.id,c])).values()];
    if (!unique.length) return;
    if (typeof discoverCards === "function") discoverCards(gameState,unique,count,title);
    else gainRandom(gameState,unique,count,title);
  };
  const addTime = (gameState,seconds) => {
    gameState.remainingSeconds = Math.max(0,Number(gameState.remainingSeconds||0)+seconds);
    if (typeof gameState.onTimeAdded === "function") gameState.onTimeAdded(seconds);
    if (typeof notifyBoard === "function") notifyBoard("onTimeAdded",gameState,seconds);
    log(`残り時間が ${seconds} 秒増えた。`);
  };
  const gainGold = (gameState,amount) => {
    gameState.gold = Math.min(Number(gameState.maxGold||10),Number(gameState.gold||0)+amount);
    gameState.goldGainEvents=Number(gameState.goldGainEvents||0)+1;
    if (typeof notifyBoard === "function") notifyBoard("onGoldGained",gameState,amount);
  };
  const gainNamed = (gameState,name,count=1,lock={}) => {
    const card=spellByName(name)||minionByName(name);
    for(let i=0;i<count;i++) {
      if (!card || gameState.hand.length>=HAND_LIMIT) break;
      const copy=clone(card);
      Object.assign(copy,lock);
      gameState.hand.push(copy);
    }
  };
  const awaken = card => { if(card) card.awakened=true; };
  const currentText = card => card.awakened ? card.awakenedText : card.text;
  const amountFrom = (card,normal,awakened) => n(card,normal,awakened);
  const rightmostMinion = gameState => {
    for(let i=gameState.shop.length-1;i>=0;i--) if(gameState.shop[i]&&gameState.shop[i].type!=="spell") return gameState.shop[i];
    return null;
  };
  const addRightmostPersistent = (gameState,atk,hp) => {
    gameState.excelRightmostAtk=Number(gameState.excelRightmostAtk||0)+atk;
    gameState.excelRightmostHp=Number(gameState.excelRightmostHp||0)+hp;
  };
  function runRerolls(gameState,count) {
    for(let i=0;i<count;i++) {
      gameState.freeRerolls=Number(gameState.freeRerolls||0)+1;
      rerollShop();
    }
  }
  function randomSpellTotal(gameState,total) {
    let remaining=total, guard=40;
    while(remaining>0 && guard-- > 0) {
      const pool=SPELLS.filter(s=>s.cost<=remaining);
      if(!pool.length) break;
      const card=randomPick(pool); addHand(gameState,card); remaining-=card.cost;
    }
  }
  function castByName(gameState,name,times=1) {
    const s=spellByName(name); if(!s) return;
    for(let i=0;i<times;i++) s.cast(gameState);
  }
  function compileSpell(raw) {
    const card={...raw,type:"spell",emoji:"✨"};
    card.cast=function(gameState) {
      const t=this.text;
      if(this.name==="コイン") return gainGold(gameState,1);
      if(this.name==="新芽") return discover(gameState,MINIONS.filter(c=>c.tier===1),1,"Tier1ミニオンを発見");
      if(this.name==="召集") return gainRandom(gameState,MINIONS.filter(c=>c.tier===1),1,"Tier1ミニオンを得た。");
      if(this.name==="未知の円盤の破片") {
        const pieces=gameState.hand.filter(c=>c.name===this.name);
        if(pieces.length>=1) {
          const idx=gameState.hand.findIndex(c=>c.name===this.name); if(idx>=0) gameState.hand.splice(idx,1);
          gainNamed(gameState,"覚醒報酬",1);
        } else gainNamed(gameState,this.name,1);
        return;
      }
      if(this.name==="石油") { gameState.maxGold=Number(gameState.maxGold||10)+1; return; }
      if(this.name==="シェフのおすすめ" && typeof castChefRecommendation==="function") return castChefRecommendation(gameState);
      if(this.name==="はずれくじ") return gainRandom(gameState,[...MINIONS,...SPELLS].filter(c=>c.tier===1),1);
      if(this.name==="慎重な投資") { gameState.nextTurnGoldBonus=Number(gameState.nextTurnGoldBonus||0)+2; return; }
      if(this.name==="弾けたコインポーチ") { gainGold(gameState,3); gameState.nextTurnGoldPenalty=Number(gameState.nextTurnGoldPenalty||0)+2; return; }
      if(this.name==="カタログパラパラ") { gameState.freeRerolls=Number(gameState.freeRerolls||0)+2; return; }
      if(this.name==="第六感") { gameState.discoverOnUpgrade=true; return; }
      if(this.name==="燃えた海賊旗") {
        const idx=gameState.board.findIndex(c=>c&&c.tribe==="海賊");
        if(idx>=0) gameState.board[idx]=null;
        gainRandom(gameState,SPELLS,2); return;
      }
      if(this.name==="崖から遠ざかる") { gameState.nextTurnGoldBonus=Number(gameState.nextTurnGoldBonus||0)+1; gameState.nextTurnTimeBonus=Number(gameState.nextTurnTimeBonus||0)+10; return; }
      if(this.name==="ちょろまかし") { gameState.nextSellEffectMultiplier=Math.max(2,Number(gameState.nextSellEffectMultiplier||1)); return; }
      if(this.name==="ビートチェック") { gameState.nextUpgradeHalf=true; return; }
      if(this.name==="東からの風") { addRightmostPersistent(gameState,6,6); const x=rightmostMinion(gameState); if(x){x.atk+=6;x.hp+=6;} return; }
      if(this.name==="スペルボックス") return randomSpellTotal(gameState,5);
      if(this.name==="隠し扉") return addTime(gameState,10);
      if(this.name==="望遠鏡") { if(typeof discoverDominantTribeCard==="function") return discoverDominantTribeCard(gameState,false); }
      if(this.name==="派遣作業") return gainRandom(gameState,MINIONS.filter(c=>c.tribe==="なし"),1);
      if(this.name==="ドラッカリ") { gameState.turnEndMultiplier=Math.max(2,Number(gameState.turnEndMultiplier||1)); return; }
      if(this.name==="成長のスクロール") { discover(gameState,MINIONS.filter(c=>c.tier===gameState.tavernTier),1); discover(gameState,SPELLS.filter(c=>c.tier===gameState.tavernTier),1); return; }
      if(this.name==="万華鏡") { const pool=MINIONS.filter(c=>c.tier===6); discover(gameState,pool,1,"Tier6ミニオンを発見"); return; }
      if(this.name==="マリモの肖像画") { gainNamed(gameState,"酸性降雨"); gainNamed(gameState,"エンジン"); return; }
      if(this.name==="リバウンド") { gameState.reboundActive=true; return; }
      if(this.name==="陣太鼓") { gameState.nextBattlecryMultiplier=Number(gameState.nextBattlecryMultiplier||0)+2; return; }
      if(this.name==="夢のエッセンス" && typeof castDreamEssence==="function") return castDreamEssence(gameState);
      if(this.name==="時空の超越") { gameState.maxTurns=Number(gameState.maxTurns||0)+1; return; }
      if(this.name==="一時的な時間改竄") { gameState.doubleSpellCharges=Number(gameState.doubleSpellCharges||0)+2; return; }
      if(this.name==="ドッペルゲンガーの奇策") { if(typeof returnBoardCardToHand==="function") return returnBoardCardToHand(gameState,c=>typeof c.battlecry==="function"); }
      if(this.name==="超覚醒化") { if(typeof selectBoardCard==="function") return selectBoardCard(gameState,()=>true,c=>awaken(c),"覚醒させるカードを選択"); }
      if(this.name==="でかいスペルボックス") return randomSpellTotal(gameState,10);
      log(`${this.name} を発動した。`);
    };
    return card;
  }
  function compileMinion(raw) {
    const card={...raw,cost:3,emoji:"🃏"};
    const name=card.name;
    const normal=card.text, awake=card.awakenedText;
    const count=(a,b)=>amountFrom(card,a,b);
    if(normal.includes("雄叫び")) card.battlecry=function(gameState) {
      if(name==="野良猫") return typeof summonToken==="function"&&summonToken(gameState,"cat",count(1,2));
      if(name==="大道芸人") { gameState.nextTurnGoldBonus=Number(gameState.nextTurnGoldBonus||0)+count(1,2); return; }
      if(name==="甲板磨き") { gameState.upgradeDiscount=Number(gameState.upgradeDiscount||0)+count(1,2); return; }
      if(name==="もりもり砂丘") return addRightmostPersistent(gameState,count(1,2),count(1,2));
      if(name==="不吉な預言者") { gameState.nextSpellDiscount=Number(gameState.nextSpellDiscount||0)+count(1,2); return; }
      if(name==="癒されるねこ") return addTime(gameState,count(5,10));
      if(name==="物拾いする猿") return gainRandom(gameState,(gameState.spellsCastThisTurn||[]).filter(s=>s.tier<=2),count(1,2));
      if(name==="ネタバラシフィン") return gainRandom(gameState,SPELLS.filter(s=>s.tier===4).map(s=>({...s,lockedUntilTurn:gameState.turn+1})),count(1,2));
      if(name==="投資家ナーガ") return gainNamed(gameState,"慎重な投資",count(1,2));
      if(name==="ビーコンオブホープ") return gainRandom(gameState,[...MINIONS,...SPELLS].filter(c=>c.tier===gameState.tavernTier&&c.id!==card.id),count(1,2));
      if(name==="ケルベロスの赤ちゃん") return runRerolls(gameState,count(3,6));
      if(name==="スポアバット") return gainRandom(gameState,SPELLS,count(1,2));
      if(name==="ミラージュフィン") return typeof selectBoardCard==="function"&&selectBoardCard(gameState,c=>c.tribe==="マーロック",c=>Object.assign(card,clone(c)),"コピーするマーロックを選択");
      if(name==="悪銭ナーガ") return gainNamed(gameState,"弾けたコインポーチ",count(1,2));
      if(name==="貝笛師") return gainRandom(gameState,SPELLS.filter(s=>s.cost===2),count(1,1));
      if(name==="COした占い師") { gameState.nextSpellDiscount=Number(gameState.nextSpellDiscount||0)+count(3,6); return; }
      if(name==="サメ") return discover(gameState,MINIONS.filter(c=>c.tribe==="獣"&&c.id!==card.id),count(1,2),"獣を発見");
      if(name==="指示フィン") { if(typeof selectBoardCard==="function") selectBoardCard(gameState,()=>true,c=>{const i=gameState.board.indexOf(c);if(i>=0)gameState.board[i]=null;},"除去するカードを選択"); gainGold(gameState,count(2,4)); return; }
      if(name==="ママコメフィン") return addTime(gameState,count(15,30));
      if(name==="エンジン") { gameState.engineAfterRerollAtk=Number(gameState.engineAfterRerollAtk||0)+count(7,14);gameState.engineAfterRerollHp=Number(gameState.engineAfterRerollHp||0)+count(7,14);return; }
      if(name==="さかまき") return gainRandom(gameState,MINIONS.filter(c=>c.tribe==="エレメンタル"&&c.id!==card.id),count(1,2));
      if(name==="入れ替え異常体") { gameState.freeRerolls=Number(gameState.freeRerolls||0)+count(2,4); return; }
      if(name==="超越を夢見るナーガ") return gainNamed(gameState,"時空の超越",count(1,2),{unlockRerolls:Number(gameState.rerolls||0)+30});
      if(name==="磯の探検家") { const tribes=new Set(gameState.board.filter(Boolean).map(c=>c.tribe)); return discover(gameState,MINIONS.filter(c=>c.tribe!=="なし"&&!tribes.has(c.tribe)),count(1,2)); }
      if(name==="成長したケルベロス") { runRerolls(gameState,count(3,6)); addTime(gameState,count(15,30)); return; }
      if(name==="見張りフィン") { if(gameState.board.some(c=>c&&c.tribe==="マーロック")) discover(gameState,MINIONS.filter(c=>c.tribe==="マーロック"),count(1,2)); return; }
      if(name==="冷笑フィン") { if(gameState.board.some(c=>c&&c.awakened)) discover(gameState,SPELLS.filter(c=>c.tier===gameState.tavernTier),count(1,2)); return; }
      if(name==="ロデオ名人") return discover(gameState,SPELLS,count(1,2),"スペルを発見");
      if(name==="アカリ") { const pool=gameState.hand.filter(c=>c.type==="spell"); const x=randomPick(pool); if(x)addHand(gameState,x,count(1,2)); return; }
      if(name==="アウトランドの日光") return discover(gameState,SPELLS.filter(c=>c.cost>=3),count(1,2));
      if(name==="スカイフォルム") { gameState.maxBoardMinions=8; return; }
    };
    if(normal.includes("売った時")||normal.includes("カード売った時")) card.onSell=function(gameState) {
      const mult=Number(gameState.sellEffectMultiplier||1)*Number(gameState.nextSellEffectMultiplier||1); gameState.nextSellEffectMultiplier=1;
      const c=count(1,2)*mult;
      if(name==="威嚇するわんこ") return gainNamed(gameState,"夢のエッセンス",c,{unlockTier:4});
      if(name==="船頭") return gainRandom(gameState,MINIONS.filter(x=>x.tier===1&&x.id!==card.id),c);
      if(name==="ガチ預言者") return gainRandom(gameState,SPELLS.filter(x=>x.tier===1),c);
      if(name==="ウレメンタル") return gainNamed(gameState,"おつり",c);
      if(name==="身代わり") return discover(gameState,MINIONS.filter(x=>x.text.includes("売った時")&&x.id!==card.id),c);
      if(name==="斥候") return discover(gameState,[...MINIONS,...SPELLS].filter(x=>x.tier===1&&x.id!==card.id),c);
      if(name==="友達のナーガ") return discover(gameState,MINIONS.filter(x=>x.tribe==="ナーガ"&&x.tier<=3&&x.id!==card.id),c);
      if(name==="風雲児") return discover(gameState,MINIONS.filter(x=>x.tribe==="エレメンタル"&&x.id!==card.id),c);
      if(name==="見習いマリモ使い"&&card.awakened) return gainNamed(gameState,"酸性降雨",1);
      if(name==="マクスウェル") return gainNamed(gameState,"贈り物",c);
      if(name==="熱血フィン") return gainNamed(gameState,"熱血パンチ",c);
      if(name==="レノ") { if(Number(gameState.remainingSeconds||0)<=20)addTime(gameState,count(60,120)); return; }
    };
    if(normal.includes("ターン終了時")||normal.includes("ターンの終了時")) card.onTurnEnd=function(gameState) {
      if(name==="苔マン") { card.endCounter=Number(card.endCounter||0)+1;if(card.endCounter%2===0)gainRandom(gameState,MINIONS.filter(c=>c.tribe==="エレメンタル"),count(1,2));return; }
      if(name==="コインマン") return gainNamed(gameState,"コイン",count(1,2));
      if(name==="テキ屋ナーガ") return gainNamed(gameState,"はずれくじ",count(1,2));
      if(name==="トリックフィン") return gainNamed(gameState,"スペルボックス",count(1,2));
      if(name==="海賊狩りの海賊") return gainNamed(gameState,"燃えた海賊旗",count(1,2));
      if(name==="リロールブースター") return runRerolls(gameState,count(4,8));
      if(name==="建設業") { gameState.upgradeDiscount=Number(gameState.upgradeDiscount||0)+count(2,4);return; }
      if(name==="ライラク") { const i=gameState.board.indexOf(card); if(typeof triggerAdjacentBattlecries==="function")triggerAdjacentBattlecries(gameState,i,count(1,2));return; }
      if(name==="夜型の海賊") { gameState.nextTurnGoldBonus=Number(gameState.nextTurnGoldBonus||0)+count(4,8);return; }
      if(name==="ブランの卵") return gainRandom(gameState,MINIONS.filter(c=>typeof c.battlecry==="function"),count(2,4));
      if(name==="ゴールデンポメラニアン") { const pool=gameState.hand.filter(c=>c.type!=="spell"&&!c.awakened); for(let i=0;i<count(1,2);i++) awaken(randomPick(pool)); return; }
    };
    card.onRerollCount=function(gameState) {
      card.rerollProgress=Number(card.rerollProgress||0)+1;
      if(name==="物好きな海賊") { const need=card.awakened?3:6;while(card.rerollProgress>=need){card.rerollProgress-=need;gainNamed(gameState,"未知の円盤の破片");} }
      if(name==="エリーズ") { while(card.rerollProgress>=5){card.rerollProgress-=5;const pool=gameState.shop.filter(c=>c&&c.type!=="spell"&&!c.awakened);for(let i=0;i<count(1,2);i++)awaken(randomPick(pool));} }
      if(name==="酸性降雨") { while(card.rerollProgress>=4){card.rerollProgress-=4;const x=rightmostMinion(gameState),m=count(1,2);if(x){card.atk+=(x.atk||0)*m;card.hp+=(x.hp||0)*m;}} }
    };
    card.onGoldSpent=function(gameState,amount) {
      card.goldProgress=Number(card.goldProgress||0)+amount;
      if(name==="ショールフィン") while(card.goldProgress>=8){card.goldProgress-=8;gainRandom(gameState,MINIONS.filter(c=>c.tribe==="マーロック"),count(1,2));}
      if(name==="金の亡者") while(card.goldProgress>=10){card.goldProgress-=10;gameState.maxGold=Number(gameState.maxGold||10)+count(1,2);}
      if(name==="エアーレヴナント") while(card.goldProgress>=6){card.goldProgress-=6;gainNamed(gameState,"東からの風",count(1,2));}
    };
    card.onSpellCast=function(gameState,spell) {
      if(name==="チビアゼ") { const x=rightmostMinion(gameState);if(x){x.atk+=count(2,4);x.hp+=count(1,2);} }
      if(name==="聖遺会の従者") { if(card.turnTriggers)return;card.turnTriggers=1;addHand(gameState,spell,count(1,2)); }
      if(name==="タイムキーパー") { card.spellProgress=Number(card.spellProgress||0)+1; while(card.spellProgress>=5 && Number(card.turnTriggers||0)<3){card.spellProgress-=5;card.turnTriggers=Number(card.turnTriggers||0)+1;addTime(gameState,count(15,30));} }
    };
    card.onElementalPlayed=function(gameState) { if(name==="リサイクルレイス")gameState.freeRerolls=Number(gameState.freeRerolls||0)+count(1,2); };
    card.onElementalSold=function(gameState,sold) { if(name==="ランタンラーバ"&&Number(card.turnTriggers||0)<count(1,2)){card.turnTriggers=Number(card.turnTriggers||0)+1;const base=MINIONS.find(c=>c.name===sold.name);addHand(gameState,base);} };
    card.onGoldGained=function(gameState) { if(name==="先見性のある海賊"){card.goldGainProgress=Number(card.goldGainProgress||0)+1;if(card.goldGainProgress>=4){card.goldGainProgress=0;gainRandom(gameState,SPELLS,count(1,2));}} };
    card.onTimeAdded=function(gameState,seconds) { if(name==="熱を愛す男"&&Number(card.turnTriggers||0)<count(2,4)){card.turnTriggers=Number(card.turnTriggers||0)+1;addRightmostPersistent(gameState,seconds,seconds);} };
    card.aura=function(gameState) {
      if(name==="魔術をつかうトーレン") gameState.doubleSpellCharges=Math.max(Number(gameState.doubleSpellCharges||0),count(1,2));
      if(name==="贋作売り") gameState.sellEffectMultiplier=Math.max(Number(gameState.sellEffectMultiplier||1),count(2,3));
      if(name==="ブラン") gameState.battlecryMultiplier=Math.max(Number(gameState.battlecryMultiplier||1),count(2,3));
      if(name==="ドラッカリ") gameState.turnEndMultiplier=Math.max(Number(gameState.turnEndMultiplier||1),count(2,3));
      if(name==="時渡りの預言者") gameState.spellAuraDiscount=Math.max(Number(gameState.spellAuraDiscount||0),3);
    };
    card.onPlay=function(gameState) {
      if(name==="ダーククレスト") gainRandom(gameState,MINIONS.filter(c=>c.tribe==="ナーガ"&&c.id!==card.id),count(1,2));
      if(name==="ゴニックスケイル") gainNamed(gameState,"夢のエッセンス",count(1,2));
    };
    card.onTurnStart=function(gameState) {
      card.turnTriggers=0;
      if(name==="ダーククレスト"&&gameState.hand.length<HAND_LIMIT)gainRandom(gameState,MINIONS.filter(c=>c.tribe==="ナーガ"&&c.id!==card.id),count(1,2));
      if(name==="ゴニックスケイル"&&gameState.hand.length<HAND_LIMIT)gainNamed(gameState,"夢のエッセンス",count(1,2));
    };
    return card;
  }
  SPELLS.splice(0,SPELLS.length,...EXCEL_CARD_DATA.spells.map(compileSpell));
  MINIONS.splice(0,MINIONS.length,...EXCEL_CARD_DATA.minions.map(compileMinion));

  const oldInitialState=initialState;
  initialState=function() {
    oldInitialState();
    state.maxGold=10; state.remainingSeconds=60; state.maxBoardMinions=7;
    state.sellEffectMultiplier=1; state.nextSellEffectMultiplier=1; state.turnEndMultiplier=1;
    state.spellsCastThisTurn=[]; state.nextTurnGoldPenalty=0; state.nextTurnTimeBonus=0;
  };

  const oldPlayHandCardToSlot=playHandCardToSlot;
  playHandCardToSlot=function(index,targetIndex) {
    const card=state.hand[index];
    if(card && ((card.unlockTier&&state.tavernTier<card.unlockTier)||(card.unlockRerolls&&state.rerolls<card.unlockRerolls)||(card.lockedUntilTurn&&state.turn<card.lockedUntilTurn))) {
      log("このカードはまだ使用できない。"); render(); return false;
    }
    const before=card?clone(card):null;
    const result=oldPlayHandCardToSlot(index,targetIndex);
    if(result && before) {
      if(before.type==="spell") { state.spellsCastThisTurn.push(before); if(typeof notifyBoard==="function")notifyBoard("onSpellCast",state,before); }
      else { const placed=state.board[targetIndex]; if(placed&&typeof placed.onPlay==="function")placed.onPlay(state); if(placed?.tribe==="エレメンタル"&&typeof notifyBoard==="function")notifyBoard("onElementalPlayed",state,placed); }
    }
    return result;
  };

  const oldSellBoardCard=sellBoardCard;
  sellBoardCard=function(index) {
    const sold=state.board[index] ? clone(state.board[index]) : null;
    const value=sold?.name==="よいごし" ? (sold.awakened?6:3) : 1;
    const before=state.gold;
    const result=oldSellBoardCard(index);
    if(sold) {
      state.gold += Math.max(0,value-1);
      if(sold.tribe==="エレメンタル"&&typeof notifyBoard==="function")notifyBoard("onElementalSold",state,sold);
    }
    return result;
  };

  const oldGetRerollCost=getRerollCost;
  getRerollCost=function(gameState=state) { return oldGetRerollCost(gameState); };

  const oldDrawShop=drawShop;
  drawShop=function() {
    const result=oldDrawShop();
    const atk=Number(state.excelRightmostAtk||0),hp=Number(state.excelRightmostHp||0);
    const x=rightmostMinion(state); if(x&&(atk||hp)){x.atk+=atk;x.hp+=hp;}
    return result;
  };

  const oldUpdateAuras=updateAuras;
  updateAuras=function() {
    state.sellEffectMultiplier=1; state.turnEndMultiplier=1; state.spellAuraDiscount=0;
    const result=oldUpdateAuras();
    return result;
  };

  window.EXCEL_CARD_DATA=EXCEL_CARD_DATA;
  setupRun();
  render();
  log(`Excel版カードリストを適用：ミニオン${MINIONS.length}枚 / スペル${SPELLS.length}枚。`);
})();
