# -*- coding: utf-8 -*-
import io, os, json

# ---- tokens lifted verbatim from docs/design-spec.md section 2.3 ----
INK9, INK8, INK7, INK6 = "#171310", "#231C18", "#2E2521", "#3B302A"
CREAM, CREAM4, CREAM6 = "#F7EFE3", "#A8988A", "#6F6058"
AMB5, AMB4, AMB7, BRASS, TERRA = "#F2A03D", "#FFBC63", "#C97C22", "#E8C36B", "#A8452A"
CALM, SOON, URGENT, OK = "#5B9DD9", "#F2A03D", "#E24B2E", "#4FBF7B"
WOOD, WOOD2, TILE, STREET, SUN = "#7A4A2B", "#A9704A", "#3E6E6B", "#1C2430", "#F4D9A8"

HEAD = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap">
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:"DM Sans",system-ui,-apple-system,sans-serif;font-size:14px;
         color:''' + CREAM + ''';background:''' + INK9 + ''';-webkit-font-smoothing:antialiased}
    a{color:''' + AMB5 + '''} a:hover{color:''' + AMB4 + '''}
    .scr{width:390px;height:844px;display:flex;flex-direction:column;background:''' + INK9 + ''';overflow:hidden;position:relative}
    .st{height:47px;flex:none} .sb{height:34px;flex:none}
    .dsp{font-family:"Bricolage Grotesque","DM Sans",sans-serif;font-weight:800;letter-spacing:-.025em;margin:0}
    .mono{font-family:"DM Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}
    .lbl{font-family:"DM Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.14em;
         text-transform:uppercase;color:''' + CREAM6 + '''}
    .panel{background:''' + INK8 + ''';border:1px solid ''' + INK6 + ''';border-radius:14px}
    .btn{height:56px;border-radius:12px;background:''' + AMB5 + ''';color:''' + INK9 + ''';
         font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:17px;
         display:flex;align-items:center;justify-content:center;flex:none}
    .btn2{height:52px;border-radius:12px;background:transparent;border:1px solid ''' + INK6 + ''';
          color:''' + CREAM + ''';font-family:"Bricolage Grotesque",sans-serif;font-weight:600;
          font-size:15px;display:flex;align-items:center;justify-content:center;flex:none}
    .pad{padding-left:20px;padding-right:20px}
    .row{display:flex;align-items:center}
    .col{display:flex;flex-direction:column}
    img{display:block}
  </style>
</helmet>
'''
FOOT = '''</x-dc>
</body>
</html>
'''

def wrap(body, logic=None):
    s = HEAD + body + "\n"
    if logic:
        s += logic + "\n"
    return s + FOOT

def sprite(name, px, extra=""):
    return '<img src="%s.png" alt="" style="width:%dpx;height:%dpx;%s">' % (name, px, px, extra)

def hud(day, earned, target, streak=None, pause=True):
    st = ''
    if streak:
        st = ('<div class="row" style="gap:5px;align-items:center;background:%s;border-radius:8px;'
              'padding:4px 9px"><span class="mono" style="font-size:12px;color:%s">x%s</span></div>'
              % (INK7, AMB5, streak))
    pb = ''
    if pause:
        pb = ('<div style="width:48px;height:48px;border-radius:12px;background:%s;border:1px solid %s;'
              'display:flex;align-items:center;justify-content:center;gap:3px">'
              '<div style="width:3px;height:13px;background:%s;border-radius:1px"></div>'
              '<div style="width:3px;height:13px;background:%s;border-radius:1px"></div></div>'
              % (INK8, INK6, CREAM4, CREAM4))
    def blk(l, v, c=CREAM):
        return ('<div class="col" style="gap:2px"><span class="lbl">%s</span>'
                '<span class="dsp mono" style="font-size:19px;color:%s">%s</span></div>' % (l, c, v))
    return ('<div class="row pad" style="height:56px;gap:18px;flex:none">'
            + blk("Day", day) + blk("Earned", earned, OK) + blk("Target", target)
            + '<div style="flex:1"></div>' + st + pb + '</div>')

def meters(goal_pct, clock_pct):
    return ('<div class="col pad" style="height:14px;gap:4px;flex:none;justify-content:center">'
            '<div style="height:5px;border-radius:3px;background:%s;overflow:hidden">'
            '<div style="width:%d%%;height:100%%;background:%s;border-radius:3px"></div></div>'
            '<div style="height:5px;border-radius:3px;background:%s;overflow:hidden">'
            '<div style="width:%d%%;height:100%%;background:%s;border-radius:3px"></div></div></div>'
            % (INK7, goal_pct, OK, INK7, clock_pct, AMB5))

def ticket(who, dish, needs, pct, col, secs, letter=""):
    urgent = pct < 25
    chips = ''.join(
        '<div style="width:34px;height:34px;border-radius:8px;background:%s;border:1px solid %s;'
        'display:flex;align-items:center;justify-content:center">%s</div>'
        % (INK7, INK6, sprite(n, 26)) for n in needs)
    # Hue is never the only signal: the urgent bar also grows 6 -> 8px, gains diagonal
    # stripes, and the card takes a 2px edge. The seconds badge turns colour under 25%.
    bar = 8 if urgent else 6
    stripe = (';background-image:repeating-linear-gradient(115deg,rgba(23,19,16,.5) 0 3px,'
              'transparent 3px 7px)') if urgent else ''
    edge = ('border-color:%s;border-width:2px;' % col) if urgent else ''
    init = ('<div style="position:absolute;left:5px;top:5px;width:19px;height:19px;border-radius:10px;'
            'background:%s;color:%s;font-size:11px;display:flex;align-items:center;'
            'justify-content:center">%s</div>' % (INK7, CREAM4, letter)) if letter else ''
    return ('<div class="col panel" style="flex:1;padding:8px 6px;gap:6px;align-items:center;'
            'min-width:0;position:relative;%s">%s'
            '<div style="width:100%%;height:%dpx;border-radius:4px;background:%s;overflow:hidden">'
            '<div style="width:%d%%;height:100%%;background:%s;border-radius:4px%s"></div></div>'
            '<span class="mono" style="font-size:11px;color:%s">%ss</span>'
            '%s'
            '<span style="font-size:11px;color:%s;text-align:center;line-height:1.15">%s</span>'
            '<div class="row" style="gap:4px">%s</div></div>'
            % (edge, init, bar, INK7, pct, col, stripe, col if urgent else CREAM6, secs,
               sprite(who, 40), CREAM4, dish, chips))

def cafe_band(h=216, grow=False, evening=False):
    """Zone D. The room plate is aspect 1.78 against the band's 1.81, so `cover` fills it
    with almost no crop. The plate already contains its own counter, shelves and window,
    so nothing is drawn on top of it."""
    box = ("flex:1 1 %dpx;min-height:150px" % h) if grow else ("height:%dpx;flex:none" % h)
    img = "room_evening.png" if evening else "room_day.png"
    return ('<div style="%s;position:relative;overflow:hidden;background:%s;'
            'background-image:url(\'%s\');background-size:cover;background-position:center 42%%">'
            # a short gradient at the top so the order rail above it does not collide
            # with the busiest part of the plate
            '<div style="position:absolute;left:0;right:0;top:0;height:46px;'
            'background:linear-gradient(to bottom, %s, rgba(23,19,16,0))"></div>'
            '</div>' % (box, INK9, img, INK9))

def plate_strip(items, label, ready):
    slots = ''
    for i in range(3):
        if i < len(items):
            slots += ('<div style="width:52px;height:52px;border-radius:10px;background:%s;border:1px solid %s;'
                      'display:flex;align-items:center;justify-content:center">%s</div>'
                      % (INK7, INK6, sprite(items[i], 40)))
        else:
            slots += ('<div style="width:52px;height:52px;border-radius:10px;border:1px dashed %s"></div>' % INK6)
    edge = AMB5 if ready else INK6
    txt = ('<span class="dsp" style="font-size:15px;color:%s">%s</span>' % (AMB5 if ready else CREAM6, label)) if label else ''
    return ('<div class="row pad" style="height:92px;gap:10px;flex:none;align-items:center">'
            '<div class="row" style="flex:1;gap:8px;align-items:center;height:72px;padding:0 12px;'
            'border-radius:14px;background:%s;border:1px solid %s">%s<div style="flex:1"></div>%s</div>'
            '<div style="width:56px;height:56px;border-radius:12px;background:%s;border:1px solid %s;'
            'display:flex;align-items:center;justify-content:center">'
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'
            '</div></div>'
            % (INK8, edge, slots, txt, INK8, INK6, CREAM4))

def bins(data):
    cells = ''
    for name, label, stock, cap, prog in data:
        pips = ''.join('<span style="width:8px;height:8px;border-radius:50%%;background:%s"></span>'
                       % (AMB5 if k < stock else INK6) for k in range(cap))
        bar = ('<div style="width:100%%;height:4px;border-radius:2px;background:%s;overflow:hidden">'
               '<div style="width:%d%%;height:100%%;background:%s"></div></div>' % (INK6, prog, CALM))
        cells += ('<div class="col panel" style="align-items:center;gap:4px;padding:8px 4px 7px;position:relative">'
                  '<div style="position:absolute;top:0;right:0;width:48px;height:48px;border-radius:0 14px 0 14px;'
                  'background:%s;display:flex;align-items:center;justify-content:center;color:%s;'
                  'font-family:\'Bricolage Grotesque\',sans-serif;font-weight:800;font-size:20px">+</div>'
                  '%s<span style="font-size:11px;color:%s">%s</span>'
                  '<div class="row" style="gap:4px;height:8px">%s</div>%s</div>'
                  % (INK7, AMB5, sprite(name, 34), CREAM4, label, pips, bar))
    return ('<div class="pad" style="height:225px;flex:none;display:grid;'
            'grid-template-columns:repeat(3, minmax(0, 1fr));gap:9px">%s</div>' % cells)

def stat(k, v, c=CREAM, big=False):
    fs = "17px" if big else "14px"
    return ('<div class="row" style="justify-content:space-between;gap:12px;padding:11px 0;'
            'border-bottom:1px solid %s"><span style="color:%s;font-size:14px">%s</span>'
            '<span class="mono" style="color:%s;font-size:%s">%s</span></div>' % (INK6, CREAM4, k, c, fs, v))

def title_block(eyebrow, title, sub=None):
    s = ('<div class="col pad" style="gap:6px;flex:none">'
         '<span class="lbl">%s</span><h1 class="dsp" style="font-size:32px;line-height:1.05">%s</h1>' % (eyebrow, title))
    if sub:
        s += '<p style="margin:4px 0 0;color:%s;font-size:14px;line-height:1.5">%s</p>' % (CREAM4, sub)
    return s + '</div>'

SCREENS = {}

# ---------------- S-04 GAMEPLAY (entry artboard) ----------------
SCREENS["Main"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + hud("5", "430", "620", streak="7")
    + meters(69, 62)
    + '<div class="col pad" style="height:160px;flex:none;justify-content:center">'
      '<div class="row" style="gap:8px;align-items:stretch;height:148px">'
    + ticket("p1", "Latte", ["shot", "milk"], 78, CALM, "14", "S")
    + ticket("p2", "Karak chai", ["tea", "milk", "syrup"], 44, SOON, "8", "N")
    + ticket("p1", "Almond croissant", ["pastry", "syrup"], 15, URGENT, "3", "T")
    + '</div></div>'
    + cafe_band(216, grow=True)
    + plate_strip(["shot", "milk"], "Latte", True)
    + bins([("shot", "Shot", 2, 3, 0), ("tea", "Tea", 3, 3, 0), ("syrup", "Syrup", 1, 3, 62),
            ("milk", "Milk", 2, 3, 0), ("pastry", "Pastry", 0, 3, 34), ("ice", "Ice", 2, 3, 0)])
    + '<div class="sb"></div></div>')

# ---------------- S-01 SPLASH ----------------
SCREENS["Splash"] = wrap(
    '<div class="scr" style="align-items:center;justify-content:center;gap:28px">'
    '<div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:%s"></div>'
    '<div style="position:absolute;left:0;right:0;bottom:142px;height:8px;background:%s"></div>'
    '<div class="col" style="align-items:center;gap:10px;z-index:1">'
    '<div class="row" style="gap:6px;align-items:flex-end">%s%s%s</div>'
    '<h1 class="dsp" style="font-size:44px;text-align:center;line-height:0.98">Caf&eacute;<br>Rush</h1>'
    '<span class="lbl" style="letter-spacing:.3em">Open when you like</span></div>'
    '<div style="position:absolute;bottom:60px;width:120px;height:4px;border-radius:2px;background:%s;overflow:hidden">'
    '<div style="width:64%%;height:100%%;background:%s"></div></div>'
    '</div>' % (WOOD, WOOD2, sprite("espresso", 62), sprite("karak", 74), sprite("almond", 62), INK7, AMB5))

# ---------------- S-02 HOME ----------------
SCREENS["Home"] = wrap(
    '<div class="scr"><div class="st"></div>'
    '<div class="row pad" style="height:56px;gap:14px;flex:none;align-items:center">'
    '<div class="col" style="gap:2px"><span class="lbl">Banked</span>'
    '<span class="dsp mono" style="font-size:22px;color:%s">712</span></div>'
    '<div style="flex:1"></div>'
    '<div style="width:44px;height:44px;border-radius:11px;background:%s;border:1px solid %s;display:flex;'
    'align-items:center;justify-content:center">'
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="1.8" stroke-linecap="round">'
    '<path d="M4 6h16M4 12h16M4 18h16"/></svg></div>'
    '<div style="width:44px;height:44px;border-radius:11px;background:%s;border:1px solid %s;display:flex;'
    'align-items:center;justify-content:center">'
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="1.8" stroke-linecap="round">'
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"/></svg></div>'
    '</div>' % (OK, INK8, INK6, CREAM4, INK8, INK6, CREAM4)
    + cafe_band(499)
    + '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="row" style="gap:10px">'
      '<div class="col panel" style="flex:1;padding:12px 14px;gap:3px">'
      '<span class="lbl">Next shift</span><span class="dsp" style="font-size:20px">Day 6</span></div>'
      '<div class="col panel" style="flex:1;padding:12px 14px;gap:3px">'
      '<span class="lbl">Best endless</span><span class="dsp mono" style="font-size:20px">1,940</span></div>'
      '</div>'
      '<div class="btn">Open the caf&eacute;</div>'
      '<div class="row" style="gap:10px">'
      '<div class="btn2" style="flex:1">Upgrades</div>'
      '<div class="btn2" style="flex:1">Endless rush</div>'
      '<div class="btn2" style="flex:1">Recipes</div>'
      '</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-03 DAY BRIEFING ----------------
def recipe_line(needs, name, price, new=False):
    chips = ''.join('<div style="width:30px;height:30px;border-radius:7px;background:%s;border:1px solid %s;'
                    'display:flex;align-items:center;justify-content:center">%s</div>' % (INK7, INK6, sprite(n, 23))
                    for n in needs)
    tag = ('<span class="mono" style="font-size:9px;color:%s;border:1px solid %s;border-radius:5px;'
           'padding:2px 5px">NEW</span>' % (AMB5, AMB5)) if new else ''
    return ('<div class="row" style="gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid %s">'
            '<div class="row" style="gap:4px">%s</div>'
            '<span style="flex:1;font-size:13px;color:%s">%s</span>%s'
            '<span class="mono" style="font-size:13px;color:%s">%s</span></div>'
            % (INK6, chips, CREAM, name, tag, BRASS, price))

SCREENS["Briefing"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Day 6", "Another rush")
    + '<div class="col pad" style="gap:12px;margin-top:18px;flex:1;overflow:hidden">'
      '<div class="panel" style="padding:4px 16px">'
    + stat("Take by closing", "650 AED", BRASS, True)
    + stat("Shift length", "90 seconds")
    + stat("Seats", "4")
    + stat("Orders per customer", "up to 2")
    + '</div>'
      '<div class="panel" style="padding:12px 16px 4px">'
      '<span class="lbl">On the menu</span>'
    + recipe_line(["shot"], "Espresso", "12")
    + recipe_line(["tea", "syrup"], "Mint tea", "10")
    + recipe_line(["shot", "milk"], "Latte", "20")
    + recipe_line(["tea", "milk", "syrup"], "Karak chai", "16")
    + recipe_line(["pastry", "syrup"], "Almond croissant", "18")
    + recipe_line(["shot", "milk", "ice"], "Iced latte", "26")
    + '</div></div>'
      '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Start shift</div><div class="btn2">Back to the caf&eacute;</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-05 PAUSE ----------------
SCREENS["Pause"] = wrap(
    '<div class="scr">'
    '<div style="position:absolute;inset:0;background:%s;opacity:.55"></div>'
    '<div style="position:absolute;inset:0;background:rgba(14,11,9,.72)"></div>'
    '<div class="col" style="position:absolute;inset:0;justify-content:center;align-items:center;gap:26px;padding:0 20px">'
    '<div class="col" style="align-items:center;gap:8px">'
    '<span class="lbl">Paused &middot; day 5</span>'
    '<h1 class="dsp" style="font-size:34px">The clock is stopped</h1>'
    '<span style="color:%s;font-size:14px">Nothing is lost. Take as long as you like.</span></div>'
    '<div class="col" style="width:100%%;gap:10px">'
    '<div class="btn">Resume</div>'
    '<div class="btn2">Recipes</div>'
    '<div class="btn2">Settings</div>'
    '<div class="btn2">Restart this day</div>'
    '<div class="btn2" style="color:%s">Quit to the caf&eacute;</div>'
    '</div></div></div>' % (TILE, CREAM4, CREAM6))

# ---------------- S-06 RESUME COUNTDOWN ----------------
SCREENS["Countdown"] = wrap(
    '<div class="scr">'
    '<div style="position:absolute;inset:0;background:%s;opacity:.5"></div>'
    '<div style="position:absolute;inset:0;background:rgba(14,11,9,.72)"></div>'
    '<div class="col" style="position:absolute;inset:0;justify-content:center;align-items:center;gap:14px">'
    '<div style="width:140px;height:140px;border-radius:70px;border:3px solid %s;display:flex;'
    'align-items:center;justify-content:center">'
    '<span class="dsp mono" style="font-size:74px;color:%s">2</span></div>'
    '<span class="lbl">Back in a moment</span></div></div>' % (TILE, AMB5, AMB5))

# ---------------- S-07 RESULT PASS ----------------
SCREENS["ResultPass"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Day 5 &middot; closed", "You made it")
    + '<div class="col pad" style="gap:14px;margin-top:20px;flex:1">'
      '<div class="row" style="gap:10px;align-items:center;justify-content:center;padding:6px 0">%s%s%s</div>'
      '<div class="panel" style="padding:4px 16px">'
      % (sprite("latte", 62), sprite("karak", 70), sprite("almond", 62))
    + stat("Taken", "712 AED", OK, True)
    + stat("Target", "620 AED")
    + stat("Served", "24")
    + stat("Walked out", "0")
    + stat("Scraped", "2", TERRA)
    + stat("Best streak", "x14", BRASS)
    + '</div>'
      '<div class="row panel" style="gap:10px;padding:12px 14px;align-items:center;border-color:%s">'
      '<div style="width:8px;height:8px;border-radius:4px;background:%s;flex:none"></div>'
      '<span style="font-size:12.5px;color:%s;line-height:1.45">A clean shift. Nobody left waiting.</span></div>'
      '</div>' % (INK6, OK, CREAM4)
    + '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Bank 712 AED</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-08 RESULT FAIL ----------------
SCREENS["ResultFail"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Day 7 &middot; closed", "Short of target")
    + '<div class="col pad" style="gap:14px;margin-top:20px;flex:1">'
      '<div class="panel" style="padding:4px 16px">'
    + stat("Taken", "610 AED", URGENT, True)
    + stat("Target", "690 AED")
    + stat("Served", "19")
    + stat("Walked out", "5", URGENT)
    + stat("Scraped", "3", URGENT)
    + stat("Best streak", "x6")
    + '</div>'
      '<div class="col panel" style="gap:8px;padding:14px;border-color:%s">'
      '<span class="lbl" style="color:%s">What went wrong</span>'
      '<span style="font-size:13px;color:%s;line-height:1.5">Five people left waiting. Pastry takes four '
      'seconds &mdash; starting it when the order arrives is already too late. Keep a bin stocked before '
      'the rush.</span></div></div>' % (URGENT, URGENT, CREAM4)
    + '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Try day 7 again</div><div class="btn2">Back to the caf&eacute;</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-09 UNLOCK CARD ----------------
SCREENS["UnlockCard"] = wrap(
    '<div class="scr">'
    '<div style="position:absolute;inset:0;background:rgba(14,11,9,.86)"></div>'
    '<div class="col" style="position:absolute;inset:0;justify-content:center;align-items:center;padding:0 24px;gap:22px">'
    '<div class="col panel" style="width:100%%;align-items:center;gap:14px;padding:30px 22px;border-color:%s">'
    '<span class="lbl" style="color:%s">New on the menu</span>'
    '%s'
    '<h1 class="dsp" style="font-size:26px;text-align:center">Iced latte</h1>'
    '<div class="row" style="gap:7px;align-items:center">'
    '<div style="width:38px;height:38px;border-radius:9px;background:%s;border:1px solid %s;display:flex;'
    'align-items:center;justify-content:center">%s</div>'
    '<span class="mono" style="color:%s">+</span>'
    '<div style="width:38px;height:38px;border-radius:9px;background:%s;border:1px solid %s;display:flex;'
    'align-items:center;justify-content:center">%s</div>'
    '<span class="mono" style="color:%s">+</span>'
    '<div style="width:38px;height:38px;border-radius:9px;background:%s;border:1px solid %s;display:flex;'
    'align-items:center;justify-content:center">%s</div>'
    '</div>'
    '<span style="text-align:center;color:%s;font-size:13px;line-height:1.5">Your best-paying drink, and '
    'the ice well opens with it. Three ingredients &mdash; plan ahead.</span>'
    '<span class="dsp mono" style="font-size:24px;color:%s">26 AED</span>'
    '</div><div class="btn" style="width:100%%">Got it</div></div></div>'
    % (AMB5, AMB5, sprite("iced", 96), INK7, INK6, sprite("shot", 28), CREAM6,
       INK7, INK6, sprite("milk", 28), CREAM6, INK7, INK6, sprite("ice", 28), CREAM4, BRASS))

# ---------------- S-10 SHOP ----------------
def urow(spr, name, desc, price, maxed=False):
    btn = ('<div class="mono" style="font-size:11px;color:%s;border:1px solid %s;border-radius:9px;'
           'height:44px;min-width:78px;display:flex;align-items:center;justify-content:center">%s</div>'
           % (OK if maxed else AMB5, INK6, "MAX" if maxed else price))
    return ('<div class="row panel" style="gap:11px;padding:10px 12px;align-items:center">'
            '<div style="width:40px;height:40px;border-radius:9px;background:%s;display:flex;'
            'align-items:center;justify-content:center;flex:none">%s</div>'
            '<div class="col" style="flex:1;gap:1px;min-width:0">'
            '<span style="font-size:13px">%s</span>'
            '<span style="font-size:11px;color:%s">%s</span></div>%s</div>'
            % (INK7, sprite(spr, 30), name, CREAM4, desc, btn))

SCREENS["Shop"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Between shifts", "712 AED",
                  "Faster machines refill sooner. More slots cook several at once. Bigger bins let you stockpile before a rush.")
    + '<div class="col pad" style="gap:8px;margin-top:16px;flex:1;overflow:hidden">'
    + urow("m_espresso", "Espresso machine &mdash; speed", "2.2s &rarr; 1.8s per shot", "90 AED")
    + urow("m_espresso", "Espresso machine &mdash; slots", "1 at a time &rarr; 2", "150 AED")
    + urow("m_steamer", "Steamer &mdash; speed", "2.0s &rarr; 1.6s per jug", "180 AED")
    + urow("m_oven", "Oven &mdash; slots", "2 at a time &rarr; 3", "300 AED")
    + urow("m_kettle", "Kettle &mdash; speed", "Brews in 1.4s &mdash; fully tuned", "", True)
    + urow("karak", "Another seat", "3 seats &rarr; 4", "260 AED")
    + '</div>'
      '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Open day 6</div><div class="btn2">Back to the caf&eacute;</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-11 ENDLESS INTRO ----------------
SCREENS["EndlessIntro"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Endless rush", "No closing time",
                  "No target, no bell. It gets harder every 25 seconds and ends when three people walk out.")
    + '<div class="col pad" style="gap:14px;margin-top:22px;flex:1">'
      '<div class="col panel" style="align-items:center;gap:6px;padding:26px 20px;border-color:%s">'
      '<span class="lbl">Your best</span>'
      '<span class="dsp mono" style="font-size:44px;color:%s">1,940</span>'
      '<span class="mono" style="font-size:12px;color:%s">wave 7 &middot; lasted 2:46</span></div>'
      '<div class="panel" style="padding:4px 16px">' % (AMB5, BRASS, CREAM4)
    + stat("Lives", "3 walkouts")
    + stat("Harder every", "25 seconds")
    + stat("Everything you take", "is banked", OK)
    + '</div></div>'
      '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Start the rush</div><div class="btn2">Back to the caf&eacute;</div></div>'
    + '<div class="sb"></div></div>')

# ---------------- S-12 ENDLESS RESULT ----------------
SCREENS["EndlessResult"] = wrap(
    '<div class="scr"><div class="st"></div>'
    + title_block("Endless rush", "New best")
    + '<div class="col pad" style="gap:14px;margin-top:20px;flex:1">'
      '<div class="col panel" style="align-items:center;gap:4px;padding:22px;border-color:%s">'
      '<span class="dsp mono" style="font-size:50px;color:%s">2,180</span>'
      '<span class="mono" style="font-size:12px;color:%s">previous best 1,940</span></div>'
      '<div class="panel" style="padding:4px 16px">' % (AMB5, BRASS, CREAM4)
    + stat("Lasted", "3:04")
    + stat("Reached wave", "8", OK)
    + stat("Served", "54")
    + stat("Best streak", "x19", BRASS)
    + '</div></div>'
      '<div class="col pad" style="gap:10px;padding-bottom:14px">'
      '<div class="btn">Go again</div><div class="btn2">Back to the caf&eacute;</div></div>'
    + '<div class="sb"></div></div>')

io.open("screens_a.json", "w", encoding="utf-8").write(json.dumps(SCREENS))
print("batch A:", len(SCREENS), "screens")
