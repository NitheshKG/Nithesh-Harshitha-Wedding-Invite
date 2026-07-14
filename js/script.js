/**
 * ================================================================
 * WEDDING INVITATION — Nithesh & Harshitha
 * js/script.js
 *
 * TABLE OF CONTENTS
 *  1.  CONFIG  ─── edit wedding date here
 *  2.  Petal class            (bezier-curve canvas petal)
 *  3.  PetalCanvas class      (manages multiple petals, RAF loop)
 *  4.  initHeroAnimation()    (GSAP letter stagger + reveal timeline)
 *  5.  startCountdown()       (live countdown to wedding date)
 *  6.  initHeroPetals()       (start hero canvas; pause off-screen)
 *  7.  initScrollProgress()   (thin bar tracks page + events scroll)
 *  8.  initEventSections()    (IntersectionObserver + GSAP per event)
 *  9.  updateDots()           (sync active dot state)
 * 10.  initScrollReveal()     (CSS reveal for Story section)
 * 11.  initStoryDeck()        (swipeable love-story photo deck + lightbox)
 * 12.  initMusicToggle()      (play/pause audio on button click)
 * 13.  DOMContentLoaded       (boots everything)
 * ================================================================
 */

/* ================================================================
   0. COVER PAGE
   Full-screen invitation cover shown before the main content.
   Clicking / tapping anywhere (or pressing Enter/Space on the
   open button) triggers a split-panel reveal that slides the top
   half up and the bottom half down, exposing the hero behind.
   ================================================================ */
function initCoverPage() {
  var cover = document.getElementById('cover-page');
  if (!cover) return;

  // Prevent page from scrolling or snapping while cover is visible
  document.documentElement.classList.add('cover-active');

  // Kick off floating petals on the cover canvas
  var coverCanvas = document.getElementById('cover-petal-canvas');
  var coverPetals = null;
  if (coverCanvas) {
    var coverPetalCount = isLowEndDevice() ? 10 : 20;
    coverPetals = new PetalCanvas(coverCanvas, coverPetalCount);
    coverPetals.start();
  }

  var dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;

    // Kick off the split-panel animation
    cover.classList.add('cover--closing');

    // After the longest transition (panels: ~0.92 s), clean up
    setTimeout(function() {
      cover.remove();
      if (coverPetals) coverPetals.destroy();
      document.documentElement.classList.remove('cover-active');
    }, 980);
  }

  // Click anywhere on the cover to open
  cover.addEventListener('click', dismiss);

  // Keyboard: Enter or Space on the button, Escape anywhere
  cover.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      dismiss();
    }
  });

  // Focus the open button for keyboard users
  var openBtn = document.getElementById('cover-open');
  if (openBtn) openBtn.focus({ preventScroll: true });
}

/* ================================================================
   1. CONFIG — EDIT THIS SECTION
   ================================================================ */

/**
 * Detect low-end / mobile devices to reduce animation cost.
 * Returns true on narrow screens or very low-CPU devices.
 */
function isLowEndDevice() {
  var mobile = window.innerWidth < 768;
  var lowCPU = (navigator.hardwareConcurrency || 4) <= 2;
  var lowRAM = typeof navigator.deviceMemory !== 'undefined' && navigator.deviceMemory < 2;
  return mobile || lowCPU || lowRAM;
}

/**
 * Safe scrollIntoView wrapper — old Android Chrome ignores the options
 * object so we catch the error and fall back to plain scrollIntoView().
 */
function smoothScrollTo(el) {
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    el.scrollIntoView(true);
  }
}

