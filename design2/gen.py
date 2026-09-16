#!/usr/bin/env python3
"""Generate the Cafe Life screen artboards.

Tokens and the type ramp come from docs/design-spec.md 2.3 and 2.4 verbatim --
this is the same palette the game and the brand kit use, nothing is reinvented.
Every screen is a 390x844 phone frame with the real art from art/sprites/.
"""
import json, pathlib
OUT = pathlib.Path(__file__).resolve().parent

INK9, INK85, INK8, INK7, INK6, INK5 = "#171310", "#1E1815", "#231C18", "#2E2521", "#3B302A", "#4A3C34"
CREAM, CREAM2, DIM, DIMMER = "#F7EFE3", "#D9C9B6", "#A8988A", "#6F6058"
AMBER, AMBER_L, AMBER_D = "#F2A03D", "#FFBC63", "#C97C22"
BRASS, TERRA, GREEN, BLUE, TILE = "#E8C36B", "#A8452A", "#4FBF7B", "#5B9DD9", "#3E6E6B"

CSS = """
*{box-sizing:border-box}
body{margin:0;font-family:"DM Sans",system-ui,-apple-system,sans-serif;font-size:14px;
     color:%(CREAM)s;background:%(INK9)s;-webkit-font-smoothing:antialiased}
a{color:%(AMBER)s} a:hover{color:%(AMBER_L)s}
.scr{width:390px;height:844px;display:flex;flex-direction:column;background:%(INK9)s;
     overflow:hidden;position:relative}
.st{height:47px;flex:none}          /* status bar space -- left empty on purpose */
.sb{height:34px;flex:none}          /* home indicator space */
.pad{padding-left:20px;padding-right:20px}
.grow{flex:1;min-height:0}
.dsp{font-family:"Bricolage Grotesque","DM Sans",sans-serif;font-weight:800;
     letter-spacing:-.025em;margin:0;line-height:1.08}
.mono{font-family:"DM Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}
.lbl{font-family:"DM Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.14em;
     text-transform:uppercase;color:%(DIMMER)s}
.panel{background:%(INK8)s;border:1px solid %(INK6)s;border-radius:14px}
.btn{height:56px;border-radius:13px;background:%(AMBER)s;color:%(INK9)s;
     font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:17px;
     display:flex;align-items:center;justify-content:center;flex:none}
.btn2{height:52px;border-radius:13px;background:transparent;border:1px solid %(INK5)s;
      color:%(CREAM)s;font-family:"Bricolage Grotesque",sans-serif;font-weight:600;
      font-size:15px;display:flex;align-items:center;justify-content:center;flex:none}
.pill{border:1px solid %(INK6)s;background:%(INK8)s;border-radius:999px;padding:7px 13px;
      font-family:"DM Mono",ui-monospace,monospace;font-size:13px;font-weight:500}
.row{display:flex;align-items:center}
.col{display:flex;flex-direction:column}
.cash{color:%(BRASS)s} .good{color:%(GREEN)s} .bad{color:%(TERRA)s} .amb{color:%(AMBER)s}
.face{border-radius:50%%;object-fit:cover;flex:none;background:%(INK7)s}
.sprite{object-fit:contain;flex:none}
.hair{height:1px;background:%(INK6)s;flex:none}
""" % globals()


def head(extra=""):
    return ('<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n'
            '  <script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
            'family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&'
            'family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap">\n'
            '  <style>' + CSS + extra + '</style>\n</helmet>\n')

TAIL = '</x-dc>\n<script data-dc-script>\nclass Component extends DCLogic {}\n</script>\n</body>\n</html>\n'


def write(name, body, extra=""):
    (OUT / (name + ".dc.html")).write_text(head(extra) + body + TAIL)


# ---------------------------------------------------------------- pieces
def topbar(left, right, back=False):
    l = ('<div class="row" style="gap:8px"><div class="pill" style="padding:7px 11px">%s</div></div>'
         % ('&lsaquo; Caf&eacute;' if back else left)) if (back or left) else '<div></div>'
    return ('<div class="row pad" style="justify-content:space-between;padding-top:10px;'
            'padding-bottom:12px;flex:none">%s<div class="pill %s">%s</div></div>'
            % (l, "cash", right))


