# Core loop prototype

A grey-box of the Little Street Café loop: plan the menu, work the shift, close the
books, seven days. No art, no audio, no polish — it exists to answer whether serving and
making business decisions are enjoyable before any money goes into decoration assets.

See `../docs/vertical-slice.md` for what it is testing and how to run a session.

## Running it

`cafe.html` is the single source of truth. It is authored without the
`<!doctype>/<html>/<head>/<body>` wrapper so the same file can be published as a
shareable link for phone testing.

To open it locally:

```sh
./build.sh          # wraps cafe.html into a standalone index.html
open index.html     # or: npx http-server .
```

`index.html` is generated and git-ignored. Edit `cafe.html`.

## Where the tuning lives

Everything a playtest will want to change is a plain data object at the top of the
script in `cafe.html`:

- `RECIPES` — name, price, ingredient cost, appeal weight, station sequence
- `REGULARS` — the three recurring customers, their one order, three story beats each,
  the line they say when you are not serving what they came for, and their payoff
- `UPGRADES`, `RENT`, `LAST_DAY` — the economy
- `customerCount()` — shift length

No game rule is hard-coded anywhere else. Re-tuning between playtests should be a number
change, and the numbers you land on carry over to whichever engine you pick.

Progress saves to `localStorage`; **Restart** in the header clears it.
