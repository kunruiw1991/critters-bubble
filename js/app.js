// ============================================================================
// 🫧🐾🌈 Critter Bubble Pop Rescue! (100% Zero-Text Calibrated Puzzle Bobble)
// Hexagonal Honeycomb Grid • Wall-Bounce Laser Aim • Avalanche Drops into Pots
// Smart Exposed-Color Ammo Queue • Embedded Bomb/Lightning Orbs • 3 Star Rescues
// ============================================================================

const W = 820;
const H = 540;

// Playfield Walls (Centered Honeycomb Arena with Glowing Bounce Bumpers)
const PLAY_LEFT = 126;
const PLAY_RIGHT = 694;
const PLAY_TOP = 22;
const CANNON_X = 410;
const CANNON_Y = 476;

// Hex Grid Geometry
const R = 22; // Bubble radius (diameter 44px)
const DIAM = R * 2;
const ROW_H = 38;
const MAX_ROWS = 10;
const EVEN_COLS = 12; // 12 * 44 = 528px inside 568px arena

const CRITTERS = [
  {
    id: 'dogday',
    img: 'icons/dogday.jpg',
    power: '☀️',
    color: '#ff922b',
    rim: '#c2410c',
    glow: 'rgba(255, 146, 43, 0.45)',
    skyTop: '#fef3c7',
    skyBot: '#fde68a',
    wallColor: '#f59e0b'
  },
  {
    id: 'hoppy',
    img: 'icons/hoppy.jpg',
    power: '⚡',
    color: '#22c55e',
    rim: '#15803d',
    glow: 'rgba(34, 197, 94, 0.45)',
    skyTop: '#dcfce7',
    skyBot: '#bbf7d0',
    wallColor: '#10b981'
  },
  {
    id: 'bobby',
    img: 'icons/bobby.jpg',
    power: '💖',
    color: '#f43f5e',
    rim: '#be123c',
    glow: 'rgba(244, 63, 94, 0.45)',
    skyTop: '#ffe4e6',
    skyBot: '#fbcfe8',
    wallColor: '#ec4899'
  },
  {
    id: 'bubba',
    img: 'icons/bubba.jpg',
    power: '🌊',
    color: '#38bdf8',
    rim: '#0369a1',
    glow: 'rgba(56, 189, 248, 0.45)',
    skyTop: '#e0f2fe',
    skyBot: '#bae6fd',
    wallColor: '#0284c7'
  },
  {
    id: 'craftycorn',
    img: 'icons/craftycorn.jpg',
    power: '🌈',
    color: '#a855f7',
    rim: '#6b21a8',
    glow: 'rgba(168, 85, 247, 0.45)',
    skyTop: '#f3e8ff',
    skyBot: '#e9d5ff',
    wallColor: '#8b5cf6'
  },
  {
    id: 'picky',
    img: 'icons/picky.jpg',
    power: '🍉',
    color: '#fb7185',
    rim: '#9f1239',
    glow: 'rgba(251, 113, 133, 0.45)',
    skyTop: '#ffedd5',
    skyBot: '#fed7aa',
    wallColor: '#f97316'
  },
  {
    id: 'kickin',
    img: 'icons/kickin.jpg',
    power: '🌟',
    color: '#eab308',
    rim: '#a16207',
    glow: 'rgba(234, 179, 8, 0.45)',
    skyTop: '#fef9c3',
    skyBot: '#fde047',
    wallColor: '#ca8a04'
  },
  {
    id: 'catnap',
    img: 'icons/catnap.jpg',
    power: '🌙',
    color: '#6366f1',
    rim: '#3730a3',
    glow: 'rgba(99, 102, 241, 0.45)',
    skyTop: '#ede9fe',
    skyBot: '#ddd6fe',
    wallColor: '#6d28d9'
  }
];

// The 5 Bubble Colors used inside the honeycomb (0..4)
const BUBBLE_PALETTE = [
  CRITTERS[0], // 0: Orange Sun (DogDay)
  CRITTERS[1], // 1: Green Bolt (Hoppy)
  CRITTERS[2], // 2: Pink Heart (Bobby)
  CRITTERS[3], // 3: Blue Wave (Bubba)
  CRITTERS[4]  // 4: Purple Rainbow (CraftyCorn)
];

// ============================================================================
// WebAudio Cute Sound Synthesizer
// ============================================================================
class SoundBox {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.13, gainVal = 0.14, slideFreq = null) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
      }
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  playShoot() {
    this.playTone(300, 'sine', 0.16, 0.15, 680);
  }

  playBounce() {
    this.playTone(420, 'triangle', 0.08, 0.12, 540);
  }

  playPop(ComboIdx = 0) {
    const base = 480 + Math.min(8, ComboIdx) * 55;
    this.playTone(base, 'sine', 0.14, 0.16, base * 1.45);
  }

  playBoom() {
    this.playTone(150, 'sawtooth', 0.26, 0.2, 48);
  }

  playStar() {
    this.playTone(587, 'sine', 0.12, 0.15, 880);
    setTimeout(() => this.playTone(880, 'sine', 0.18, 0.15, 1174), 70);
  }

  playWin() {
    [523, 659, 784, 1046].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'triangle', 0.22, 0.16), i * 110);
    });
  }
}