def room(img, h=196, dusk=False, caption=None):
    scrim = ("linear-gradient(180deg,rgba(23,19,16,.20) 0%,rgba(23,19,16,.05) 42%,"
             "rgba(23,19,16,.92) 100%)")
    dim = "filter:saturate(.86) brightness(%s)" % (".52" if dusk else ".74")
    cap = ('<div class="lbl" style="position:absolute;left:20px;bottom:12px;color:%s">%s</div>'
           % (CREAM2, caption)) if caption else ""
    return ('<div style="position:relative;height:%dpx;flex:none;overflow:hidden">'
            '<img src="%s" style="position:absolute;inset:0;width:100%%;height:100%%;'
            'object-fit:cover;object-position:center 46%%;%s">'
            '<div style="position:absolute;inset:0;background:%s"></div>%s</div>'
            % (h, img, dim, scrim, cap))


def card(inner, style=""):
    return '<div class="panel" style="padding:14px;%s">%s</div>' % (style, inner)


def stat(k, v, cls="", last=False):
    b = "" if last else "border-bottom:1px solid %s;" % INK6
    return ('<div class="row" style="justify-content:space-between;align-items:baseline;'
            'padding:8px 0;%s"><div style="font-size:13.5px;color:%s">%s</div>'
            '<div class="mono %s" style="font-weight:500;font-size:14.5px">%s</div></div>'
            % (b, DIM, k, cls, v))


def dish(img, nm, price, tags="", on=False, note=""):
    border = AMBER if on else INK6
    bg = "#2b2118" if on else INK8
    tagline = ('<div class="lbl" style="margin-top:3px;font-size:9px">%s</div>' % tags) if tags else ""
    n = ('<div class="lbl" style="color:%s;font-size:9px;margin-top:3px">%s</div>' % (AMBER_D, note)) if note else ""
    return ('<div class="row" style="gap:11px;background:%s;border:1px solid %s;border-radius:12px;'
            'padding:9px 12px 9px 9px;margin-bottom:8px">'
            '<img class="sprite" src="%s" style="width:44px;height:44px">'
            '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14.5px">%s</div>'
            '%s%s</div><div class="mono cash" style="font-weight:500;font-size:14px">%s</div></div>'
            % (bg, border, img, nm, tagline, n, price))


def guest(face, nm, order, pay, reg=False, miss=False, tapped=False):
    border = GREEN if tapped else (AMBER_D if reg else INK6)
    op = "opacity:.6;" if miss else ""
    return ('<div class="row" style="gap:11px;background:%s;border:1px solid %s;border-radius:13px;'
            'padding:10px 12px;margin-bottom:9px;%s">'
            '<img class="face" src="%s" style="width:40px;height:40px">'
            '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">%s</div>'
            '<div style="font-size:12px;color:%s;margin-top:1px">%s</div></div>'
            '<div class="mono %s" style="font-weight:500;font-size:14px">%s</div></div>'
            % (INK8, border, op, face, nm, DIM if not miss else TERRA, order,
               "bad" if miss else "cash", pay))


def beat(face, nm, kind, text, held=False):
    return card(
      '<div class="row" style="gap:11px;margin-bottom:9px">'
      '<img class="face" src="%s" style="width:44px;height:44px">'
      '<div><div class="dsp" style="font-size:16px">%s</div>'
      '<div class="lbl" style="margin-top:2px;color:%s">%s</div></div></div>'
      '<div style="border-left:2px solid %s;padding-left:12px;font-size:13.5px;line-height:1.55;'
      'color:%s">%s</div>' % (face, nm, AMBER_D if held else DIMMER, kind,
                              TERRA if held else AMBER, CREAM2, text),
      "margin-bottom:12px")


def shoprow(img, nm, desc, price, sprite=True, dis=False):
    if sprite:
        ic = ('<div style="width:44px;height:44px;border-radius:11px;background:' + INK7
              + ';display:flex;align-items:center;justify-content:center;flex:none">'
              + '<img class="sprite" src="' + img + '" style="width:38px;height:38px">' + '</div>')
    else:
        ic = ('<div style="width:40px;height:40px;border-radius:11px;background:' + INK7
              + ';display:flex;align-items:center;justify-content:center">' + img + '</div>')
    btn_bg = INK7 if dis else AMBER
    btn_fg = DIMMER if dis else INK9
    return ('<div class="row" style="gap:11px;background:' + INK8 + ';border:1px solid ' + INK6
            + ';border-radius:13px;padding:11px 12px;margin-bottom:9px">' + ic
            + '<div style="flex:1;min-width:0">'
            + '<div style="font-weight:700;font-size:14px">' + nm + '</div>'
            + '<div style="font-size:12px;color:' + DIM + ';line-height:1.35;margin-top:2px">'
            + desc + '</div></div>'
            + '<div style="height:38px;min-width:64px;padding:0 13px;border-radius:10px;background:'
            + btn_bg + ';color:' + btn_fg + ';display:flex;align-items:center;'
            + 'justify-content:center;font-family:\'DM Mono\',monospace;font-weight:500;'
            + 'font-size:13px">' + price + '</div></div>')


