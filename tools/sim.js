/* A bot that plays Café Life to the end of a dynasty, so the economy can be measured instead
   of guessed at. The loop has never been played by a person for thirty years; this is the
   next best thing and it is how the wall at year 13 was found.

   Run:  NODE_PATH=/opt/node22/lib/node_modules node tools/sim.js [years] [runs] [policy]
   Policies:
     greedy  buys the most expensive thing it can afford, board sorted by price alone
     good    plays the board to the season's demand and taps guests for tips and rep
     saver   as good, but follows a build order and saves for the next tier instead of
             spraying cash at stools -- this is the one that plays most like a person

   runService(true) resolves a whole season without touching the DOM, which is what makes
   this possible at all. Tapping cannot be automated, so "good" and "saver" approximate a
   player who taps: tips are about 4% of the take, and any tip is worth +1 rep that season. */
const { chromium } = require('playwright');
const pad = (s, n) => String(s).padStart(n);

/* A plausible build order for someone who has played before. Repeats matter: the bot buys
   the k-th copy of an item only when it has reached the k-th mention, so listing "stool"
   once quietly capped the bot at one stool and made the café look poorer than the game is. */
const ORDER = [
  "sign", "stool", "case_", "stool", "grinder", "slot", "table", "stool", "dallah",
  "radio", "plant", "stool", "awning", "stool_pad", "table", "stool", "aircon", "slot", "juicer",
  "stool", "barista", "barista", "backroom", "stool", "table_lg", "pendant", "outdoor", "table", "stool", "plant", "slot",
  "stool", "upstairs", "stool", "barista", "manager", "barista", "barista", "plant", "slot", "slot",
  "branch", "freehold", "branch", "branch", "branch", "branch", "branch"
];

