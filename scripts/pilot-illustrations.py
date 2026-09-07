# -*- coding: utf-8 -*-
"""The vector pilot illustrations, and the source they are generated from.

    python3 scripts/pilot-illustrations.py     # writes src/assets/idea-illustrations/*.svg

One generator rather than several hand-written files, because the thing a
viewer notices first is not any single drawing — it is whether they look like
one set. Sharing `head`, `torso` and one palette makes that true by
construction instead of by care.

These are the floor, not the target. The house style is the painted look now
shipping as .webp — `pasta`, `pottery`, `sunrise`, `cinemahome` — and where a
painted scene exists it wins; `pasta` and `pottery` started here and were
replaced, which is the expected direction of travel. What is left is the six
scenarios that have no painting yet, kept because a drawn scene of the right
evening still beats a category symbol.

`SKIP` names the ids that have graduated. Leaving their scenes in the file
rather than deleting them keeps the set drawable if a painting is ever pulled.

Run from the repository root.
"""
import os

W, H = 240, 180
OUT = 'src/assets/idea-illustrations'

ROSE, ROSE_DEEP, ROSE_SOFT = '#E4598A', '#C93A6F', '#F3A0A9'
PEACH, PEACH_SOFT = '#F79C7B', '#FBD0B9'
LAV, LAV_PALE = '#9A72C0', '#DBD1EF'
INK = '#4A3A4F'

SKIN = ['#F0C3A4', '#C98A62', '#E7AC8B', '#9C6242']
HAIR = ['#4A3A4F', '#7A4A38', '#2F2635', '#8C5E3C']


def head(cx, cy, r, skin, hair, style='short', flip=1):
    p = []
    if style == 'long':
        p.append(f'<rect x="{cx-r-1}" y="{cy-r*0.2:.1f}" width="{2*r+2}" height="{r*2.1:.1f}" rx="{r:.1f}" fill="{hair}"/>')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{skin}"/>')
    p.append(f'<path d="M{cx-r} {cy-0.5} a{r} {r} 0 0 1 {2*r} 0 z" fill="{hair}"/>')
    if style == 'bun':
        p.append(f'<circle cx="{cx+flip*r*0.85:.1f}" cy="{cy-r*1.0:.1f}" r="{r*0.44:.1f}" fill="{hair}"/>')
    if style == 'curly':
        for dx in (-r*0.72, 0, r*0.72):
            p.append(f'<circle cx="{cx+dx:.1f}" cy="{cy-r*0.8:.1f}" r="{r*0.44:.1f}" fill="{hair}"/>')
    return ''.join(p)


def torso(cx, top, w, h, colour, rx=None):
    rx = rx if rx is not None else w / 2
    return f'<rect x="{cx-w/2:.1f}" y="{top:.1f}" width="{w}" height="{h}" rx="{rx:.1f}" fill="{colour}"/>'


def arm(x1, y1, x2, y2, colour, width=5.5):
    return (f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="{colour}" '
            f'stroke-width="{width}" stroke-linecap="round" fill="none"/>')


def bg(a, b, angle=140):
    return (f'<defs><linearGradient id="g" gradientTransform="rotate({angle} 0.5 0.5)">'
            f'<stop offset="0%" stop-color="{a}"/><stop offset="100%" stop-color="{b}"/>'
            f'</linearGradient></defs><rect width="{W}" height="{H}" fill="url(#g)"/>')


def blob(cx, cy, r, colour, o=0.22):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{colour}" opacity="{o}"/>'


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'{body}</svg>')


scenes = {}

