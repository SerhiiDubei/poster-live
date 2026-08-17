// Ядро ізометричного лабіринту: генерація кімнат, рух, туман, двері, рендер.
// Спільне для /maze (пульт) і /stage (екран для проекції).
// Логіка та піксель-арт походять з Claude Design; React-обгортку прибрано,
// додано кімнати з біомами та двері, що відмикаються ключем.

const MAZE_ACTIONS = [
  { key: 'ne',    arrow: '↗', name: 'ПІВНІЧ-СХІД',   d: [0, -1] },
  { key: 'se',    arrow: '↘', name: 'ПІВДЕНЬ-СХІД',  d: [1, 0]  },
  { key: 'sw',    arrow: '↙', name: 'ПІВДЕНЬ-ЗАХІД', d: [0, 1]  },
  { key: 'nw',    arrow: '↖', name: 'ПІВНІЧ-ЗАХІД',  d: [-1, 0] },
  { key: 'up',    arrow: '↑', name: 'ВГОРУ',         d: [-1, -1] },
  { key: 'down',  arrow: '↓', name: 'ВНИЗ',          d: [1, 1]  },
  { key: 'left',  arrow: '←', name: 'ВЛІВО',         d: [-1, 1] },
  { key: 'right', arrow: '→', name: 'ВПРАВО',        d: [1, -1] },
  { key: 'wait',  arrow: '⏸', name: 'ПРОПУСК ХОДУ',  d: [0, 0]  },
];
const mazeActionByKey  = k => MAZE_ACTIONS.find(a => a.key === k) || MAZE_ACTIONS[0];
const mazeActionForVec = d => MAZE_ACTIONS.find(a => a.d[0] === d[0] && a.d[1] === d[1]) || null;
const mazeArrowForVec  = d => (mazeActionForVec(d) || { arrow: '·' }).arrow;

// ─── Кольорове коло напрямків ───────────────────────────────────────────────
// Чотири основні напрямки (на них мапляться крани) отримують базові кольори,
// чотири проміжні — рівне змішування сусідів. Колір стрілки на полі збігається
// з кольором групи в легенді, тож гість бачить, що саме брати.
// Вісім напрямків = вісім рівномірних точок на колі відтінків (крок 45°).
// Чотири основні (на них мапляться крани) стоять через одну: жовтий, зелений,
// синій, пурпуровий. Проміжні задані як чисті кольори, а не як усереднення
// сусідів у RGB — таке усереднення дає брудно-сірі відтінки.
// Порядок збігається з Maze.RING: ne, right, se, down, sw, left, nw, up.
const MAZE_DIR_COLORS = {
  ne:    '#ffcf4a',   // 45°  бурштин   ← основний
  right: '#a8e04a',   // 90°  лайм
  se:    '#4ae08a',   // 135° м'ята     ← основний
  down:  '#4ad9e0',   // 180° бірюза
  sw:    '#4a8ae0',   // 225° синій     ← основний
  left:  '#8f4ae0',   // 270° фіолет
  nw:    '#e04ac4',   // 315° пурпур    ← основний
  up:    '#e04a5e',   // 0°   червоний
  wait:  '#93b57c',
};

const MAZE_BASE_KEYS = ['ne', 'se', 'sw', 'nw'];

const mazeColorForKey = k => MAZE_DIR_COLORS[k] || '#ffcf4a';
const mazeColorForVec = d => {
  const a = mazeActionForVec(d);
  return a ? mazeColorForKey(a.key) : '#ffcf4a';
};