const sfx = new SoundBox();

// ============================================================================
// Game State & Image Preloader
// ============================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const critterImages = {};
CRITTERS.forEach((c) => {
  const img = new Image();
  img.src = c.img;
  critterImages[c.id] = img;
});

let currentLevel = 0;
let completedLevels = new Set();
let starsEarned = 0;
let hasShotThisLevel = false;
let levelWon = false;
let animTick = 0;

// Hex Grid: `grid[row][col]` holds `{ row, col, x, y, colorIdx, special: '' | 'star' | 'bomb' | 'zap' }` or `null`
let grid = [];
let activeBubble = null;   // `{ colorIdx, special: '' | 'rainbow' | 'bomb' }`
let nextBubble = null;     // `{ colorIdx, special: '' }`
let flyingBubble = null;   // `{ x, y, vx, vy, colorIdx, special, trail: [] }`
let fallingBubbles = [];   // Avalanche bubbles dropping into bottom pots!
let particles = [];
let shockwaves = [];

// Cannon Aim Angle (radians, `-Math.PI / 2` is straight up)
let aimAngle = -Math.PI / 2;
let isAiming = false;
let fullGuideOn = true;

// ============================================================================
// Hex Grid Coordinate Helpers
// ============================================================================
function getColsForRow(row) {
  return row % 2 === 0 ? EVEN_COLS : EVEN_COLS - 1;
}

function gridToXY(row, col) {
  const rowOffset = (row % 2 === 1) ? R : 0;
  const x = PLAY_LEFT + 22 + R + rowOffset + col * DIAM;
  const y = PLAY_TOP + R + 12 + row * ROW_H;
  return { x, y };
}

function getNeighbors(row, col) {
  const odd = row % 2 === 1;
  const deltas = odd
    ? [
        [0, -1], [0, 1],
        [-1, 0], [-1, 1],
        [1, 0], [1, 1]
      ]
    : [
        [0, -1], [0, 1],
        [-1, -1], [-1, 0],
        [1, -1], [1, 0]
      ];
  const res = [];
  for (const [dr, dc] of deltas) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < MAX_ROWS && nc >= 0 && nc < getColsForRow(nr)) {
      res.push([nr, nc]);
    }
  }
  return res;
}

// ============================================================================
// Calibrated 8-Stage Honeycomb Generator
// ============================================================================
function buildLevelGrid(levelIdx) {
  grid = Array.from({ length: MAX_ROWS }, (_, r) =>
    Array.from({ length: getColsForRow(r) }, () => null)
  );

  // Calibrated difficulty:
  // - Stages 0..2: 5 rows deep, 3 colors (0..2) -> generous color clusters, easy chain avalanches!
  // - Stages 3..5: 6 rows deep, 4 colors (0..3) -> medium tactical clusters + wall bounces
  // - Stages 6..7: 6 rows deep, 5 colors (0..4) -> full 5-color puzzle with bombs & lightning
  const numColors = levelIdx < 3 ? 3 : levelIdx < 6 ? 4 : 5;
  const numRows = levelIdx < 3 ? 5 : 6;

  for (let r = 0; r < numRows; r++) {
    const cols = getColsForRow(r);
    for (let c = 0; c < cols; c++) {
      // Leave small scenic arches/gaps on some stages so bank shots can slip into the top!
      if (levelIdx % 2 === 1 && r >= 3 && (c === 0 || c === cols - 1)) continue;

      // Create natural clusters of 2-3 adjacent matching colors so shots feel rewarding
      const colorIdx = (Math.floor(c / 2) + r + levelIdx) % numColors;
      const { x, y } = gridToXY(r, c);
      grid[r][c] = {
        row: r,
        col: c,
        x,
        y,
        colorIdx,
        special: ''
      };
    }
  }

  // Place 3 Star Rescue Bubbles (`🎈⭐`) in rows 1..2 (left, center, right)
  const starCoords = [
    [1, 2],
    [0, Math.floor(EVEN_COLS / 2)],
    [1, getColsForRow(1) - 3]
  ];
  starCoords.forEach(([sr, sc]) => {
    const { x, y } = gridToXY(sr, sc);
    grid[sr][sc] = {
      row: sr,
      col: sc,
      x,
      y,
      colorIdx: 0,
      special: 'star'
    };
  });

  // Place 2 Helper Bomb Bubbles (`💣`) & 1 Row-Zap Bubble (`⚡`) in middle rows
  const bombCoords = [
    [3, 3],
    [3, getColsForRow(3) - 4]
  ];
  bombCoords.forEach(([br, bc]) => {
    if (grid[br] && grid[br][bc]) {
      grid[br][bc].special = 'bomb';
    }
  });

  if (grid[2] && grid[2][Math.floor(EVEN_COLS / 2)]) {
    grid[2][Math.floor(EVEN_COLS / 2)].special = 'zap';
  }
}