# 1. Cooking — a counter, a pot, two people behind it.
scenes['pasta'] = svg(
    bg('#FFEDE0', '#FBD3BC')
    + blob(196, 34, 40, '#FFFFFF', 0.5) + blob(34, 150, 46, PEACH, 0.16)
    # shelf and pans
    + f'<rect x="150" y="30" width="74" height="4" rx="2" fill="{PEACH}" opacity="0.55"/>'
    + f'<path d="M162 34v10a6 6 0 0 0 12 0V34z" fill="{ROSE_DEEP}" opacity="0.5"/>'
    + f'<path d="M186 34v13a7 7 0 0 0 14 0V34z" fill="{ROSE_DEEP}" opacity="0.35"/>'
    # people
    + head(84, 62, 12, SKIN[0], HAIR[1], 'bun', flip=-1) + torso(84, 74, 30, 44, ROSE)
    + arm(74, 86, 62, 100, SKIN[0]) + arm(94, 86, 108, 98, SKIN[0])
    + head(134, 58, 12, SKIN[1], HAIR[2], 'curly') + torso(134, 70, 30, 48, LAV)
    + arm(124, 82, 114, 98, SKIN[1]) + arm(144, 82, 156, 96, SKIN[1])
    # counter
    + f'<rect x="0" y="118" width="{W}" height="10" fill="{ROSE_DEEP}" opacity="0.22"/>'
    + f'<rect x="0" y="128" width="{W}" height="52" fill="#FFFFFF" opacity="0.55"/>'
    # pot with steam
    + f'<path d="M96 96h34v14a8 8 0 0 1-8 8h-18a8 8 0 0 1-8-8z" fill="{ROSE_DEEP}"/>'
    + f'<rect x="93" y="92" width="40" height="5" rx="2.5" fill="{ROSE_DEEP}"/>'
    + f'<path d="M106 86c0-5 5-5 5-10M118 84c0-5 5-5 5-10" stroke="#FFFFFF" stroke-width="2.6" '
      'stroke-linecap="round" fill="none" opacity="0.85"/>'
    # bottle and two glasses
    + f'<path d="M172 92h9v22a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4z" fill="{LAV}"/>'
    + f'<rect x="174.5" y="84" width="4" height="9" rx="2" fill="{LAV}" opacity="0.75"/>'
    + f'<path d="M194 104h9l-1.5 7a3 3 0 0 1-6 0z" fill="{ROSE_SOFT}"/><rect x="197" y="111" width="3" height="7" rx="1.5" fill="{ROSE_SOFT}"/>'
    + f'<path d="M208 104h9l-1.5 7a3 3 0 0 1-6 0z" fill="{ROSE_SOFT}"/><rect x="211" y="111" width="3" height="7" rx="1.5" fill="{ROSE_SOFT}"/>'
)

# 2. Slow evening in — a tub, candles, steam.
scenes['bath'] = svg(
    bg('#FDEBF1', '#F3D6E2')
    + blob(206, 40, 44, '#FFFFFF', 0.45) + blob(28, 40, 26, LAV_PALE, 0.5)
    # candles on a ledge
    + f'<rect x="14" y="86" width="52" height="4" rx="2" fill="{ROSE_DEEP}" opacity="0.25"/>'
    + ''.join(
        f'<rect x="{20+i*16}" y="{70+ (i%2)*6}" width="9" height="{16-(i%2)*6}" rx="3" fill="#FFFFFF" opacity="0.9"/>'
        f'<circle cx="{24.5+i*16}" cy="{65+(i%2)*6}" r="3.4" fill="{PEACH}"/>'
        for i in range(3))
    # steam
    + f'<path d="M120 52c0-9 9-9 9-18M142 58c0-9 9-9 9-18M100 60c0-8 8-8 8-16" stroke="#FFFFFF" '
      'stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>'
    # tub
    + f'<path d="M74 104h132v34a16 16 0 0 1-16 16H90a16 16 0 0 1-16-16z" fill="#FFFFFF" opacity="0.92"/>'
    + f'<rect x="70" y="98" width="140" height="9" rx="4.5" fill="#FFFFFF"/>'
    + f'<path d="M78 118h124v20a12 12 0 0 1-12 12H90a12 12 0 0 1-12-12z" fill="{ROSE_SOFT}" opacity="0.45"/>'
    # two people in it
    + head(112, 86, 11, SKIN[2], HAIR[0], 'short') + torso(112, 96, 26, 22, ROSE, 12)
    + head(160, 84, 11, SKIN[3], HAIR[3], 'curly') + torso(160, 94, 26, 24, LAV, 12)
    + f'<path d="M96 116h108" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>'
    # plant
    + f'<path d="M222 156v-22" stroke="{ROSE_DEEP}" stroke-width="3" stroke-linecap="round" opacity="0.4"/>'
    + blob(222, 130, 12, LAV, 0.35)
)