def svg(path, size=20, color=None, sw=1.6):
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="%s" '
            'stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>'
            % (size, size, color or CREAM, sw, path))

ICON_BOARD = '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/>'
ICON_BUILD = '<path d="M3 21h18M6 21V8l6-4 6 4v13"/><path d="M10 21v-5h4v5"/>'
ICON_PEOPLE = '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5"/><path d="M18 20a6 6 0 0 0-3-5.2"/>'
ICON_BOOK = '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h5"/>'

def tabbar(active):
    items = [("Caf&eacute;", ICON_BUILD), ("Board", ICON_BOARD),
             ("People", ICON_PEOPLE), ("Book", ICON_BOOK)]
    out = []
    for nm, ic in items:
        on = (nm.replace("&eacute;", "é") == active)
        c = AMBER if on else DIMMER
        out.append('<div class="col" style="align-items:center;gap:4px;flex:1">%s'
                   '<div class="lbl" style="font-size:9px;color:%s">%s</div></div>'
                   % (svg(ic, 21, c), c, nm))
    return ('<div class="row" style="border-top:1px solid %s;background:%s;padding:11px 8px 4px;'
            'flex:none">%s</div>' % (INK6, INK85, "".join(out)))

# ================================================================= screens
S = '<div class="scr"><div class="st"></div>'
E = '<div class="sb"></div></div>'

# --- 01 Title -------------------------------------------------------------
write("Title", '<div class="scr" style="position:relative">'
  + '<img src="room_evening.jpg" style="position:absolute;inset:0;width:100%;height:100%;'
    'object-fit:cover;filter:saturate(.8) brightness(.5)">'
  + '<div style="position:absolute;inset:0;background:linear-gradient(180deg,'
    'rgba(23,19,16,.55),rgba(23,19,16,.35) 40%,rgba(23,19,16,.97))"></div>'
  + '<img class="sprite" src="karak.png" style="position:absolute;right:26px;top:150px;width:150px">'
  + '<img class="sprite" src="luqaimat.png" style="position:absolute;left:-14px;top:250px;width:140px">'
  + '<div style="position:absolute;left:20px;right:20px;bottom:120px">'
  + '<div class="dsp" style="font-size:62px;letter-spacing:-.045em;line-height:.9">'
    'Caf<span style="color:%s">&eacute;</span><br>Life</div>' % AMBER
  + '<div style="font-size:15.5px;color:%s;margin-top:18px;line-height:1.5;max-width:270px">'
    'A counter, two stools and one machine. The rest is forty years of decisions.</div>' % CREAM2
  + '<div class="lbl" style="margin-top:22px;color:%s">No ads &middot; No timers &middot; One price</div>' % AMBER
  + '</div>'
  + '<div style="position:absolute;left:20px;right:20px;bottom:46px" class="col">'
  + '<div class="btn">Open the shutters</div></div>' + '</div>')

# --- 02 The cafe (home) ---------------------------------------------------
regstrip = "".join(
  '<div class="col" style="align-items:center;gap:6px;width:60px">'
  '<img class="face" src="%s.png" style="width:48px;height:48px;border:1.5px solid %s">'
  '<div style="font-size:10.5px;color:%s;white-space:nowrap">%s</div>'
  '<div style="width:34px;height:3px;border-radius:2px;background:%s;overflow:hidden">'
  '<div style="width:%d%%;height:100%%;background:%s"></div></div></div>'
  % (f, AMBER_D if act else INK6, CREAM2 if act else DIMMER, nm, INK7, pct, AMBER)
  for f, nm, act, pct in [("p5","Noor",True,60),("p6","Haddad",True,40),
                          ("p4","Aisha",True,20),("p3","Khalid",False,0),
                          ("p9","Dana",False,0)])