// ─── Біоми кімнат ───────────────────────────────────────────────────────────
// Кожна наступна кімната перемальовує тайли в іншій палітрі. Форма й розміри
// спрайтів однакові — змінюються тільки кольори.
const MAZE_BIOMES = [
  {
    key: 'forest', name: 'ЛІС', accent: '#93b57c', bg: '#080f09',
    floor: { base: '#20301f', dark: '#182517', light: '#2a3d28', edge: '#131f13' },
    wall:  { left: '#4a6339', right: '#36492c', dl: '#3b5030', dr: '#2b3a23',
             top: '#6e8f5a', hi: '#93b57c', spark: '#a8c98f', edge: '#48613a' },
    fog:   { base: '#0a120b', dots: '#0e1a10', edge: '#050a06' },
  },
  {
    key: 'ice', name: 'ЗИМА', accent: '#bfe0f2', bg: '#050a10',
    floor: { base: '#243447', dark: '#1b2838', light: '#33495f', edge: '#151f2b' },
    wall:  { left: '#7d9fc4', right: '#5c7b9c', dl: '#6d8db0', dr: '#4c6684',
             top: '#b9d6ea', hi: '#dcecf7', spark: '#ffffff', edge: '#587591' },
    fog:   { base: '#080e15', dots: '#0c141e', edge: '#03070b' },
  },
  {
    key: 'cave', name: 'ПЕЧЕРА', accent: '#c9a06b', bg: '#0c0806',
    floor: { base: '#2f2420', dark: '#241b18', light: '#3d2e28', edge: '#1a1310' },
    wall:  { left: '#6f5340', right: '#523d2f', dl: '#5f4534', dr: '#412f24',
             top: '#946e53', hi: '#c9a06b', spark: '#e0c193', edge: '#4a3628' },
    fog:   { base: '#100a07', dots: '#17100b', edge: '#080503' },
  },
];

class Maze {
  // Вісім напрямків по колу — сусіди в масиві є сусідами й за кутом.
  static RING = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

  static FRUITS = [
    { key: 'apple',  name: 'ЯБЛУКО',   color: '#e14b4b', desc: 'ОГЛЯД +1 НА 15 КРОКІВ' },
    { key: 'banana', name: 'БАНАН',    color: '#ffcf4a', desc: 'МІНУС 10 КРОКІВ' },
    { key: 'cherry', name: 'ВИШНІ',    color: '#e14b6e', desc: 'СЯЙВО: ВІДКРИВАЄ 7×7' },
    { key: 'orange', name: 'АПЕЛЬСИН', color: '#ff9f2e', desc: 'ПОКАЗУЄ, ДЕ ДВЕРІ' },
  ];

  constructor(opts = {}) {
    this.HGT = 10;
    this.PAD_TOP = 14;
    this.W = opts.W || 21;
    this.H = opts.H || 15;
    this.visionRadius = opts.visionRadius || 1;
    // Дозволяємо зрізати кути: інакше діагональні ходи глухнуть щоразу, коли
    // поруч дві стіни, і на екрані замість восьми напрямків лишається чотири.
    this.cornerCut = opts.cornerCut ?? true;
    this.wallDensity = opts.wallDensity ?? 0.16;   // було 0.3 — стало просторіше
    this.FRUITS = Maze.FRUITS;

    this.steps = 0;
    this.won = false;
    this.roomIndex = 0;
    this.biomeIndex = 0;
    this.doorKey = null;     // { id, name } — яке пиво відмикає двері
    this.doorOpen = false;

    this.genMaze();
  }

  dims() { return { W: this.W, H: this.H }; }
  biome() { return MAZE_BIOMES[this.biomeIndex % MAZE_BIOMES.length]; }

  fullSize() {
    const { W, H } = this.dims();
    return { w: (W + H) * 16, h: (W + H - 2) * 8 + 16 + this.HGT + this.PAD_TOP + 4 };
  }

  vision() {
    const base = Math.max(1, Math.min(3, Math.round(this.visionRadius)));
    const boost = this.boostUntil && this.steps < this.boostUntil ? 1 : 0;
    return base + boost;
  }

  // Старт — центр кімнати: усі чотири напрямки живі з першого ходу
  startCell() { return [Math.floor(this.W / 2), Math.floor(this.H / 2)]; }

