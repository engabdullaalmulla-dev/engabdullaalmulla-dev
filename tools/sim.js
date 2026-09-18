/* A bot that plays Café Life for a few hundred years, so the economy can be measured instead
   of guessed at. Nobody has played the loop by hand for three centuries; this is the next
   best thing, and it is how the wall at year 13, the thirty-cup regular and the ladder that
   emptied by 1998 were all found.

   Run:  NODE_PATH=/opt/node22/lib/node_modules node tools/sim.js [years] [runs] [policy]
   Policies:
     greedy  buys the dearest thing it can afford, board sorted by price alone
     good    plays the board to the season's demand and taps guests for tips and rep
     saver   as good, but follows a build order and saves for the next tier instead of
             spraying cash at stools -- this is the one that plays most like a person

   IT WAS BROKEN AND SAID NOTHING. The unit used to be a season, four a year, and one call to
   runService(true) was a whole season of trade. A day is the unit now and a month is the
   spending round, so this bot was buying after every single day and reporting "never" for
   almost every unlock -- numbers that looked like a result. A measuring tool that is wrong in
   silence is worse than none, so it trades a full month before it settles anything, exactly
   as the game does when a player hands the month to the counter. */
const { chromium } = require('playwright');
const path = require('path');
const pad = (s, n) => String(s).padStart(n);

/* A plausible build order for someone who has played before. Repeats matter: the bot buys
   the k-th copy of an item only when it has reached the k-th mention, so listing "stool"
   once quietly capped the bot at one stool and made the café look poorer than the game is. */
const ORDER = [
  "doup", "sign", "stool", "case_", "stool", "grinder", "slot", "table", "stool", "dallah",
  "radio", "plant", "stool", "awning", "stool_pad", "table", "stool", "aircon", "slot", "juicer",
  "stool", "barista", "barista", "backroom", "stool", "table_lg", "pendant", "outdoor", "table",
  "stool", "plant", "slot", "stool", "upstairs", "stool", "barista", "manager", "barista",
  "barista", "plant", "slot", "slot", "branch", "freehold",
  "branch", "branch", "branch", "branch", "branch", "branch", "branch", "branch"
];