const CONFIG = {
  /**
   * EDIT: Set the wedding date and time.
   * Using explicit IST offset (+05:30) so the countdown is correct
   * regardless of the timezone of the device opening the page.
   */
  weddingDate: new Date('2026-08-29T09:00:00+05:30'),

  /** Number of floating petals on the hero canvas.
   *  Automatically halved on mobile/low-end devices. */
  heroPetalCount: isLowEndDevice() ? 12 : 28,

  /** Number of floating petals inside each event section */
  eventPetalCount: isLowEndDevice() ? 5 : 10,

  /**
   * Petal colours — blush/rose/peach family.
   * Edit rgba values to change tone; the alpha controls translucency.
   */
  petalColors: [
    'rgba(248, 200, 220, 0.72)',  // blush
    'rgba(244, 166, 183, 0.65)',  // rose
    'rgba(255, 218, 185, 0.60)',  // peach
    'rgba(217, 108, 126, 0.52)',  // rose-mid
    'rgba(245, 203, 167, 0.58)',  // peach-mid
    'rgba(252, 220, 232, 0.50)',  // blush soft
  ],
};

/* ================================================================
   2. PETAL CLASS
   A single canvas-drawn petal with drifting, swaying motion.
   ================================================================ */
class Petal {
  /**
   * @param {HTMLCanvasElement} canvas — the canvas this petal lives on
   * @param {boolean} initialise — if true, place petal at random Y
   *                               (so the canvas fills immediately)
   */
  constructor(canvas, initialise = false) {
    this.canvas = canvas;
    this.reset(initialise);
  }

  /** Reset petal to a new random state, ready to drift from the top. */
  reset(initialise = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.x             = Math.random() * w;
    this.y             = initialise ? Math.random() * h : -20;
    this.size          = 6 + Math.random() * 11;
    this.speedY        = 0.35 + Math.random() * 0.75;
    this.speedX        = (Math.random() - 0.5) * 0.5;
    this.rotation      = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.028;
    this.swayAmplitude = 14 + Math.random() * 18;
    this.swayFreq      = 0.008 + Math.random() * 0.018;
    this.swayOffset    = Math.random() * Math.PI * 2;
    this.opacity       = 0.38 + Math.random() * 0.52;
    this.color         = CONFIG.petalColors[
      Math.floor(Math.random() * CONFIG.petalColors.length)
    ];
    this.tick = 0;
  }

  update() {
    this.tick++;
    this.y         += this.speedY;
    this.x         += this.speedX
                    + Math.sin(this.tick * this.swayFreq + this.swayOffset) * 0.35;
    this.rotation  += this.rotationSpeed;

    // Recycle when it drifts off any edge
    if (
      this.y > this.canvas.height + 25 ||
      this.x < -35 ||
      this.x > this.canvas.width + 35
    ) {
      this.reset(false);
    }
  }

  /** Draw a classic petal shape using two mirrored bezier curves. */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle   = this.color;

    ctx.beginPath();
    // Right side of petal
    ctx.moveTo(0, -this.size);
    ctx.bezierCurveTo(
      this.size * 0.85, -this.size * 0.75,
      this.size,         this.size * 0.28,
      0,                 this.size
    );
    // Left side of petal (mirror)
    ctx.bezierCurveTo(
      -this.size,        this.size * 0.28,
      -this.size * 0.85, -this.size * 0.75,
      0,                 -this.size
    );
    ctx.fill();
    ctx.restore();
  }
}

/* ================================================================
   3. PETAL CANVAS CLASS
   Manages a pool of Petal objects on a given <canvas> element.
   ================================================================ */
class PetalCanvas {
  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {number} count — number of petals to create
   */
  constructor(canvasEl, count) {
    this.canvas  = canvasEl;
    this.ctx     = canvasEl.getContext('2d');
    this.count   = count;
    this.petals  = [];
    this.rafId   = null;
    this.running = false;

    this._resize = this._onResize.bind(this);
    window.addEventListener('resize', this._resize, { passive: true });

    this._setSize();
    this._createPetals();
  }

  _setSize() {
    // Use getBoundingClientRect for accurate dimensions
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = rect.width  || this.canvas.offsetWidth  || window.innerWidth;
    this.canvas.height = rect.height || this.canvas.offsetHeight || window.innerHeight;
  }