write("Cafe", S
  + topbar("Autumn 2004", "2,840 AED")
  + room("room_day.jpg", 200, caption="eleven seats &middot; four on the board")
  + '<div class="grow" style="overflow:hidden">'
  + '<div class="pad" style="padding-top:16px">'
  + '<div class="lbl">Generation 1 &middot; Layla, 34</div>'
  + '<div class="dsp" style="font-size:30px;margin-top:5px">Autumn</div>'
  + '<div style="font-size:13.5px;color:%s;margin-top:6px;line-height:1.5">'
    'The evenings turn. Sweet things sell.</div>' % DIM
  + '<div style="height:14px"></div>'
  + card('<div class="row" style="justify-content:space-between;align-items:baseline;'
         'margin-bottom:11px"><div class="lbl">On the board</div>'
         '<div class="lbl" style="color:%s">4 of 4</div></div>' % AMBER
         + '<div class="row" style="gap:9px">'
         + "".join('<div class="col" style="align-items:center;gap:5px;flex:1">'
                   '<img class="sprite" src="%s" style="width:46px;height:46px">'
                   '<div style="font-size:10.5px;color:%s;text-align:center;line-height:1.25">%s</div>'
                   '<div class="mono cash" style="font-size:11.5px">%s</div></div>'
                   % (f, CREAM2, nm, pr)
                   for f, nm, pr in [("karak.png","Karak","7"),("luqaimat.png","Luqaimat","21"),
                                     ("almond.png","Croissant","19"),("espresso.png","Espresso","11")])
         + '</div>'
         + '<div class="lbl" style="margin-top:12px;color:%s">Autumn wants warm and sweet</div>' % AMBER_D)
  + '<div style="height:12px"></div>'
  + '<div class="lbl" style="margin-bottom:10px">Regulars</div>'
  + '<div class="row" style="gap:10px">%s</div>' % regstrip
  + '<div style="height:14px"></div>'
  + '<div class="btn">Open for the season</div>'
  + '</div></div>'
  + tabbar("Café") + E)

# --- 03 The board ---------------------------------------------------------
write("Board", S
  + topbar("", "4 / 4", back=True)
  + '<div class="pad"><div class="lbl">The board</div>'
  + '<div class="dsp" style="font-size:29px;margin-top:5px">What is on today</div>'
  + '<div style="font-size:13.5px;color:%s;margin-top:8px;line-height:1.5">'
    'You own more than you can show. Autumn wants <span style="color:%s">warm</span> and '
    '<span style="color:%s">sweet</span>. A regular whose usual is missing will notice.</div>'
    % (DIM, AMBER, AMBER)
  + '<div style="height:16px"></div></div>'
  + '<div class="grow pad" style="overflow:hidden">'
  + dish("karak.png","Karak chai","7","warm &middot; cheap",True,"Noor&rsquo;s usual")
  + dish("luqaimat.png","Luqaimat","21","sweet &middot; share",True)
  + dish("almond.png","Almond croissant","19","sweet &middot; quick",True)
  + dish("espresso.png","Espresso","11","warm &middot; quick",True,"Mr Haddad&rsquo;s usual")
  + dish("mint.png","Mint tea","8","warm &middot; light",False)
  + dish("latte.png","Latte","18","warm &middot; slow",False)
  + dish("iced.png","Iced latte","23","cold &middot; slow",False,"Dana&rsquo;s usual")
  + '</div>'
  + '<div class="pad col" style="padding-bottom:10px"><div class="btn">Open for the season</div></div>'
  + E)

# --- 04 Service -----------------------------------------------------------
write("Service", S
  + '<div class="row pad" style="justify-content:space-between;align-items:center;'
    'padding-bottom:10px;flex:none"><div class="lbl">Autumn 2004</div>'
    '<div class="dsp cash" style="font-size:20px">1,284 AED</div></div>'
  + '<div class="pad" style="flex:none"><div style="height:5px;border-radius:3px;background:%s;'
    'overflow:hidden"><div style="width:62%%;height:100%%;background:%s"></div></div></div>' % (INK7, AMBER)
  + '<div class="grow pad" style="padding-top:14px;overflow:hidden">'
  + guest("p5.png","Noor","Karak chai &times;48","+336",reg=True,tapped=True)
  + guest("p6.png","Mr Haddad","Espresso &times;61","+671",reg=True,tapped=True)
  + guest("p2.png","Someone","Luqaimat &times;3","+63")
  + guest("p11.png","Samir","wanted Regag roll &mdash; not on the board","&mdash;",reg=True,miss=True)
  + guest("p10.png","Someone","Almond croissant &times;2","+38")
  + guest("p8.png","Someone","Karak chai &times;1","+7")
  + guest("p1.png","Someone","wanted something cold &mdash; walked","&mdash;",miss=True)
  + '</div>'
  + '<div class="pad" style="padding-bottom:12px;flex:none">'
    '<div style="font-size:12.5px;color:%s;line-height:1.5">Tap someone to go over and say '
    'something. It is worth nothing on the till and everything to them.</div></div>' % DIM
  + E)

