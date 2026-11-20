/* Farshid map engine: a vector map of the world, Iran's provinces and cities, and Tehran's 22 districts and
   neighbourhoods, drawn on canvas with pan, inertia, wheel, double-click and pinch zoom. Data: geo.js (FD_GEO). */
(function () {
  'use strict';
  const DEG = Math.PI / 180;
  const mx = lng => (lng + 180) / 360;
  const my = lat => { const s = Math.sin(Math.max(-85.0511, Math.min(85.0511, lat)) * DEG); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); };
  const lngOf = x => x * 360 - 180;
  const latOf = y => Math.atan(Math.sinh(Math.PI - 2 * Math.PI * y)) / DEG;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const faDigits = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const MAXZ = 16.6, TEHRAN = { lat: 35.715, lng: 51.39 };

  /* ---------------- data decoding ---------------- */
  function dec(str, q) {
    const rings = [];
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    if (str) for (const part of str.split(' ')) {
      if (!part) continue;
      const pts = []; let i = 0, x = 0, y = 0;
      while (i < part.length) {
        let b, s = 0, r = 0;
        do { b = part.charCodeAt(i++) - 63; r |= (b & 31) << s; s += 5; } while (b >= 32);
        x += (r & 1) ? ~(r >> 1) : (r >> 1);
        s = 0; r = 0;
        do { b = part.charCodeAt(i++) - 63; r |= (b & 31) << s; s += 5; } while (b >= 32);
        y += (r & 1) ? ~(r >> 1) : (r >> 1);
        const px = x / q, py = y / q;
        pts.push(px, py);
        if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py;
      }
      rings.push(Float64Array.from(pts));
    }
    return { rings, bb: [bx0, by0, bx1, by1] };
  }
  let D = null;
  function data() {
    if (D) return D;
    const G = window.FD_GEO, q = G.q;
    D = {
      countries: G.C.map(c => ({ id: c[0], fa: c[1], en: c[2], lx: mx(c[3]), ly: my(c[4]), minL: c[5], g0: dec(c[6], q.w), g1: dec(c[7], q.w) })),
      provinces: G.P.map(p => ({ fa: p[0], en: p[1], lx: mx(p[2]), ly: my(p[3]), g0: dec(p[4], q.r), g1: dec(p[5], q.r) })),
      lakes: G.LK.map(l => ({ fa: l[0], en: l[1], sr: l[2], g: dec(l[3], q.r) })),
      rivers: G.RV.map(r => ({ sr: r[0], g: dec(r[1], q.r) })),
      roads: G.RD.map(r => ({ kind: r[0], sr: r[1], g: dec(r[2], q.r) })),
      urban: G.UA.map(u => ({ g: dec(u, q.r) })),
      cities: G.CT.map(c => ({ fa: c[0], en: c[1], x: mx(c[2]), y: my(c[3]), rank: c[4], cap: c[5] })),
      hoods: G.NB.map(n => ({ fa: n[0], en: n[1], d: n[2], lx: mx(n[3]), ly: my(n[4]), rad: n[5], g: dec(n[6], q.t) })),
      districts: G.TD.map(d => ({ n: d[0], lx: mx(d[1]), ly: my(d[2]), g: dec(d[3], q.t) })),
      city: dec(G.TC, q.t),
      metro: { colors: G.MT.c, stations: G.MT.s.map(s => ({ fa: s[0], en: s[1], x: mx(s[2]), y: my(s[3]), lines: s[4] })), edges: G.MT.e },
      landmarks: G.LM.map(l => ({ fa: l[0], en: l[1], x: mx(l[3]), y: my(l[2]), icon: l[4], minZ: l[5] })),
      seas: G.SEA.map(s => ({ fa: s[0], en: s[1], x: mx(s[2]), y: my(s[3]), z0: s[4], z1: s[5], k: s[6] })),
      terrain: G.TR.map(s => ({ fa: s[0], en: s[1], x: mx(s[2]), y: my(s[3]), z0: s[4], z1: s[5] })),
      peaks: G.PK.map(s => ({ fa: s[0], en: s[1], x: mx(s[2]), y: my(s[3]), minZ: s[4] }))
    };
    D.iran = D.countries.find(c => c.id === 'IRN');
    return D;
  }

  function pip(g, x, y) {
    const b = g.bb;
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) return false;
    let inside = false;
    for (const r of g.rings) {
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
      }
    }
    return inside;
  }
  /* reverse lookup: which neighbourhood / district / province / country holds a point */
  function whereIs(lat, lng) {
    const d = data(), x = mx(lng), y = my(lat), out = {};
    const h = d.hoods.find(n => pip(n.g, x, y));
    if (h) { out.hood = h.fa ? { fa: h.fa, en: h.en } : null; out.district = h.d; }
    else { const dd = d.districts.find(n => pip(n.g, x, y)); if (dd) out.district = dd.n; }
    const p = d.provinces.find(n => pip(n.g1, x, y));
    if (p) out.province = { fa: p.fa, en: p.en };
    const c = d.countries.find(n => pip(n.g1, x, y));
    if (c) out.country = { fa: c.fa, en: c.en };
    return out;
  }
  function hoodShape(lat, lng) { const d = data(), x = mx(lng), y = my(lat); return d.hoods.find(n => pip(n.g, x, y)) || null; }

  /* ---------------- palette & fonts ---------------- */
  const TOKENS = ['water', 'land', 'land-hi', 'land-lo', 'border', 'border-2', 'urban', 'city', 'road', 'road-2', 'river', 'txt', 'txt-2', 'txt-3', 'halo', 'sea', 'district', 'hood', 'hl', 'hl-line', 'accent', 'primary'];
  function palette(el) {
    const cs = getComputedStyle(el), p = {};
    for (const k of TOKENS) p[k] = cs.getPropertyValue('--m-' + k).trim() || '#888';
    p.font = cs.fontFamily || 'sans-serif';
    return p;
  }

  /* ---------------- the map ---------------- */
  function create(el, opts = {}) {
    const lang = opts.lang || 'fa', fa = lang === 'fa';
    const T = opts.text || {};
    const isStatic = !!opts.static;
    const d = data();
    el.classList.add('fmap');
    if (isStatic) el.classList.add('fmap-static');
    el.setAttribute('dir', 'ltr');
    el.innerHTML = `<div class="fm-vp" ${isStatic ? '' : 'tabindex="0"'} role="${isStatic ? 'img' : 'application'}" aria-label="${T.label || 'Map'}"><canvas class="fm-canvas"></canvas><div class="fm-pins"></div><div class="fm-tip" hidden></div></div>
      ${!isStatic && opts.controls !== false ? `<div class="fm-ctrl"><button type="button" data-fz="in" aria-label="${T.zoomIn || '+'}" title="${T.zoomIn || ''}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button><button type="button" data-fz="out" aria-label="${T.zoomOut || '-'}" title="${T.zoomOut || ''}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>${opts.items && opts.items.length ? `<button type="button" data-fz="fit" aria-label="${T.fit || 'fit'}" title="${T.fit || ''}"><svg aria-hidden="true"><use href="#i-target"/></svg></button>` : ''}${opts.onLocate ? `<button type="button" data-fz="me" aria-label="${T.me || 'me'}" title="${T.me || ''}"><svg aria-hidden="true"><use href="#i-locate"/></svg></button>` : ''}<button type="button" data-fz="world" aria-label="${T.world || 'world'}" title="${T.world || ''}"><svg aria-hidden="true"><use href="#i-globe"/></svg></button></div>` : ''}
      ${!isStatic ? `<div class="fm-scale" aria-hidden="true"><i></i><span></span></div><div class="fm-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · Natural Earth</div>` : ''}
      ${!isStatic && opts.onRedo ? `<button type="button" class="fm-redo" hidden><svg aria-hidden="true"><use href="#i-search"/></svg><span>${T.redo || 'Search this area'}</span></button>` : ''}
      ${!isStatic && opts.hint ? `<div class="fm-hint">${opts.hint}</div>` : ''}
      ${!isStatic ? `<div class="fm-toast" hidden></div>` : ''}`;
    const vp = el.querySelector('.fm-vp'), cv = el.querySelector('canvas'), pinsEl = el.querySelector('.fm-pins'), tipEl = el.querySelector('.fm-tip');
    const scaleEl = el.querySelector('.fm-scale'), redoEl = el.querySelector('.fm-redo'), toastEl = el.querySelector('.fm-toast');
    const ctx = cv.getContext('2d');
    let pal = palette(el), W = 0, H = 0, dpr = 1, destroyed = false;
    const view = { x: mx(TEHRAN.lng), y: my(TEHRAN.lat), z: 11 };
    let minZ = 1.2;
    let items = [], active = null, pick = opts.pick ? { x: mx(opts.pick.lng), y: my(opts.pick.lat) } : null;
    let highlight = null, hover = null, hoverPt = null, meLoc = opts.me && isFinite(opts.me.lat) ? { x: mx(opts.me.lng), y: my(opts.me.lat) } : null;
    let anim = null, inertia = null, wheel = null, raf = 0, dirty = true, lastMoveUser = false, movedSinceRedo = false;
    let dblState = null;
    let clusterKey = '', clusters = [];

    function setItems(list) {
      items = (list || []).filter(it => isFinite(it.lat) && isFinite(it.lng)).map(it => ({ ...it, x: mx(it.lng), y: my(it.lat) }));
      clusterKey = ''; dirty = true; schedule();
    }
    setItems(opts.items);
    if (opts.highlight) {
      const hs = hoodShape(opts.highlight.lat, opts.highlight.lng);
      highlight = hs ? hs.g : null;
    }

    /* ---------- view math ---------- */
    const k = () => 256 * Math.pow(2, view.z);
    function computeMinZ() { minZ = Math.max(1, Math.log2(Math.max(W, H * 1.05) / 256)); }
    function clampView() {
      view.z = clamp(view.z, minZ, MAXZ);
      const K = k(), hw = W / 2 / K, hh = H / 2 / K;
      view.x = hw >= 0.5 ? 0.5 : clamp(view.x, hw, 1 - hw);
      view.y = hh >= 0.5 ? 0.5 : clamp(view.y, hh, 1 - hh);
    }
    function toScreen(x, y) { const K = k(); return [(x - view.x) * K + W / 2, (y - view.y) * K + H / 2]; }
    function toWorld(px, py) { const K = k(); return [view.x + (px - W / 2) / K, view.y + (py - H / 2) / K]; }
    function zoomAround(nz, px, py) {
      nz = clamp(nz, minZ, MAXZ);
      const [wx, wy] = toWorld(px, py);
      view.z = nz;
      const K = k();
      view.x = wx - (px - W / 2) / K; view.y = wy - (py - H / 2) / K;
      clampView();
    }
    function fitBounds(x0, y0, x1, y1, maxZ = 15.2, pad = 56) {
      const dx = Math.max(x1 - x0, 1e-9), dy = Math.max(y1 - y0, 1e-9);
      const z = Math.log2(Math.min((W - pad * 2) / (dx * 256), (H - pad * 2) / (dy * 256)));
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: clamp(isFinite(z) ? z : maxZ, minZ, maxZ) };
    }
    function itemsView() {
      if (!items.length) return { x: mx(TEHRAN.lng), y: my(TEHRAN.lat), z: 11 };
      let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      for (const it of items) { x0 = Math.min(x0, it.x); x1 = Math.max(x1, it.x); y0 = Math.min(y0, it.y); y1 = Math.max(y1, it.y); }
      if (items.length === 1) return { x: x0, y: y0, z: 15 };
      return fitBounds(x0, y0, x1, y1, 15, Math.min(64, W / 6));
    }
    function setInitial() {
      if (opts.center) { view.x = mx(opts.center.lng); view.y = my(opts.center.lat); view.z = opts.zoom || 13; }
      else if (opts.view) { view.x = opts.view.x; view.y = opts.view.y; view.z = opts.view.z; }
      else Object.assign(view, itemsView());
      clampView();
    }

    /* ---------- animation ---------- */
    function schedule() { if (!raf && !destroyed) raf = requestAnimationFrame(frame); }
    function stopMotion() { anim = null; inertia = null; wheel = null; }
    function flyTo(target, dur) {
      stopMotion();
      const from = { x: view.x, y: view.y, z: view.z };
      const tz = clamp(target.z, minZ, MAXZ);
      const dz = Math.abs(tz - from.z);
      anim = { from, to: { x: target.x, y: target.y, z: tz }, t0: performance.now(), dur: dur || clamp(260 + dz * 110, 260, 1100), user: !!target.user };
      schedule();
    }
    function zoomBy(dz, px, py, user) {
      const tz = clamp(view.z + dz, minZ, MAXZ);
      if (px == null) { px = W / 2; py = H / 2; }
      const [wx, wy] = toWorld(px, py);
      const K2 = 256 * Math.pow(2, tz);
      flyTo({ x: wx - (px - W / 2) / K2, y: wy - (py - H / 2) / K2, z: tz, user });
    }
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function frame(now) {
      raf = 0;
      if (destroyed) return;
      let moving = false;
      if (anim) {
        const t = clamp((now - anim.t0) / anim.dur, 0, 1), e = ease(t);
        // interpolate in a zoom-aware way: scale-space lerp keeps the motion steady
        const z = anim.from.z + (anim.to.z - anim.from.z) * e;
        const s0 = Math.pow(2, anim.from.z), s1 = Math.pow(2, anim.to.z), s = Math.pow(2, z);
        const w = s1 === s0 ? e : (1 / s0 - 1 / s) / (1 / s0 - 1 / s1);
        view.z = z; view.x = anim.from.x + (anim.to.x - anim.from.x) * w; view.y = anim.from.y + (anim.to.y - anim.from.y) * w;
        clampView();
        if (t >= 1) { const u = anim.user; anim = null; moveEnd(u); } else moving = true;
      }
      if (inertia) {
        const dt = Math.min(40, now - inertia.t); inertia.t = now;
        const K = k();
        view.x -= inertia.vx * dt / K; view.y -= inertia.vy * dt / K; clampView();
        const f = Math.exp(-dt / 290); inertia.vx *= f; inertia.vy *= f;
        if (Math.hypot(inertia.vx, inertia.vy) < 0.02) { inertia = null; moveEnd(true); } else moving = true;
      }
      if (wheel) {
        const diff = wheel.z - view.z;
        if (Math.abs(diff) < 0.002) { zoomAround(wheel.z, wheel.px, wheel.py); wheel = null; moveEnd(true); }
        else { zoomAround(view.z + diff * 0.32, wheel.px, wheel.py); moving = true; }
      }
      draw();
      if (moving) schedule();
    }
    let moveTimer = 0;
    function moveEnd(user) {
      if (user) { movedSinceRedo = true; lastMoveUser = true; if (redoEl) redoEl.hidden = false; }
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => { if (!destroyed && opts.onMove) opts.onMove(api.getView(), user); }, 120);
    }

    /* ---------- drawing ---------- */
    let K = 1, OX = 0, OY = 0, VB = [0, 0, 0, 0];
    const sx = x => (x - OX) * K, sy = y => (y - OY) * K;
    function vis(bb, m = 0) { return !(bb[2] < VB[0] - m || bb[0] > VB[2] + m || bb[3] < VB[1] - m || bb[1] > VB[3] + m); }
    function trace(g, closed) {
      for (const r of g.rings) {
        ctx.moveTo((r[0] - OX) * K, (r[1] - OY) * K);
        for (let i = 2; i < r.length; i += 2) ctx.lineTo((r[i] - OX) * K, (r[i + 1] - OY) * K);
        if (closed) ctx.closePath();
      }
    }
    function fillGeoms(list, color, closed = true) {
      ctx.beginPath(); let any = false;
      for (const g of list) if (vis(g.bb)) { trace(g, closed); any = true; }
      if (any) { ctx.fillStyle = color; ctx.fill('evenodd'); }
    }
    function strokeGeoms(list, color, width, dash, closed = true) {
      ctx.beginPath(); let any = false;
      for (const g of list) if (vis(g.bb)) { trace(g, closed); any = true; }
      if (!any) return;
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
    }
    const tw = new Map();
    function textW(font, s) { const key = font + '|' + s; let w = tw.get(key); if (w == null) { ctx.font = font; w = ctx.measureText(s).width; tw.set(key, w); if (tw.size > 4000) tw.clear(); } return w; }
    let placed = [];
    function free(b) { for (const p of placed) if (!(b[2] < p[0] || b[0] > p[2] || b[3] < p[1] || b[1] > p[3])) return false; return true; }
    function label(s, px, py, o) {
      if (!s) return false;
      const size = o.size || 12, font = `${o.italic ? 'italic ' : ''}${o.weight || 500} ${size}px ${pal.font}`;
      const w = textW(font, s), h = size * 1.25;
      const offs = o.dot ? [[o.dot + 3, 0, 'left'], [-(o.dot + 3), 0, 'right'], [0, -(size * 0.9 + o.dot), 'center'], [0, size * 0.9 + o.dot, 'center']] : [[0, 0, 'center']];
      if (fa && o.dot) { const t0 = offs[0]; offs[0] = offs[1]; offs[1] = t0; }
      for (const [ox, oy, al] of offs) {
        const x0 = al === 'left' ? px + ox : al === 'right' ? px + ox - w : px - w / 2;
        const b = [x0 - 3, py + oy - h / 2 - 1, x0 + w + 3, py + oy + h / 2 + 1];
        if (b[0] < 2 || b[2] > W - 2 || b[1] < 2 || b[3] > H - 2) { if (!o.dot) return false; continue; }
        if (!free(b)) continue;
        placed.push(b);
        if (o.dot) { ctx.beginPath(); ctx.arc(px, py, o.dot, 0, Math.PI * 2); ctx.fillStyle = o.dotColor || pal['txt']; ctx.fill(); if (o.ring) { ctx.lineWidth = 1.5; ctx.strokeStyle = pal.halo; ctx.stroke(); } }
        ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.direction = fa ? 'rtl' : 'ltr';
        ctx.textAlign = fa ? 'right' : 'left';
        const tx = fa ? x0 + w : x0, ty = py + oy;
        ctx.lineJoin = 'round'; ctx.lineWidth = o.haloW || 3.2; ctx.strokeStyle = pal.halo; ctx.strokeText(s, tx, ty);
        ctx.fillStyle = o.color || pal.txt; ctx.fillText(s, tx, ty);
        return true;
      }
      return false;
    }
    const nm = o => (fa ? o.fa : o.en) || o.fa || o.en || '';
    function draw() {
      if (!W || !H) return;
      dirty = false;
      K = k(); OX = view.x - W / 2 / K; OY = view.y - H / 2 / K; VB = [OX, OY, OX + W / K, OY + H / K];
      const z = view.z;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.fillStyle = pal.water; ctx.fillRect(0, 0, W, H);
      const hi = z < 4.4 ? 0 : 1;
      // countries
      fillGeoms(d.countries.filter(c => c.id !== 'IRN').map(c => hi ? c.g1 : c.g0), pal['land-lo']);
      fillGeoms([hi ? d.iran.g1 : d.iran.g0], pal['land-hi']);
      if (z >= 4.3) fillGeoms(d.provinces.map(p => z < 7 ? p.g0 : p.g1), pal['land-hi']);
      if (z >= 4.3) fillGeoms(d.lakes.map(l => l.g), pal.water);
      if (z >= 6 && z < 10.2) fillGeoms(d.urban.map(u => u.g), pal.urban);
      if (z >= 8.4) { fillGeoms([d.city], pal.city); }
      if (z >= 5 && z < 12.5) {
        const rw = clamp((z - 4) * 0.28, 0.6, 1.8);
        strokeGeoms(d.rivers.filter(r => r.sr <= z + 1.5).map(r => r.g), pal.river, rw, null, false);
      }
      if (z >= 5.2 && z < 10.2) {
        strokeGeoms(d.roads.filter(r => r.kind === 1 && z >= 6.6 && r.sr <= z + 1).map(r => r.g), pal['road-2'], clamp((z - 5) * 0.35, 0.6, 1.6), null, false);
        strokeGeoms(d.roads.filter(r => r.kind === 0 && r.sr <= z + 2).map(r => r.g), pal.road, clamp((z - 4.5) * 0.45, 0.8, 2.4), null, false);
      }
      // borders
      strokeGeoms(d.countries.map(c => hi ? c.g1 : c.g0), pal.border, z < 3 ? 0.6 : z < 6 ? 0.9 : 1.2);
      if (z >= 4.3 && z < 12) strokeGeoms(d.provinces.map(p => z < 7 ? p.g0 : p.g1), pal['border-2'], z < 6 ? 0.7 : 1.1, z < 9 ? [3, 3] : [5, 4]);
      if (z >= 8.4) strokeGeoms([d.city], pal.district, z < 10 ? 1.2 : 1.8);
      // Tehran
      if (z >= 9.6) {
        if (hover && hover.kind !== 'country' && hover.kind !== 'province') fillGeoms([hover.g], pal.hl);
        if (highlight) { fillGeoms([highlight], pal.hl); strokeGeoms([highlight], pal['hl-line'], 2); }
        if (z >= 12.4) strokeGeoms(d.hoods.map(h => h.g), pal.hood, z < 13.5 ? 0.7 : 1, z < 14 ? [2, 3] : [3, 3]);
        strokeGeoms(d.districts.map(t => t.g), pal.district, z < 11 ? 1 : z < 13 ? 1.5 : 2);
        if (hover && hover.kind !== 'country' && hover.kind !== 'province') strokeGeoms([hover.g], pal['hl-line'], 1.8);
      } else if (hover) { fillGeoms([hover.g], pal.hl); strokeGeoms([hover.g], pal['hl-line'], 1.4); }
      // metro
      if (z >= 10.4) drawMetro(z);
      if (pick) drawPick();
      if (meLoc) {
        const [ex, ey] = toScreen(meLoc.x, meLoc.y);
        if (ex > -20 && ey > -20 && ex < W + 20 && ey < H + 20) {
          ctx.beginPath(); ctx.arc(ex, ey, 16, 0, Math.PI * 2); ctx.fillStyle = 'rgba(37, 120, 235, .16)'; ctx.fill();
          ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fillStyle = '#2578eb'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
        }
      }
      // labels
      const cl = computeClusters();
      placed = [];
      for (const c of cl) {
        let x = 0, y = 0; for (const it of c.m) { const s2 = toScreen(it.x, it.y); x += s2[0]; y += s2[1]; } x /= c.m.length; y /= c.m.length;
        if (c.m.length > 1) placed.push([x - 22, y - 22, x + 22, y + 22]);
        else if (opts.dots) placed.push([x - 8, y - 8, x + 8, y + 8]);
        else placed.push([x - 28, y - 34, x + 28, y + 2]);
      }
      drawLabels(z);
      updatePins(cl);
      updateScale();
    }
    function drawMetro(z) {
      const m = d.metro, lw = clamp((z - 9.4) * 0.9, 1.4, 4.2);
      const byLine = {};
      for (const [a, b, l] of m.edges) (byLine[l] = byLine[l] || []).push([a, b]);
      ctx.globalAlpha = z < 11.5 ? 0.75 : 0.95;
      for (const l of Object.keys(byLine)) {
        ctx.beginPath();
        for (const [a, b] of byLine[l]) { const A = m.stations[a], B = m.stations[b]; ctx.moveTo(sx(A.x), sy(A.y)); ctx.lineTo(sx(B.x), sy(B.y)); }
        ctx.strokeStyle = pal.halo; ctx.lineWidth = lw + 2; ctx.stroke();
        ctx.strokeStyle = m.colors[l] || '#888'; ctx.lineWidth = lw; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (z >= 12.2) {
        const r = clamp((z - 11) * 1.1, 2.2, 5);
        for (const s of m.stations) {
          const x = sx(s.x), y = sy(s.y);
          if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
          ctx.beginPath(); ctx.arc(x, y, s.lines.length > 1 ? r + 1.4 : r, 0, Math.PI * 2);
          ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = s.lines.length > 1 ? 2 : 1.6; ctx.strokeStyle = s.lines.length > 1 ? '#333' : (m.colors[s.lines[0]] || '#888'); ctx.stroke();
        }
      }
    }
    function drawPick() {
      // drawn as a DOM pin, see updatePins
    }
    function drawLabels(z) {
      const T2 = pal['txt-2'], T3 = pal['txt-3'];
      // landmarks first (small icons) at street level
      if (z >= 11.4) for (const l of d.landmarks) {
        if (z < l.minZ) continue;
        const x = sx(l.x), y = sy(l.y);
        if (x < -40 || y < -20 || x > W + 40 || y > H + 20) continue;
        label(nm(l), x, y, { size: 11.5, weight: 700, color: pal.primary, dot: 3.4, dotColor: pal.primary, ring: true });
      }
      if (z >= 12.2) for (const s of d.metro.stations) {
        if (z < (s.lines.length > 1 ? 13.4 : 14.2)) continue;
        const x = sx(s.x), y = sy(s.y);
        if (x < -40 || y < -20 || x > W + 40 || y > H + 20) continue;
        const tx = (fa ? s.fa : s.en);
        label(fa ? 'ایستگاه ' + tx : tx, x, y + 10, { size: 10.5, weight: 600, color: T2 });
      }
      // districts
      if (z >= 10 && z < 13.4) for (const t of d.districts) {
        const x = sx(t.lx), y = sy(t.ly);
        if (x < 0 || y < 0 || x > W || y > H) continue;
        label(fa ? 'منطقه ' + faDigits(t.n) : 'District ' + t.n, x, y, { size: z < 11 ? 11.5 : 13, weight: 800, color: pal.district });
      }
      // neighbourhoods
      if (z >= 12.6) {
        const mpp = 40075016.686 * Math.cos(latOf(view.y) * DEG) / K; // metres per pixel
        const list = d.hoods.filter(h => h.fa && vis(h.g.bb)).sort((a, b) => b.rad - a.rad);
        for (const h of list) {
          const rpx = h.rad / mpp;
          if (rpx < (z < 13.6 ? 34 : z < 14.6 ? 20 : 8)) continue;
          label(nm(h), sx(h.lx), sy(h.ly), { size: z < 14 ? 11.5 : 12.5, weight: 600, color: T2 });
        }
      }
      // seas
      for (const s of d.seas) if (z >= s.z0 && z < s.z1) label(nm(s), sx(s.x), sy(s.y), { size: 12.5 * s.k, weight: 600, italic: !fa, color: pal.sea });
      // countries
      if (z < 6.2) {
        const list = d.countries.filter(c => (c.id === 'IRN' ? z < 5.4 : z >= c.minL - 0.6 && z < 6.2)).sort((a, b) => (a.id === 'IRN' ? -1 : b.id === 'IRN' ? 1 : a.minL - b.minL));
        for (const c of list) label(nm(c), sx(c.lx), sy(c.ly), { size: c.id === 'IRN' ? 15 : clamp(10 + (z - c.minL) * 1.6, 10, 13.5), weight: c.id === 'IRN' ? 800 : 650, color: c.id === 'IRN' ? pal.txt : T3 });
      }
      // terrain
      for (const t of d.terrain) if (z >= t.z0 && z < t.z1) label(nm(t), sx(t.x), sy(t.y), { size: 11.5, weight: 600, italic: !fa, color: T3 });
      for (const p of d.peaks) if (z >= p.minZ && z < 13) {
        const x = sx(p.x), y = sy(p.y);
        if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
        ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); ctx.closePath(); ctx.fillStyle = T3; ctx.fill();
        placed.push([x - 6, y - 6, x + 6, y + 5]);
        label(nm(p), x, y + 13, { size: 11, weight: 600, color: T3 });
      }
      // provinces
      if (z >= 4.6 && z < 8.6) for (const p of d.provinces) {
        const x = sx(p.lx), y = sy(p.ly);
        if (x < 0 || y < 0 || x > W || y > H) continue;
        label(nm(p), x, y, { size: z < 6 ? 10.5 : 12, weight: 600, color: T3 });
      }
      // cities
      if (z >= 2.4 && z < 13) {
        const list = d.cities.filter(c => z >= cityZ(c) && !(c.en === 'Tehran' && z >= 10.2)).sort((a, b) => a.rank - b.rank || b.cap - a.cap);
        for (const c of list) {
          const x = sx(c.x), y = sy(c.y);
          if (x < -60 || y < -20 || x > W + 60 || y > H + 20) continue;
          const big = c.rank <= 1 || (c.en === 'Tehran');
          label(nm(c), x, y, { size: big ? 13.5 : c.rank <= 4 ? 12.5 : 11.5, weight: big ? 800 : c.rank <= 4 ? 700 : 600, color: pal.txt, dot: big ? 4 : c.cap ? 3.2 : 2.6, dotColor: c.cap === 2 ? pal.txt : T2, ring: true });
        }
      }
    }
    function cityZ(c) {
      const inIran = c.x > mx(44) && c.x < mx(63.4) && c.y > my(39.8) && c.y < my(25);
      if (inIran) return c.en === 'Tehran' ? 2.4 : c.rank <= 3 ? 4.2 : c.rank <= 4 ? 4.8 : c.rank <= 6 ? 5.6 : c.rank <= 7 ? 6.4 : c.rank <= 8 ? 7.1 : 7.8;
      return c.rank <= 1 ? 2.6 : c.rank <= 2 ? 3.3 : c.rank <= 3 ? 4.2 : c.rank <= 4 ? 5 : 6;
    }
    function updateScale() {
      if (!scaleEl) return;
      const mpp = 40075016.686 * Math.cos(latOf(view.y) * DEG) / K;
      const target = 90 * mpp; const p = Math.pow(10, Math.floor(Math.log10(target)));
      const step = [1, 2, 5, 10].map(s => s * p).filter(v => v <= target).pop() || p;
      const px = step / mpp;
      const txt = step >= 1000 ? `${fa ? faDigits(step / 1000) : step / 1000} ${T.km || 'km'}` : `${fa ? faDigits(step) : step} ${T.m || 'm'}`;
      scaleEl.firstElementChild.style.width = px.toFixed(0) + 'px';
      scaleEl.lastElementChild.textContent = txt;
    }

    /* ---------- pins & clusters ---------- */
    function computeClusters() {
      const R = opts.dots ? 0 : view.z >= 15.6 ? 0 : view.z >= 13.5 ? 30 : 44;
      const pts = items.map(it => { const [x, y] = toScreen(it.x, it.y); return { it, x, y }; });
      const out = [];
      const order = pts.slice().sort((a, b) => (b.it.rank || 0) - (a.it.rank || 0));
      for (const p of order) {
        let c = null;
        if (R) for (const q of out) if (Math.abs(q.x - p.x) < R && Math.abs(q.y - p.y) < R * 0.8) { c = q; break; }
        if (c) { c.m.push(p.it); } else out.push({ x: p.x, y: p.y, m: [p.it] });
      }
      return out;
    }
    function updatePins(cl) {
      cl = cl || computeClusters();
      const key = (pick ? 'p' : '') + cl.map(c => c.m.map(i => i.id).join('.')).join('|');
      if (key !== clusterKey) {
        clusterKey = key; clusters = cl;
        const html = [];
        cl.forEach((c, i) => {
          if (c.m.length === 1) {
            const it = c.m[0];
            const inner = opts.pinContent ? opts.pinContent(it) : '';
            html.push(isStatic ? `<span class="pin st${opts.dots ? ' dot' : ''}" aria-hidden="true">${opts.dots ? '' : inner}</span>`
              : `<button type="button" class="pin${it.id === active ? ' on' : ''}" data-pin="${it.id}" aria-label="${it.title || ''}">${inner}</button>`);
          } else {
            const n = fa ? faDigits(c.m.length) : c.m.length;
            html.push(isStatic ? `<span class="pin-cluster st" aria-hidden="true"><b>${n}</b></span>`
              : `<button type="button" class="pin-cluster${c.m.some(it => it.id === active) ? ' on' : ''}" data-cluster="${i}" aria-label="${(T.cluster || '{n}').replace('{n}', n)}"><b>${n}</b></button>`);
          }
        });
        if (pick) html.push(`<span class="pin pick" aria-hidden="true"><svg aria-hidden="true"><use href="#i-pin"/></svg></span>`);
        pinsEl.innerHTML = html.join('');
      }
      // position
      const nodes = pinsEl.children;
      let j = 0;
      for (const c of clusters) {
        const n = nodes[j++]; if (!n) break;
        let x = 0, y = 0;
        for (const it of c.m) { const s = toScreen(it.x, it.y); x += s[0]; y += s[1]; }
        x /= c.m.length; y /= c.m.length;
        n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        n.style.visibility = (x < -60 || y < -60 || x > W + 60 || y > H + 80) ? 'hidden' : '';
      }
      if (pick) { const n = nodes[j]; if (n) { const [x, y] = toScreen(pick.x, pick.y); n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; } }
    }
    function setActive(id) {
      active = id;
      pinsEl.querySelectorAll('[data-pin]').forEach(p => p.classList.toggle('on', p.dataset.pin === String(id)));
      clusterKey = ''; dirty = true; schedule();
    }

    /* ---------- interaction ---------- */
    const ptrs = new Map();
    let drag = null, pinch = null, lastTap = null, twoTap = null, rightDown = 0, lastType = 'mouse';
    function local(e) { const r = vp.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function onDown(e) {
      if (e.target.closest('.pin[data-pin], .pin-cluster')) return;
      if (e.button === 2) {
        const now = performance.now();
        if (now - rightDown < 380) { const [px, py] = local(e); dblState = null; zoomBy(-1.5, px, py, true); rightDown = 0; }
        else rightDown = now;
        return;
      }
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      lastType = e.pointerType || 'mouse';
      stopMotion(); wheel = null;
      vp.focus({ preventScroll: true });
      const [px, py] = local(e);
      ptrs.set(e.pointerId, { x: px, y: py, t: performance.now(), type: e.pointerType });
      try { vp.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (ptrs.size === 1) {
        drag = { x: px, y: py, vx0: view.x, vy0: view.y, moved: false, t: performance.now(), samples: [[performance.now(), px, py]] };
        pinch = null;
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: view.z, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, wx: toWorld((a.x + b.x) / 2, (a.y + b.y) / 2), t: performance.now(), moved: false };
        drag = null; dblState = null;
      }
    }
    function onMoveP(e) {
      const [px, py] = local(e);
      if (!ptrs.has(e.pointerId)) { if (e.pointerType === 'mouse' && !e.buttons) hoverAt(px, py, e); return; }
      const p = ptrs.get(e.pointerId); p.x = px; p.y = py;
      if (pinch && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const dd = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        if (Math.abs(dd - pinch.d) > 6 || Math.hypot(cx - pinch.cx, cy - pinch.cy) > 6) pinch.moved = true;
        view.z = clamp(pinch.z + Math.log2(dd / pinch.d), minZ, MAXZ);
        const KK = k();
        view.x = pinch.wx[0] - (cx - W / 2) / KK; view.y = pinch.wx[1] - (cy - H / 2) / KK;
        clampView(); hideTip(); draw();
        return;
      }
      if (!drag) return;
      const dx = px - drag.x, dy = py - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; el.classList.add('dragging'); hideTip(); closePopupOnDrag(); }
      if (drag.moved) {
        const KK = k();
        view.x = drag.vx0 - dx / KK; view.y = drag.vy0 - dy / KK; clampView();
        const now = performance.now(); drag.samples.push([now, px, py]); if (drag.samples.length > 6) drag.samples.shift();
        draw();
      }
    }
    function onUp(e) {
      if (!ptrs.has(e.pointerId)) return;
      const p = ptrs.get(e.pointerId);
      ptrs.delete(e.pointerId);
      const [px, py] = local(e);
      if (pinch) {
        if (ptrs.size < 2) {
          const quick = performance.now() - pinch.t < 260 && !pinch.moved;
          pinch = null;
          if (quick && ptrs.size === 0) { dblState = null; zoomBy(-1, px, py, true); twoTap = performance.now(); return; }
          if (ptrs.size === 1) { const [q] = [...ptrs.values()]; drag = { x: q.x, y: q.y, vx0: view.x, vy0: view.y, moved: true, t: performance.now(), samples: [[performance.now(), q.x, q.y]] }; }
          moveEnd(true);
        }
        return;
      }
      if (!drag) return;
      el.classList.remove('dragging');
      const d0 = drag; drag = null;
      if (d0.moved) {
        const s = d0.samples, now = performance.now();
        const first = s.find(q => now - q[0] < 90) || s[s.length - 1], last = s[s.length - 1];
        const dt = Math.max(1, last[0] - first[0]);
        const vx = (last[1] - first[1]) / dt, vy = (last[2] - first[2]) / dt;
        if (now - last[0] < 60 && Math.hypot(vx, vy) > 0.3) { inertia = { vx: vx, vy: vy, t: now }; schedule(); }
        else moveEnd(true);
        return;
      }
      // a tap
      if (twoTap && performance.now() - twoTap < 400) return;
      if (p.type === 'touch') {
        const now = performance.now();
        if (lastTap && now - lastTap.t < 320 && Math.hypot(px - lastTap.x, py - lastTap.y) < 30) { lastTap = null; onDouble(px, py, false); return; }
        lastTap = { t: now, x: px, y: py };
      }
      onTap(px, py);
    }
    function onTap(px, py) {
      if (opts.onPick) {
        const [wx, wy] = toWorld(px, py);
        pick = { x: wx, y: wy }; clusterKey = ''; draw();
        const lat = latOf(wy), lng = lngOf(wx);
        opts.onPick(lat, lng, whereIs(lat, lng));
        return;
      }
      if (opts.onBlank) opts.onBlank();
      if (active != null) setActive(null);
      // touch: show the area name under the finger
      const f = featureAt(px, py);
      if (f) { showTip(f, px, py); clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2200); }
    }
    function onDouble(px, py, out) {
      if (out || dblState) { const back = dblState && Math.abs(view.z - dblState.z) < 0.05 ? dblState.from : view.z - 2; dblState = null; zoomBy(back - view.z, px, py, true); }
      else { const from = view.z, to = clamp(view.z + 2, minZ, MAXZ); dblState = { from, z: to }; zoomBy(to - view.z, px, py, true); }
    }
    function onWheel(e) {
      if (opts.cooperative && !(e.ctrlKey || e.metaKey)) { showToast(T.coop || ''); return; }
      e.preventDefault();
      dblState = null; hideTip();
      const [px, py] = local(e);
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 32; else if (e.deltaMode === 2) dy *= H;
      const dz = -dy * (e.ctrlKey ? 0.012 : 0.0024);
      const base = wheel ? wheel.z : view.z;
      wheel = { z: clamp(base + clamp(dz, -1.2, 1.2), minZ, MAXZ), px, py };
      anim = null; inertia = null;
      schedule();
    }
    function onDbl(e) {
      if (e.target.closest('.pin[data-pin], .pin-cluster, .fm-ctrl')) return;
      e.preventDefault();
      if (lastType === 'touch') return;
      const [px, py] = local(e);
      onDouble(px, py, e.shiftKey);
    }
    function onKey(e) {
      const step = 90, KK = k();
      let handled = true;
      if (e.key === 'ArrowLeft') flyTo({ x: view.x - step / KK, y: view.y, z: view.z, user: true }, 200);
      else if (e.key === 'ArrowRight') flyTo({ x: view.x + step / KK, y: view.y, z: view.z, user: true }, 200);
      else if (e.key === 'ArrowUp') flyTo({ x: view.x, y: view.y - step / KK, z: view.z, user: true }, 200);
      else if (e.key === 'ArrowDown') flyTo({ x: view.x, y: view.y + step / KK, z: view.z, user: true }, 200);
      else if (e.key === '+' || e.key === '=') { dblState = null; zoomBy(1, null, null, true); }
      else if (e.key === '-' || e.key === '_') { dblState = null; zoomBy(-1, null, null, true); }
      else handled = false;
      if (handled) e.preventDefault();
    }
    /* hover: highlight the area under the mouse and name it */
    let hoverRaf = 0, tipTimer = 0;
    function featureAt(px, py) {
      const [wx, wy] = toWorld(px, py), z = view.z;
      if (z >= 9.6) {
        if (z >= 12.4) { const h = d.hoods.find(n => pip(n.g, wx, wy)); if (h) return { kind: 'hood', g: h.g, o: h }; }
        const t = d.districts.find(n => pip(n.g, wx, wy)); if (t) return { kind: 'district', g: t.g, o: t };
      }
      if (z >= 4.3) { const p = d.provinces.find(n => pip(z < 7 ? n.g0 : n.g1, wx, wy)); if (p) return { kind: 'province', g: z < 7 ? p.g0 : p.g1, o: p }; }
      if (z < 9.6) { const c = d.countries.find(n => pip(z < 4.4 ? n.g0 : n.g1, wx, wy)); if (c) return { kind: 'country', g: z < 4.4 ? c.g0 : c.g1, o: c }; }
      return null;
    }
    function tipText(f) {
      const o = f.o;
      if (f.kind === 'hood') return `${nm(o) || (fa ? 'محله' : 'Area')}<small>${fa ? 'منطقه ' + faDigits(o.d) : 'District ' + o.d}${countIn(f.g)}</small>`;
      if (f.kind === 'district') return `${fa ? 'منطقه ' + faDigits(o.n) : 'District ' + o.n}<small>${fa ? 'تهران' : 'Tehran'}${countIn(f.g)}</small>`;
      if (f.kind === 'province') return `${fa ? 'استان ' : ''}${nm(o)}${fa ? '' : ' Province'}${countIn(f.g, true)}`;
      return `${nm(o)}`;
    }
    function countIn(g, wrap) {
      let n = 0; for (const it of items) if (pip(g, it.x, it.y)) n++;
      if (!n || !T.places) return '';
      const s = T.places.replace('{n}', fa ? faDigits(n) : n);
      return wrap ? `<small>${s}</small>` : ' · ' + s;
    }
    function showTip(f, px, py) {
      tipEl.innerHTML = tipText(f); tipEl.hidden = false;
      const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      tipEl.style.transform = `translate(${clamp(px - w / 2, 6, W - w - 6)}px, ${clamp(py - h - 14, 6, H - h - 6)}px)`;
    }
    function hideTip() { tipEl.hidden = true; if (hover) { hover = null; draw(); } }
    function hoverAt(px, py, e) {
      if (isStatic || opts.onPick) return;
      hoverPt = [px, py];
      if (hoverRaf) return;
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;
        if (!hoverPt || drag || pinch || anim || wheel || inertia) return;
        if (e.target && e.target.closest && e.target.closest('.pin, .pin-cluster')) { if (hover) { hover = null; draw(); } tipEl.hidden = true; return; }
        const f = featureAt(hoverPt[0], hoverPt[1]);
        const changed = (f && f.g) !== (hover && hover.g);
        hover = f; if (changed) draw();
        if (f) showTip(f, hoverPt[0], hoverPt[1]); else tipEl.hidden = true;
      });
    }
    function showToast(msg) {
      if (!toastEl || !msg) return;
      toastEl.textContent = msg; toastEl.hidden = false;
      clearTimeout(showToast.t); showToast.t = setTimeout(() => { toastEl.hidden = true; }, 1600);
    }
    function closePopupOnDrag() { if (opts.onDragStart) opts.onDragStart(); }

    if (!isStatic) {
      vp.addEventListener('pointerdown', onDown);
      vp.addEventListener('pointermove', onMoveP);
      vp.addEventListener('pointerup', onUp);
      vp.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pinch = null; el.classList.remove('dragging'); });
      vp.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !ptrs.size) { hoverPt = null; hideTip(); } });
      vp.addEventListener('wheel', onWheel, { passive: false });
      vp.addEventListener('dblclick', onDbl);
      vp.addEventListener('contextmenu', e => { if (!e.target.closest('.pin, .pin-cluster')) e.preventDefault(); });
      vp.addEventListener('keydown', onKey);
      pinsEl.addEventListener('click', e => {
        const c = e.target.closest('.pin-cluster');
        if (c) {
          const cl = clusters[Number(c.dataset.cluster)];
          if (cl) {
            let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
            for (const it of cl.m) { x0 = Math.min(x0, it.x); x1 = Math.max(x1, it.x); y0 = Math.min(y0, it.y); y1 = Math.max(y1, it.y); }
            const v = fitBounds(x0, y0, x1, y1, 16.4, 70);
            dblState = null; flyTo({ ...v, z: Math.max(v.z, view.z + 1.2), user: true });
          }
          return;
        }
        const p = e.target.closest('.pin[data-pin]');
        if (!p) return;
        const it = items.find(i => String(i.id) === p.dataset.pin);
        if (!it) return;
        setActive(it.id);
        if (opts.onPin) opts.onPin(it.id);
      });
      el.querySelectorAll('[data-fz]').forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.fz; dblState = null;
        if (a === 'in') zoomBy(1, null, null, true);
        else if (a === 'out') zoomBy(-1, null, null, true);
        else if (a === 'fit') flyTo({ ...itemsView(), user: true });
        else if (a === 'me') opts.onLocate();
        else if (a === 'world') flyTo({ x: mx(52), y: my(30), z: Math.max(minZ, 2.2), user: true });
      }));
      if (redoEl) redoEl.addEventListener('click', () => { redoEl.hidden = true; movedSinceRedo = false; opts.onRedo(api.getBounds()); });
    }

    /* ---------- sizing / theme ---------- */
    function resize() {
      const nW = vp.clientWidth, nH = vp.clientHeight;
      if (!nW || !nH) return;
      const first = !W;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      W = nW; H = nH;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      computeMinZ();
      if (first) setInitial(); else clampView();
      clusterKey = ''; draw();
    }
    const ro = new ResizeObserver(resize); ro.observe(vp);
    const mo = new MutationObserver(() => { pal = palette(el); tw.clear(); draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onScheme = () => { pal = palette(el); draw(); };
    if (mq && mq.addEventListener) mq.addEventListener('change', onScheme);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!destroyed) { tw.clear(); pal = palette(el); draw(); } });
    resize();

    const api = {
      setItems, setActive,
      setPick(lat, lng) { pick = { x: mx(lng), y: my(lat) }; clusterKey = ''; draw(); },
      clearPick() { pick = null; clusterKey = ''; draw(); },
      setMe(lat, lng) { meLoc = isFinite(lat) ? { x: mx(lng), y: my(lat) } : null; draw(); },
      centerOn(lat, lng, z, animate) { const t = { x: mx(lng), y: my(lat), z: z || view.z }; if (animate === false || !W) { Object.assign(view, t); clampView(); draw(); } else flyTo(t); },
      fitItems(animate) { const v = itemsView(); if (animate) flyTo(v); else { Object.assign(view, v); clampView(); draw(); } },
      getView() { return { x: view.x, y: view.y, z: view.z, lat: latOf(view.y), lng: lngOf(view.x) }; },
      getBounds() { const K2 = k(); return { w: lngOf(view.x - W / 2 / K2), e: lngOf(view.x + W / 2 / K2), n: latOf(view.y - H / 2 / K2), s: latOf(view.y + H / 2 / K2) }; },
      hideRedo() { if (redoEl) redoEl.hidden = true; },
      redraw() { pal = palette(el); draw(); },
      zoomIn() { zoomBy(1, null, null, true); }, zoomOut() { zoomBy(-1, null, null, true); },
      destroy() { destroyed = true; ro.disconnect(); mo.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener('change', onScheme); if (raf) cancelAnimationFrame(raf); clearTimeout(moveTimer); },
      _view: view
    };
    el._fmap = api;
    return api;
  }

  window.FD_MAP = { create, whereIs, hoodShape, mx, my, latOf, lngOf, TEHRAN };
})();