  _onResize() {
    this._setSize();
    // Spread existing petals across the new canvas size
    this.petals.forEach(p => {
      p.canvas = this.canvas;
      p.reset(true);
    });
  }

  _createPetals() {
    this.petals = Array.from(
      { length: this.count },
      () => new Petal(this.canvas, true)  // initialise=true for immediate fill
    );
  }

  start() {
    if (this.running) return;
    this.running = true;

    const loop = () => {
      if (!this.running) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.petals.forEach(p => { p.update(); p.draw(this.ctx); });
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // Clear so no ghost frame lingers
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resize);
  }
}

/* ================================================================
   4. HERO ENTRANCE ANIMATION (GSAP)
   Splits names into individual letter <span>s then runs a
   staggered timeline: letters rise in → weds → bride letters →
   divider → tagline → date → countdown → scroll indicator.
   ================================================================ */
function initHeroAnimation() {
  if (typeof gsap === 'undefined') {
    // Fallback: just reveal everything immediately if GSAP failed to load
    document.querySelectorAll(
      '.hero-eyebrow,.hero-weds,.hero-divider,.hero-tagline,' +
      '.hero-date,#countdown,.scroll-indicator,.hero-invite'
    ).forEach(function(el) {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    });
    // Also show name text (they start visible in no-GSAP case)
    return;
  }

  // Signal to CSS that GSAP is available — event-content will be hidden via .gsap-ready
  document.body.classList.add('gsap-ready');

  // ── Split each hero name element into per-letter spans ──
  ['.hero-name--groom', '.hero-name--bride'].forEach(selector => {
    const el = document.querySelector(selector);
    if (!el) return;
    const raw  = el.textContent || '';
    el.innerHTML = raw
      .split('')
      .map(char =>
        `<span class="letter-span" aria-hidden="true">${
          char === ' ' ? '&nbsp;' : char
        }</span>`
      )
      .join('');
    // Restore accessible text on the parent
    el.setAttribute('aria-label', raw);
  });

  // ── Set initial GSAP states BEFORE timeline runs ──
  // NOTE: rotateX intentionally removed — 3D transforms render as invisible
  // zero-height lines on old Android Chrome (< 88) without an explicit
  // parent perspective, causing names to stay permanently hidden.
  gsap.set('.hero-name--groom .letter-span, .hero-name--bride .letter-span', {
    opacity: 0,
    y: 40,
  });
  gsap.set('.hero-weds, .hero-divider, .hero-invite, .hero-tagline, .hero-date, #countdown, .scroll-indicator', {
    opacity: 0,
    y: 22,
  });
  gsap.set('.hero-eyebrow', { opacity: 0, y: 14 });

  // ── Build the reveal timeline ──
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl
    .to('.hero-eyebrow',
      { opacity: 1, y: 0, duration: 0.6 },
      0.25
    )
    .to('.hero-invite',
      { opacity: 1, y: 0, duration: 0.5 },
      '-=0.05'
    )
    .to('.hero-name--groom .letter-span',
      { opacity: 1, y: 0, duration: 0.75, stagger: 0.038 },
      '-=0.1'
    )
    .to('.hero-weds',
      { opacity: 1, y: 0, duration: 0.45 },
      '-=0.25'
    )
    .to('.hero-name--bride .letter-span',
      { opacity: 1, y: 0, duration: 0.75, stagger: 0.038 },
      '-=0.35'
    )
    .to('.hero-divider',
      { opacity: 1, y: 0, duration: 0.55 },
      '-=0.2'
    )
    .to('.hero-tagline',
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.15'
    )
    .to('.hero-date',
      { opacity: 1, y: 0, duration: 0.5 },
      '-=0.25'
    )
    .to('#countdown',
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.15'
    )
    .to('.scroll-indicator',
      { opacity: 1, y: 0, duration: 0.5 },
      '-=0.1'
    );
}