# 3. Be beginners at something — a wheel, clay, a shelf of pots.
scenes['pottery'] = svg(
    bg('#F9E7F2', '#EBCFE4')
    + blob(40, 36, 34, '#FFFFFF', 0.5)
    + f'<rect x="150" y="28" width="78" height="4" rx="2" fill="{ROSE_DEEP}" opacity="0.3"/>'
    + ''.join(f'<path d="M{158+i*24} 32v9a7 7 0 0 0 14 0v-9z" fill="{LAV}" opacity="{0.5 - i*0.12}"/>' for i in range(3))
    # two people leaning in
    + head(88, 56, 12, SKIN[1], HAIR[0], 'bun', flip=-1) + torso(88, 68, 30, 46, LAV)
    + arm(78, 82, 104, 104, SKIN[1]) + head(150, 54, 12, SKIN[0], HAIR[1], 'long')
    + torso(150, 66, 30, 48, ROSE) + arm(140, 80, 118, 104, SKIN[0])
    # wheel and pot
    + f'<rect x="98" y="120" width="44" height="34" rx="4" fill="{ROSE_DEEP}" opacity="0.28"/>'
    + f'<ellipse cx="120" cy="118" rx="30" ry="8" fill="#FFFFFF" opacity="0.85"/>'
    + f'<path d="M110 116c0-12 20-12 20 0z" fill="{PEACH}"/>'
    + f'<ellipse cx="120" cy="116" rx="10" ry="3" fill="{PEACH_SOFT}"/>'
    + f'<rect x="0" y="154" width="{W}" height="26" fill="#FFFFFF" opacity="0.45"/>'
    + blob(196, 140, 10, PEACH, 0.3) + blob(40, 150, 8, LAV, 0.3)
)

# 4. A hill with a view — seen from behind, at the top, looking out.
scenes['hike'] = svg(
    bg('#F4E9F4', '#DFD0E9')
    + f'<circle cx="196" cy="40" r="19" fill="{PEACH}" opacity="0.8"/>'
    + f'<path d="M0 126 58 74l40 34 34-26 50 44 58-34v92H0z" fill="{LAV}" opacity="0.24"/>'
    + f'<path d="M0 148 54 106l46 32 42-22 50 34 48-24v54H0z" fill="{LAV}" opacity="0.4"/>'
    # the ridge they are standing on
    + f'<path d="M0 180v-24l52-12 60 8 58-12 70 10v30z" fill="#FFFFFF" opacity="0.6"/>'
    # backs of two walkers, packs between shoulders
    + head(94, 76, 15, SKIN[0], HAIR[2], 'short') + torso(94, 91, 36, 62, ROSE)
    + f'<rect x="82" y="96" width="24" height="32" rx="8" fill="{ROSE_DEEP}"/>'
    + f'<path d="M87 96v-5M101 96v-5" stroke="{ROSE_DEEP}" stroke-width="3.4" stroke-linecap="round"/>'
    + head(148, 70, 15, SKIN[2], HAIR[3], 'bun') + torso(148, 85, 36, 68, LAV)
    + f'<rect x="136" y="90" width="24" height="32" rx="8" fill="#7E56A8"/>'
    + f'<path d="M141 90v-5M155 90v-5" stroke="#7E56A8" stroke-width="3.4" stroke-linecap="round"/>'
    + arm(114, 112, 130, 118, SKIN[0], 6.5)
    + ''.join(f'<path d="M{26+i*186} 152v-16l8 16z" fill="{LAV}" opacity="0.5"/>' for i in range(2))
)

# 5. Drive out of the light — a blanket, a parked car, and mostly sky.
scenes['stargaze'] = svg(
    bg('#DCCEEC', '#B9A6D8', 160)
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFFFFF" opacity="{o}"/>'
              for x, y, r, o in [(28, 26, 2.2, .9), (60, 48, 1.6, .75), (94, 20, 2.6, .95),
                                 (132, 38, 1.8, .75), (166, 22, 2.2, .9), (204, 46, 1.7, .75),
                                 (222, 16, 2.4, .9), (14, 62, 1.5, .65), (186, 68, 1.8, .65),
                                 (110, 60, 1.5, .6), (44, 88, 1.6, .5)])
    + f'<circle cx="200" cy="34" r="12" fill="#FFFFFF" opacity="0.85"/>'
    # the hill they drove up
    + f'<path d="M0 124 52 108l56 8 58-12 74 14v46H0z" fill="#7E5FA6" opacity="0.45"/>'
    + f'<path d="M0 146 60 134l54 8 56-10 70 12v26H0z" fill="#6B4E90" opacity="0.5"/>'
    # the car, parked and small, off to one side
    + f'<path d="M164 132h44a8 8 0 0 1 8 8v10h-60v-10a8 8 0 0 1 8-8z" fill="{INK}" opacity="0.5"/>'
    + f'<path d="M174 132l6-9h22l8 9z" fill="#FFFFFF" opacity="0.35"/>'
    + f'<circle cx="172" cy="150" r="5" fill="{INK}" opacity="0.55"/><circle cx="204" cy="150" r="5" fill="{INK}" opacity="0.55"/>'
    # the two of them on a blanket, from behind, heads together
    + head(74, 116, 12, SKIN[0], HAIR[1], 'long') + torso(74, 128, 30, 34, ROSE)
    + head(104, 112, 12, SKIN[3], HAIR[2], 'curly') + torso(104, 124, 30, 38, LAV)
    + f'<path d="M44 156h96l6 14H38z" fill="{ROSE}" opacity="0.75"/>'
    + f'<path d="M40 164h104" stroke="{ROSE_SOFT}" stroke-width="3" opacity="0.7"/>'
    + f'<rect x="150" y="150" width="11" height="20" rx="4" fill="{PEACH}"/>'
)

