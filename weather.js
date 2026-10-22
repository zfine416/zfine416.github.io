// Weather below the hero: snow, petals, leaves or fireflies for the current season, drawn
// behind the content. It settles on cards, keeps clear of text and reacts to the cursor.
(() => {
  const LEAF = new Path2D('M0 6 C -3.2 3 -3.6 -2 0 -6 C 3.6 -2 3.2 3 0 6 Z');
  const PETAL = new Path2D('M0 -5 C 3 -4 3.4 1 0 5 C -3.4 1 -3 -4 0 -5 Z');
  const KIND = { spring: 'petal', summer: 'firefly', fall: 'leaf', winter: 'snow' };
  const COLORS = {
    petal: ['#f7b6cf', '#f9cfe0', '#ee93b6', '#fde4ee'],
    leaf: ['#d9622b', '#e8a33d', '#c2412d', '#f2c14e', '#b5562a'],
  };
  // Particles per 100k px² of sky
  const DENSITY = { snow: 9, petal: 1.6, leaf: 1.3, firefly: 1.4 };
  const CLEAR_FADE = 28; // px around text over which particles fade out

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function create({ below = null, surfaces = null, clear = null, breeze = false, density = 1, seasonOf }) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    seasonOf ??= () => document.documentElement.dataset.season;

    const canvas = document.createElement('canvas');
    canvas.className = 'weather-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let w = 0, h = 0, particles = [], rested = [], piles = new Map();
    const mouse = { x: -999, y: -999, vx: 0, vy: 0, t: 0 };

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // Without an explicit CSS size the canvas renders at device pixels (2x on Retina)
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(kind, top, anywhere) {
      const z = Math.random();
      const p = {
        kind, z, x: rand(-20, w + 20), y: anywhere ? rand(top, h) : top - 12,
        vx: 0, vy: 0, kx: 0, ky: 0, rot: rand(0, 6.28), vrot: rand(-1.5, 1.5),
        flip: rand(0, 6.28), vflip: rand(1.5, 4), phase: rand(0, 6.28), alpha: 0,
      };
      if (kind === 'snow') Object.assign(p, { r: 0.6 + z * 2, vy: 18 + z * 40, a: 0.2 + z * 0.55 });
      if (kind === 'petal') Object.assign(p, { s: rand(1.4, 2), vy: rand(22, 40), vx: rand(15, 45), a: rand(0.6, 0.9), color: pick(COLORS.petal) });
      if (kind === 'leaf') Object.assign(p, { s: rand(1.5, 2.3), vy: rand(35, 65), vx: rand(-10, 25), a: rand(0.7, 0.9), color: pick(COLORS.leaf) });
      if (kind === 'firefly') Object.assign(p, { y: rand(top, h), a: 0.9, vx: rand(-12, 12), vy: rand(-8, 8), blink: rand(2, 5) });
      particles.push(p);
    }

    function land(p, el, rect) {
      if (p.kind === 'snow') {
        const pile = piles.get(el) || piles.set(el, new Float32Array(Math.ceil(rect.width / 4) + 1)).get(el);
        const i = Math.round((p.x - rect.left) / 4);
        for (let k = -2; k <= 2; k++) {
          if (pile[i + k] !== undefined) pile[i + k] = Math.min(10, pile[i + k] + p.r * 0.9 * (1 - Math.abs(k) * 0.3));
        }
      } else if (rested.filter(r => r.el === el).length < 14) {
        rested.push({ el, rx: p.x - rect.left, kind: p.kind, s: p.s, color: p.color, rot: rand(-0.3, 0.3) + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1), a: p.a, age: 0, life: rand(14, 24) });
      }
    }

    function draw(p, x, y, alpha) {
      ctx.globalAlpha = alpha;
      if (p.kind === 'snow') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'firefly') {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, 'rgba(234, 255, 156, 1)');
        g.addColorStop(0.25, 'rgba(214, 255, 120, 0.55)');
        g.addColorStop(1, 'rgba(214, 255, 120, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 9, y - 9, 18, 18);
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        // Tumbling: squash one axis to fake the leaf turning over
        ctx.scale(p.s, p.s * (p.flatten ?? Math.max(0.2, Math.abs(Math.cos(p.flip)))));
        ctx.fillStyle = p.color;
        ctx.fill(p.kind === 'leaf' ? LEAF : PETAL);
        ctx.restore();
      }
    }

    let last = performance.now(), raf, t = 0, filled = false;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) return;
      t += dt;

      const kind = KIND[seasonOf()] || 'snow';
      const top = below ? Math.max(0, below.getBoundingClientRect().bottom) : 0;
      const area = w * Math.max(0, h - top);
      const target = Math.round((area / 1e5) * DENSITY[kind] * density);
      const live = particles.filter(p => p.kind === kind && !p.leaving).length;
      // Fill the sky at once on first sight, then top up gradually from above
      if (!filled && area > 0) {
        for (let i = live; i < target; i++) spawn(kind, top, true);
        filled = true;
      } else if (live < target && Math.random() < 0.5) {
        spawn(kind, top, kind === 'firefly');
      }

      // Cursor breeze decays quickly
      mouse.vx *= 0.9;
      mouse.vy *= 0.9;

      const rects = surfaces ? [...document.querySelectorAll(surfaces)].map(el => ({ el, r: el.getBoundingClientRect() })) : [];
      const clearRects = clear ? [...document.querySelectorAll(clear)].map(el => el.getBoundingClientRect()).filter(r => r.bottom > 0 && r.top < h) : [];
      // Particles fade out as they near text, fully gone inside it
      const clearance = (x, y) => {
        let f = 1;
        for (const r of clearRects) {
          const dx = Math.max(r.left - x, 0, x - r.right);
          const dy = Math.max(r.top - y, 0, y - r.bottom);
          f = Math.min(f, Math.hypot(dx, dy) / CLEAR_FADE);
        }
        return f;
      };

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, top, w, h - top);
      ctx.clip();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // Another season took over: fade out
        if (p.kind !== kind) p.leaving = true;
        p.alpha = Math.min(p.a, p.alpha + dt * (p.leaving ? -0.8 : 1.5));
        if (p.leaving && p.alpha <= 0) { particles.splice(i, 1); continue; }

        if (breeze) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const f = 1 - Math.sqrt(d2) / 140;
            p.kx += (mouse.vx * 0.5 + (dx / 140) * 120) * f * dt * 4;
            p.ky += (mouse.vy * 0.5 + (dy / 140) * 120) * f * dt * 4;
            p.vrot += f * dt * 6;
          }
          p.kx *= 0.96;
          p.ky *= 0.96;
        }

        const prevY = p.y;
        if (p.kind === 'firefly') {
          p.vx += rand(-20, 20) * dt;
          p.vy += rand(-20, 20) * dt;
          p.vx *= 0.99; p.vy *= 0.99;
          p.x += (p.vx + p.kx) * dt;
          p.y += (p.vy + p.ky) * dt;
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          if (p.y < top) p.vy = Math.abs(p.vy); if (p.y > h) p.vy = -Math.abs(p.vy);
          const blink = 0.5 + 0.5 * Math.sin((t / p.blink) * Math.PI * 2 + p.phase);
          draw(p, p.x, p.y, p.alpha * blink * blink * clearance(p.x, p.y));
          continue;
        }

        const sway = p.kind === 'snow' ? Math.sin(t * 0.9 + p.phase) * (4 + p.z * 12) : Math.sin(t * 1.4 + p.phase) * 22;
        p.x += (p.vx + p.kx + sway * 0.6) * dt;
        p.y += (p.vy + p.ky) * dt;
        p.rot += p.vrot * dt;
        p.flip += p.vflip * dt;

        // Landing on the top edge of a surface
        let landed = false;
        for (const { el, r } of rects) {
          if (prevY < r.top && p.y >= r.top && p.x > r.left + 4 && p.x < r.right - 4 && r.top > top && r.top < h) {
            land(p, el, r);
            landed = true;
            break;
          }
        }

        if (landed || p.y > h + 20 || p.x > w + 40 || p.x < -40) {
          particles.splice(i, 1);
          continue;
        }
        draw(p, p.x, p.y, p.alpha * clearance(p.x, p.y));
      }
      ctx.restore();

      // Snow piled on surfaces (melts outside winter)
      ctx.fillStyle = '#f4f9ff';
      for (const { el, r } of rects) {
        const pile = piles.get(el);
        if (!pile) continue;
        if (kind !== 'snow') for (let i = 0; i < pile.length; i++) pile[i] = Math.max(0, pile[i] - dt * 0.6);
        if (r.bottom < 0 || r.top > h) continue;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(r.left + 2, r.top + 1);
        for (let i = 0; i < pile.length; i++) {
          // Soften the drift so it reads as one mound, not a row of bumps
          let soft = 0;
          for (let k = -3; k <= 3; k++) soft += (pile[i + k] ?? pile[i]) * (4 - Math.abs(k));
          soft /= 16;
          // Taper into the card's rounded corners
          const hgt = soft * Math.min(1, i / 3, (pile.length - 1 - i) / 3);
          ctx.lineTo(Math.min(r.right - 2, r.left + i * 4), r.top + 1 - hgt);
        }
        ctx.lineTo(r.right - 2, r.top + 1);
        ctx.closePath();
        ctx.fill();
      }

      // Leaves and petals resting on surfaces; the cursor can blow them off again
      for (let i = rested.length - 1; i >= 0; i--) {
        const rp = rested[i];
        const r = rects.find(s => s.el === rp.el)?.r;
        rp.age += dt;
        const fade = Math.min(1, (rp.life - rp.age) / 2);
        if (!r || fade <= 0) { rested.splice(i, 1); continue; }
        const x = r.left + rp.rx, y = r.top - 3 * rp.s; // lying on its side, just above the edge
        if (breeze && Math.hypot(x - mouse.x, y - mouse.y) < 60 && Math.hypot(mouse.vx, mouse.vy) > 150) {
          rested.splice(i, 1);
          particles.push({
            kind: rp.kind, x, y: y - 4, s: rp.s, color: rp.color, a: rp.a, alpha: rp.a, z: 1,
            vx: rand(-10, 25), vy: rand(30, 60), kx: mouse.vx * 0.6, ky: Math.min(-80, mouse.vy * 0.4 - 120),
            rot: rp.rot, vrot: rand(-6, 6), flip: 0, vflip: rand(2, 5), phase: rand(0, 6.28),
          });
          continue;
        }
        if (y < -10 || y > h + 10) continue;
        draw({ ...rp, flatten: 0.85 }, x, y, rp.a * fade);
      }
      ctx.globalAlpha = 1;
    }

    const onMove = e => {
      const now = performance.now();
      const dt = Math.max(1, now - mouse.t) / 1000;
      if (mouse.t) {
        mouse.vx = mouse.vx * 0.5 + ((e.clientX - mouse.x) / dt) * 0.5;
        mouse.vy = mouse.vy * 0.5 + ((e.clientY - mouse.y) / dt) * 0.5;
      }
      Object.assign(mouse, { x: e.clientX, y: e.clientY, t: now });
    };

    resize();
    addEventListener('resize', resize);
    if (breeze) addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(frame);
  }

  create({
    below: document.getElementById('home'),
    surfaces: '.exp-card, .about-image img',
    clear: '.about-text, .section-title, .footer-content',
    breeze: true,
    density: 0.9,
  });
})();