/* ================================================================
   5. COUNTDOWN TIMER
   Updates the four countdown boxes every second.
   ================================================================ */
function startCountdown() {
  const target = CONFIG.weddingDate;

  const els = {
    days:  document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins:  document.getElementById('cd-mins'),
    secs:  document.getElementById('cd-secs'),
  };

  // Safety: if elements don't exist, bail
  if (!els.days) return;

  const pad = n => String(n).padStart(2, '0');

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      // It's the wedding day (or past it)
      els.days.textContent  = '00';
      els.hours.textContent = '00';
      els.mins.textContent  = '00';
      els.secs.textContent  = '00';
      return;
    }

    const totalSecs  = Math.floor(diff / 1000);
    const days       = Math.floor(totalSecs / 86400);
    const hours      = Math.floor((totalSecs % 86400) / 3600);
    const mins       = Math.floor((totalSecs % 3600)  / 60);
    const secs       = totalSecs % 60;

    els.days.textContent  = String(days).padStart(3, '0');
    els.hours.textContent = pad(hours);
    els.mins.textContent  = pad(mins);
    els.secs.textContent  = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
}

/* ================================================================
   6. HERO PETAL CANVAS
   Starts the falling petals and pauses them when the hero section
   is scrolled out of view (IntersectionObserver) for performance.
   ================================================================ */
function initHeroPetals() {
  const canvas = document.getElementById('petal-canvas');
  const hero   = document.getElementById('hero');
  if (!canvas || !hero) return;

  const pc = new PetalCanvas(canvas, CONFIG.heroPetalCount);
  pc.start();

  // Pause when hero is off-screen (saves GPU cycles)
  // IntersectionObserver fallback: just keep running if not supported (no harm)
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function(entries) {
      entries[0].isIntersecting ? pc.start() : pc.stop();
    }, { threshold: 0.05 });
    obs.observe(hero);
  }
}

/* ================================================================
   7. SCROLL PROGRESS BAR
   Tracks window.scrollY — events are now in the page flow so
   a single scroll listener covers everything.
   ================================================================ */
function initScrollProgress() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
}

/* ================================================================
   8. EVENT SECTIONS — IntersectionObserver + GSAP Entrance
   Each of the 4 event sections has its own observer against the
   VIEWPORT (root: null) — no nested scroll container needed now.
   On enter → GSAP animates content in (alternating left/right).
   On exit  → GSAP resets so the animation replays on scroll-back.
   Also manages per-section petal canvases and the dot navigator.
   ================================================================ */
function initEventSections() {
  const sections = document.querySelectorAll('.event');
  const dotsNav  = document.getElementById('event-dots');

  if (!sections.length) return;

  // ── Helper to reveal all event content without animation ──
  function showAllEventContent() {
    sections.forEach(function(section) {
      const content = section.querySelector('.event-content');
      if (content) {
        content.style.opacity   = '1';
        content.style.transform = 'none';
      }
    });
    if (dotsNav) dotsNav.classList.add('visible');
  }

  // ── Dot click: smooth scroll to section ──
  document.querySelectorAll('.dot').forEach(function(dot) {
    dot.addEventListener('click', function() {
      const idx = parseInt(dot.dataset.index, 10);
      if (sections[idx]) smoothScrollTo(sections[idx]);
    });
  });

  // ── Bail out immediately if GSAP or IntersectionObserver not available ──
  if (typeof gsap === 'undefined' || !('IntersectionObserver' in window)) {
    showAllEventContent();
    return;
  }

  // ── Per-event petal canvases (initially stopped) ──
  const petalMap = new Map();

  sections.forEach(section => {
    const canvas = section.querySelector('.event-petal-canvas');
    if (canvas) {
      const pc = new PetalCanvas(canvas, CONFIG.eventPetalCount);
      petalMap.set(section, pc);
    }
  });

  // Track which events are currently in the viewport (for dot nav show/hide)
  const inView = new Set();

  // ── Entrance directions per event index (alternating left / right) ──
  const xFrom = [-65, 65, -65, 65];

  sections.forEach((section, i) => {
    const content = section.querySelector('.event-content');
    if (!content) return;

    // Set initial (hidden) GSAP state before any observer fires
    gsap.set(content, { opacity: 0, x: xFrom[i], y: 18, force3D: true });

    const obs = new IntersectionObserver(([entry]) => {
      const pc = petalMap.get(section);

      if (entry.isIntersecting) {
        // Animate content in + add .visible so CSS map animations trigger
        gsap.to(content, {
          opacity: 1, x: 0, y: 0,
          duration: 0.9, ease: 'power3.out',
          clearProps: 'transform',
        });
        content.classList.add('visible');
        updateDots(i);
        if (pc) pc.start();
        inView.add(i);
        dotsNav.classList.add('visible');

      } else {
        // Reset so the animation replays on next visit
        gsap.killTweensOf(content);
        gsap.set(content, { opacity: 0, x: xFrom[i], y: 18 });
        content.classList.remove('visible');
        if (pc) pc.stop();
        inView.delete(i);
        if (inView.size === 0) dotsNav.classList.remove('visible');
      }
    }, {
      root: null,
      threshold: 0.55,
    });

    obs.observe(section);
  });
}

