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
 * 10.  initScrollReveal()     (CSS reveal for Story / RSVP sections)
 * 11.  initGallery()          (lightbox + touch-swipe)
 * 12.  initRSVP()             (form → thank-you card animation)
 * 13.  initMusicToggle()      (play/pause audio on button click)
 * 14.  DOMContentLoaded       (boots everything)
 * ================================================================
 */

/* ================================================================
   1. CONFIG — EDIT THIS SECTION
   ================================================================ */
const CONFIG = {
  /**
   * EDIT: Set the wedding date and time.
   * Using explicit IST offset (+05:30) so the countdown is correct
   * regardless of the timezone of the device opening the page.
   */
  weddingDate: new Date('2026-08-29T09:00:00+05:30'),

  /** Number of floating petals on the hero canvas */
  heroPetalCount: 28,

  /** Number of floating petals inside each event section */
  eventPetalCount: 10,

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
      '.hero-date,#countdown,.scroll-indicator'
    ).forEach(el => {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    });
    // Also show name text (they start visible in no-GSAP case)
    return;
  }

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
  gsap.set('.hero-name--groom .letter-span, .hero-name--bride .letter-span', {
    opacity: 0,
    y: 65,
    rotateX: 35,
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
      { opacity: 1, y: 0, rotateX: 0, duration: 0.75, stagger: 0.038 },
      '-=0.1'
    )
    .to('.hero-weds',
      { opacity: 1, y: 0, duration: 0.45 },
      '-=0.25'
    )
    .to('.hero-name--bride .letter-span',
      { opacity: 1, y: 0, rotateX: 0, duration: 0.75, stagger: 0.038 },
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
  const obs = new IntersectionObserver(([entry]) => {
    entry.isIntersecting ? pc.start() : pc.stop();
  }, { threshold: 0.05 });

  obs.observe(hero);
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
  // alternating left / right entrance per event
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
      root: null,      // observe against the viewport (not a scroll container)
      threshold: 0.55,
    });

    obs.observe(section);
  });

  // ── Dot click → smooth-scroll the page to that event section ──
  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);
      if (sections[idx]) {
        sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
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
   RSVP form wrapper so they stagger-in on scroll.
   ================================================================ */
function initScrollReveal() {
  // Stagger gallery items
  document.querySelectorAll('.gallery-item').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${i * 0.07}s`;
  });

  // Observe all .reveal elements
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

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
   11. GALLERY LIGHTBOX
   Opens a full-screen overlay on gallery item click/tap.
   Supports keyboard nav (← →, Escape) and touch swipe.
   ================================================================ */
function initGallery() {
  const gallery     = document.getElementById('gallery');
  const lightbox    = document.getElementById('lightbox');
  const lbContent   = document.getElementById('lightbox-content');
  const closeBtn    = document.getElementById('lightbox-close');
  const prevBtn     = document.getElementById('lightbox-prev');
  const nextBtn     = document.getElementById('lightbox-next');

  if (!gallery || !lightbox) return;

  const items = Array.from(gallery.querySelectorAll('.gallery-item'));
  let current = 0;
  let touchX0 = 0;  // touch-start X for swipe detection

  /** Build the inner HTML for the lightbox at a given index. */
  function getContent(index) {
    const item = items[index];
    const img  = item.querySelector('img');
    if (img) {
      // Real photo
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = img.alt || `Photo ${index + 1}`;
      return el;
    }
    // Placeholder card (no real image yet)
    const ph = document.createElement('div');
    ph.style.cssText = `
      width: min(80vw, 400px);
      aspect-ratio: 4/3;
      background: linear-gradient(135deg,#FDE8EF,#FFF0E6);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond',Georgia,serif;
      font-style: italic;
      font-size: 1rem;
      color: #9B7878;
    `;
    const span = item.querySelector('.gallery-placeholder span');
    ph.textContent = span ? span.textContent : `Photo ${index + 1}`;
    return ph;
  }

  function open(index) {
    current = index;
    lbContent.innerHTML = '';
    lbContent.appendChild(getContent(index));
    lightbox.style.display = 'flex';
    // Force reflow so the CSS transition fires
    lightbox.offsetHeight; // eslint-disable-line no-unused-expressions
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove('open');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    // Return focus to the item that was opened
    items[current]?.focus();
  }

  function navigate(direction) {
    current = (current + direction + items.length) % items.length;
    lbContent.innerHTML = '';
    lbContent.appendChild(getContent(current));
  }

  // Item click / keyboard activation
  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', e => { e.stopPropagation(); navigate(-1); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); navigate(+1); });

  // Close on backdrop click
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(+1);
  });

  // Touch swipe (passive listeners for scroll performance)
  lightbox.addEventListener('touchstart', e => {
    touchX0 = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchX0;
    if (Math.abs(delta) > 48) navigate(delta < 0 ? +1 : -1);
  }, { passive: true });
}

/* ================================================================
   12. RSVP FORM
   Prevents page reload, validates name, then transitions to a
   GSAP-animated thank-you card.
   ================================================================ */
function initRSVP() {
  const form     = document.getElementById('rsvp-form');
  const thankyou = document.getElementById('thankyou-card');
  if (!form || !thankyou) return;

  const nameInput = form.querySelector('#rsvp-name');

  form.addEventListener('submit', e => {
    e.preventDefault();

    // ── Validate required name field ──
    if (!nameInput.value.trim()) {
      nameInput.focus();
      // Brief red-border shake to signal the error
      nameInput.style.borderColor = 'var(--rose-deep)';
      nameInput.style.animation   = 'none';
      setTimeout(() => {
        nameInput.style.borderColor = '';
      }, 1800);
      return;
    }

    /*
    ══════════════════════════════════════════════════════════════
    TO SEND FORM DATA TO FORMSPREE (free tier):

    const payload = {
      name:      nameInput.value.trim(),
      guests:    form.querySelector('#rsvp-guests').value,
      attending: form.querySelector('input[name="attending"]:checked')?.value || 'yes',
      message:   form.querySelector('#rsvp-message').value.trim(),
    };

    fetch('https://formspree.io/f/YOUR_FORM_ID_HERE', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(res => {
      if (res.ok) showThankyou();
      else console.warn('Formspree submission failed:', res.status);
    })
    .catch(err => {
      console.error('Network error during RSVP submit:', err);
    });

    return; // ← uncomment this line when using the fetch approach
    ══════════════════════════════════════════════════════════════
    */

    showThankyou();
  });

  function showThankyou() {
    if (typeof gsap === 'undefined') {
      // GSAP not available — just swap elements
      form.style.display = 'none';
      thankyou.style.display = 'block';
      thankyou.style.opacity = '1';
      return;
    }

    // Fade out form, then reveal thank-you card with spring animation
    gsap.to(form, {
      opacity: 0,
      y: -18,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        form.style.display   = 'none';
        thankyou.style.display = 'block';

        gsap.fromTo(
          thankyou,
          { opacity: 0, scale: 0.82, y: 24 },
          { opacity: 1, scale: 1,    y: 0,
            duration: 0.75,
            ease: 'back.out(1.5)',
          }
        );
      },
    });
  }
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

  btn.addEventListener('click', () => {
    if (playing) {
      audio.pause();
      playing = false;
      iconMusic.style.display = '';
      iconMute.style.display  = 'none';
      btn.setAttribute('aria-label', 'Play background music');
    } else {
      audio.play().catch(() => {
        /**
         * This catch fires when no audio file is present.
         * EDIT: Add assets/background-music.mp3 to enable music.
         * Free royalty-free wedding music sources:
         *   - https://pixabay.com/music/search/wedding/
         *   - https://freemusicarchive.org
         */
        console.info(
          'Music note: no audio file detected. ' +
          'Add a file at assets/background-music.mp3 and update ' +
          'the <audio> src in index.html.'
        );
      });
      playing = true;
      iconMusic.style.display = 'none';
      iconMute.style.display  = '';
      btn.setAttribute('aria-label', 'Pause background music');
    }
  });

  // If audio ends unexpectedly, reset the icon
  audio.addEventListener('ended', () => {
    playing = false;
    iconMusic.style.display = '';
    iconMute.style.display  = 'none';
  });
}

/* ================================================================
   14. BOOT — runs when the DOM is fully parsed
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

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

  // ── 6. Scroll-reveal for Our Story & RSVP sections ──
  initScrollReveal();

  // ── 7. Gallery lightbox with touch swipe ──
  initGallery();

  // ── 8. RSVP form → animated thank-you card ──
  initRSVP();

  // ── 9. Background music toggle button ──
  initMusicToggle();

});
