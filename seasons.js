// Seasonal hero: grows foliage on the vine SVG and runs weather for the current season.
// The season comes from ?season=spring|summer|fall|winter, otherwise from today's date.
(() => {
  const home = document.getElementById('home');
  if (!home) return;

  const SEASONS = ['spring', 'summer', 'fall', 'winter'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LEAF_D = 'M0 0 C -3.2 -3 -3.6 -8 0 -12 C 3.6 -8 3.2 -3 0 0 Z';
  const PETAL_D = 'M0 -5 C 3 -4 3.4 1 0 5 C -3.4 1 -3 -4 0 -5 Z';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pristine = home.querySelector('.hero-vines').cloneNode(true);

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // Meteorological seasons, northern hemisphere
  function seasonForDate(date = new Date()) {
    const m = date.getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'fall';
    return 'winter';
  }

  // Effects only run while the hero is on screen and the tab is visible
  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(home);
  const running = () => heroVisible && !document.hidden;

  // Points along a vine, with the time each one gets "drawn" by the CSS vine animation
  function sampleVine(svg, vine, spacing, from = 0) {
    const cs = getComputedStyle(vine);
    const delay = parseFloat(cs.animationDelay) || 0;
    const dur = parseFloat(cs.animationDuration) || 0;
    // Measure a copy without pathLength="1" so lengths are in viewBox units
    const probe = svgEl('path', { d: vine.getAttribute('d') });
    svg.appendChild(probe);
    const len = probe.getTotalLength();
    const pts = [];
    for (let s = len * from + spacing * rand(0.3, 1); s < len - 2; s += spacing * rand(0.7, 1.3)) {
      const p = probe.getPointAtLength(s);
      const q = probe.getPointAtLength(s + 1);
      pts.push({
        x: p.x,
        y: p.y,
        angle: Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI,
        at: delay + (s / len) * dur,
      });
    }
    probe.remove();
    return { pts, end: delay + dur };
  }

  function addLeaf(group, p, color, opacity) {
    // Point the leaf off either side of the branch, preferring upward
    let dir = p.angle + pick([-1, 1]) * rand(35, 75);
    if (Math.sin(dir * Math.PI / 180) > 0.5) dir = 2 * p.angle - dir;
    const g = svgEl('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${rand(0.7, 1.15).toFixed(2)})` });
    const leaf = svgEl('path', { d: LEAF_D, fill: color, class: 'f-leaf' });
    leaf.style.setProperty('--r', `${(dir + 90).toFixed(1)}deg`);
    leaf.style.setProperty('--d', `${(p.at + rand(0, 0.4)).toFixed(2)}s`);
    leaf.style.setProperty('--o', opacity.toFixed(2));
    leaf.style.setProperty('--sway', `${rand(2.5, 5).toFixed(2)}s`);
    g.appendChild(leaf);
    group.appendChild(g);
    return leaf;
  }

  function addBlossom(group, p, color) {
    const g = svgEl('g', { transform: `translate(${(p.x + rand(-3, 3)).toFixed(1)} ${(p.y + rand(-3, 3)).toFixed(1)}) scale(${rand(0.75, 1.25).toFixed(2)})` });
    const bloom = svgEl('g', { class: 'f-bloom' });
    for (let i = 0; i < 5; i++) {
      bloom.appendChild(svgEl('ellipse', { cx: 0, cy: -3.2, rx: 2.3, ry: 3.3, fill: color, transform: `rotate(${i * 72})` }));
    }
    bloom.appendChild(svgEl('circle', { r: 1.2, fill: '#fff1b8' }));
    bloom.style.setProperty('--r', `${rand(0, 72).toFixed(0)}deg`);
    bloom.style.setProperty('--d', `${(p.at + rand(0.3, 1.2)).toFixed(2)}s`);
    bloom.style.setProperty('--o', rand(0.75, 0.95).toFixed(2));
    g.appendChild(bloom);
    group.appendChild(g);
    return bloom;
  }

  function addSnowcap(svg, vine, delay) {
    const cap = vine.cloneNode();
    cap.setAttribute('class', 'snowcap');
    cap.setAttribute('stroke', '#f2f8ff');
    cap.setAttribute('stroke-width', parseFloat(vine.getAttribute('stroke-width')) * 0.9);
    cap.setAttribute('transform', 'translate(0 -1.4)');
    // Irregular drifts, in units of the normalized pathLength
    const dashes = [];
    for (let total = 0; total < 1;) {
      const on = rand(0.02, 0.22), off = rand(0.04, 0.16);
      dashes.push(on.toFixed(3), off.toFixed(3));
      total += on + off;
    }
    cap.setAttribute('stroke-dasharray', dashes.join(' '));
    cap.style.setProperty('--d', `${delay.toFixed(2)}s`);
    svg.appendChild(cap);
  }

  // A falling leaf or petal, positioned in #home pixels
  function spawnFaller(fx, x, y, { shape, color, size, drift, speed, opacity }) {
    const f = document.createElement('div');
    f.className = 'faller';
    const dy = home.clientHeight - y + 40;
    const vb = shape === LEAF_D ? '-7 -13 14 14' : '-5 -6 10 12';
    const vein = shape === LEAF_D ? '<path d="M0 -1 L0 -11" stroke="rgba(0,0,0,0.28)" stroke-width="0.6"/>' : '';
    f.innerHTML = `<div class="faller-tumble"><svg viewBox="${vb}"><path d="${shape}" fill="${color}"/>${vein}</svg></div>`;
    Object.assign(f.style, { left: `${x}px`, top: `${y}px` });
    const vars = {
      '--size': `${size}px`,
      '--dur': `${(dy / speed).toFixed(2)}s`,
      '--dx': `${drift.toFixed(0)}px`,
      '--dy': `${dy.toFixed(0)}px`,
      '--o': opacity,
      '--flut': `${rand(0.9, 2.2).toFixed(2)}s`,
      '--sw': `${rand(8, 26).toFixed(0)}px`,
      '--rot0': `${rand(-60, 0).toFixed(0)}deg`,
      '--rot1': `${rand(40, 160).toFixed(0)}deg`,
    };
    for (const [k, v] of Object.entries(vars)) f.style.setProperty(k, v);
    f.addEventListener('animationend', e => { if (e.target === f) f.remove(); });
    fx.appendChild(f);
  }

  function every(ms, fn, cleanups) {
    const id = setInterval(() => { if (running()) fn(); }, ms);
    cleanups.push(() => clearInterval(id));
  }

  // x biased toward the sides so the centre text stays clear
  const sideX = w => (Math.random() < 0.8 ? (Math.random() < 0.5 ? rand(0, 0.32) : rand(0.68, 1)) : rand(0.32, 0.68)) * w;

  function dropFromBranch(fx, leaves, minLeft, style) {
    const now = performance.now() / 1000;
    const ready = leaves.filter(l => !l.classList.contains('dropped') && now - l.bornAt > 1);
    if (ready.length <= minLeft) return;
    const leaf = pick(ready);
    const r = leaf.getBoundingClientRect();
    const h = home.getBoundingClientRect();
    leaf.classList.add('dropped');
    spawnFaller(fx, r.left - h.left + r.width / 2 - style.size / 2, r.top - h.top, { ...style, color: leaf.getAttribute('fill') });
  }

  const SEASON_SETUP = {
    spring(svg, fx, vines, cleanups) {
      const group = svgEl('g', { class: 'foliage' });
      const blooms = [];
      const petalColors = ['#f7b6cf', '#f9cfe0', '#ee93b6', '#fde4ee'];
      for (const vine of vines) {
        const { pts } = sampleVine(svg, vine, 15, 0.12);
        pts.forEach((p, i) => {
          if (i % 3 === 1) addLeaf(group, p, pick(['#8fd18b', '#a9e2a0', '#6fbf73']), rand(0.45, 0.65));
          else blooms.push(addBlossom(group, p, pick(petalColors)));
        });
      }
      svg.appendChild(group);
      if (reduceMotion) return;

      const petal = () => ({ shape: PETAL_D, color: pick(petalColors), size: rand(7, 11), drift: rand(120, 320), speed: rand(35, 60), opacity: rand(0.6, 0.9) });
      every(550, () => {
        if (fx.childElementCount > 22) return;
        if (Math.random() < 0.55) {
          // Blow a petal off an open blossom
          const b = pick(blooms).getBoundingClientRect();
          const h = home.getBoundingClientRect();
          if (b.width) spawnFaller(fx, b.left - h.left, b.top - h.top, petal());
        } else {
          spawnFaller(fx, rand(-0.1, 0.9) * home.clientWidth, -20, petal());
        }
      }, cleanups);
    },

    summer(svg, fx, vines, cleanups) {
      const group = svgEl('g', { class: 'foliage' });
      const greens = ['#3f9b5a', '#5cb86e', '#2f7d4a', '#7cc47f', '#4aa865'];
      for (const vine of vines) {
        const { pts } = sampleVine(svg, vine, 9, 0.08);
        for (const p of pts) {
          addLeaf(group, p, pick(greens), rand(0.4, 0.7));
          if (Math.random() < 0.45) addLeaf(group, p, pick(greens), rand(0.35, 0.6));
        }
      }
      svg.appendChild(group);
      if (reduceMotion) return;

      for (let i = 0; i < 18; i++) {
        const ff = document.createElement('div');
        ff.className = 'firefly';
        Object.assign(ff.style, { left: `${sideX(100)}%`, top: `${rand(25, 95)}%` });
        const vars = {
          '--mv': `${rand(6, 12)}s`, '--bl': `${rand(2.5, 5)}s`, '--dl': `${rand(2, 6)}s`,
          '--x1': `${rand(-60, 60)}px`, '--y1': `${rand(-50, 30)}px`,
          '--x2': `${rand(-80, 80)}px`, '--y2': `${rand(-70, 20)}px`,
        };
        for (const [k, v] of Object.entries(vars)) ff.style.setProperty(k, v);
        fx.appendChild(ff);
      }
    },

    fall(svg, fx, vines, cleanups) {
      const group = svgEl('g', { class: 'foliage' });
      const colors = ['#d9622b', '#e8a33d', '#c2412d', '#f2c14e', '#b5562a'];
      const leaves = [];
      const start = performance.now() / 1000;
      for (const vine of vines) {
        const { pts } = sampleVine(svg, vine, 12, 0.1);
        for (const p of pts) {
          const leaf = addLeaf(group, p, pick(colors), rand(0.6, 0.85));
          leaf.bornAt = start + parseFloat(leaf.style.getPropertyValue('--d'));
          leaves.push(leaf);
        }
      }
      svg.appendChild(group);
      if (reduceMotion) return;

      const leafStyle = () => ({ shape: LEAF_D, size: rand(14, 22), drift: rand(-60, 160), speed: rand(45, 80), opacity: rand(0.7, 0.9) });
      every(1100, () => dropFromBranch(fx, leaves, leaves.length * 0.4, leafStyle()), cleanups);
      every(900, () => {
        if (fx.childElementCount < 16) spawnFaller(fx, sideX(home.clientWidth), -24, { ...leafStyle(), color: pick(colors) });
      }, cleanups);
    },

    winter(svg, fx, vines, cleanups) {
      for (const vine of vines) {
        const cs = getComputedStyle(vine);
        addSnowcap(svg, vine, (parseFloat(cs.animationDelay) || 0) + (parseFloat(cs.animationDuration) || 0));
      }
      if (reduceMotion) return;
      startSnow(fx, cleanups);
    },
  };

  function startSnow(fx, cleanups) {
    const canvas = document.createElement('canvas');
    fx.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, flakes = [];

    const makeFlake = anywhere => {
      const z = Math.random(); // depth: bigger flakes are nearer, faster, brighter
      return {
        x: rand(0, w), y: anywhere ? rand(0, h) : rand(-20, -4),
        r: 0.5 + z * 2, vy: 16 + z * 42, a: 0.15 + z * 0.55,
        phase: rand(0, Math.PI * 2), freq: rand(0.4, 1.2), amp: 4 + z * 14,
      };
    };

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = home.clientWidth;
      h = home.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 9000);
      while (flakes.length < n) flakes.push(makeFlake(true));
      flakes.length = n;
    }

    let raf, last = performance.now(), t = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!running()) return;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.x += (6 + f.r * 4) * dt; // light breeze
        if (f.y > h + 6) Object.assign(f, makeFlake(false));
        if (f.x > w + 20) f.x -= w + 40;
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x + Math.sin(t * f.freq + f.phase) * f.amp, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    cleanups.push(() => { cancelAnimationFrame(raf); removeEventListener('resize', resize); });
  }

  let cleanups = [];

  function set(season) {
    if (!SEASONS.includes(season)) season = seasonForDate();
    cleanups.forEach(fn => fn());
    cleanups = [];
    document.documentElement.dataset.season = season;

    // Fresh copy of the tree so the draw-on animation replays
    const svg = pristine.cloneNode(true);
    home.querySelector('.hero-vines').replaceWith(svg);
    let fx = home.querySelector('.season-fx');
    if (!fx) {
      fx = document.createElement('div');
      fx.className = 'season-fx';
      svg.after(fx);
    }
    fx.replaceChildren();

    SEASON_SETUP[season](svg, fx, [...svg.querySelectorAll('.vine')], cleanups);
    return season;
  }

  window.Seasons = { set, forDate: seasonForDate, list: SEASONS };
  set(new URLSearchParams(location.search).get('season'));
})();