/* ================================================================
   9. UPDATE DOTS
   Called from the event observer to highlight the current dot.
   ================================================================ */
function updateDots(activeIndex) {
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === activeIndex);
  });
}

/* ================================================================
   10. SCROLL REVEAL
   Adds the .revealed class when an element with .reveal crosses
   the viewport threshold (CSS handles the actual transition).
   Also programmatically adds .reveal to gallery items and the
   Also programmatically adds .reveal to gallery items so they stagger-in on scroll.
   ================================================================ */
function initScrollReveal() {
  // Observe all .reveal elements
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  // Fallback: if IntersectionObserver is not supported, reveal everything immediately
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function(el) { el.classList.add('revealed'); });
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target); // only animate in once
      }
    });
  }, { threshold: 0.14 });

  targets.forEach(el => obs.observe(el));
}

/* ================================================================
   11. STORY DECK
   Swipeable love-story photo deck (9 photos: lf_1.jpg – lf_9.jpg).
   Touch swipe, tap-zone buttons, keyboard ← →, and fullscreen view
   via the existing #lightbox overlay.
   ================================================================ */
function initStoryDeck() {
  var deck      = document.getElementById('story-deck');
  var track     = document.getElementById('story-track');
  var counterEl = document.getElementById('story-counter');
  var prevBtn   = document.getElementById('story-prev');
  var nextBtn   = document.getElementById('story-next');
  var expandBtn = document.getElementById('story-expand');
  var lightbox  = document.getElementById('lightbox');
  var lbContent = document.getElementById('lightbox-content');
  var closeBtn  = document.getElementById('lightbox-close');
  var lbPrevBtn = document.getElementById('lightbox-prev');
  var lbNextBtn = document.getElementById('lightbox-next');

  if (!deck || !track) return;

  var slides   = Array.from(track.querySelectorAll('.story-slide'));
  var segments = Array.from(deck.querySelectorAll('.story-segment'));
  var TOTAL    = slides.length;  // 9
  var current  = 0;
  var isAnimating = false;

  /* ── Autoplay ── */
  var AUTOPLAY_MS = 5000;
  var autoTimer   = null;

  deck.style.setProperty('--autoplay-dur', AUTOPLAY_MS + 'ms');

  function startFill(idx) {
    var seg = segments[idx];
    if (!seg) return;
    seg.classList.remove('filling');
    seg.offsetWidth; // eslint-disable-line no-unused-expressions
    seg.classList.add('filling');
  }

  function clearFill(idx) {
    if (segments[idx]) segments[idx].classList.remove('filling');
  }

  function startAutoplay() {
    clearTimeout(autoTimer);
    clearFill(current);
    if (current >= TOTAL - 1) return;
    startFill(current);
    autoTimer = setTimeout(function() {
      goTo(current + 1, 'next');
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    clearTimeout(autoTimer);
    autoTimer = null;
    clearFill(current);
  }

  /* Touch tracking */
  var touchStartX = 0;
  var touchStartY = 0;
  var lbTouchX    = 0;

  /* ── Update progress bar, counter and button states ── */
  function updateUI() {
    if (counterEl) counterEl.textContent = (current + 1) + ' / ' + TOTAL;
    segments.forEach(function(seg, i) {
      seg.classList.toggle('past',   i < current);
      seg.classList.toggle('active', i === current);
    });
    if (prevBtn) prevBtn.disabled = (current === 0);
    if (nextBtn) nextBtn.disabled = (current === TOTAL - 1);
  }

  /* ── Animate to a slide ── */
  function goTo(index, direction) {
    if (isAnimating || index < 0 || index >= TOTAL || index === current) return;
    isAnimating = true;

    /* Cancel any running autoplay timer and fill animation */
    clearTimeout(autoTimer);
    clearFill(current);

    var outgoing = slides[current];
    var incoming = slides[index];

    /* 1. Snap incoming to its start edge with transitions OFF so no
          accidental animation fires while we position it. */
    incoming.style.transition = 'none';
    incoming.style.opacity    = '0';
    incoming.style.transform  = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';

    /* 2. Force style recalculation to commit the snap position. */
    incoming.offsetWidth; // eslint-disable-line no-unused-expressions

    /* 3. Re-enable transitions, then set the final states for both slides
          in the same batch so the browser fires one transition per element. */
    incoming.style.transition = '';
    incoming.style.opacity    = '1';
    incoming.style.transform  = 'translateX(0)';

    outgoing.style.opacity   = '0';
    outgoing.style.transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';

    /* 4. Keep CSS class in sync for any class-based rules. */
    incoming.classList.add('active');
    outgoing.classList.remove('active');

    current = index;
    updateUI();

    /* 5. After the transition, clear all inline styles so the CSS
          class rules take over cleanly for the next call. */
    setTimeout(function() {
      outgoing.style.opacity   = '';
      outgoing.style.transform = '';
      incoming.style.opacity   = '';
      incoming.style.transform = '';
      isAnimating = false;
      startAutoplay();
    }, 420);
  }

  /* ── Tap-zone button clicks ── */
  if (prevBtn) prevBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    goTo(current - 1, 'prev');
  });
  if (nextBtn) nextBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    goTo(current + 1, 'next');
  });

  /* ── Touch swipe on the deck ── */
  deck.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    /* Only swipe if horizontal movement is dominant and exceeds threshold */
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      goTo(dx < 0 ? current + 1 : current - 1, dx < 0 ? 'next' : 'prev');
    }
  }, { passive: true });

  /* ── Lightbox helpers ── */
  function buildLbImg(index) {
    if (!lbContent) return;
    lbContent.innerHTML = '';
    var slide = slides[index];
    var img   = slide ? slide.querySelector('img') : null;
    if (img) {
      var el = document.createElement('img');
      el.src = img.src;
      el.alt = img.alt || 'Chapter ' + (index + 1);
      lbContent.appendChild(el);
    }
  }

  function openLightbox(index) {
    if (!lightbox) return;
    stopAutoplay();
    current = index;
    buildLbImg(index);
    lightbox.style.display = 'flex';
    lightbox.offsetHeight; /* eslint-disable-line no-unused-expressions */
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    /* Re-sync every slide's .active class to match current.
       The lightbox prev/next buttons change current but don’t touch
       story-deck slide state, so we must reconcile on close. */
    slides.forEach(function(slide, i) {
      slide.classList.toggle('active', i === current);
      /* Also clear any stale inline animation styles. */
      slide.style.opacity   = '';
      slide.style.transform = '';
      slide.style.transition = '';
    });
    deck.focus();
    startAutoplay();
  }

  /* Tap anywhere on deck (not on tap-zones or expand) → open lightbox */
  deck.addEventListener('click', function(e) {
    if (e.target.closest('.story-tap-zone') || e.target.closest('.story-expand')) return;
    openLightbox(current);
  });

  if (expandBtn) expandBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    openLightbox(current);
  });

  /* ── Lightbox controls ── */
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  if (lbPrevBtn) lbPrevBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var n = (current - 1 + TOTAL) % TOTAL;
    current = n; buildLbImg(n); updateUI();
  });
  if (lbNextBtn) lbNextBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var n = (current + 1) % TOTAL;
    current = n; buildLbImg(n); updateUI();
  });

  if (lightbox) {
    /* Close on backdrop click */
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });
    /* Touch swipe inside lightbox */
    lightbox.addEventListener('touchstart', function(e) {
      lbTouchX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function(e) {
      var delta = e.changedTouches[0].clientX - lbTouchX;
      if (Math.abs(delta) > 48) {
        if (delta < 0) { if (lbNextBtn) lbNextBtn.click(); }
        else           { if (lbPrevBtn) lbPrevBtn.click(); }
      }
    }, { passive: true });
  }

  /* ── Keyboard — unified handler for deck nav and lightbox nav ── */
  document.addEventListener('keydown', function(e) {
    var lbOpen = lightbox && lightbox.classList.contains('open');
    if (lbOpen) {
      if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); if (lbPrevBtn) lbPrevBtn.click(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); if (lbNextBtn) lbNextBtn.click(); }
    } else {
      if (e.key === 'ArrowLeft')  goTo(current - 1, 'prev');
      if (e.key === 'ArrowRight') goTo(current + 1, 'next');
    }
  });

  /* ── Start autoplay when deck is in view; pause when scrolled away ── */
  if ('IntersectionObserver' in window) {
    var deckObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          startAutoplay();
        } else {
          stopAutoplay();
        }
      });
    }, { threshold: 0.5 });
    deckObs.observe(deck);
  } else {
    startAutoplay();
  }

  /* ── Initialise ── */
  updateUI();
}