// ============================================================================
// Smart Exposed-Color Ammo Picker (Never Gives Dead/Unreachable Colors!)
// ============================================================================
function pickSmartColor() {
  const exposedColors = [];
  const allColors = new Set();

  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (!cell || cell.special === 'star') continue;
      allColors.add(cell.colorIdx);
      // Check if cell is exposed on the bottom or has an empty neighbor below
      const hasOpenBelow = r === MAX_ROWS - 1 || !grid[r + 1]?.[Math.min(c, getColsForRow(r + 1) - 1)];
      if (hasOpenBelow) {
        exposedColors.push(cell.colorIdx);
      }
    }
  }

  if (exposedColors.length > 0 && Math.random() < 0.85) {
    return exposedColors[Math.floor(Math.random() * exposedColors.length)];
  }
  const arr = Array.from(allColors);
  if (arr.length > 0) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return 0;
}

// ============================================================================
// DOM Elements & UI Builders
// ============================================================================
const levelNavBar = document.getElementById('levelNavBar');
const sideCritterImg = document.getElementById('sideCritterImg');
const critterPowerBadge = document.getElementById('critterPowerBadge');
const targetSlotsRow = document.getElementById('targetSlotsRow');
const floatingToast = document.getElementById('floatingToast');

const btnSwapBubble = document.getElementById('btnSwapBubble');
const btnRainbowBubble = document.getElementById('btnRainbowBubble');
const btnBombBubble = document.getElementById('btnBombBubble');
const btnGuideToggle = document.getElementById('btnGuideToggle');
const btnResetLevel = document.getElementById('btnResetLevel');
const btnSoundToggle = document.getElementById('btnSoundToggle');

const winModal = document.getElementById('winModal');
const winCritterImg = document.getElementById('winCritterImg');
const winPowerBadge = document.getElementById('winPowerBadge');
const btnWinReplay = document.getElementById('btnWinReplay');
const btnWinNext = document.getElementById('btnWinNext');

const finaleModal = document.getElementById('finaleModal');
const finaleCrittersGrid = document.getElementById('finaleCrittersGrid');
const btnFinaleClose = document.getElementById('btnFinaleClose');

function renderTopBar() {
  levelNavBar.innerHTML = '';
  CRITTERS.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'level-pill' +
      (idx === currentLevel ? ' active' : '') +
      (completedLevels.has(idx) ? ' completed' : '');
    btn.setAttribute('aria-label', c.id);

    const img = document.createElement('img');
    img.src = c.img;
    img.alt = '';
    btn.appendChild(img);

    const badge = document.createElement('span');
    badge.className = 'pill-stars';
    badge.textContent = completedLevels.has(idx) ? '⭐⭐⭐' : c.power;
    btn.appendChild(badge);

    btn.addEventListener('click', () => {
      sfx.playPop();
      loadLevel(idx);
    });
    levelNavBar.appendChild(btn);
  });
}

function updateDockButtonsUI() {
  btnRainbowBubble.classList.toggle('active', activeBubble?.special === 'rainbow');
  btnBombBubble.classList.toggle('active', activeBubble?.special === 'bomb');
  btnGuideToggle.classList.toggle('active', fullGuideOn);
}

function updateVisualHUD() {
  const critter = CRITTERS[currentLevel];
  sideCritterImg.src = critter.img;
  critterPowerBadge.textContent = critter.power;

  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`starSlot${i}`);
    if (slot) {
      slot.classList.toggle('collected', i < starsEarned);
    }
  }

  targetSlotsRow.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const pill = document.createElement('div');
    const rescued = i < starsEarned;
    pill.className = 'hud-target-pill' + (rescued ? ' popped' : '');
    pill.textContent = rescued ? '⭐' : '🎈';
    targetSlotsRow.appendChild(pill);
  }

  updateDockButtonsUI();
}

let toastTimer = null;
function showEmojiToast(emojis) {
  floatingToast.textContent = emojis;
  floatingToast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    floatingToast.classList.add('hidden');
  }, 1100);
}

// ============================================================================
// Level Initialization
// ============================================================================
function loadLevel(idx) {
  currentLevel = (idx + CRITTERS.length) % CRITTERS.length;
  winModal.classList.add('hidden');
  finaleModal.classList.add('hidden');

  starsEarned = 0;
  hasShotThisLevel = false;
  levelWon = false;
  flyingBubble = null;
  fallingBubbles = [];
  particles = [];
  shockwaves = [];
  aimAngle = -Math.PI / 2;

  buildLevelGrid(currentLevel);

  activeBubble = { colorIdx: pickSmartColor(), special: '' };
  nextBubble = { colorIdx: pickSmartColor(), special: '' };

  renderTopBar();
  updateVisualHUD();
}

