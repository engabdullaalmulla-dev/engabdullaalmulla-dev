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

const ORDER = ["sign","case_","grinder","slot","stool","table","radio","plant","awning",
               "aircon","barista","backroom","slot","stool","upstairs","manager",
               "branch","freehold","branch","branch","branch"];

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
    function spend(bought){
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
      G = NEW(); const track = [], bought = {};
      for(let s = 0; s < YEARS*4; s++){
        spend(bought); setBoard();
        const before = G.cash;
        runService(true);
        if(POLICY !== "greedy"){ G.cash += Math.round(G.lastTake*0.04); G.rep += 1; }
        track.push({net: Math.round(G.cash - before), cash: Math.round(G.cash), seats: G.seats,
                    rep: G.rep, br: G.branches.length, take: Math.round(G.lastTake),
                    rent: Math.round(rentNow()), wage: staffWage()});
      }
      out.push({track, bought, seats: G.seats});
    }
    return out;
  }, [YEARS, RUNS, POLICY, ORDER]);

  const med = a => a.slice().sort((x,y) => x-y)[Math.floor(a.length/2)];
  const yr  = (r, y) => r.track[y*4 - 1];
  console.log(`${POLICY} · ${res.length} runs · ${YEARS} years`);
  console.log(pad('year',5)+pad('cash',12)+pad('net/season',12)+pad('take',9)+pad('rent',8)
            + pad('wages',8)+pad('seats',7)+pad('rep',6)+pad('br',5));
  for(const y of [1,5,10,13,15,20,25,30].filter(y => y <= YEARS))
    console.log(pad(y,5)
      + pad(med(res.map(r => yr(r,y).cash)).toLocaleString(),12)
      + pad(med(res.flatMap(r => r.track.slice(y*4-4, y*4).map(t => t.net))),12)
      + pad(med(res.map(r => yr(r,y).take)).toLocaleString(),9)
      + pad(med(res.map(r => yr(r,y).rent)).toLocaleString(),8)
      + pad(med(res.map(r => yr(r,y).wage)).toLocaleString(),8)
      + pad(med(res.map(r => yr(r,y).seats)),7)
      + pad(med(res.map(r => yr(r,y).rep)),6)
      + pad(med(res.map(r => yr(r,y).br)),5));

  const all = await p.evaluate(() => Object.keys(ITEMS));
  const never = all.filter(k => !res.some(r => r.bought[k]));
  console.log('\nnever affordable in any run:', never.join(', ') || 'none');
  if(errs.length) console.log('PAGE ERRORS:', errs.slice(0,3));
  await b.close();
})();
