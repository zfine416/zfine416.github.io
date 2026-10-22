// Time-of-day sky: the sun arcs across the hero from sunrise to sunset, then the moon
// (in its real phase) and stars take over. Uses the visitor's clock, or ?time=HH:MM.
(() => {
  const home = document.getElementById('home');
  if (!home) return;

  const LAT = 40.7; // New York; good enough without asking for location
  const rad = d => d * Math.PI / 180;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Sunrise/sunset in local clock hours (NOAA approximation)
  function sunTimes(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const day = Math.floor((date - start) / 864e5);
    const decl = 23.44 * Math.sin(rad((360 / 365) * (day - 81)));
    const b = rad((360 / 364) * (day - 81));
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
    // Treat the timezone's standard meridian as the longitude; add DST if in effect
    const y = date.getFullYear();
    const stdOffset = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
    const dst = (stdOffset - date.getTimezoneOffset()) / 60;
    const noon = 12 + dst - eot / 60;
    const cosH = (Math.sin(rad(-0.833)) - Math.sin(rad(LAT)) * Math.sin(rad(decl))) / (Math.cos(rad(LAT)) * Math.cos(rad(decl)));
    const half = Math.acos(clamp(cosH, -1, 1)) * 180 / Math.PI / 15;
    return { rise: noon - half, set: noon + half, peak: (90 - LAT + decl) / 90 };
  }

  // 0 = new moon, 0.5 = full
  function moonPhase(date) {
    const synodic = 29.530588853;
    const days = (date - Date.UTC(2000, 0, 6, 18, 14)) / 864e5;
    return ((days / synodic) % 1 + 1) % 1;
  }

  function moonSVG(phase) {
    const r = 20;
    const k = Math.abs(Math.cos(2 * Math.PI * phase)) * r;
    const waxing = phase < 0.5;
    const crescent = phase < 0.25 || phase > 0.75;
    const outer = waxing ? 1 : 0;
    const inner = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
    return `<svg viewBox="-22 -22 44 44" class="moon" aria-hidden="true">
      <circle r="${r}" fill="#c9d4e6" opacity="0.12"/>
      <path d="M0 ${-r} A${r} ${r} 0 0 ${outer} 0 ${r} A${k.toFixed(2)} ${r} 0 0 ${inner} 0 ${-r}Z" fill="#eef3fb"/>
    </svg>`;
  }

  // Sky layer goes first so the tree, weather and text all sit on top of it
  const sky = document.createElement('div');
  sky.className = 'sky';
  sky.setAttribute('aria-hidden', 'true');
  sky.innerHTML = '<div class="sky-glow"></div><div class="stars"></div><div class="sun"></div><div class="moon-wrap"></div>';
  home.prepend(sky);
  const sun = sky.querySelector('.sun');
  const moonWrap = sky.querySelector('.moon-wrap');

  const stars = sky.querySelector('.stars');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    Object.assign(s.style, { left: `${Math.random() * 100}%`, top: `${Math.pow(Math.random(), 1.4) * 70}%` });
    s.style.setProperty('--s', `${(Math.random() * 1.6 + 0.6).toFixed(1)}px`);
    s.style.setProperty('--o', (Math.random() * 0.6 + 0.3).toFixed(2));
    s.style.setProperty('--tw', `${(Math.random() * 3 + 2).toFixed(1)}s`);
    s.style.setProperty('--dl', `${(Math.random() * 4).toFixed(1)}s`);
    stars.appendChild(s);
  }

  // Position along an arc: x across the hero, y up from the horizon
  // On narrow screens the text fills the width, so the sky shrinks to the band above it
  const narrow = () => home.clientWidth < 700;
  const horizon = () => (narrow() ? 19 : 88);
  const arc = (p, height) => ({
    x: lerp(6, 94, p),
    y: lerp(horizon(), narrow() ? 7 : 12, Math.sin(Math.PI * clamp(p)) * height),
  });

  let override = null;
  let lastPhaseDay = null;

  function render() {
    const now = override || new Date();
    const h = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    const { rise, set, peak } = sunTimes(now);

    // Elevation proxy: + during the day, - at night, 0 at sunrise/sunset
    let elevation, sunP, moonP;
    if (h >= rise && h <= set) {
      sunP = (h - rise) / (set - rise);
      elevation = Math.sin(Math.PI * sunP) * peak;
    } else {
      const nightLen = 24 - (set - rise);
      const sinceSet = ((h - set) % 24 + 24) % 24;
      moonP = sinceSet / nightLen;
      sunP = h < rise ? -(rise - h) / (set - rise) : 1 + (h - set) / (set - rise);
      elevation = -Math.sin(Math.PI * moonP) * 0.6;
    }

    const day = clamp(elevation / 0.35);
    const twilight = clamp(1 - Math.abs(elevation) / 0.22);
    const night = clamp(-elevation / 0.12);
    // Noon clears the hero text: winter's low sun peaks a little lower than summer's
    const pos = arc(sunP, lerp(0.86, 1, clamp((peak - 0.28) / 0.53)));
    const below = sunP < 0 || sunP > 1;
    // Below the horizon the sun keeps sinking out of view (on phones it fades instead)
    if (below) pos.y = horizon() + Math.min(Math.abs(sunP < 0 ? sunP : sunP - 1), 0.2) * 200;

    // White-gold overhead, deep orange near the horizon
    const warm = clamp(elevation / 0.4);
    const color = `rgb(${Math.round(lerp(255, 255, warm))}, ${Math.round(lerp(122, 243, warm))}, ${Math.round(lerp(61, 196, warm))})`;

    const vars = {
      '--sun-x': `${pos.x}%`,
      '--sun-y': `${pos.y}%`,
      '--sun-color': color,
      '--sun-size': `${Math.round(lerp(70, 50, warm))}px`,
      '--day': day.toFixed(3),
      '--twilight': twilight.toFixed(3),
      '--night': night.toFixed(3),
      '--sun-visible': below && narrow() ? 0 : 1,
    };
    for (const [k, v] of Object.entries(vars)) sky.style.setProperty(k, v);

    const dayKey = now.toDateString();
    if (dayKey !== lastPhaseDay) {
      moonWrap.innerHTML = moonSVG(moonPhase(now));
      lastPhaseDay = dayKey;
    }
    const moonPos = arc(moonP ?? 0, 0.95);
    Object.assign(moonWrap.firstElementChild.style, { left: `${moonPos.x}%`, top: `${moonPos.y}%` });

    const part = night > 0.5 ? 'night' : twilight > 0.5 ? (h < 12 ? 'dawn' : 'dusk') : 'day';
    document.documentElement.dataset.daypart = part;
    const info = { part, rise, set, time: now, live: !override };
    document.dispatchEvent(new CustomEvent('skychange', { detail: info }));
    return info;
  }

  // Override with a Date, or null to follow the real clock
  function setTime(date) {
    override = date;
    return render();
  }

  const param = new URLSearchParams(location.search).get('time');
  if (param && /^\d{1,2}:\d{2}$/.test(param)) {
    const [hh, mm] = param.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    override = d;
  }

  render();
  addEventListener('resize', render);
  setInterval(() => { if (!override && !document.hidden) render(); }, 30000);
  window.Sky = { setTime, refresh: render, sunTimes, moonPhase };
})();