// ============================================================================
// Raycast Laser Aim Path (Computes Bounce Points & Target Hex Snap Preview)
// ============================================================================
function traceAimPath(angle) {
  const points = [{ x: CANNON_X, y: CANNON_Y }];
  let x = CANNON_X;
  let y = CANNON_Y;
  const step = 9;
  let vx = Math.cos(angle) * step;
  let vy = Math.sin(angle) * step;
  let bounces = 0;
  const maxSteps = fullGuideOn ? 95 : 42;

  for (let i = 0; i < maxSteps; i++) {
    x += vx;
    y += vy;

    // Bounce off left/right arena walls
    if (x - R < PLAY_LEFT) {
      x = PLAY_LEFT + R;
      vx = -vx;
      bounces++;
    } else if (x + R > PLAY_RIGHT) {
      x = PLAY_RIGHT - R;
      vx = -vx;
      bounces++;
    }

    points.push({ x, y });

    // Stop at top ceiling or any existing bubble in the grid
    if (y - R <= PLAY_TOP + 10) break;
    if (checkGridCollision(x, y)) break;
    if (!fullGuideOn && bounces >= 1 && points.length > 26) break;
  }

  return points;
}

function checkGridCollision(x, y) {
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (Math.hypot(x - cell.x, y - cell.y) < DIAM - 5) {
        return cell;
      }
    }
  }
  return null;
}

// ============================================================================
// Firing, Snapping to Hex Grid, Cluster Flood-Fill & Avalanche Drop!
// ============================================================================
function fireCannon() {
  if (levelWon || flyingBubble || !activeBubble) return;
  hasShotThisLevel = true;
  sfx.playShoot();

  const speed = 15.5;
  flyingBubble = {
    x: CANNON_X,
    y: CANNON_Y,
    vx: Math.cos(aimAngle) * speed,
    vy: Math.sin(aimAngle) * speed,
    colorIdx: activeBubble.colorIdx,
    special: activeBubble.special,
    trail: []
  };

  activeBubble = nextBubble;
  nextBubble = { colorIdx: pickSmartColor(), special: '' };
  updateDockButtonsUI();
}

function snapBubbleAndResolve(fb, hitCell) {
  // 1. If the flying bubble directly touched a Star Bubble, Bomb Bubble, or Zap Bubble, trigger it immediately!
  if (hitCell && hitCell.special === 'star') {
    rescueStarCell(hitCell.row, hitCell.col);
    checkAvalancheAndStars();
    return;
  }
  if (hitCell && hitCell.special === 'bomb') {
    detonateGridBomb(hitCell.row, hitCell.col);
    checkAvalancheAndStars();
    return;
  }
  if (hitCell && hitCell.special === 'zap') {
    zapGridRow(hitCell.row);
    checkAvalancheAndStars();
    return;
  }

  // 2. Find nearest empty hex cell `(bestR, bestC)` to `(fb.x, fb.y)`
  let bestR = 0;
  let bestC = 0;
  let bestDist = Infinity;

  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      if (grid[r][c]) continue;
      const { x, y } = gridToXY(r, c);
      const d = Math.hypot(fb.x - x, fb.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestR = r;
        bestC = c;
      }
    }
  }

  const pos = gridToXY(bestR, bestC);
  grid[bestR][bestC] = {
    row: bestR,
    col: bestC,
    x: pos.x,
    y: pos.y,
    colorIdx: fb.colorIdx,
    special: ''
  };

  // 3. If shot was a Mega Bomb (`💣`), detonate 2-ring radius around `(bestR, bestC)`!
  if (fb.special === 'bomb') {
    detonateGridBomb(bestR, bestC);
    checkAvalancheAndStars();
    return;
  }

  // 4. Check if adjacent to any special cell (`star`, `bomb`, `zap`)
  const neighbors = getNeighbors(bestR, bestC);
  for (const [nr, nc] of neighbors) {
    const nb = grid[nr][nc];
    if (!nb) continue;
    if (nb.special === 'bomb') {
      detonateGridBomb(nr, nc);
    } else if (nb.special === 'zap') {
      zapGridRow(nr);
    } else if (nb.special === 'star' && fb.special === 'rainbow') {
      rescueStarCell(nr, nc);
    }
  }

  // 5. Flood-fill matching color cluster (or match ALL adjacent colors if `fb.special === 'rainbow'`)
  const targetColors = new Set();
  if (fb.special === 'rainbow') {
    neighbors.forEach(([nr, nc]) => {
      const nb = grid[nr][nc];
      if (nb && nb.special !== 'star') targetColors.add(nb.colorIdx);
    });
  } else {
    targetColors.add(fb.colorIdx);
  }

  let poppedAny = false;
  targetColors.forEach((matchColor) => {
    const cluster = findColorCluster(bestR, bestC, matchColor, fb.special === 'rainbow');
    if (cluster.length >= 3 || (fb.special === 'rainbow' && cluster.length >= 2)) {
      poppedAny = true;
      cluster.forEach(([cr, cc], idx) => {
        popGridCell(cr, cc, idx);
      });
    }
  });

  if (!poppedAny) {
    sfx.playBounce();
    // Friendly safety: if bubble snapped into the bottom-most row (row >= MAX_ROWS - 2), burst that row so the player never loses!
    if (bestR >= MAX_ROWS - 2) {
      zapGridRow(bestR);
    }
  }

  // 6. Drop any hanging islands disconnected from ceiling row 0!
  checkAvalancheAndStars();

  // Refresh active bubble color if its color was completely cleared from the board
  const remainingColors = new Set();
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      if (grid[r][c] && grid[r][c].special !== 'star') {
        remainingColors.add(grid[r][c].colorIdx);
      }
    }
  }
  if (activeBubble && !activeBubble.special && remainingColors.size > 0 && !remainingColors.has(activeBubble.colorIdx)) {
    activeBubble.colorIdx = pickSmartColor();
  }
}

