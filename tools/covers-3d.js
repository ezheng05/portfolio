#!/usr/bin/env node
/*
 * Render the 3D design-card covers (<project>/card.jpg and card-dark.jpg).
 *
 * Each cover is a small HTML scene: phones or browser windows tilted in perspective
 * on the cards' dotted background, screenshotted at 2x and scaled down to 1200x800.
 *
 * Usage, from the repo root (needs Playwright with Chromium):
 *     python3 -m http.server 8765 &      # the scenes load screens from the repo over http
 *     node tools/covers-3d.js            # every project
 *     node tools/covers-3d.js popple     # just one
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'http://localhost:8765/';
const W = 1200, H = 800;

// a screen is an image, optionally cropped from a larger board: [x, y, w, h] in image pixels
const scr = (src, crop) => ({ src, crop });

const SCENES = {
    vitasalus: {
        kind: 'phones',
        screens: [scr('vitasalus/s/why-w5.webp'), scr('vitasalus/s/home-a2.webp'), scr('vitasalus/s/goal.webp')],
    },
    popple: {
        kind: 'phones',
        screens: [
            scr('popple/profile.png', [37, 64, 511, 1084]),
            scr('popple/home.png', [6, 8, 606, 1157]),
            scr('popple/taste-map.png', [481, 54, 459, 1213]),
        ],
    },
    artscape: {
        // these exports already include the phone frame, so they're used as-is
        kind: 'devices',
        screens: [scr('artscape/s/discover.webp'), scr('artscape/s/event-page.webp'), scr('artscape/s/commission-inbox.webp')],
    },
    lovable: {
        kind: 'phones',
        screens: [scr('lovable/screen-learn.png'), scr('lovable/screen-home-metrics.png'), scr('lovable/screen-log-capture.png')],
    },
    flamefreeze: {
        kind: 'browsers',
        screens: [scr('flamefreeze/s/simulation.webp'), scr('flamefreeze/s/dashboard.webp')],
    },
};

const THEMES = {
    light: { bg: '#ebe7de', dot: '#d1cdc4', shadow: 'rgba(60, 45, 25, 0.38)', bezel: '#171717', rim: '#3a3a3a', edge: ['#4a4a4a', '#1c1c1c'] },
    dark: { bg: '#1e1e1e', dot: '#3a3a3a', shadow: 'rgba(0, 0, 0, 0.7)', bezel: '#0e0e0e', rim: '#4a4a4a', edge: ['#555', '#222'] },
};

function screenDiv(s, cls) {
    if (!s.crop) return `<div class="${cls}" style="background-image:url('${BASE}${s.src}')"></div>`;
    // crop with background-size/position, scaled from the board's pixels to the box via CSS vars set below
    const [x, y, w, h] = s.crop;
    return `<div class="${cls} crop" data-src="${BASE}${s.src}" data-crop="${x},${y},${w},${h}"></div>`;
}

function phone(s, i) {
    return `<div class="phone p${i}"><div class="edge"></div><div class="face">${screenDiv(s, 'screen')}<div class="glare"></div></div></div>`;
}

function device(s, i) {
    return `<div class="device p${i}"><img src="${BASE}${s.src}" alt=""></div>`;
}

function browser(s, i) {
    return `<div class="browser b${i}"><div class="bar"><i></i><i></i><i></i><span></span></div>${screenDiv(s, 'page')}</div>`;
}

function html(scene, t) {
    const items = scene.kind === 'phones' ? scene.screens.map(phone)
        : scene.kind === 'devices' ? scene.screens.map(device)
        : scene.screens.map(browser);
    return `<!doctype html><html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body {
    background: ${t.bg} radial-gradient(circle at 16px 16px, ${t.dot} 2.4px, transparent 3.2px) 0 0 / 32px 32px;
}
.stage { position: absolute; inset: 0; perspective: 2200px; perspective-origin: 50% 20%; }
.group {
    position: absolute; left: 50%; top: 84px;
    transform-style: preserve-3d;
    display: flex; align-items: flex-start;
}
/* fade the bottom so the card's title sits on plain background */
.fade { position: absolute; left: 0; right: 0; bottom: 0; height: 330px;
    background: linear-gradient(to bottom, transparent 0, ${t.bg} 52%); }