  genMaze() {
    const { W, H } = this.dims();
    const [sx0, sy0] = this.startCell();
    let g, reach;

    for (let attempt = 0; attempt < 25; attempt++) {
      g = Array.from({ length: H }, () => Array(W).fill(0));
      for (let x = 0; x < W; x++) { g[0][x] = 1; g[H - 1][x] = 1; }
      for (let y = 0; y < H; y++) { g[y][0] = 1; g[y][W - 1] = 1; }

      const target = Math.floor((W - 2) * (H - 2) * this.wallDensity);
      let placed = 0, guard = 0;
      while (placed < target && guard++ < 6000) {
        let x = 1 + Math.floor(Math.random() * (W - 2));
        let y = 1 + Math.floor(Math.random() * (H - 2));
        const len = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < len; i++) {
          const nearStart = Math.abs(x - sx0) <= 1 && Math.abs(y - sy0) <= 1;
          if (x > 0 && y > 0 && x < W - 1 && y < H - 1 && !nearStart && g[y][x] === 0) { g[y][x] = 1; placed++; }
          if (Math.random() < 0.5) x += Math.random() < 0.5 ? 1 : -1; else y += Math.random() < 0.5 ? 1 : -1;
        }
      }
      g[sy0][sx0] = 0;

      reach = this.bfs(g, W, H, sx0, sy0);
      const floorTotal = g.flat().filter(v => v === 0).length;
      if (reach.count / floorTotal > 0.8) break;
    }