# 6. First train, no return booked — platform, board, a bag.
scenes['firsttrain'] = svg(
    bg('#FFEEE3', '#F7D9CB')
    + blob(56, 40, 34, '#FFFFFF', 0.55)
    # departure board. No sun behind it: at 0.55 the board is translucent and a
    # circle under it read as a stain on the sign rather than light behind it.
    # departure board
    + f'<rect x="18" y="26" width="52" height="30" rx="5" fill="#6E4E96" opacity="0.55"/>'
    + ''.join(f'<rect x="25" y="{33+i*7}" width="{38-i*9}" height="3.5" rx="2" fill="#FFFFFF" opacity="0.7"/>' for i in range(3))
    # train nose
    + f'<path d="M176 66h64v76h-64a10 10 0 0 1-10-10V76a10 10 0 0 1 10-10z" fill="{LAV}" opacity="0.75"/>'
    + f'<rect x="182" y="76" width="52" height="24" rx="5" fill="#FFFFFF" opacity="0.65"/>'
    + f'<circle cx="192" cy="150" r="8" fill="{INK}" opacity="0.45"/><circle cx="222" cy="150" r="8" fill="{INK}" opacity="0.45"/>'
    # platform
    + f'<rect x="0" y="142" width="{W}" height="38" fill="#FFFFFF" opacity="0.6"/>'
    + f'<rect x="0" y="142" width="{W}" height="4" fill="{ROSE_DEEP}" opacity="0.2"/>'
    # two people, one bag
    + head(92, 68, 14, SKIN[2], HAIR[0], 'short') + torso(92, 82, 32, 60, ROSE)
    + arm(80, 98, 70, 120, SKIN[2])
    + head(134, 64, 14, SKIN[1], HAIR[1], 'bun') + torso(134, 78, 32, 64, LAV)
    + arm(146, 96, 158, 118, SKIN[1])
    + f'<rect x="58" y="118" width="26" height="24" rx="4" fill="{PEACH}"/>'
    + f'<path d="M65 118v-5a6 6 0 0 1 12 0v5" stroke="{PEACH}" stroke-width="3" fill="none"/>'
)

# 7. Twenty questions — two people facing each other on a rug.
scenes['questions'] = svg(
    bg('#FDE6EE', '#F6CEDD')
    + blob(198, 42, 38, '#FFFFFF', 0.5)
    # lamp
    + f'<path d="M206 46l16 20h-32z" fill="{PEACH}" opacity="0.85"/>'
    + f'<path d="M206 66v58" stroke="{ROSE_DEEP}" stroke-width="3" opacity="0.35"/>'
    # facing pair
    + head(84, 66, 12, SKIN[0], HAIR[2], 'curly') + torso(84, 78, 30, 40, LAV)
    + f'<path d="M97 92q12 2 15 -6" stroke="{SKIN[0]}" stroke-width="5.5" stroke-linecap="round" fill="none"/>'
    + f'<circle cx="113" cy="85" r="3.6" fill="{SKIN[0]}"/>'
    + head(150, 66, 12, SKIN[3], HAIR[3], 'long') + torso(150, 78, 30, 40, ROSE)
    + f'<path d="M137 94q-10 4 -13 10" stroke="{SKIN[3]}" stroke-width="5.5" stroke-linecap="round" fill="none"/>'
    # crossed legs as two soft wedges
    + f'<path d="M60 118h50l-6 16H62a6 6 0 0 1-6-6z" fill="{LAV}" opacity="0.8"/>'
    + f'<path d="M174 118h-50l6 16h42a6 6 0 0 0 6-6z" fill="{ROSE}" opacity="0.8"/>'
    # rug and mugs
    + f'<ellipse cx="120" cy="146" rx="92" ry="20" fill="#FFFFFF" opacity="0.6"/>'
    + f'<ellipse cx="120" cy="146" rx="62" ry="12" fill="{ROSE_SOFT}" opacity="0.35"/>'
    + f'<rect x="102" y="128" width="12" height="13" rx="3" fill="#FFFFFF"/>'
    + f'<rect x="128" y="128" width="12" height="13" rx="3" fill="#FFFFFF"/>'
)