/* ================================================================
   13. MUSIC TOGGLE
   Muted/silent by default (per browser autoplay policies).
   User must tap the button to start. Swap SVG icons on click.
   ================================================================ */
function initMusicToggle() {
  const btn       = document.getElementById('music-toggle');
  const audio     = document.getElementById('bg-music');
  const iconMusic = document.getElementById('icon-music');
  const iconMute  = document.getElementById('icon-mute');

  if (!btn || !audio) return;

  let playing = false;

  function startMusic() {
    audio.play().catch(() => {
      console.info(
        'Music note: no audio file detected. ' +
        'Add an mp3 to assets/ and update the <audio> src in index.html.'
      );
    });
    playing = true;
    iconMusic.style.display = '';
    iconMute.style.display  = 'none';
    btn.setAttribute('aria-label', 'Pause background music');
  }

  function stopMusic() {
    audio.pause();
    playing = false;
    iconMusic.style.display = 'none';
    iconMute.style.display  = '';
    btn.setAttribute('aria-label', 'Play background music');
  }

  /* Attempt autoplay on page load — silently ignored if browser blocks it */
  audio.play().then(() => {
    playing = true;
    iconMusic.style.display = '';
    iconMute.style.display  = 'none';
    btn.setAttribute('aria-label', 'Pause background music');
  }).catch(() => { /* blocked — first click anywhere will start it */ });

  /* Any click anywhere on the page starts music (if not already playing).
     The button uses stopPropagation so its own handler runs exclusively. */
  document.addEventListener('click', function() {
    if (!playing) startMusic();
  });

  /* Music button: stop if playing (only way to stop), start if not.
     stopPropagation prevents the document handler above from also firing. */
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (playing) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  /* Revert to muted icon if audio ends unexpectedly */
  audio.addEventListener('ended', () => {
    playing = false;
    iconMusic.style.display = 'none';
    iconMute.style.display  = '';
  });
}

