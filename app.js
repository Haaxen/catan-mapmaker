const svg = document.querySelector('#board');
const NS = 'http://www.w3.org/2000/svg';
const tiles = [];
const resources = [
  { name: 'Forest', color: '#78936f', image: 'assets/forest.webp', icon: '♣', detail: 'TIMBER' },
  { name: 'Pasture', color: '#a6b77d', image: 'assets/pasture.jpg', icon: '♧', detail: 'WOOL' },
  { name: 'Fields', color: '#d4bc67', image: 'assets/fields.webp', icon: '✺', detail: 'GRAIN' },
  { name: 'Hills', color: '#bd795b', image: 'assets/hills.jpg', icon: '▲', detail: 'BRICK' },
  { name: 'Mountains', color: '#778a8d', image: 'assets/mountains.webp', icon: '◆', detail: 'ORE' },
  { name: 'Desert', color: '#d4b889', image: 'assets/desert.jpg', icon: '', detail: 'DESERT' },
];
const portTypes = ['3:1', '♣', '3:1', '♧', '3:1', '✺'];
const numbers = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];
const layout = [];
for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (Math.abs(q + r) <= 2) layout.push({ q, r });
const desertIndex = layout.findIndex(({ q, r }) => q === 0 && r === 0);
let mapCount = 0;
let shuffleInProgress = false;

