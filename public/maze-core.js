// Ядро ізометричного лабіринту: генерація поля, рух, туман, рендер.
// Спільне для /maze (налагоджувальний екран) і /stage (екран для проекції).
// Логіка та піксель-арт перенесені з Claude Design без змін; React-обгортку прибрано.

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
const mazeActionByKey = k => MAZE_ACTIONS.find(a => a.key === k) || MAZE_ACTIONS[0];
const mazeArrowForVec = d => (MAZE_ACTIONS.find(a => a.d[0] === d[0] && a.d[1] === d[1]) || { arrow: '·' }).arrow;

class Maze {
  // Вісім напрямків по колу — сусіди в масиві є сусідами й за кутом.
  static RING = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

  static FRUITS = [
    { key: 'apple',  name: 'ЯБЛУКО',   color: '#e14b4b', desc: 'ОГЛЯД +1 НА 15 КРОКІВ' },
    { key: 'banana', name: 'БАНАН',    color: '#ffcf4a', desc: 'МІНУС 10 КРОКІВ' },
    { key: 'cherry', name: 'ВИШНІ',    color: '#e14b6e', desc: 'СЯЙВО: ВІДКРИВАЄ 7×7' },
    { key: 'orange', name: 'АПЕЛЬСИН', color: '#ff9f2e', desc: 'ПОКАЗУЄ, ДЕ ВИХІД' },
  ];

  constructor(opts = {}) {
    this.HGT = 10;
    this.PAD_TOP = 14;
    this.W = opts.W || 21;
    this.H = opts.H || 15;
    this.visionRadius = opts.visionRadius || 1;
    this.cornerCut = !!opts.cornerCut;
    this.FRUITS = Maze.FRUITS;
    this.steps = 0;
    this.won = false;
    this.genMaze();
  }

  dims() { return { W: this.W, H: this.H }; }

  // Повний розмір поля в пікселях — для екрана без камери
  fullSize() {
    const { W, H } = this.dims();
    return { w: (W + H) * 16, h: (W + H - 2) * 8 + 16 + this.HGT + this.PAD_TOP + 4 };
  }

  vision() {
    const base = Math.max(1, Math.min(3, Math.round(this.visionRadius)));
    const boost = this.boostUntil && this.steps < this.boostUntil ? 1 : 0;
    return base + boost;
  }

