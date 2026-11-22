// The same scroll coordinates drive the paper, its grain and the two ink colours.
const clamp = value => Math.max(0, Math.min(1, value));

export function bindHomeMotion(page) {
  const hero = page.querySelector('.showreel');
  const statement = page.querySelector('.statement');
  const copy = statement.querySelector('.statement-copy');
  const water = Array.from(page.querySelectorAll('[data-water-section]'), section => ({
    section, texts: Array.from(section.querySelectorAll('[data-water-text]'))
  }));
  const fills = Array.from(page.querySelectorAll('[data-water-fill]'));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const movingText = new Set();
  let frame = 0;
  let active = true;

  function set(element, name, value) {
    const string = String(value);
    if (element.style.getPropertyValue(name) !== string) element.style.setProperty(name, string);
  }

  function render() {
    frame = 0;
    // The existing hero is exactly 100svh. It also provides a stable reference
    // when a phone's browser bars collapse, and resizes naturally on rotation.
    const height = hero.getBoundingClientRect().height || window.innerHeight;
    const rect = statement.getBoundingClientRect();
    const copyTop = copy.getBoundingClientRect().top;
    const sections = water.map(({section, texts}) => ({section, rect: section.getBoundingClientRect(),
      texts: texts.map(el => ({el, rect: el.getBoundingClientRect()}))}));
    const signs = fills.map(el => ({el, rect: el.getBoundingClientRect()}));
    // Original desktop start, distance and linear response, in either direction.
    const progress = clamp((height * 0.8 - 200 - rect.top) / Math.min(480, height * 0.65));
    set(page, '--transition-progress', progress);
    set(statement, '--statement-paint', clamp((progress - 0.55) / 0.4));
    set(statement, '--wipe-text', `${rect.top + progress * rect.height - copyTop}px`);
    const filled = String(progress >= 0.995);
    if (statement.dataset.filled !== filled) statement.dataset.filled = filled;

    for (const {section, rect, texts} of sections) {
      const sweep = motion.matches ? 0.5 : clamp((height - rect.top) / (height + rect.height));
      const size = Math.max(630, rect.width * 1.02);
      const travel = clamp(sweep / 0.62);
      const x = -size + travel * (rect.width + size);
      const y = (rect.height - size * 1635 / 1937) / 2 + Math.sin(travel * 2 * Math.PI) * rect.height * 0.22;
      const wipe = section.hasAttribute('data-wipe-up') && !motion.matches
        ? clamp((height * 0.8 - Math.min(280, height * 0.3) - rect.top) / (rect.height * 0.5)) : 0;
      set(section, '--wipe-progress', wipe);
      const edge = rect.bottom - rect.height * wipe;
      for (const {el, rect: text} of texts) {
        set(el, '--wipe-at', `${edge - text.top}px`);
        set(el, '--water-size', `${size}px`);
        set(el, '--water-x', `${x - text.left + rect.left}px`);
        set(el, '--water-y', `${y - text.top + rect.top}px`);
      }
    }
    for (const {el, rect} of signs) {
      const progress = motion.matches ? 1 : clamp((height * 0.9 - rect.top) / (height * 0.4));
      const burst = clamp((progress - 0.6) / 0.4);
      set(el, '--water-fill', clamp(progress / 0.6));
      set(el, '--water-burst', burst);
      set(el, '--water-burst-scale', burst <= 0 ? 0 : 1 + 2.4 * (burst - 1) ** 3 + 1.4 * (burst - 1) ** 2);
    }
    if (movingText.size) schedule();
  }
  function schedule() {
    if (active && !frame) frame = requestAnimationFrame(render);
  }
  function textTransition(event) {
    if (event.propertyName !== 'transform' || !event.target.matches('.intro .reveal')) return;
    if (event.type === 'transitionrun') movingText.add(event.target);
    else movingText.delete(event.target);
    schedule();
  }
  const resize = new ResizeObserver(schedule);
  [hero, statement, copy, ...water.map(item => item.section)].forEach(el => resize.observe(el));
  const events = ['transitionrun', 'transitionend', 'transitioncancel'];
  events.forEach(type => page.addEventListener(type, textTransition));
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  render();
  return () => {
    active = false;
    cancelAnimationFrame(frame);
    resize.disconnect();
    events.forEach(type => page.removeEventListener(type, textTransition));
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('visibilitychange', schedule);
    motion.removeEventListener('change', schedule);
  };
}