function el(tag, attrs = {}, parent = svg) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, val]) => node.setAttribute(key, val));
  parent.appendChild(node);
  return node;
}
function text(parent, value, attrs = {}) {
  const node = el('text', attrs, parent);
  node.textContent = value;
  return node;
}
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function hexPoints(x, y, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    return `${(x + size * Math.cos(angle)).toFixed(2)},${(y + size * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}
function makeTile(resource, number, x, y, size) {
  const g = el('g', { class: 'tile', 'data-resource': resource.name });
  el('image', { href: resource.image, x: x - size, y: y - size * Math.sqrt(3) / 2, width: size * 2, height: size * Math.sqrt(3), preserveAspectRatio: 'xMidYMid slice', 'clip-path': 'url(#hex-clip)' }, g);
  el('polygon', { points: hexPoints(x, y, size - 1), fill: 'none', stroke: '#fff4', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
  const cx = x, cy = y;
  if (resource.name === 'Desert') {
    el('circle', { cx, cy: y + 13, r: 12, fill: '#8e473c', stroke: '#ead8b0', 'stroke-width': 1.5, opacity: .94 }, g);
    text(g, '♟', { x: cx, y: y + 18, 'text-anchor': 'middle', fill: '#f5e7c8', 'font-size': 16 });
  } else {
    text(g, resource.icon, { x: cx, y: cy - 24, 'text-anchor': 'middle', fill: '#18373b', 'font-size': 21, opacity: .86 });
    text(g, resource.detail, { x: cx, y: y - 8, 'text-anchor': 'middle', fill: '#213a37', 'font-size': 7, 'font-family': 'DM Sans, sans-serif', 'font-weight': 700, 'letter-spacing': 1.25, opacity: .82 });
    el('circle', { cx, cy: y + 10, r: 13, fill: '#f3e8c7', stroke: '#876f4d', 'stroke-width': 1.4 }, g);
    text(g, number, { x: cx, y: y + 14, 'text-anchor': 'middle', fill: number === 6 || number === 8 ? '#a84836' : '#34453e', 'font-size': 13, 'font-family': 'Space Grotesk, sans-serif', 'font-weight': 700 });
    if (number === 6 || number === 8) {
      for (let i = 0; i < 5; i++) el('circle', { cx: cx - 8 + i * 4, cy: y + 27, r: 1.2, fill: '#a84836' }, g);
    }
  }
  return { x, y, resource };
}
function randomResources() {
  const pool = shuffle([
    ...Array(4).fill(resources[0]), ...Array(4).fill(resources[1]), ...Array(4).fill(resources[2]),
    ...Array(3).fill(resources[3]), ...Array(3).fill(resources[4]),
  ]);
  pool.splice(desertIndex, 0, resources[5]);
  return pool;
}
function renderMap(resourcesSet, nums, portValues, isFinal = false) {
  svg.replaceChildren();
  const defs = el('defs');
  const clip = el('clipPath', { id: 'hex-clip', clipPathUnits: 'objectBoundingBox' }, defs);
  el('polygon', { points: '0.25,0 0.75,0 1,0.5 0.75,1 0.25,1 0,0.5' }, clip);
  const pattern = el('pattern', { id: 'sea-lines', width: 22, height: 22, patternUnits: 'userSpaceOnUse' }, defs);
  el('path', { d: 'M0 11 Q5 7 11 11 T22 11', fill: 'none', stroke: '#b4c9b833', 'stroke-width': .8 }, pattern);
  // Broad, quiet ocean medallion and a hand-drawn island shoreline.
  el('ellipse', { cx: 410, cy: 351, rx: 320, ry: 280, fill: 'url(#sea-lines)', opacity: .65 });
  const size = 55;
  const centerX = 410, centerY = 350;
  const positioned = layout.map(({ q, r }, i) => {
    const x = centerX + size * 1.5 * q;
    const y = centerY + size * Math.sqrt(3) * (r + q / 2);
    const tile = makeTile(resourcesSet[i], resourcesSet[i].name === 'Desert' ? null : nums.pop(), x, y, size);
    return { ...tile, q, r };
  });
  tiles.splice(0, tiles.length, ...positioned);
  // Keep the six harbor labels clear of the island edge.
  const portSpots = [
    { q: -2, r: 0, dx: -1, dy: -1 }, { q: -1, r: -1, dx: 0, dy: -1 },
    { q: 1, r: -2, dx: 1, dy: -1 }, { q: 2, r: 0, dx: 1, dy: 1 },
    { q: 1, r: 1, dx: 0, dy: 1 }, { q: -1, r: 2, dx: -1, dy: 1 },
  ];
  portValues.forEach((port, i) => {
    const p = portSpots[i];
    const x = centerX + size * 1.5 * p.q + p.dx * 76;
    const y = centerY + size * Math.sqrt(3) * (p.r + p.q / 2) + p.dy * 48;
    const group = el('g', { class: 'port' });
    text(group, port, { x, y: y + 4, 'text-anchor': 'middle', fill: '#f0e3bf', stroke: '#15383d', 'stroke-width': 3, 'paint-order': 'stroke fill', 'font-size': port.length > 2 ? 11 : 16, 'font-family': 'Space Grotesk, sans-serif', 'font-weight': 700 });
  });
  if (isFinal) {
    mapCount++;
    const seed = Math.random().toString(36).slice(2, 7).toUpperCase();
    document.querySelector('#seed-label').textContent = seed;
    svg.setAttribute('aria-label', `Randomized CATAN board map ${mapCount}, with a central desert, eighteen resource hexes, number tokens, and six harbors`);
  }
}
function requestMap() {
  if (shuffleInProgress) return;
  shuffleInProgress = true;
  const button = document.querySelector('#generate');
  button.disabled = true;
  button.querySelector('span:nth-child(2)').textContent = 'Shuffling…';
  const finalResources = randomResources();
  const finalNumbers = shuffle(numbers);
  const finalPorts = shuffle(portTypes);
  const slowDown = [45, 52, 62, 76, 95, 120, 150, 190];
  let turn = 0;
  function shuffleTurn() {
    if (turn === slowDown.length) {
      renderMap(finalResources, finalNumbers, finalPorts, true);
      button.disabled = false;
      button.querySelector('span:nth-child(2)').textContent = 'Generate new map';
      shuffleInProgress = false;
      return;
    }
    // Cycle the resource and number on each fixed hex; increase the pause each turn.
    renderMap(randomResources(), shuffle(numbers), shuffle(portTypes));
    window.setTimeout(shuffleTurn, slowDown[turn++]);
  }
  shuffleTurn();
}
document.querySelector('#generate').addEventListener('click', requestMap);
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) {
    event.preventDefault(); requestMap();
  }
});
renderMap(randomResources(), shuffle(numbers), shuffle(portTypes), true);