function findColorCluster(startR, startC, colorIdx, isRainbowOrigin) {
  const visited = new Set();
  const queue = [[startR, startC]];
  const cluster = [];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[r]?.[c];
    if (!cell || cell.special === 'star') continue;
    const isOrigin = r === startR && c === startC && isRainbowOrigin;
    if (!isOrigin && cell.colorIdx !== colorIdx) continue;

    cluster.push([r, c]);
    for (const [nr, nc] of getNeighbors(r, c)) {
      if (!visited.has(`${nr},${nc}`)) {
        queue.push([nr, nc]);
      }
    }
  }
  return cluster;
}

function popGridCell(r, c, comboIdx = 0) {
  const cell = grid[r]?.[c];
  if (!cell) return;
  grid[r][c] = null;

  if (cell.special === 'star') {
    rescueStarEffects(cell.x, cell.y);
    return;
  }

  sfx.playPop(comboIdx);
  const pal = BUBBLE_PALETTE[cell.colorIdx % BUBBLE_PALETTE.length];
  spawnBurst(cell.x, cell.y, pal.power, 6);
  shockwaves.push({
    x: cell.x,
    y: cell.y,
    r: 10,
    maxR: 48,
    color: pal.color,
    alpha: 0.9
  });
}

function detonateGridBomb(centerR, centerC) {
  const centerPos = gridToXY(centerR, centerC);
  sfx.playBoom();
  showEmojiToast('💣💥🌈');

  shockwaves.push({
    x: centerPos.x,
    y: centerPos.y,
    r: 16,
    maxR: 120,
    color: '#f97316',
    alpha: 1.0
  });
  spawnBurst(centerPos.x, centerPos.y, '💥', 12);

  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (Math.hypot(cell.x - centerPos.x, cell.y - centerPos.y) <= 98) {
        if (cell.special === 'star') {
          rescueStarCell(r, c);
        } else {
          popGridCell(r, c, 2);
        }
      }
    }
  }
}

function zapGridRow(row) {
  sfx.playStar();
  showEmojiToast('⚡🌈⚡');
  const y = gridToXY(row, 0).y;
  shockwaves.push({
    x: CANNON_X,
    y,
    r: 20,
    maxR: 260,
    color: '#facc15',
    alpha: 1.0
  });

  for (let c = 0; c < getColsForRow(row); c++) {
    const cell = grid[row][c];
    if (!cell) continue;
    if (cell.special === 'star') {
      rescueStarCell(row, c);
    } else {
      popGridCell(row, c, c);
    }
  }
}

function rescueStarCell(r, c) {
  const cell = grid[r]?.[c];
  if (!cell) return;
  grid[r][c] = null;
  rescueStarEffects(cell.x, cell.y);
}

function rescueStarEffects(x, y) {
  starsEarned = Math.min(3, starsEarned + 1);
  sfx.playStar();
  showEmojiToast('🎈⭐🥳');
  spawnBurst(x, y, '⭐', 12);
  spawnBurst(x, y, '🎉', 6);
  shockwaves.push({
    x,
    y,
    r: 14,
    maxR: 95,
    color: '#facc15',
    alpha: 1.0
  });
  updateVisualHUD();
}

// ============================================================================
// Ceiling Connectivity BFS & Avalanche Drop
// ============================================================================
function checkAvalancheAndStars() {
  // Also rescue any Star Bubble whose surrounding neighbors are all cleared or only 1 neighbor left!
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (cell && cell.special === 'star') {
        const activeNbs = getNeighbors(r, c).filter(([nr, nc]) => grid[nr][nc] !== null);
        if (activeNbs.length <= 1) {
          rescueStarCell(r, c);
        }
      }
    }
  }

  // BFS from top row (`row === 0`) to find all anchored bubbles
  const anchored = new Set();
  const queue = [];
  for (let c = 0; c < getColsForRow(0); c++) {
    if (grid[0][c]) {
      anchored.add(`0,${c}`);
      queue.push([0, c]);
    }
  }

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [nr, nc] of getNeighbors(r, c)) {
      const key = `${nr},${nc}`;
      if (grid[nr][nc] && !anchored.has(key)) {
        anchored.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  // Any cell not in `anchored` drops in a joyful avalanche!
  let droppedCount = 0;
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (!anchored.has(`${r},${c}`)) {
        grid[r][c] = null;
        if (cell.special === 'star') {
          rescueStarEffects(cell.x, cell.y);
        } else {
          droppedCount++;
          fallingBubbles.push({
            x: cell.x,
            y: cell.y,
            vx: (Math.random() - 0.5) * 3.2,
            vy: -2.0 - Math.random() * 2.0,
            colorIdx: cell.colorIdx
          });
        }
      }
    }
  }

  if (droppedCount >= 3) {
    showEmojiToast('🫧✨🎉');
  }

  // Check if all 3 stars are rescued OR all bubbles are cleared!
  let remainingStars = 0;
  let remainingBubbles = 0;
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      remainingBubbles++;
      if (cell.special === 'star') remainingStars++;
    }
  }

  if (!levelWon && (remainingStars === 0 || remainingBubbles === 0)) {
    triggerStageWin();
  }
}