.fade::after { content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 16px 16px, ${t.dot} 2.4px, transparent 3.2px) 0 0 / 32px 32px;
    -webkit-mask: linear-gradient(to bottom, transparent 0, #000 52%); mask: linear-gradient(to bottom, transparent 0, #000 52%); }

/* phones: rounded bezel, screen, a side edge for thickness and a soft glare */
.phone { position: relative; width: 252px; height: 526px; transform-style: preserve-3d; flex: none; }
.phone .face { position: absolute; inset: 0; border-radius: 42px; background: ${t.bezel};
    border: 1.5px solid ${t.rim}; padding: 9px;
    box-shadow: 0 60px 70px -34px ${t.shadow}, 0 18px 28px -16px ${t.shadow}; }
.phone .screen, .browser .page { width: 100%; height: 100%; background-size: cover; background-position: center top;
    background-repeat: no-repeat; background-color: #fff; }
.phone .screen { border-radius: 33px; }
.phone .glare { position: absolute; inset: 9px; border-radius: 33px; pointer-events: none;
    background: linear-gradient(118deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 26%, transparent 42%); }
.phone .edge { position: absolute; top: 40px; bottom: 40px; left: 100%; width: 13px;
    transform-origin: left center; transform: rotateY(90deg);
    background: linear-gradient(to right, ${t.edge[0]}, ${t.edge[1]}); border-radius: 3px; }

.device { flex: none; width: 250px; transform-style: preserve-3d; }
.device img { width: 100%; display: block; filter: drop-shadow(0 34px 30px ${t.shadow}); }

.browser { position: absolute; width: 720px; border-radius: 12px; overflow: hidden; background: #fff;
    border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 70px 90px -40px ${t.shadow}, 0 20px 30px -18px ${t.shadow}; }
.browser .bar { height: 34px; background: #f1efeb; display: flex; align-items: center; gap: 7px; padding: 0 14px;
    border-bottom: 1px solid #e2ded6; }
.browser .bar i { width: 10px; height: 10px; border-radius: 50%; background: #d4cfc6; }
.browser .bar span { margin-left: 18px; height: 14px; width: 40%; border-radius: 7px; background: #e4e0d8; }
.browser .page { height: 450px; }

/* poses: one tilt for the whole group so the screens read as a single 3D arrangement */
.phones .group, .devices .group { gap: 64px; margin-left: -420px;
    transform: rotateX(24deg) rotateY(-30deg) rotateZ(8deg); }
.phones .p0, .devices .p0 { transform: translateZ(-60px) translateY(60px); }
.phones .p1, .devices .p1 { transform: translateZ(50px) translateY(-10px); }
.phones .p2, .devices .p2 { transform: translateZ(160px) translateY(40px); }

.browsers .group { margin-left: 0; transform: rotateX(20deg) rotateY(-24deg) rotateZ(6deg); }
.browsers .b0 { left: -610px; top: -50px; transform: translateZ(-140px); }
.browsers .b1 { left: -250px; top: 90px; transform: translateZ(80px); }
</style></head><body class="${scene.kind}">
<div class="stage"><div class="group">${items.join('')}</div></div>
<div class="fade"></div>
<script>
// size cropped boards so the crop box fills its element
document.querySelectorAll('.crop').forEach(el => {
    const [x, y, w, h] = el.dataset.crop.split(',').map(Number);
    const img = new Image();
    img.onload = () => {
        const r = el.getBoundingClientRect();
        const box = el.offsetWidth, s = box / w;            // scale so the crop's width fills the box
        el.style.backgroundImage = 'url(' + el.dataset.src + ')';
        el.style.backgroundSize = (img.naturalWidth * s) + 'px ' + (img.naturalHeight * s) + 'px';
        el.style.backgroundPosition = (-x * s) + 'px ' + (-y * s) + 'px';
        el.dataset.ready = '1';
    };
    img.src = el.dataset.src;
});
</script>
</body></html>`;
}

(async () => {
    const only = process.argv.slice(2);
    const names = only.length ? only : Object.keys(SCENES);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    const shrink = await browser.newPage({ viewport: { width: W, height: H } });
    for (const name of names) {
        for (const [themeName, t] of Object.entries(THEMES)) {
            await page.setContent(html(SCENES[name], t), { waitUntil: 'networkidle' });
            await page.waitForFunction(() => [...document.querySelectorAll('.crop')].every(e => e.dataset.ready));
            await page.waitForTimeout(150);
            const png = await page.screenshot({ type: 'png' });
            // scale the 2x render down to 1200x800 with high-quality smoothing, then save as JPEG
            const jpg = await shrink.evaluate(async ({ b64, W, H }) => {
                const img = new Image();
                img.src = 'data:image/png;base64,' + b64;
                await img.decode();
                const c = document.createElement('canvas');
                c.width = W; c.height = H;
                const g = c.getContext('2d');
                g.imageSmoothingQuality = 'high';
                g.drawImage(img, 0, 0, W, H);
                return c.toDataURL('image/jpeg', 0.84).split(',')[1];
            }, { b64: png.toString('base64'), W, H });
            const out = path.join(ROOT, name, themeName === 'light' ? 'card.jpg' : 'card-dark.jpg');
            fs.writeFileSync(out, Buffer.from(jpg, 'base64'));
            console.log('wrote', path.relative(ROOT, out));
        }
    }
    await browser.close();
})();