# --- 05 A moment ----------------------------------------------------------
write("Moment", S
  + '<div class="row pad" style="justify-content:space-between;align-items:center;'
    'padding-bottom:10px;flex:none"><div class="lbl">Autumn 2004</div>'
    '<div class="dsp cash" style="font-size:20px">842 AED</div></div>'
  + '<div class="pad" style="flex:none"><div style="height:5px;border-radius:3px;background:%s;'
    'overflow:hidden"><div style="width:45%%;height:100%%;background:%s"></div></div></div>' % (INK7, AMBER)
  + '<div class="grow pad" style="padding-top:14px;overflow:hidden">'
  + '<div class="panel" style="padding:16px;border-color:%s;margin-bottom:9px">' % AMBER_D
  + '<div class="lbl" style="color:%s">A moment</div>' % AMBER
  + '<div style="font-size:15.5px;line-height:1.55;margin-top:9px;color:%s">'
    'Someone has left a wallet on the table by the window.</div>' % CREAM
  + '<div style="height:14px"></div>'
  + '<div class="btn" style="height:50px;font-size:15px">Run after them</div>'
  + '<div style="height:9px"></div>'
  + '<div class="btn2">Keep it behind the counter</div>'
  + '</div>'
  + guest("p9.png","Dana","Iced latte &times;40","+920",reg=True)
  + guest("p7.png","Someone","Luqaimat &times;2","+42")
  + '</div>' + E)

# --- 06 The close ---------------------------------------------------------
write("Close", S
  + '<div class="pad" style="padding-top:8px"><div class="lbl">Autumn 2004</div>'
  + '<div class="dsp" style="font-size:30px;margin-top:5px">A good season</div></div>'
  + '<div class="grow pad" style="padding-top:14px;overflow:hidden">'
  + card(stat("Served","37","good") + stat("Left without ordering","2","bad")
         + stat("Tips","+160","cash") + stat("Takings","2,230 AED","cash")
         + stat("Rent","&minus;233 AED","bad")
         + stat("&nbsp;&nbsp;the landlord&rsquo;s share","&minus;156 AED","bad")
         + stat("Wages","&minus;139 AED","bad")
         + stat("Kept","+1,192 AED","good",last=True), "margin-bottom:12px")
  + beat("p5.png","Noor","their story",
         "Noor passed. She brings her mother in to show her the table she sat at.")
  + beat("p4.png","Aisha","waiting",
         "You have nothing anyone would want at a birthday.", held=True)
  + '</div>'
  + '<div class="pad col" style="padding-bottom:10px">'
    '<div class="btn">Spend, and open Winter</div></div>' + E)

# --- 07 Shop, build -------------------------------------------------------
def tabs(a, b, on_a=True):
    A = (AMBER, INK9) if on_a else (INK8, DIM)
    B = (INK8, DIM) if on_a else (AMBER, INK9)
    return ('<div class="row pad" style="gap:8px;padding-bottom:12px;flex:none">'
            '<div style="flex:1;height:40px;border-radius:11px;background:%s;color:%s;display:flex;'
            'align-items:center;justify-content:center;font-weight:700;font-size:13px;'
            'border:1px solid %s">%s</div>'
            '<div style="flex:1;height:40px;border-radius:11px;background:%s;color:%s;display:flex;'
            'align-items:center;justify-content:center;font-weight:700;font-size:13px;'
            'border:1px solid %s">%s</div></div>'
            % (A[0], A[1], A[0] if on_a else INK6, a, B[0], B[1], INK6 if on_a else B[0], b))

write("ShopBuild", S
  + topbar("", "2,840 AED", back=True)
  + tabs("Build", "Recipes", True)
  + '<div class="grow pad" style="overflow:hidden">'
  + shoprow("m_steamer.png","A proper grinder","Everything with coffee in it is worth more.","534")
  + shoprow("m_oven.png","A pastry case","Sweet things sell on sight, not on asking.","380")
  + shoprow("m_ice.png","Air conditioning","Summer afternoons become usable.","742")
  + shoprow(svg(ICON_BOARD,20,AMBER),"A bigger board &times;2","One more thing can be on the menu at once.","1,327",sprite=False)
  + shoprow(svg('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',20,AMBER),
            "Open the back room","A quiet corner away from the counter.","1,044",sprite=False)
  + shoprow(svg(ICON_PEOPLE,20,AMBER),"Hire a barista","Serves alongside you. Wages every season.","928",sprite=False)
  + shoprow(svg('<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/>',20,DIMMER),
            "Buy the building","The landlord stops taking seven per cent of everything you sell.",
            "9,000",sprite=False,dis=True)
  + '</div>' + tabbar("Café") + E)