(async () => {
  const YEARS  = Number(process.argv[2] || 30);
  const RUNS   = Number(process.argv[3] || 16);
  const POLICY = process.argv[4] || "saver";
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.cwd() + '/prototype/cafelife.html');
  await p.waitForTimeout(300);

  const res = await p.evaluate(([YEARS, RUNS, POLICY, ORDER]) => {
    /* Recipes are bought on the shop screen, not out of ITEMS, so a bot that only walks ITEMS
       never buys one and the café sells karak, mint and its own inventions forever. That is
       not a café anyone runs, and it also means five of the six regulars can never appear:
       their usuals are espresso, iced, regag, shake and saffron, all of which cost money. */
    function buyRecipes(bought){
      for(let guard = 0; guard < 8; guard++){
        const next = Object.keys(RECIPES)
          .filter(k => RECIPES[k].buy > 0 && G.recipes.indexOf(k) < 0)
          .sort((a,b) => RECIPES[a].buy - RECIPES[b].buy)[0];
        if(!next || RECIPES[next].buy > G.cash - 250) return;
        G.cash -= RECIPES[next].buy; G.recipes.push(next);
        bought["recipe:" + next] = 1;
      }
    }
    function spend(bought, first){
      buyRecipes(bought);
      if(POLICY === "saver"){
        for(let guard = 0; guard < 30; guard++){
          let target = null, seen = {};
          for(const k of ORDER){ seen[k] = (seen[k] || 0) + 1;
            if(own(k) < Math.min(seen[k], ITEMS[k].max)){ target = k; break; } }
          if(!target) return;
          const c = costOfItem(target, own(target));
          if(c > G.cash - 200) return;                       // save for it
          G.cash -= c; G.owned[target] = (G.owned[target]||0) + 1; ITEMS[target].f(G);
          bought[target] = (bought[target]||0) + 1;
          if(first[target] === undefined) first[target] = G.year;
        }
        return;
      }
      for(let guard = 0; guard < 60; guard++){
        const opts = Object.keys(ITEMS).map(k => ({k:k, c:costOfItem(k, own(k))}))
          .filter(o => own(o.k) < ITEMS[o.k].max && o.c <= G.cash - 300)
          .sort((a,b) => b.c - a.c);
        if(!opts.length) return;
        const o = opts[0];
        G.cash -= o.c; G.owned[o.k] = (G.owned[o.k]||0) + 1; ITEMS[o.k].f(G);
        bought[o.k] = (bought[o.k]||0) + 1;
        if(first[o.k] === undefined) first[o.k] = G.year;
      }
    }
    function setBoard(){
      const want = season().want;
      const byPrice = (x,y) => RECIPES[y].price - RECIPES[x].price;
      const bySeason = (x,y) => {
        const sc = k => (RECIPES[k].tags.some(t => want.indexOf(t) >= 0) ? 10000 : 0) + RECIPES[k].price;
        return sc(y) - sc(x);
      };
      G.board = G.recipes.slice().sort(POLICY === "greedy" ? byPrice : bySeason).slice(0, G.slots);
    }
    const out = [];
    for(let run = 0; run < RUNS; run++){
      G = NEW(); const track = [], bought = {}, first = {}, afford = {};
      for(let s = 0; s < YEARS*4; s++){
        spend(bought, first);
        /* Invention is the other uncapped sink and it lives in the shop screen rather than
           in ITEMS, so a bot that only walks ITEMS never spends on it and the late game looks
           far richer than it is. A player with money and nothing left to buy invents. */
        if(POLICY !== "greedy"){
          for(let g3 = 0; g3 < 3; g3++){
            const n = G.cookbook.filter(c => c.invented).length;
            const cost = Math.round(900 * Math.pow(1.45, n) * infl());
            if(cost > G.cash - 1500) break;
            G.cash -= cost; invent(); bought.invent = (bought.invent||0) + 1;
          }
        }
        setBoard();
        const before = G.cash;
        runService(true);
        /* runService(true) is the manager running the season, and she returns MANAGER_CUT of
           the profit. Everything here was measured on that path, which quietly understated a
           person playing by about 39%. A "good" or "saver" bot is a person at the counter, so
           it takes the rest back, and earns the three visits' worth of tips a season now
           allows rather than a flat 4% of everything. */
        if(POLICY !== "greedy"){
          G.cash += Math.round(SV.profit * (1/MANAGER_CUT - 1));
          const perHead = SV.served ? SV.take / SV.served : 0;
          G.cash += Math.round(VISITS * (perHead*0.04 + 2));
          G.rep += 1;
        }
        // "affordable" is the honest target: the first year the cash on hand would cover it,
        // whatever this bot's build order happens to be reaching for at the time
        for(const k of ["upstairs","manager","branch","freehold"])
          if(afford[k] === undefined && G.cash >= costOfItem(k, own(k))) afford[k] = G.year;
        track.push({net: Math.round(G.cash - before), cash: Math.round(G.cash), seats: G.seats,
                    rep: G.rep, br: G.branches.length, take: Math.round(G.lastTake),
                    rent: Math.round(rentNow()), wage: staffWage()});
      }
      out.push({track, bought, first, afford, seats: G.seats});
    }
    return out;
  }, [YEARS, RUNS, POLICY, ORDER]);

  const med = a => a.slice().sort((x,y) => x-y)[Math.floor(a.length/2)];
  const yr  = (r, y) => r.track[y*4 - 1];
  console.log(`${POLICY} · ${res.length} runs · ${YEARS} years`);
  console.log(pad('year',5)+pad('cash',12)+pad('net/season',12)+pad('take',9)+pad('rent',8)
            + pad('wages',8)+pad('seats',7)+pad('rep',6)+pad('br',5));
  for(const y of [1,5,10,13,15,20,25,30,40,50,60].filter(y => y <= YEARS))
    console.log(pad(y,5)
      + pad(med(res.map(r => yr(r,y).cash)).toLocaleString(),12)
      + pad(med(res.flatMap(r => r.track.slice(y*4-4, y*4).map(t => t.net))),12)
      + pad(med(res.map(r => yr(r,y).take)).toLocaleString(),9)
      + pad(med(res.map(r => yr(r,y).rent)).toLocaleString(),8)
      + pad(med(res.map(r => yr(r,y).wage)).toLocaleString(),8)
      + pad(med(res.map(r => yr(r,y).seats)),7)
      + pad(med(res.map(r => yr(r,y).rep)),6)
      + pad(med(res.map(r => yr(r,y).br)),5));

  // the number being tuned: the year the late game actually opens
  console.log('\n' + pad('unlock',12) + pad('affordable',12) + pad('bought',10) + pad('runs',9) + pad('target',9));
  const TARGET = {upstairs:2003, manager:2005, branch:2010, freehold:2017};
  for(const k of ["slot","backroom","upstairs","manager","branch","freehold"]){
    const aff = res.map(r => r.afford[k]).filter(v => v !== undefined);
    const got = res.map(r => r.first[k]).filter(v => v !== undefined);
    console.log(pad(k,12) + pad(aff.length ? med(aff) : 'never',12)
              + pad(got.length ? med(got) : 'never',10)
              + pad(got.length + '/' + res.length,9) + pad(TARGET[k] || '-',9));
  }
  if(errs.length) console.log('PAGE ERRORS:', errs.slice(0,3));
  await b.close();
})();