/* ================================================================
   14. INTERACTIVE RESORT MAP
   Renders invisible click zones over the numbered markers on
   the SFR_Map.png venue image and shows a popup with details.
   ================================================================ */
function initSFRMap() {
  var layer = document.getElementById('sfr-pointers-layer');
  var popup = document.getElementById('sfr-popup');
  var overlay = document.getElementById('sfr-overlay');
  var closeBtn = document.getElementById('sfr-close-btn');
  if (!layer || !popup || !overlay) return;

  // x / y are percentages of the image width / height
  var locations = [
    { id: 1, x: 48.5, y: 45, title: 'Main Villa — Nichayathartham', desc: 'Where Our Journey Begins \uD83D\uDC8D  This is the spot where our families come together, promises are made, and our official countdown begins!' },
    { id: 2, x: 61.6, y: 27.0, title: 'Swar Lawn — Reception',         desc: 'Party & Feast Destination \uD83C\uDF89  Come over here for music, laughter, a grand feast, and to toast the newlyweds.' },
    { id: 3, x: 53, y: 45, title: 'Main Villa — Upanayanam',       desc: 'The Sacred Threshold \u2728  The venue for the traditional thread ceremony. Join us to bless a beautiful new milestone of wisdom and tradition.' },
    { id: 4, x: 61.4, y: 36.0, title: 'Swar Lawn — Wedding',          desc: 'The Main Event (Muhurtham) \uD83C\uDF38  The big moment! Witness the sacred vows, the tying of the mangalsutra, and the start of our forever.' }
  ];

  locations.forEach(function(loc) {
    var btn = document.createElement('button');
    btn.className = 'sfr-map-pointer';
    btn.setAttribute('aria-label', 'View details for ' + loc.title);
    btn.style.left = loc.x + '%';
    btn.style.top  = loc.y + '%';
    btn.addEventListener('click', function(e) { e.stopPropagation(); openSFRPopup(loc); });
    layer.appendChild(btn);
  });

  function openSFRPopup(loc) {
    document.getElementById('sfr-popup-badge').textContent = loc.id;
    document.getElementById('sfr-popup-title').textContent = loc.title;
    document.getElementById('sfr-popup-desc').textContent  = loc.desc;
    popup.style.display   = 'block';
    overlay.style.display = 'block';
    setTimeout(function() {
      popup.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }

  function closeSFRPopup() {
    popup.classList.remove('active');
    overlay.classList.remove('active');
    // Remove focus from the pointer button so the hover highlight disappears
    if (document.activeElement) document.activeElement.blur();
    setTimeout(function() {
      popup.style.display   = 'none';
      overlay.style.display = 'none';
    }, 300);
  }

  overlay.addEventListener('click', function(e) { e.stopPropagation(); closeSFRPopup(); });
  closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeSFRPopup(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup.classList.contains('active')) closeSFRPopup();
  });
}

/* ================================================================
   15. BOOT — runs when the DOM is fully parsed
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // ── 0. Invitation cover page (shown first; dismissed on click) ──
  initCoverPage();

  // ── 1. Hero entrance animation (GSAP) ──
  initHeroAnimation();

  // ── 2. Live countdown to the wedding date ──
  startCountdown();

  // ── 3. Floating petals on the hero canvas ──
  initHeroPetals();

  // ── 4. Thin scroll-progress bar at the top ──
  initScrollProgress();

  // ── 5. Events section scroll-snap + per-event GSAP entrances ──
  initEventSections();

  // ── 6. Scroll-reveal for Our Story section ──
  initScrollReveal();

  // ── 7. Story deck with touch swipe + lightbox ──
  initStoryDeck();

  // ── 8. Background music toggle button ──
  initMusicToggle();

  // ── 9. Interactive resort venue map ──
  initSFRMap();

});