function triggerStageWin() {
  if (levelWon) return;
  levelWon = true;
  starsEarned = 3;
  completedLevels.add(currentLevel);
  renderTopBar();
  updateVisualHUD();
  sfx.playWin();
  showEmojiToast('🎉⭐⭐⭐🎉');

  // Drop all remaining bubbles in a celebration cascade!
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (cell) {
        grid[r][c] = null;
        fallingBubbles.push({
          x: cell.x,
          y: cell.y,
          vx: (Math.random() - 0.5) * 4,
          vy: -3 - Math.random() * 3,
          colorIdx: cell.colorIdx
        });
      }
    }
  }

  setTimeout(() => {
    if (completedLevels.size === CRITTERS.length) {
      showFinaleModal();
    } else {
      const critter = CRITTERS[currentLevel];
      winCritterImg.src = critter.img;
      winPowerBadge.textContent = critter.power;
      winModal.classList.remove('hidden');
    }
  }, 950);
}

function showFinaleModal() {
  finaleCrittersGrid.innerHTML = '';
  CRITTERS.forEach((c) => {
    const badge = document.createElement('div');
    badge.className = 'finale-critter-tile';
    const img = document.createElement('img');
    img.src = c.img;
    img.alt = '';
    const sp = document.createElement('span');
    sp.textContent = c.power;
    badge.appendChild(img);
    badge.appendChild(sp);
    finaleCrittersGrid.appendChild(badge);
  });
  finaleModal.classList.remove('hidden');
}

function spawnBurst(x, y, emoji, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 2.0 + Math.random() * 4.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      emoji,
      size: 18 + Math.random() * 8,
      life: 1.0
    });
  }
}

