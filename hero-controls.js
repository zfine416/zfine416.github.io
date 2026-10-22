// "Time & season" button in the hero: lets visitors scrub the sky and switch seasons.
// Choices last for this visit only; a reload goes back to the real date and time.
(() => {
  const home = document.getElementById('home');
  if (!home || !window.Sky || !window.Seasons) return;

  const SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const PART_NAMES = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' };

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sky-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'sky-panel');
  toggle.innerHTML = `<span class="sky-toggle-icon">${SUN_ICON}</span>Time &amp; season`;

  const panel = document.createElement('div');
  panel.className = 'sky-panel';
  panel.id = 'sky-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Time and season');
  panel.innerHTML = `
    <div class="sky-panel-label"><label for="sky-time">Time of day</label><output id="sky-time-label"></output></div>
    <input type="range" id="sky-time" min="0" max="1439" step="1">
    <div class="sky-panel-hours"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span></div>
    <div class="sky-panel-label"><span>Season</span></div>
    <div class="sky-seasons" role="group" aria-label="Season">
      <button type="button" data-season="spring">Spring</button>
      <button type="button" data-season="summer">Summer</button>
      <button type="button" data-season="fall">Fall</button>
      <button type="button" data-season="winter">Winter</button>
    </div>
    <button type="button" class="sky-reset">Back to now</button>`;

  home.append(panel, toggle);

  const slider = panel.querySelector('#sky-time');
  const timeLabel = panel.querySelector('#sky-time-label');
  const seasonButtons = panel.querySelectorAll('[data-season]');
  const reset = panel.querySelector('.sky-reset');
  const icon = toggle.querySelector('.sky-toggle-icon');
  let seasonChosen = false;

  const fmt = date => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  function syncSeason() {
    const current = document.documentElement.dataset.season;
    seasonButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.season === current));
  }

  // Keep the controls in step with the sky, including the live clock ticking over
  document.addEventListener('skychange', ({ detail }) => {
    const text = `${fmt(detail.time)} · ${PART_NAMES[detail.part]}`;
    timeLabel.textContent = text;
    slider.setAttribute('aria-valuetext', text);
    slider.value = detail.time.getHours() * 60 + detail.time.getMinutes();
    icon.innerHTML = detail.part === 'night' ? MOON_ICON : SUN_ICON;
    reset.disabled = detail.live && !seasonChosen;
  });

  slider.addEventListener('input', () => {
    const d = new Date();
    d.setHours(0, Number(slider.value), 0, 0);
    Sky.setTime(d);
  });

  seasonButtons.forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    seasonChosen = true;
    Seasons.set(b.dataset.season);
    syncSeason();
    reset.disabled = false;
  }));

  reset.addEventListener('click', () => {
    seasonChosen = false;
    Seasons.set(null);
    syncSeason();
    Sky.setTime(null);
  });

  function open(state) {
    panel.hidden = !state;
    toggle.setAttribute('aria-expanded', state);
    if (state) slider.focus();
  }

  toggle.addEventListener('click', () => open(panel.hidden));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) {
      open(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) open(false);
  });

  syncSeason();
  Sky.refresh();
})();
