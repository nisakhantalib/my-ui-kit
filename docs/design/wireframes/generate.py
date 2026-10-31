"""Generates the low-fidelity Orchid Bank wireframes (SVG).   python generate.py docs/design/wireframes"""
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

INK, MUTED, LINE, FILL, NOTE = '#2b2f38', '#8a90a0', '#c5c9d2', '#f1f2f5', '#b45309'
FONT = "font-family=\"system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif\""


def text(x, y, s, size=13, weight=400, fill=INK, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{s}</text>'


def rect(x, y, w, h, r=6, fill='#fff', stroke=LINE, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def bar(x, y, w, h=8, fill=LINE):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="{fill}"/>'


def circle(cx, cy, r, fill=FILL, stroke='none'):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>'


def marker(x, y, n):
    return circle(x, y, 11, NOTE) + text(x, y + 4.5, str(n), 12, 700, '#fff', 'middle')


def button(x, y, w, label, primary=True, h=40, r=20):
    if primary:
        return rect(x, y, w, h, r, INK, INK) + text(x + w / 2, y + h / 2 + 5, label, 13, 600, '#fff', 'middle')
    return rect(x, y, w, h, r, '#fff', INK, 2) + text(x + w / 2, y + h / 2 + 5, label, 13, 600, INK, 'middle')


def row(x, y, w, title, sub, amount):
    return '\n'.join([circle(x + 18, y + 18, 18), bar(x + 46, y + 8, 110, 8, '#9aa0ad'), bar(x + 46, y + 22, 70, 6),
                      text(x + w, y + 22, amount, 12, 600, INK, 'end')]) if title is None else '\n'.join([
        circle(x + 18, y + 18, 18), text(x + 46, y + 15, title, 12, 600), text(x + 46, y + 31, sub, 11, 400, MUTED),
        text(x + w, y + 22, amount, 12, 600, INK, 'end')])


def phone(ox, oy, title, body, tab=0):
    w, h = 300, 640
    clip = f'clip-{ox}'
    tabs = ['Home', 'Activity', 'Pay', 'Cards', 'Settings']
    nav = [f'<line x1="{ox}" y1="{oy + h - 62}" x2="{ox + w}" y2="{oy + h - 62}" stroke="{LINE}"/>']
    for i, t in enumerate(tabs):
        cx = ox + 30 + i * 60
        if i == 2:
            nav.append(circle(cx, oy + h - 42, 17, INK))
        else:
            nav.append(rect(cx - 20, oy + h - 54, 40, 22, 11, FILL if i == tab else '#fff', '#fff'))
            nav.append(circle(cx, oy + h - 43, 6, '#fff', INK if i == tab else MUTED))
        nav.append(text(cx, oy + h - 14, t, 9, 700 if i == tab else 500, INK if i == tab else MUTED, 'middle'))
    return '\n'.join([
        f'<clipPath id="{clip}"><rect x="{ox}" y="{oy}" width="{w}" height="{h}" rx="28"/></clipPath>',
        rect(ox, oy, w, h, 28, FILL, INK, 2),
        text(ox + w / 2, oy - 14, title, 14, 700, INK, 'middle'),
        f'<g clip-path="url(#{clip})">',
        f'<rect x="{ox}" y="{oy}" width="{w}" height="52" fill="#fff"/>',
        f'<line x1="{ox}" y1="{oy + 52}" x2="{ox + w}" y2="{oy + 52}" stroke="{LINE}"/>',
        rect(ox + 18, oy + 16, 22, 22, 7, INK, INK), text(ox + 48, oy + 32, 'Orchid Bank', 13, 700),
        circle(ox + w - 58, oy + 27, 10, '#fff', INK), circle(ox + w - 28, oy + 27, 10, '#fff', INK), circle(ox + w - 21, oy + 19, 3.5, NOTE),
        body,
        f'<rect x="{ox}" y="{oy + h - 62}" width="{w}" height="62" fill="#fff"/>',
        *nav,
        '</g>',
    ])


def svg(w, h, content, title, desc):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t d" {FONT}>
<title id="t">{title}</title>
<desc id="d">{desc}</desc>
<rect width="{w}" height="{h}" fill="#fafafa"/>
{content}
</svg>
'''


# ---------------- Phone: Home, Pay (OTP), Cards ----------------
parts = [text(40, 34, 'Orchid Bank: phone (320 to 414px), low fidelity. Designed first; bottom tab bar like a native app.', 16, 700)]
y0, gap = 70, 340

# Home
px = 40
b = [text(px + 18, y0 + 84, 'Good morning, Wei Ling', 16, 700), text(px + 18, y0 + 102, 'Saturday, 31 October', 11, 400, MUTED)]
b.append(rect(px + 14, y0 + 116, 272, 132, 18, INK, INK))
b += [text(px + 30, y0 + 140, 'Total balance', 11, 500, '#fff'), text(px + 30, y0 + 176, '$60,690.55', 26, 700, '#fff'),
      f'<polyline points="{px + 14},{y0 + 236} {px + 80},{y0 + 230} {px + 150},{y0 + 222} {px + 220},{y0 + 210} {px + 286},{y0 + 196}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>',
      rect(px + 30, y0 + 192, 96, 32, 16, '#fff', '#fff'), text(px + 78, y0 + 213, 'Transfer', 12, 600, INK, 'middle')]
b.append(rect(px + 14, y0 + 262, 272, 112, 16, '#fff', LINE))
for i, lab in enumerate(['Transfer', 'PayNow', 'Bills', 'Card', 'Statements', 'Settings']):
    cx, cy = px + 50 + (i % 3) * 100, y0 + 292 + (i // 3) * 50
    b += [rect(cx - 16, cy - 14, 32, 28, 9, FILL, FILL), text(cx, cy + 26, lab, 9, 500, INK, 'middle')]
b.append(rect(px + 14, y0 + 388, 272, 150, 16, '#fff', LINE))
b.append(text(px + 30, y0 + 410, 'Accounts', 12, 700))
for i, (n, a) in enumerate([('Everyday Account', '$12,480.55'), ('Savings Account', '$48,210.00'), ('Orchid Visa', '$1,320.40')]):
    b.append(row(px + 26, y0 + 422 + i * 38, 248, n, '•••• 6789', a))
b += [marker(px + 292, y0 + 120, 1), marker(px + 292, y0 + 266, 2), marker(px + 292, y0 + 392, 3)]
parts.append(phone(px, y0, 'Home', '\n'.join(b), 0))

# Pay with OTP dialog
px = 40 + gap
b = [text(px + 18, y0 + 84, 'Pay & transfer', 16, 700), text(px + 18, y0 + 102, 'Send money instantly with PayNow.', 11, 400, MUTED)]
for i in range(3):
    b.append(circle(px + 30 + i * 110, y0 + 126, 10, INK if i < 2 else '#fff', INK))
    if i < 2:
        b.append(f'<line x1="{px + 42 + i * 110}" y1="{y0 + 126}" x2="{px + 128 + i * 110}" y2="{y0 + 126}" stroke="{INK if i < 1 else LINE}" stroke-width="2"/>')
b.append(rect(px + 14, y0 + 148, 272, 300, 16, '#fff', LINE))
b += [text(px + 30, y0 + 174, 'Check before you send', 13, 700), rect(px + 30, y0 + 188, 240, 60, 12, FILL, FILL),
      circle(px + 54, y0 + 218, 16, '#fff'), text(px + 78, y0 + 214, 'Tan Wei Ling', 12, 600), text(px + 78, y0 + 230, 'Orchid ···· 4821', 10, 400, MUTED),
      text(px + 262, y0 + 223, '$250.00', 14, 700, INK, 'end')]
for i, (k, v) in enumerate([('From', 'Everyday ···· 6789'), ('Arrives', 'Instantly, via PayNow'), ('Fee', 'Free')]):
    b += [text(px + 30, y0 + 276 + i * 24, k, 11, 400, MUTED), text(px + 270, y0 + 276 + i * 24, v, 11, 500, INK, 'end')]
b.append(f'<rect x="{px}" y="{y0 + 53}" width="300" height="525" fill="{INK}" opacity="0.45"/>')
b.append(rect(px + 20, y0 + 220, 260, 190, 16, '#fff', '#fff'))
b += [text(px + 38, y0 + 250, 'Approve this transfer', 14, 700), bar(px + 38, y0 + 262, 200, 7, '#dcdfe5'), bar(px + 38, y0 + 275, 150, 7, '#dcdfe5')]
for i in range(6):
    b.append(rect(px + 38 + i * 38, y0 + 296, 32, 40, 8, '#fff', INK if i == 3 else MUTED, 3 if i == 3 else 1.5))
    if i < 3:
        b.append(text(px + 54 + i * 38, y0 + 322, str(i + 1), 15, 700, INK, 'middle'))
b += [text(px + 38, y0 + 356, 'Resend code in 27s', 10, 400, MUTED), text(px + 176, y0 + 393, 'Cancel', 12, 600, INK, 'middle'), button(px + 200, y0 + 372, 64, 'Approve', True, 32, 16)]
b += [marker(px + 292, y0 + 120, 4), marker(px + 292, y0 + 300, 5)]
parts.append(phone(px, y0, 'Pay: review, then approve', '\n'.join(b), 2))

# Cards
px = 40 + gap * 2
b = [text(px + 18, y0 + 84, 'Cards', 16, 700), text(px + 18, y0 + 102, 'Freeze, limit or replace instantly.', 11, 400, MUTED)]
b += [rect(px + 14, y0 + 116, 272, 170, 18, INK, INK), rect(px + 32, y0 + 168, 36, 28, 6, '#d9c187', '#d9c187'),
      text(px + 32, y0 + 142, 'Orchid Bank', 12, 700, '#fff'), text(px + 268, y0 + 142, 'SIGNATURE', 9, 700, '#fff', 'end'),
      text(px + 32, y0 + 226, '•••• 5566', 15, 600, '#fff'), text(px + 32, y0 + 264, 'Tan Wei Ling', 11, 500, '#fff'),
      text(px + 268, y0 + 266, 'VISA', 15, 800, '#fff', 'end')]
b.append(rect(px + 14, y0 + 300, 272, 150, 16, '#fff', LINE))
b.append(text(px + 30, y0 + 324, 'Card controls', 12, 700))
for i, (lab, on) in enumerate([('Freeze card', False), ('Online payments', True), ('Overseas use', False)]):
    yy = y0 + 340 + i * 34
    b += [rect(px + 30, yy, 38, 22, 11, INK if on else '#fff', INK, 1.5), circle(px + (57 if on else 41), yy + 11, 7, '#fff' if on else MUTED), text(px + 78, yy + 16, lab, 12, 600)]
b.append(rect(px + 14, y0 + 464, 272, 60, 16, '#fff', LINE))
b += [button(px + 30, y0 + 476, 160, 'Report lost or stolen', True, 34, 17)]
b += [marker(px + 292, y0 + 120, 6), marker(px + 292, y0 + 340, 7), marker(px + 292, y0 + 478, 8)]
parts.append(phone(px, y0, 'Cards', '\n'.join(b), 3))

notes = [
    'Balance is the largest element on screen; trend line is decorative, the change is stated in text.',
    'Six quick actions, each lands somewhere real (DBS Simple Mode / OCBC shortcuts pattern).',
    'Account numbers masked by default; screen readers hear “account number ending 6789”.',
    'Three-step progress shown as dots and as text (“Step 2 of 3”); review repeats payee, rail and fee.',
    'OTP: one real input drawn as boxes, so SMS autofill and paste work; resend unlocks after 30s.',
    'Card art is a brand-surface gradient; frozen state adds a frosted overlay and a “Frozen” badge.',
    'Freeze is a Switch: it applies instantly, unlike a checkbox that waits for Save.',
    'Destructive action opens an alert dialog with focus on Cancel, the safe default.',
]
ny = 760
parts.append(text(40, ny, 'Annotations', 14, 700))
for i, n in enumerate(notes):
    yy = ny + 26 + i * 24
    parts += [marker(52, yy - 4, i + 1), text(72, yy, n, 12.5)]
(OUT / 'bank-mobile.svg').write_text(svg(1060, 980, '\n'.join(parts), 'Orchid Bank wireframe, phone',
    'Three phone screens: Home with balance card, quick actions and accounts; Pay review with OTP approval dialog; Cards with visual card, controls and report-lost action. Eight numbered annotations.'), encoding='utf8')

# ---------------- Desktop: Home with sidebar ----------------
p = [text(40, 34, 'Orchid Bank: desktop (1024px and up). Sidebar navigation, calm canvas, white cards.', 16, 700)]
fx, fy, fw, fh = 40, 60, 980, 620
p += [rect(fx, fy, fw, fh, 10, FILL, INK, 2), f'<rect x="{fx + 1}" y="{fy + 1}" width="200" height="{fh - 2}" rx="9" fill="#fff"/>',
      f'<line x1="{fx + 200}" y1="{fy}" x2="{fx + 200}" y2="{fy + fh}" stroke="{LINE}"/>',
      rect(fx + 20, fy + 22, 26, 26, 8, INK, INK), text(fx + 56, fy + 34, 'Orchid Bank', 13, 700), text(fx + 56, fy + 48, 'Personal banking', 10, 400, MUTED)]
for i, n in enumerate(['Home', 'Activity', 'Pay & transfer', 'Cards', 'Settings']):
    yy = fy + 80 + i * 38
    if i == 0:
        p.append(rect(fx + 12, yy - 4, 176, 32, 10, FILL, FILL))
    p += [circle(fx + 32, yy + 12, 6, '#fff', INK if i == 0 else MUTED), text(fx + 48, yy + 17, n, 12, 600 if i == 0 else 500, INK if i == 0 else MUTED)]
p += [rect(fx + 12, fy + fh - 64, 176, 48, 12, FILL, FILL), circle(fx + 36, fy + fh - 40, 14, '#fff'), text(fx + 58, fy + fh - 36, 'Tan Wei Ling', 11, 600)]
mx = fx + 230
p += [f'<rect x="{fx + 201}" y="{fy + 1}" width="{fw - 202}" height="48" fill="#fff"/>', f'<line x1="{fx + 200}" y1="{fy + 49}" x2="{fx + fw}" y2="{fy + 49}" stroke="{LINE}"/>',
      text(mx, fy + 30, '✓ Last signed in today at 9:01 am', 11, 400, MUTED), circle(fx + fw - 90, fy + 25, 10, '#fff', INK), circle(fx + fw - 60, fy + 25, 10, '#fff', INK), circle(fx + fw - 28, fy + 25, 13, FILL)]
p += [text(mx, fy + 90, 'Good morning, Wei Ling', 20, 700), text(mx, fy + 110, 'Saturday, 31 October', 11, 400, MUTED)]
p += [rect(mx, fy + 126, 440, 140, 18, INK, INK), text(mx + 20, fy + 152, 'Total balance', 11, 500, '#fff'), text(mx + 20, fy + 192, '$60,690.55', 30, 700, '#fff'),
      rect(mx + 20, fy + 214, 100, 32, 16, '#fff', '#fff'), text(mx + 70, fy + 235, 'Transfer', 12, 600, INK, 'middle')]
p.append(rect(mx, fy + 280, 440, 92, 16, '#fff', LINE))
for i in range(6):
    p.append(rect(mx + 26 + i * 70, fy + 302, 34, 30, 9, FILL, FILL))
    p.append(bar(mx + 22 + i * 70, fy + 346, 42, 6))
p.append(rect(mx, fy + 386, 440, 210, 16, '#fff', LINE))
p.append(text(mx + 20, fy + 410, 'Recent activity', 12, 700))
for i in range(4):
    p.append(row(mx + 18, fy + 424 + i * 42, 400, None, None, '-$86.40' if i else '-$6.80'))
rx = mx + 460
p += [rect(rx, fy + 126, 260, 220, 16, '#fff', LINE), text(rx + 20, fy + 150, 'Spending, last 14 days', 12, 700),
      f'<circle cx="{rx + 70}" cy="{fy + 230}" r="46" fill="none" stroke="{INK}" stroke-width="16" stroke-dasharray="120 300"/>',
      f'<circle cx="{rx + 70}" cy="{fy + 230}" r="46" fill="none" stroke="{MUTED}" stroke-width="16" stroke-dasharray="100 300" stroke-dashoffset="-122"/>']
for i in range(4):
    p += [circle(rx + 140, fy + 196 + i * 22, 4, INK if i == 0 else MUTED), bar(rx + 150, fy + 192 + i * 22, 60, 7), text(rx + 244, fy + 200 + i * 22, f'{34 - i * 7}%', 10, 400, MUTED, 'end')]
p += [rect(rx, fy + 360, 260, 150, 16, '#fff', LINE), text(rx + 20, fy + 384, 'Upcoming bills', 12, 700)]
for i in range(2):
    yy = fy + 400 + i * 50
    p += [circle(rx + 38, yy + 18, 16), bar(rx + 62, yy + 10, 80, 7, '#9aa0ad'), bar(rx + 62, yy + 24, 50, 6),
          rect(rx + 168, yy + 6, 76, 18, 9, '#f6e7c8', '#f6e7c8'), text(rx + 206, yy + 19, 'Due in 4 days', 9, 600, INK, 'middle'), text(rx + 244, yy + 40, 'Pay', 11, 700, INK, 'end')]
p += [marker(fx + 200, fy + 80, 'A'), marker(mx + 440, fy + 130, 'B'), marker(rx + 260, fy + 130, 'C'), marker(rx + 260, fy + 364, 'D'), marker(fx + fw - 60, fy + 8, 'E')]
for i, n in enumerate(['A  Sidebar from 1024px; below that, the bottom tab bar', 'B  Two columns: money and actions left, context right',
                       'C  Donut with legend text and a table view', 'D  Bills deep-link into a prefilled payment', 'E  Hide balances and notifications in the top bar']):
    p.append(text(40 + (i % 2) * 500, 708 + (i // 2) * 20, n, 12))
(OUT / 'bank-desktop.svg').write_text(svg(1060, 770, '\n'.join(p), 'Orchid Bank wireframe, desktop',
    'Desktop Home: sidebar navigation, top bar with sign-in note, hide-balance and notification buttons, balance card, quick actions, recent activity, spending donut and upcoming bills. Five lettered annotations.'), encoding='utf8')
print('ok')