    const { dist, far } = reach;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] === 0 && dist[y][x] < 0) g[y][x] = 1;
    }

    this.grid = g;
    this.door = far;              // двері в наступну кімнату — найдальша точка
    this.player = [sx0, sy0];
    this.revealed = new Set();
    this.boostUntil = 0;
    this.doorFound = false;       // чи показувати двері крізь туман (апельсин)

    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] === 0 && dist[y][x] >= 3 && !(x === far[0] && y === far[1])) cells.push(y * W + x);
    }
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const K = Math.max(4, Math.round(W * H / 39));
    this.fruits = new Map();
    for (let i = 0; i < Math.min(K, cells.length); i++) this.fruits.set(cells[i], i % this.FRUITS.length);
    this.fruitTotal = this.fruits.size;

    this.reveal();
  }

  bfs(g, W, H, sx, sy) {
    const dist = Array.from({ length: H }, () => Array(W).fill(-1));
    dist[sy][sx] = 0;
    const q = [[sx, sy]];
    let far = [sx, sy], count = 1;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && g[ny][nx] === 0 && dist[ny][nx] < 0) {
          dist[ny][nx] = dist[y][x] + 1;
          count++;
          if (dist[ny][nx] > dist[far[1]][far[0]]) far = [nx, ny];
          q.push([nx, ny]);
        }
      }
    }
    return { dist, far, count };
  }

  // ─── Двері ────────────────────────────────────────────────────────────────
  setDoorKey(key) { this.doorKey = key || null; this.doorOpen = false; }
  openDoor() { this.doorOpen = true; }

  // Чи є цей товар ключем від поточних дверей
  isDoorKey(productId) {
    return !!this.doorKey && String(this.doorKey.id) === String(productId);
  }

  atDoor() {
    return this.player[0] === this.door[0] && this.player[1] === this.door[1];
  }

  // Наступна кімната: новий біом, нове поле, кроки та фрукти рахуються далі
  nextRoom() {
    this.roomIndex++;
    this.biomeIndex = (this.biomeIndex + 1) % MAZE_BIOMES.length;
    this.doorKey = null;
    this.doorOpen = false;
    this.T = null;              // тайли перебудуються в палітрі нового біому
    this.genMaze();
  }

  reveal(rad) {
    const r = rad ?? this.vision();
    const [px, py] = this.player;
    const { W, H } = this.dims();
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = px + dx, y = py + dy;
      if (x >= 0 && y >= 0 && x < W && y < H) this.revealed.add(y * W + x);
    }
  }

  validMove(dx, dy) {
    const [px, py] = this.player;
    const nx = px + dx, ny = py + dy;
    const { W, H } = this.dims();
    const g = this.grid;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || g[ny][nx] === 1) return false;
    if (dx !== 0 && dy !== 0 && !this.cornerCut) {
      if (g[py][nx] === 1 && g[ny][px] === 1) return false;
    }
    return true;
  }

  // Ковзання вздовж стіни: якщо напрямок закритий, беремо найближчий відкритий
  // за кутом, щоб кожна покупка давала видимий рух.
  resolveDirection(dx, dy) {
    if (dx === 0 && dy === 0) return { d: [0, 0], slid: false };
    if (this.validMove(dx, dy)) return { d: [dx, dy], slid: false };

    const ring = Maze.RING;
    const i = ring.findIndex(v => v[0] === dx && v[1] === dy);
    if (i < 0) return null;
    for (let off = 1; off <= 4; off++) {
      for (const j of [(i + off) % 8, (i - off + 8) % 8]) {
        const [nx, ny] = ring[j];
        if (this.validMove(nx, ny)) return { d: [nx, ny], slid: true };
      }
    }
    return null;
  }

  // result: 'blocked' | 'moved' | 'door-locked' | 'door-open'
  move(dx, dy) {
    if (dx === 0 && dy === 0) { this.steps++; return { result: 'moved' }; }
    if (!this.validMove(dx, dy)) return { result: 'blocked' };

    const nx = this.player[0] + dx, ny = this.player[1] + dy;
    const { W } = this.dims();
    this.player = [nx, ny];

    const idx = ny * W + nx;
    let fruit = null;
    if (this.fruits.has(idx)) {
      fruit = this.FRUITS[this.fruits.get(idx)];
      this.fruits.delete(idx);
      if (fruit.key === 'apple')  this.boostUntil = this.steps + 1 + 15;
      if (fruit.key === 'cherry') this.reveal(3);
      if (fruit.key === 'orange') this.doorFound = true;
    }
    this.reveal();

    this.steps++;
    if (fruit && fruit.key === 'banana') this.steps = Math.max(0, this.steps - 10);

    let result = 'moved';
    if (this.atDoor()) result = this.doorOpen ? 'door-open' : 'door-locked';
    return { result, fruit };
  }

  restart() {
    this.steps = 0;
    this.won = false;
    this.roomIndex = 0;
    this.biomeIndex = 0;
    this.doorKey = null;
    this.doorOpen = false;
    this.T = null;
    this.genMaze();
  }

  fruitsGot() { return this.fruitTotal - this.fruits.size; }

  revealPct() {
    const { W, H } = this.dims();
    return Math.round(100 * this.revealed.size / (W * H));
  }

  iso(x, y) {
    const { H } = this.dims();
    return [(x - y + H - 1) * 16, (x + y) * 8 + this.PAD_TOP];
  }

  playerCenter() {
    const [sx, sy] = this.iso(this.player[0], this.player[1]);
    return [sx + 16, sy + 8];
  }

  // ─── Піксель-арт тайли (кольори беруться з біому) ─────────────────────────
  diamondRows(g, y0, fill) {
    g.fillStyle = fill;
    for (let r = 0; r < 8; r++) g.fillRect(14 - 2 * r, y0 + r, 4 * (r + 1), 1);
    for (let b = 0; b < 8; b++) g.fillRect(2 * b, y0 + 8 + b, 32 - 4 * b, 1);
  }

  buildTiles() {
    const B = this.biome();
    const mk = (h, fn) => { const c = document.createElement('canvas'); c.width = 32; c.height = h; const g = c.getContext('2d'); fn(g); return c; };
    const rng = (s) => () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const HGT = this.HGT;

    const floor = (seed) => mk(16, g => {
      this.diamondRows(g, 0, B.floor.base);
      const r = rng(seed);
      for (let i = 0; i < 6; i++) {
        const x = 6 + Math.floor(r() * 20), y = 3 + Math.floor(r() * 10);
        g.fillStyle = r() < 0.7 ? B.floor.dark : B.floor.light;
        g.fillRect(x, y, 1 + (r() < 0.3 ? 1 : 0), 1);
      }
      g.fillStyle = B.floor.edge;
      for (let b = 0; b < 8; b++) { g.fillRect(2 * b, 8 + b, 1, 1); g.fillRect(32 - 2 * b - 1, 8 + b, 1, 1); }
    });

    const wall = (seed) => mk(16 + HGT, g => {
      const r = rng(seed);
      for (let k = HGT; k >= 1; k--) {
        for (let b = 0; b < 8; b++) {
          const y = 8 + b + k, w = 32 - 4 * b;
          g.fillStyle = B.wall.left;  g.fillRect(2 * b, y, w / 2, 1);
          g.fillStyle = B.wall.right; g.fillRect(16, y, w / 2, 1);
        }
      }
      for (let i = 0; i < 5; i++) {
        const side = r() < 0.5;
        const x = side ? 2 + Math.floor(r() * 11) : 17 + Math.floor(r() * 11);
        const y = 12 + Math.floor(r() * (HGT + 6));
        g.fillStyle = side ? B.wall.dl : B.wall.dr;
        g.fillRect(x, y, 2 + Math.floor(r() * 3), 1);
      }
      this.diamondRows(g, 0, B.wall.top);
      g.fillStyle = B.wall.hi;
      for (let r2 = 0; r2 < 4; r2++) g.fillRect(14 - 2 * r2, r2, 4 * (r2 + 1), 1);
      const rr = rng(seed + 7);
      g.fillStyle = B.wall.spark;
      for (let i = 0; i < 3; i++) { if (rr() < 0.6) g.fillRect(8 + Math.floor(rr() * 16), 4 + Math.floor(rr() * 9), 1, 1); }
      g.fillStyle = B.wall.edge;
      for (let b = 0; b < 8; b++) { g.fillRect(2 * b, 8 + b, 1, 1); g.fillRect(32 - 2 * b - 1, 8 + b, 1, 1); }
    });

    const fog = mk(16, g => {
      this.diamondRows(g, 0, B.fog.base);
      g.fillStyle = B.fog.dots;
      [[12, 5], [20, 9], [16, 12], [8, 8], [24, 7]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      g.fillStyle = B.fog.edge;
      for (let b = 0; b < 8; b++) { g.fillRect(2 * b, 8 + b, 1, 1); g.fillRect(32 - 2 * b - 1, 8 + b, 1, 1); }
    });

    const sprite = (map, colors) => {
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      const g = c.getContext('2d');
      map.forEach((row, y) => { [...row].forEach((ch, x) => { if (colors[ch]) { g.fillStyle = colors[ch]; g.fillRect(x * 2, y * 2, 2, 2); } }); });
      return c;
    };
    const sprite1 = (map, colors) => {
      const c = document.createElement('canvas'); c.width = 8; c.height = 8;
      const g = c.getContext('2d');
      map.forEach((row, y) => { [...row].forEach((ch, x) => { if (colors[ch]) { g.fillStyle = colors[ch]; g.fillRect(x, y, 1, 1); } }); });
      return c;
    };

    const HERO   = ['..HHHH..', '.HHHHHH.', '.HSESEH.', '..SSSS..', '.BBBBBB.', '.BBBBBB.', '..B..B..', '.LL..LL.'];
    const DOOR   = ['.FFFFFF.', 'FDDDDDDF', 'FDDDDDDF', 'FDDDDKDF', 'FDDDDDDF', 'FDDDDDDF', 'FDDDDDDF', 'FFFFFFFF'];
    // Замкнені двері: та сама коробка, але з навісним замком по центру
    const LOCKED = ['.FFFFFF.', 'FDDDDDDF', 'FDDLLDDF', 'FDLDDLDF', 'FLLLLLLF', 'FLLKKLLF', 'FLLLLLLF', 'FFFFFFFF'];
    const APPLE  = ['...T....', '..TGG...', '.RRRRR..', 'RRRRRRR.', 'RWRRRRR.', 'RRRRRRR.', '.RRRRR..', '..RRR...'];
    const BANANA = ['....T...', '.....Y..', '.....YY.', '.....YY.', '....YY..', '...YY...', '.YYY....', 'YY......'];
    const CHERRY = ['...T....', '..T.T...', '.T...T..', '.T...T..', 'RR...RR.', 'RRR.RRR.', 'RR...RR.', '........'];
    const ORANGE = ['...T....', '..OOO...', '.OOOOO..', '.OWOOO..', '.OOOOO..', '..OOO...', '........', '........'];
    const ARROW  = ['...AA...', '..AAAA..', '.AAAAAA.', '...AA...', '...AA...', '...AA...', '........', '........'];

    const fc = { T: '#5a3a2e', G: '#6e8f5a', R: '#e14b4b', W: '#f2c9a0', Y: '#ffcf4a', O: '#ff9f2e' };
    const cc = { T: '#5a3a2e', R: '#e14b6e' };

    this.T = {
      floor1: floor(5), floor2: floor(29), wall1: wall(3), wall2: wall(17), fog,
      hero:   sprite(HERO, { H: '#e14b4b', S: '#f2c9a0', E: '#2b1a14', B: '#b23434', L: '#5a3a2e' }),
      door:   sprite(DOOR,   { F: '#3b2b1e', D: '#8a5a2e', K: '#ffcf4a' }),
      doorLocked: sprite(LOCKED, { F: '#2b2119', D: '#5c452e', L: '#8d9199', K: '#3a3f47' }),
      apple:  sprite(APPLE, fc), banana: sprite(BANANA, fc),
      cherry: sprite(CHERRY, cc), orange: sprite(ORANGE, fc),
      arrow:  sprite1(ARROW, { A: '#ffcf4a' }),
      arrows: {},
    };
    Object.entries(MAZE_DIR_COLORS).forEach(([key, color]) => {
      this.T.arrows[key] = sprite1(ARROW, { A: color });
    });
  }

  // ─── Рендер ───────────────────────────────────────────────────────────────
  // view = { w, h, ox, oy } — розмір вікна та зсув камери в пікселях.
  // Без view малює все поле від нуля (оглядовий режим).
  render(ctx, t, view) {
    if (!this.grid) return;
    if (!this.T) this.buildTiles();

    const B = this.biome();
    const full = this.fullSize();
    const v = view || { w: full.w, h: full.h, ox: 0, oy: 0 };
    const ox = Math.round(v.ox), oy = Math.round(v.oy);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = B.bg;
    ctx.fillRect(0, 0, v.w, v.h);
    ctx.translate(-ox, -oy);

    const { W, H } = this.dims();
    const [ex, ey] = this.door;
    const [px, py] = this.player;
    const bob = Math.floor(t / 420) % 2;
    const doorSprite = this.doorOpen ? this.T.door : this.T.doorLocked;

    for (let d = 0; d <= W + H - 2; d++) {
      for (let x = Math.max(0, d - H + 1); x <= Math.min(W - 1, d); x++) {
        const y = d - x;
        const [sx, sy] = this.iso(x, y);
        if (sx + 32 < ox || sx > ox + v.w || sy + 32 + this.HGT < oy || sy - this.HGT > oy + v.h) continue;

        const idx = y * W + x;
        const isDoor = x === ex && y === ey;

        if (!this.revealed.has(idx)) {
          ctx.drawImage(this.T.fog, sx, sy);
          if (isDoor && this.doorFound) {
            ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t / 240);
            ctx.drawImage(doorSprite, sx + 8, sy - 8);
            ctx.globalAlpha = 1;
          }
          continue;
        }

        if (this.grid[y][x] === 1) {
          ctx.drawImage((x * 7 + y * 13) % 3 === 0 ? this.T.wall2 : this.T.wall1, sx, sy - this.HGT);
        } else {
          ctx.drawImage((x * 5 + y * 11) % 4 === 0 ? this.T.floor2 : this.T.floor1, sx, sy);
          if (isDoor) {
            // Відчинені двері сяють помітніше за замкнені
            const amp = this.doorOpen ? 0.4 : 0.18;
            ctx.globalAlpha = amp + 0.15 * Math.sin(t / 240);
            ctx.translate(sx, sy);
            this.diamondRows(ctx, 0, this.doorOpen ? '#ffcf4a' : '#6b7078');
            ctx.translate(-sx, -sy);
            ctx.globalAlpha = 1;
            ctx.drawImage(doorSprite, sx + 8, sy - 8);
          }
          if (this.fruits.has(idx)) {
            const f = this.FRUITS[this.fruits.get(idx)];
            ctx.drawImage(this.T[f.key], sx + 8, sy - 6 - Math.floor(t / 300) % 2);
          }
          if (x === px && y === py) ctx.drawImage(this.T.hero, sx + 8, sy - 7 - bob);
        }
      }
    }

    this.drawPointers(ctx, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ─── Вказівники доступних ходів ──────────────────────────────────────────
  // Підсвічений ромб клітини (піксельно, тайлом) + векторний трикутник згори.
  // Растр не обертається — тому немає «крихти» від повороту на довільний кут.
  drawPointers(ctx, t) {
    const [px, py] = this.player;
    const pulse = 0.09 + 0.04 * Math.sin(t / 300);

    for (const [dx, dy] of Maze.RING) {
      if (!this.validMove(dx, dy)) continue;

      const [sx, sy] = this.iso(px + dx, py + dy);
      const color = mazeColorForVec([dx, dy]);
      const cx = sx + 16, cy = sy + 8;

      // Ромб клітини — «сюди ступить герой». Тримаємо ледь помітним:
      // підказка не має конкурувати з героєм за увагу.
      ctx.globalAlpha = pulse;
      ctx.translate(sx, sy);
      this.diamondRows(ctx, 0, color);
      ctx.translate(-sx, -sy);
      ctx.globalAlpha = 1;

      // Екранний напрямок ходу: ізометрія стискає вертикаль удвічі
      const vx = dx - dy, vy = (dx + dy) * 0.5;
      const len = Math.hypot(vx, vy) || 1;
      const nx = vx / len, ny = vy / len;
      const perpX = -ny, perpY = nx;

      // Шеврон, а не суцільний трикутник: дві сторони «галочки» читаються як
      // напрямок навіть дрібними, і не забивають собою клітину.
      const TIP = 4.6, HALF = 3.4, TAIL = 1.6;
      const tipX = cx + nx * TIP, tipY = cy + ny * TIP;
      const w1X = cx - nx * TAIL + perpX * HALF, w1Y = cy - ny * TAIL + perpY * HALF;
      const w2X = cx - nx * TAIL - perpX * HALF, w2Y = cy - ny * TAIL - perpY * HALF;

      ctx.beginPath();
      ctx.moveTo(w1X, w1Y);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(w2X, w2Y);

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = 'rgba(4,8,6,0.9)';   // темний контур тримає форму на будь-якому фоні
      ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // ─── Мінікарта: схема всієї кімнати згори ────────────────────────────────
  drawMinimap(ctx, cell, t) {
    const { W, H } = this.dims();
    const B = this.biome();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = B.bg;
    ctx.fillRect(0, 0, W * cell, H * cell);

    const [ex, ey] = this.door;
    const [px, py] = this.player;

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (!this.revealed.has(idx)) continue;
      ctx.fillStyle = this.grid[y][x] === 1 ? B.wall.top : B.floor.light;
      ctx.fillRect(x * cell, y * cell, cell, cell);

      if (this.grid[y][x] === 0 && this.fruits.has(idx)) {
        ctx.fillStyle = this.FRUITS[this.fruits.get(idx)].color;
        ctx.fillRect(x * cell + 1, y * cell + 1, Math.max(1, cell - 2), Math.max(1, cell - 2));
      }
    }

    if (this.revealed.has(ey * W + ex) || this.doorFound) {
      const on = Math.floor(t / 300) % 2;
      ctx.fillStyle = this.doorOpen ? (on ? '#ffcf4a' : '#8a6f22') : (on ? '#9aa0a8' : '#4d5259');
      ctx.fillRect(ex * cell, ey * cell, cell, cell);
    }

    ctx.fillStyle = '#e14b4b';
    ctx.fillRect(px * cell, py * cell, cell, cell);
    ctx.fillStyle = '#f2c9a0';
    ctx.fillRect(px * cell + Math.floor(cell / 3), py * cell + Math.floor(cell / 3), Math.max(1, Math.floor(cell / 3)), Math.max(1, Math.floor(cell / 3)));
  }
}