// ============================================================================
// Physics Update Step
// ============================================================================
function updatePhysics() {
  animTick++;

  // Update flying bubble
  if (flyingBubble) {
    const fb = flyingBubble;
    fb.x += fb.vx;
    fb.y += fb.vy;

    if (animTick % 2 === 0 && fb.trail.length < 18) {
      fb.trail.push({ x: fb.x, y: fb.y });
    }

    // Bounce off left & right arena walls
    if (fb.x - R < PLAY_LEFT) {
      fb.x = PLAY_LEFT + R;
      fb.vx = -fb.vx;
      sfx.playBounce();
    } else if (fb.x + R > PLAY_RIGHT) {
      fb.x = PLAY_RIGHT - R;
      fb.vx = -fb.vx;
      sfx.playBounce();
    }

    // Check top ceiling or grid collision
    const hitCell = checkGridCollision(fb.x, fb.y);
    if (hitCell || fb.y - R <= PLAY_TOP + 10) {
      flyingBubble = null;
      snapBubbleAndResolve(fb, hitCell);
    } else if (fb.y > H + 50) {
      flyingBubble = null;
    }
  }

  // Update avalanche falling bubbles dropping into bottom pots
  for (let i = fallingBubbles.length - 1; i >= 0; i--) {
    const b = fallingBubbles[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.42;
    if (b.y > H - 42) {
      const pal = BUBBLE_PALETTE[b.colorIdx % BUBBLE_PALETTE.length];
      sfx.playPop(2);
      spawnBurst(b.x, H - 36, pal.power, 5);
      fallingBubbles.splice(i, 1);
    }
  }

  // Update shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.r += 7;
    sw.alpha -= 0.06;
    if (sw.alpha <= 0 || sw.r >= sw.maxR) {
      shockwaves.splice(i, 1);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.16;
    pt.life -= 0.03;
    if (pt.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// ============================================================================
// Canvas Rendering (100% Zero Text, Full Opaque Emojis)
// ============================================================================
function drawScene() {
  const stageCritter = CRITTERS[currentLevel];

  // 1. Outer Backdrop & Playfield Arena
  ctx.fillStyle = '#0f2942';
  ctx.fillRect(0, 0, W, H);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, stageCritter.skyTop);
  skyGrad.addColorStop(1, stageCritter.skyBot);
  ctx.fillStyle = skyGrad;
  roundRect(ctx, PLAY_LEFT, 10, PLAY_RIGHT - PLAY_LEFT, H - 20, 22);
  ctx.fill();

  // Glowing Bounce Side Walls
  ctx.strokeStyle = stageCritter.wallColor;
  ctx.lineWidth = 6;
  roundRect(ctx, PLAY_LEFT, 10, PLAY_RIGHT - PLAY_LEFT, H - 20, 22);
  ctx.stroke();

  // Decorative Side Pillars with Critter Badges
  [62, W - 62].forEach((px, idx) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, px - 38, 36, 76, H - 72, 20);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(idx === 0 ? '🫧' : stageCritter.power, px, 90);
    ctx.fillText('🌈', px, 260);
    ctx.fillText('⭐', px, 430);
    ctx.restore();
  });

  // 2. Bottom Avalanche Rainbow Treasure Pots (`🍯✨`)
  const potPositions = [180, 275, 545, 640];
  potPositions.forEach((px) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.strokeStyle = stageCritter.wallColor;
    ctx.lineWidth = 3;
    roundRect(ctx, px - 32, H - 52, 64, 36, 14);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍯', px, H - 33);
    ctx.restore();
  });

  // 3. Dotted Laser Bounce Aim Line + Ghost Target Ring
  if (!flyingBubble && !levelWon && activeBubble) {
    const pts = traceAimPath(aimAngle);
    const rainbow = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    const activeColor = activeBubble.special === 'rainbow'
      ? '#a855f7'
      : activeBubble.special === 'bomb'
      ? '#ef4444'
      : BUBBLE_PALETTE[activeBubble.colorIdx % BUBBLE_PALETTE.length].color;

    for (let i = 2; i < pts.length; i += 2) {
      const pt = pts[i];
      ctx.save();
      ctx.fillStyle = activeBubble.special === 'rainbow' ? rainbow[i % rainbow.length] : activeColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (pts.length > 2) {
      const last = pts[pts.length - 1];
      ctx.save();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(last.x, last.y, R - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. Honeycomb Bubbles
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < getColsForRow(r); c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      drawBubble(cell.x, cell.y, R, cell.colorIdx, cell.special);
    }
  }

  // 5. Avalanche Falling Bubbles
  fallingBubbles.forEach((b) => {
    drawBubble(b.x, b.y, R - 2, b.colorIdx, '');
  });

  // 6. Flying Bubble
  if (flyingBubble) {
    const fb = flyingBubble;
    const rainbow = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    fb.trail.forEach((pt, idx) => {
      ctx.save();
      ctx.fillStyle = rainbow[idx % rainbow.length];
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3 + (idx / fb.trail.length) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    drawBubble(fb.x, fb.y, R, fb.colorIdx, fb.special);
  }

  // 7. Rotating Critter Bubble Cannon + Next Bubble Swap Orb
  drawCannon(stageCritter);

  // 8. Shockwaves & Emoji Particles
  shockwaves.forEach((sw) => {
    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(pt.size)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pt.emoji, pt.x, pt.y);
    ctx.restore();
  });

  // 9. Animated Finger Tutorial Guide (Before first shot)
  if (!hasShotThisLevel && !flyingBubble) {
    drawVisualTutorialGuide();
  }
}

function drawBubble(x, y, r, colorIdx, special) {
  ctx.save();
  ctx.translate(x, y);

  if (special === 'star') {
    const pulse = 1 + Math.sin(animTick * 0.1) * 0.07;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', 0, 1);
    ctx.restore();
    return;
  }

  if (special === 'bomb') {
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '23px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 1);
    ctx.restore();
    return;
  }

  if (special === 'zap') {
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '23px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 1);
    ctx.restore();
    return;
  }

  if (special === 'rainbow') {
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.33, '#eab308');
    grad.addColorStop(0.66, '#22c55e');
    grad.addColorStop(1, '#a855f7');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '23px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌈', 0, 1);
    ctx.restore();
    return;
  }

  const pal = BUBBLE_PALETTE[colorIdx % BUBBLE_PALETTE.length];

  // Glossy colored bubble sphere
  ctx.fillStyle = pal.color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Critter portrait inside the bubble
  const img = critterImages[pal.id];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -(r - 4), -(r - 4), (r - 4) * 2, (r - 4) * 2);
    ctx.restore();
  }

  // Glossy bubble highlight shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.32, r * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCannon(stageCritter) {
  ctx.save();
  ctx.translate(CANNON_X, CANNON_Y);

  // Rotating Launcher Barrel
  ctx.save();
  ctx.rotate(aimAngle + Math.PI / 2);
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = stageCritter.wallColor;
  ctx.lineWidth = 4;
  roundRect(ctx, -26, -48, 52, 52, 14);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Cannon Base Ring
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = stageCritter.wallColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 10, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Draw Active Bubble Loaded in Cannon
  if (activeBubble && !flyingBubble) {
    drawBubble(CANNON_X, CANNON_Y, R + 2, activeBubble.colorIdx, activeBubble.special);
  }

  // Draw Next Waiting Bubble on the Left of Cannon (Tap to Swap!)
  if (nextBubble) {
    const nx = CANNON_X - 78;
    const ny = CANNON_Y + 10;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.arc(nx, ny, R + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawBubble(nx, ny, R - 3, nextBubble.colorIdx, nextBubble.special);

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔄', nx + 18, ny + 16);
    ctx.restore();
  }

  // Draw Stage Helper Critter Cheering on the Right of Cannon
  const cx = CANNON_X + 78;
  const cy = CANNON_Y + 8;
  const img = critterImages[stageCritter.id];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = stageCritter.color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 19.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - 20, cy - 20, 40, 40);
    ctx.restore();
  }
}

