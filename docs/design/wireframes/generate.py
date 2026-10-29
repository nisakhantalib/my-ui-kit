"""Generates low-fidelity wireframes (SVG) for docs/design/wireframes."""
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

INK = '#2b2f38'
MUTED = '#8a90a0'
LINE = '#c5c9d2'
FILL = '#f3f4f6'
NOTE = '#b45309'
FONT = "font-family=\"system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif\""


def text(x, y, s, size=13, weight=400, fill=INK, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{s}</text>'


def rect(x, y, w, h, r=6, fill='#fff', stroke=LINE, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def bar(x, y, w, h=8, fill=LINE):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}"/>'


def field(x, y, w, label, hint=None, error=None, required=True):
    out = [text(x, y, label + (' *' if required else ''), 12, 600)]
    y += 8
    if hint:
        out.append(bar(x, y + 2, w * 0.6, 6, '#dcdfe5'))
        y += 14
    out.append(rect(x, y, w, 36, 6, '#fff', '#d14343' if error else MUTED, 2 if error else 1.5))
    y += 36
    if error:
        out.append(text(x, y + 15, '⚠ ' + error, 11, 600, '#b42318'))
        y += 20
    return '\n'.join(out), y + 14


def button(x, y, w, label, primary=True, h=40):
    if primary:
        return rect(x, y, w, h, 8, INK, INK) + text(x + w / 2, y + h / 2 + 5, label, 13, 600, '#fff', 'middle')
    return rect(x, y, w, h, 8, '#fff', INK, 2) + text(x + w / 2, y + h / 2 + 5, label, 13, 600, INK, 'middle')


def marker(x, y, n):
    return f'<circle cx="{x}" cy="{y}" r="11" fill="{NOTE}"/>' + text(x, y + 4.5, str(n), 12, 700, '#fff', 'middle')


def tabs(x, y, w, active):
    labels = ['1. Details', '2. Clinic', '3. Review']
    out = [f'<line x1="{x}" y1="{y + 32}" x2="{x + w}" y2="{y + 32}" stroke="{MUTED}" stroke-width="2"/>']
    cw = w / 3
    for i, lab in enumerate(labels):
        cx = x + i * cw
        out.append(text(cx + cw / 2, y + 20, lab, 12, 700 if i == active else 500, INK if i == active else MUTED, 'middle'))
        if i == active:
            out.append(f'<rect x="{cx + 6}" y="{y + 30}" width="{cw - 12}" height="4" fill="{INK}"/>')
    return '\n'.join(out)


def phone(ox, oy, title, body):
    w, h = 300, 640
    head = [
        rect(ox, oy, w, h, 28, '#fff', INK, 2),
        text(ox + w / 2, oy - 14, title, 14, 700, INK, 'middle'),
        f'<line x1="{ox}" y1="{oy + 52}" x2="{ox + w}" y2="{oy + 52}" stroke="{LINE}"/>',
        text(ox + 20, oy + 33, '✚ ClinicBook SG', 13, 700),
        rect(ox + w - 74, oy + 18, 56, 22, 11, FILL, FILL),
        text(ox + w - 46, oy + 33, 'Online', 10, 600, INK, 'middle'),
    ]
    return '\n'.join(head + [body])


def svg(w, h, content, title, desc):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t d" {FONT}>
<title id="t">{title}</title>
<desc id="d">{desc}</desc>
<rect width="{w}" height="{h}" fill="#fafafa"/>
{content}
</svg>
'''


# ---------------- Mobile flow ----------------
parts = []
x0, y0, gap = 40, 70, 340
parts.append(text(40, 34, 'ClinicBook SG — booking flow, phone (320–414px). Low fidelity.', 16, 700))

# Phone 1: details with errors
px, py = x0, y0
b = [text(px + 20, py + 90, 'Book an appointment', 17, 700), tabs(px + 20, py + 104, 260, 0)]
y = py + 170
for lab, hint, err in [('Full name', None, 'Enter your full name'), ('NRIC / FIN', True, 'Enter a valid NRIC or FIN'), ('Email', None, 'Enter an email address')]:
    s, y = field(px + 20, y, 260, lab, hint, err)
    b.append(s)
b.append(button(px + 20, y + 4, 120, 'Continue'))
b += [marker(px + 290, py + 120, 1), marker(px + 290, py + 196, 2), marker(px + 160, y + 24, 3)]
parts.append(phone(px, py, 'Step 1 — details (after Continue with errors)', '\n'.join(b)))

# Phone 2: clinic + date + time
px = x0 + gap
b = [text(px + 20, py + 90, 'Book an appointment', 17, 700), tabs(px + 20, py + 104, 260, 1)]
y = py + 170
b.append(text(px + 20, y, 'Clinic *', 12, 600))
y += 10
for i, (name, area) in enumerate([('Tampines Family Clinic', 'East region'), ('Jurong West Medical', 'West region'), ('Toa Payoh Health Hub', 'Central region')]):
    sel = i == 2
    b.append(rect(px + 20, y, 260, 50, 8, '#fff', INK if sel else MUTED, 3 if sel else 1.5))
    b.append(f'<circle cx="{px + 40}" cy="{y + 25}" r="8" fill="#fff" stroke="{INK}" stroke-width="2"/>')
    if sel:
        b.append(f'<circle cx="{px + 40}" cy="{y + 25}" r="4" fill="{INK}"/>')
    b.append(text(px + 58, y + 22, name, 12, 600))
    b.append(text(px + 58, y + 38, area, 11, 400, MUTED))
    y += 58
y += 12
s, y2 = field(px + 20, y, 124, 'Date')
b.append(s)
s, _ = field(px + 156, y, 124, 'Time slot')
b.append(s)
b.append(f'<path d="M{px + 262} {y + 22} l5 5 l5 -5" fill="none" stroke="{INK}" stroke-width="2"/>')
y = y2
b.append(button(px + 20, y + 4, 90, 'Back', False))
b.append(button(px + 122, y + 4, 120, 'Continue'))
b += [marker(px + 290, py + 200, 4), marker(px + 290, y - 30, 5)]
parts.append(phone(px, py, 'Step 2 — clinic, date and time', '\n'.join(b)))

# Phone 3: review + confirm dialog + toast
px = x0 + gap * 2
b = [text(px + 20, py + 90, 'Book an appointment', 17, 700), tabs(px + 20, py + 104, 260, 2)]
y = py + 172
for k, v in [('Name', 'Tan Wei Ling'), ('NRIC / FIN', '*****567D'), ('Clinic', 'Toa Payoh Health Hub'), ('Date', '30 Oct 2026'), ('Time', '2:00 pm')]:
    b.append(text(px + 20, y, k, 12, 700))
    b.append(text(px + 110, y, v, 12))
    y += 22
b.append(f'<clipPath id="screen3"><rect x="{px}" y="{py}" width="300" height="640" rx="28"/></clipPath>')
b.append(f'<rect x="{px}" y="{py + 53}" width="300" height="587" fill="{INK}" opacity="0.45" clip-path="url(#screen3)"/>')
b.append(rect(px + 22, py + 250, 256, 150, 12, '#fff', '#fff'))
b.append(text(px + 40, py + 282, 'Confirm this booking?', 15, 700))
b.append(bar(px + 40, py + 296, 200, 7, '#dcdfe5'))
b.append(bar(px + 40, py + 310, 150, 7, '#dcdfe5'))
b.append(text(px + 150, py + 372, 'Cancel', 13, 600, INK, 'middle'))
b.append(button(px + 186, py + 350, 76, 'Confirm', True, 36))
b.append(rect(px + 16, py + 556, 268, 62, 10, '#fff', INK, 1.5))
b.append(f'<rect x="{px + 16}" y="{py + 556}" width="6" height="62" rx="3" fill="{INK}"/>')
b.append(text(px + 34, py + 580, 'Booking confirmed', 12, 700))
b.append(text(px + 34, py + 598, 'Toa Payoh · 30 Oct · 2:00 pm', 11, 400, MUTED))
b.append(rect(px + 206, py + 572, 52, 28, 6, '#fff', INK, 1.5))
b.append(text(px + 232, py + 590, 'Share', 11, 600, INK, 'middle'))
b.append(text(px + 270, py + 580, '×', 16, 600, MUTED, 'middle'))
b += [marker(px + 290, py + 262, 6), marker(px + 290, py + 570, 7)]
parts.append(phone(px, py, 'Step 3 — review, confirm, then toast', '\n'.join(b)))

notes = [
    'Errors: each field says how to fix it. Focus moves to the first; a screen reader hears “3 errors on this step. Enter your full name.”',
    'Hint text sits between label and input, so it is read before typing (aria-describedby).',
    'One primary action per step, full 44px height, thumb-reachable.',
    'Radio cards: whole card is the target; region shown as description, not part of the name.',
    'Native date and select: the phone’s own pickers. Side by side from 640px, stacked below.',
    'Confirm dialog repeats the key facts; focus starts on Confirm; page behind is inert.',
    'Toast with Share (native share sheet in the app). Has an action, so it never times out.',
]
ny = 760
parts.append(text(40, ny, 'Annotations', 14, 700))
for i, n in enumerate(notes):
    yy = ny + 26 + i * 24
    parts.append(marker(52, yy - 4, i + 1))
    parts.append(text(72, yy, n, 12.5))

(OUT / 'booking-mobile.svg').write_text(svg(1060, 950, '\n'.join(parts), 'Booking flow wireframe, phone',
    'Three phone screens: step 1 details with field errors, step 2 clinic radio cards with date and time, step 3 review with confirm dialog and a success toast. Seven numbered annotations explain the decisions.'), encoding='utf8')

# ---------------- Desktop layout ----------------
p = []
W, H = 1060, 700
p.append(text(40, 34, 'ClinicBook SG — desktop (≥ 1024px). Two columns: task left, context right.', 16, 700))
fx, fy, fw, fh = 40, 60, 980, 600
p.append(rect(fx, fy, fw, fh, 10, '#fff', INK, 2))
p.append(f'<line x1="{fx}" y1="{fy + 56}" x2="{fx + fw}" y2="{fy + 56}" stroke="{LINE}"/>')
p.append(text(fx + 70, fy + 35, '✚ ClinicBook SG', 15, 700))
p.append(rect(fx + 420, fy + 14, 64, 30, 6, FILL, FILL))
p.append(text(fx + 452, fy + 34, 'Book', 13, 700, INK, 'middle'))
p.append(text(fx + 540, fy + 34, 'Components', 13, 500, MUTED, 'middle'))
p.append(text(fx + 790, fy + 34, 'Dark mode', 12, 600, INK, 'middle'))
p.append(rect(fx + 840, fy + 16, 70, 26, 13, FILL, FILL))
p.append(text(fx + 875, fy + 33, 'Online', 11, 600, INK, 'middle'))
p.append(rect(fx + 8, fy + 8, 52, 22, 4, '#fff', NOTE, 1.5, '4 3'))
p.append(text(fx + 34, fy + 23, 'skip link', 9, 600, NOTE, 'middle'))
p.append(text(fx + 70, fy + 100, 'Clinic appointments', 24, 700))
p.append(bar(fx + 70, fy + 116, 520, 8, '#dcdfe5'))
p.append(bar(fx + 70, fy + 130, 380, 8, '#dcdfe5'))
# form card
cx, cy, cw, ch = fx + 70, fy + 160, 560, 410
p.append(rect(cx, cy, cw, ch, 14, FILL, LINE))
p.append(text(cx + 24, cy + 38, 'Book an appointment', 17, 700))
p.append(tabs(cx + 24, cy + 50, 360, 1))
yy = cy + 112
p.append(text(cx + 24, yy, 'Clinic *', 12, 600))
for i in range(3):
    p.append(rect(cx + 24, yy + 10 + i * 50, cw - 48, 42, 8, '#fff', INK if i == 0 else MUTED, 3 if i == 0 else 1.5))
    p.append(f'<circle cx="{cx + 44}" cy="{yy + 31 + i * 50}" r="7" fill="#fff" stroke="{INK}" stroke-width="2"/>')
    p.append(bar(cx + 62, yy + 22 + i * 50, 180, 8, '#c5c9d2'))
    p.append(bar(cx + 62, yy + 34 + i * 50, 80, 6, '#dcdfe5'))
s, _ = field(cx + 24, yy + 180, 246, 'Date')
p.append(s)
s, _ = field(cx + 290, yy + 180, 246, 'Time slot')
p.append(s)
p.append(button(cx + 24, cy + ch - 62, 90, 'Back', False))
p.append(button(cx + 126, cy + ch - 62, 120, 'Continue'))
# aside
ax, ay, aw = fx + 660, fy + 160, 250
p.append(rect(ax, ay, aw, 410, 14, '#fff', LINE))
p.append(text(ax + 22, ay + 38, 'My bookings (1)', 15, 700))
p.append(rect(ax + 22, ay + 54, aw - 44, 58, 8, FILL, FILL))
p.append(bar(ax + 36, ay + 70, 150, 8, '#c5c9d2'))
p.append(bar(ax + 36, ay + 88, 110, 6, '#dcdfe5'))
p.append(text(ax + 22, ay + 150, 'Questions', 15, 700))
for i, q in enumerate(['What should I bring?', 'Can I change or cancel?', 'Works without internet?']):
    qy = ay + 166 + i * 46
    p.append(f'<line x1="{ax + 22}" y1="{qy}" x2="{ax + aw - 22}" y2="{qy}" stroke="{MUTED}"/>')
    p.append(text(ax + 22, qy + 28, q, 12, 600))
    p.append(text(ax + aw - 30, qy + 29, '+', 16, 700, INK, 'middle'))
p.append(f'<line x1="{ax + 22}" y1="{ay + 304}" x2="{ax + aw - 22}" y2="{ay + 304}" stroke="{MUTED}"/>')
p += [marker(fx + 34, fy + 48, 'A'), marker(cx + cw - 10, cy + 10, 'B'), marker(ax + aw - 10, ay + 10, 'C'), marker(ax + aw - 10, ay + 150, 'D')]
for i, n in enumerate(['A  Skip link is the first Tab stop', 'B  Task column flexes; stacks above context below 1024px', 'C  Context column is 320px: bookings update after confirm', 'D  FAQ accordion: real headings, ↑/↓ between questions']):
    p.append(text(40 + (i % 2) * 500, 684 + (i // 2) * 20, n, 12))
(OUT / 'booking-desktop.svg').write_text(svg(W, H + 20, '\n'.join(p), 'Booking page wireframe, desktop',
    'Desktop layout: header with skip link, navigation, theme toggle and online status; booking form card on the left at step 2; My bookings and an FAQ accordion on the right. Four lettered annotations.'), encoding='utf8')
print('ok')
