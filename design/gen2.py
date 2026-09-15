# -*- coding: utf-8 -*-
import io, json
from gen import *

S = {}

def toggle(on=True):
    return ('<div style="width:46px;height:27px;border-radius:14px;background:%s;padding:3px;display:flex;'
            'justify-content:%s;flex:none">'
            '<div style="width:21px;height:21px;border-radius:11px;background:%s"></div></div>'
            % (AMB5 if on else INK6, "flex-end" if on else "flex-start", INK9 if on else CREAM6))

def srow(name, sub, control):
    return ('<div class="row" style="gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid %s">'
            '<div class="col" style="flex:1;gap:2px;min-width:0">'
            '<span style="font-size:14px">%s</span>'
            '<span style="font-size:11px;color:%s">%s</span></div>%s</div>' % (INK6, name, CREAM6, sub, control))

def seg(options, active):
    out = ''
    for o in options:
        on = (o == active)
        out += ('<div class="mono" style="flex:1;text-align:center;padding:8px 4px;border-radius:8px;'
                'font-size:11px;background:%s;color:%s">%s</div>'
                % (AMB5 if on else "transparent", INK9 if on else CREAM4, o))
    return ('<div class="row" style="gap:3px;padding:3px;border-radius:11px;background:%s;border:1px solid %s;'
            'width:186px;flex:none">%s</div>' % (INK7, INK6, out))

# ---------------- S-13 SETTINGS ----------------
S["Settings"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Caf&eacute; Rush", "Settings")
    + '<div class="col pad" style="gap:0;margin-top:14px;flex:1;overflow:hidden">'
    + srow("Sound effects", "Taps, pours, the till", toggle(True))
    + srow("Music", "One loop, quiet", toggle(False))
    + srow("Haptics", "A tap on collect, a thump on serve", toggle(True))
    + srow("Reduced motion", "No travel, no bounce", toggle(False))
    + srow("Colour-blind mode", "Adds notches and numbers to every state", seg(["Off", "Deutan", "Protan"], "Deutan"))
    + srow("Text size", "", seg(["S", "M", "L"], "M"))
    + srow("Hand", "Which side the bins favour", seg(["Left", "Right"], "Right"))
    + srow("Language", "", seg(["English", "&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;"], "English"))
    + '</div>'
      '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn2">Restore purchase</div>'
      '<div class="row" style="gap:10px">'
      '<div class="btn2" style="flex:1">Credits</div>'
      '<div class="btn2" style="flex:1;color:%s;border-color:%s">Reset save</div></div>'
      '<div class="btn">Done</div></div>' % (TERRA, TERRA)
    + '<div class="sb"></div></div>')