# --- 08 Shop, recipes -----------------------------------------------------
write("ShopRecipes", S
  + topbar("", "2,840 AED", back=True)
  + tabs("Build", "Recipes", False)
  + '<div class="grow pad" style="overflow:hidden">'
  + '<div class="panel" style="padding:12px;border-color:%s;margin-bottom:12px">' % AMBER_D
  + '<div class="row" style="gap:11px"><img class="sprite" src="saffron.png" style="width:42px;height:42px">'
    '<div style="flex:1"><div style="font-weight:700;font-size:14px">Work out something of your own</div>'
    '<div style="font-size:12px;color:%s;line-height:1.35;margin-top:2px">It goes in the cookbook '
    'under your name, and it is still there for whoever comes after you.</div></div>'
    '<div style="height:38px;padding:0 13px;border-radius:10px;background:%s;color:%s;display:flex;'
    'align-items:center;font-family:&quot;DM Mono&quot;,monospace;font-weight:500;font-size:13px">'
    '1,305</div></div></div>' % (DIM, AMBER, INK9)
  + shoprow("iced.png","Iced latte","cold &middot; slow &mdash; somebody on this street drinks this.","300")
  + shoprow("regag.png","Regag roll","savoury &middot; fill &mdash; somebody on this street drinks this.","360")
  + shoprow("dateshake.png","Date shake","cold &middot; sweet","380")
  + shoprow("affogato.png","Affogato","cold &middot; sweet","640")
  + shoprow("saffron.png","Saffron karak","warm &middot; premium","700",dis=True)
  + '</div>' + tabbar("Café") + E)

# --- 09 The regulars ------------------------------------------------------
ROSTER = [("p5","Noor","Karak chai","Chapter 3 of 5",60),
          ("p6","Mr Haddad","Espresso","Chapter 2 of 5",40),
          ("p4","Aisha","Date shake","Chapter 2 of 5",40),
          ("p3","Khalid","Saffron karak","Not met yet",0),
          ("p9","Dana","Iced latte","Not met yet",0),
          ("p11","Samir","Regag roll","Not met yet",0)]
rows = "".join(
  '<div class="row" style="gap:12px;padding:11px 0;border-bottom:1px solid %s">'
  '<img class="face" src="%s.png" style="width:52px;height:52px;%s">'
  '<div style="flex:1;min-width:0">'
  '<div style="font-weight:700;font-size:15px;color:%s">%s</div>'
  '<div class="lbl" style="margin-top:3px">usual &mdash; %s</div>'
  '<div style="height:3px;border-radius:2px;background:%s;margin-top:7px;overflow:hidden">'
  '<div style="width:%d%%;height:100%%;background:%s"></div></div></div></div>'
  % (INK6, f, "" if pct else "filter:grayscale(1) brightness(.55)",
     CREAM if pct else DIMMER, nm, u, INK7, pct, AMBER)
  for f, nm, u, ch, pct in ROSTER)

write("Regulars", S
  + topbar("", "2,840 AED", back=True)
  + '<div class="pad"><div class="lbl">The regulars</div>'
  + '<div class="dsp" style="font-size:29px;margin-top:5px">Who keeps coming back</div>'
  + '<div style="font-size:13.5px;color:%s;margin-top:8px;line-height:1.5">'
    'You meet people by what you put on the board. Six of the twelve on this street '
    'have found you.</div>' % DIM
  + '<div style="height:10px"></div></div>'
  + '<div class="grow pad" style="overflow:hidden">%s</div>' % rows
  + tabbar("People") + E)

# --- 10 One story ---------------------------------------------------------
def storybeat(year, text, dim=False):
    return ('<div class="row" style="gap:12px;align-items:flex-start;margin-bottom:14px">'
            '<div class="mono" style="font-size:11px;color:%s;width:34px;flex:none;padding-top:2px">'
            '%s</div><div style="border-left:2px solid %s;padding-left:12px;font-size:13.5px;'
            'line-height:1.55;color:%s">%s</div></div>'
            % (DIMMER, year, INK6 if dim else AMBER, DIMMER if dim else CREAM2, text))

