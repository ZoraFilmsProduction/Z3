// Keep the native video in its original layout box. The cover stays over it
// until there is moving footage, and can play independently of a native decoder.
export function bindFilmLoop(video, src, fallback, hero) {
  const cover = video.nextElementSibling;
  const poster = video.getAttribute('poster');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let near = false, active = false, fallbackActive = false;
  let generation = 0, heartbeat = 0, releaseTimer = 0, frame = null;
  let lastStamp = null, lastAdvance = 0, resumeAt = 0, rewound = false;

  function show(state) {
    if (video.dataset.playback === state) return;
    if (state === 'fallback') cover.src = fallback;
    if (state === 'poster' && cover.getAttribute('src') !== poster) cover.src = poster;
    video.dataset.playback = state;
  }
  function stopWatching() {
    clearTimeout(heartbeat);
    if (frame !== null) video.cancelVideoFrameCallback(frame);
    frame = null;
  }
  function releaseSource() {
    if (!video.hasAttribute('src')) return;
    resumeAt = video.currentTime || 0;
    video.removeAttribute('src');
    video.load();
  }
  function useFallback() {
    if (!active || fallbackActive) return;
    fallbackActive = true;
    generation++;
    stopWatching();
    show('fallback');
    // The browser cannot draw native player chrome or hold a decoder slot
    // for this clip while the independently animated cover is on screen.
    releaseSource();
  }
  function observeTime(time) {
    if (!active || fallbackActive || video.paused || video.seeking || !Number.isFinite(time)) return;
    if (lastStamp !== null && Math.abs(time - lastStamp) < 0.019) return;
    if (lastStamp !== null) {
      lastAdvance = performance.now();
      if (time > 0.1 && time < video.duration - 0.1) rewound = false;
      show('playing');
    }
    lastStamp = time;
  }
  function sample() {
    if (!active || fallbackActive) return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      if (frame !== null) return;
      frame = video.requestVideoFrameCallback((_, info) => {
        frame = null;
        observeTime(info.mediaTime);
      });
    } else if (video.readyState >= 2) observeTime(video.currentTime);
  }
  function play() {
    const attempt = generation;
    video.play().catch(() => { if (attempt === generation) useFallback(); });
  }
  function rewind() {
    if (!active || fallbackActive || rewound) return;
    rewound = true;
    lastAdvance = performance.now();
    video.currentTime = 0;
    play();
  }
  function monitor() {
    if (!active || fallbackActive) return;
    sample();
    const timeout = video.dataset.playback === 'playing' ? 1350 : 3500;
    if (performance.now() - lastAdvance > timeout) {
      if (!rewound && Number.isFinite(video.duration) && video.currentTime >= video.duration - 0.06) rewind();
      else { useFallback(); return; }
    }
    // Independent of waiting, seeking and stalled events. A decoder emitting
    // repeat events without presenting new frames still reaches the fallback.
    heartbeat = setTimeout(monitor, 350);
  }
  function metadata() {
    if (active && resumeAt > 0 && resumeAt < video.duration - 0.1) video.currentTime = resumeAt;
    resumeAt = 0;
  }
  function sync() {
    const next = near && !document.hidden && (hero || !reduced.matches);
    if (next === active) return;
    active = next;
    generation++;
    fallbackActive = false;
    clearTimeout(releaseTimer);
    stopWatching();
    if (!active) {
      video.pause();
      show('poster');
      releaseTimer = setTimeout(releaseSource, 2200);
      return;
    }
    rewound = false;
    lastStamp = null;
    lastAdvance = performance.now();
    if (!video.hasAttribute('src')) { video.preload = 'auto'; video.src = src; }
    play();
    monitor();
  }
  function restore() {
    sync();
    if (active && !fallbackActive && video.paused) play();
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.controls = false;
  const events = {loadedmetadata: metadata, timeupdate: sample, playing: sample, ended: rewind, error: useFallback};
  Object.entries(events).forEach(([type, fn]) => video.addEventListener(type, fn));
  const observer = new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
    sync();
  }, {rootMargin: hero ? '0px' : '160px 0px'});
  observer.observe(video);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', restore);
  window.addEventListener('pageshow', restore);
  return () => {
    active = false;
    generation++;
    stopWatching();
    clearTimeout(releaseTimer);
    observer.disconnect();
    Object.entries(events).forEach(([type, fn]) => video.removeEventListener(type, fn));
    reduced.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', restore);
    window.removeEventListener('pageshow', restore);
    video.pause();
    releaseSource();
  };
}
