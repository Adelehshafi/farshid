/* Farshid demo: icon sprite, category illustrations and the stylised Tehran base map. */
(function () {
  let uidN = 0;
  const uid = p => `${p}${++uidN}`;

  /* ---------------- Icons (24×24 line icons) ---------------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    heart: '<path d="M12 20s-7-4.4-9-9.2C1.6 7.3 4 4 7.4 4c2 0 3.4 1.1 4.6 2.6C13.2 5.1 14.6 4 16.6 4 20 4 22.4 7.3 21 10.8 19 15.6 12 20 12 20Z"/>',
    share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    'chev-l': '<path d="m15 6-6 6 6 6"/>', 'chev-r': '<path d="m9 6 6 6-6 6"/>', 'chev-d': '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    target: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>', expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    thumb: '<path d="M7 10v10H4V10h3Z"/><path d="M7 10l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7a2 2 0 0 1-2 1.7H7"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    store: '<path d="M4 10v10h16V10"/><path d="M3 10 5 4h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/><path d="M10 20v-5h4v5"/>',
    shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
    parking: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    tree: '<path d="M12 21v-5"/><path d="M12 3 6 11h3l-4 5h14l-4-5h3l-6-8Z"/>',
    wheelchair: '<circle cx="12" cy="4.5" r="1.5"/><path d="M12 7v6h5l2 5"/><path d="M9 10a5.5 5.5 0 1 0 6.5 8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    kids: '<circle cx="12" cy="5.5" r="2.5"/><path d="M12 8v7M7.5 11h9M9 21l3-6 3 6"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7 4 17"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    locate: '<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8.2 4a2 2 0 0 0 0 4H12Zm0 0s1.5-4 3.8-4a2 2 0 0 1 0 4H12Z"/>',
    logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 16l4-4-4-4M20 12H9"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    quote: '<path d="M9 7H5v6h4v-1a4 4 0 0 1-4 4M19 7h-4v6h4v-1a4 4 0 0 1-4 4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6l2-8Z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
    leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>',
    sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    'c-food': '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2.5 1-4 3.5-4 7 0 2 1 3 4 3"/>',
    'c-cafe': '<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1.5-1 1.5-1 3M12 3c0 1.5-1 1.5-1 3"/>',
    'c-auto': '<path d="M5 15v-3l2-5h10l2 5v3"/><path d="M3 15h18v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z"/><path d="M5 12h14"/>',
    'c-beauty': '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 20 18M8 16.5 20 6"/>',
    'c-home': '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    'c-health': '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z"/><path d="M12 10v4M10 12h4"/>',
    'c-shop': '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    'c-fitness': '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'
  };
  const sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') +
    '<symbol id="i-star" viewBox="0 0 20 20"><path d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></symbol>' +
    '<symbol id="i-verified" viewBox="0 0 24 24"><path d="M12 1.8l2.4 1.8 3-.3 1.1 2.8 2.7 1.4-.5 3 1.5 2.6-2 2.3-.1 3-2.9.8-1.7 2.5-2.9-.9-2.9.9-1.7-2.5-2.9-.8-.1-3-2-2.3 1.5-2.6-.5-3 2.7-1.4L6.6 3.3l3 .3z"/><path d="m8.3 12.3 2.4 2.4 5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-logo" viewBox="0 0 32 32"><path d="M16 30s-11-9.4-11-17.5a11 11 0 0 1 22 0C27 20.6 16 30 16 30Z" fill="currentColor"/><path d="M16 6.5l1.7 3.6 3.9-.6-.6 3.9 3.6 1.7-3.6 1.7.6 3.9-3.9-.6L16 23.7l-1.7-3.6-3.9.6.6-3.9-3.6-1.7 3.6-1.7-.6-3.9 3.9.6z" fill="var(--logo-star, #fff)"/></symbol>' +
    '</defs></svg>';

  /* ---------------- Illustrations ---------------- */
  // A girih-style eight-point star tile, drawn faintly on walls.
  const girih = (id, c) => `<pattern id="${id}" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M22 5l4.2 12.8L39 22l-12.8 4.2L22 39l-4.2-12.8L5 22l12.8-4.2Z" fill="none" stroke="${c}" stroke-width="1.3"/><rect x="13" y="13" width="18" height="18" transform="rotate(45 22 22)" fill="none" stroke="${c}" stroke-width="1"/></pattern>`;

  const PAL = {
    cafe: [
      { wall: '#2e5b55', sky: '#f6e6c6', wood: '#7d5034', woodTop: '#a26e48', lamp: '#e8a13a', accent: '#d8643c', mug: '#f5efe6' },
      { wall: '#5b3e30', sky: '#f3dcc0', wood: '#3e2a20', woodTop: '#6b4a37', lamp: '#f0b64e', accent: '#6fa49a', mug: '#efe7db' },
      { wall: '#33465c', sky: '#f2e4cf', wood: '#8b5e3c', woodTop: '#b07b52', lamp: '#ebb04d', accent: '#e07f52', mug: '#f8f3ea' }
    ],
    food: [
      { wall: '#ead9bb', arch: '#1e4f78', tile: '#e8c66a', cloth: '#f6f0e4', stripe: '#b54a35', plate: '#ffffff' },
      { wall: '#e9d0b5', arch: '#2a6b63', tile: '#f0d58a', cloth: '#f7efe1', stripe: '#1e4f78', plate: '#fbf8f2' },
      { wall: '#f0dcc4', arch: '#7a2f2a', tile: '#e9c46a', cloth: '#f5ede0', stripe: '#2a6b63', plate: '#ffffff' }
    ],
    auto: [
      { wall: '#3b4a5b', floor: '#262f3a', car: '#d4553b', glass: '#b9d7e6', board: '#4c5d70', line: '#f2c14e' },
      { wall: '#40504a', floor: '#29332f', car: '#2f6fb0', glass: '#c3dde9', board: '#556860', line: '#f2c14e' },
      { wall: '#4a4458', floor: '#2b2833', car: '#e8e2d6', glass: '#a9cbe0', board: '#5d566c', line: '#f0b64e' }
    ],
    beauty: [
      { wall: '#f1d9d3', mirror: '#e6eef0', frame: '#c99a5b', counter: '#ffffff', chair: '#2f6b63', accent: '#d07a86' },
      { wall: '#dfe8e1', mirror: '#eef3f2', frame: '#b98a4e', counter: '#f7f4ef', chair: '#7a3f4c', accent: '#c58a5a' },
      { wall: '#ece2f0', mirror: '#f0f2f6', frame: '#caa264', counter: '#ffffff', chair: '#33465c', accent: '#b0728f' }
    ],
    home: [
      { wall: '#dfe8e4', floor: '#c9a77e', sofa: '#e0a43a', window: '#cfe6f2', accent: '#2f6b63', bucket: '#3b82c4' },
      { wall: '#efe5d8', floor: '#b88e64', sofa: '#4f7f92', window: '#d6ebf5', accent: '#d26a4c', bucket: '#2f9a6b' },
      { wall: '#e3e4ef', floor: '#c7a37c', sofa: '#b8584a', window: '#d2e7f3', accent: '#3d6b55', bucket: '#e0a43a' }
    ],
    health: [
      { wall: '#e4f2ef', floor: '#cfdedb', chair: '#2a8c80', light: '#ffffff', accent: '#e8a13a', window: '#d3ebf4' },
      { wall: '#eaf0f7', floor: '#d3dbe6', chair: '#3d74b8', light: '#ffffff', accent: '#e07f52', window: '#dbeef6' },
      { wall: '#eef3ea', floor: '#d6dfd0', chair: '#4d8a5a', light: '#ffffff', accent: '#d8643c', window: '#d7ecf3' }
    ],
    shop: [
      { facade: '#e9dcc8', awning: '#1f6b8f', awning2: '#f6efe2', glass: '#cfe3ea', door: '#6b4a37', street: '#cfc7ba', accent: '#d8643c' },
      { facade: '#d8e2dd', awning: '#b54a35', awning2: '#fbf4e8', glass: '#d4e6ec', door: '#2f4b5c', street: '#c9c9c2', accent: '#2a8c80' },
      { facade: '#efe0cf', awning: '#2a6b63', awning2: '#f7efe2', glass: '#d2e4ea', door: '#7a3f2a', street: '#cdc4b6', accent: '#e8a13a' }
    ],
    fitness: [
      { wall: '#263238', floor: '#1b2327', window: '#8fb9c9', rack: '#56656d', accent: '#e8a13a', mat: '#2a8c80' },
      { wall: '#2e2a36', floor: '#1f1c25', window: '#9cb7d6', rack: '#5f5a6b', accent: '#d8643c', mat: '#3d74b8' },
      { wall: '#2b3a33', floor: '#1d2823', window: '#a3c9b8', rack: '#5a6b62', accent: '#f0b64e', mat: '#b54a35' }
    ],
    pizza: [
      { wall: '#9c4a32', mortar: '#f3d6c3', oven: '#e2d3c1', ovenDark: '#2a1b15', ovenBase: '#b9a48d', fire: '#f08a24', table: '#5b3c2b', tableTop: '#7a5038' },
      { wall: '#6e3b2e', mortar: '#e8c9b4', oven: '#d8c7b2', ovenDark: '#24160f', ovenBase: '#ad987f', fire: '#f29a32', table: '#3e2a20', tableTop: '#5d4030' },
      { wall: '#3f4a52', mortar: '#c9d2d8', oven: '#e6d9c6', ovenDark: '#2a1b15', ovenBase: '#b9a48d', fire: '#f08a24', table: '#6b4a37', tableTop: '#8b6448' }
    ],
    pharmacy: [
      { wall: '#eef5f2', cross: '#1f9d6a', shelf: '#ffffff', board: '#cfd8d4', counter: '#2d6a62', counterTop: '#3f8a80', boxes: ['#e8a13a', '#3d74b8', '#e07f52', '#7fbf8f', '#c25a6e', '#9aa8b0'] },
      { wall: '#f3f1ec', cross: '#2a8c80', shelf: '#ffffff', board: '#d9d3c7', counter: '#5a4636', counterTop: '#7a5e47', boxes: ['#2f6fb0', '#e8a13a', '#d8643c', '#6fa86b', '#8a5ea8', '#b9c2c8'] },
      { wall: '#eaf0f6', cross: '#2f9a6b', shelf: '#ffffff', board: '#cdd6e0', counter: '#3d4f6b', counterTop: '#566a8a', boxes: ['#e07f52', '#2f9a6b', '#e8a13a', '#3d74b8', '#c25a6e', '#a9b4ba'] }
    ],
    spa: [
      { wall: '#e7ece4', line: '#9aaa8f', window: '#dcebe6', floor: '#c7b39a', ledge: '#a8957c', towel: '#ffffff', towel2: '#e9d8c4', pot: '#c9a27a', bloom: '#e9a0b8' },
      { wall: '#efe6dc', line: '#b8a48c', window: '#e6eef0', floor: '#b89f84', ledge: '#977f66', towel: '#ffffff', towel2: '#d7e4dc', pot: '#8f7a64', bloom: '#d98cc0' },
      { wall: '#e4e8ef', line: '#a3adbf', window: '#e3eef3', floor: '#c4b5a2', ledge: '#a29380', towel: '#ffffff', towel2: '#efe1d1', pot: '#7d8ba3', bloom: '#f0b4c4' }
    ],
    repair: [
      { wall: '#dfe4e8', board: '#c79a63', bench: '#5a4636', benchTop: '#7a5e47', box: '#c8432c', box2: '#a63623', accent: '#e8a13a' },
      { wall: '#e8e2d8', board: '#b98b55', bench: '#3e3a36', benchTop: '#5a544d', box: '#2f6fb0', box2: '#245a90', accent: '#e07f52' },
      { wall: '#e2e8e1', board: '#c79a63', bench: '#4b5a52', benchTop: '#66786e', box: '#2a8c80', box2: '#1f6e65', accent: '#f2c14e' }
    ],
    flowers: [
      { wall: '#f3ece3', frame: '#a8835c', wood: '#a8835c', floor: '#d8c7b2', bucket: '#a9b4ba', leaf: '#6fa86b', blooms: ['#e4576e', '#f2c14e', '#8e6bbf', '#ef7b45', '#ffffff'] },
      { wall: '#e9efe8', frame: '#7a5e47', wood: '#7a5e47', floor: '#cfc4b3', bucket: '#c7cfd3', leaf: '#5d9a5a', blooms: ['#f28aa0', '#f7d987', '#b79ad9', '#f4a77b', '#e4576e'] },
      { wall: '#f4e9ef', frame: '#9b7b5b', wood: '#9b7b5b', floor: '#dccbbb', bucket: '#9fb0b8', leaf: '#6fa86b', blooms: ['#ffffff', '#e4576e', '#f2c14e', '#7aa8d8', '#c27ab8'] }
    ],
    yoga: [
      { wall: '#efe9e1', window: '#dcebf2', floor: '#c9a77e', mat1: '#7aa88f', mat2: '#d98c6a', mat3: '#8a8fc4', basket: '#b88a55', leaf: '#5d9a5a' },
      { wall: '#e6ece8', window: '#e2eef0', floor: '#b8946b', mat1: '#c97b8a', mat2: '#6f9fc4', mat3: '#e0b05a', basket: '#a07650', leaf: '#4f8a5a' },
      { wall: '#ece6ef', window: '#e0e9f4', floor: '#c4a27c', mat1: '#5f9e94', mat2: '#b48ac9', mat3: '#e28f6f', basket: '#9b7b5b', leaf: '#5d9a5a' }
    ],
    bakery: [
      { wall: '#f6eee4', tile: '#d9a35a', wood: '#a8835c', case: '#c86b5a', cake: '#f2c9cf', bread: '#c98a47', bread2: '#b5743a' },
      { wall: '#eef2ec', tile: '#7fa08a', wood: '#8b6a4b', case: '#2a6b63', cake: '#f7e3b5', bread: '#c98a47', bread2: '#a8692f' },
      { wall: '#f3e9f0', tile: '#b48ac0', wood: '#a07650', case: '#3b5a86', cake: '#e9d0f0', bread: '#cf9455', bread2: '#b5743a' }
    ]
  };

  const SCENES = {
    cafe(p, id) {
      return `<defs>${girih(id + 'g', '#fff')}<radialGradient id="${id}l"><stop offset="0" stop-color="${p.lamp}" stop-opacity=".55"/><stop offset="1" stop-color="${p.lamp}" stop-opacity="0"/></radialGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${p.sky}"/></linearGradient></defs>
      <rect width="400" height="300" fill="${p.wall}"/><rect width="400" height="300" fill="url(#${id}g)" opacity=".08"/>
      <path d="M262 182V96a52 52 0 0 1 104 0v86Z" fill="url(#${id}s)"/><path d="M314 44v138M262 120h104" stroke="${p.wall}" stroke-width="5"/>
      <rect x="252" y="180" width="124" height="9" rx="3" fill="${p.woodTop}"/>
      <rect x="30" y="98" width="180" height="7" rx="2" fill="${p.woodTop}"/>
      <rect x="44" y="70" width="18" height="28" rx="3" fill="${p.mug}" opacity=".9"/><rect x="42" y="66" width="22" height="6" rx="2" fill="${p.accent}"/>
      <rect x="72" y="62" width="22" height="36" rx="4" fill="${p.mug}" opacity=".75"/><rect x="70" y="58" width="26" height="6" rx="2" fill="${p.accent}"/>
      <rect x="104" y="76" width="16" height="22" rx="3" fill="${p.mug}" opacity=".85"/>
      <path d="M160 98c-2-14 6-26 16-30-2 12 2 22-2 30Z" fill="#6fa86b"/><path d="M170 98c4-12 14-18 24-16-6 8-10 14-18 16Z" fill="#88bd7c"/><rect x="156" y="90" width="26" height="10" rx="2" fill="${p.accent}"/>
      <path d="M110 0v58M190 0v46" stroke="#1d1a17" stroke-width="2"/>
      <circle cx="110" cy="80" r="56" fill="url(#${id}l)"/><circle cx="190" cy="68" r="48" fill="url(#${id}l)"/>
      <path d="M90 70a20 20 0 0 1 40 0Z" fill="${p.lamp}"/><path d="M172 58a18 18 0 0 1 36 0Z" fill="${p.lamp}"/>
      <rect y="206" width="400" height="94" fill="${p.wood}"/><rect y="200" width="400" height="10" fill="${p.woodTop}"/>
      <path d="M0 236h400M0 268h400" stroke="#000" stroke-opacity=".12" stroke-width="2"/>
      <rect x="34" y="138" width="104" height="64" rx="8" fill="#cdd3d6"/><rect x="34" y="134" width="104" height="10" rx="4" fill="#a9b2b7"/>
      <circle cx="62" cy="168" r="9" fill="#7c868c"/><circle cx="110" cy="168" r="9" fill="#7c868c"/><rect x="54" y="180" width="16" height="12" rx="2" fill="${p.mug}"/><rect x="102" y="180" width="16" height="12" rx="2" fill="${p.mug}"/>
      <ellipse cx="282" cy="214" rx="40" ry="8" fill="${p.mug}" opacity=".9"/>
      <path d="M252 176h60l-6 28q-24 12-48 0Z" fill="${p.mug}"/><path d="M312 184h8a10 10 0 0 1 0 20h-12" fill="none" stroke="${p.mug}" stroke-width="5"/>
      <ellipse cx="282" cy="177" rx="29" ry="6" fill="#6b3e26"/><path d="M282 181c-6-6-12-2-8 2l8 5 8-5c4-4-2-8-8-2Z" fill="#f3e3cf"/>
      <path d="M270 160c-6-8 6-12 0-20M286 158c-6-8 6-12 0-20" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="364" cy="220" rx="22" ry="5" fill="${p.mug}" opacity=".8"/><path d="M348 196h32l-3 20q-13 6-26 0Z" fill="${p.accent}"/>`;
    },
    food(p, id) {
      return `<defs>${girih(id + 'g', p.tile)}</defs>
      <rect width="400" height="300" fill="${p.wall}"/>
      <path d="M90 200V96q0-74 110-90 110 16 110 90v104Z" fill="${p.arch}"/><path d="M90 200V96q0-74 110-90 110 16 110 90v104Z" fill="url(#${id}g)" opacity=".55"/>
      <path d="M90 200V96q0-74 110-90 110 16 110 90v104" fill="none" stroke="${p.tile}" stroke-width="6"/>
      <path d="M200 0v30" stroke="#3a2a1a" stroke-width="2"/><path d="M188 30h24l6 26h-36Z" fill="#c78a2c"/><circle cx="200" cy="66" r="22" fill="#f6c45a" opacity=".35"/>
      <rect y="196" width="400" height="104" fill="${p.cloth}"/><path d="M0 214h400" stroke="${p.stripe}" stroke-width="6"/><path d="M0 224h400" stroke="${p.stripe}" stroke-width="2"/>
      <ellipse cx="150" cy="252" rx="98" ry="30" fill="#000" opacity=".06"/>
      <ellipse cx="150" cy="246" rx="96" ry="30" fill="${p.plate}"/><ellipse cx="150" cy="246" rx="80" ry="22" fill="none" stroke="#e7dcc7" stroke-width="2"/>
      <path d="M86 244q34-34 72 0Z" fill="#fbf6ea"/><path d="M102 232q20-16 40 0q-20 6-40 0Z" fill="#f2b53c"/>
      <rect x="150" y="226" width="96" height="11" rx="5" fill="#8a4a2a"/><rect x="150" y="242" width="96" height="11" rx="5" fill="#7a3f22"/>
      <path d="M160 226v11M176 226v11M192 226v11M208 226v11M224 226v11" stroke="#5a2c16" stroke-width="2" opacity=".5"/>
      <rect x="140" y="230" width="116" height="3" rx="1.5" fill="#c9ced1"/><rect x="140" y="246" width="116" height="3" rx="1.5" fill="#c9ced1"/>
      <circle cx="226" cy="262" r="10" fill="#d4472f"/><circle cx="212" cy="266" r="5" fill="#6aa84f"/><circle cx="218" cy="258" r="4" fill="#7dbb5e"/>
      <path d="M290 176h44v68q-22 8-44 0Z" fill="#f7f4ee" opacity=".95"/><path d="M290 190h44" stroke="#b9d8c0" stroke-width="5"/><circle cx="306" cy="208" r="3" fill="#6aa84f"/><circle cx="318" cy="218" r="3" fill="#6aa84f"/>
      <path d="M342 238l40-14 6 18-40 14Z" fill="#e8cf9a"/><circle cx="356" cy="240" r="2" fill="#b88a4a"/><circle cx="368" cy="236" r="2" fill="#b88a4a"/>`;
    },
    auto(p, id) {
      return `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.floor}"/><stop offset="1" stop-color="#11161c"/></linearGradient></defs>
      <rect width="400" height="300" fill="${p.wall}"/>
      <path d="M0 18h400M0 36h400M0 54h400M0 72h400" stroke="#000" stroke-opacity=".12" stroke-width="2"/>
      <rect x="24" y="96" width="120" height="78" rx="6" fill="${p.board}"/>
      <path d="M42 112l18 18M54 112l-12 12M84 108v40M78 108h12M108 112q10 10 0 20q-10-10 0-20Z" stroke="#c7d0d8" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="122" cy="152" r="7" fill="none" stroke="#c7d0d8" stroke-width="4"/>
      <rect x="230" y="20" width="150" height="10" rx="5" fill="#f4f1de" opacity=".9"/><path d="M240 30l-20 70h170l-20-70" fill="#fff" opacity=".06"/>
      <rect y="206" width="400" height="94" fill="url(#${id}f)"/><path d="M40 286l40-80M180 300l14-94M320 300l-10-94" stroke="${p.line}" stroke-width="4" opacity=".5"/>
      <path d="M120 236q4-32 40-40l34-28q16-10 46-10h52q30 0 52 26l22 14q20 6 22 26v12z" fill="${p.car}"/>
      <path d="M200 176q12-10 36-10h30v36h-84Z" fill="${p.glass}"/><path d="M274 166h10q18 0 32 18l8 18h-50Z" fill="${p.glass}"/>
      <path d="M120 236h268" stroke="#000" stroke-opacity=".25" stroke-width="3"/><rect x="368" y="214" width="16" height="8" rx="3" fill="#fde9a8"/>
      <circle cx="178" cy="240" r="25" fill="#1b1f24"/><circle cx="178" cy="240" r="12" fill="#c7cdd2"/><circle cx="330" cy="240" r="25" fill="#1b1f24"/><circle cx="330" cy="240" r="12" fill="#c7cdd2"/>
      <ellipse cx="48" cy="270" rx="34" ry="9" fill="#111"/><ellipse cx="48" cy="252" rx="34" ry="9" fill="#2a2e33"/><ellipse cx="48" cy="234" rx="34" ry="9" fill="#33383e"/><ellipse cx="48" cy="234" rx="14" ry="4" fill="#15181b"/>
      <rect x="86" y="248" width="18" height="24" rx="3" fill="${p.line}"/><rect x="90" y="242" width="10" height="7" rx="2" fill="#333"/>`;
    },
    beauty(p, id) {
      return `<defs>${girih(id + 'g', p.frame)}<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${p.mirror}"/></linearGradient></defs>
      <rect width="400" height="300" fill="${p.wall}"/><rect width="400" height="300" fill="url(#${id}g)" opacity=".18"/>
      <path d="M140 190V90a60 60 0 0 1 120 0v100Z" fill="url(#${id}m)" stroke="${p.frame}" stroke-width="8"/>
      <path d="M160 170l70-90M180 180l60-74" stroke="#fff" stroke-width="6" opacity=".7"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(k => { const a = Math.PI * (k / 6); return `<circle cx="${200 - Math.cos(a) * 74}" cy="${90 - Math.sin(a) * 74}" r="6" fill="#fff6d8" stroke="${p.frame}" stroke-width="2"/>`; }).join('')}
      <rect x="96" y="190" width="208" height="16" rx="4" fill="${p.counter}"/><rect x="104" y="206" width="192" height="94" fill="${p.counter}" opacity=".7"/>
      <rect x="116" y="160" width="14" height="30" rx="4" fill="${p.accent}"/><rect x="119" y="154" width="8" height="8" rx="2" fill="#333"/>
      <rect x="138" y="170" width="18" height="20" rx="8" fill="#fff" stroke="${p.frame}" stroke-width="2"/>
      <rect x="266" y="164" width="20" height="26" rx="3" fill="${p.frame}" opacity=".8"/><path d="M270 164l-4-22M276 164v-24M282 164l4-20" stroke="#5a4636" stroke-width="3" stroke-linecap="round"/>
      <path d="M40 300v-60q0-24 24-24h12q24 0 24 24v60" fill="${p.chair}"/><rect x="30" y="250" width="80" height="16" rx="8" fill="${p.chair}" opacity=".85"/>
      <path d="M340 190c-6-22 4-46 20-52-2 22 6 36 0 52ZM356 190c6-18 20-26 34-22-8 12-14 20-26 22Z" fill="#6fa86b"/><rect x="334" y="186" width="40" height="30" rx="4" fill="${p.accent}"/>`;
    },
    home(p, id) {
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="236" y="34" width="130" height="120" rx="6" fill="${p.window}" stroke="#fff" stroke-width="8"/><path d="M301 34v120M236 94h130" stroke="#fff" stroke-width="6"/>
      <path d="M226 30h150" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/><path d="M230 30q-6 70 4 130M372 30q6 70-4 130" stroke="${p.accent}" stroke-width="10" opacity=".55" fill="none"/>
      <rect y="214" width="400" height="86" fill="${p.floor}"/><path d="M0 238h400M0 266h400M60 214v24M160 238v28M260 214v24M340 238v28" stroke="#000" stroke-opacity=".1" stroke-width="2"/>
      <rect x="30" y="150" width="190" height="56" rx="18" fill="${p.sofa}"/><rect x="22" y="176" width="206" height="44" rx="14" fill="${p.sofa}"/><rect x="40" y="168" width="80" height="30" rx="10" fill="#fff" opacity=".22"/><rect x="128" y="168" width="80" height="30" rx="10" fill="#fff" opacity=".22"/>
      <rect x="34" y="218" width="8" height="12" fill="#5a4030"/><rect x="208" y="218" width="8" height="12" fill="#5a4030"/>
      <path d="M262 214l10-60h20l10 60Z" fill="#f3e3c3"/><path d="M282 214v-60" stroke="#5a4030" stroke-width="3"/>
      <path d="M320 206h40l-6 38h-28Z" fill="${p.bucket}"/><path d="M322 206q18-24 36 0" fill="none" stroke="#444" stroke-width="3"/><ellipse cx="340" cy="206" rx="20" ry="4" fill="#bfe1f5"/>
      <path d="M372 216h16v28h-16Z" fill="#fff"/><path d="M374 216v-10h8l6 6" fill="none" stroke="${p.accent}" stroke-width="4"/>
      ${[[94, 120, 9], [250, 186, 7], [180, 128, 6], [308, 172, 6]].map(([x, y, r]) => `<path d="M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}Z" fill="#fff"/>`).join('')}`;
    },
    health(p, id) {
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="250" y="40" width="120" height="104" rx="8" fill="${p.window}" stroke="#fff" stroke-width="8"/><path d="M310 40v104" stroke="#fff" stroke-width="6"/>
      <circle cx="120" cy="80" r="44" fill="#fff"/><path d="M104 62q16-10 32 0q8 10 0 34l-6 20q-4 6-8-4l-2-10-2 10q-4 10-8 4l-6-20q-8-24 0-34Z" fill="none" stroke="${p.chair}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="166" y="40" width="10" height="28" rx="2" fill="${p.accent}"/><rect x="157" y="49" width="28" height="10" rx="2" fill="${p.accent}"/>
      <rect y="220" width="400" height="80" fill="${p.floor}"/>
      <path d="M150 220l20-50h110q20 0 24 18l6 32Z" fill="${p.chair}"/><path d="M150 220l-30-60q-6-12 8-14l20-2 22 26" fill="${p.chair}" opacity=".85"/><rect x="200" y="220" width="16" height="40" fill="#8da3a0"/><rect x="170" y="256" width="76" height="10" rx="5" fill="#8da3a0"/>
      <path d="M330 220V150l-50-30" fill="none" stroke="#8da3a0" stroke-width="6" stroke-linecap="round"/><ellipse cx="270" cy="116" rx="22" ry="12" fill="${p.light}" stroke="#8da3a0" stroke-width="4"/>
      <rect x="40" y="170" width="70" height="50" rx="6" fill="#30474a"/><rect x="46" y="176" width="58" height="34" rx="3" fill="#9fd3ce"/><path d="M52 196l10 0 6-10 8 18 6-8h16" fill="none" stroke="#fff" stroke-width="2.5"/>
      <path d="M362 220c-6-22 4-40 18-46-2 20 6 32 0 46Z" fill="#6fa86b"/><rect x="354" y="214" width="32" height="24" rx="4" fill="${p.accent}"/>`;
    },
    shop(p, id) {
      return `<defs>${girih(id + 'g', p.awning)}</defs>
      <rect width="400" height="300" fill="#cfe3ea"/>
      <rect x="20" y="20" width="360" height="236" fill="${p.facade}"/><rect x="20" y="20" width="360" height="40" fill="url(#${id}g)" opacity=".35"/>
      <rect x="120" y="30" width="160" height="22" rx="4" fill="${p.awning}"/>
      <path d="M28 70h344l-12 40H40Z" fill="${p.awning}"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<path d="M${40 + k * 40} 110l20-40h20l-20 40Z" fill="${p.awning2}"/>`).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => `<path d="M${40 + k * 40} 110a20 12 0 0 0 40 0" fill="${k % 2 ? p.awning2 : p.awning}"/>`).join('')}
      <rect x="44" y="132" width="200" height="118" rx="4" fill="${p.glass}" stroke="#fff" stroke-width="6"/>
      <path d="M70 250v-40h40v40M126 250v-56h44v56" fill="${p.accent}" opacity=".85"/><path d="M80 210q10-18 20 0M138 194q10-20 20 0" fill="none" stroke="#333" stroke-width="3"/>
      <rect x="182" y="214" width="44" height="36" rx="3" fill="${p.awning}"/><rect x="190" y="200" width="28" height="14" rx="3" fill="${p.awning2}"/>
      <path d="M60 150l60 70" stroke="#fff" stroke-width="8" opacity=".35"/>
      <rect x="268" y="128" width="84" height="128" rx="4" fill="${p.door}"/><rect x="280" y="140" width="60" height="70" rx="3" fill="${p.glass}" opacity=".8"/><circle cx="338" cy="230" r="4" fill="#f2c14e"/>
      <rect y="256" width="400" height="44" fill="${p.street}"/><path d="M0 270h400" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
      <path d="M18 256c-6-20 2-36 14-42 0 18 4 30-2 42Z" fill="#6fa86b"/><rect x="10" y="248" width="30" height="16" rx="3" fill="${p.awning}"/>`;
    },
    fitness(p, id) {
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="40" y="30" width="320" height="90" rx="6" fill="${p.window}" opacity=".85"/><path d="M120 30v90M200 30v90M280 30v90" stroke="${p.wall}" stroke-width="8"/>
      <path d="M60 120l40-90M180 120l40-90" stroke="#fff" stroke-opacity=".25" stroke-width="10"/>
      <rect y="226" width="400" height="74" fill="${p.floor}"/><path d="M0 250h400" stroke="#fff" stroke-opacity=".06" stroke-width="2"/>
      <rect x="34" y="150" width="200" height="8" rx="4" fill="${p.rack}"/><rect x="34" y="196" width="200" height="8" rx="4" fill="${p.rack}"/><rect x="40" y="150" width="8" height="78" fill="${p.rack}"/><rect x="220" y="150" width="8" height="78" fill="${p.rack}"/>
      ${[0, 1, 2, 3].map(k => `<g transform="translate(${66 + k * 44} 0)"><rect x="-14" y="136" width="10" height="22" rx="3" fill="#15191c"/><rect x="4" y="136" width="10" height="22" rx="3" fill="#15191c"/><rect x="-6" y="144" width="12" height="6" fill="#9aa5ab"/><rect x="-14" y="182" width="10" height="22" rx="3" fill="${k % 2 ? p.accent : '#15191c'}"/><rect x="4" y="182" width="10" height="22" rx="3" fill="${k % 2 ? p.accent : '#15191c'}"/><rect x="-6" y="190" width="12" height="6" fill="#9aa5ab"/></g>`).join('')}
      <path d="M250 240h130l-6 14H256Z" fill="${p.mat}"/>
      <circle cx="300" cy="206" r="20" fill="#15191c"/><path d="M288 190q12-22 24 0" fill="none" stroke="#15191c" stroke-width="7"/><rect x="292" y="200" width="16" height="6" rx="2" fill="${p.accent}"/>
      <path d="M352 120q10 60-4 120" fill="none" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/>`;
    },
    pizza(p, id) {
      let bricks = '';
      for (let r = 0, y = 0; y < 222; r++, y += 22) { bricks += `M0 ${y}H400`; for (let x = (r % 2) * 22; x < 400; x += 44) bricks += `M${x} ${y}V${y + 22}`; }
      return `<defs><radialGradient id="${id}f"><stop offset="0" stop-color="#ffd27a"/><stop offset=".6" stop-color="${p.fire}"/><stop offset="1" stop-color="#7a2410"/></radialGradient></defs>
      <rect width="400" height="300" fill="${p.wall}"/><path d="${bricks}" stroke="${p.mortar}" stroke-opacity=".28" stroke-width="2"/>
      <path d="M200 210V150q0-90 95-96q95 6 95 96v60Z" fill="${p.oven}"/>
      <path d="M240 210v-38q0-40 55-42q55 2 55 42v38Z" fill="${p.ovenDark}"/>
      <ellipse cx="295" cy="198" rx="42" ry="16" fill="url(#${id}f)"/>
      <path d="M268 200q8-28 18-8q6-22 14 2q8-16 13 6Z" fill="#ffb347"/>
      <rect x="190" y="208" width="210" height="14" fill="${p.ovenBase}"/>
      <rect y="222" width="400" height="78" fill="${p.table}"/><rect y="218" width="400" height="8" fill="${p.tableTop}"/>
      <rect x="8" y="238" width="80" height="10" rx="5" fill="#a87447"/>
      <ellipse cx="150" cy="244" rx="88" ry="34" fill="#c99255"/>
      <ellipse cx="150" cy="240" rx="76" ry="28" fill="#e9b16b"/>
      <ellipse cx="150" cy="240" rx="65" ry="23" fill="#c8432c"/>
      ${[[126, 232, 14], [160, 230, 12], [178, 244, 11], [136, 250, 13], [112, 244, 9], [154, 248, 8]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .45}" fill="#f8e6a6"/>`).join('')}
      ${[[144, 238, -20], [170, 236, 30], [124, 244, 10], [190, 240, -40]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#3f8a3a" transform="rotate(${a} ${x} ${y})"/>`).join('')}
      <rect x="356" y="182" width="16" height="38" rx="5" fill="#7fa04a"/><rect x="360" y="172" width="8" height="12" fill="#3b3b3b"/>
      <path d="M340 220c-4-14 2-26 10-30 0 12 2 20-2 30Z" fill="#5d9a5a"/>`;
    },
    pharmacy(p, id) {
      const shelf = (x0) => {
        let o = `<rect x="${x0}" y="70" width="140" height="150" rx="4" fill="${p.shelf}"/>`;
        [108, 146, 184, 218].forEach((y, r) => {
          o += `<rect x="${x0}" y="${y}" width="140" height="5" fill="${p.board}"/>`;
          if (r < 3) for (let i = 0, x = x0 + 8; x < x0 + 128; i++) { const w = 12 + ((i * 7 + r * 3) % 6), hgt = 18 + ((i * 5 + r) % 12); o += `<rect x="${x}" y="${y + 38 - hgt}" width="${w}" height="${hgt}" rx="2" fill="${p.boxes[(i + r * 2) % p.boxes.length]}"/>`; x += w + 4; }
        });
        return o;
      };
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="170" y="18" width="60" height="60" rx="14" fill="${p.cross}"/><path d="M193 30h14v12h12v14h-12v12h-14v-12h-12v-14h12Z" fill="#fff"/>
      <circle cx="200" cy="48" r="44" fill="${p.cross}" opacity=".08"/>
      ${shelf(18)}${shelf(242)}
      <rect y="226" width="400" height="74" fill="${p.counter}"/><rect y="222" width="400" height="8" fill="${p.counterTop}"/>
      <rect x="176" y="194" width="22" height="30" rx="5" fill="#fff"/><rect x="174" y="188" width="26" height="9" rx="3" fill="${p.cross}"/>
      <rect x="208" y="206" width="42" height="18" rx="3" fill="#dfe6ea"/>${[0, 1, 2, 3].map(k => `<circle cx="${216 + k * 9}" cy="215" r="3" fill="#fff" stroke="#b8c4ca"/>`).join('')}
      <path d="M150 222c-6-16 2-30 12-34 0 14 4 24-2 34Z" fill="#6fa86b"/><rect x="142" y="212" width="24" height="12" rx="3" fill="${p.counterTop}"/>`;
    },
    spa(p, id) {
      return `<defs>${girih(id + 'g', p.line)}<radialGradient id="${id}c"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
      <rect width="400" height="300" fill="${p.wall}"/><rect width="400" height="300" fill="url(#${id}g)" opacity=".12"/>
      <rect x="250" y="30" width="120" height="140" rx="8" fill="${p.window}"/>
      ${[[278, 30, 170], [302, 50, 170], [344, 36, 170]].map(([x, y1, y2]) => `<path d="M${x} ${y1}V${y2}" stroke="#6f9b5a" stroke-width="6"/><path d="M${x - 4} ${y1 + 40}h8M${x - 4} ${y1 + 80}h8" stroke="#5a8048" stroke-width="3"/><ellipse cx="${x + 12}" cy="${y1 + 30}" rx="12" ry="4" fill="#7fae66" transform="rotate(-25 ${x + 12} ${y1 + 30})"/>`).join('')}
      <rect y="230" width="400" height="70" fill="${p.floor}"/><rect y="224" width="400" height="8" fill="${p.ledge}"/>
      <ellipse cx="130" cy="216" rx="46" ry="12" fill="#6b6f72"/><ellipse cx="130" cy="198" rx="36" ry="10" fill="#85898c"/><ellipse cx="130" cy="183" rx="26" ry="8" fill="#9ea2a4"/><ellipse cx="130" cy="171" rx="16" ry="6" fill="#b7bbbd"/>
      <circle cx="210" cy="178" r="34" fill="url(#${id}c)"/>
      <rect x="196" y="186" width="18" height="38" rx="3" fill="#fbf3e4"/><rect x="222" y="198" width="18" height="26" rx="3" fill="#fbf3e4"/>
      <path d="M205 185q-6-10 0-18q6 8 0 18Z" fill="#f2a13a"/><path d="M231 197q-6-10 0-18q6 8 0 18Z" fill="#f2a13a"/>
      <circle cx="300" cy="212" r="12" fill="${p.towel}"/><circle cx="326" cy="212" r="12" fill="${p.towel2}"/><circle cx="313" cy="191" r="12" fill="${p.towel}"/>
      ${[[300, 212], [326, 212], [313, 191]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#c9bfb2" stroke-width="2"/>`).join('')}
      <path d="M68 214q2-56 30-86" stroke="#5a7a4a" stroke-width="3" fill="none"/><path d="M70 190q-14-10-22-2q10 10 22 2Z" fill="#6f9b5a"/>
      ${[[96, 132], [86, 146], [100, 152], [78, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${p.bloom}"/><circle cx="${x}" cy="${y}" r="2.5" fill="#f7d987"/>`).join('')}
      <rect x="54" y="212" width="30" height="14" rx="4" fill="${p.pot}"/>`;
    },
    repair(p, id) {
      let dots = '';
      for (let y = 34; y < 170; y += 14) for (let x = 34; x < 250; x += 14) dots += `<circle cx="${x}" cy="${y}" r="1.6"/>`;
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="24" y="24" width="230" height="150" rx="6" fill="${p.board}"/><g fill="#000" opacity=".18">${dots}</g>
      <rect x="50" y="52" width="8" height="70" rx="3" fill="#8b5a2b"/><rect x="38" y="44" width="32" height="14" rx="3" fill="#5d6a73"/>
      <rect x="98" y="58" width="10" height="70" rx="5" fill="#9aa5ab"/><circle cx="103" cy="54" r="12" fill="#9aa5ab"/><circle cx="103" cy="49" r="6" fill="${p.board}"/>
      <rect x="146" y="50" width="12" height="34" rx="4" fill="${p.accent}"/><rect x="150" y="84" width="4" height="40" fill="#c7d0d6"/>
      <path d="M196 52l14 70M226 52l-14 70" stroke="#5d6a73" stroke-width="6" stroke-linecap="round"/>
      <rect x="212" y="134" width="30" height="26" rx="6" fill="#f2c14e"/><circle cx="227" cy="147" r="6" fill="#3b3b3b"/>
      <path d="M320 0v38" stroke="#333" stroke-width="2"/><circle cx="320" cy="58" r="40" fill="#ffe9a0" opacity=".3"/><circle cx="320" cy="58" r="16" fill="#fff3c4"/><rect x="314" y="36" width="12" height="9" fill="#888"/>
      <rect y="214" width="400" height="86" fill="${p.bench}"/><rect y="206" width="400" height="12" fill="${p.benchTop}"/>
      <rect x="236" y="160" width="130" height="48" rx="6" fill="${p.box}"/><rect x="236" y="160" width="130" height="16" rx="6" fill="${p.box2}"/><path d="M278 160v-14h46v14" fill="none" stroke="#333" stroke-width="5"/><rect x="292" y="180" width="18" height="8" rx="2" fill="#e9eef0"/>
      <path d="M0 262h140q20 0 20-20v-22" fill="none" stroke="#9aa5ab" stroke-width="10"/><circle cx="160" cy="220" r="8" fill="#7d878c"/>
      <path d="M60 206l26-22 6 6-26 22Z" fill="#9aa5ab"/>`;
    },
    flowers(p, id) {
      const bucket = (x, k) => {
        let o = `<path d="M${x} 196h52l-6 44h-40Z" fill="${p.bucket}"/><path d="M${x} 196h52" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>`;
        for (let i = 0; i < 6; i++) { const sx = x + 8 + i * 7, ty = 150 + ((i * 13 + k * 7) % 22); o += `<path d="M${sx + 2} 198L${sx} ${ty + 8}" stroke="${p.leaf}" stroke-width="2.5"/>`; }
        for (let i = 0; i < 7; i++) { const bx = x + 6 + ((i * 17 + k * 5) % 42), by = 146 + ((i * 11 + k * 3) % 26), c = p.blooms[(i + k) % p.blooms.length]; o += `<circle cx="${bx}" cy="${by}" r="${8 + (i % 3) * 2}" fill="${c}"/><circle cx="${bx}" cy="${by}" r="2.5" fill="#f7d987" opacity=".9"/>`; }
        return o;
      };
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="262" y="34" width="110" height="80" rx="6" fill="#2f3a36" stroke="${p.frame}" stroke-width="6"/>
      <path d="M280 56h60M280 72h74M280 88h46" stroke="#f3efe6" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <rect x="24" y="100" width="210" height="8" rx="3" fill="${p.wood}"/>
      ${[40, 92, 144, 196].map((x, i) => `<rect x="${x}" y="78" width="26" height="22" rx="3" fill="${p.blooms[(i + 3) % p.blooms.length]}" opacity=".85"/><path d="M${x + 13} 78c-10-16-4-30 6-34 0 14 6 22-6 34Z" fill="${p.leaf}"/><path d="M${x + 13} 78c8-12 18-14 24-10-6 8-12 12-24 10Z" fill="${p.leaf}" opacity=".8"/>`).join('')}
      <rect y="236" width="400" height="64" fill="${p.floor}"/>
      ${[30, 100, 170, 240, 310].map((x, k) => bucket(x, k)).join('')}`;
    },
    yoga(p, id) {
      return `<rect width="400" height="300" fill="${p.wall}"/>
      <rect x="40" y="20" width="150" height="150" rx="8" fill="${p.window}"/><path d="M115 20v150M40 95h150" stroke="${p.wall}" stroke-width="6"/>
      <rect y="190" width="400" height="110" fill="${p.floor}"/><path d="M0 214h400M0 242h400M0 272h400" stroke="#000" stroke-opacity=".08" stroke-width="2"/>
      <path d="M60 170 L120 300 L210 300 L170 170Z" fill="#fff" opacity=".16"/>
      <path d="M70 282 L128 206 L188 206 L150 282Z" fill="${p.mat1}"/>
      <path d="M180 282 L214 206 L274 206 L262 282Z" fill="${p.mat2}"/>
      <path d="M290 282 L300 206 L360 206 L372 282Z" fill="${p.mat3}"/>
      <rect x="226" y="236" width="28" height="16" rx="3" fill="#e9d8b4"/><rect x="230" y="226" width="20" height="12" rx="2" fill="#d9c59c"/>
      <rect x="318" y="150" width="56" height="44" rx="6" fill="${p.basket}"/>
      ${[[330, 146, p.mat1], [346, 140, p.mat2], [362, 146, p.mat3]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff" opacity=".5"/>`).join('')}
      <rect x="214" y="160" width="30" height="30" rx="4" fill="#d9c59c"/>
      <path d="M229 160c-26-12-30-44-12-62 6 22 16 36 12 62Z" fill="${p.leaf}"/><path d="M229 160c20-16 38-18 48-8-14 8-26 12-48 8Z" fill="${p.leaf}" opacity=".85"/><path d="M229 160c-2-30 8-52 26-60-2 24-10 42-26 60Z" fill="${p.leaf}" opacity=".7"/>`;
    },
    bakery(p, id) {
      return `<defs>${girih(id + 'g', p.tile)}</defs>
      <rect width="400" height="300" fill="${p.wall}"/><rect width="400" height="150" fill="url(#${id}g)" opacity=".25"/>
      <rect x="30" y="56" width="340" height="8" rx="2" fill="${p.wood}"/><rect x="30" y="112" width="340" height="8" rx="2" fill="${p.wood}"/>
      ${[[60, 44, 30, 12], [110, 40, 22, 16], [150, 44, 30, 12], [200, 40, 22, 16], [250, 44, 30, 12], [300, 40, 22, 16], [345, 44, 22, 12]].map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${i % 2 ? p.bread2 : p.bread}"/><path d="M${x - rx * .5} ${y - 2}l8 -4M${x} ${y - 3}l8 -4" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>`).join('')}
      ${[70, 120, 170, 220, 270, 320].map((x, i) => `<rect x="${x - 22}" y="${96 - (i % 2) * 4}" width="44" height="${16 + (i % 2) * 4}" rx="8" fill="${i % 2 ? p.bread : p.bread2}"/>`).join('')}
      <rect x="20" y="170" width="360" height="130" rx="6" fill="${p.case}"/>
      <rect x="30" y="180" width="340" height="72" rx="4" fill="#eef6f8" opacity=".9"/>
      <rect x="40" y="226" width="320" height="5" rx="2" fill="#cfd8dc"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const x = 56 + i * 40, c = ['#f2c9cf', '#7a4a2a', '#f7e3b5', '#e8a13a'][i % 4]; return `<circle cx="${x}" cy="214" r="13" fill="#e9c08a"/><path d="M${x - 12} 211a12 9 0 0 1 24 0Z" fill="${c}"/>`; }).join('')}
      <path d="M30 252l340 0" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
      <rect x="250" y="146" width="70" height="6" rx="3" fill="#fff"/><rect x="282" y="152" width="6" height="18" fill="#fff"/>
      <path d="M256 146q0-28 29-30q29 2 29 30Z" fill="${p.cake}"/><path d="M258 132q8 8 14 0q8 8 14 0q8 8 14 0q6 6 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="285" cy="112" r="5" fill="#d8434f"/>`;
    }
  };

  // Detail shots: each is a 4:3 frame of the 400×300 scene that holds a complete subject.
  const CROPS = {
    cafe: ['0 0 400 300', '200 118 180 135', '10 6 240 180', '208 26 192 144', '14 110 152 114'],
    food: ['0 0 400 300', '36 120 240 180', '262 150 136 102', '70 0 260 195'],
    auto: ['0 0 400 300', '112 90 280 210', '8 70 160 120', '0 195 140 105'],
    beauty: ['0 0 400 300', '80 10 240 180', '100 120 200 150', '0 175 160 120', '296 126 104 78'],
    home: ['0 0 400 300', '4 104 248 186', '212 18 188 141', '290 160 110 82'],
    health: ['0 0 400 300', '100 70 280 210', '56 20 160 120', '20 150 120 90', '236 26 150 112'],
    shop: ['0 0 400 300', '36 120 216 162', '200 108 200 150', '20 20 240 180'],
    fitness: ['0 0 400 300', '20 110 228 171', '200 110 200 150', '60 16 240 180'],
    pizza: ['0 0 400 300', '56 158 188 141', '188 40 212 159', '250 120 150 112'],
    pharmacy: ['0 0 400 300', '140 6 120 90', '10 62 180 135', '150 170 160 120', '234 62 160 120'],
    spa: ['0 0 400 300', '70 140 200 150', '250 150 120 90', '30 120 140 105', '240 26 140 105'],
    repair: ['0 0 400 300', '226 140 160 120', '16 16 248 186', '264 4 112 84'],
    flowers: ['0 0 400 300', '24 130 224 168', '252 24 132 99', '16 40 232 174'],
    yoga: ['0 0 400 300', '60 120 240 180', '296 118 100 75', '24 10 200 150'],
    bakery: ['0 0 400 300', '30 150 200 150', '230 100 160 120', '24 30 240 180']
  };

  function scene(cat, seed = 0, crop = 0, variant) {
    const key = SCENES[variant] ? variant : (SCENES[cat] ? cat : 'shop');
    const fn = SCENES[key], pals = PAL[key] || PAL.shop, crops = CROPS[key] || ['0 0 400 300'];
    let pi = Math.abs(seed) % pals.length, ci = Math.abs(crop);
    if (ci >= crops.length) { pi = (pi + 1) % pals.length; ci %= crops.length; }
    const flip = Math.abs(seed) % 2 === 1;
    let vb = crops[ci];
    if (flip) { const [x, y, w, h] = vb.split(' ').map(Number); vb = `${400 - x - w} ${y} ${w} ${h}`; }
    const id = uid('s');
    return `<svg class="art" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g${flip ? ' transform="matrix(-1 0 0 1 400 0)"' : ''}>${fn(pals[pi], id)}</g></svg>`;
  }

  /* ---------------- Base map (1000×800, north up) ---------------- */
  const PARKS = [
    { d: 'M418 330Q456 312 484 334Q498 372 474 398Q440 410 424 388Q404 356 418 330Z', fa: 'بوستان ملت', en: 'Mellat Park', x: 452, y: 362 },
    { d: 'M196 438Q250 420 288 448Q304 492 266 512Q218 518 202 490Q186 464 196 438Z', fa: 'پارک پردیسان', en: 'Pardisan Park', x: 245, y: 474 },
    { d: 'M364 626Q410 614 438 636Q444 670 410 682Q376 684 364 664Q356 642 364 626Z', fa: 'پارک لاله', en: 'Laleh Park', x: 402, y: 652 },
    { d: 'M686 114Q732 104 764 120Q770 148 738 160Q700 164 688 146Z', fa: 'پارک جمشیدیه', en: 'Jamshidieh', x: 726, y: 136 }
  ];
  const ROADS = [
    { d: 'M515 100C510 300 490 520 466 800', w: 9, fa: 'ولیعصر', en: 'Valiasr', lx: 472, ly: 620, rot: -84 },
    { d: 'M660 108C625 300 575 520 548 800', w: 12, fa: 'بزرگراه مدرس', en: 'Modarres Hwy', lx: 602, ly: 560, rot: -78 },
    { d: 'M402 108C398 300 384 520 372 800', w: 12, fa: 'بزرگراه چمران', en: 'Chamran Hwy', lx: 380, ly: 560, rot: -87 },
    { d: 'M0 476C300 460 650 452 1000 432', w: 12, fa: 'بزرگراه همت', en: 'Hemmat Hwy', lx: 800, ly: 444, rot: -1 },
    { d: 'M0 296C300 290 650 282 1000 266', w: 11, fa: 'بزرگراه نیایش', en: 'Niayesh Hwy', lx: 860, ly: 272, rot: -1 },
    { d: 'M540 214C700 208 850 204 1000 198', w: 11, fa: 'بزرگراه صدر', en: 'Sadr Hwy', lx: 860, ly: 204, rot: 0 },
    { d: 'M0 690C380 696 660 704 1000 712', w: 9, fa: 'خیابان انقلاب', en: 'Enghelab St', lx: 180, ly: 686, rot: 0 }
  ];
  const mapCache = {};
  function inPark(x, y) { return PARKS.some(p => { const m = p.d.match(/-?\d+/g).map(Number); const xs = m.filter((_, i) => i % 2 === 0), ys = m.filter((_, i) => i % 2 === 1); return x > Math.min(...xs) - 10 && x < Math.max(...xs) + 10 && y > Math.min(...ys) - 10 && y < Math.max(...ys) + 10; }); }
  function baseMap(lang, hoods) {
    if (mapCache[lang]) return mapCache[lang];
    let blocks = '';
    for (let y = 118; y < 790; y += 56) for (let x = 14; x < 990; x += 62) {
      if (inPark(x + 25, y + 22)) continue;
      blocks += `<rect x="${x}" y="${y}" width="50" height="44" rx="6"/>`;
    }
    const labelFont = lang === 'fa' ? "Vazirmatn, Tahoma, sans-serif" : "'Plus Jakarta Sans', system-ui, sans-serif";
    const svg = `<svg class="map-base" viewBox="0 0 1000 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="font-family:${labelFont}">
      <rect width="1000" height="800" class="m-land"/>
      <g class="m-block">${blocks}</g>
      <path class="m-mountain" d="M0 0H1000V74L944 98L884 62L822 104L762 72L702 108L640 76L580 112L520 82L460 114L400 80L340 110L280 74L220 102L160 68L100 98L40 72L0 92Z"/>
      <path class="m-mountain-2" d="M0 0H1000V40L930 62L860 34L790 66L720 38L650 70L580 42L510 74L440 44L370 72L300 40L230 66L160 36L90 62L20 40L0 50Z"/>
      <text class="m-mlabel" x="500" y="40" text-anchor="middle">${lang === 'fa' ? 'رشته‌کوه البرز' : 'ALBORZ MOUNTAINS'}</text>
      ${PARKS.map(p => `<path class="m-park" d="${p.d}"/><text class="m-plabel" x="${p.x}" y="${p.y}" text-anchor="middle">${p[lang]}</text>`).join('')}
      ${ROADS.map(r => `<path class="m-casing" d="${r.d}" stroke-width="${r.w + 4}"/>`).join('')}
      ${ROADS.map(r => `<path class="m-road ${r.w >= 11 ? 'hwy' : ''}" d="${r.d}" stroke-width="${r.w}"/>`).join('')}
      ${ROADS.map(r => `<text class="m-rlabel" x="${r.lx}" y="${r.ly}" transform="rotate(${r.rot} ${r.lx} ${r.ly})" text-anchor="middle">${r[lang]}</text>`).join('')}
      ${Object.values(hoods).map(h => `<text class="m-hood" x="${h.x}" y="${h.y - 26}" text-anchor="middle">${lang === 'fa' ? h.fa : h.en.toUpperCase()}</text>`).join('')}
    </svg>`;
    mapCache[lang] = svg;
    return svg;
  }

  window.FD_ART = { sprite, scene, baseMap, icons: Object.keys(ICONS) };
})();