# 8. Same recipe, two kitchens — one image, two places.
_left = (
    f'<rect width="120" height="{H}" fill="#FFEDE0"/>'
    + blob(24, 34, 26, PEACH, 0.22)
    + head(52, 62, 12, SKIN[0], HAIR[1], 'bun', flip=-1) + torso(52, 74, 30, 44, ROSE)
    + arm(42, 88, 32, 104, SKIN[0]) + arm(62, 88, 76, 100, SKIN[0])
    + f'<rect x="0" y="118" width="120" height="9" fill="{ROSE_DEEP}" opacity="0.22"/>'
    + f'<rect x="0" y="127" width="120" height="53" fill="#FFFFFF" opacity="0.5"/>'
    + f'<path d="M24 100h30v12a7 7 0 0 1-7 7H31a7 7 0 0 1-7-7z" fill="{ROSE_DEEP}"/>'
    + f'<rect x="21" y="96" width="36" height="5" rx="2.5" fill="{ROSE_DEEP}"/>'
    # propped phone showing the other one
    + f'<rect x="82" y="86" width="24" height="34" rx="4" fill="{INK}" opacity="0.75"/>'
    + f'<rect x="85" y="90" width="18" height="26" rx="2" fill="#FFFFFF" opacity="0.85"/>'
    + f'<circle cx="94" cy="100" r="5" fill="{SKIN[1]}"/><rect x="88" y="106" width="12" height="9" rx="4" fill="{LAV}"/>'
)
_right = (
    f'<rect x="120" width="120" height="{H}" fill="#F3E8F6"/>'
    + blob(216, 40, 26, LAV, 0.2)
    + head(188, 60, 12, SKIN[1], HAIR[2], 'curly') + torso(188, 72, 30, 46, LAV)
    + arm(178, 86, 166, 100, SKIN[1]) + arm(198, 86, 210, 102, SKIN[1])
    + f'<rect x="120" y="118" width="120" height="9" fill="{LAV}" opacity="0.35"/>'
    + f'<rect x="120" y="127" width="120" height="53" fill="#FFFFFF" opacity="0.5"/>'
    + f'<path d="M186 100h30v12a7 7 0 0 1-7 7h-16a7 7 0 0 1-7-7z" fill="{LAV}"/>'
    + f'<rect x="183" y="96" width="36" height="5" rx="2.5" fill="{LAV}"/>'
    + f'<rect x="134" y="86" width="24" height="34" rx="4" fill="{INK}" opacity="0.75"/>'
    + f'<rect x="137" y="90" width="18" height="26" rx="2" fill="#FFFFFF" opacity="0.85"/>'
    + f'<circle cx="146" cy="100" r="5" fill="{SKIN[0]}"/><rect x="140" y="106" width="12" height="9" rx="4" fill="{ROSE}"/>'
)
scenes['videocook'] = svg(
    _left + _right
    # the seam: soft, not a border
    + f'<rect x="112" width="16" height="{H}" fill="#FFFFFF" opacity="0.5"/>'
    + f'<rect x="119" width="2" height="{H}" fill="{ROSE_SOFT}" opacity="0.5"/>'
)

# Painted over. Writing these would put a .svg next to the .webp and leave
# which one the card shows down to glob order.
SKIP = {'pasta', 'pottery'}

os.makedirs(OUT, exist_ok=True)
written = [n for n in scenes if n not in SKIP]
for name in written:
    with open(os.path.join(OUT, f'{name}.svg'), 'w') as f:
        f.write(scenes[name])
print(f'{len(written)} scenes written:', ', '.join(sorted(written)),
      '\n  skipped (painted):', ', '.join(sorted(SKIP)))
