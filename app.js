/* Farshid demo: router, views and interactions. */
(function () {
  'use strict';
  const I18N = window.FD_I18N, D = window.FD_DATA, ART = window.FD_ART;
  const STORE_KEY = 'farshid-demo-store', PREF_KEY = 'farshid-prefs';
  const DAY = 86400000;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= Preferences & store ================= */
  let prefs = { lang: 'fa', theme: null };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { /* storage unavailable */ }
  const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } };
  let lang = prefs.lang === 'en' ? 'en' : 'fa';

  const freshSeed = () => JSON.parse(JSON.stringify(D.seed));
  let db = null;
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) db = JSON.parse(raw); } catch (e) { db = null; }
  if (!db || db.v !== D.seed.v) db = freshSeed();
  let warnedStorage = false;
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
    catch (e) { if (!warnedStorage) { warnedStorage = true; toast(t('storage.full'), 'info'); } }
  }

  /* ================= UI state ================= */
  const freshQuery = () => ({ text: '', where: '', cat: 'all', price: [], minRating: 0, open: false, verified: false, isNew: false, amen: [], sort: 'rec', area: null, dist: 0, offer: false, book: false });
  const S = {
    route: '', prevRoute: '', q: freshQuery(), mobileMap: false, menuOpen: false,
    afterLogin: null, intent: null,
    login: { step: 'phone', phone: '', err: '', until: 0 },
    bizTab: 'overview', revFilter: 0, revSort: 'new', writeOpen: false, draft: { rating: 0, text: '', photos: [] },
    wiz: null, ownFilter: 'all', editReply: null, openDetail: null, catEdit: null, userQ: '',
    lb: null, modalOk: null, book: null, busyDay: null, fq: null
  };
  let maps = [], charts = {}, loginTimer = null, wizMap = null, resultsMap = null;

  /* ================= i18n & formatting ================= */
  function t(key, vars) {
    let v = I18N[lang][key];
    if (v === undefined) v = I18N.fa[key];
    if (v === undefined) return key;
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
    return v;
  }
  const L = o => (o == null ? '' : typeof o === 'string' ? o : (o[lang] || o.fa || o.en || ''));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nfCache = {};
  const N = (n, o = {}) => { const k = lang + JSON.stringify(o); if (!nfCache[k]) nfCache[k] = new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US', o); return nfCache[k].format(n); };
  const R1 = r => N(r, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const digits = s => (lang === 'fa' ? String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(s));
  const toAscii = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const fmtTime = s => digits(s);
  const pct = () => (lang === 'fa' ? '٪' : '%');
  const toman = n => (n === 0 ? t('biz.free') : `${N(n)} <small>${t('biz.toman')}</small>`);
  function relTime(ts) {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    const s = (ts - Date.now()) / 1000, a = Math.abs(s);
    if (a < 3600) return rtf.format(Math.round(s / 60) || -1, 'minute');
    if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
    if (a < 86400 * 365) return rtf.format(Math.round(s / 86400 / 30), 'month');
    return rtf.format(Math.round(s / 86400 / 365), 'year');
  }
  const fmtDate = (ts, o = { year: 'numeric', month: 'long', day: 'numeric' }) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', o).format(new Date(ts));
  const tDate = off => D.tDate(off);
  const dowOf = ds => new Date(ds + 'T12:00:00Z').getUTCDay();
  const fmtDay = (ds, o = { weekday: 'long', day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', Object.assign({ timeZone: 'UTC' }, o)).format(new Date(ds + 'T12:00:00Z'));
  const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const AMEN = ['wifi', 'parking', 'card', 'outdoor', 'wheelchair', 'reserve', 'delivery', 'kids', 'ac', 'appoint'];
  const AMEN_IC = { wifi: 'wifi', parking: 'parking', card: 'card', outdoor: 'tree', wheelchair: 'wheelchair', reserve: 'calendar', delivery: 'truck', kids: 'kids', ac: 'snow', appoint: 'clock' };
  const extraCount = q => q.price.length + (q.minRating ? 1 : 0) + (q.amen || []).length + (q.open ? 1 : 0) + (q.verified ? 1 : 0) + (q.isNew ? 1 : 0) + (q.dist ? 1 : 0) + (q.offer ? 1 : 0) + (q.book ? 1 : 0);
  const norm = s => String(s || '').toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[‌ً-ْ]/g, ' ').replace(/é/g, 'e');


  /* ================= Smart search, location, offers ================= */
  const INTENT = {
    best: ['بهترین', 'برترین', 'best', 'top', 'highest', 'top-rated'],
    cheap: ['ارزان', 'ارزون', 'اقتصادی', 'cheap', 'budget', 'affordable', 'inexpensive'],
    open: ['باز', 'open'],
    near: ['نزدیک', 'نزدیکم', 'نزدیکی', 'near', 'nearby', 'nearest', 'closest'],
    stop: ['در', 'توی', 'تو', 'من', 'های', 'ها', 'یه', 'یک', 'با', 'و', 'برای', 'کجا', 'خوب', 'عالی', 'محبوب', 'الان', 'همین', 'محله', 'منطقه', 'تهران',
      'in', 'me', 'my', 'the', 'a', 'an', 'of', 'around', 'area', 'for', 'with', 'and', 'good', 'great', 'popular', 'now', 'rated', 'places', 'place', 'tehran', 'to', 'at']
  };
  function parseQuery(text) {
    let str = ' ' + norm(text).replace(/[،,.?!؟]/g, ' ') + ' ';
    const out = { hood: null, best: false, cheap: false, open: false, near: false, toks: [] };
    const names = [];
    Object.entries(D.hoods).forEach(([id, h]) => [h.fa, h.en].forEach(n => { const k = norm(n).trim(); if (k) names.push([id, k]); }));
    names.sort((a, b) => b[1].length - a[1].length);
    for (const [id, k] of names) { if (str.includes(' ' + k + ' ')) { out.hood = out.hood || id; str = str.replace(' ' + k + ' ', ' '); } }
    for (const w of str.split(/\s+/).filter(Boolean)) {
      if (INTENT.best.includes(w)) out.best = true;
      else if (INTENT.cheap.includes(w)) out.cheap = true;
      else if (INTENT.open.includes(w)) out.open = true;
      else if (INTENT.near.includes(w)) out.near = true;
      else if (!INTENT.stop.includes(w) && w.length > 1) out.toks.push(w);
    }
    return out;
  }
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let v = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const nv = [i]; let rowMin = i;
      for (let j = 1; j <= b.length; j++) { nv[j] = Math.min(v[j] + 1, nv[j - 1] + 1, v[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (nv[j] < rowMin) rowMin = nv[j]; }
      if (rowMin > max) return max + 1;
      v = nv;
    }
    return v[b.length];
  }
  const fuzzyHit = (tk, words) => { if (tk.length < 4) return false; const max = tk.length >= 7 ? 2 : 1; return words.some(w => w.length > 2 && Math.abs(w.length - tk.length) <= max && lev(tk, w, max) <= max); };
  const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function hlText(text, toks) {
    const safe = esc(text);
    const list = (toks || []).filter(x => x.length > 1 && !/^(amp|lt|gt|quot|mark|#\d+)$/.test(x));
    if (!list.length) return safe;
    const re = new RegExp('(' + list.map(reEsc).join('|') + ')', 'gi');
    return safe.split(/(&[#\w]+;)/).map(part => (part.startsWith('&') && part.endsWith(';')) ? part : part.replace(re, '<mark>$1</mark>')).join('');
  }
  const inTehran = (lat, lng) => lat > 35.5 && lat < 35.92 && lng > 51.05 && lng < 51.72;
  const locLabel = () => !prefs.loc ? '' : prefs.loc.src === 'gps' ? t('loc.here') : L(hood(prefs.loc.hood));
  const distOf = b => (prefs.loc && b && isFinite(b.lat) ? kmBetween(prefs.loc, b) : null);
  const fmtKm = km => km == null ? '' : km < 1 ? t('dist.m', { n: N(Math.max(50, Math.round(km * 20) * 50)) }) : t('dist.km', { n: N(km, { maximumFractionDigits: 1 }) });
  function locModal(msg) {
    return `${modalHead(t('loc.title'))}${msg ? `<p class="note" style="margin-top:0">${ic('info')}<span>${esc(msg)}</span></p>` : ''}
      <button type="button" class="btn btn-secondary btn-block" data-action="loc-gps">${ic('locate')}${t('loc.useGps')}</button>
      <p class="muted" style="font-size:.9rem">${t('loc.pick')}</p>
      <div class="loc-grid">${Object.entries(D.hoods).map(([id, h]) => `<button type="button" class="chip" data-action="loc-hood" data-hood="${id}" aria-pressed="${!!(prefs.loc && prefs.loc.hood === id)}">${ic('pin')}${esc(L(h))}</button>`).join('')}</div>
      ${prefs.loc ? `<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="loc-clear">${ic('x')}${t('loc.clear')}</button></div>` : ''}`;
  }
  function useLocation(loc) {
    prefs.loc = loc; savePrefs();
    toast(t('loc.set', { p: locLabel() }), 'pin');
    const after = S.locAfter; S.locAfter = null;
    closeModal();
    if (after) after(); else rerender();
  }
  function askLocation(after, gpsFirst) {
    S.locAfter = after || null;
    if (!gpsFirst) { openModal(locModal(''), 'loc-modal'); return; }
    if (!navigator.geolocation) { openModal(locModal(t('loc.unsupported')), 'loc-modal'); return; }
    toast(t('loc.finding'), 'pin');
    navigator.geolocation.getCurrentPosition(p => {
      const { latitude: lat, longitude: lng } = p.coords;
      if (inTehran(lat, lng)) useLocation({ lat: +lat.toFixed(5), lng: +lng.toFixed(5), src: 'gps' });
      else openModal(locModal(t('loc.outside')), 'loc-modal');
    }, () => openModal(locModal(t('loc.denied')), 'loc-modal'), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  }
  const offerOf = b => (b && (db.offers || []).find(o => o.bizId === b.id && o.until > Date.now())) || null;
  const offerBadge = b => { const o = offerOf(b); return o ? `<span class="badge badge-accent">${ic('tag')}${t('offer.badge', { n: N(o.pct) })}</span>` : ''; };

  /* ================= Small components ================= */
  const ic = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  let starId = 0;
  function stars(r, size = 14) {
    const id = 'stc' + (++starId);
    const w = clamp(r, 0, 5) / 5 * 100;
    const row = [0, 1, 2, 3, 4].map(i => `<use href="#i-star" x="${i * 20}" width="20" height="20"/>`).join('');
    return `<span class="stars" role="img" aria-label="${R1(r)} / ${N(5)}"><svg width="${size * 5}" height="${size}" viewBox="0 0 100 20"><defs><clipPath id="${id}"><rect width="${w}" height="20"/></clipPath></defs><g class="s-bg">${row}</g><g class="s-fg" clip-path="url(#${id})">${row}</g></svg></span>`;
  }
  const verifiedMark = () => `<span class="verified" title="${t('biz.verified')}"><svg aria-label="${t('biz.verified')}" role="img"><use href="#i-verified"/></svg></span>`;
  function initials(name) {
    const p = String(name).trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    const a = p[0][0], b = p.length > 1 ? p[p.length - 1][0] : '';
    return lang === 'fa' || /[؀-ۿ]/.test(a) ? a + (b ? '‌' + b : '') : (a + b).toUpperCase();
  }
  const avatar = (u, size = 36) => `<span class="av av-${(u && u.color || 0) % 8}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .38)}px" aria-hidden="true">${esc(initials(L(u && u.name) || '?'))}</span>`;
  function photo(ph, cls = '', extra = '') {
    const p = ph || { kind: 'art', cat: 'shop', seed: 0, crop: 0 };
    const inner = p.kind === 'img' ? `<img src="${p.src}" alt="" loading="lazy">` : ART.scene(p.cat, p.seed, p.crop, p.scene);
    return `<div class="ph ${cls}">${inner}${extra}</div>`;
  }
  const priceHTML = p => `<span class="price" title="${t('price.' + p)}">${'$'.repeat(p)}<span class="off">${'$'.repeat(4 - p)}</span></span>`;
  const dot = '<span class="dot" aria-hidden="true"></span>';
  function emptyState(icon, title, body, action = '') {
    return `<div class="empty"><div class="em-ic">${ic(icon)}</div><h3>${title}</h3>${body ? `<p>${body}</p>` : ''}${action}</div>`;
  }

  /* ================= Domain helpers ================= */
  const me = () => (db.session ? db.users.find(u => u.id === db.session) : null);
  const hasRole = (u, role) => !!u && (u.role === 'admin' || u.role === role || role === 'user');
  const liveBiz = () => db.businesses.filter(b => b.status === 'live');
  const bizById = k => db.businesses.find(b => b.id === Number(k) || (b.slug && b.slug === k));
  const href = b => '#biz-' + (b && (b.slug || b.id));
  const catById = id => db.cats.find(c => c.id === id) || { id, fa: id, en: id, icon: 'tag', kw: '' };
  const hood = id => D.hoods[id] || { fa: id, en: id, lat: 35.715, lng: 51.39 };
  const userById = id => db.users.find(u => u.id === id) || { id, name: { fa: 'کاربر', en: 'User' }, color: 0 };
  const bizCount = b => Math.max(0, b.count + b.adj.n);
  const bizRating = b => { const n = bizCount(b); return n ? (b.rating * b.count + b.adj.sum) / n : 0; };
  const planOf = b => { const sub = b && db.subs && db.subs[b.id]; return sub && sub.until > Date.now() ? sub.plan : 'free'; };
  const rankScore = b => bizRating(b) * 2 + Math.log10(bizCount(b) + 1) + (b.verified ? .3 : 0);
  const isFav = id => !!db.session && db.favorites.some(f => f.userId === db.session && f.bizId === id);
  const bizReviews = b => db.reviews.filter(r => r.bizId === b.id);
  const allPhotos = b => b.photos.concat(...bizReviews(b).map(r => r.photos));
  const userReviewCount = u => db.reviews.filter(r => r.userId === u.id).length + (/^u\d+$/.test(u.id) ? Number(u.id.slice(1)) * 2 + 3 : 0);
  function dist(r) {
    if (!r) return [0, 0, 0, 0, 0];
    const w = [1, 2, 3, 4, 5].map(s => Math.exp(-Math.pow(s - (r + .35), 2) / .9));
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map(x => Math.round(x / sum * 100));
  }

  function tehranNow() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = k => (parts.find(p => p.type === k) || {}).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: (Number(g('hour')) % 24) * 60 + Number(g('minute')) };
  }
  const toMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
  function openStatus(b) {
    const h = b.hours, off = h.off || [];
    const { day, min } = tehranNow();
    const o = toMin(h.o), c = toMin(h.c);
    if (o === 0 && c >= 1440) return { cls: 'open', text: t('status.24'), open: true };
    const cross = c <= o;
    let closeAt = null;
    if (!cross) { if (!off.includes(day) && min >= o && min < c) closeAt = c; }
    else if (!off.includes(day) && min >= o) closeAt = c + 1440;
    else if (!off.includes((day + 6) % 7) && min < c) closeAt = c;
    if (closeAt !== null) {
      return closeAt - min <= 60 ? { cls: 'soon', text: t('status.soon', { t: fmtTime(h.c) }), open: true } : { cls: 'open', text: t('status.open', { t: fmtTime(h.c) }), open: true };
    }
    if (!off.includes(day) && min < o) return { cls: 'closed', text: t('status.closed', { t: fmtTime(h.o) }), open: false };
    for (let k = 1; k <= 7; k++) {
      const d = (day + k) % 7;
      if (!off.includes(d)) return { cls: 'closed', text: k === 1 ? t('status.closedTomorrow', { t: fmtTime(h.o) }) : t('status.closed', { t: `${t('days')[d]} ${fmtTime(h.o)}` }), open: false };
    }
    return { cls: 'closed', text: t('biz.closed'), open: false };
  }
  const statusHTML = b => { const s = openStatus(b); return `<span class="status ${s.cls}">${s.text}</span>`; };
  function ratingRow(b, showCount = true) {
    const n = bizCount(b);
    if (!n) return `<div class="rating-row"><span class="badge badge-primary">${t('biz.new')}</span><span>${t('biz.noReviews')}</span></div>`;
    return `<div class="rating-row">${stars(bizRating(b))}<span class="rating-num">${R1(bizRating(b))}</span>${showCount ? `<span>(${N(n)})</span>` : ''}</div>`;
  }
  function favBtn(b) {
    const on = isFav(b.id);
    return `<button type="button" class="icon-btn fav ${on ? 'on' : ''}" data-action="fav" data-id="${b.id}" aria-pressed="${on}" aria-label="${t(on ? 'biz.saved' : 'biz.save')}">${ic('heart')}</button>`;
  }
  function cardHTML(b, opt = {}) {
    const c = catById(b.cat), h = hood(b.hood);
    const name = esc(L(b.name)) || '—';
    return `<article class="card">
      ${photo(b.photos[0], '', `${opt.preview ? '' : favBtn(b)}${b.isNew ? `<span class="ph-new">${t('biz.newOpen')}</span>` : offerOf(b) ? `<span class="ph-new ph-offer">${ic('tag')}${t('offer.badge', { n: N(offerOf(b).pct) })}</span>` : ''}<span class="ph-badge">${statusHTML(b)}</span>`)}
      <div class="card-body">
        <h3>${opt.preview ? `<span>${name}</span>` : `<a class="card-link" href="${href(b)}">${name}</a>`}${b.verified ? verifiedMark() : ''}</h3>
        ${ratingRow(b)}
        <div class="meta-row"><span>${esc(L(c))}</span>${dot}<span>${esc(L(h))}</span>${dot}${priceHTML(b.price)}${opt.dist && distOf(b) != null ? `${dot}<span class="dist">${ic('route')}${fmtKm(distOf(b))}</span>` : ''}</div>
        ${opt.ad ? `<span class="ad-label in-card">${ic('info')}${t('ad.label')}</span>` : ''}
        ${b.tags && L(b.tags).length ? `<div class="tags">${L(b.tags).slice(0, 3).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
      </div></article>`;
  }

  /* ================= Toast, modal, lightbox ================= */
  function toast(msg, icon = 'check') {
    const host = $('#toastHost');
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = ic(icon) + `<span>${esc(msg)}</span>`;
    host.appendChild(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 2800);
  }
  let lastFocus = null;
  function openModal(inner, cls = '') {
    lastFocus = document.activeElement;
    $('#modalRoot').innerHTML = `<div class="modal-back" data-modal-back><div class="modal ${cls}" role="dialog" aria-modal="true">${inner}</div></div>`;
    const m = $('#modalRoot .modal');
    const f = m.querySelector('[autofocus]') || m.querySelector('input, textarea, select, button');
    if (f) f.focus();
  }
  function closeModal() {
    if (S.modalMap) { S.modalMap.destroy(); maps = maps.filter(x => x !== S.modalMap); S.modalMap = null; }
    if (S.coTimer) { clearTimeout(S.coTimer); S.coTimer = null; }
    $('#modalRoot').innerHTML = '';
    S.lb = null; S.modalOk = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  const modalHead = title => `<div class="modal-head"><h2>${title}</h2><button type="button" class="icon-btn" data-action="modal-close" aria-label="${t('common.close')}">${ic('x')}</button></div>`;
  function confirmBox(text, okLabel, danger, onOk) {
    S.modalOk = onOk;
    openModal(`${modalHead(t('common.confirm'))}<p class="muted">${esc(text)}</p><div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="modal-close">${t('common.cancel')}</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="modal-ok" autofocus>${okLabel}</button></div>`);
  }
  function openLightbox(list, i) {
    if (!list.length) return;
    lastFocus = document.activeElement;
    S.lb = { list, i: clamp(i, 0, list.length - 1) };
    drawLightbox();
  }
  function drawLightbox() {
    const { list, i } = S.lb;
    $('#modalRoot').innerHTML = `<div class="lightbox" role="dialog" aria-modal="true" aria-label="${t('biz.tab.photos')}">
      <div class="lb-top"><span class="tnum">${N(i + 1)} / ${N(list.length)}</span><button type="button" data-action="lb-close" aria-label="${t('common.close')}">${ic('x')}</button></div>
      <div class="lb-stage"><button type="button" class="lb-nav" data-action="lb-step" data-d="-1" aria-label="${t('common.prev')}">${ic('chev-l', 'flip-rtl')}</button>
        <figure class="lb-fig">${photo(list[i])}</figure>
        <button type="button" class="lb-nav" data-action="lb-step" data-d="1" aria-label="${t('common.next')}">${ic('chev-r', 'flip-rtl')}</button></div>
      <div class="lb-strip">${list.map((p, k) => `<button type="button" class="${k === i ? 'on' : ''}" data-action="lb-go" data-i="${k}" aria-label="${N(k + 1)}">${photo(p)}</button>`).join('')}</div>
    </div>`;
    const cur = $('#modalRoot .lb-strip .on');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    const close = $('#modalRoot [data-action="lb-close"]');
    if (close) close.focus();
  }
  async function copyText(v) {
    try { await navigator.clipboard.writeText(v); return true; }
    catch (e) {
      try { const ta = document.createElement('textarea'); ta.value = v; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); return true; }
      catch (_) { return false; }
    }
  }
  function readImages(fileList, limit) {
    const files = Array.from(fileList || []).filter(f => /^image\//.test(f.type)).slice(0, limit);
    return Promise.all(files.map(f => new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, 1100 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          try { res(c.toDataURL('image/jpeg', .8)); } catch (e) { res(fr.result); }
        };
        img.onerror = () => res(null);
        img.src = fr.result;
      };
      fr.onerror = () => res(null);
      fr.readAsDataURL(f);
    }))).then(a => a.filter(Boolean).map(src => ({ kind: 'img', src })));
  }

  /* ================= Map ================= */
  const MAPS = window.FD_MAP;
  const mapText = () => ({ me: t('loc.btn'), label: t('map.label'), zoomIn: t('map.in'), zoomOut: t('map.out'), fit: t('map.fit'), world: t('map.world'), redo: t('map.redo'), km: t('map.km'), m: t('map.m'), cluster: t('map.cluster'), places: t('map.places'), coop: t('map.coop') });
  const pinItem = b => ({ id: b.id, lat: b.lat, lng: b.lng, title: L(b.name), rank: rankScore(b) });
  const pinContent = it => { const b = bizById(it.id); return b ? `<svg aria-hidden="true"><use href="#i-star"/></svg>${bizCount(b) ? R1(bizRating(b)) : t('biz.new')}` : ''; };
  function popHTML(b) {
    return `<div class="pop-card">${photo(b.photos[0])}<div style="min-width:0"><h4>${esc(L(b.name))}</h4>${ratingRow(b)}<div class="meta-row">${esc(L(catById(b.cat)))}${dot}${statusHTML(b)}</div></div>
      <div class="pop-actions"><button type="button" class="icon-btn" data-close-pop aria-label="${t('map.close')}">${ic('x')}</button><a class="btn btn-primary btn-sm" href="${href(b)}">${t('map.view')}</a></div></div>`;
  }
  function mountMap(el, items, opts = {}) {
    let pop = null;
    const showPop = id => { const b = bizById(id); if (b && pop) { pop.innerHTML = popHTML(b); pop.hidden = false; } };
    const hidePop = () => { if (pop) pop.hidden = true; };
    const m = MAPS.create(el, {
      lang, text: mapText(), items: items.map(pinItem), pinContent,
      center: opts.center, zoom: opts.zoom, view: opts.view, static: opts.static, dots: opts.dots, highlight: opts.highlight,
      controls: opts.controls, hint: opts.hint, cooperative: opts.cooperative, pick: opts.pick, onPick: opts.onPick,
      onRedo: opts.onRedo, onMove: opts.onMove, me: prefs.loc,
      onLocate: opts.static ? null : () => askLocation(() => { if (prefs.loc) { m.setMe(prefs.loc.lat, prefs.loc.lng); m.centerOn(prefs.loc.lat, prefs.loc.lng, 14.6); } }, true),
      onPin: id => { if (opts.onPin) opts.onPin(id); if (opts.popup !== false) showPop(id); },
      onBlank: () => hidePop()
    });
    el.classList.toggle('pick', !!opts.onPick);
    if (!opts.static && opts.popup !== false) {
      el.insertAdjacentHTML('beforeend', '<div class="map-pop" hidden></div>');
      pop = el.lastElementChild;
      pop.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
      pop.addEventListener('click', e => { if (e.target.closest('[data-close-pop]')) { hidePop(); m.setActive(null); } });
    }
    const api = Object.assign({}, m, { showPop, hidePop });
    maps.push(api);
    return api;
  }
  function mountStaticMaps() {
    $$('[data-smap]').forEach(el => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';
      const items = (el.dataset.ids || '').split(',').filter(Boolean).map(x => bizById(Number(x))).filter(Boolean);
      const center = { lat: Number(el.dataset.lat), lng: Number(el.dataset.lng) };
      mountMap(el, items, { static: true, center, zoom: Number(el.dataset.z) || 13, dots: el.dataset.dots === '1', highlight: el.dataset.hl === '1' ? center : null, popup: false });
    });
  }
  const kmBetween = (a, b) => { const R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r; const q = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(q)); };
  function placeLine(p) {
    if (!p || !isFinite(p.lat)) return '';
    const w = MAPS.whereIs(p.lat, p.lng), bits = [];
    if (w.hood) bits.push(L(w.hood));
    if (w.district) bits.push(t('map.district', { n: N(w.district) }));
    else if (w.province) bits.push(t('map.province', { p: L(w.province) }));
    return bits.join(' · ');
  }
  const directionsUrl = (b, app) => app === 'waze' ? `https://www.waze.com/ul?ll=${b.lat},${b.lng}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;

  /* ================= Charts ================= */
  function niceMax(m) { if (m <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))); return [1, 2, 2.5, 5, 10].find(s => s * p >= m) * p; }
  function areaChart(vals, labels, fmtTip) {
    const W = 640, H = 230, pl = 44, pr = 18, pt = 20, pb = 30, n = vals.length;
    const max = niceMax(Math.max(...vals) * 1.08);
    const x = i => pl + (W - pl - pr) * i / (n - 1), y = v => pt + (H - pt - pb) * (1 - v / max);
    const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
    const grid = [0, 1, 2, 3, 4].map(k => { const v = max * k / 4; return `<line class="ch-grid" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-axis" x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${N(v)}</text>`; }).join('');
    const xl = vals.map((_, i) => ((n - 1 - i) % 7 === 0) ? `<text class="ch-axis" x="${x(i)}" y="${H - 8}" text-anchor="${i === n - 1 ? 'end' : 'middle'}">${labels[i]}</text>` : '').join('');
    const last = n - 1;
    const id = 'ch' + Math.random().toString(36).slice(2, 8);
    charts[id] = { vals, labels, x, y, W, fmtTip, n };
    return `<div class="chart-wrap" data-chart="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('own.chartT')}">${grid}
      <path class="ch-area" d="${line}L${x(last)} ${H - pb}L${x(0)} ${H - pb}Z"/><path class="ch-line" d="${line}"/>${xl}
      <line class="ch-guide" x1="${x(last)}" x2="${x(last)}" y1="${pt}" y2="${H - pb}" style="display:none"/>
      <circle class="ch-dot" r="5" cx="${x(last)}" cy="${y(vals[last])}"/>
      <text class="ch-end" x="${x(last) - 8}" y="${y(vals[last]) - 12}" text-anchor="end">${N(vals[last])}</text>
      <rect class="ch-hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent"/></svg><div class="ch-tip" hidden></div></div>`;
  }
  function bindCharts() {
    $$('.chart-wrap[data-chart]').forEach(w => {
      const c = charts[w.dataset.chart];
      if (!c) return;
      const svg = $('svg', w), guide = $('.ch-guide', w), dotEl = $('.ch-dot', w), tip = $('.ch-tip', w), end = $('.ch-end', w);
      const move = e => {
        const r = svg.getBoundingClientRect();
        const sx = (e.clientX - r.left) / r.width * c.W;
        let best = 0, bd = Infinity;
        for (let i = 0; i < c.n; i++) { const d = Math.abs(c.x(i) - sx); if (d < bd) { bd = d; best = i; } }
        const px = c.x(best), py = c.y(c.vals[best]);
        guide.setAttribute('x1', px); guide.setAttribute('x2', px); guide.style.display = '';
        dotEl.setAttribute('cx', px); dotEl.setAttribute('cy', py); end.style.display = 'none';
        tip.hidden = false;
        tip.innerHTML = `${c.fmtTip(c.vals[best])}<span>${c.labels[best]}</span>`;
        tip.style.left = (px / c.W * r.width) + 'px'; tip.style.top = (py / 230 * r.height) + 'px';
      };
      const leave = () => {
        guide.style.display = 'none'; tip.hidden = true; end.style.display = '';
        dotEl.setAttribute('cx', c.x(c.n - 1)); dotEl.setAttribute('cy', c.y(c.vals[c.n - 1]));
      };
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerleave', leave);
    });
  }
  function barChart(vals, labels, highlightLast) {
    const W = 640, H = 220, pl = 12, pr = 12, pt = 24, pb = 30, n = vals.length;
    const max = niceMax(Math.max(...vals) * 1.1), bw = (W - pl - pr) / n;
    const y = v => pt + (H - pt - pb) * (1 - v / max);
    return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('adm.chartT')}">
      <line class="ch-grid" x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}"/>
      ${vals.map((v, i) => { const x = pl + i * bw + bw * .18, w = bw * .64; return `<rect class="ch-bar ${highlightLast && i === n - 1 ? 'last' : ''}" x="${x}" y="${y(v)}" width="${w}" height="${H - pb - y(v)}" rx="5"/><text class="ch-val" x="${x + w / 2}" y="${y(v) - 7}" text-anchor="middle">${N(v)}</text><text class="ch-axis" x="${x + w / 2}" y="${H - 9}" text-anchor="middle">${labels[i]}</text>`; }).join('')}
    </svg></div>`;
  }
  function rng(seed) { let s = seed | 0; return () => { s = (s + 0x6D2B79F5) | 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function analytics(b) {
    const r = rng(b.id * 977 + 13), vals = [];
    const mult = 0.6 + bizCount(b) / 300;
    for (let i = 0; i < 60; i++) {
      const d = new Date(Date.now() - (59 - i) * DAY).getDay();
      const wk = (d === 4 || d === 5) ? 1.3 : 1;
      vals.push(Math.round((52 + i * .75 + r() * 24) * wk * mult));
    }
    const cur = vals.slice(30), prev = vals.slice(0, 30);
    const sum = a => a.reduce((s, v) => s + v, 0);
    const labels = cur.map((_, i) => fmtDate(Date.now() - (29 - i) * DAY, { day: 'numeric', month: 'short' }));
    return {
      cur, labels,
      views: [sum(cur), sum(prev)],
      calls: [Math.round(sum(cur) * .061), Math.round(sum(prev) * .058)],
      dirs: [Math.round(sum(cur) * .108), Math.round(sum(prev) * .113)]
    };
  }
  function delta(a, b) {
    if (!b) return '';
    const p = (a - b) / b * 100;
    const cls = p > .5 ? 'up' : p < -.5 ? 'down' : 'flat';
    return `<span class="td ${cls}">${p > 0 ? '+' : ''}${N(p, { maximumFractionDigits: 1 })}${pct()} ${t('own.vsPrev')}</span>`;
  }

  /* ================= Search form & suggestions ================= */
  function searchForm(variant) {
    return `<form class="search ${variant}" data-form="search" role="search" autocomplete="off">
      <label class="search-field"><span class="sr-only">${t('search.whatShort')}</span>${ic('search')}<input id="sq-${variant}" name="q" value="${esc(S.q.text)}" placeholder="${esc(variant === 'compact' ? t('search.whatShort') : t('search.what'))}" data-suggest="q"></label>
      <span class="search-div" aria-hidden="true"></span>
      <label class="search-field"><span class="sr-only">${t('search.where')}</span>${ic('pin')}<input id="sw-${variant}" name="where" value="${esc(S.q.where)}" placeholder="${esc(t('search.where'))}" data-suggest="where"></label>
      <button class="btn btn-primary" type="submit" aria-label="${t('search.go')}">${ic('search')}<span>${t('search.go')}</span></button>
      <div class="suggest" hidden></div></form>`;
  }
  function showSuggest(input) {
    const form = input.closest('form'), box = $('.suggest', form);
    const kind = input.dataset.suggest, q = norm(input.value).trim();
    let html = '';
    if (kind === 'q') {
      if ((!q || q === norm(S.q.text).trim()) && (db.recentQ || []).length) html += `<h6 class="sg-h">${t('suggest.recent')}<button type="button" class="link-btn" data-action="sg-clear-recent">${t('suggest.clear')}</button></h6>` + db.recentQ.map(x => `<button type="button" class="sg-item" data-action="sg-recent" data-q="${esc(x)}"><span class="sg-ic">${ic('clock')}</span><span>${esc(x)}</span></button>`).join('');
      const cats = db.cats.filter(c => !q || norm(c.fa + ' ' + c.en + ' ' + (c.kw || '')).includes(q)).slice(0, q ? 3 : 8);
      const places = q ? liveBiz().filter(b => norm(b.name.fa + ' ' + b.name.en + ' ' + b.tags.fa.join(' ') + ' ' + b.tags.en.join(' ')).includes(q)).slice(0, 5) : [];
      if (cats.length) html += `<h6>${t('suggest.cats')}</h6>` + cats.map(c => `<button type="button" class="sg-item" data-action="sg-cat" data-cat="${c.id}"><span class="sg-ic">${ic(c.icon)}</span><span>${esc(L(c))}<small>${t('home.catCount', { n: N(liveBiz().filter(b => b.cat === c.id).length) })}</small></span></button>`).join('');
      if (places.length) html += `<h6>${t('suggest.places')}</h6>` + places.map(b => `<button type="button" class="sg-item" data-action="sg-biz" data-id="${b.id}"><span class="sg-ic">${ART.scene(b.cat, b.photos[0].seed || b.id, 0, b.scene)}</span><span>${esc(L(b.name))}<small>${esc(L(catById(b.cat)))} · ${esc(L(hood(b.hood)))}</small></span></button>`).join('');
      if (q) html += `<button type="button" class="sg-item" data-action="sg-search"><span class="sg-ic">${ic('search')}</span><span>${t('suggest.searchFor', { q: esc(input.value.trim()) })}</span></button>`;
    } else {
      const hs = Object.entries(D.hoods).filter(([, h]) => !q || norm(h.fa + ' ' + h.en).includes(q));
      html += `<button type="button" class="sg-item sg-near" data-action="sg-near"><span class="sg-ic">${ic('locate')}</span><span>${t('loc.nearMe')}<small>${prefs.loc ? esc(locLabel()) : t('loc.nearSub')}</small></span></button>`;
      html += `<h6>${t('suggest.hoods')}</h6><button type="button" class="sg-item" data-action="sg-hood" data-hood=""><span class="sg-ic">${ic('globe')}</span><span>${t('suggest.anywhere')}</span></button>` +
        hs.map(([id, h]) => `<button type="button" class="sg-item" data-action="sg-hood" data-hood="${id}"><span class="sg-ic">${ic('pin')}</span><span>${esc(L(h))}<small>${t('home.catCount', { n: N(liveBiz().filter(b => b.hood === id).length) })}</small></span></button>`).join('');
    }
    box.innerHTML = html;
    box.hidden = !html;
  }
  function hideSuggest() { $$('.suggest').forEach(s => { s.hidden = true; }); }
  function runSearch(form) {
    S.q.text = form.q.value.trim();
    S.q.where = form.where.value.trim();
    S.q.cat = 'all';
    if (S.q.text) { db.recentQ = [S.q.text].concat((db.recentQ || []).filter(x => x !== S.q.text)).slice(0, 6); save(); }
    hideSuggest();
    go('search');
  }
  function searchResults(q = S.q) {
    const pq = parseQuery(q.text);
    if (q === S.q) S.lastParse = pq;
    const toks = pq.toks;
    const wtoks = norm(q.where).split(/[\s،,]+/).filter(x => x.length > 1 && x !== 'تهران' && x !== 'tehran');
    let list = liveBiz().map(b => {
      const c = catById(b.cat), h = hood(b.hood);
      const txt = norm([b.name.fa, b.name.en, c.fa, c.en, c.kw, h.fa, h.en, b.tags.fa.join(' '), b.tags.en.join(' '), b.about.fa, b.about.en, b.menu.map(m => m.n.fa + ' ' + m.n.en).join(' ')].join(' '));
      const words = txt.split(/\s+/);
      return { b, hit: toks.reduce((n, tk) => n + (txt.includes(tk) ? 1 : fuzzyHit(tk, words) ? 0.6 : 0), 0) };
    });
    if (toks.length) list = list.filter(x => x.hit > 0);
    if (pq.hood && !wtoks.length) list = list.filter(({ b }) => b.hood === pq.hood);
    if (pq.cheap && !q.price.length) list = list.filter(({ b }) => b.price <= 2);
    if (pq.open && !q.open) list = list.filter(({ b }) => openStatus(b).open);
    if (wtoks.length) list = list.filter(({ b }) => { const h = hood(b.hood); const wt = norm([h.fa, h.en, b.addr.fa, b.addr.en].join(' ')); return wtoks.some(w => wt.includes(w)); });
    if (q.cat !== 'all') list = list.filter(({ b }) => b.cat === q.cat);
    if (q.price.length) list = list.filter(({ b }) => q.price.includes(b.price));
    if (q.minRating) list = list.filter(({ b }) => bizRating(b) >= q.minRating);
    if (q.open) list = list.filter(({ b }) => openStatus(b).open);
    if (q.verified) list = list.filter(({ b }) => b.verified);
    if (q.isNew) list = list.filter(({ b }) => b.isNew);
    if (q.amen && q.amen.length) list = list.filter(({ b }) => q.amen.every(a => b.amen.includes(a)));
    if (q.area) list = list.filter(({ b }) => b.lat <= q.area.n && b.lat >= q.area.s && b.lng >= q.area.w && b.lng <= q.area.e);
    if (q.dist && prefs.loc) list = list.filter(({ b }) => distOf(b) <= q.dist);
    if (q.offer) list = list.filter(({ b }) => offerOf(b));
    if (q.book) list = list.filter(({ b }) => bookKind(b));
    const score = ({ b, hit }) => hit * 10 + rankScore(b);
    const sorters = {
      rec: (a, b) => score(b) - score(a),
      rating: (a, b) => bizRating(b.b) - bizRating(a.b),
      reviews: (a, b) => bizCount(b.b) - bizCount(a.b),
      name: (a, b) => L(a.b.name).localeCompare(L(b.b.name), lang),
      near: (a, b) => (distOf(a.b) ?? 99) - (distOf(b.b) ?? 99),
      new: (a, b) => (b.b.isNew ? 1 : 0) - (a.b.isNew ? 1 : 0) || b.b.id - a.b.id
    };
    let sk = q.sort;
    if (sk === 'rec' && pq.best) sk = 'rating';
    if (sk === 'rec' && pq.near && prefs.loc) sk = 'near';
    if (sk === 'near' && !prefs.loc) sk = 'rec';
    list.sort(sorters[sk] || sorters.rec);
    return list.map(x => x.b);
  }


  /* ================= Notifications ================= */
  function notifs() {
    const u = me(); if (!u) return [];
    const out = [], add = (ts, icn, text, link) => out.push({ ts, ic: icn, text, href: link });
    db.reviews.filter(r => r.userId === u.id && r.reply).forEach(r => { const b = bizById(r.bizId); if (b) add(r.replyTs || r.ts + 6 * 3600e3, 'store', t('nt.reply', { b: esc(L(b.name)) }), href(b)); });
    db.qa.filter(x => x.userId === u.id && x.a).forEach(x => { const b = bizById(x.bizId); if (b) add(x.aTs || x.ts + 3 * 3600e3, 'help', t('nt.answer', { b: esc(L(b.name)) }), href(b)); });
    db.bookings.filter(x => x.userId === u.id && x.status === 'confirmed' && x.date >= tDate(0)).forEach(x => { const b = bizById(x.bizId); if (b) add(x.ts || Date.now() - 3 * 3600e3, 'calendar', t('nt.booking', { b: esc(L(b.name)), d: fmtDay(x.date), tm: digits(x.time) }), '#me-bookings'); });
    db.pending.filter(p => p.submittedBy === u.id).forEach(p => add(p.decidedTs || p.ts, p.status === 'approved' ? 'check' : p.status === 'rejected' ? 'x' : 'clock', t('nt.listing.' + p.status, { b: esc(L(p.name)) }), '#me-listings'));
    (db.favorites || []).forEach(id => { const b = bizById(id), o = offerOf(b); if (o) add(o.until - 14 * DAY, 'tag', t('nt.offer', { b: esc(L(b.name)), n: N(o.pct) }), href(b)); });
    if (hasRole(u, 'owner')) {
      const b = ownerBiz();
      if (b) {
        db.reviews.filter(r => r.bizId === b.id && r.userId !== u.id).sort((x, y) => y.ts - x.ts).slice(0, 4).forEach(r => { const ru = userById(r.userId); add(r.ts, 'star', t('nt.newReview', { u: esc(L(ru.name)), n: N(r.rating), b: esc(L(b.name)) }), '#owner-reviews'); });
        db.qa.filter(x => x.bizId === b.id && !x.a).forEach(x => add(x.ts, 'help', t('nt.newQ', { q: esc(L(x.q)) }), '#owner-qa'));
        const nb = db.bookings.filter(x => x.bizId === b.id && x.date === tDate(0) && x.status === 'confirmed').length;
        if (nb) add(Date.now() - 2 * 3600e3, 'calendar', t('own.insBook', { n: N(nb) }), '#owner-bookings');
      }
    }
    if (u.role === 'admin') {
      const np = db.pending.filter(p => p.status === 'pending').length, nr = db.reports.filter(r => r.status === 'open').length;
      if (np) add(Math.max(...db.pending.filter(p => p.status === 'pending').map(p => p.ts)), 'inbox', t('nt.pending', { n: N(np) }), '#admin-approvals');
      if (nr) add(Math.max(...db.reports.filter(r => r.status === 'open').map(r => r.ts)), 'flag', t('nt.reports', { n: N(nr) }), '#admin-reports');
    }
    return out.sort((a, b) => b.ts - a.ts).slice(0, 12);
  }
  function notifHTML(u) {
    const list = notifs(), seen = (db.notifSeen || {})[u.id] || 0, unread = list.filter(n => n.ts > seen).length;
    return `<div class="notif-menu"><button type="button" class="icon-btn notif-btn" data-action="notif" aria-expanded="${!!S.notifOpen}" aria-haspopup="true" aria-label="${t('nt.title')}${unread ? ' (' + N(unread) + ')' : ''}">${ic('bell')}${unread ? `<span class="nb">${N(unread)}</span>` : ''}</button>
      ${S.notifOpen ? `<div class="dropdown notif-dd" role="menu"><div class="nd-head"><b>${t('nt.title')}</b>${unread ? `<button type="button" class="link-btn" data-action="notif-read">${t('nt.readAll')}</button>` : ''}</div>
        ${list.length ? list.map(n => `<a href="${n.href}" role="menuitem" class="nd-item ${n.ts > seen ? 'unread' : ''}" data-action="notif-go" data-ts="${n.ts}"><span class="nd-ic">${ic(n.ic)}</span><span class="nd-body"><span>${n.text}</span><small>${relTime(n.ts)}</small></span></a>`).join('') : `<p class="nd-empty">${t('nt.empty')}</p>`}</div>` : ''}</div>`;
  }

  /* ================= Header & footer ================= */
  const isDark = () => prefs.theme ? prefs.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  function renderHeader() {
    const u = me(), onHome = S.route === 'home';
    $('#siteHeader').innerHTML = `<div class="wrap header-row">
      <a class="brand" href="#home" aria-label="Farshid"><svg aria-hidden="true"><use href="#i-logo"/></svg><span>Farshid</span></a>
      <div class="header-search">${onHome ? '' : searchForm('compact')}</div>
      <div class="header-actions">
        ${onHome ? '' : `<a class="icon-btn show-sm" href="#search" aria-label="${t('nav.searchBtn')}">${ic('search')}</a>`}
        <button type="button" class="hdr-link hide-md ${onHome ? '' : 'hide-lg'}" data-action="write-any">${ic('edit')}${t('nav.write')}</button>
        <a class="hdr-link hide-md" href="#for-business">${t('nav.forBiz')}</a>
        <button type="button" class="lang-btn" data-action="lang" lang="${lang === 'fa' ? 'en' : 'fa'}">${lang === 'fa' ? 'English' : 'فارسی'}</button>
        <button type="button" class="icon-btn theme-btn" data-action="theme" aria-label="${t('nav.theme')}">${ic(isDark() ? 'sun' : 'moon')}</button>
        ${u ? notifHTML(u) : ''}
        ${u ? `<div class="user-menu"><button type="button" class="avatar-btn" data-action="menu" aria-expanded="${S.menuOpen}" aria-haspopup="true">${avatar(u, 32)}<span class="nm">${esc(L(u.name))}</span>${ic('chev-d')}</button>
          ${S.menuOpen ? `<div class="dropdown" role="menu"><div class="dd-head"><b>${esc(L(u.name))}</b><span>${t('role.' + u.role)} · <span dir="ltr">${digits(u.phone)}</span></span></div>
            <a href="#me" role="menuitem">${ic('user')}${t('menu.me')}</a>
            ${hasRole(u, 'owner') ? `<a href="#owner" role="menuitem">${ic('store')}${t('menu.owner')}</a>` : ''}
            ${u.role === 'admin' ? `<a href="#admin" role="menuitem">${ic('shield')}${t('menu.admin')}</a>` : ''}
            <a href="#add-business" role="menuitem">${ic('plus')}${t('nav.addBiz')}</a>
            <button type="button" role="menuitem" data-action="logout">${ic('logout')}${t('menu.logout')}</button></div>` : ''}</div>`
          : `<a class="btn btn-primary btn-sm" href="#login">${t('nav.login')}</a>`}
      </div></div>`;
  }
  function renderFooter() {
    const cats = db.cats.slice(0, 4);
    $('#siteFooter').innerHTML = `<div class="wrap"><div class="foot-top">
      <div class="foot-brand"><a class="brand" href="#home"><svg aria-hidden="true"><use href="#i-logo"/></svg><span>Farshid</span></a><p>${t('footer.about')}</p></div>
      <div class="foot-col"><h4><a href="#search">${t('footer.explore')}</a></h4><ul>${cats.map(c => `<li><a href="#search-${c.id}">${esc(L(c))}</a></li>`).join('')}<li><a href="#list-top-rated">${t('list.topT')}</a></li></ul></div>
      <div class="foot-col"><h4><a href="#for-business">${t('footer.business')}</a></h4><ul><li><a href="#add-business">${t('nav.addBiz')}</a></li><li><a href="#owner">${t('footer.dash')}</a></li><li><a href="#for-business">${t('footer.plans')}</a></li></ul></div>
      <div class="foot-col"><h4><a href="#about">${t('footer.company')}</a></h4><ul><li><a href="#about">${t('footer.about2')}</a></li><li><a href="#contact">${t('footer.contact')}</a></li><li><a href="#privacy">${t('footer.privacy')}</a></li></ul></div>
    </div><div class="foot-bottom"><span>${t('footer.note', { y: digits(new Date().getFullYear()) })}</span>
      <span class="prefs"><button type="button" class="lang-btn" data-action="theme">${ic(isDark() ? 'sun' : 'moon')} ${t(isDark() ? 'foot.light' : 'foot.dark')}</button><button type="button" class="lang-btn" data-action="lang">${lang === 'fa' ? 'English' : 'فارسی'}</button></span></div></div>`;
  }

  /* ================= Views ================= */
  function viewHome() {
    const live = liveBiz();
    const ranked = live.slice().sort((a, b) => rankScore(b) - rankScore(a));
    const totalReviews = live.reduce((s, b) => s + bizCount(b), 0);
    const avg = live.reduce((s, b) => s + bizRating(b) * bizCount(b), 0) / Math.max(1, totalReviews);
    const openCount = live.filter(b => openStatus(b).open).length;
    const feat = (bizById(2) && bizById(2).status === 'live') ? bizById(2) : ranked[0];
    const bubble = db.reviews.filter(r => r.rating === 5 && (!feat || r.bizId !== feat.id) && (bizById(r.bizId) || {}).status === 'live').sort((x, y) => y.ts - x.ts)[0];
    const hoodCounts = Object.entries(D.hoods).map(([id, h]) => ({ id, h, items: live.filter(b => b.hood === id) })).filter(x => x.items.length).sort((x, y) => y.items.length - x.items.length);
    const recent = db.reviews.filter(r => (bizById(r.bizId) || {}).status === 'live').sort((x, y) => y.ts - x.ts).slice(0, 6);
    const viewed = (db.recent || []).map(bizById).filter(b => b && b.status === 'live').slice(0, 6);
    const ownerB = bizById(2) || live[0];
    const an = ownerB ? analytics(ownerB) : null;
    const week = an ? an.cur.slice(-7) : [];
    const mapItems = live;
    const spark = vals => { const mx = Math.max(...vals) * 1.1, mn = Math.min(...vals) * .8; const x = i => i / (vals.length - 1) * 300, y = v => 110 - (v - mn) / (mx - mn) * 100; const l = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(''); return `<svg class="md-spark" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true"><path class="ch-area" d="${l}L300 120L0 120Z"/><path class="ch-line" d="${l}"/></svg>`; };
    const bu = bubble ? userById(bubble.userId) : null, bb = bubble ? bizById(bubble.bizId) : null;
    return `
    <section class="hero"><div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="eyebrow">${ic('pin')}${t('home.eyebrow')}</span>
        <h1><em>${t('home.titleEm')}</em>${t('home.titleRest')}</h1>
        <p class="hero-sub">${t('home.sub')}</p>
        ${searchForm('big')}
        <div class="popular"><span>${t('search.popular')}</span>${t('search.popularList').map(p => `<button type="button" class="chip" data-action="quick-search" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
        <a class="open-now" href="#search" data-action="open-now"><i aria-hidden="true"></i>${t('home.openNow', { n: N(openCount) })}</a>
      </div>
      ${feat ? `<div class="hero-visual">
        <a class="hv-main" href="${href(feat)}" aria-label="${esc(L(feat.name))}">${photo(feat.photos[0])}<span class="hv-status">${statusHTML(feat)}</span>
          <span class="hv-cap"><b>${esc(L(feat.name))}${feat.verified ? verifiedMark() : ''}</b><span>${stars(bizRating(feat), 13)}<b class="rating-num">${R1(bizRating(feat))}</b><span>· ${esc(L(catById(feat.cat)))} · ${esc(L(hood(feat.hood)))}</span></span></span></a>
        <a class="hv-map" href="#search" data-action="see-all" aria-label="${t('results.map')}"><span class="hv-map-el" data-smap data-lat="35.752" data-lng="51.405" data-z="11.7" data-ids="${mapItems.map(b => b.id).join(',')}"></span><span class="hv-map-cap">${ic('map')}${t('home.hvMap', { n: N(live.length) })}</span></a>
        ${bubble && bb ? `<a class="hv-review" href="${href(bb)}"><span class="who">${avatar(bu, 30)}<span><b>${esc(L(bu.name))}</b>${stars(5, 11)}</span></span><span class="q">${esc(L(bubble.text))}</span><span class="on">${ic('pin')}${esc(L(bb.name))}</span></a>` : ''}
        ${(() => { const bk = live.find(x => bookKind(x) === 'reserve') || feat; return `<a class="hv-book" href="${href(bk)}" data-action="book-jump" data-id="${bk.id}"><span class="hb-ic">${ic('check')}</span><span><b>${t('home.hvBooked')}</b><small>${t('home.hvBookedSub')}</small></span></a>`; })()}
      </div>` : ''}
    </div></section>

    ${viewed.length ? `<section class="section" style="padding-block:6px 0"><div class="wrap"><h2 class="sub-h">${t('home.recentViewed')}</h2><div class="recent-row">${viewed.map(b => `<a class="rc" href="${href(b)}">${photo(b.photos[0])}<span style="min-width:0"><b>${esc(L(b.name))}</b><small>${bizCount(b) ? `${R1(bizRating(b))} ★ · ` : ''}${esc(L(hood(b.hood)))}</small></span></a>`).join('')}</div></div></section>` : ''}

    <section class="section" style="padding-top:20px"><div class="wrap"><div class="stats-row">
      <a class="stat" href="#search" data-action="see-all"><b>${N(live.length)}</b><span>${t('home.stat.biz')}</span></a>
      <a class="stat" href="#search" data-action="sort-reviews"><b>${N(totalReviews)}</b><span>${t('home.stat.reviews')}</span></a>
      <a class="stat" href="#home" data-action="scroll-to" data-to="hoodSec"><b>${N(hoodCounts.length)}</b><span>${t('home.stat.hoods')}</span></a>
      <a class="stat" href="#list-top-rated"><b>${R1(avg)}</b><span>${t('home.stat.avg')}</span></a>
    </div></div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><h2>${t('home.cats')}</h2><p>${t('home.catsSub')}</p></div></div>
      <div class="cat-grid">${db.cats.map(c => `<a class="cat-tile" href="#search-${c.id}"><span class="ci">${ic(c.icon)}</span><span><b>${esc(L(c))}</b><span>${t('home.catCount', { n: N(live.filter(b => b.cat === c.id).length) })}</span></span></a>`).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><h2>${t('home.lists')}</h2><p>${t('home.listsSub')}</p></div></div>
      ${listCards(D.lists)}
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><h2>${t('home.trending')}</h2><p>${t('home.trendingSub')}</p></div><a class="link-more" href="#search" data-action="see-all">${t('home.seeAll')} ${ic('arrow', 'flip-rtl')}</a></div>
      <div class="card-grid">${ranked.slice(0, 6).map(b => cardHTML(b)).join('')}</div>
    </div></section>

    ${(() => {
      if (!prefs.loc) return `<section class="section" style="padding-top:0"><div class="wrap"><div class="near-cta"><span class="nc-ic">${ic('locate')}</span><div><b>${t('home.nearT')}</b><span>${t('home.nearB')}</span></div><button type="button" class="btn btn-primary" data-action="loc-ask">${ic('pin')}${t('loc.btn')}</button></div></div></section>`;
      const near = live.slice().sort((a, b) => distOf(a) - distOf(b)).slice(0, 3);
      return `<section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><div><h2>${t('home.nearYou')}</h2><p>${t('home.nearSub', { p: esc(locLabel()) })}</p></div><div class="sh-actions"><button type="button" class="btn btn-ghost btn-sm" data-action="loc-ask">${ic('pin')}${t('loc.change')}</button><a class="link-more" href="#search" data-action="near-all">${t('home.seeAll')} ${ic('arrow', 'flip-rtl')}</a></div></div>
        <div class="card-grid">${near.map(b => cardHTML(b, { dist: true })).join('')}</div></div></section>`;
    })()}

    ${(() => {
      const offers = live.filter(b => offerOf(b)).slice(0, 3);
      const ads = live.filter(b => planOf(b) === 'premium').slice(0, 3);
      return (offers.length ? `<section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><div><h2>${t('home.offers')}</h2><p>${t('home.offersSub')}</p></div><a class="link-more" href="#search" data-action="offers-all">${t('home.seeAll')} ${ic('arrow', 'flip-rtl')}</a></div>
        <div class="card-grid">${offers.map(b => cardHTML(b)).join('')}</div></div></section>` : '')
        + (ads.length ? `<section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><div><h2>${t('home.featured')}</h2><p>${t('home.featuredSub')}</p></div></div>
        <div class="card-grid">${ads.map(b => cardHTML(b, { ad: true })).join('')}</div></div></section>` : '');
    })()}

    <section class="section section-tint" id="hoodSec"><div class="wrap">
      <div class="section-head"><div><h2>${t('home.hoods')}</h2><p>${t('home.hoodsSub')}</p></div></div>
      <div class="hood-grid">${hoodCounts.map(x => `<button type="button" class="hood-tile" data-action="hood-search" data-hood="${x.id}"><span class="ht-map" data-smap data-lat="${x.h.lat}" data-lng="${x.h.lng}" data-z="13.9" data-dots="1" data-hl="1" data-ids="${x.items.map(b => b.id).join(',')}"></span><span class="ht-body"><b>${esc(L(x.h))}</b><span>${t('home.catCount', { n: N(x.items.length) })}</span></span></button>`).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><h2>${t('home.recent')}</h2><p>${t('home.recentSub')}</p></div></div>
      <div class="review-feed">${recent.map(r => { const u = userById(r.userId), b = bizById(r.bizId); return `<article class="rf-card"><div class="who">${avatar(u, 38)}<div><b>${esc(L(u.name))}</b><span>${relTime(r.ts)}</span></div></div>${stars(r.rating)}<p>${esc(L(r.text))}</p><a class="on-biz" href="${href(b)}">${photo(b.photos[0])}<span>${esc(L(b.name))}</span></a></article>`; }).join('')}</div>
    </div></section>

    <section class="owner-band"><div class="wrap owner-grid">
      <div><span class="eyebrow">${ic('store')}${t('home.ownerEyebrow')}</span><h2>${t('home.ownerTitle')}</h2><p>${t('home.ownerBody')}</p>
        <div class="ctas"><a class="btn btn-accent btn-lg" href="#add-business">${t('home.ownerCta1')}</a><a class="btn btn-secondary btn-lg" href="#owner">${t('home.ownerCta2')}</a></div></div>
      ${an ? `<div class="mock-dash" aria-hidden="true"><div class="md-top"><div><span class="faint" style="font-size:.82rem">${esc(L(ownerB.name))} · ${t('home.ownerMockTitle')}</span><br><b>${N(week.reduce((s, v) => s + v, 0))}</b></div><span class="badge badge-ok">+${N(12)}${pct()}</span></div>${spark(week)}
        <div class="md-row"><div><b>${N(an.calls[0])}</b>${t('own.calls')}</div><div><b>${N(an.dirs[0])}</b>${t('own.dirs')}</div><div><b>${R1(bizRating(ownerB))}</b>${t('own.rating')}</div></div></div>` : ''}
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><h2>${t('home.how')}</h2><p>${t('home.howSub')}</p></div></div>
      <div class="how-grid">${[['search', 1, 'how-search'], ['grid', 2, 'sort-rating'], ['route', 3, 'write-any']].map(([icn, k, act]) => `<a class="how" href="#search" data-action="${act}"><span class="n" aria-hidden="true">${digits(k)}</span><span class="hi">${ic(icn)}</span><h3>${t('home.how' + k + 't')}</h3><p>${t('home.how' + k + 'b')}</p><span class="how-go">${t('home.how' + k + 'go')}${ic('arrow', 'flip-rtl')}</span></a>`).join('')}</div>
    </div></section>`;
  }

  function viewSearch() {
    const list = searchResults(), q = S.q;
    const catName = q.cat !== 'all' ? L(catById(q.cat)) : '';
    const title = catName || t('results.title');
    const subBits = [t('results.count', { n: N(list.length) })];
    if (q.text) subBits.push(t('results.for', { q: esc(q.text) }));
    if (q.where) subBits.push(t('results.in', { w: esc(q.where) }));
    if (q.area) subBits.push(t('map.inArea'));
    const pq = S.lastParse || parseQuery(q.text);
    const understood = [];
    if (pq.hood && !q.where) understood.push(ic('pin') + esc(L(hood(pq.hood))));
    if (pq.best && q.sort === 'rec') understood.push(ic('star') + t('search.iBest'));
    if (pq.cheap && !q.price.length) understood.push(ic('tag') + t('search.iCheap'));
    if (pq.open && !q.open) understood.push(ic('clock') + t('filter.open'));
    if (pq.near) understood.push(ic('locate') + (prefs.loc ? t('search.iNear', { p: esc(locLabel()) }) : t('search.iNearNo')));
    const ads = list.filter(b => planOf(b) === 'premium').slice(0, 1);
    const xc = extraCount(q);
    const anyFilter = xc || q.cat !== 'all' || q.text || q.where || q.area;
    const hlToks = pq.toks;
    const row = (b, i, ad) => {
      const rv = db.reviews.filter(r => r.bizId === b.id).sort((x, y) => y.helpful - x.helpful)[0];
      const dk = distOf(b);
      return `<article class="result ${ad ? 'ad' : ''}" ${ad ? '' : `data-row="${b.id}"`}>${ad ? `<span class="ad-label">${ic('info')}${t('ad.label')}</span>` : ''}
        <a href="${href(b)}" tabindex="-1" aria-hidden="true">${photo(b.photos[0], '', b.isNew ? `<span class="ph-new">${t('biz.newOpen')}</span>` : '')}</a>
        <div class="result-body">
          <div class="result-top"><h3><a href="${href(b)}">${ad ? '' : digits(i + 1) + '. '}${hlText(L(b.name), hlToks)}</a>${b.verified ? verifiedMark() : ''}</h3>${favBtn(b)}</div>
          ${ratingRow(b)}
          <div class="meta-row"><span>${esc(L(catById(b.cat)))}</span>${dot}<span>${esc(L(hood(b.hood)))}</span>${dot}${priceHTML(b.price)}${dk != null ? `${dot}<span class="dist">${ic('route')}${fmtKm(dk)}</span>` : ''}</div>
          <div class="status-line">${statusHTML(b)}${bookKind(b) ? `<span class="badge badge-primary">${ic('calendar')}${t('book.' + bookKind(b))}</span>` : ''}${offerBadge(b)}</div>
          ${rv ? `<p class="snippet">${ic('quote')}<span>${hlText(L(rv.text), hlToks)}</span></p>` : ''}
          <div class="tags">${L(b.tags).map(x => `<button type="button" class="tag tag-btn" data-action="quick-search" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        </div></article>`;
    };
    return `<div class="wrap">
      <div class="results-head"><div><h1>${esc(title)}</h1><p>${subBits.join(' · ')}</p>${understood.length ? `<p class="understood"><span>${t('search.understood')}</span>${understood.map(x => `<span class="u-chip">${x}</span>`).join('')}${pq.near && !prefs.loc ? `<button type="button" class="link-btn" data-action="loc-ask">${t('loc.btn')}</button>` : ''}</p>` : ''}</div>
        <label class="sort">${t('results.sort')}<select class="select" data-change="sort" id="sortSel">${['rec', 'rating', 'reviews', 'near', 'new', 'name'].filter(x => x !== 'near' || prefs.loc).map(s => `<option value="${s}" ${q.sort === s ? 'selected' : ''}>${t('sort.' + s)}</option>`).join('')}</select></label></div>
      <div class="filters" role="toolbar" aria-label="${t('filter.title')}">
        <button type="button" class="chip chip-strong" data-action="open-filters">${ic('sliders')}${t('filter.more')}${xc ? `<span class="cnt">${N(xc)}</span>` : ''}</button>
        <button type="button" class="chip ${prefs.loc ? 'chip-loc' : ''}" data-action="loc-ask">${ic('locate')}${prefs.loc ? esc(locLabel()) : t('loc.btn')}</button>
        <select class="select" data-change="cat" id="catSel" aria-label="${t('wiz.cat')}"><option value="all">${t('filter.allCats')}</option>${db.cats.map(c => `<option value="${c.id}" ${q.cat === c.id ? 'selected' : ''}>${esc(L(c))}</option>`).join('')}</select>
        <span class="sep"></span>
        ${[1, 2, 3, 4].map(p => `<button type="button" class="chip" data-action="f-price" data-v="${p}" aria-pressed="${q.price.includes(p)}" title="${t('price.' + p)}">${'$'.repeat(p)} <span class="hide-sm">${t('price.' + p)}</span></button>`).join('')}
        <span class="sep"></span>
        <button type="button" class="chip" data-action="f-rating" data-v="4" aria-pressed="${q.minRating === 4}">${ic('star', 'ic-fill')}${t('filter.rating4')}</button>
        <button type="button" class="chip" data-action="f-rating" data-v="4.5" aria-pressed="${q.minRating === 4.5}">${t('filter.rating45')}</button>
        <button type="button" class="chip" data-action="f-open" aria-pressed="${q.open}">${ic('clock')}${t('filter.open')}</button>
        <button type="button" class="chip" data-action="f-verified" aria-pressed="${q.verified}">${ic('shield')}${t('filter.verified')}</button>
        <button type="button" class="chip" data-action="f-offer" aria-pressed="${q.offer}">${ic('tag')}${t('filter.offer')}</button>
        <button type="button" class="chip" data-action="f-book" aria-pressed="${q.book}">${ic('calendar')}${t('filter.book')}</button>
        ${q.area ? `<button type="button" class="chip chip-area" data-action="f-area" aria-pressed="true">${ic('map')}${t('map.areaChip')}${ic('x')}</button>` : ''}
        ${anyFilter ? `<button type="button" class="chip" data-action="f-clear" style="border-style:dashed">${ic('x')}${t('filter.clear')}</button>` : ''}
      </div>
      <div class="results-layout ${S.mobileMap ? 'show-map' : ''}">
        <div class="results-list">${ads.length && list.length > 2 ? ads.map(b => row(b, 0, true)).join('') : ''}${list.length ? list.map((b, i) => row(b, i)).join('') : emptyState('search', t('results.emptyT'), t('results.emptyB'), anyFilter ? `<button type="button" class="btn btn-secondary" data-action="f-clear">${t('filter.clear')}</button>` : '')}</div>
        <aside class="results-map" aria-label="${t('results.map')}"><div id="resultsMapEl" style="height:100%"></div></aside>
      </div>
      <button type="button" class="btn btn-primary btn-lg map-toggle" data-action="toggle-map">${S.mobileMap ? ic('list') + t('results.list') : ic('map') + t('results.map')}</button>
    </div>`;
  }

  function viewBiz(id) {
    const b = bizById(id);
    if (!b || b.status !== 'live') return notFound();
    const c = catById(b.cat), h = hood(b.hood), u = me();
    const photosAll = allPhotos(b);
    const gal = b.photos.slice(0, 5);
    while (gal.length < 5) gal.push({ kind: 'art', cat: b.cat, seed: b.look == null ? b.id : b.look, crop: gal.length, scene: b.scene });
    const reviews = bizReviews(b);
    const fav = isFav(b.id);
    const tabs = [['overview', t('biz.tab.overview')], ['menu', t('biz.tab.menu')], ['reviews', t('biz.tab.reviews'), bizCount(b)], ['photos', t('biz.tab.photos'), photosAll.length]];
    let panel = '';
    if (S.bizTab === 'menu') panel = menuBlock(b, false) || emptyState('tag', t('biz.tab.menu'), '');
    else if (S.bizTab === 'reviews') panel = reviewsBlock(b, reviews);
    else if (S.bizTab === 'photos') panel = `<div class="block"><h2>${t('biz.tab.photos')}</h2><div class="photo-grid">${photosAll.map((p, i) => `<button type="button" data-action="lightbox" data-set="biz:${b.id}" data-i="${i}" aria-label="${t('biz.tab.photos')} ${N(i + 1)}">${photo(p)}</button>`).join('')}</div></div>`;
    else {
      const top2 = reviews.slice().sort((x, y) => y.helpful - x.helpful).slice(0, 2);
      panel = `<div class="block"><h2>${t('biz.about')}</h2><p class="about-text">${esc(L(b.about))}</p></div>
        ${b.amen && b.amen.length ? `<div class="block"><h2>${t('biz.amenities')}</h2><div class="amen-grid">${b.amen.map(a => `<div class="amen">${ic(AMEN_IC[a] || 'check')}<span>${t('amen.' + a)}</span></div>`).join('')}</div></div>` : ''}
        ${b.menu && b.menu.length ? menuBlock(b, true) : ''}
        ${busyBlock(b)}
        <div class="block"><div class="section-head" style="margin:0"><h2>${t('biz.tab.reviews')}</h2><button type="button" class="link-more" data-action="biz-tab" data-tab="reviews">${t('biz.seeReviews')} ${ic('arrow', 'flip-rtl')}</button></div>
          ${summaryBlock(b)}<div>${top2.map(r => reviewHTML(r, b)).join('')}</div></div>
        ${qaBlock(b)}`;
    }
    const ownsIt = u && (u.role === 'admin' || (u.bizIds || []).includes(b.id));
    const where = placeLine(b);
    const week = [6, 0, 1, 2, 3, 4, 5], today = tehranNow().day;
    const hoursRows = week.map(d => {
      const off = (b.hours.off || []).includes(d);
      const v = off ? t('biz.closed') : (b.hours.o === '00:00' && b.hours.c === '24:00') ? t('biz.24h') : `<span dir="ltr">${fmtTime(b.hours.o)} – ${fmtTime(b.hours.c)}</span>`;
      return `<tr class="${d === today ? 'today' : ''}"><td data-today="${t('biz.today')}">${t('days')[d]}</td><td>${v}</td></tr>`;
    }).join('');
    const sim = similarTo(b);
    return `<div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="#home">${t('common.home')}</a>${ic('chev-r', 'flip-rtl')}<a href="#search-${c.id}">${esc(L(c))}</a>${ic('chev-r', 'flip-rtl')}<span>${esc(L(b.name))}</span></nav>
      <div class="gallery">${gal.map((p, i) => `<button type="button" class="g-item" data-action="lightbox" data-set="biz:${b.id}" data-i="${i}" aria-label="${t('biz.tab.photos')} ${N(i + 1)}">${photo(p)}</button>`).join('')}
        <button type="button" class="btn btn-secondary btn-sm all-btn" data-action="lightbox" data-set="biz:${b.id}" data-i="0">${ic('image')}${t('biz.showAll', { n: N(photosAll.length) })}</button></div>
      <div class="biz-head">
        <div style="min-width:0">
          <div class="kicker">${ic(c.icon)}<a href="#search-${c.id}">${esc(L(c))}</a>${dot}<button type="button" class="link-plain" data-action="hood-search" data-hood="${b.hood}">${esc(L(h))}</button>${b.isNew ? `<span class="badge badge-warn">${ic('sparkle')}${t('biz.newOpen')}</span>` : ''}</div>
          <h1>${esc(L(b.name))}${b.verified ? verifiedMark() : ''}</h1>
          <div class="biz-sub">
            ${bizCount(b) ? `<button type="button" class="rate-link" data-action="biz-tab" data-tab="reviews">${stars(bizRating(b), 18)}<b class="rating-num">${R1(bizRating(b))}</b><span class="rating-count">${t('biz.reviews', { n: N(bizCount(b)) })}</span></button>` : `<span class="badge badge-primary">${t('biz.new')}</span>`}
            ${dot}${priceHTML(b.price)}${dot}${statusHTML(b)}
          </div>
        </div>
        <div class="biz-actions">
          <button type="button" class="btn btn-primary" data-action="write" data-id="${b.id}">${ic('edit')}${t('biz.write')}</button>
          <button type="button" class="btn btn-secondary ${fav ? 'on' : ''} fav" data-action="fav" data-id="${b.id}" aria-pressed="${fav}">${ic('heart')}<span class="fav-lbl">${t(fav ? 'biz.saved' : 'biz.save')}</span></button>
          <button type="button" class="btn btn-secondary" data-action="share">${ic('share')}${t('biz.share')}</button>
        </div>
      </div>
      ${(() => { const o = offerOf(b); return o ? `<div class="offer-banner">${ic('tag')}<div><b>${esc(L(o.title))}</b><span>${t('offer.until', { d: fmtDate(o.until) })}</span></div><span class="offer-pct">${t('offer.badge', { n: N(o.pct) })}</span></div>` : ''; })()}
      <div class="biz-head-end" hidden>
      </div>
      <div class="tabs" role="tablist">${tabs.map(([k, label, cnt]) => `<button type="button" class="tab" role="tab" data-action="biz-tab" data-tab="${k}" aria-selected="${S.bizTab === k}">${label}${cnt ? `<span class="cnt">${N(cnt)}</span>` : ''}</button>`).join('')}</div>
      <div class="biz-layout">
        <div class="biz-main" role="tabpanel">${panel}</div>
        <aside class="biz-side">
          ${bookCard(b)}
          <div class="side-card"><h3>${t('biz.hours')}${statusHTML(b)}</h3><table class="hours-table"><tbody>${hoursRows}</tbody></table></div>
          <div class="side-card"><h3>${t('biz.contact')}</h3>
            <div class="contact-row">${ic('pin')}<span class="grow">${esc(L(b.addr))}</span><button type="button" class="icon-btn" data-action="copy" data-v="${esc(L(b.addr))}" aria-label="${t('biz.copy')}">${ic('copy')}</button></div>
            <div class="contact-row">${ic('phone')}<span class="grow tnum" dir="ltr" style="text-align:start">${digits(b.phone)}</span><button type="button" class="icon-btn" data-action="copy" data-v="${esc(b.phone)}" aria-label="${t('biz.copy')}">${ic('copy')}</button></div>
            ${where ? `<div class="contact-row">${ic('map')}<span class="grow">${esc(where)}</span></div>` : ''}
            <div class="mini-map"><div class="mini-map-el" data-smap data-lat="${b.lat}" data-lng="${b.lng}" data-z="14.2" data-hl="1" data-ids="${b.id}"></div><button type="button" class="mini-open" data-action="map-modal" data-id="${b.id}" aria-label="${t('map.open')}"><span>${ic('expand')}${t('map.open')}</span></button></div>
            <div class="dir-row"><a class="btn btn-secondary btn-sm" href="${directionsUrl(b)}" target="_blank" rel="noopener">${ic('route')}${t('map.google')}</a><a class="btn btn-secondary btn-sm" href="${directionsUrl(b, 'waze')}" target="_blank" rel="noopener">${ic('route')}${t('map.waze')}</a></div>
          </div>
          <div class="side-card claim"><h3>${t('biz.claimT')}</h3><p>${t('biz.claimB')}</p><a class="btn btn-primary btn-sm" href="${ownsIt ? '#owner' : '#for-business'}">${t('biz.claimCta')}</a></div>
        </aside>
      </div>
      ${sim.length ? `<section class="similar"><div class="section-head"><div><h2>${t('biz.similar')}</h2><p>${t('biz.similarSub')}</p></div></div><div class="card-grid">${sim.map(x => cardHTML(x)).join('')}</div></section>` : ''}
    </div>`;
  }
  function menuBlock(b, preview) {
    const items = preview ? b.menu.filter(m => m.pop).slice(0, 3) : b.menu;
    if (!items.length) return '';
    return `<div class="block"><div class="section-head" style="margin:0"><h2>${preview ? t('biz.highlights') : t('biz.tab.menu')}</h2>${preview ? `<button type="button" class="link-more" data-action="biz-tab" data-tab="menu">${t('biz.seeMenu')} ${ic('arrow', 'flip-rtl')}</button>` : ''}</div>
      <div class="menu-list">${items.map(m => `<div class="menu-item"><span class="mn">${esc(L(m.n))}${m.pop ? `<span class="badge badge-warn">${t('biz.popular')}</span>` : ''}</span><span class="leader"></span><span class="mp">${toman(m.p)}</span></div>`).join('')}</div></div>`;
  }
  function summaryBlock(b) {
    const d = dist(bizRating(b));
    return `<div class="rv-summary"><div class="rv-big"><b>${bizCount(b) ? R1(bizRating(b)) : '–'}</b>${stars(bizRating(b), 16)}<span>${t('rv.based', { n: N(bizCount(b)) })}</span></div>
      <div class="rv-bars">${[5, 4, 3, 2, 1].map(s => `<button type="button" class="rv-bar ${S.revFilter === s ? 'on' : ''}" data-action="rv-filter" data-v="${s}"><span>${t('rv.stars', { n: N(s) })}</span><span class="track"><span class="fill" style="width:${d[s - 1]}%;display:block"></span></span><span class="pct">${N(d[s - 1])}${pct()}</span></button>`).join('')}</div></div>`;
  }
  function reviewsBlock(b, reviews) {
    let list = reviews.slice();
    if (S.revFilter) list = list.filter(r => r.rating === S.revFilter);
    const sorters = { new: (x, y) => y.ts - x.ts, high: (x, y) => y.rating - x.rating || y.ts - x.ts, low: (x, y) => x.rating - y.rating || y.ts - x.ts, helpful: (x, y) => y.helpful - x.helpful };
    list.sort(sorters[S.revSort] || sorters.new);
    return `<div class="block">${summaryBlock(b)}
      ${S.writeOpen ? writeForm(b) : ''}
      <div class="rv-toolbar"><div class="chips"><button type="button" class="chip" data-action="rv-filter" data-v="0" aria-pressed="${!S.revFilter}">${t('rv.all')}</button>${[5, 4, 3, 2, 1].map(s => `<button type="button" class="chip" data-action="rv-filter" data-v="${s}" aria-pressed="${S.revFilter === s}">${digits(s)} ${ic('star', 'ic-fill')}</button>`).join('')}</div>
        <label class="sort"><span class="sr-only">${t('results.sort')}</span><select class="select" data-change="rv-sort" id="rvSort">${['new', 'high', 'low', 'helpful'].map(s => `<option value="${s}" ${S.revSort === s ? 'selected' : ''}>${t('rv.sort.' + s)}</option>`).join('')}</select></label></div>
      <div>${list.length ? list.map(r => reviewHTML(r, b)).join('') : `<p class="muted" style="padding-block:20px">${t('rv.none')}</p>`}</div>
      ${!S.writeOpen ? `<div><button type="button" class="btn btn-primary" data-action="write" data-id="${b.id}">${ic('edit')}${t('biz.write')}</button></div>` : ''}</div>`;
  }
  function writeForm(b) {
    const dft = S.draft, labels = t('rv.labels');
    return `<form class="write" data-form="review" data-id="${b.id}" id="writeForm">
      <h3>${t('rv.formT')}</h3>
      <div class="star-input" role="radiogroup" aria-label="${t('rv.pickStars')}">${[1, 2, 3, 4, 5].map(v => `<button type="button" role="radio" aria-checked="${dft.rating === v}" aria-label="${labels[v]}" class="${dft.rating >= v ? 'on' : ''}" data-action="set-rating" data-v="${v}"><svg><use href="#i-star"/></svg></button>`).join('')}<span class="lbl" id="starLbl">${dft.rating ? labels[dft.rating] : t('rv.pickStars')}</span></div>
      <div class="field"><label for="rvText" class="sr-only">${t('rv.formT')}</label><textarea class="textarea" id="rvText" name="text" maxlength="1000" placeholder="${t('rv.textPh')}" data-input="draft">${esc(dft.text)}</textarea><span class="field-hint" id="rvCount">${t('rv.minChars', { n: N(dft.text.trim().length) })}</span></div>
      <div class="upload-row" id="draftPhotos">${draftThumbs()}</div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="write-cancel">${t('rv.cancel')}</button><button type="submit" class="btn btn-primary">${t('rv.submit')}</button></div>
    </form>`;
  }
  function draftThumbs() {
    return S.draft.photos.map((p, i) => `<div class="thumb">${p.kind === 'img' ? `<img src="${p.src}" alt="">` : ''}<button type="button" class="rm" data-action="rm-draft" data-i="${i}" aria-label="${t('own.photos.remove')}">${ic('x')}</button></div>`).join('') +
      (S.draft.photos.length < 4 ? `<label class="btn btn-secondary btn-sm file-btn">${ic('camera')}${t('rv.addPhotos')}<input type="file" accept="image/*" multiple data-upload="review"></label>` : '');
  }
  function reviewHTML(r, b) {
    const u = userById(r.userId), mine = db.session === r.userId;
    const who = db.session || 'guest';
    const cnt = { h: r.helpful || 0, f: (r.react && r.react.f) || 0, l: (r.react && r.react.l) || 0 };
    const reacts = [['h', 'thumb'], ['f', 'smile'], ['l', 'heart']].map(([k, icn]) => {
      const on = !!db.helpfulBy[`${who}:${r.id}${k === 'h' ? '' : ':' + k}`];
      return `<button type="button" data-action="react" data-id="${r.id}" data-k="${k}" aria-pressed="${on}">${ic(icn)}${t('react.' + k)}${cnt[k] ? ` · <span class="tnum">${N(cnt[k])}</span>` : ''}</button>`;
    }).join('');
    return `<article class="review" id="rv-${r.id}">
      <div class="rv-head">${avatar(u, 42)}<div class="who"><b>${esc(L(u.name))}${mine ? ` <span class="badge badge-primary">${t('rv.you')}</span>` : ''}</b><span>${t('rv.userCount', { n: N(userReviewCount(u)) })} · <time datetime="${new Date(r.ts).toISOString()}" title="${fmtDate(r.ts)}">${relTime(r.ts)}</time></span></div>${stars(r.rating, 15)}</div>
      <p class="rv-text">${esc(L(r.text))}</p>
      ${r.photos.length ? `<div class="rv-photos">${r.photos.map((p, i) => `<button type="button" data-action="lightbox" data-set="rv:${r.id}" data-i="${i}" aria-label="${t('biz.tab.photos')}">${photo(p)}</button>`).join('')}</div>` : ''}
      <div class="rv-actions">${reacts}
        ${mine ? `<button type="button" data-action="del-review" data-id="${r.id}">${ic('trash')}${t('rv.delete')}</button>` : `<button type="button" data-action="report" data-id="${r.id}">${ic('flag')}${t('rv.report')}</button>`}
      </div>
      ${r.reply ? `<div class="rv-reply"><b>${ic('store')}${t('rv.reply')}${b ? ` · ${esc(L(b.name))}` : ''}</b>${esc(L(r.reply))}</div>` : ''}
    </article>`;
  }
  function viewLogin(note) {
    const L1 = S.login;
    const phoneStep = `<form data-form="login-phone" class="auth-card" novalidate>
        <div><h1>${t('login.title')}</h1><p class="muted" style="margin-top:6px">${t('login.lead')}</p></div>
        ${note ? `<div class="demo-note">${ic('lock')}<span>${note}</span></div>` : ''}
        <div class="field ${L1.err ? 'err' : ''}"><label for="phoneIn">${t('login.phone')}</label><input class="input tnum" id="phoneIn" name="phone" inputmode="numeric" dir="ltr" maxlength="13" placeholder="${t('login.phonePh')}" value="${esc(L1.phone)}" autocomplete="tel">${L1.err ? `<span class="field-err">${L1.err}</span>` : ''}</div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${t('login.send')}</button>
        <p class="field-hint">${t('login.terms')}</p>
        <div class="quick"><b style="font-size:.9rem">${t('login.quick')}</b><span class="field-hint">${t('login.quickLead')}</span>
          <div class="quick-row"><button type="button" data-action="demo-login" data-role="user">${ic('user')}${t('role.user')}</button><button type="button" data-action="demo-login" data-role="owner">${ic('store')}${t('role.owner')}</button><button type="button" data-action="demo-login" data-role="admin">${ic('shield')}${t('role.admin')}</button></div></div>
      </form>`;
    const left = Math.max(0, Math.ceil((L1.until - Date.now()) / 1000));
    const codeStep = `<form data-form="login-code" class="auth-card" novalidate>
        <div><h1>${t('login.codeT')}</h1><p class="muted" style="margin-top:6px">${t('login.codeLead', { p: `<span dir="ltr" class="tnum">${digits(L1.phone)}</span>` })}</p></div>
        <div class="demo-note">${ic('info')}<span>${t('login.demoHint')}</span></div>
        <div class="otp ${L1.err ? 'err' : ''}" role="group" aria-label="${t('login.codeT')}">${[0, 1, 2, 3].map(i => `<input inputmode="numeric" maxlength="1" class="tnum" data-otp="${i}" aria-label="${N(i + 1)}" autocomplete="one-time-code">`).join('')}</div>
        ${L1.err ? `<p class="field-err" style="text-align:center">${L1.err}</p>` : ''}
        <button class="btn btn-primary btn-lg btn-block" type="submit">${t('login.verify')}</button>
        <div style="display:flex;justify-content:space-between;gap:10px;font-size:.88rem"><button type="button" class="link-btn" data-action="login-edit">${t('login.edit')}</button><button type="button" class="link-btn" id="resendBtn" data-action="login-resend" ${left ? 'disabled' : ''}>${left ? t('login.resendIn', { s: N(left) }) : t('login.resend')}</button></div>
      </form>`;
    return `<div class="auth"><div class="auth-side"><h2>${t('login.sideT')}</h2><ul><li>${ic('edit')}${t('login.side1')}</li><li>${ic('heart')}${t('login.side2')}</li><li>${ic('store')}${t('login.side3')}</li></ul></div>
      <div class="auth-main">${L1.step === 'code' ? codeStep : phoneStep}</div></div>`;
  }
  function viewNoAccess(role) {
    return `<div class="wrap" style="padding-block:60px">${emptyState('lock', t('access.t'), t('access.b', { r: t('role.' + role) }), `<button type="button" class="btn btn-primary" data-action="demo-login" data-role="${role}">${t('access.cta', { r: t('role.' + role) })}</button>`)}</div>`;
  }
  function notFound() {
    return `<div class="wrap" style="padding-block:60px">${emptyState('search', t('biz.notFound'), t('biz.notFoundB'), `<a class="btn btn-primary" href="#home">${t('biz.backHome')}</a>`)}</div>`;
  }

  /* ---------- Add business wizard ---------- */
  const newWiz = () => ({ step: 0, done: null, err: {}, data: { name: '', cat: 'cafe', price: 2, desc: '', hood: 'vanak', addr: '', phone: '', lat: null, lng: null, o: '09:00', c: '22:00', off: 'none', photos: [] } });
  function draftBiz() {
    const d = S.wiz.data, h = hood(d.hood);
    return {
      id: 0, cat: d.cat, hood: d.hood, lat: d.lat || h.lat, lng: d.lng || h.lng, price: d.price, rating: 0, count: 0, adj: { n: 0, sum: 0 }, verified: false,
      name: { fa: d.name, en: d.name }, phone: d.phone, addr: { fa: d.addr, en: d.addr }, about: { fa: d.desc, en: d.desc },
      tags: { fa: [], en: [] }, amen: [], hours: { o: d.o, c: d.c, off: d.off === 'none' ? [] : [Number(d.off)] }, menu: [],
      photos: d.photos.length ? d.photos : [{ kind: 'art', cat: d.cat, seed: 3, crop: 0 }], status: 'pending'
    };
  }
  function viewAddBiz() {
    if (!S.wiz) S.wiz = newWiz();
    const w = S.wiz, d = w.data;
    if (w.done) {
      const u = me();
      return `<div class="wrap"><div class="success"><div class="big-check">${ic('check')}</div><h1>${t('wiz.doneT')}</h1><p>${t('wiz.doneB')}</p>
        <div class="row"><a class="btn btn-primary" href="#me-listings">${t('wiz.toMe')}</a>${u && u.role === 'admin' ? `<a class="btn btn-secondary" href="#admin-approvals">${t('wiz.toAdmin')}</a>` : `<button type="button" class="btn btn-secondary" data-action="demo-login" data-role="admin" data-next="admin-approvals">${t('wiz.toAdmin')}</button>`}</div>
        <button type="button" class="link-btn" data-action="wiz-reset">${t('wiz.another')}</button></div></div>`;
    }
    const steps = t('wiz.steps');
    const fe = k => (w.err[k] ? `<span class="field-err">${w.err[k]}</span>` : '');
    let body = '';
    if (w.step === 0) {
      body = `<div class="field ${w.err.name ? 'err' : ''}"><label for="wzName">${t('wiz.name')}</label><input class="input" id="wzName" data-wiz="name" value="${esc(d.name)}" placeholder="${t('wiz.namePh')}" maxlength="60">${fe('name')}</div>
        <div class="form-grid"><div class="field"><label for="wzCat">${t('wiz.cat')}</label><select class="select" id="wzCat" data-wiz="cat">${db.cats.map(c => `<option value="${c.id}" ${d.cat === c.id ? 'selected' : ''}>${esc(L(c))}</option>`).join('')}</select></div>
        <div class="field"><span class="label">${t('wiz.price')}</span><div class="price-pick">${[1, 2, 3, 4].map(p => `<button type="button" class="chip" data-action="wiz-price" data-v="${p}" aria-pressed="${d.price === p}">${'$'.repeat(p)}</button>`).join('')}</div></div></div>
        <div class="field"><label for="wzDesc">${t('wiz.desc')}</label><textarea class="textarea" id="wzDesc" data-wiz="desc" maxlength="400" placeholder="${t('wiz.descPh')}">${esc(d.desc)}</textarea></div>`;
    } else if (w.step === 1) {
      body = `<div class="form-grid"><div class="field"><label for="wzHood">${t('wiz.hood')}</label><select class="select" id="wzHood" data-wiz="hood">${Object.entries(D.hoods).map(([id, h]) => `<option value="${id}" ${d.hood === id ? 'selected' : ''}>${esc(L(h))}</option>`).join('')}</select></div>
        <div class="field ${w.err.phone ? 'err' : ''}"><label for="wzPhone">${t('wiz.phone')}</label><input class="input tnum" id="wzPhone" data-wiz="phone" dir="ltr" inputmode="tel" value="${esc(d.phone)}" placeholder="021 ..." maxlength="16">${fe('phone')}</div>
        <div class="field span-2 ${w.err.addr ? 'err' : ''}"><label for="wzAddr">${t('wiz.addr')}</label><input class="input" id="wzAddr" data-wiz="addr" value="${esc(d.addr)}" placeholder="${t('wiz.addrPh')}" maxlength="120">${fe('addr')}</div></div>
        <div class="field"><span class="label">${t('wiz.pin')}</span><div class="pick-map"><div id="pickMapEl" style="height:100%"></div></div><p class="pick-where" id="pickWhere">${d.lat ? ic('pin') + esc(placeLine(d) || t('map.outside')) : esc(t('map.pickHint'))}</p></div>`;
    } else if (w.step === 2) {
      const times = []; for (let hh = 0; hh <= 24; hh++) for (const mm of ['00', '30']) { if (hh === 24 && mm === '30') continue; times.push(`${String(hh).padStart(2, '0')}:${mm}`); }
      body = `<div class="form-grid"><div class="field"><label for="wzO">${t('wiz.opens')}</label><select class="select tnum" id="wzO" data-wiz="o">${times.filter(x => x !== '24:00').map(x => `<option value="${x}" ${d.o === x ? 'selected' : ''}>${digits(x)}</option>`).join('')}</select></div>
        <div class="field ${w.err.c ? 'err' : ''}"><label for="wzC">${t('wiz.closes')}</label><select class="select tnum" id="wzC" data-wiz="c">${times.filter(x => x !== '00:00').map(x => `<option value="${x}" ${d.c === x ? 'selected' : ''}>${digits(x)}</option>`).join('')}</select>${fe('c')}</div>
        <div class="field span-2"><label for="wzOff">${t('wiz.off')}</label><select class="select" id="wzOff" data-wiz="off"><option value="none">${t('wiz.offNone')}</option>${[6, 0, 1, 2, 3, 4, 5].map(k => `<option value="${k}" ${String(d.off) === String(k) ? 'selected' : ''}>${t('days')[k]}</option>`).join('')}</select></div></div>`;
    } else {
      body = `<p class="field-hint">${t('wiz.photosHint')}</p>
        <label class="dropzone" id="wizDrop">${ic('upload')}<b>${t('wiz.upload')}</b><input type="file" accept="image/*" multiple data-upload="wiz"></label>
        ${d.photos.length ? `<div class="upload-row">${d.photos.map((p, i) => `<div class="thumb"><img src="${p.src}" alt=""><button type="button" class="rm" data-action="rm-wiz" data-i="${i}" aria-label="${t('own.photos.remove')}">${ic('x')}</button></div>`).join('')}</div>` : `<p class="note" style="margin:0">${ic('info')}<span>${t('wiz.noPhotos')}</span></p>`}`;
    }
    return `<div class="wrap"><div class="wiz">
      <div class="page-head" style="padding-bottom:0"><h1>${t('wiz.title')}</h1><p>${t('wiz.lead')}</p></div>
      <div class="steps" aria-label="${t('wiz.stepOf', { a: N(w.step + 1), b: N(4) })}">${steps.map((s, i) => `<div class="step ${i < w.step ? 'done' : i === w.step ? 'cur' : ''}">${digits(i + 1)}. ${s}</div>`).join('')}</div>
      <div class="wiz-body"><form class="surface pad wiz-card" data-form="wiz" novalidate>${body}
        <div class="wiz-nav">${w.step ? `<button type="button" class="btn btn-secondary" data-action="wiz-back">${ic('chev-l', 'flip-rtl')}${t('wiz.back')}</button>` : '<span></span>'}
          <button type="submit" class="btn btn-primary">${w.step === 3 ? t('wiz.submit') : t('wiz.next')}${w.step === 3 ? '' : ic('chev-r', 'flip-rtl')}</button></div></form>
        <aside class="wiz-preview"><span class="label">${t('wiz.preview')}</span><div id="wizPreview">${cardHTML(draftBiz(), { preview: true })}</div></aside></div>
    </div></div>`;
  }

  /* ---------- Dashboards ---------- */
  function dashLayout(items, cur, content, extra = '') {
    const u = me();
    return `<div class="wrap dash"><nav class="dash-nav"><div class="who">${avatar(u, 44)}<div><b>${esc(L(u.name))}</b><span>${t('role.' + u.role)}</span></div></div>
      ${items.map(it => `<a href="#${it.r}" ${it.r === cur ? 'aria-current="page"' : ''}>${ic(it.ic)}<span>${it.label}</span>${it.cnt ? `<span class="cnt">${N(it.cnt)}</span>` : ''}</a>`).join('')}
      ${extra ? `<div class="extra">${extra}</div>` : ''}</nav><div class="dash-main">${content}</div></div>`;
  }
  function viewMe(sub) {
    const u = me();
    const items = [
      { r: 'me', ic: 'heart', label: t('me.nav.favs') },
      { r: 'me-bookings', ic: 'calendar', label: t('me.nav.bookings'), cnt: db.bookings.filter(x => x.userId === u.id && x.status === 'confirmed' && x.date >= tDate(0)).length },
      { r: 'me-reviews', ic: 'edit', label: t('me.nav.reviews') },
      { r: 'me-listings', ic: 'store', label: t('me.nav.listings') },
      { r: 'me-profile', ic: 'user', label: t('me.nav.profile') }
    ];
    let content = '';
    if (sub === 'bookings') {
      const today = tDate(0);
      const mine = db.bookings.filter(x => x.userId === u.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      const up = mine.filter(x => x.status === 'confirmed' && x.date >= today), past = mine.filter(x => !(x.status === 'confirmed' && x.date >= today)).reverse();
      const row = (x, canCancel) => { const b = bizById(x.bizId); return `<div class="lrow">${photo(b ? b.photos[0] : null)}<div style="min-width:0"><h3><a href="${b ? href(b) : '#home'}">${esc(b ? L(b.name) : '—')}</a></h3><p>${fmtDay(x.date)} · <span class="tnum">${digits(x.time)}</span>${x.size > 1 ? ' · ' + t('book.people', { n: N(x.size) }) : ''}</p></div><div class="lrow-end"><span class="badge ${x.status === 'confirmed' ? 'badge-ok' : x.status === 'done' ? 'badge-neutral' : 'badge-bad'}">${t('book.st.' + x.status)}</span>${canCancel ? `<button type="button" class="btn btn-ghost btn-sm" data-action="book-cancel" data-id="${x.id}">${t('book.cancel')}</button>` : ''}</div></div>`; };
      content = `<div class="dash-title"><h1>${t('me.nav.bookings')}</h1></div>` + (mine.length ? `${up.length ? `<h2 class="sub-h">${t('book.upcoming')}</h2><div class="list-rows">${up.map(x => row(x, true)).join('')}</div>` : ''}${past.length ? `<h2 class="sub-h">${t('book.past')}</h2><div class="list-rows">${past.map(x => row(x, false)).join('')}</div>` : ''}`
        : emptyState('calendar', t('book.emptyT'), t('book.emptyB'), `<a class="btn btn-primary" href="#search">${t('me.explore')}</a>`));
    } else if (sub === 'reviews') {
      const rs = db.reviews.filter(r => r.userId === u.id).sort((a, b) => b.ts - a.ts);
      content = `<div class="dash-title"><h1>${t('me.nav.reviews')}</h1></div>` + (rs.length ? `<div class="list-rows">${rs.map(r => { const b = bizById(r.bizId); return `<div class="lrow">${photo(b ? b.photos[0] : null)}<div style="min-width:0"><h3><a href="${href(bizById(r.bizId) || { id: r.bizId })}">${esc(b ? L(b.name) : '—')}</a></h3><div class="rating-row">${stars(r.rating)}<span>${relTime(r.ts)}</span></div><p style="margin-top:4px">${esc(L(r.text))}</p></div><button type="button" class="btn btn-danger btn-sm" data-action="del-review" data-id="${r.id}">${ic('trash')}${t('rv.delete')}</button></div>`; }).join('')}</div>`
        : emptyState('edit', t('me.reviewsEmptyT'), t('me.reviewsEmptyB'), `<a class="btn btn-primary" href="#search">${t('me.explore')}</a>`));
    } else if (sub === 'listings') {
      const ps = db.pending.filter(p => p.submittedBy === u.id).sort((a, b) => b.ts - a.ts);
      const st = { pending: 'badge-warn', approved: 'badge-ok', rejected: 'badge-bad' };
      content = `<div class="dash-title"><h1>${t('me.nav.listings')}</h1><a class="btn btn-primary btn-sm" href="#add-business">${ic('plus')}${t('nav.addBiz')}</a></div>` + (ps.length ? `<div class="list-rows">${ps.map(p => `<div class="lrow">${photo(p.photos[0] || { kind: 'art', cat: p.cat, seed: 3, crop: 0 })}<div style="min-width:0"><h3>${esc(L(p.name))}</h3><p>${esc(L(catById(p.cat)))} · ${esc(L(hood(p.hood)))} · ${relTime(p.ts)}</p>${p.status === 'rejected' && p.reason ? `<p class="faint">${t('me.rejectReason', { r: t('adm.rr.' + p.reason) })}</p>` : ''}</div>
          <div style="display:grid;gap:8px;justify-items:end"><span class="badge ${st[p.status]}">${t('me.st.' + p.status)}</span>${p.status === 'approved' && p.bizId ? `<a class="btn btn-secondary btn-sm" href="${href(bizById(p.bizId) || { id: p.bizId })}">${t('me.viewPage')}</a>` : ''}</div></div>`).join('')}</div>`
        : emptyState('store', t('me.listingsEmptyT'), t('me.listingsEmptyB'), `<a class="btn btn-primary" href="#add-business">${t('nav.addBiz')}</a>`));
    } else if (sub === 'profile') {
      content = `<div class="dash-title"><div><h1>${t('me.nav.profile')}</h1><p>${t('me.since', { d: fmtDate(u.joined) })}</p></div></div>
        <form class="panel" data-form="profile" novalidate><div class="form-grid">
          <div class="field span-2"><label for="pfName">${t('me.name')}</label><input class="input" id="pfName" name="name" value="${esc(L(u.name))}" maxlength="50" required></div>
          <div class="field" id="pfEmailF"><label for="pfEmail">${t('me.email')}</label><input class="input" id="pfEmail" name="email" type="email" dir="ltr" value="${esc(u.email || '')}" maxlength="80"></div>
          <div class="field"><label for="pfPhone">${t('me.phone')}</label><input class="input tnum" id="pfPhone" dir="ltr" value="${digits(u.phone)}" disabled></div>
          <div class="field span-2"><span class="label">${t('me.color')}</span><div class="swatches">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<label><input type="radio" name="color" value="${k}" ${u.color % 8 === k ? 'checked' : ''}><span class="av av-${k}">${esc(initials(L(u.name)))}</span></label>`).join('')}</div></div>
        </div><div class="modal-actions" style="margin-top:20px"><button type="submit" class="btn btn-primary">${t('me.save')}</button></div></form>`;
    } else {
      const favs = db.favorites.filter(f => f.userId === u.id).map(f => bizById(f.bizId)).filter(b => b && b.status === 'live');
      content = `<div class="dash-title"><h1>${t('me.nav.favs')}</h1></div>` + (favs.length ? `<div class="card-grid">${favs.map(b => cardHTML(b)).join('')}</div>`
        : emptyState('heart', t('me.favsEmptyT'), t('me.favsEmptyB'), `<a class="btn btn-primary" href="#search">${t('me.explore')}</a>`));
    }
    return dashLayout(items, sub ? 'me-' + sub : 'me', content);
  }

  function ownerBiz() {
    const u = me();
    if (!u) return null;
    const ids = u.bizIds && u.bizIds.length ? u.bizIds : (u.role === 'admin' ? [2] : []);
    return ids.map(bizById).find(Boolean) || null;
  }
  function viewOwner(sub) {
    const b = ownerBiz();
    if (!b) return `<div class="wrap" style="padding-block:60px">${emptyState('store', t('own.title'), t('own.noBiz'), `<a class="btn btn-primary" href="#add-business">${t('nav.addBiz')}</a>`)}</div>`;
    const rs = bizReviews(b).sort((x, y) => y.ts - x.ts);
    const unanswered = rs.filter(r => !r.reply).length;
    const items = [
      { r: 'owner', ic: 'chart', label: t('own.nav.overview') },
      { r: 'owner-reviews', ic: 'edit', label: t('own.nav.reviews'), cnt: unanswered },
      { r: 'owner-bookings', ic: 'calendar', label: t('own.nav.bookings'), cnt: db.bookings.filter(x => x.bizId === b.id && x.date === tDate(0) && x.status === 'confirmed').length },
      { r: 'owner-qa', ic: 'help', label: t('own.nav.qa'), cnt: db.qa.filter(x => x.bizId === b.id && !x.a).length },
      { r: 'owner-info', ic: 'store', label: t('own.nav.info') },
      { r: 'owner-photos', ic: 'image', label: t('own.nav.photos') },
      { r: 'owner-offers', ic: 'tag', label: t('own.nav.offers'), cnt: (db.offers || []).filter(o => o.bizId === b.id && o.until > Date.now()).length }
    ];
    const head = sub => `<div class="dash-title"><div><h1>${sub}</h1><p>${esc(L(b.name))} · ${esc(L(hood(b.hood)))}</p></div><a class="btn btn-secondary btn-sm" href="${href(b)}">${ic('eye')}${t('own.viewPublic')}</a></div>`;
    let content = '';
    if (sub === 'reviews') {
      const list = S.ownFilter === 'open' ? rs.filter(r => !r.reply) : rs;
      content = head(t('own.nav.reviews')) + `<div class="chips" style="display:flex;gap:8px"><button type="button" class="chip" data-action="own-filter" data-v="all" aria-pressed="${S.ownFilter === 'all'}">${t('own.filterAll')}</button><button type="button" class="chip" data-action="own-filter" data-v="open" aria-pressed="${S.ownFilter === 'open'}">${t('own.filterOpen', { n: N(unanswered) })}</button></div>
        <div class="list-rows">${list.length ? list.map(r => { const u = userById(r.userId); const editing = S.editReply === r.id || !r.reply; return `<div class="own-review ${r.reply ? '' : 'needs'}">
          <div class="rv-head">${avatar(u, 38)}<div class="who"><b>${esc(L(u.name))}</b><span>${relTime(r.ts)}</span></div>${stars(r.rating, 14)}</div>
          <p class="rv-text">${esc(L(r.text))}</p>
          ${r.reply && !editing ? `<div class="rv-reply"><b>${ic('store')}${t('rv.reply')}</b>${esc(L(r.reply))}</div><div><button type="button" class="btn btn-ghost btn-sm" data-action="edit-reply" data-id="${r.id}">${ic('edit')}${t('own.replyEdit')}</button></div>`
          : `<form class="reply-form" data-form="reply" data-id="${r.id}"><label class="sr-only" for="rp-${r.id}">${t('own.replyPh')}</label><textarea class="textarea" id="rp-${r.id}" name="reply" maxlength="600" placeholder="${t('own.replyPh')}">${r.reply ? esc(L(r.reply)) : ''}</textarea><div class="row">${r.reply ? `<button type="button" class="btn btn-ghost btn-sm" data-action="edit-reply" data-id="">${t('common.cancel')}</button>` : ''}<button type="submit" class="btn btn-primary btn-sm">${t('own.replySend')}</button></div></form>`}
        </div>`; }).join('') : `<p class="muted">${t('own.noReviews')}</p>`}</div>`;
    } else if (sub === 'bookings') {
      const today = tDate(0);
      const list = db.bookings.filter(x => x.bizId === b.id && x.date >= today).sort((p, q) => (p.date + p.time).localeCompare(q.date + q.time));
      const dates = [...new Set(list.map(x => x.date))];
      const stCls = st => (st === 'confirmed' ? 'badge-ok' : st === 'done' ? 'badge-neutral' : 'badge-bad');
      content = head(t('own.nav.bookings')) + (list.length ? dates.map(ds => { const day = list.filter(x => x.date === ds); return `<div class="panel"><div class="panel-head"><h2>${fmtDay(ds)}${ds === today ? ` <span class="badge badge-primary">${t('book.today')}</span>` : ds === tDate(1) ? ` <span class="badge badge-neutral">${t('book.tomorrow')}</span>` : ''}</h2><span class="faint">${t('book.people', { n: N(day.filter(x => x.status === 'confirmed').reduce((s2, x) => s2 + x.size, 0)) })}</span></div>
        <div class="bk-rows">${day.map(x => { const cu = userById(x.userId); return `<div class="bk-row"><span class="bk-time tnum">${digits(x.time)}</span><span class="cell-user">${avatar(cu, 32)}<b>${esc(L(cu.name))}</b></span><span class="faint">${t('book.people', { n: N(x.size) })}</span><span class="badge ${stCls(x.status)}">${t('book.st.' + x.status)}</span><span class="actions">${x.status === 'confirmed' ? `<button type="button" class="btn btn-ghost btn-sm" data-action="book-done" data-id="${x.id}">${ic('check')}${t('book.markDone')}</button><button type="button" class="btn btn-ghost btn-sm" data-action="book-cancel" data-id="${x.id}">${t('book.cancel')}</button>` : ''}</span></div>`; }).join('')}</div></div>`; }).join('')
        : emptyState('calendar', t('own.nav.bookings'), t('book.ownerEmpty')));
    } else if (sub === 'qa') {
      const qs = db.qa.filter(x => x.bizId === b.id).sort((p, q) => (p.a ? 1 : 0) - (q.a ? 1 : 0) || q.ts - p.ts);
      content = head(t('own.nav.qa')) + (qs.length ? `<div class="list-rows">${qs.map(x => { const qu = userById(x.userId); return `<div class="own-review ${x.a ? '' : 'needs'}"><div class="rv-head">${avatar(qu, 34)}<div class="who"><b>${esc(L(x.q))}</b><span>${esc(L(qu.name))} · ${relTime(x.ts)}</span></div></div>${x.a ? `<div class="rv-reply"><b>${ic('store')}${t('qa.owner')}</b>${esc(L(x.a))}</div>` : `<form class="reply-form" data-form="own-qa" data-id="${x.id}"><label class="sr-only" for="qa-${x.id}">${t('own.qaPh')}</label><textarea class="textarea" id="qa-${x.id}" name="a" maxlength="400" placeholder="${t('own.qaPh')}"></textarea><div class="row"><button type="submit" class="btn btn-primary btn-sm">${t('own.qaSend')}</button></div></form>`}</div>`; }).join('')}</div>` : `<p class="muted">${t('own.qaNone')}</p>`);
    } else if (sub === 'info') {
      content = head(t('own.nav.info')) + `<form class="panel" data-form="own-info" novalidate><div class="form-grid">
        <div class="field"><label for="oiNameFa">${t('own.info.nameFa')}</label><input class="input" id="oiNameFa" name="nameFa" value="${esc(b.name.fa)}" required maxlength="60"></div>
        <div class="field"><label for="oiNameEn">${t('own.info.nameEn')}</label><input class="input" id="oiNameEn" name="nameEn" dir="ltr" value="${esc(b.name.en)}" required maxlength="60"></div>
        <div class="field"><label for="oiPhone">${t('wiz.phone')}</label><input class="input tnum" id="oiPhone" name="phone" dir="ltr" value="${esc(b.phone)}" maxlength="16"></div>
        <div class="field"><span class="label">${t('wiz.price')}</span><div class="price-pick">${[1, 2, 3, 4].map(p => `<label class="check"><input type="radio" name="price" value="${p}" ${b.price === p ? 'checked' : ''}>${'$'.repeat(p)}</label>`).join('')}</div></div>
        <div class="field"><label for="oiO">${t('wiz.opens')}</label><input class="input tnum" id="oiO" name="o" type="time" value="${b.hours.o === '24:00' ? '23:59' : b.hours.o}"></div>
        <div class="field"><label for="oiC">${t('wiz.closes')}</label><input class="input tnum" id="oiC" name="c" type="time" value="${b.hours.c === '24:00' ? '00:00' : b.hours.c}"></div>
        <div class="field span-2"><label for="oiAboutFa">${t('own.info.aboutFa')}</label><textarea class="textarea" id="oiAboutFa" name="aboutFa" maxlength="600">${esc(b.about.fa)}</textarea></div>
        <div class="field span-2"><label for="oiAboutEn">${t('own.info.aboutEn')}</label><textarea class="textarea" id="oiAboutEn" name="aboutEn" dir="ltr" maxlength="600">${esc(b.about.en)}</textarea></div>
        <div class="field span-2"><span class="label">${t('biz.amenities')}</span><div style="display:flex;flex-wrap:wrap;gap:8px">${['wifi', 'parking', 'card', 'outdoor', 'wheelchair', 'reserve', 'delivery', 'kids', 'ac', 'appoint'].map(a => `<label class="check"><input type="checkbox" name="amen" value="${a}" ${b.amen.includes(a) ? 'checked' : ''}>${t('amen.' + a)}</label>`).join('')}</div></div>
      </div><div class="modal-actions" style="margin-top:20px"><button type="submit" class="btn btn-primary">${t('me.save')}</button></div></form>`;
    } else if (sub === 'offers') {
      const mine = (db.offers || []).filter(o => o.bizId === b.id).sort((x, y) => y.until - x.until);
      const paid = planOf(b) !== 'free';
      content = head(t('own.nav.offers')) + (paid ? `<form class="panel" data-form="offer" novalidate><div class="panel-head"><h2>${ic('tag')} ${t('offer.new')}</h2></div><div class="form-grid">
          <div class="field span-2"><label for="ofT">${t('offer.title')}</label><input class="input" id="ofT" name="title" maxlength="70" placeholder="${t('offer.titlePh')}" required></div>
          <div class="field"><label for="ofP">${t('offer.pctL')}</label><select class="select" id="ofP" name="pct">${[5, 10, 15, 20, 25, 30, 40, 50].map(p => `<option value="${p}" ${p === 15 ? 'selected' : ''}>${N(p)}٪</option>`).join('')}</select></div>
          <div class="field"><label for="ofD">${t('offer.days')}</label><select class="select" id="ofD" name="days">${[7, 14, 30].map(d => `<option value="${d}" ${d === 14 ? 'selected' : ''}>${t('offer.dayN', { n: N(d) })}</option>`).join('')}</select></div>
        </div><div class="modal-actions" style="margin-top:16px"><button type="submit" class="btn btn-primary">${ic('plus')}${t('offer.publish')}</button></div></form>`
        : `<div class="panel upsell">${ic('lock')}<div><b>${t('offer.lockT')}</b><p class="muted">${t('offer.lockB')}</p></div><a class="btn btn-primary btn-sm" href="#for-business">${ic('sparkle')}${t('own.upgrade')}</a></div>`)
        + `<div class="list-rows">${mine.length ? mine.map(o => { const live2 = o.until > Date.now(); return `<div class="lrow offer-row">${'<span class="of-pct">' + N(o.pct) + '٪</span>'}<div style="min-width:0"><h3>${esc(L(o.title))}</h3><p>${live2 ? t('offer.until', { d: fmtDate(o.until) }) : t('offer.ended')}</p></div><div class="lrow-end"><span class="badge ${live2 ? 'badge-ok' : 'badge-neutral'}">${t(live2 ? 'offer.live' : 'offer.endedB')}</span><button type="button" class="btn btn-ghost btn-sm" data-action="offer-del" data-id="${o.id}">${ic('trash')}${t('common.delete')}</button></div></div>`; }).join('') : `<p class="muted">${t('offer.none')}</p>`}</div>`;
    } else if (sub === 'photos') {
      content = head(t('own.nav.photos')) + `<label class="dropzone" id="ownDrop">${ic('upload')}<b>${t('own.photos.upload')}</b><span class="field-hint">${t('own.photos.hint')}</span><input type="file" accept="image/*" multiple data-upload="owner"></label>
        <div class="ph-manage">${b.photos.map((p, i) => `<div class="ph-tile"><button type="button" style="display:block;width:100%" data-action="lightbox" data-set="own:${b.id}" data-i="${i}" aria-label="${N(i + 1)}">${photo(p)}</button><div class="bar">${i === 0 ? `<span class="badge badge-primary">${t('own.photos.cover')}</span>` : `<button type="button" class="btn btn-ghost btn-sm" data-action="own-cover" data-i="${i}">${t('own.photos.makeCover')}</button>`}<button type="button" class="icon-btn" data-action="own-rm" data-i="${i}" aria-label="${t('own.photos.remove')}">${ic('trash')}</button></div></div>`).join('')}</div>`;
    } else {
      const an = analytics(b);
      const unansweredLine = unanswered ? `<div class="insight">${ic('info')}<span>${t('own.ins1', { n: N(unanswered) })} <a class="link-btn" href="#owner-reviews">${t('own.nav.reviews')}</a></span></div>` : `<div class="insight ok">${ic('check')}<span>${t('own.ins1ok')}</span></div>`;
      content = head(t('own.title')) + `
        <div class="tiles">
          <div class="tile"><span class="tl">${ic('eye')}${t('own.views')}</span><span class="tv">${N(an.views[0])}</span>${delta(an.views[0], an.views[1])}</div>
          <div class="tile"><span class="tl">${ic('phone')}${t('own.calls')}</span><span class="tv">${N(an.calls[0])}</span>${delta(an.calls[0], an.calls[1])}</div>
          <div class="tile"><span class="tl">${ic('route')}${t('own.dirs')}</span><span class="tv">${N(an.dirs[0])}</span>${delta(an.dirs[0], an.dirs[1])}</div>
          <div class="tile ${unanswered ? 'warn' : ''}"><span class="tl">${ic('star')}${t('own.rating')}</span><span class="tv">${bizCount(b) ? R1(bizRating(b)) : '–'}</span><span class="td flat">${t('biz.reviews', { n: N(bizCount(b)) })}</span></div>
        </div>
        <div class="two-col">
          <div class="panel"><div class="panel-head"><h2>${t('own.chartT')}</h2><span class="faint" style="font-size:.82rem">${t('own.last30')}</span></div>${areaChart(an.cur, an.labels, v => `${N(v)} ${lang === 'fa' ? 'بازدید' : 'views'}`)}</div>
          <div class="panel"><div class="panel-head"><h2>${t('own.insightsT')}</h2></div><div class="insights">${unansweredLine}
            ${(() => { const n = db.bookings.filter(x => x.bizId === b.id && x.date === tDate(0) && x.status === 'confirmed').length; return n ? `<div class="insight">${ic('calendar')}<span>${t('own.insBook', { n: N(n) })} <a class="link-btn" href="#owner-bookings">${t('own.nav.bookings')}</a></span></div>` : ''; })()}
            <div class="insight">${ic('camera')}<span>${t('own.ins2', { n: N(b.photos.length) })} <a class="link-btn" href="#owner-photos">${t('own.photos.upload')}</a></span></div>
            <div class="insight">${ic('clock')}<span>${t('own.ins3')} <a class="link-btn" href="#owner-info">${t('own.nav.info')}</a></span></div></div></div>
        </div>
        ${(() => { const pk = planOf(b), sb = db.subs && db.subs[b.id]; return `<div class="panel plan-panel"><div class="panel-head"><h2>${ic('award')}${t('own.plan')}</h2><span class="badge ${pk === 'free' ? 'badge-neutral' : 'badge-primary'}">${t('fb.' + pk)}</span></div>
          <p class="muted">${pk === 'free' ? t('own.planFree') : t(sb.trial ? 'own.planTrial' : 'own.planNext', { d: fmtDate(sb.until) }) + ' · ' + t('fb.co.invoice', { n: digits(sb.invoice) })}</p>
          <div class="plan-panel-actions"><a class="btn btn-primary btn-sm" href="#for-business">${ic('sparkle')}${t(pk === 'free' ? 'own.upgrade' : 'own.change')}</a>${pk !== 'free' ? `<button type="button" class="btn btn-ghost btn-sm" data-action="plan-cancel">${t('own.cancelSub')}</button>` : ''}</div></div>`; })()}
        <div class="panel"><div class="panel-head"><h2>${t('own.recent')}</h2><a class="link-more" href="#owner-reviews">${t('home.seeAll')} ${ic('arrow', 'flip-rtl')}</a></div>${rs.slice(0, 3).map(r => reviewHTML(r, b)).join('')}</div>`;
    }
    return dashLayout(items, sub ? 'owner-' + sub : 'owner', content);
  }

  function viewAdmin(sub) {
    const pend = db.pending.filter(p => p.status === 'pending').sort((a, b) => b.ts - a.ts);
    const openReps = db.reports.filter(r => r.status === 'open').sort((a, b) => b.ts - a.ts);
    const items = [
      { r: 'admin', ic: 'chart', label: t('adm.nav.overview') },
      { r: 'admin-approvals', ic: 'inbox', label: t('adm.nav.approvals'), cnt: pend.length },
      { r: 'admin-reports', ic: 'flag', label: t('adm.nav.reports'), cnt: openReps.length },
      { r: 'admin-categories', ic: 'grid', label: t('adm.nav.cats') },
      { r: 'admin-users', ic: 'users', label: t('adm.nav.users') }
    ];
    const extra = `<button type="button" class="btn btn-ghost btn-sm" data-action="adm-reset">${ic('sparkle')}${t('adm.reset')}</button>`;
    let content = '';
    const pendRow = (p, withActions) => {
      const sub = userById(p.submittedBy);
      const open = S.openDetail === p.id;
      return `<div class="q-item">${photo(p.photos[0] || { kind: 'art', cat: p.cat, seed: 4, crop: 0 })}
        <div style="min-width:0"><h3>${esc(L(p.name))}</h3><p>${esc(L(catById(p.cat)))} · ${esc(L(hood(p.hood)))}</p><p class="faint">${t('adm.submittedBy')}: ${esc(L(sub.name))} · ${relTime(p.ts)}</p></div>
        <div class="actions">${withActions ? `<button type="button" class="btn btn-ghost btn-sm" data-action="adm-detail" data-id="${p.id}" aria-expanded="${open}">${t('adm.details')}</button><button type="button" class="btn btn-danger btn-sm" data-action="adm-reject" data-id="${p.id}">${t('adm.reject')}</button><button type="button" class="btn btn-primary btn-sm" data-action="adm-approve" data-id="${p.id}">${ic('check')}${t('adm.approve')}</button>`
          : `<span class="badge ${p.status === 'approved' ? 'badge-ok' : 'badge-bad'}">${t('me.st.' + p.status)}</span>${p.status === 'approved' && p.bizId ? `<a class="btn btn-secondary btn-sm" href="${href(bizById(p.bizId) || { id: p.bizId })}">${t('me.viewPage')}</a>` : ''}`}</div>
        ${open ? `<div class="q-detail"><p>${esc(L(p.about))}</p><dl><dt>${t('wiz.addr')}</dt><dd>${esc(L(p.addr))}</dd><dt>${t('wiz.phone')}</dt><dd dir="ltr" style="text-align:start">${digits(p.phone)}</dd><dt>${t('biz.hours')}</dt><dd><span dir="ltr">${fmtTime(p.hours.o)} – ${fmtTime(p.hours.c)}</span>${(p.hours.off || []).length ? ` · ${t('biz.closed')}: ${t('days')[p.hours.off[0]]}` : ''}</dd><dt>${t('wiz.price')}</dt><dd>${priceHTML(p.price)}</dd></dl></div>` : ''}</div>`;
    };
    if (sub === 'approvals') {
      const done = db.pending.filter(p => p.status !== 'pending').sort((a, b) => (b.doneTs || 0) - (a.doneTs || 0)).slice(0, 5);
      content = `<div class="dash-title"><h1>${t('adm.nav.approvals')}</h1></div><div class="queue">${pend.length ? pend.map(p => pendRow(p, true)).join('') : emptyState('check', t('adm.noPending'), '')}</div>
        ${done.length ? `<div class="panel-head" style="margin:8px 0 0"><h2>${t('adm.processed')}</h2></div><div class="queue">${done.map(p => pendRow(p, false)).join('')}</div>` : ''}`;
    } else if (sub === 'reports') {
      content = `<div class="dash-title"><h1>${t('adm.nav.reports')}</h1></div>` + (openReps.length ? `<div class="queue">${openReps.map(rp => {
        const r = db.reviews.find(x => x.id === rp.reviewId), b = r && bizById(r.bizId), rep = userById(rp.reporterId), au = r && userById(r.userId);
        return `<div class="rep"><div class="rep-top"><span class="badge badge-bad">${ic('flag')}${t('report.' + rp.reason)}</span><span>${t('adm.reporter')}: ${esc(L(rep.name))} · ${relTime(rp.ts)}</span></div>
          ${r ? `<blockquote><div class="rating-row" style="margin-bottom:6px">${stars(r.rating, 13)}<b>${esc(L(au.name))}</b><span>· <a class="link-btn" href="${href(b)}">${esc(L(b.name))}</a></span></div>${esc(L(r.text))}</blockquote>` : `<p class="muted">${t('adm.reviewGone')}</p>`}
          <div class="modal-actions"><button type="button" class="btn btn-secondary btn-sm" data-action="adm-keep" data-id="${rp.id}">${t('adm.keep')}</button><button type="button" class="btn btn-danger btn-sm" data-action="adm-remove" data-id="${rp.id}">${ic('trash')}${t('adm.remove')}</button></div></div>`;
      }).join('')}</div>` : emptyState('shield', t('adm.noReports'), ''));
    } else if (sub === 'categories') {
      content = `<div class="dash-title"><h1>${t('adm.nav.cats')}</h1></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>${t('adm.catName')}</th><th>${t('adm.catNameEn')}</th><th>${t('adm.catCount')}</th><th></th></tr></thead><tbody>
        ${db.cats.map(c => { const n = db.businesses.filter(b => b.cat === c.id && b.status === 'live').length + db.pending.filter(p => p.cat === c.id && p.status === 'pending').length; return S.catEdit === c.id
          ? `<tr><td colspan="4"><form class="cat-row-edit" data-form="cat-save" data-id="${c.id}"><input class="input" name="fa" value="${esc(c.fa)}" required aria-label="${t('adm.catName')}"><input class="input" name="en" dir="ltr" value="${esc(c.en)}" required aria-label="${t('adm.catNameEn')}"><button type="submit" class="btn btn-primary btn-sm">${t('adm.save')}</button><button type="button" class="btn btn-ghost btn-sm" data-action="cat-edit" data-id="">${t('adm.cancel')}</button></form></td></tr>`
          : `<tr><td><span class="cell-user"><span class="sg-ic">${ic(c.icon)}</span><b>${esc(c.fa)}</b></span></td><td dir="ltr" style="text-align:start">${esc(c.en)}</td><td class="tnum">${N(n)}</td><td><div class="actions"><button type="button" class="btn btn-ghost btn-sm" data-action="cat-edit" data-id="${c.id}">${ic('edit')}${t('adm.edit')}</button><button type="button" class="btn btn-ghost btn-sm" data-action="cat-del" data-id="${c.id}" ${n ? `disabled title="${t('adm.catInUse')}"` : ''}>${ic('trash')}${t('adm.delete')}</button></div></td></tr>`; }).join('')}
        </tbody></table></div>
        <form class="panel" data-form="cat-add" novalidate><div class="panel-head"><h2>${t('adm.catAdd')}</h2></div><div class="form-grid"><div class="field"><label for="ncFa">${t('adm.catName')}</label><input class="input" id="ncFa" name="fa" required maxlength="30"></div><div class="field"><label for="ncEn">${t('adm.catNameEn')}</label><input class="input" id="ncEn" name="en" dir="ltr" required maxlength="30"></div></div><div class="modal-actions" style="margin-top:14px"><button class="btn btn-primary" type="submit">${ic('plus')}${t('adm.catAdd')}</button></div></form>`;
    } else if (sub === 'users') {
      content = `<div class="dash-title"><h1>${t('adm.nav.users')}</h1></div>
        <div class="field" style="max-width:360px"><label class="sr-only" for="userQ">${t('adm.userSearch')}</label><input class="input" id="userQ" type="search" data-input="userq" value="${esc(S.userQ)}" placeholder="${t('adm.userSearch')}"></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>${t('adm.col.user')}</th><th>${t('adm.col.phone')}</th><th>${t('adm.col.role')}</th><th>${t('adm.col.reviews')}</th><th>${t('adm.col.joined')}</th><th>${t('adm.col.status')}</th><th></th></tr></thead><tbody id="userRows">${userRows()}</tbody></table></div>`;
    } else {
      const added = db.reviews.filter(r => r.added && Date.now() - r.ts < 7 * DAY).length;
      const weekly = D.weekly.slice(); weekly[weekly.length - 1] += added;
      const wl = weekly.map((_, i) => i === weekly.length - 1 ? t('adm.thisWeek') : t('adm.weekN', { n: N(i + 1) }));
      content = `<div class="dash-title"><h1>${t('adm.title')}</h1></div>
        <div class="tiles">
          <a class="tile" href="#search"><span class="tl">${ic('store')}${t('adm.live')}</span><span class="tv">${N(liveBiz().length)}</span></a>
          <a class="tile ${pend.length ? 'warn' : ''}" href="#admin-approvals"><span class="tl">${ic('inbox')}${t('adm.pending')}</span><span class="tv">${N(pend.length)}</span></a>
          <a class="tile ${openReps.length ? 'warn' : ''}" href="#admin-reports"><span class="tl">${ic('flag')}${t('adm.openReports')}</span><span class="tv">${N(openReps.length)}</span></a>
          <a class="tile" href="#admin-users"><span class="tl">${ic('users')}${t('adm.users')}</span><span class="tv">${N(db.users.length)}</span></a>
        </div>
        <div class="two-col"><div class="panel"><div class="panel-head"><h2>${t('adm.chartT')}</h2></div>${barChart(weekly, wl, true)}</div>
          <div class="panel"><div class="panel-head"><h2>${t('adm.activity')}</h2></div><div class="insights">
            ${pend.map(p => `<a class="insight" href="#admin-approvals">${ic('inbox')}<span><b>${esc(L(p.name))}</b> · ${t('adm.pending')} · ${relTime(p.ts)}</span></a>`).join('')}
            ${openReps.map(rp => `<a class="insight" href="#admin-reports">${ic('flag')}<span>${t('report.' + rp.reason)} · ${relTime(rp.ts)}</span></a>`).join('')}
            ${!pend.length && !openReps.length ? `<div class="insight ok">${ic('check')}<span>${t('adm.noPending')}</span></div>` : ''}</div></div></div>`;
    }
    return dashLayout(items, sub ? 'admin-' + sub : 'admin', content, extra);
  }
  function userRows() {
    const q = norm(S.userQ).trim(), self = db.session;
    const qd = toAscii(q).replace(/\D/g, '');
    const list = db.users.filter(u => !q || norm(u.name.fa + ' ' + u.name.en).includes(q) || (qd && u.phone.includes(qd)));
    if (!list.length) return `<tr><td colspan="7" class="muted" style="text-align:center;padding:28px">${t('adm.noUsers')}</td></tr>`;
    return list.map(u => `<tr><td><span class="cell-user">${avatar(u, 32)}<b>${esc(L(u.name))}${u.id === self ? ` <span class="badge badge-primary">${t('adm.self')}</span>` : ''}</b></span></td>
      <td class="tnum" dir="ltr" style="text-align:start">${digits(u.phone)}</td><td><span class="badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'owner' ? 'badge-warn' : 'badge-neutral'}">${t('role.' + u.role)}</span></td>
      <td class="tnum">${N(userReviewCount(u))}</td><td>${fmtDate(u.joined, { year: 'numeric', month: 'short' })}</td>
      <td><span class="badge ${u.status === 'active' ? 'badge-ok' : 'badge-bad'}">${t(u.status === 'active' ? 'adm.active' : 'adm.banned')}</span></td>
      <td><div class="actions">${u.id === self ? '' : `<button type="button" class="btn ${u.status === 'active' ? 'btn-ghost' : 'btn-secondary'} btn-sm" data-action="user-ban" data-id="${u.id}">${t(u.status === 'active' ? 'adm.ban' : 'adm.unban')}</button>`}</div></td></tr>`).join('');
  }

  /* ---------- Static pages ---------- */
  function viewAbout() {
    const live = liveBiz();
    return `<div class="wrap prose-page"><div class="page-head"><h1>${t('about.title')}</h1><p>${t('about.lead')}</p></div>
      <div class="stats-row" style="margin-top:20px"><div class="stat"><b>${N(live.length)}</b><span>${t('home.stat.biz')}</span></div><div class="stat"><b>${N(live.reduce((s, b) => s + bizCount(b), 0))}</b><span>${t('home.stat.reviews')}</span></div><div class="stat"><b>${N(db.users.length)}</b><span>${t('adm.users')}</span></div><div class="stat"><b>${N(db.cats.length)}</b><span>${t('home.cats')}</span></div></div>
      <div class="values">${[['shield', 1], ['pin', 2], ['globe', 3]].map(([i, k]) => `<div class="value"><div class="hi">${ic(i)}</div><h3>${t('about.v' + k + 't')}</h3><p>${t('about.v' + k + 'b')}</p></div>`).join('')}</div>
      <div class="modal-actions" style="justify-content:flex-start;margin-top:28px"><a class="btn btn-primary" href="#search">${t('me.explore')}</a><a class="btn btn-secondary" href="#contact">${t('footer.contact')}</a></div></div>`;
  }
  function viewPrivacy() {
    return `<div class="wrap prose-page"><div class="page-head"><h1>${t('privacy.title')}</h1><p>${t('privacy.lead')}</p></div>
      <div class="policy">${[1, 2, 3].map(k => `<section><h2>${t('privacy.s' + k + 't')}</h2><p>${t('privacy.s' + k + 'b')}</p></section>`).join('')}</div>
      <div class="note">${ic('info')}<span>${t('privacy.demo')}</span></div></div>`;
  }
  function viewContact() {
    const u = me();
    return `<div class="wrap prose-page"><div class="page-head"><h1>${t('contact.title')}</h1><p>${t('contact.lead')}</p></div>
      <form class="panel" data-form="contact" novalidate style="margin-top:20px"><div class="form-grid">
        <div class="field"><label for="ctName">${t('contact.name')}</label><input class="input" id="ctName" name="name" required maxlength="60" value="${u ? esc(L(u.name)) : ''}"></div>
        <div class="field"><label for="ctEmail">${t('contact.email')}</label><input class="input" id="ctEmail" name="email" type="email" dir="ltr" required maxlength="80" value="${u ? esc(u.email || '') : ''}"></div>
        <div class="field span-2"><label for="ctTopic">${t('contact.topic')}</label><select class="select" id="ctTopic" name="topic">${t('contact.topics').map(x => `<option>${esc(x)}</option>`).join('')}</select></div>
        <div class="field span-2"><label for="ctMsg">${t('contact.msg')}</label><textarea class="textarea" id="ctMsg" name="msg" required maxlength="1000"></textarea></div>
      </div><div class="modal-actions" style="margin-top:16px"><button class="btn btn-primary" type="submit">${ic('mail')}${t('contact.send')}</button></div></form></div>`;
  }
  const PLAN_PRICE = { free: 0, pro: 490000, premium: 1290000 };
  const PLAN_ROWS = [['page', 1, 1, 1], ['reply', 1, 1, 1], ['badge', 1, 1, 1], ['photos', '10', 'u', 'u'], ['book', 0, 1, 1], ['stats', 0, 1, 1], ['offers', 0, 1, 1], ['home', 0, 0, 1], ['branches', 0, 0, 1], ['manager', 0, 0, 1]];
  const planPrice = (k, bill) => bill === 'y' ? PLAN_PRICE[k] * 10 : PLAN_PRICE[k];
  function viewForBiz() {
    const bill = S.bill || 'm', sel = S.planSel || 'pro', u = me();
    const ob = u && (u.role === 'owner' || u.role === 'admin') ? ownerBiz() : null;
    const cur = ob ? planOf(ob) : null, sub = ob && db.subs ? db.subs[ob.id] : null;
    const keys = ['free', 'pro', 'premium'];
    const cta = k => {
      if (cur === k) return `<button type="button" class="btn btn-secondary btn-block" disabled>${ic('check')}${t('fb.current')}</button>`;
      if (k === 'free') return `<button type="button" class="btn btn-secondary btn-block" data-action="plan-go" data-plan="free">${t(cur ? 'fb.downgrade' : 'fb.start')}</button>`;
      return `<button type="button" class="btn ${k === 'pro' ? 'btn-primary' : 'btn-dark'} btn-block" data-action="plan-go" data-plan="${k}">${t(k === 'pro' && !hadTrial(ob) ? 'fb.ctaPro' : 'fb.cta', { p: t('fb.' + k) })}</button>`;
    };
    const priceBlock = k => {
      if (!PLAN_PRICE[k]) return `<div class="pr">${t('biz.free')}</div><div class="pr-note">${t('fb.freeNote')}</div>`;
      const p = planPrice(k, bill);
      return `<div class="pr">${N(p)} <small>${t('biz.toman')} / ${t(bill === 'y' ? 'fb.year' : 'fb.month')}</small></div>
        <div class="pr-note">${bill === 'y' ? t('fb.perMonthEq', { p: N(Math.round(p / 12 / 1000) * 1000) }) : t('fb.yearlyHint', { p: N(planPrice(k, 'y')) })}</div>`;
    };
    const cell = v => v === 1 ? `<span class="yes">${ic('check')}<span class="sr-only">${t('common.yes')}</span></span>` : v === 0 ? `<span class="no" aria-label="${t('common.no')}">–</span>` : v === 'u' ? t('fb.unlimited') : N(Number(v));
    return `<div class="wrap" style="padding-bottom:64px"><div class="page-head" style="text-align:center;max-width:720px;margin-inline:auto"><span class="eyebrow">${ic('store')}${t('home.ownerEyebrow')}</span><h1>${t('fb.title')}</h1><p style="margin-inline:auto">${t('fb.lead')}</p></div>
      ${ob ? `<div class="plan-now">${ic('store')}<span>${t('fb.curLine', { b: esc(L(ob.name)), p: t('fb.' + cur) })}${sub && cur !== 'free' ? ' · ' + t(sub.trial ? 'own.planTrial' : 'own.planNext', { d: fmtDate(sub.until) }) : ''}</span><a class="link-btn" href="#owner">${t('own.title')}</a></div>` : ''}
      <div class="bill-toggle" role="radiogroup" aria-label="${t('fb.co.period')}">
        <button type="button" role="radio" aria-checked="${bill === 'm'}" data-action="plan-bill" data-v="m">${t('fb.billM')}</button>
        <button type="button" role="radio" aria-checked="${bill === 'y'}" data-action="plan-bill" data-v="y">${t('fb.billY')}<span class="save">${t('fb.save2')}</span></button>
      </div>
      <div class="plans" role="radiogroup" aria-label="${t('footer.plans')}">${keys.map(k => `<div class="plan ${k === 'pro' ? 'pop' : ''} ${sel === k ? 'sel' : ''}" role="radio" aria-checked="${sel === k}" tabindex="0" data-action="plan-pick" data-plan="${k}">
        ${k === 'pro' ? `<span class="badge badge-primary pop-badge">${t('fb.popular')}</span>` : ''}${cur === k ? `<span class="badge badge-ok cur-badge">${ic('check')}${t('fb.current')}</span>` : ''}
        <div class="plan-top"><h3>${t('fb.' + k)}</h3><span class="radio-dot" aria-hidden="true"></span></div><p class="plan-for">${t('fb.for.' + k)}</p>
        ${priceBlock(k)}
        <ul>${t('fb.' + k + 'F').map(x => `<li>${ic('check')}<span>${esc(x)}</span></li>`).join('')}</ul>${cta(k)}
        ${k === 'premium' ? `<button type="button" class="link-btn plan-talk" data-action="plan-req" data-plan="premium">${ic('phone')}${t('fb.talk')}</button>` : ''}</div>`).join('')}</div>
      <div class="plan-bar" aria-live="polite"><div><span class="faint">${t('fb.selected')}</span><b>${t('fb.' + sel)}${PLAN_PRICE[sel] ? ` · ${N(planPrice(sel, bill))} ${t('biz.toman')} / ${t(bill === 'y' ? 'fb.year' : 'fb.month')}` : ` · ${t('biz.free')}`}</b></div>
        ${cur === sel ? `<button type="button" class="btn btn-secondary" disabled>${t('fb.current')}</button>` : `<button type="button" class="btn btn-primary" data-action="plan-go" data-plan="${sel}">${t('fb.continue')}${ic('arrow', 'flip-rtl')}</button>`}</div>
      <section class="compare"><h2>${t('fb.compare')}</h2><div class="table-wrap"><table class="compare-table"><thead><tr><th scope="col"><span class="sr-only">${t('fb.feature')}</span></th>${keys.map(k => `<th scope="col" class="${sel === k ? 'sel' : ''}">${t('fb.' + k)}</th>`).join('')}</tr></thead>
        <tbody>${PLAN_ROWS.map(([key, ...v]) => `<tr><th scope="row">${t('fb.r.' + key)}</th>${v.map((x, i) => `<td class="${sel === keys[i] ? 'sel' : ''}">${cell(x)}</td>`).join('')}</tr>`).join('')}
        <tr class="price-row"><th scope="row">${t('fb.priceRow')}</th>${keys.map(k => `<td class="${sel === k ? 'sel' : ''}">${PLAN_PRICE[k] ? N(planPrice(k, bill)) : t('biz.free')}</td>`).join('')}</tr></tbody></table></div></section>
      <div class="pay-note">${ic('shield')}<span>${t('fb.payNote')}</span></div>
      <div class="faq" style="max-width:760px;margin-inline:auto"><h2 style="font-size:1.3rem;margin-bottom:6px">${t('fb.faqT')}</h2>${[1, 2, 3, 4].map(k => `<details><summary>${t('fb.q' + k)}${ic('chev-d')}</summary><p>${t('fb.a' + k)}</p></details>`).join('')}</div></div>`;
  }
  const hadTrial = b => !!(b && db.trials && db.trials.includes(b.id));
  function ownerBizList() {
    const u = me(); if (!u) return [];
    if (u.role === 'admin') return liveBiz();
    return (u.bizIds || []).map(bizById).filter(b => b && b.status === 'live');
  }
  function coCalc(c) {
    const b = bizById(c.bizId);
    const base = planPrice(c.plan, c.bill);
    const trial = c.plan === 'pro' && !hadTrial(b);
    const sub = trial ? base : 0;
    const disc = c.code ? Math.round((base - sub) * 0.2) : 0;
    const net = base - sub - disc, vat = Math.round(net * 0.1);
    return { b, base, trial, sub, disc, vat, total: net + vat };
  }
  function drawCheckout() {
    const c = S.co; if (!c) return;
    const x = coCalc(c), pName = t('fb.' + c.plan), per = t(c.bill === 'y' ? 'fb.year' : 'fb.month');
    const list = ownerBizList();
    const body = c.done ? `<div class="co-done"><span class="big-check">${ic('check')}</span><h3>${t('fb.co.doneT', { p: pName, b: esc(L(x.b.name)) })}</h3>
        <p class="muted">${t('fb.co.doneB', { d: fmtDate(c.done.until), n: digits(c.done.invoice) })}</p>
        <div class="co-unlocked"><b>${t('fb.co.unlocked')}</b><ul>${t('fb.' + c.plan + 'F').slice(1).map(f => `<li>${ic('check')}<span>${esc(f)}</span></li>`).join('')}</ul></div>
        <div class="modal-actions"><a class="btn btn-secondary" href="${href(x.b)}" data-action="modal-go">${t('fb.co.page')}</a><a class="btn btn-primary" href="#owner" data-action="modal-go">${t('fb.co.dash')}</a></div></div>`
      : `<div class="co">
        <div class="co-row"><label for="coBiz">${t('fb.co.biz')}</label>${list.length > 1 ? `<select class="select" id="coBiz" data-change="co-biz">${list.map(b => `<option value="${b.id}" ${b.id === c.bizId ? 'selected' : ''}>${esc(L(b.name))}</option>`).join('')}</select>` : `<b id="coBiz">${esc(L(x.b.name))}</b>`}</div>
        <div class="co-row"><span>${t('fb.co.period')}</span><div class="seg" role="radiogroup" aria-label="${t('fb.co.period')}"><button type="button" role="radio" aria-checked="${c.bill === 'm'}" data-action="co-bill" data-v="m">${t('fb.billM')}</button><button type="button" role="radio" aria-checked="${c.bill === 'y'}" data-action="co-bill" data-v="y">${t('fb.billY')}</button></div></div>
        <div class="co-lines">
          <div><span>${pName} · ${per}</span><b class="tnum">${N(x.base)}</b></div>
          ${x.trial ? `<div class="ok"><span>${ic('gift')}${t('fb.co.trial')}</span><b class="tnum">−${N(x.sub)}</b></div>` : ''}
          ${x.disc ? `<div class="ok"><span>${ic('tag')}${t('fb.co.codeLine', { c: esc(c.code) })}</span><b class="tnum">−${N(x.disc)}</b></div>` : ''}
          <div><span>${t('fb.co.vat')}</span><b class="tnum">${N(x.vat)}</b></div>
          <div class="total"><span>${t('fb.co.total')}</span><b class="tnum">${N(x.total)} <small>${t('biz.toman')}</small></b></div>
          ${x.trial ? `<p class="faint co-after">${t('fb.co.after', { d: fmtDate(Date.now() + 14 * DAY), p: N(Math.round(x.base * 1.1)), per })}</p>` : ''}
        </div>
        ${x.trial ? '' : `<form class="co-code" data-form="co-code" novalidate><div class="field ${c.codeErr ? 'err' : ''}" style="flex:1"><label class="sr-only" for="coCode">${t('fb.co.code')}</label><input class="input" id="coCode" name="code" dir="ltr" autocomplete="off" maxlength="20" placeholder="${t('fb.co.code')}" value="${esc(c.codeInput || '')}">${c.codeErr ? `<span class="field-err">${t('fb.co.codeBad')}</span>` : ''}</div><button type="submit" class="btn btn-secondary">${t('fb.co.apply')}</button></form><p class="field-hint" style="margin-top:-6px">${t('fb.co.codeHint')}</p>`}
        <p class="note">${ic('shield')}<span>${t('fb.co.demo')}</span></p>
        <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="modal-close">${t('common.cancel')}</button><button type="button" class="btn btn-primary" data-action="co-pay" ${c.paying ? 'disabled' : ''}>${c.paying ? `<span class="spin" aria-hidden="true"></span>${t('fb.co.paying')}` : (x.total ? `${ic('lock')}${t('fb.co.pay', { p: N(x.total) })}` : `${ic('gift')}${t('fb.co.startTrial')}`)}</button></div></div>`;
    const m = $('#modalRoot .modal.co-modal');
    const html = `${modalHead(t(c.done ? 'fb.co.doneH' : 'fb.co.title', { p: pName }))}${body}`;
    if (m) m.innerHTML = html; else openModal(html, 'co-modal');
  }

  /* ================= Lists, similar places ================= */
  function listItems(l) {
    const late = b => { const o = toMin(b.hours.o), c = toMin(b.hours.c); return (o === 0 && c >= 1440) || c <= o || c >= 23 * 60; };
    const rules = {
      late,
      laptop: b => b.cat === 'cafe' && b.amen.includes('wifi'),
      top: b => bizRating(b) >= 4.7 && bizCount(b) >= 20,
      family: b => b.amen.includes('kids'),
      care: b => b.cat === 'beauty' || b.cat === 'fitness'
    };
    const rule = rules[l.rule] || (() => false);
    return liveBiz().filter(rule).sort((a, b) => rankScore(b) - rankScore(a));
  }
  function listReason(l, b) {
    if (l.rule === 'late') return b.hours.o === '00:00' && b.hours.c === '24:00' ? t('biz.24h') : t('list.until', { t: fmtTime(b.hours.c) });
    if (l.rule === 'laptop') return t('amen.wifi');
    if (l.rule === 'family') return t('amen.kids');
    if (l.rule === 'top') return t('list.reason.rating', { r: R1(bizRating(b)), n: N(bizCount(b)) });
    return L(catById(b.cat));
  }
  function listCards(lists) {
    const cards = lists.map(l => ({ l, items: listItems(l) })).filter(x => x.items.length >= 2);
    return `<div class="list-row">${cards.map(({ l, items }) => {
      const ph = items.slice(0, 3).map(b => b.photos[0]);
      while (ph.length < 3) ph.push(items[0].photos[ph.length] || items[0].photos[0]);
      return `<a class="list-card" href="#list-${l.id}"><span class="lc-mosaic">${ph.map(p => photo(p)).join('')}</span><span class="lc-body"><span class="lc-ic">${ic(l.icon)}</span><span><b>${t(l.t)}</b><span>${t('list.count', { n: N(items.length) })}</span></span></span></a>`;
    }).join('')}</div>`;
  }
  function viewList(id) {
    const l = D.lists.find(x => x.id === id);
    if (!l) return `<div class="wrap" style="padding-block:60px">${emptyState('search', t('list.notFound'), '', `<a class="btn btn-primary" href="#home">${t('biz.backHome')}</a>`)}</div>`;
    const items = listItems(l);
    const ph = items.slice(0, 3).map(b => b.photos[0]);
    while (items.length && ph.length < 3) ph.push(items[0].photos[ph.length] || items[0].photos[0]);
    return `<div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="#home">${t('common.home')}</a>${ic('chev-r', 'flip-rtl')}<span>${t('home.lists')}</span>${ic('chev-r', 'flip-rtl')}<span>${t(l.t)}</span></nav>
      <header class="list-hero"><div class="lh-mosaic">${ph.map(p => photo(p)).join('')}</div>
        <div class="lh-copy"><span class="eyebrow">${ic(l.icon)}${t('list.eyebrow')}</span><h1>${t(l.t)}</h1><p>${t(l.b)}</p>
          <div class="lh-meta"><span>${t('list.count', { n: N(items.length) })}</span><button type="button" class="btn btn-secondary btn-sm" data-action="share">${ic('share')}${t('list.share')}</button></div></div></header>
      <div class="results-layout ${S.mobileMap ? 'show-map' : ''}">
        <ol class="list-items results-list">${items.map((b, i) => `<li class="li-item" data-row="${b.id}"><span class="li-rank" aria-hidden="true">${digits(i + 1)}</span>
          <a href="${href(b)}" class="li-ph" tabindex="-1" aria-hidden="true">${photo(b.photos[0])}</a>
          <div class="li-body"><h3><a href="${href(b)}">${esc(L(b.name))}</a>${b.verified ? verifiedMark() : ''}</h3>${ratingRow(b)}
            <div class="meta-row"><span>${esc(L(catById(b.cat)))}</span>${dot}<span>${esc(L(hood(b.hood)))}</span>${dot}${priceHTML(b.price)}</div>
            <p class="li-why">${ic('check')}<span>${esc(listReason(l, b))}</span></p></div>${favBtn(b)}</li>`).join('')}</ol>
        <aside class="results-map" aria-label="${t('results.map')}"><div id="resultsMapEl" style="height:100%"></div></aside>
      </div>
      <button type="button" class="btn btn-primary btn-lg map-toggle" data-action="toggle-map">${S.mobileMap ? ic('list') + t('results.list') : ic('map') + t('results.map')}</button>
      <section class="section" style="padding-top:8px"><div class="section-head"><h2>${t('home.lists')}</h2></div>${listCards(D.lists.filter(x => x.id !== id))}</section>
    </div>`;
  }
  function similarTo(b) {
    return liveBiz().filter(x => x.id !== b.id)
      .map(x => ({ x, s: (x.cat === b.cat ? 0 : 20) + kmBetween(x, b) - rankScore(x) * 0.25 }))
      .sort((p, q) => p.s - q.s).slice(0, 3).map(p => p.x);
  }

  /* ================= Popular times ================= */
  const BUSY = {
    food: [[13.5, .7, 1.2], [20.5, 1, 1.6]], cafe: [[10.5, .65, 1.4], [18, 1, 2]], auto: [[10, .9, 1.6], [16.5, .7, 1.5]],
    beauty: [[12, .7, 1.6], [17.5, 1, 1.5]], home: [[9.5, .8, 1.8], [16, .7, 2]], health: [[11, .9, 1.7], [18.5, .8, 1.6]],
    shop: [[13, .5, 1.5], [19.5, 1, 1.8]], fitness: [[7.5, .8, 1.1], [19, 1, 1.6]]
  };
  function busyData(b, day) {
    if ((b.hours.off || []).includes(day)) return null;
    let o = toMin(b.hours.o) / 60, c = toMin(b.hours.c) / 60;
    if (o === 0 && c >= 24) c = 24; else if (c <= o) c += 24;
    const peaks = BUSY[b.cat] || BUSY.shop, r = rng(b.id * 131 + day * 17);
    const wk = (day === 4 || day === 5) && ['food', 'cafe', 'shop'].includes(b.cat) ? 1.2 : 1;
    const hrs = [];
    for (let hh = Math.floor(o); hh < Math.ceil(c); hh++) {
      let v = peaks.reduce((s, [ph, w, sd]) => s + w * Math.exp(-Math.pow(hh + .5 - ph, 2) / (2 * sd * sd)), 0);
      v = clamp((v * .85 + .12) * wk * (.86 + r() * .28), .06, 1);
      hrs.push({ h: hh % 24, v });
    }
    return hrs;
  }
  function busyBlock(b) {
    const today = tehranNow().day, day = S.busyDay == null ? today : S.busyDay;
    const data = busyData(b, day);
    const chips = [6, 0, 1, 2, 3, 4, 5].map(d => `<button type="button" class="chip" data-action="busy-day" data-v="${d}" aria-pressed="${d === day}">${d === today ? t('book.today') : t('days')[d]}</button>`).join('');
    let body = `<p class="muted">${t('busy.closed')}</p>`;
    if (data && data.length) {
      const nowH = Math.floor(tehranNow().min / 60);
      const W = 640, H = 156, pb = 24, bw = W / data.length;
      const cur = day === today ? data.find(d => d.h === nowH) : null;
      const peak = data.reduce((m, d) => (d.v > m.v ? d : m), data[0]);
      const lvl = v => (v < .38 ? 'low' : v < .68 ? 'mid' : 'high');
      const head = cur ? t('busy.nowIs', { s: t('busy.' + lvl(cur.v)) }) : t('busy.peak', { h: digits(String(peak.h).padStart(2, '0') + ':00') });
      body = `<p class="busy-head"><b>${head}</b><span class="faint">${t('busy.est')}</span></p>
        <div class="chart-wrap busy"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('busy.title')}">${data.map((d, i) => {
          const hh = (H - pb - 18) * d.v, x = i * bw + bw * .12, on = cur && d.h === cur.h;
          return `<rect class="bz ${on ? 'on' : ''}" x="${x.toFixed(1)}" y="${(H - pb - hh).toFixed(1)}" width="${(bw * .76).toFixed(1)}" height="${hh.toFixed(1)}" rx="4"/>${d.h % 3 === 0 ? `<text class="ch-axis" x="${(x + bw * .38).toFixed(1)}" y="${H - 6}" text-anchor="middle">${digits(d.h)}</text>` : ''}${on ? `<text class="ch-val" x="${(x + bw * .38).toFixed(1)}" y="${(H - pb - hh - 6).toFixed(1)}" text-anchor="middle">${t('busy.now')}</text>` : ''}`;
        }).join('')}</svg></div>`;
    }
    return `<div class="block" id="busyBlock"><h2>${t('busy.title')}</h2><div class="chips-row">${chips}</div>${body}</div>`;
  }

  /* ================= Booking ================= */
  const bookKind = b => (b.amen.includes('reserve') ? 'reserve' : b.amen.includes('appoint') ? 'appoint' : null);
  function slotsFor(b, off) {
    const ds = tDate(off), dow = dowOf(ds);
    if ((b.hours.off || []).includes(dow)) return { closed: true, slots: [] };
    const o = toMin(b.hours.o); let c = toMin(b.hours.c);
    if (c <= o || c > 23 * 60 + 30) c = 23 * 60 + 30;
    const r = rng(b.id * 97 + off * 13), out = [];
    const nowMin = off === 0 ? tehranNow().min : -1;
    for (let m = Math.ceil(o / 30) * 30; m <= c - 60; m += 30) {
      const taken = db.bookings.filter(x => x.bizId === b.id && x.date === ds && x.time === hhmm(m) && x.status === 'confirmed').length;
      const full = r() < .2 || taken >= 2;
      if (m > nowMin + 30) out.push({ m, label: hhmm(m), full });
    }
    return { closed: false, slots: out };
  }
  function bookCard(b) {
    const kind = bookKind(b);
    if (!kind) return '';
    if (!S.book || S.book.bizId !== b.id) S.book = { bizId: b.id, off: 0, size: 2, time: null };
    const bk = S.book, sl = slotsFor(b, bk.off);
    const days = [0, 1, 2, 3, 4, 5, 6].map(off => {
      const ds = tDate(off), dow = dowOf(ds), closed = (b.hours.off || []).includes(dow);
      const lbl = off === 0 ? t('book.today') : off === 1 ? t('book.tomorrow') : t('days')[dow];
      return `<button type="button" class="bd" data-action="book-day" data-v="${off}" aria-pressed="${bk.off === off}" ${closed ? 'disabled' : ''}><span>${lbl}</span><b>${fmtDay(ds, { day: 'numeric', month: 'short' })}</b></button>`;
    }).join('');
    const slots = sl.closed ? `<p class="muted book-msg">${t('book.closed')}</p>`
      : !sl.slots.length ? `<p class="muted book-msg">${t('book.noSlots')}</p>`
      : `<div class="slots">${sl.slots.map(s => `<button type="button" class="slot ${bk.time === s.label ? 'on' : ''}" data-action="book-time" data-v="${s.label}" ${s.full ? `disabled aria-label="${digits(s.label)} ${t('book.full')}"` : ''}>${digits(s.label)}</button>`).join('')}</div>`;
    return `<div class="side-card book-card" id="bookCard"><h3><span>${ic('calendar')} ${t('book.' + kind)}</span></h3>
      <div class="book-days">${days}</div>
      ${kind === 'reserve' ? `<div class="book-size"><span>${t('book.size')}</span><div class="stepper"><button type="button" data-action="book-size" data-d="-1" aria-label="−" ${bk.size <= 1 ? 'disabled' : ''}>${ic('minus')}</button><b class="tnum" aria-live="polite">${N(bk.size)}</b><button type="button" data-action="book-size" data-d="1" aria-label="+" ${bk.size >= 12 ? 'disabled' : ''}>${ic('plus')}</button></div></div>` : ''}
      ${slots}
      <button type="button" class="btn btn-primary btn-block" data-action="book" ${bk.time ? '' : 'disabled'}>${bk.time ? t(kind === 'reserve' ? 'book.cta' : 'book.ctaAppoint', { t: digits(bk.time) }) : t('book.pickTime')}</button>
      <p class="field-hint book-hint">${t('book.hint')}</p></div>`;
  }
  function redrawBook() { const b = biz(), el = $('#bookCard'); if (b && el) el.outerHTML = bookCard(b); }

  /* ================= Questions & answers ================= */
  function qaBlock(b) {
    const list = db.qa.filter(x => x.bizId === b.id).sort((x, y) => (x.a ? 1 : 0) - (y.a ? 1 : 0) || y.ts - x.ts);
    return `<div class="block" id="qaBlock"><div><h2>${t('qa.title')}</h2><p class="muted" style="margin-top:4px">${t('qa.sub')}</p></div>
      <form class="qa-form" data-form="qa" data-id="${b.id}"><label class="sr-only" for="qaIn">${t('qa.title')}</label><input class="input" id="qaIn" name="q" maxlength="200" placeholder="${t('qa.ph')}" autocomplete="off"><button type="submit" class="btn btn-secondary">${ic('help')}${t('qa.ask')}</button></form>
      <div class="qa-list">${list.length ? list.map(x => { const u = userById(x.userId); return `<div class="qa"><div class="qa-q"><span class="qa-mark">${lang === 'fa' ? 'س' : 'Q'}</span><span><b>${esc(L(x.q))}</b><small>${esc(L(u.name))} · ${relTime(x.ts)}</small></span></div>${x.a ? `<div class="qa-a"><span class="qa-mark a">${lang === 'fa' ? 'ج' : 'A'}</span><span>${esc(L(x.a))}<small>${t('qa.owner')}</small></span></div>` : `<div class="qa-a waiting">${ic('clock')}<span>${t('qa.waiting')}</span></div>`}</div>`; }).join('') : `<p class="muted">${t('qa.none')}</p>`}</div></div>`;
  }

  /* ================= Filters sheet & write-a-review picker ================= */
  function filtersModal() {
    const q = S.fq, n = searchResults(q).length;
    const pr = (k, v, on, label) => `<button type="button" class="chip" data-action="fq" data-k="${k}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
    return `${modalHead(t('filter.title'))}<div class="fm">
      <section><h3>${t('filter.sort')}</h3><div class="chips-wrap">${['rec', 'rating', 'reviews', 'near', 'new', 'name'].filter(x => x !== 'near' || prefs.loc).map(s => pr('sort', s, q.sort === s, t('sort.' + s))).join('')}</div></section>
      <section><h3>${t('filter.dist')}</h3>${prefs.loc ? `<div class="chips-wrap">${[[0, t('filter.any')], [1, t('dist.km', { n: N(1) })], [3, t('dist.km', { n: N(3) })], [5, t('dist.km', { n: N(5) })]].map(([v, lb]) => pr('dist', v, (q.dist || 0) === v, (v ? t('filter.within') + ' ' : '') + lb)).join('')}</div><p class="field-hint">${t('filter.distFrom', { p: esc(locLabel()) })}</p>` : `<button type="button" class="btn btn-secondary btn-sm" data-action="loc-ask">${ic('locate')}${t('loc.btn')}</button>`}</section>
      <section><h3>${t('filter.price')}</h3><div class="chips-wrap">${[1, 2, 3, 4].map(p => pr('price', p, q.price.includes(p), `${'$'.repeat(p)} ${t('price.' + p)}`)).join('')}</div></section>
      <section><h3>${t('filter.rating')}</h3><div class="chips-wrap">${[[0, t('filter.any')], [3.5, t('filter.rating35')], [4, t('filter.rating4')], [4.5, t('filter.rating45')]].map(([v, lb]) => pr('minRating', v, q.minRating === v, lb)).join('')}</div></section>
      <section><h3>${t('filter.amen')}</h3><div class="chips-wrap">${AMEN.map(a => `<label class="check"><input type="checkbox" data-fq-amen="${a}" ${q.amen.includes(a) ? 'checked' : ''}>${ic(AMEN_IC[a])}${t('amen.' + a)}</label>`).join('')}</div></section>
      <section><h3>${t('filter.other')}</h3><div class="chips-wrap">${pr('open', 1, q.open, ic('clock') + t('filter.open'))}${pr('verified', 1, q.verified, ic('shield') + t('filter.verified'))}${pr('isNew', 1, q.isNew, ic('sparkle') + t('filter.new'))}${pr('offer', 1, q.offer, ic('tag') + t('filter.offer'))}${pr('book', 1, q.book, ic('calendar') + t('filter.book'))}</div></section>
    </div><div class="modal-actions fm-foot"><button type="button" class="btn btn-ghost" data-action="fq-reset">${t('filter.reset')}</button><button type="button" class="btn btn-primary" data-action="fq-apply" id="fqApply">${t('filter.show', { n: N(n) })}</button></div>`;
  }
  function waItems(q) {
    const qq = norm(q).trim();
    const list = liveBiz().filter(b => !qq || norm([b.name.fa, b.name.en, L(catById(b.cat)), L(hood(b.hood))].join(' ')).includes(qq)).sort((a, b) => rankScore(b) - rankScore(a)).slice(0, 8);
    return list.length ? list.map(b => `<button type="button" class="sg-item" data-action="write-pick" data-id="${b.id}"><span class="sg-ic">${ART.scene(b.cat, b.photos[0].seed || b.id, 0, b.scene)}</span><span style="flex:1;min-width:0">${esc(L(b.name))}<small>${esc(L(catById(b.cat)))} · ${esc(L(hood(b.hood)))}</small></span>${ic('chev-r', 'flip-rtl faint')}</button>`).join('') : `<p class="muted" style="padding:12px">${t('wa.none')}</p>`;
  }
  function renderBottomNav() {
    const r = S.route, u = me();
    const sk = $('.skip'); if (sk) sk.textContent = t('skip');
    const item = (h, icn, label, on) => `<a href="${h}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}>${ic(icn)}<span>${label}</span></a>`;
    $('#bottomNav').innerHTML = item('#home', 'home', t('bn.home'), r === 'home')
      + item('#search', 'search', t('bn.search'), r.startsWith('search') || r.startsWith('list-'))
      + `<button type="button" class="bn-write" data-action="write-any"><span class="bw-ic">${ic('edit')}</span><span>${t('bn.write')}</span></button>`
      + item('#me', 'heart', t('bn.saved'), r === 'me')
      + item(u ? '#me-profile' : '#login', 'user', t('bn.account'), r === 'login' || (r.startsWith('me-')) || r.startsWith('owner') || r.startsWith('admin'));
  }


  /* ================= SEO: page meta and LocalBusiness structured data ================= */
  function updateSeo(r) {
    const head = document.head;
    const meta = (sel, attr, key, val) => { let m = head.querySelector(sel); if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); head.appendChild(m); } m.setAttribute('content', val); };
    const b = r.startsWith('biz-') ? bizById(r.slice(4)) : null;
    let desc = t('meta.desc'), ld = null;
    if (b && b.status === 'live') {
      const c = catById(b.cat), h = hood(b.hood);
      document.title = `${L(b.name)} · ${L(c)} ${lang === 'fa' ? 'در' : 'in'} ${L(h)} | Farshid`;
      desc = `${L(b.about)}`.slice(0, 158);
      const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].filter((_, i) => !(b.hours.off || []).includes(i));
      ld = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: L(b.name), description: desc, telephone: b.phone,
        address: { '@type': 'PostalAddress', streetAddress: L(b.addr), addressLocality: lang === 'fa' ? 'تهران' : 'Tehran', addressCountry: 'IR' },
        geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng }, priceRange: '$'.repeat(b.price),
        openingHours: `${days.join(',')} ${b.hours.o}-${b.hours.c === '24:00' ? '23:59' : b.hours.c}` };
      if (bizCount(b)) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: +bizRating(b).toFixed(1), reviewCount: bizCount(b) };
    }
    meta('meta[name="description"]', 'name', 'description', desc);
    meta('meta[property="og:title"]', 'property', 'og:title', document.title);
    meta('meta[property="og:description"]', 'property', 'og:description', desc);
    meta('meta[property="og:type"]', 'property', 'og:type', b ? 'business.business' : 'website');
    let s2 = head.querySelector('#ldjson');
    if (ld) { if (!s2) { s2 = document.createElement('script'); s2.type = 'application/ld+json'; s2.id = 'ldjson'; head.appendChild(s2); } s2.textContent = JSON.stringify(ld); }
    else if (s2) s2.remove();
  }

  /* ================= Router ================= */
  const parseRoute = () => (location.hash || '').replace(/^#/, '') || 'home';
  function go(r) { if (parseRoute() === r) render(true); else location.hash = r; }
  function guard(role) {
    const u = me();
    if (!u) { S.afterLogin = S.route; return viewLogin(t('login.needT')); }
    if (role !== 'user' && !hasRole(u, role)) return viewNoAccess(role);
    return null;
  }
  const titles = { search: 'results.title', login: 'login.title', 'add-business': 'wiz.title', me: 'me.title', owner: 'own.title', admin: 'adm.title', about: 'about.title', privacy: 'privacy.title', contact: 'contact.title', 'for-business': 'fb.title' };
  function render(scrollTop) {
    const r = parseRoute();
    const changed = r !== S.route;
    if (changed) { S.prevRoute = S.route; S.route = r; }
    S.menuOpen = false; S.notifOpen = false;
    maps.forEach(m => m.destroy()); maps = []; charts = {}; resultsMap = null; wizMap = null;
    if (loginTimer) { clearInterval(loginTimer); loginTimer = null; }
    let html = '';
    if (r === 'home') html = viewHome();
    else if (r === 'search' || r.startsWith('search-')) {
      if (changed && r.startsWith('search-')) { S.q = freshQuery(); S.q.cat = r.slice(7); }
      html = viewSearch();
    } else if (r.startsWith('list-')) {
      html = viewList(r.slice(5));
    } else if (r.startsWith('biz-')) {
      if (changed) {
        const intent = S.intent && S.intent.route === r ? S.intent : null;
        S.bizTab = intent ? intent.tab : 'overview'; S.writeOpen = !!(intent && intent.write); S.revFilter = 0; S.revSort = 'new'; S.busyDay = null;
        if (!intent) S.draft = { rating: 0, text: '', photos: [] };
        S.intent = null;
        const vb = bizById(r.slice(4));
        if (vb && vb.status === 'live') { db.recent = [vb.id].concat((db.recent || []).filter(x => x !== vb.id)).slice(0, 8); save(); }
      }
      html = viewBiz(r.slice(4));
    } else if (r === 'login') { if (changed) S.login = { step: 'phone', phone: '', err: '', until: 0 }; html = viewLogin(); }
    else if (r === 'add-business') html = viewAddBiz();
    else if (r === 'me' || r.startsWith('me-')) html = guard('user') || viewMe(r.slice(3));
    else if (r === 'owner' || r.startsWith('owner-')) html = guard('owner') || viewOwner(r.slice(6));
    else if (r === 'admin' || r.startsWith('admin-')) html = guard('admin') || viewAdmin(r.slice(6));
    else if (r === 'about') html = viewAbout();
    else if (r === 'privacy') html = viewPrivacy();
    else if (r === 'contact') html = viewContact();
    else if (r === 'for-business') html = viewForBiz();
    else html = notFound();
    $('#app').innerHTML = html;
    renderHeader();
    renderBottomNav();
    const tk = titles[r.split('-')[0]] || titles[r];
    const lst = r.startsWith('list-') ? D.lists.find(x => x.id === r.slice(5)) : null;
    document.title = lst ? `${t(lst.t)} · Farshid` : tk ? `${t(tk)} · Farshid` : (r.startsWith('biz-') && bizById(r.slice(4)) ? `${L(bizById(r.slice(4)).name)} · Farshid` : t('meta.title'));
    updateSeo(r);
    afterRender(r);
    if (scrollTop) window.scrollTo(0, 0);
  }
  function afterRender(r) {
    if (r === 'search' || r.startsWith('search-') || r.startsWith('list-')) {
      const el = $('#resultsMapEl');
      if (el) {
        const lst = r.startsWith('list-') ? D.lists.find(x => x.id === r.slice(5)) : null;
        const list = lst ? listItems(lst) : searchResults();
        const sig = r + '|' + list.map(b => b.id).join(',');
        const keep = S.mapView && (S.mapSig === sig || (!lst && S.q.area));
        resultsMap = mountMap(el, list, {
          view: keep ? S.mapView : null,
          onPin: id => { $$('[data-row]').forEach(x => x.classList.toggle('hl', Number(x.dataset.row) === id)); const row = $(`[data-row="${id}"]`); if (row && window.innerWidth > 920) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
          onMove: v => { S.mapView = v; S.mapSig = sig; },
          onRedo: lst ? null : bounds => { S.q.area = bounds; if (resultsMap) S.mapView = resultsMap.getView(); S.mapSig = null; rerender(); }
        });
      }
    }
    if (r === 'add-business' && S.wiz && S.wiz.step === 1 && !S.wiz.done) {
      const el = $('#pickMapEl'), d = S.wiz.data, h = hood(d.hood);
      if (el) wizMap = mountMap(el, [], { center: { lat: d.lat || h.lat, lng: d.lng || h.lng }, zoom: 15.2, pick: d.lat ? { lat: d.lat, lng: d.lng } : null, hint: t('map.pickHint'), popup: false,
        onPick: (lat, lng) => { d.lat = +lat.toFixed(6); d.lng = +lng.toFixed(6); const pw = $('#pickWhere'); if (pw) pw.innerHTML = ic('pin') + esc(placeLine(d) || t('map.outside')); updateWizPreview(); } });
    }
    if (r === 'login' || $('[data-form="login-code"]')) {
      const first = $('[data-otp="0"]');
      if (first) { first.focus(); startResendTimer(); }
      else { const ph = $('#phoneIn'); if (ph && r === 'login') ph.focus(); }
    }
    mountStaticMaps();
    if (S.scrollToBook && r.startsWith('biz-')) { S.scrollToBook = false; const bc = $('#bookCard'); if (bc) setTimeout(() => bc.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60); }
    bindCharts();
  }
  function startResendTimer() {
    if (loginTimer) clearInterval(loginTimer);
    loginTimer = setInterval(() => {
      const btn = $('#resendBtn');
      if (!btn) { clearInterval(loginTimer); loginTimer = null; return; }
      const left = Math.max(0, Math.ceil((S.login.until - Date.now()) / 1000));
      btn.disabled = !!left;
      btn.textContent = left ? t('login.resendIn', { s: N(left) }) : t('login.resend');
      if (!left) { clearInterval(loginTimer); loginTimer = null; }
    }, 1000);
  }
  function rerender() { const y = window.scrollY; render(false); window.scrollTo(0, y); }

  /* ================= Auth ================= */
  const DEMO = { user: 'u-demo', owner: 'u-owner', admin: 'u-admin' };
  function loginAs(uid, next) {
    db.session = uid; save();
    const u = me();
    toast(t('login.welcome', { n: L(u.name) }), 'user');
    let target = next || S.afterLogin;
    if (!target && S.route !== 'login') target = S.route;
    if (!target) target = u.role === 'admin' ? 'admin' : u.role === 'owner' ? 'owner' : (S.prevRoute && S.prevRoute !== 'login' ? S.prevRoute : 'me');
    S.afterLogin = null;
    if (target === S.route) render(true); else go(target);
  }
  function requireLogin(msg, intent) {
    if (db.session) return true;
    S.afterLogin = S.route;
    if (intent) S.intent = intent;
    toast(msg, 'lock');
    go('login');
    return false;
  }

  /* ================= Actions (click) ================= */
  function syncFav(id) {
    const on = isFav(id);
    $$(`[data-action="fav"][data-id="${id}"]`).forEach(b => {
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      if (b.classList.contains('icon-btn')) b.setAttribute('aria-label', t(on ? 'biz.saved' : 'biz.save'));
      const lbl = $('.fav-lbl', b); if (lbl) lbl.textContent = t(on ? 'biz.saved' : 'biz.save');
    });
  }
  function biz() { return bizById(S.route.slice(4)); }
  function scrollToTabs() {
    const tabs = $('.tabs');
    if (!tabs) return;
    const y = tabs.getBoundingClientRect().top + window.scrollY - $('#siteHeader').offsetHeight - 4;
    if (window.scrollY > y || tabs.getBoundingClientRect().top > window.innerHeight * .6) window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function removeReview(r) {
    const b = bizById(r.bizId);
    if (b) { if (r.added) { b.adj.n -= 1; b.adj.sum -= r.rating; } else { b.count = Math.max(0, b.count - 1); } }
    db.reviews = db.reviews.filter(x => x.id !== r.id);
  }
  const ACTIONS = {
    skip() { const m = $('#app'); m.setAttribute('tabindex', '-1'); m.focus(); },
    'write-any'() { openModal(`${modalHead(t('wa.title'))}<p class="muted">${t('wa.lead')}</p><div class="field"><label class="sr-only" for="waQ">${t('wa.ph')}</label><input class="input" id="waQ" data-input="waq" placeholder="${t('wa.ph')}" autocomplete="off" autofocus></div><div class="wa-list" id="waList">${waItems('')}</div>`); },
    'write-pick'(el) {
      const b = bizById(el.dataset.id); closeModal(); if (!b) return;
      const route = href(b).slice(1);
      if (!db.session) { S.intent = { route, tab: 'reviews', write: true }; S.afterLogin = route; toast(t('rv.needLogin'), 'lock'); go('login'); return; }
      if (S.route === route) { S.bizTab = 'reviews'; S.writeOpen = true; rerender(); scrollToTabs(); return; }
      S.intent = { route, tab: 'reviews', write: true }; go(route);
    },
    react(el) {
      const r = db.reviews.find(x => x.id === el.dataset.id); if (!r) return;
      const k = el.dataset.k, key = `${db.session || 'guest'}:${r.id}${k === 'h' ? '' : ':' + k}`;
      r.react = r.react || { f: 0, l: 0 };
      const on = !db.helpfulBy[key];
      if (on) db.helpfulBy[key] = 1; else delete db.helpfulBy[key];
      if (k === 'h') r.helpful = Math.max(0, (r.helpful || 0) + (on ? 1 : -1)); else r.react[k] = Math.max(0, (r.react[k] || 0) + (on ? 1 : -1));
      save();
      const n = k === 'h' ? r.helpful : r.react[k];
      el.setAttribute('aria-pressed', on);
      el.innerHTML = `${ic({ h: 'thumb', f: 'smile', l: 'heart' }[k])}${t('react.' + k)}${n ? ` · <span class="tnum">${N(n)}</span>` : ''}`;
    },
    'busy-day'(el) { S.busyDay = Number(el.dataset.v); const blk = $('#busyBlock'), b = biz(); if (blk && b) blk.outerHTML = busyBlock(b); },
    'book-day'(el) { if (!S.book) return; S.book.off = Number(el.dataset.v); S.book.time = null; redrawBook(); },
    'book-size'(el) { if (!S.book) return; S.book.size = clamp(S.book.size + Number(el.dataset.d), 1, 12); redrawBook(); },
    'book-time'(el) { if (!S.book) return; S.book.time = el.dataset.v; redrawBook(); },
    book() {
      const b = biz(); if (!b || !S.book || !S.book.time) return;
      if (!requireLogin(t('book.needLogin'), { route: S.route, tab: S.bizTab, write: false })) return;
      const kind = bookKind(b);
      const bk = { id: 'bk' + (db.nextId++), bizId: b.id, userId: db.session, date: tDate(S.book.off), time: S.book.time, size: kind === 'reserve' ? S.book.size : 1, status: 'confirmed', ts: Date.now() };
      db.bookings.push(bk); save();
      S.book.time = null; redrawBook();
      openModal(`<div class="book-done"><div class="big-check">${ic('check')}</div><h2>${t('book.doneT')}</h2><p class="muted">${t('book.doneB')}</p>
        <dl class="book-sum"><dt>${t('book.place')}</dt><dd>${esc(L(b.name))}</dd><dt>${t('book.date')}</dt><dd>${fmtDay(bk.date)}</dd><dt>${t('book.time')}</dt><dd class="tnum">${digits(bk.time)}</dd>${kind === 'reserve' ? `<dt>${t('book.size')}</dt><dd>${t('book.people', { n: N(bk.size) })}</dd>` : ''}</dl>
        <div class="modal-actions" style="justify-content:center"><button type="button" class="btn btn-secondary" data-action="modal-close">${t('common.close')}</button><a class="btn btn-primary" href="#me-bookings" data-action="modal-go">${t('book.mine')}</a></div></div>`);
    },
    'book-cancel'(el) { const x = db.bookings.find(k => k.id === el.dataset.id); if (!x) return; confirmBox(t('book.cancelQ'), t('book.cancel'), true, () => { x.status = 'cancelled'; save(); toast(t('book.cancelled'), 'calendar'); rerender(); }); },
    'book-done'(el) { const x = db.bookings.find(k => k.id === el.dataset.id); if (!x) return; x.status = 'done'; save(); toast(t('book.st.done'), 'check'); rerender(); },
    'modal-go'(el) { const h = el.getAttribute('href'); closeModal(); location.hash = h.slice(1); },
    'open-filters'() { S.fq = JSON.parse(JSON.stringify(S.q)); openModal(filtersModal(), 'wide'); },
    fq(el) {
      const q = S.fq; if (!q) return;
      const k = el.dataset.k, v = el.dataset.v;
      if (k === 'sort') q.sort = v;
      else if (k === 'price') { const p = Number(v), i = q.price.indexOf(p); if (i >= 0) q.price.splice(i, 1); else q.price.push(p); }
      else if (k === 'minRating') q.minRating = Number(v);
      else if (k === 'dist') q.dist = Number(v);
      else q[k] = !q[k];
      const m = $('#modalRoot .modal'); if (m) { const y = m.scrollTop; m.innerHTML = filtersModal(); m.scrollTop = y; }
    },
    'fq-reset'() { const keep = S.fq; S.fq = freshQuery(); S.fq.text = keep.text; S.fq.where = keep.where; S.fq.cat = keep.cat; const m = $('#modalRoot .modal'); if (m) m.innerHTML = filtersModal(); },
    'fq-apply'() { S.q = S.fq; S.fq = null; closeModal(); if (S.route.startsWith('search')) rerender(); else go('search'); },
    lang() { lang = lang === 'fa' ? 'en' : 'fa'; prefs.lang = lang; savePrefs(); $('#toastHost').innerHTML = ''; applyLang(); renderFooter(); rerender(); },
    theme() { prefs.theme = isDark() ? 'light' : 'dark'; savePrefs(); document.documentElement.setAttribute('data-theme', prefs.theme); renderHeader(); renderFooter(); },
    menu() { S.menuOpen = !S.menuOpen; S.notifOpen = false; renderHeader(); if (S.menuOpen) { const f = $('.dropdown a'); if (f) f.focus(); } },
    logout() { db.session = null; save(); toast(t('login.out'), 'logout'); go('home'); renderHeader(); },
    'quick-search'(el) { S.q = freshQuery(); S.q.text = el.dataset.q; go('search'); },
    'see-all'() { S.q = freshQuery(); go('search'); },
    'open-now'() { S.q = freshQuery(); S.q.open = true; go('search'); },
    'hood-search'(el) { S.q = freshQuery(); S.q.where = L(hood(el.dataset.hood)); go('search'); },
    'sg-cat'(el) { hideSuggest(); go('search-' + el.dataset.cat); },
    'sg-biz'(el) { hideSuggest(); const b = bizById(el.dataset.id); if (b) go(href(b).slice(1)); },
    'sg-hood'(el) { const f = el.closest('form'); f.where.value = el.dataset.hood ? L(hood(el.dataset.hood)) : ''; hideSuggest(); f.q.focus(); },
    'sg-search'(el) { runSearch(el.closest('form')); },
    fav(el) {
      const id = Number(el.dataset.id);
      if (!requireLogin(t('fav.needLogin'))) return;
      const i = db.favorites.findIndex(f => f.userId === db.session && f.bizId === id);
      if (i >= 0) { db.favorites.splice(i, 1); toast(t('fav.removed'), 'heart'); } else { db.favorites.push({ userId: db.session, bizId: id }); toast(t('fav.added'), 'heart'); }
      save(); syncFav(id);
      if (S.route === 'me') rerender();
    },
    'biz-tab'(el) { S.bizTab = el.dataset.tab; rerender(); scrollToTabs(); },
    write() {
      const route = S.route;
      if (!requireLogin(t('rv.needLogin'), { route, tab: 'reviews', write: true })) return;
      S.bizTab = 'reviews'; S.writeOpen = true; rerender();
      const f = $('#writeForm'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    },
    'write-cancel'() { S.writeOpen = false; S.draft = { rating: 0, text: '', photos: [] }; rerender(); },
    'set-rating'(el) {
      S.draft.rating = Number(el.dataset.v);
      $$('.star-input button').forEach(b => { const v = Number(b.dataset.v); b.classList.toggle('on', v <= S.draft.rating); b.setAttribute('aria-checked', v === S.draft.rating); });
      $('#starLbl').textContent = t('rv.labels')[S.draft.rating];
    },
    'rm-draft'(el) { S.draft.photos.splice(Number(el.dataset.i), 1); $('#draftPhotos').innerHTML = draftThumbs(); },
    'rv-filter'(el) { const v = Number(el.dataset.v); S.revFilter = S.revFilter === v ? 0 : v; if (S.bizTab !== 'reviews') S.bizTab = 'reviews'; rerender(); },
    helpful(el) {
      const r = db.reviews.find(x => x.id === el.dataset.id); if (!r) return;
      const k = (db.session || 'guest') + ':' + r.id;
      if (db.helpfulBy[k]) { delete db.helpfulBy[k]; r.helpful = Math.max(0, r.helpful - 1); } else { db.helpfulBy[k] = 1; r.helpful += 1; }
      save();
      el.setAttribute('aria-pressed', !!db.helpfulBy[k]);
      el.innerHTML = `${ic('thumb')}${t('rv.helpful')}${r.helpful ? ` · <span class="tnum">${N(r.helpful)}</span>` : ''}`;
    },
    report(el) {
      if (!requireLogin(t('report.needLogin'))) return;
      const id = el.dataset.id;
      openModal(`${modalHead(t('report.title'))}<form data-form="report" data-id="${esc(id)}" class="radio-list" style="gap:12px"><p class="muted">${t('report.lead')}</p>
        ${['spam', 'offensive', 'fake', 'other'].map((k, i) => `<label><input type="radio" name="reason" value="${k}" ${i === 0 ? 'checked' : ''}>${t('report.' + k)}</label>`).join('')}
        <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="modal-close">${t('common.cancel')}</button><button type="submit" class="btn btn-danger">${ic('flag')}${t('report.send')}</button></div></form>`);
    },
    'del-review'(el) {
      const r = db.reviews.find(x => x.id === el.dataset.id); if (!r) return;
      confirmBox(t('rv.confirmDelete'), t('rv.delete'), true, () => { removeReview(r); save(); toast(t('rv.deleted'), 'trash'); rerender(); });
    },
    lightbox(el) {
      const [kind, id] = el.dataset.set.split(':');
      let list = [];
      if (kind === 'biz') { const b = bizById(id); if (b) list = allPhotos(b); }
      else if (kind === 'own') { const b = bizById(id); if (b) list = b.photos; }
      else { const r = db.reviews.find(x => x.id === id); if (r) list = r.photos; }
      openLightbox(list, Number(el.dataset.i) || 0);
    },
    'lb-step'(el) { if (!S.lb) return; S.lb.i = (S.lb.i + Number(el.dataset.d) + S.lb.list.length) % S.lb.list.length; drawLightbox(); },
    'lb-go'(el) { if (!S.lb) return; S.lb.i = Number(el.dataset.i); drawLightbox(); },
    'lb-close'() { closeModal(); },
    'modal-close'() { closeModal(); },
    'modal-ok'() { const fn = S.modalOk; closeModal(); if (fn) fn(); },
    async copy(el) { const ok = await copyText(el.dataset.v); toast(ok ? t('copy.done', { v: el.dataset.v }) : el.dataset.v, 'copy'); },
    async share() { await copyText(location.href); toast(t('share.done'), 'share'); },
    'toggle-map'(el) {
      S.mobileMap = !S.mobileMap;
      const lay = $('.results-layout'); if (lay) lay.classList.toggle('show-map', S.mobileMap);
      el.innerHTML = S.mobileMap ? ic('list') + t('results.list') : ic('map') + t('results.map');
    },
    'f-price'(el) { const v = Number(el.dataset.v), a = S.q.price; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); rerender(); },
    'f-rating'(el) { const v = Number(el.dataset.v); S.q.minRating = S.q.minRating === v ? 0 : v; rerender(); },
    'book-jump'(el) { const bk = bizById(el.dataset.id); if (!bk) return; S.scrollToBook = true; go('biz-' + (bk.slug || bk.id)); },
    'sort-reviews'() { S.q = freshQuery(); S.q.sort = 'reviews'; go('search'); },
    'sort-rating'() { S.q = freshQuery(); S.q.sort = 'rating'; go('search'); },
    'how-search'() { const i = $('#sq-big'); if (i) { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => i.focus({ preventScroll: true }), 350); } else go('search'); },
    'scroll-to'(el) { const tg = document.getElementById(el.dataset.to); if (tg) tg.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'loc-ask'() { askLocation(null, false); },
    'loc-gps'() { closeModal(); const a = S.locAfter; askLocation(a, true); },
    'loc-hood'(el) { const h = hood(el.dataset.hood); useLocation({ lat: h.lat, lng: h.lng, src: 'hood', hood: el.dataset.hood }); },
    'loc-clear'() { prefs.loc = null; savePrefs(); if (S.q.sort === 'near') S.q.sort = 'rec'; S.q.dist = 0; closeModal(); toast(t('loc.cleared'), 'check'); rerender(); },
    'sg-near'(el) { const f = el.closest('form'); const text = f ? f.q.value.trim() : ''; hideSuggest(); askLocation(() => { S.q = freshQuery(); S.q.text = text; S.q.sort = 'near'; go('search'); }, false); },
    'sg-recent'(el) { S.q = freshQuery(); S.q.text = el.dataset.q; hideSuggest(); go('search'); },
    'sg-clear-recent'(el) { db.recentQ = []; save(); const f = el.closest('form'); if (f) { showSuggest(f.q); f.q.focus(); } },
    'near-all'() { S.q = freshQuery(); S.q.sort = 'near'; go('search'); },
    'offers-all'() { S.q = freshQuery(); S.q.offer = true; go('search'); },
    'f-offer'() { S.q.offer = !S.q.offer; rerender(); },
    'f-book'() { S.q.book = !S.q.book; rerender(); },
    notif() { S.notifOpen = !S.notifOpen; S.menuOpen = false; renderHeader(); },
    'notif-read'() { const u = me(); if (!u) return; db.notifSeen = db.notifSeen || {}; db.notifSeen[u.id] = Date.now(); save(); renderHeader(); },
    'notif-go'(el) { const u = me(); S.notifOpen = false; if (u) { db.notifSeen = db.notifSeen || {}; db.notifSeen[u.id] = Math.max(db.notifSeen[u.id] || 0, Number(el.dataset.ts) || 0); save(); } renderHeader(); const h = el.getAttribute('href'); if (h && location.hash !== h) location.hash = h.slice(1); else render(true); },
    'offer-del'(el) { db.offers = (db.offers || []).filter(o => o.id !== el.dataset.id); save(); toast(t('offer.deleted'), 'trash'); rerender(); },
    'f-open'() { S.q.open = !S.q.open; rerender(); },
    'f-verified'() { S.q.verified = !S.q.verified; rerender(); },
    'f-clear'() { S.q = freshQuery(); if (S.route !== 'search') location.hash = 'search'; else rerender(); },
    'demo-login'(el) { loginAs(DEMO[el.dataset.role], el.dataset.next); },
    'login-edit'() { S.login.step = 'phone'; S.login.err = ''; rerender(); },
    'login-resend'() { S.login.until = Date.now() + 60000; toast(t('login.resent'), 'phone'); startResendTimer(); const b = $('#resendBtn'); if (b) { b.disabled = true; b.textContent = t('login.resendIn', { s: N(60) }); } },
    'wiz-back'() { S.wiz.step = Math.max(0, S.wiz.step - 1); S.wiz.err = {}; rerender(); },
    'wiz-price'(el) { S.wiz.data.price = Number(el.dataset.v); $$('[data-action="wiz-price"]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.v) === S.wiz.data.price)); updateWizPreview(); },
    'rm-wiz'(el) { S.wiz.data.photos.splice(Number(el.dataset.i), 1); rerender(); },
    'wiz-reset'() { S.wiz = newWiz(); rerender(); },
    'own-filter'(el) { S.ownFilter = el.dataset.v; rerender(); },
    'edit-reply'(el) { S.editReply = el.dataset.id || null; rerender(); const ta = S.editReply && $(`#rp-${S.editReply}`); if (ta) ta.focus(); },
    'own-cover'(el) { const b = ownerBiz(); const i = Number(el.dataset.i); const [p] = b.photos.splice(i, 1); b.photos.unshift(p); save(); toast(t('own.photos.covered'), 'image'); rerender(); },
    'own-rm'(el) {
      const b = ownerBiz();
      if (b.photos.length <= 1) { toast(t('own.photos.min'), 'info'); return; }
      confirmBox(t('own.photos.removeQ'), t('own.photos.remove'), true, () => { b.photos.splice(Number(el.dataset.i), 1); save(); toast(t('own.photos.removed'), 'trash'); rerender(); });
    },
    'adm-detail'(el) { S.openDetail = S.openDetail === el.dataset.id ? null : el.dataset.id; rerender(); },
    'adm-approve'(el) {
      const p = db.pending.find(x => x.id === el.dataset.id); if (!p) return;
      const id = db.nextBizId++;
      const photos = p.photos.length ? p.photos.slice() : [0, 1, 2, 3].map(k => ({ kind: 'art', cat: p.cat, seed: id + k, crop: k }));
      db.businesses.push({ id, cat: p.cat, hood: p.hood, lat: p.lat, lng: p.lng, price: p.price, rating: 0, count: 0, verified: false, name: p.name, phone: p.phone, addr: p.addr, about: p.about, tags: { fa: [catById(p.cat).fa], en: [catById(p.cat).en] }, amen: [], hours: p.hours, menu: [], photos, adj: { n: 0, sum: 0 }, status: 'live', isNew: true, slug: (() => { const base = D.slugify(p.name.en) || 'place-' + id; return db.businesses.some(x => x.slug === base) ? base + '-' + id : base; })() });
      p.status = 'approved'; p.bizId = id; p.doneTs = Date.now();
      save(); toast(t('adm.approved', { n: L(p.name) }), 'check'); rerender();
    },
    'adm-reject'(el) {
      const p = db.pending.find(x => x.id === el.dataset.id); if (!p) return;
      openModal(`${modalHead(t('adm.rejectT', { n: esc(L(p.name)) }))}<form data-form="reject" data-id="${p.id}" class="radio-list" style="gap:12px"><p class="muted">${t('adm.rejectReason')}</p>
        ${['info', 'dup', 'policy'].map((k, i) => `<label><input type="radio" name="reason" value="${k}" ${i === 0 ? 'checked' : ''}>${t('adm.rr.' + k)}</label>`).join('')}
        <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="modal-close">${t('common.cancel')}</button><button type="submit" class="btn btn-danger">${t('adm.reject')}</button></div></form>`);
    },
    'adm-keep'(el) { const rp = db.reports.find(x => x.id === el.dataset.id); if (!rp) return; rp.status = 'kept'; save(); toast(t('adm.kept'), 'check'); rerender(); },
    'adm-remove'(el) {
      const rp = db.reports.find(x => x.id === el.dataset.id); if (!rp) return;
      const r = db.reviews.find(x => x.id === rp.reviewId);
      if (r) removeReview(r);
      db.reports.forEach(x => { if (x.reviewId === rp.reviewId) x.status = 'removed'; });
      save(); toast(t('adm.removed'), 'trash'); rerender();
    },
    'cat-edit'(el) { S.catEdit = el.dataset.id || null; rerender(); },
    'cat-del'(el) {
      const c = db.cats.find(x => x.id === el.dataset.id); if (!c) return;
      confirmBox(`${t('adm.delete')}: ${L(c)}`, t('adm.delete'), true, () => { db.cats = db.cats.filter(x => x.id !== c.id); save(); toast(t('adm.catDeleted'), 'trash'); renderFooter(); rerender(); });
    },
    'user-ban'(el) {
      const u = db.users.find(x => x.id === el.dataset.id); if (!u) return;
      u.status = u.status === 'active' ? 'banned' : 'active'; save();
      toast(t(u.status === 'banned' ? 'adm.banned1' : 'adm.unbanned', { n: L(u.name) }), u.status === 'banned' ? 'lock' : 'check');
      $('#userRows').innerHTML = userRows();
    },
    'adm-reset'() {
      confirmBox(t('adm.resetQ'), t('adm.reset'), true, () => { const keep = db.session; db = freshSeed(); db.session = keep; save(); S.wiz = null; toast(t('adm.resetDone'), 'sparkle'); renderFooter(); rerender(); });
    },
    'map-modal'(el) {
      const b = bizById(el.dataset.id); if (!b) return;
      const where = placeLine(b);
      openModal(`${modalHead(esc(L(b.name)))}<p class="muted map-modal-sub">${ic('pin')}<span>${esc(L(b.addr))}${where ? ' · ' + esc(where) : ''}</span></p><div class="big-map"><div id="bigMapEl" style="height:100%"></div></div>
        <div class="modal-actions"><a class="btn btn-secondary" href="${directionsUrl(b, 'waze')}" target="_blank" rel="noopener">${ic('route')}${t('map.waze')}</a><a class="btn btn-primary" href="${directionsUrl(b)}" target="_blank" rel="noopener">${ic('route')}${t('map.google')}</a></div>`, 'wide map-modal');
      const mm = mountMap($('#bigMapEl'), liveBiz(), { center: { lat: b.lat, lng: b.lng }, zoom: 14.6 });
      S.modalMap = mm; mm.setActive(b.id); mm.showPop(b.id);
    },
    'f-area'() { S.q.area = null; S.mapView = null; S.mapSig = null; rerender(); },
    'plan-pick'(el) {
      const k = el.dataset.plan; if (!PLAN_PRICE.hasOwnProperty(k) || S.planSel === k) return;
      S.planSel = k; rerender();
      const card = $(`.plan[data-plan="${k}"]`); if (card) card.focus({ preventScroll: true });
    },
    'plan-bill'(el) { S.bill = el.dataset.v === 'y' ? 'y' : 'm'; rerender(); },
    'plan-go'(el) {
      const k = el.dataset.plan || S.planSel || 'pro';
      S.planSel = k;
      const u = me();
      if (k === 'free') {
        const ob = u ? ownerBiz() : null;
        if (ob && planOf(ob) !== 'free') { ACTIONS['plan-cancel'](); return; }
        go('add-business'); return;
      }
      if (!requireLogin(t('fb.loginNeed'))) return;
      const list = ownerBizList();
      if (!list.length) {
        openModal(`${modalHead(t('fb.co.noBizT'))}<p class="muted">${t('fb.co.noBizB')}</p><div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="plan-req" data-plan="${k}">${ic('phone')}${t('fb.talk')}</button><a class="btn btn-primary" href="#add-business" data-action="modal-go">${ic('plus')}${t('fb.co.add')}</a></div>`);
        return;
      }
      const ob = ownerBiz();
      S.co = { plan: k, bill: S.bill || 'm', bizId: (ob && list.includes(ob) ? ob : list[0]).id, code: '', codeInput: '', codeErr: false, paying: false, done: null };
      drawCheckout();
    },
    'co-bill'(el) { if (!S.co || S.co.paying) return; S.co.bill = el.dataset.v === 'y' ? 'y' : 'm'; drawCheckout(); },
    'co-pay'() {
      const c = S.co; if (!c || c.paying || c.done) return;
      c.paying = true; drawCheckout();
      S.coTimer = setTimeout(() => {
        S.coTimer = null;
        if (S.co !== c) return;
        const x = coCalc(c), days = x.trial ? 14 : c.bill === 'y' ? 365 : 30;
        db.subs = db.subs || {}; db.trials = db.trials || [];
        const until = Date.now() + days * DAY, invoice = 'FD-' + String(10240 + Object.keys(db.subs).length * 37 + (Date.now() % 997));
        db.subs[c.bizId] = { plan: c.plan, bill: c.bill, since: Date.now(), until, trial: x.trial, invoice, amount: x.total };
        if (x.trial && !db.trials.includes(c.bizId)) db.trials.push(c.bizId);
        save();
        c.paying = false; c.done = { until, invoice };
        drawCheckout();
        if (S.route === 'for-business' || S.route.startsWith('owner')) { const y = window.scrollY; render(false); window.scrollTo(0, y); }
        toast(t('fb.co.doneToast', { p: t('fb.' + c.plan) }), 'sparkle');
      }, 1100);
    },
    'plan-cancel'() {
      const ob = ownerBiz(); if (!ob || planOf(ob) === 'free') return;
      confirmBox(t('own.cancelQ'), t('own.cancelSub'), true, () => { delete db.subs[ob.id]; save(); toast(t('own.cancelled'), 'check'); rerender(); });
    },
    'plan-req'(el) {
      const p = t('fb.' + el.dataset.plan), u = me();
      openModal(`${modalHead(t('fb.reqT', { p }))}<p class="muted">${t('fb.reqLead')}</p><form data-form="plan" style="display:grid;gap:14px" novalidate>
        <div class="field"><label for="plBiz">${t('fb.reqBiz')}</label><input class="input" id="plBiz" name="biz" required maxlength="60" autofocus></div>
        <div class="field" id="plPhoneF"><label for="plPhone">${t('login.phone')}</label><input class="input tnum" id="plPhone" name="phone" dir="ltr" inputmode="numeric" required maxlength="13" value="${u ? esc(u.phone) : ''}" placeholder="${t('login.phonePh')}"></div>
        <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="modal-close">${t('common.cancel')}</button><button type="submit" class="btn btn-primary">${t('fb.reqSend')}</button></div></form>`);
    }
  };

  /* ================= Forms (submit) ================= */
  function fieldErr(input, msg) {
    const f = input.closest('.field'); if (!f) return;
    f.classList.add('err');
    let e = $('.field-err', f);
    if (!e) { e = document.createElement('span'); e.className = 'field-err'; f.appendChild(e); }
    e.textContent = msg;
    input.focus();
  }
  function clearErrs(form) { $$('.field.err', form).forEach(f => f.classList.remove('err')); $$('.field-err', form).forEach(e => e.remove()); }
  const validPhone = v => /^09\d{9}$/.test(toAscii(v).replace(/[\s-]/g, ''));
  const FORMS = {
    qa(f) {
      const b = bizById(f.dataset.id); if (!b) return;
      const v = f.q.value.trim();
      if (v.length < 8) { toast(t('qa.short'), 'help'); f.q.focus(); return; }
      if (!requireLogin(t('qa.needLogin'))) return;
      db.qa.push({ id: 'q' + (db.nextId++), bizId: b.id, userId: db.session, q: v, a: null, ts: Date.now() });
      save(); toast(t('qa.asked'), 'help'); rerender();
    },
    'own-qa'(f) {
      const x = db.qa.find(k => k.id === f.dataset.id); if (!x) return;
      const v = f.a.value.trim();
      if (!v) { toast(t('own.replyEmpty'), 'info'); f.a.focus(); return; }
      x.a = v; x.aTs = Date.now(); save(); toast(t('own.qaDone'), 'check'); rerender();
    },
    search(f) { runSearch(f); },
    review(f) {
      const b = bizById(f.dataset.id); if (!b) return;
      const text = S.draft.text.trim();
      if (!S.draft.rating) { toast(t('rv.needStars'), 'star'); return; }
      if (text.length < 20) { toast(t('rv.needText'), 'edit'); $('#rvText').focus(); return; }
      const r = { id: 'r' + (db.nextId++), bizId: b.id, userId: db.session, rating: S.draft.rating, text, ts: Date.now(), helpful: 0, photos: S.draft.photos.slice(), reply: null, added: true };
      db.reviews.push(r); b.adj.n += 1; b.adj.sum += r.rating;
      save();
      S.draft = { rating: 0, text: '', photos: [] }; S.writeOpen = false; S.revSort = 'new'; S.revFilter = 0;
      toast(t('rv.posted'), 'check'); rerender();
      const el = $(`#rv-${r.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    'login-phone'(f) {
      const v = toAscii(f.phone.value).replace(/[\s-]/g, '');
      S.login.phone = v;
      if (!validPhone(v)) { S.login.err = t('login.phoneErr'); rerender(); $('#phoneIn').focus(); return; }
      S.login = { step: 'code', phone: v, err: '', until: Date.now() + 60000 };
      rerender();
    },
    'login-code'() {
      const code = $$('[data-otp]').map(i => toAscii(i.value)).join('');
      if (code !== '1234') { S.login.err = t('login.wrong'); rerender(); return; }
      let u = db.users.find(x => x.phone === S.login.phone);
      if (!u) { u = db.users.find(x => x.id === 'u-demo'); u.phone = S.login.phone; }
      loginAs(u.id);
    },
    wiz(f) {
      const w = S.wiz, d = w.data; w.err = {};
      if (w.step === 0 && d.name.trim().length < 2) w.err.name = t('wiz.required');
      if (w.step === 1) {
        if (d.addr.trim().length < 4) w.err.addr = t('wiz.required');
        if (toAscii(d.phone).replace(/\D/g, '').length < 8) w.err.phone = d.phone.trim() ? t('wiz.phoneErr') : t('wiz.required');
      }
      if (w.step === 2 && d.o === d.c) w.err.c = t('wiz.sameTime');
      if (Object.keys(w.err).length) { rerender(); const e = $('.field.err input, .field.err select, .field.err textarea'); if (e) e.focus(); return; }
      if (w.step < 3) { w.step += 1; rerender(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (!requireLogin(t('login.needT'))) { S.afterLogin = 'add-business'; return; }
      const h = hood(d.hood);
      const id = 'p' + (db.nextId++);
      db.pending.push({ id, status: 'pending', ts: Date.now(), submittedBy: db.session, cat: d.cat, hood: d.hood, lat: d.lat || +(h.lat + 0.0011).toFixed(6), lng: d.lng || +(h.lng + 0.0014).toFixed(6), price: d.price,
        name: { fa: d.name.trim(), en: d.name.trim() }, phone: d.phone.trim(), addr: { fa: d.addr.trim(), en: d.addr.trim() },
        about: { fa: d.desc.trim() || L(catById(d.cat)), en: d.desc.trim() || catById(d.cat).en },
        hours: { o: d.o, c: d.c, off: d.off === 'none' ? [] : [Number(d.off)] }, photos: d.photos.slice() });
      save(); w.done = id; rerender();
    },
    profile(f) {
      clearErrs(f);
      const u = me(), name = f.name.value.trim(), email = f.email.value.trim();
      if (name.length < 2) { fieldErr(f.name, t('common.required')); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldErr(f.email, t('me.emailErr')); return; }
      u.name = { fa: name, en: name }; u.email = email;
      const c = f.querySelector('input[name="color"]:checked'); if (c) u.color = Number(c.value);
      save(); toast(t('me.saved'), 'check'); rerender();
    },
    'own-info'(f) {
      clearErrs(f);
      const b = ownerBiz(); if (!b) return;
      if (f.nameFa.value.trim().length < 2) { fieldErr(f.nameFa, t('common.required')); return; }
      if (f.nameEn.value.trim().length < 2) { fieldErr(f.nameEn, t('common.required')); return; }
      b.name = { fa: f.nameFa.value.trim(), en: f.nameEn.value.trim() };
      b.phone = f.phone.value.trim() || b.phone;
      const pr = f.querySelector('input[name="price"]:checked'); if (pr) b.price = Number(pr.value);
      if (f.o.value) b.hours.o = f.o.value;
      if (f.c.value) b.hours.c = f.c.value === '00:00' ? '24:00' : f.c.value;
      b.about = { fa: f.aboutFa.value.trim() || b.about.fa, en: f.aboutEn.value.trim() || b.about.en };
      b.amen = $$('input[name="amen"]:checked', f).map(i => i.value);
      save(); toast(t('own.info.saved'), 'check'); rerender();
    },
    reply(f) {
      const r = db.reviews.find(x => x.id === f.dataset.id); if (!r) return;
      const v = f.reply.value.trim();
      if (!v) { toast(t('own.replyEmpty'), 'info'); f.reply.focus(); return; }
      r.reply = v; S.editReply = null; save(); toast(t('own.replied'), 'check'); rerender();
    },
    report(f) {
      const reason = (f.querySelector('input[name="reason"]:checked') || {}).value || 'other';
      db.reports.push({ id: 'rep' + (db.nextId++), reviewId: f.dataset.id, reason, reporterId: db.session, ts: Date.now(), status: 'open' });
      save(); closeModal(); toast(t('report.sent'), 'flag');
    },
    reject(f) {
      const p = db.pending.find(x => x.id === f.dataset.id); if (!p) return;
      p.status = 'rejected'; p.reason = (f.querySelector('input[name="reason"]:checked') || {}).value || 'info'; p.doneTs = Date.now();
      save(); closeModal(); toast(t('adm.rejected', { n: L(p.name) }), 'x'); rerender();
    },
    'cat-add'(f) {
      clearErrs(f);
      const fa = f.fa.value.trim(), en = f.en.value.trim();
      if (!fa) { fieldErr(f.fa, t('common.required')); return; }
      if (!en) { fieldErr(f.en, t('common.required')); return; }
      db.cats.push({ id: 'c' + (db.nextId++), fa, en, icon: 'tag', kw: '' });
      save(); toast(t('adm.catAdded', { n: lang === 'fa' ? fa : en }), 'plus'); rerender();
    },
    'cat-save'(f) {
      const c = db.cats.find(x => x.id === f.dataset.id); if (!c) return;
      if (!f.fa.value.trim() || !f.en.value.trim()) return;
      c.fa = f.fa.value.trim(); c.en = f.en.value.trim(); S.catEdit = null;
      save(); toast(t('adm.catSaved'), 'check'); renderFooter(); rerender();
    },
    contact(f) {
      clearErrs(f);
      if (!f.name.value.trim()) { fieldErr(f.name, t('common.required')); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) { fieldErr(f.email, t('me.emailErr')); return; }
      if (f.msg.value.trim().length < 5) { fieldErr(f.msg, t('common.required')); return; }
      f.msg.value = ''; toast(t('contact.sent'), 'mail');
    },
    offer(f) {
      const b = ownerBiz(); if (!b || planOf(b) === 'free') return;
      const title = f.title.value.trim();
      clearErrs(f);
      if (title.length < 4) { fieldErr(f.title, t('offer.titleErr')); f.title.focus(); return; }
      db.offers = db.offers || [];
      db.offers.push({ id: 'of' + (db.nextId++), bizId: b.id, title: { fa: title, en: title }, pct: Number(f.pct.value), until: Date.now() + Number(f.days.value) * DAY });
      save(); toast(t('offer.published'), 'tag'); rerender();
    },
    'co-code'(f) {
      const c = S.co; if (!c) return;
      const v = toAscii(f.code.value).trim().toUpperCase();
      c.codeInput = v;
      if (v === 'FARSHID20') { c.code = v; c.codeErr = false; toast(t('fb.co.codeOk'), 'tag'); }
      else { c.code = ''; c.codeErr = !!v; }
      drawCheckout();
      const inp = $('#coCode'); if (inp && c.codeErr) inp.focus();
    },
    plan(f) {
      clearErrs(f);
      if (!f.biz.value.trim()) { fieldErr(f.biz, t('common.required')); return; }
      if (!validPhone(f.phone.value)) { fieldErr(f.phone, t('login.phoneErr')); return; }
      closeModal(); toast(t('fb.reqDone'), 'phone');
    }
  };

  function updateWizPreview() { const p = $('#wizPreview'); if (p && S.wiz) p.innerHTML = cardHTML(draftBiz(), { preview: true }); }

  /* ================= Global listeners ================= */
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }
  document.addEventListener('click', e => {
    if (S.menuOpen && !e.target.closest('.user-menu')) { S.menuOpen = false; renderHeader(); }
    if (S.notifOpen && !e.target.closest('.notif-menu')) { S.notifOpen = false; renderHeader(); }
    if (e.target.closest('.dropdown a')) { S.menuOpen = false; setTimeout(renderHeader, 0); }
    if (!e.target.closest('.search')) hideSuggest();
    if (e.target.matches('[data-modal-back]')) { closeModal(); return; }
    const a = e.target.closest('[data-action]');
    if (!a || a.disabled) return;
    const fn = ACTIONS[a.dataset.action];
    if (fn) { e.preventDefault(); fn(a, e); }
  });
  document.addEventListener('mousedown', e => { if (e.target.closest('.suggest')) e.preventDefault(); });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    const fn = FORMS[f.dataset.form];
    if (fn) fn(f);
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.suggest) { showSuggest(el); return; }
    if (el.dataset.input === 'draft') { S.draft.text = el.value; const c = $('#rvCount'); if (c) c.textContent = t('rv.minChars', { n: N(el.value.trim().length) }); return; }
    if (el.dataset.input === 'userq') { S.userQ = el.value; $('#userRows').innerHTML = userRows(); return; }
    if (el.dataset.input === 'waq') { const wl = $('#waList'); if (wl) wl.innerHTML = waItems(el.value); return; }
    if (el.dataset.wiz && S.wiz) {
      const k = el.dataset.wiz; S.wiz.data[k] = el.value;
      const fe = el.closest('.field'); if (fe && fe.classList.contains('err')) { fe.classList.remove('err'); const m = $('.field-err', fe); if (m) m.remove(); delete S.wiz.err[k]; }
      if (k === 'hood' && wizMap) { const h = hood(el.value); S.wiz.data.lat = null; S.wiz.data.lng = null; wizMap.clearPick(); wizMap.centerOn(h.lat, h.lng, 15.2); const pw = $('#pickWhere'); if (pw) pw.textContent = t('map.pickHint'); }
      updateWizPreview(); return;
    }
    if (el.dataset.otp !== undefined) {
      const v = toAscii(el.value).replace(/\D/g, '');
      if (v.length > 1) { const boxes = $$('[data-otp]'); v.split('').slice(0, 4).forEach((ch, i) => { if (boxes[i]) boxes[i].value = digits(ch); }); }
      else el.value = v ? digits(v) : '';
      const idx = Number(el.dataset.otp);
      if (v && idx < 3) { const nx = $(`[data-otp="${idx + 1}"]`); if (nx) nx.focus(); }
      const all = $$('[data-otp]').map(i => toAscii(i.value)).join('');
      if (all.length === 4) { const f = el.closest('form'); if (f) f.requestSubmit(); }
    }
  });
  document.addEventListener('keydown', e => {
    const el = e.target;
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !(el.matches && el.matches('input, textarea, select, [contenteditable]')) && !$('#modalRoot').innerHTML) {
      const box = $('#sq-big') || $('#sq-compact');
      if (box && box.offsetParent) { e.preventDefault(); box.focus(); return; }
    }
    if (el.dataset && el.dataset.otp !== undefined && e.key === 'Backspace' && !el.value) { const pv = $(`[data-otp="${Number(el.dataset.otp) - 1}"]`); if (pv) { pv.focus(); pv.value = ''; e.preventDefault(); } }
    if ((e.key === 'Enter' || e.key === ' ') && el.matches && el.matches('[role="radio"][data-action]:not(button)')) { e.preventDefault(); el.click(); return; }
    if (e.key === 'Escape') {
      if ($('#modalRoot').innerHTML) { closeModal(); return; }
      if (S.menuOpen) { S.menuOpen = false; renderHeader(); return; }
      if (S.notifOpen) { S.notifOpen = false; renderHeader(); return; }
      hideSuggest();
    }
    if (S.lb && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const fwd = (e.key === 'ArrowRight') === (lang !== 'fa');
      S.lb.i = (S.lb.i + (fwd ? 1 : -1) + S.lb.list.length) % S.lb.list.length; drawLightbox();
    }
  });
  document.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.suggest) showSuggest(e.target); });
  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.change === 'co-biz' && S.co) { S.co.bizId = Number(el.value); drawCheckout(); return; }
    if (el.dataset.change === 'sort') { S.q.sort = el.value; rerender(); return; }
    if (el.dataset.change === 'cat') { S.q.cat = el.value; rerender(); return; }
    if (el.dataset.change === 'rv-sort') { S.revSort = el.value; rerender(); return; }
    if (el.dataset.fqAmen && S.fq) { const a = el.dataset.fqAmen, arr = S.fq.amen, i = arr.indexOf(a); if (el.checked && i < 0) arr.push(a); if (!el.checked && i >= 0) arr.splice(i, 1); const bt = $('#fqApply'); if (bt) bt.textContent = t('filter.show', { n: N(searchResults(S.fq).length) }); return; }
    if (el.dataset.upload) {
      const kind = el.dataset.upload;
      if (kind === 'review') {
        const add = await readImages(el.files, 4 - S.draft.photos.length);
        S.draft.photos.push(...add); $('#draftPhotos').innerHTML = draftThumbs();
      } else if (kind === 'wiz') {
        const add = await readImages(el.files, 6 - S.wiz.data.photos.length);
        S.wiz.data.photos.push(...add); rerender();
      } else if (kind === 'owner') {
        const b = ownerBiz(); const add = await readImages(el.files, 8);
        if (add.length) { b.photos.push(...add); save(); toast(t('own.photos.added', { n: N(add.length) }), 'image'); rerender(); }
      }
    }
  });
  ['dragover', 'dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => {
    const z = e.target.closest && e.target.closest('.dropzone');
    if (!z) return;
    e.preventDefault();
    z.classList.toggle('over', ev === 'dragover');
    if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length) {
      const input = $('input[type="file"]', z);
      const dt = new DataTransfer(); Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
      input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }));
  document.addEventListener('mouseover', e => {
    const row = e.target.closest && e.target.closest('[data-row]');
    if (row && resultsMap) resultsMap.setActive(Number(row.dataset.row));
  });
  window.addEventListener('hashchange', () => render(true));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!prefs.theme) renderHeader(); });

  /* ================= Boot ================= */
  document.body.insertAdjacentHTML('afterbegin', ART.sprite);
  applyLang();
  if (prefs.theme) document.documentElement.setAttribute('data-theme', prefs.theme);
  renderFooter();
  render(false);
  // Keep open/closed labels current while the page stays open.
  setInterval(() => { if (!$('#modalRoot').innerHTML && !document.activeElement.matches('input, textarea, select')) { if (S.route === 'home' || S.route.startsWith('biz-')) rerender(); } }, 5 * 60 * 1000);
})();