  genMaze() {
    const { W, H } = this.dims();
    let g, reach;
    for (let attempt = 0; attempt < 25; attempt++) {
      g = Array.from({ length: H }, () => Array(W).fill(0));
      for (let x = 0; x < W; x++) { g[0][x] = 1; g[H - 1][x] = 1; }
      for (let y = 0; y < H; y++) { g[y][0] = 1; g[y][W - 1] = 1; }
      const target = Math.floor((W - 2) * (H - 2) * 0.3);
      let placed = 0, guard = 0;
      while (placed < target && guard++ < 6000) {
        let x = 1 + Math.floor(Math.random() * (W - 2));
        let y = 1 + Math.floor(Math.random() * (H - 2));
        const len = 2 + Math.floor(Math.random() * 5);
        for (let i = 0; i < len; i++) {
          if (x > 0 && y > 0 && x < W - 1 && y < H - 1 && !(x === 1 && y === 1) && g[y][x] === 0) { g[y][x] = 1; placed++; }
          if (Math.random() < 0.5) x += Math.random() < 0.5 ? 1 : -1; else y += Math.random() < 0.5 ? 1 : -1;
        }
      }
      g[1][1] = 0;
      reach = this.bfs(g, W, H);
      const floorTotal = g.flat().filter(v => v === 0).length;
      if (reach.count / floorTotal > 0.72) break;
    }
    const { dist, far } = reach;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] === 0 && dist[y][x] < 0) g[y][x] = 1;
    }
    this.grid = g;
    this.exit = far;
    this.player = [1, 1];
    this.revealed = new Set();
    this.boostUntil = 0;
    this.exitKnown = false;

    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] === 0 && dist[y][x] >= 4 && !(x === far[0] && y === far[1])) cells.push(y * W + x);
    }
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const K = Math.max(4, Math.round(W * H / 39));
    this.fruits = new Map();
    for (let i = 0; i < Math.min(K, cells.length); i++) this.fruits.set(cells[i], i % this.FRUITS.length);
    this.fruitTotal = this.fruits.size;
    this.reveal();
  }

  bfs(g, W, H) {
    const dist = Array.from({ length: H }, () => Array(W).fill(-1));
    dist[1][1] = 0;
    const q = [[1, 1]];
    let far = [1, 1], count = 1;
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

  move(dx, dy) {
    if (this.won) return { result: 'blocked' };
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
      if (fruit.key === 'orange') this.exitKnown = true;
    }
    this.reveal();

    this.steps++;
    if (fruit && fruit.key === 'banana') this.steps = Math.max(0, this.steps - 10);
    if (nx === this.exit[0] && ny === this.exit[1]) this.won = true;

    return { result: this.won ? 'won' : 'moved', fruit };
  }

  restart() {
    this.steps = 0;
    this.won = false;
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

  // Центр тайла героя в пікселях — цільова точка для камери
  playerCenter() {
    const [sx, sy] = this.iso(this.player[0], this.player[1]);
    return [sx + 16, sy + 8];
  }

  // ─── Піксель-арт тайли ────────────────────────────────────────────────────
  diamondRows(g, y0, fill) {
    g.fillStyle = fill;
    for (let r = 0; r < 8; r++) g.fillRect(14 - 2 * r, y0 + r, 4 * (r + 1), 1);
    for (let b = 0; b < 8; b++) g.fillRect(2 * b, y0 + 8 + b, 32 - 4 * b, 1);
  }

  buildTiles() {
    const mk = (h, fn) => { const c = document.createElement('canvas'); c.width = 32; c.height = h; const g = c.getContext('2d'); fn(g); return c; };
    const rng = (s) => () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const HGT = this.HGT;

    const floor = (seed) => mk(16, g => {
      this.diamondRows(g, 0, '#20301f');
      const r = rng(seed);
      for (let i = 0; i < 6; i++) {
        const x = 6 + Math.floor(r() * 20), y = 3 + Math.floor(r() * 10);
        g.fillStyle = r() < 0.7 ? '#182517' : '#2a3d28';
        g.fillRect(x, y, 1 + (r() < 0.3 ? 1 : 0), 1);
      }
      g.fillStyle = '#131f13';
      for (let b = 0; b < 8; b++) { g.fillRect(2 * b, 8 + b, 1, 1); g.fillRect(32 - 2 * b - 1, 8 + b, 1, 1); }
    });

    const wall = (seed) => mk(16 + HGT, g => {
      const r = rng(seed);
      for (let k = HGT; k >= 1; k--) {
        for (let b = 0; b < 8; b++) {
          const y = 8 + b + k, w = 32 - 4 * b;
          g.fillStyle = '#4a6339'; g.fillRect(2 * b, y, w / 2, 1);
          g.fillStyle = '#36492c'; g.fillRect(16, y, w / 2, 1);
        }
      }
      for (let i = 0; i < 5; i++) {
        const side = r() < 0.5;
        const x = side ? 2 + Math.floor(r() * 11) : 17 + Math.floor(r() * 11);
        const y = 12 + Math.floor(r() * (HGT + 6));
        g.fillStyle = side ? '#3b5030' : '#2b3a23';
        g.fillRect(x, y, 2 + Math.floor(r() * 3), 1);
      }
      this.diamondRows(g, 0, '#6e8f5a');
      g.fillStyle = '#93b57c';
      for (let r2 = 0; r2 < 4; r2++) g.fillRect(14 - 2 * r2, r2, 4 * (r2 + 1), 1);
      const rr = rng(seed + 7);
      g.fillStyle = '#a8c98f';
      for (let i = 0; i < 3; i++) { if (rr() < 0.6) g.fillRect(8 + Math.floor(rr() * 16), 4 + Math.floor(rr() * 9), 1, 1); }
      g.fillStyle = '#48613a';
      for (let b = 0; b < 8; b++) { g.fillRect(2 * b, 8 + b, 1, 1); g.fillRect(32 - 2 * b - 1, 8 + b, 1, 1); }
    });

    const fog = mk(16, g => {
      this.diamondRows(g, 0, '#0a120b');
      g.fillStyle = '#0e1a10';
      [[12, 5], [20, 9], [16, 12], [8, 8], [24, 7]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      g.fillStyle = '#050a06';
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
      door:   sprite(DOOR, { F: '#3b2b1e', D: '#8a5a2e', K: '#ffcf4a' }),
      apple:  sprite(APPLE, fc), banana: sprite(BANANA, fc),
      cherry: sprite(CHERRY, cc), orange: sprite(ORANGE, fc),
      arrow:  sprite1(ARROW, { A: '#ffcf4a' }),
    };
  }

  // ─── Рендер ───────────────────────────────────────────────────────────────
  // view = { w, h, ox, oy } — розмір вікна та зсув камери в пікселях.
  // Без view малює все поле від нуля (режим оглядового екрана).
  render(ctx, t, view) {
    if (!this.grid) return;
    if (!this.T) this.buildTiles();

    const full = this.fullSize();
    const v = view || { w: full.w, h: full.h, ox: 0, oy: 0 };
    const ox = Math.round(v.ox), oy = Math.round(v.oy);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#080f09';
    ctx.fillRect(0, 0, v.w, v.h);
    ctx.translate(-ox, -oy);

    const { W, H } = this.dims();
    const [ex, ey] = this.exit;
    const [px, py] = this.player;
    const bob = Math.floor(t / 420) % 2;

    for (let d = 0; d <= W + H - 2; d++) {
      for (let x = Math.max(0, d - H + 1); x <= Math.min(W - 1, d); x++) {
        const y = d - x;
        const [sx, sy] = this.iso(x, y);

        // За межами вікна камери малювати нічого не треба
        if (sx + 32 < ox || sx > ox + v.w || sy + 32 + this.HGT < oy || sy - this.HGT > oy + v.h) continue;

        const idx = y * W + x;
        const isExit = x === ex && y === ey;

        if (!this.revealed.has(idx)) {
          ctx.drawImage(this.T.fog, sx, sy);
          if (isExit && this.exitKnown) {
            ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t / 240);
            ctx.drawImage(this.T.door, sx + 8, sy - 8);
            ctx.globalAlpha = 1;
          }
          continue;
        }

        if (this.grid[y][x] === 1) {
          ctx.drawImage((x * 7 + y * 13) % 3 === 0 ? this.T.wall2 : this.T.wall1, sx, sy - this.HGT);
        } else {
          ctx.drawImage((x * 5 + y * 11) % 4 === 0 ? this.T.floor2 : this.T.floor1, sx, sy);
          if (isExit) {
            ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t / 240);
            ctx.translate(sx, sy); this.diamondRows(ctx, 0, '#ffcf4a'); ctx.translate(-sx, -sy);
            ctx.globalAlpha = 1;
            ctx.drawImage(this.T.door, sx + 8, sy - 8);
          }
          if (this.fruits.has(idx)) {
            const f = this.FRUITS[this.fruits.get(idx)];
            ctx.drawImage(this.T[f.key], sx + 8, sy - 6 - Math.floor(t / 300) % 2);
          }
          if (x === px && y === py) ctx.drawImage(this.T.hero, sx + 8, sy - 7 - bob);
        }
      }
    }

    if (!this.won) {
      const pulse = 0.3 + 0.14 * Math.sin(t / 280);
      for (const [dx, dy] of Maze.RING) {
        if (!this.validMove(dx, dy)) continue;
        const [sx2, sy2] = this.iso(px + dx, py + dy);
        const ang = Math.atan2((dx - dy) * 16, -(dx + dy) * 8);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.translate(sx2 + 16, sy2 + 8);
        ctx.rotate(ang);
        ctx.drawImage(this.T.arrow, -4, -5);
        ctx.restore();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ─── Мінікарта: схема всього поля згори, клітина = cell пікселів ──────────
  drawMinimap(ctx, cell, t) {
    const { W, H } = this.dims();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#070d08';
    ctx.fillRect(0, 0, W * cell, H * cell);

    const [ex, ey] = this.exit;
    const [px, py] = this.player;

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (!this.revealed.has(idx)) {
        if (x === ex && y === ey && this.exitKnown) {
          ctx.fillStyle = '#6b5a1e';
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
        continue;
      }
      ctx.fillStyle = this.grid[y][x] === 1 ? '#3b5030' : '#1b2a1a';
      ctx.fillRect(x * cell, y * cell, cell, cell);

      if (this.grid[y][x] === 0 && this.fruits.has(idx)) {
        ctx.fillStyle = this.FRUITS[this.fruits.get(idx)].color;
        ctx.fillRect(x * cell + 1, y * cell + 1, Math.max(1, cell - 2), Math.max(1, cell - 2));
      }
    }

    // Вихід — блимає, якщо вже відкритий або показаний апельсином
    if (this.revealed.has(ey * W + ex) || this.exitKnown) {
      ctx.fillStyle = Math.floor(t / 300) % 2 ? '#ffcf4a' : '#8a6f22';
      ctx.fillRect(ex * cell, ey * cell, cell, cell);
    }

    // Герой
    ctx.fillStyle = '#e14b4b';
    ctx.fillRect(px * cell, py * cell, cell, cell);
    ctx.fillStyle = '#f2c9a0';
    ctx.fillRect(px * cell + Math.floor(cell / 3), py * cell + Math.floor(cell / 3), Math.max(1, Math.floor(cell / 3)), Math.max(1, Math.floor(cell / 3)));
  }
}