write("Story", S
  + topbar("", "2,840 AED", back=True)
  + '<div class="pad row" style="gap:14px;align-items:center">'
  + '<img class="face" src="p5.png" style="width:72px;height:72px;border:2px solid %s">' % AMBER_D
  + '<div><div class="dsp" style="font-size:26px">Noor</div>'
    '<div class="lbl" style="margin-top:4px">usual &mdash; karak chai</div></div></div>'
  + '<div class="pad" style="padding-top:12px"><div style="font-size:13.5px;color:%s;line-height:1.5">'
    'A student. Comes in with a laptop and stays four hours on one karak.</div>'
    '<div style="height:16px"></div></div>' % DIM
  + '<div class="grow pad" style="overflow:hidden">'
  + storybeat("2001","Noor asks, carefully, whether it is all right that she stays so long. You say it is.")
  + storybeat("2002","She is here every day now. Exams. She has started saying good morning to the regulars.")
  + storybeat("2004","Noor passed. She brings her mother in to show her the table she sat at.")
  + storybeat("&mdash;","She graduates and takes a job two streets away. She still comes on Fridays.",True)
  + storybeat("&mdash;","Noor brings her own daughter, who is four, and who wants the sweet thing in the case.",True)
  + '</div>' + tabbar("People") + E)

# --- 11 The cookbook ------------------------------------------------------
def bookrow(img, nm, by, yr, price, gen):
    return ('<div class="row" style="gap:12px;padding:11px 0;border-bottom:1px solid %s">'
            '<img class="sprite" src="%s" style="width:46px;height:46px">'
            '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14.5px">%s</div>'
            '<div class="lbl" style="margin-top:3px">%s &middot; %s &middot; generation %s</div></div>'
            '<div class="mono cash" style="font-weight:500;font-size:14px">%s</div></div>'
            % (INK6, img, nm, by, yr, gen, price))

write("Cookbook", S
  + topbar("", "2,840 AED", back=True)
  + room("room_counter.jpg", 120, caption=None)
  + '<div class="pad" style="padding-top:16px"><div class="lbl">The family cookbook</div>'
  + '<div class="dsp" style="font-size:29px;margin-top:5px">Written here</div>'
  + '<div style="font-size:13.5px;color:%s;margin-top:8px;line-height:1.5">'
    'Four recipes nobody else has. They stay on the board after whoever wrote them.</div>'
    '<div style="height:8px"></div></div>' % DIM
  + '<div class="grow pad" style="overflow:hidden">'
  + bookrow("saffron.png","Grandmother&rsquo;s karak","Yusuf","2004","46","1")
  + bookrow("datepaste.png","Morning plate","Layla","2023","31","2")
  + bookrow("cortado.png","Late cup","Mariam","2038","24","3")
  + bookrow("affogato.png","The second one","Mariam","2041","38","3")
  + '</div>' + tabbar("Book") + E)

# --- 12 Succession --------------------------------------------------------
write("Succession", S
  + room("room_evening.jpg", 240, dusk=True)
  + '<div class="pad" style="padding-top:18px"><div class="lbl">Generation 1 &middot; 2039</div>'
  + '<div class="dsp" style="font-size:32px;margin-top:6px">Layla hands it over</div></div>'
  + '<div class="grow pad" style="padding-top:14px;overflow:hidden">'
  + card(stat("Ran the caf&eacute; for","43 years")
         + stat("Recipes written","2","cash")
         + stat("Stories seen through","5 of 12","good")
         + stat("Branches","3")
         + stat("The building","Bought in 2019","good", last=True), "margin-bottom:12px")
  + '<div style="font-size:13.5px;color:%s;line-height:1.6">The room stays exactly as you built '
    'it. So does the cookbook, and so do the regulars &mdash; though the ones who were old when '
    'you started will not be here for your daughter, and the children who came in with their '
    'mothers will be the ones propping up the counter.</div>' % CREAM2
  + '</div>'
  + '<div class="pad col" style="padding-bottom:10px"><div class="btn">Hand over the keys</div></div>'
  + E)

# --- 13 Branches ----------------------------------------------------------
def branch(nm, since, take, first=False):
    return ('<div class="row" style="gap:12px;padding:13px 0;border-bottom:1px solid %s">'
            '<div style="width:44px;height:44px;border-radius:12px;background:%s;display:flex;'
            'align-items:center;justify-content:center">%s</div>'
            '<div style="flex:1"><div style="font-weight:700;font-size:14.5px">%s</div>'
            '<div class="lbl" style="margin-top:3px">%s</div></div>'
            '<div class="mono cash" style="font-weight:500;font-size:14px">%s</div></div>'
            % (INK6, INK7, svg(ICON_BUILD, 20, AMBER if first else DIM), nm, since, take))