function drawVisualTutorialGuide() {
  const swing = Math.sin(animTick * 0.05) * 0.35;
  aimAngle = -Math.PI / 2 + swing;
  const hx = CANNON_X + Math.sin(animTick * 0.05) * 95;
  const hy = 310;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = '38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👆', hx, hy);
  ctx.restore();
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

// ============================================================================
// Pointer & Touch Controls (Aim & Shoot + Tap Next Orb to Swap)
// ============================================================================
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H
  };
}

function updateAimFromPoint(pt) {
  const dx = pt.x - CANNON_X;
  const dy = Math.min(-35, pt.y - CANNON_Y);
  const rawAngle = Math.atan2(dy, dx);
  // Clamp angle between -162 deg and -18 deg so shots always go upward into the arena
  aimAngle = Math.max(-Math.PI * 0.89, Math.min(-Math.PI * 0.11, rawAngle));
}

function swapActiveBubble() {
  if (!activeBubble || !nextBubble) return;
  const tmp = activeBubble;
  activeBubble = nextBubble;
  nextBubble = tmp;
  sfx.playBounce();
  updateDockButtonsUI();
  showEmojiToast('🔄🫧');
}

canvas.addEventListener('pointerdown', (e) => {
  if (levelWon) return;
  const pt = getCanvasCoords(e);

  // Tap on the Next Bubble orb beside the cannon swaps bubbles!
  if (Math.hypot(pt.x - (CANNON_X - 78), pt.y - (CANNON_Y + 10)) < 34) {
    swapActiveBubble();
    return;
  }

  isAiming = true;
  hasShotThisLevel = true;
  updateAimFromPoint(pt);
});

window.addEventListener('pointermove', (e) => {
  if (levelWon) return;
  const pt = getCanvasCoords(e);
  if (isAiming || hasShotThisLevel) {
    if (pt.x >= PLAY_LEFT && pt.x <= PLAY_RIGHT && pt.y >= 0 && pt.y <= H) {
      updateAimFromPoint(pt);
    }
  }
});

window.addEventListener('pointerup', () => {
  if (!isAiming) return;
  isAiming = false;
  fireCannon();
});

// ============================================================================
// Left Dock Toy Buttons & Modal Controls
// ============================================================================
btnSwapBubble.addEventListener('click', () => {
  swapActiveBubble();
});

btnRainbowBubble.addEventListener('click', () => {
  if (!activeBubble) return;
  activeBubble.special = activeBubble.special === 'rainbow' ? '' : 'rainbow';
  sfx.playStar();
  updateDockButtonsUI();
  showEmojiToast(activeBubble.special === 'rainbow' ? '🌈🫧' : '🫧');
});

btnBombBubble.addEventListener('click', () => {
  if (!activeBubble) return;
  activeBubble.special = activeBubble.special === 'bomb' ? '' : 'bomb';
  sfx.playStar();
  updateDockButtonsUI();
  showEmojiToast(activeBubble.special === 'bomb' ? '💣💥' : '🫧');
});

btnGuideToggle.addEventListener('click', () => {
  fullGuideOn = !fullGuideOn;
  sfx.playBounce();
  updateDockButtonsUI();
  showEmojiToast(fullGuideOn ? '🎯✨' : '🎯');
});

btnResetLevel.addEventListener('click', () => {
  sfx.playPop();
  loadLevel(currentLevel);
  showEmojiToast('🔁✨');
});

btnSoundToggle.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  btnSoundToggle.textContent = sfx.enabled ? '🔊' : '🔇';
  btnSoundToggle.classList.toggle('muted', !sfx.enabled);
  if (sfx.enabled) sfx.playPop();
});

btnWinReplay.addEventListener('click', () => {
  sfx.playPop();
  loadLevel(currentLevel);
});

btnWinNext.addEventListener('click', () => {
  sfx.playStar();
  loadLevel((currentLevel + 1) % CRITTERS.length);
});

btnFinaleClose.addEventListener('click', () => {
  sfx.playWin();
  completedLevels.clear();
  loadLevel(0);
});

// ============================================================================
// Main Loop
// ============================================================================
function gameLoop() {
  updatePhysics();
  drawScene();
  requestAnimationFrame(gameLoop);
}

loadLevel(0);
requestAnimationFrame(gameLoop);