# ---------------- S-14 STORE ----------------
S["Store"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("The whole caf&eacute;", "One price, once")
    + '<div class="col pad" style="gap:14px;margin-top:18px;flex:1">'
      '<div class="row" style="gap:8px;justify-content:center;padding:6px 0">%s%s%s%s</div>'
      '<div class="col panel" style="gap:12px;padding:20px;border-color:%s">'
      % (sprite("espresso", 54), sprite("iced", 58), sprite("almond", 54), sprite("karak", 58), AMB5)
    + ''.join('<div class="row" style="gap:10px;align-items:flex-start">'
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="2.4" '
              'stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:1px">'
              '<path d="M4 12.5l5 5L20 6.5"/></svg>'
              '<span style="font-size:13.5px;line-height:1.45;color:%s">%s</span></div>' % (OK, CREAM, t)
              for t in ["All 30 days, across five chapters",
                        "Twelve drinks and eight machines",
                        "Endless rush, with every machine in play",
                        "No adverts, ever",
                        "No gems, no energy, no waiting",
                        "Play it once and own it"])
    + '</div>'
      '<div class="col panel" style="align-items:center;gap:2px;padding:16px;border-color:%s">'
      '<span class="dsp mono" style="font-size:34px;color:%s">24.99 AED</span>'
      '<span class="mono" style="font-size:11px;color:%s">one payment &middot; no subscription</span></div>'
      '</div>' % (INK6, BRASS, CREAM6)
    + '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Unlock the caf&eacute;</div>'
      '<div class="btn2">Restore a previous purchase</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-15 RECIPES ----------------
def rrow(needs, name, price, day, times):
    chips = ''
    for i, n in enumerate(needs):
        if i:
            chips += '<span class="mono" style="color:%s;font-size:11px">+</span>' % CREAM6
        chips += ('<div class="col" style="align-items:center;gap:2px">'
                  '<div style="width:34px;height:34px;border-radius:8px;background:%s;border:1px solid %s;'
                  'display:flex;align-items:center;justify-content:center">%s</div>'
                  '<span class="mono" style="font-size:9px;color:%s">%s</span></div>'
                  % (INK7, INK6, sprite(n, 26), CREAM6, times[i]))
    return ('<div class="row" style="gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid %s">'
            '<div class="row" style="gap:5px;align-items:center">%s</div>'
            '<div class="col" style="flex:1;gap:1px;min-width:0">'
            '<span style="font-size:13.5px">%s</span>'
            '<span class="mono" style="font-size:10px;color:%s">day %s</span></div>'
            '<span class="mono" style="font-size:14px;color:%s">%s</span></div>'
            % (INK6, chips, name, CREAM6, day, BRASS, price))

S["Recipes"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Reference", "Recipes",
                  "Cook times are per ingredient, at level one. The bin fills; the plate is instant.")
    + '<div class="col pad" style="gap:0;margin-top:14px;flex:1;overflow:hidden">'
    + rrow(["shot"], "Espresso", "12", "1", ["2.2s"])
    + rrow(["tea", "syrup"], "Mint tea", "10", "1", ["2.6s", "1.0s"])
    + rrow(["shot", "milk"], "Latte", "20", "2", ["2.2s", "2.0s"])
    + rrow(["tea", "milk", "syrup"], "Karak chai", "16", "3", ["2.6s", "2.0s", "1.0s"])
    + rrow(["pastry", "syrup"], "Almond croissant", "18", "4", ["4.0s", "1.0s"])
    + rrow(["shot", "milk", "ice"], "Iced latte", "26", "5", ["2.2s", "2.0s", "0.9s"])
    + '<div class="row" style="gap:10px;align-items:center;padding:13px 0;opacity:.45">'
      '<div style="width:34px;height:34px;border-radius:8px;border:1px dashed %s;display:flex;'
      'align-items:center;justify-content:center">'
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="2" '
      'stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>'
      '</div><span style="flex:1;font-size:13px;color:%s">Six more unlock in chapters two and three</span></div>'
      '</div>' % (INK6, CREAM6, CREAM6)
    + '<div class="col pad" style="padding-bottom:14px"><div class="btn2">Close</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-16 PURCHASE SUCCESS ----------------
S["PurchaseSuccess"] = wrap(
    '<div class="scr"><div class="col" style="position:absolute;inset:0;justify-content:center;'
    'align-items:center;gap:22px;padding:0 30px">'
    '<div style="width:112px;height:112px;border-radius:56px;border:3px solid %s;display:flex;'
    'align-items:center;justify-content:center">'
    '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="2.2" '
    'stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg></div>'
    '<div class="col" style="align-items:center;gap:8px">'
    '<h1 class="dsp" style="font-size:30px;text-align:center">The caf&eacute; is yours</h1>'
    '<span style="color:%s;font-size:14px;text-align:center;line-height:1.5">All thirty days are open. '
    'Nothing else to buy, now or later.</span></div></div></div>' % (OK, OK, CREAM4))

# ---------------- S-17 PURCHASE ERROR ----------------
S["PurchaseError"] = wrap(
    '<div class="scr"><div class="col" style="position:absolute;inset:0;justify-content:center;'
    'align-items:center;gap:22px;padding:0 26px">'
    '<div style="width:96px;height:96px;border-radius:48px;border:3px solid %s;display:flex;'
    'align-items:center;justify-content:center">'
    '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="2.2" '
    'stroke-linecap="round"><path d="M12 7v7"/><circle cx="12" cy="17.6" r="1.2" fill="%s" stroke="none"/></svg></div>'
    '<div class="col" style="align-items:center;gap:10px">'
    '<h1 class="dsp" style="font-size:26px;text-align:center">The store did not answer</h1>'
    '<span style="color:%s;font-size:14px;text-align:center;line-height:1.55">Nothing was charged. '
    'This is usually the connection rather than your account &mdash; try again in a moment.</span></div>'
    '<div class="col" style="width:100%%;gap:10px">'
    '<div class="btn">Try again</div><div class="btn2">Not now</div></div></div></div>'
    % (TERRA, TERRA, TERRA, CREAM4))

# ---------------- S-18 ONBOARDING (coach step over gameplay) ----------------
S["Onboarding"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + hud("1", "60", "210", pause=False)
    + meters(28, 88)
    + '<div class="col pad" style="height:160px;flex:none;justify-content:center;opacity:.35">'
      '<div class="row" style="gap:8px;align-items:stretch;height:148px">'
    + ticket("p1", "Espresso", ["shot"], 86, CALM, "16")
    + '<div class="panel" style="flex:1;border-style:dashed"></div>'
      '<div class="panel" style="flex:1;border-style:dashed"></div>'
      '</div></div>'
    + '<div style="height:216px;flex:none;position:relative;background:%s;opacity:.3"></div>' % TILE
    + '<div class="row pad" style="height:92px;flex:none;align-items:center;opacity:.35">'
      '<div class="row" style="flex:1;gap:8px;align-items:center;height:72px;padding:0 12px;'
      'border-radius:14px;background:%s;border:1px dashed %s">'
      '<span style="color:%s;font-size:12px">Plate empty</span></div></div>' % (INK8, INK6, CREAM6)
    + '<div class="pad" style="height:225px;flex:none;display:grid;'
      'grid-template-columns:repeat(3, minmax(0, 1fr));gap:9px">'
    + ('<div class="col panel" style="align-items:center;gap:4px;padding:8px 4px 7px;position:relative;'
       'border-color:%s;box-shadow:0 0 0 3px rgba(242,160,61,.25)">'
       '<div style="position:absolute;top:0;right:0;width:44px;height:44px;border-radius:0 14px 0 14px;'
       'background:%s;display:flex;align-items:center;justify-content:center;color:%s;'
       'font-family:\'Bricolage Grotesque\',sans-serif;font-weight:800;font-size:20px">+</div>'
       '%s<span style="font-size:10px;color:%s">Shot</span>'
       '<div class="row" style="gap:4px;height:8px"><span style="width:8px;height:8px;border-radius:50%%;'
       'background:%s"></span><span style="width:8px;height:8px;border-radius:50%%;background:%s"></span>'
       '<span style="width:8px;height:8px;border-radius:50%%;background:%s"></span></div></div>'
       % (AMB5, AMB5, INK9, sprite("shot", 34), CREAM, INK6, INK6, INK6))
    + ''.join('<div class="col panel" style="align-items:center;gap:4px;padding:8px 4px;opacity:.28">%s'
              '<span style="font-size:10px;color:%s">%s</span></div>' % (sprite(n, 34), CREAM4, l)
              for n, l in [("tea", "Tea"), ("syrup", "Syrup"), ("milk", "Milk"), ("pastry", "Pastry"), ("ice", "Ice")])
    + '</div>'
    + '<div class="col" style="position:absolute;left:20px;right:20px;bottom:266px;gap:10px;'
      'padding:16px 18px;border-radius:14px;background:%s;border:1px solid %s">'
      '<span class="lbl" style="color:%s">Step 1 of 4</span>'
      '<span style="font-size:15px;line-height:1.45">Tap <b style="color:%s">+</b> to start a shot. '
      'It cooks while you do other things.</span>'
      '<div class="row" style="gap:6px;margin-top:2px">'
      + ''.join('<div style="width:%dpx;height:4px;border-radius:2px;background:%s"></div>'
                % (22 if i == 0 else 10, AMB5 if i == 0 else INK6) for i in range(4))
      + '</div></div>' % ()
    + '<div class="sb"></div></div>')

# ---------------- S-19 LANGUAGE ----------------
S["Language"] = wrap(
    '<div class="scr"><div class="col" style="position:absolute;inset:0;justify-content:center;'
    'align-items:center;gap:30px;padding:0 26px">'
    '<div class="row" style="gap:10px">%s%s</div>'
    '<div class="col" style="align-items:center;gap:6px">'
    '<h1 class="dsp" style="font-size:28px;text-align:center">Choose a language</h1>'
    '<span class="dsp" style="font-size:22px;color:%s;text-align:center">&#1575;&#1582;&#1578;&#1585; &#1575;&#1604;&#1604;&#1594;&#1577;</span></div>'
    '<div class="col" style="width:100%%;gap:10px">'
    '<div class="btn">English</div>'
    '<div class="btn2" style="font-size:19px">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</div></div>'
    '<span class="mono" style="font-size:11px;color:%s;text-align:center">You can change this later in settings</span>'
    '</div></div>' % (sprite("karak", 64), sprite("almond", 64), CREAM4, CREAM6))

# ---------------- S-20 CREDITS ----------------
S["Credits"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Caf&eacute; Rush", "Credits")
    + '<div class="col pad" style="gap:18px;margin-top:20px;flex:1">'
    + ''.join('<div class="col" style="gap:4px"><span class="lbl">%s</span>'
              '<span style="font-size:14px;line-height:1.5;color:%s">%s</span></div>' % (k, CREAM, v)
              for k, v in [("Design and code", "[YOUR NAME]"),
                           ("Art", "Built in-repo as geometry"),
                           ("Typefaces", "Bricolage Grotesque, DM Sans, DM Mono &mdash; SIL Open Font Licence"),
                           ("Arabic typefaces", "Cairo, IBM Plex Sans Arabic &mdash; SIL Open Font Licence"),
                           ("Sound", "[LICENCE TO FILL IN]"),
                           ("Thanks", "To everyone on r/CozyGamers who said what they actually wanted")])
    + '</div>'
      '<div class="col pad" style="padding-bottom:14px"><div class="btn2">Back</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-21 SAVE ERROR ----------------
S["SaveError"] = wrap(
    '<div class="scr"><div class="col" style="position:absolute;inset:0;justify-content:center;'
    'align-items:center;gap:22px;padding:0 26px">'
    '<div class="col" style="align-items:center;gap:10px">'
    '<h1 class="dsp" style="font-size:26px;text-align:center">We could not read your save</h1>'
    '<span style="color:%s;font-size:14px;text-align:center;line-height:1.55">Your purchase is safe &mdash; '
    'it lives with your store account, not in the save file. Only the day you had reached is affected.</span></div>'
    '<div class="col" style="width:100%%;gap:10px">'
    '<div class="btn">Try again</div>'
    '<div class="btn2">Start a fresh caf&eacute;</div></div></div></div>' % CREAM4)

a = json.loads(io.open("screens_a.json", encoding="utf-8").read())
a.update(S)
for name, src in a.items():
    io.open(name + ".dc.html", "w", encoding="utf-8").write(src)
print("wrote", len(a), "artboards:", ", ".join(sorted(a)))