write("Branches", S
  + topbar("", "2,840 AED", back=True)
  + '<div class="pad"><div class="lbl">Three streets</div>'
  + '<div class="dsp" style="font-size:29px;margin-top:5px">The other cafés</div>'
  + '<div style="font-size:13.5px;color:%s;margin-top:8px;line-height:1.5">'
    'Each has its own street and its own regulars. None of them will ever be the first one.</div>'
    '<div style="height:12px"></div></div>' % DIM
  + '<div class="grow pad" style="overflow:hidden">'
  + branch("The shop on Al Wasl","the first one &middot; 1996","&mdash;",True)
  + branch("Jumeirah","since 2011","+241 / season")
  + branch("Satwa","since 2016","+198 / season")
  + '<div style="height:16px"></div>'
  + card('<div class="lbl" style="margin-bottom:8px">Open a fourth</div>'
         '<div style="font-size:13px;color:%s;line-height:1.5">Each one costs more than the last '
         'and earns a little less. There is a number at which another café stops being worth '
         'it, and finding it is the game.</div>'
         '<div style="height:12px"></div>'
         '<div class="btn2" style="height:46px">13,608 AED</div>' % DIM)
  + '</div>' + tabbar("Café") + E)

# --- 14 First run ---------------------------------------------------------
write("FirstRun", S
  + room("room_day.jpg", 260, caption="a counter, two stools and one machine")
  + '<div class="grow pad" style="padding-top:20px;overflow:hidden">'
  + '<div class="lbl">Spring 1996</div>'
  + '<div class="dsp" style="font-size:31px;margin-top:6px">You have four hundred<br>and twenty dirhams</div>'
  + '<div style="height:16px"></div>'
  + '<div style="font-size:14px;color:%s;line-height:1.6">There is no clock and nothing here '
    'can be failed.</div><div style="height:12px"></div>' % CREAM2
  + '<div style="font-size:14px;color:%s;line-height:1.6">Each season you choose what goes on '
    'the board. You will always own more recipes than you have room to show, and the season '
    'moves what people want.</div><div style="height:12px"></div>' % DIM
  + '<div style="font-size:14px;color:%s;line-height:1.6">Then you open, and you watch who '
    'comes in. Some of them will come back.</div>' % DIM
  + '</div>'
  + '<div class="pad col" style="padding-bottom:10px"><div class="btn">Open the shutters</div></div>'
  + E)

# ================================================================= layout
ORDER = [("FirstRun","01 First run"),("Title","02 Title"),("Cafe","03 The café"),
         ("Board","04 The board"),("Service","05 Service"),("Moment","06 A moment"),
         ("Close","07 The close"),("ShopBuild","08 Shop · build"),
         ("ShopRecipes","09 Shop · recipes"),("Regulars","10 The regulars"),
         ("Story","11 One story"),("Cookbook","12 The cookbook"),
         ("Branches","13 Branches"),("Succession","14 Succession")]
# Main is the entry artboard; keep the deliverable there.
(OUT / "Main.dc.html").write_text((OUT / "Cafe.dc.html").read_text())
(OUT / "Cafe.dc.html").unlink()

boards, x, y, per = [], 0, 0, 5
for i, (f, t) in enumerate(ORDER):
    name = "Main" if f == "Cafe" else f
    boards.append({"file": name + ".dc.html", "x": (i % per) * 470, "y": (i // per) * 1000,
                   "w": 390, "h": 844, "title": t})
canvas = {"artboards": boards,
          "annotations": [
            {"id":"loop","x":0,"y":-150,"w":900,
             "text":"THE SEASON IS THE LOOP\n03 the café → 04 the board → 05 service → 07 the close → 08 spend → back to 03.\nFour seasons a year, forty years a generation. Nothing can be failed."},
            {"id":"forever","x":1880,"y":-150,"w":460,
             "text":"THE FOREVER PART\n10–12 and 14 are what outlive one owner: the regulars, their stories, the cookbook and the handover."}],
          "launch": {"view": "canvas"}}
(OUT / "canvas.json").write_text(json.dumps(canvas, indent=1) + "\n")
print("wrote %d artboards" % len(ORDER))