(async () => {
  const YEARS  = Number(process.argv[2] || 60);
  const RUNS   = Number(process.argv[3] || 8);
  const POLICY = process.argv[4] || "saver";
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.join(path.dirname(__dirname), 'prototype/cafelife.html'));
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
        if(!next) return;
        const price = Math.round(RECIPES[next].buy * infl() * MONTH_SCALE);
        if(price > G.cash * 0.4) return;
        G.cash -= price; G.recipes.push(next);
        bought["recipe:" + next] = 1;
      }
    }
    /* Sourcing and the bench are both standing costs rather than purchases, and both are
       sinks the late game needs. A bot that ignores them reports a café far richer than one
       anybody plays. */
    function upgradeSupply(bought){
      if(POLICY === "greedy") return;
      const order = ["whole", "roast", "estate"];
      const now = order.indexOf(G.supplier);
      const next = order[now + 1] || (G.supplier === "cc" ? "whole" : null);
      if(!next) return;
      const join = Math.round(SUPPLIERS[next].join * infl() * MONTH_SCALE / 10);
      const fee  = Math.round(SUPPLIERS[next].fee * infl() * FIXED);
      // only if a month's takings can carry the standing fee several times over
      if(G.cash > join * 2 && G.lastTake > fee * 4){
        G.cash -= join; G.supplier = next; bought["supply:" + next] = 1;
      }
    }
    function runBench(bought){
      if(POLICY === "greedy" || G.lab) return;
      const each = Math.round(labCost() / labMonths());
      if(G.cash > each * labMonths() * 3){
        G.lab = {line: pick(["sweet","warm","cold","savoury","quick"]),
                 t:"bench", months: labMonths(), each: each};
        bought.bench = (bought.bench || 0) + 1;
      }
    }
    function spend(bought, first){
      buyRecipes(bought); upgradeSupply(bought); runBench(bought);
      if(POLICY === "saver"){
        for(let guard = 0; guard < 30; guard++){
          let target = null, seen = {};
          for(const k of ORDER){ seen[k] = (seen[k] || 0) + 1;
            if(ITEMS[k] && own(k) < Math.min(seen[k], ITEMS[k].max)){ target = k; break; } }
          if(!target) return;
          const c = costOfItem(target, own(target));
          if(c > G.cash * 0.6) return;                        // save for it
          G.cash -= c; G.owned[target] = (G.owned[target]||0) + 1; ITEMS[target].f(G);
          bought[target] = (bought[target]||0) + 1;
          if(first[target] === undefined) first[target] = G.year;
        }
        return;
      }
      for(let guard = 0; guard < 60; guard++){
        const opts = Object.keys(ITEMS).map(k => ({k:k, c:costOfItem(k, own(k))}))
          .filter(o => own(o.k) < ITEMS[o.k].max && o.c <= G.cash * 0.6)
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

    /* One month, traded day by day with nobody watching, then settled -- the same path the
       game takes when the player hands the rest of the month over. */
    function playMonth(){
      while(G.day <= monthDays()){
        const q = buildQueue();
        SV = {q:q, i:q.length, take:0, profit:0, served:0, missed:0, seen:[], tips:0,
              moment:null, visits:0, offstage:0};
        q.forEach(c => { const r = serveOne(c);
          if(r.k){ SV.take += r.pay; SV.profit += r.profit; SV.served++; SV.offstage++;
                   if(c.reg){ if(SV.seen.indexOf(c.reg.k) < 0) SV.seen.push(c.reg.k);
                              regState(c.reg.k).warmth += trait().warm; } }
          else { SV.missed++; if(c.reg) regState(c.reg.k).warmth--; } });
        const m = G.mo;
        m.take += SV.take; m.profit += SV.profit; m.served += SV.served;
        m.missed += SV.missed; m.offstage += SV.offstage; m.days++;
        SV.seen.forEach(k => { if(m.seen.indexOf(k) < 0) m.seen.push(k); });
        G.wear = (G.wear || 0) + SV.served/70;
        G.day++;
      }
      const M = G.mo;                       // settleMonth swaps in a fresh tally
      const served = M.served, take = M.take;
      const r = settleMonth();
      /* A player at the counter goes over to people; a bot cannot tap. Tips and the rep that
         comes with them are worth roughly what those visits would have earned. */
      if(POLICY !== "greedy" && served){
        G.cash += Math.round(visitsToday() * monthDays() * (take/served * 0.04 + 2));
        G.rep += 1;
      }
      return r;
    }

    const out = [];
    for(let run = 0; run < RUNS; run++){
      G = NEW();
      G.setup = true; G.seenIntro = true;
      const t = pick(TRAITS); G.owner.trait = t.k; G.owner.traitT = t.t;
      const track = [], bought = {}, first = {}, afford = {}, gens = [];
      let broke = 0, seized = 0;

      for(let mo = 0; mo < YEARS*12; mo++){
        spend(bought, first);
        setBoard();
        const r = playMonth();
        if(r.overdrawn) broke++;
        if(r.seized) seized++;
        if(G.owner.age >= G.owner.dies){          // a player would choose; the bot takes one
          G.gen++; G.cash = Math.round(G.cash * 0.45); G.owner = makeHeir();
          REGULARS.forEach(x => { const st = regState(x.k);
            if(st.done) G.regs[x.k] = {met:false, beat:0, warmth:0, done:false}; });
          gens.push(G.year + " " + G.owner.traitT);
        }
        // the honest target: the first year the cash on hand would have covered it
        Object.keys(ITEMS).forEach(k => {
          if(afford[k] === undefined && own(k) < ITEMS[k].max
             && costOfItem(k, own(k)) <= G.cash) afford[k] = G.year;
        });
        if(mo % 60 === 0 || mo === YEARS*12 - 1)
          track.push({year:G.year, cash:Math.round(G.cash), take:Math.round(G.lastTake),
                      seats:G.seats, slots:G.slots, debt:Math.round(G.debt),
                      goals:Object.keys(G.goals).length,
                      stories:REGULARS.reduce((a,x) => a + regState(x.k).beat, 0)});
      }
      out.push({track, bought, first, afford, gens, broke, seized,
                end:{cash:Math.round(G.cash), year:G.year, gen:G.gen,
                     goals:Object.keys(G.goals).length, debt:Math.round(G.debt)}});
    }
    return out;
  }, [YEARS, RUNS, POLICY, ORDER]);

  /* --- the curve, averaged across runs --- */
  console.log("\n" + POLICY + " · " + RUNS + " runs · " + YEARS + " years each\n");
  console.log("year      cash   month-take  seats slots   debt goals stories");
  const rows = res[0].track.length;
  for(let i = 0; i < rows; i++){
    const at = k => Math.round(res.reduce((a,r) => a + r.track[i][k], 0) / res.length);
    console.log(pad(res[0].track[i].year,4) + pad(at("cash").toLocaleString(),10)
      + pad(at("take").toLocaleString(),13) + pad(at("seats"),7) + pad(at("slots"),6)
      + pad(at("debt").toLocaleString(),7) + pad(at("goals"),6) + pad(at("stories"),8));
  }

  /* --- when each unlock became affordable, and when it was actually bought --- */
  console.log("\n  unlock   affordable     bought    runs");
  ["slot","backroom","upstairs","barista","manager","branch","freehold"].forEach(k => {
    const aff = res.map(r => r.afford[k]).filter(Boolean);
    const got = res.map(r => r.first[k]).filter(Boolean);
    const mid = a => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : null;
    console.log(pad(k,10) + pad(mid(aff) || "never",13) + pad(mid(got) || "never",11)
      + pad(got.length + "/" + res.length, 8));
  });

  const avg = k => (res.reduce((a,r) => a + r.end[k], 0) / res.length);
  const sum = k => res.reduce((a,r) => a + r[k], 0);
  console.log("\nended: " + Math.round(avg("cash")).toLocaleString() + " AED, generation "
    + avg("gen").toFixed(1) + ", " + avg("goals").toFixed(1) + " of " + "ambitions"
    + ", " + Math.round(avg("debt")).toLocaleString() + " owed");
  console.log("months overdrawn across all runs: " + sum("broke")
    + " · repossessions: " + sum("seized"));
  console.log("generations (first run): " + (res[0].gens.join(", ") || "none"));
  if(errs.length) console.log("\nPAGE ERRORS: " + errs.slice(0,3).join(" | "));
  await b.close();
})();
