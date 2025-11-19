document.addEventListener('DOMContentLoaded', function () {
  




  // Global page reveal (DOM + <img> + CSS bg images, with timeout + min delay, bfcache-safe)
(function () {
  const docEl = document.documentElement;

  function collectWaiters() {
    // 1) <img> tags (skip gallery grid)
    let imgs = Array.from(document.images).filter(img =>
      !img.closest('.gallery-grid') && img.getAttribute('loading') !== 'lazy'
    );

    // On home, skip hero + nav logo
    if (document.body.classList.contains('is-home')) {
      imgs = imgs.filter(img =>
        !img.classList.contains('hero-logo') &&
        !img.classList.contains('nav-logo')
      );
    }

    // 2) CSS background images on elements with .bg-image
    const bgEls = Array.from(document.querySelectorAll('.bg-image'));
    const bgUrls = bgEls.map(el => {
      const bg = getComputedStyle(el).backgroundImage;
      const m = /url\(["']?([^"')]+)["']?\)/.exec(bg);
      return m ? m[1] : null;
    }).filter(Boolean);

    const imgPromises = imgs.map(img => new Promise(resolve => {
      if (img.complete) { img.classList.add('is-loaded'); return resolve(); }
      img.addEventListener('load',  () => { img.classList.add('is-loaded'); resolve(); }, { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    }));

    const bgPromises = bgUrls.map(src => new Promise(resolve => {
      const im = new Image();
      im.onload = im.onerror = () => resolve();
      im.src = src;
    }));

    return { imgPromises, bgPromises, bgEls };
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function runReveal() {
    const { imgPromises, bgPromises, bgEls } = collectWaiters();

    // TIMEOUT: never hang forever; MIN: avoid flipping before CSS/FOIT settles
    const TIMEOUT_MS = 1200;
    const MIN_MS = 180;

    const all = [...imgPromises, ...bgPromises]; // <-- spread the arrays!
    // If there are no assets, Promise.all([]) resolves immediately; MIN smooths that
    await Promise.race([ Promise.all(all), delay(TIMEOUT_MS) ]);
    await delay(MIN_MS);

    bgEls.forEach(el => el.classList.add('is-loaded'));
    docEl.classList.remove('is-loading');
    docEl.classList.add('is-ready');
  }

  runReveal();

  // Handle bfcache restores (back/forward navigation)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      // Re-run the reveal so the animation plays again when revisiting
      docEl.classList.remove('is-ready');
      docEl.classList.add('is-loading');
      runReveal();
    }
  });
})();
// end of page load animation



  // --- Mark every image as loaded when it finishes (for CSS translate/opacity) ---
(function () {
  const docEl = document.documentElement;
  const allImgs = Array.from(document.images);

  allImgs.forEach((img) => {
    if (img.classList.contains('hero-logo')) return;
    const mark = () => {
      // If the page is already 'ready', add the class on the next frame
      // so the browser sees a before/after change and runs the transition.
      if (docEl.classList.contains('is-ready')) {
        requestAnimationFrame(() => img.classList.add('is-loaded'));
      } else {
        img.classList.add('is-loaded');
      }
    };

    if (img.complete) {
      mark(); // cached or already decoded
    } else {
      img.addEventListener('load', mark,  { once: true });
      img.addEventListener('error', mark, { once: true });
    }
  });
})();


  // Set Landing Page Height (desktop-only ≥769px)
  (function () {
    const landing = document.querySelector('.builds-landing');
    if (!landing) return;

    const mq = window.matchMedia('(min-width: 769px)');

    function updateLandingHeight() {
      // Only on desktop widths
      if (!mq.matches) {
        landing.style.removeProperty('height');
        return;
      }

      const header = document.querySelector('header');
      const footer = document.querySelector('footer');

      if (!header || !footer) return;

      const headerHeight = header.getBoundingClientRect().height;
      const footerHeight = footer.getBoundingClientRect().height;
      const available = Math.max(0, window.innerHeight - headerHeight - footerHeight);

      landing.style.height = `${available}px`;
    }

    // Run on load, resize, and when the media query crosses the breakpoint
    window.addEventListener('load', updateLandingHeight);
    window.addEventListener('resize', updateLandingHeight);

  })();



  // ────── Hamburger Menu ──────
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');

  let scrollPosition = 0;

  function openNav() {
    scrollPosition = window.scrollY;
    document.body.classList.add('no-scroll');
    document.body.style.top = `-${scrollPosition}px`;
  }
  function closeNav() {
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
  }

  if (toggle && navLinks && overlay) {
    const body = document.body;

    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
      overlay.classList.toggle('open');

      if (isOpen) {
        openNav();
      } else {
        closeNav();
      }
    });

    overlay.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
      overlay.classList.remove('open');

      document.body.classList.remove('no-scroll');
      document.body.style.top = '';
      window.scrollTo(0, scrollPosition);
    });

  }


  // ────── Scroll-Hide Header ──────
  const header = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;
  let ticking = false;
  const scrollThreshold = 10; // Prevents jittery toggling

  if (header) {
    window.addEventListener('scroll', () => {
      if (document.body.classList.contains('no-scroll')) return; // don't run when nav is open

      const doc = document.documentElement;
      const currentScroll = window.scrollY;
      const scrollTop = doc.scrollTop || window.pageYOffset;
      const scrollHeight = doc.scrollHeight;
      const viewport = window.innerHeight;
      const atBottom = scrollTop + viewport >= scrollHeight - 2;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Always show header at the bottom (works even on a straight scroll down)
          if (atBottom) {
            header.classList.remove('hide-header');
            lastScrollY = currentScroll; // keep state in sync
            ticking = false;
            return;
          }

          // Direction/threshold logic elsewhere
          if (Math.abs(currentScroll - lastScrollY) >= scrollThreshold) {
            if (currentScroll > lastScrollY && currentScroll > 100) {
              header.classList.add('hide-header');    // scrolling down
            } else {
              header.classList.remove('hide-header');  // scrolling up
            }
            lastScrollY = currentScroll;
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }




  // ────── Hero Spacer + Fade ──────
  const spacer = document.querySelector('.hero-spacer');
  const topnav = document.querySelector('.site-header');
  const title = document.querySelector('.build-title-sticky');
  const hero = document.querySelector('.hero');
  const wipSection = document.querySelector('.wip-section');
  const completedContainer = document.querySelector('.container');

  if (hero && (wipSection || completedContainer)) {

    // HERO OPACITY!!
    function updateHeroOpacity() {
      if (document.body.classList.contains('no-scroll')) return;

      const fadeTarget = wipSection || completedContainer;
      if (!fadeTarget) return;

      const fadeTop = fadeTarget.getBoundingClientRect().top;
      const fadeStart = window.innerHeight * 0; // start fading when next section is 25% from top
      const fadeEnd = window.innerHeight * 0.85;   // fully faded near top

      const progress = Math.min(Math.max((fadeTop - fadeStart) / (fadeEnd - fadeStart), 0), 1);
      hero.style.opacity = progress.toFixed(3);
      if (title) {
        title.style.opacity = hero.style.opacity;
      }
    }

    window.addEventListener('scroll', updateHeroOpacity);
    window.addEventListener('load', updateHeroOpacity);
  }

    // ────── Scroll Direction Tracker ──────
    let lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
    let scrollDir = 'down';

    window.addEventListener('scroll', () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      scrollDir = y < lastY ? 'up' : 'down';
      lastY = y;
    }, { passive: true });

  // ────── Slide/Fade In ──────
  const animatedEls = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;

        // Stamp the current scroll direction before revealing
        el.setAttribute('data-reveal-dir', scrollDir); // "up" or "down"

        el.classList.add('visible');
        obs.unobserve(el); // Only animate once
      }
    });
  }, { root: null, rootMargin: '120px 0px', threshold: 0.15 });

  animatedEls.forEach(el => observer.observe(el));

  // BTP fade + scale: 0.6 → 1.0 and 0.98 → 1.04 as the image center reaches viewport center (desktop-only)
  (function () {
    const el = document.querySelector('.btp img');
    if (!el) return;

    const mq = window.matchMedia('(min-width: 426px)');

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    let ticking = false;

    // ensure our transitions win (since we disabled the global one above)
    function ensureDesktopTransition() {
      if (mq.matches) {
        el.style.transition = 'opacity 200ms linear, transform 200ms linear';
      } else {
        el.style.removeProperty('transition');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      }
    }

    function update() {
      ticking = false;

      if (!mq.matches) {
        // below 769px: let CSS/mobile defaults apply
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        return;
      }

      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const vpCenter = window.innerHeight / 2;

      // progress from center→bottom of viewport
      const range = window.innerHeight / 2; // center to bottom distance
      const t = clamp(1 - (elCenter - vpCenter) / range, 0, 1); // 0..1, never decreases past center

      // opacity: 0.5 → 0.8
      const opacity = 0.5 + 0.3 * t;

      el.style.opacity = opacity.toFixed(3);
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    // wire up
    ensureDesktopTransition();
    update();

    window.addEventListener('load', update);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', () => { ensureDesktopTransition(); onScrollOrResize(); }, { passive: true });
    mq.addEventListener?.('change', () => { ensureDesktopTransition(); update(); });
  })();

  // Pause the BTP slider while hero is in view
  // (function(){
  //   const track = document.querySelector('.btp-track');
  //   const hero = document.querySelector('.home-hero');
  //   if (!track || !hero) return;

  //   const obs = new IntersectionObserver(entries => {
  //     entries.forEach(e => {
  //       track.style.animationPlayState = e.isIntersecting ? 'paused' : 'running';
  //     });
  //   }, { threshold: 0.6 });
  //   obs.observe(hero);
  // })();



// === inside your BTP scroll script ===
  (function () {
    const mq = window.matchMedia('(min-width: 427px)');
    const wrap = document.querySelector('.btp');
    const img  = wrap?.querySelector('img');
    if (!wrap || !img) return;

    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

    let startRectTop = null; // element's top relative to viewport at measure time

    // tune this: finish when the .btp top is dockPx from the top (not at 0)
    let dockPx = 200; // ← e.g., finish 160px before reaching the very top

    function measure() {
      startRectTop = wrap.getBoundingClientRect().top; // anchor the start exactly where it is
    }

    function update() {
      if (!mq.matches) { img.style.transform = ''; return; }

      const rectTop = wrap.getBoundingClientRect().top;

      // progress: 0 when rectTop === startRectTop, 1 when rectTop === dockPx
      const denom = Math.max(1, startRectTop - dockPx); // avoid /0 if dockPx ≥ start
      const t = clamp((startRectTop - rectTop) / denom, 0, 1);

      // travel distance (within the btp container)
      const maxShift = Math.max(0, wrap.clientWidth - img.clientWidth);
      img.style.transform = `translateX(${(maxShift * t).toFixed(2)}px)`;
    }

    const onScroll = () => requestAnimationFrame(update);

    window.addEventListener('load', () => { measure(); update(); });
    window.addEventListener('resize', () => { measure(); update(); });
    window.addEventListener('scroll', onScroll, { passive: true });

    // optional: use a viewport fraction instead of pixels
    // window.addEventListener('resize', () => { dockPx = window.innerHeight * 0.15; });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { measure(); update(); });
    }
  })();



  // full screen gallery view
  // ===== Reusable Lightbox (gallery vs block scopes) =====
  (function () {
    // Accept clicks on any descendant of an element bearing data-lightbox
    const CLICK_ATTR = 'data-lightbox';

    // Build the overlay once
    let lb = null, imgEl = null, btnPrev = null, btnNext = null, btnClose = null, counterEl = null;

    function ensureOverlay() {
      if (lb) return;
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = `
        <div class="lightbox__inner">
          <button class="lightbox__btn lightbox__close" aria-label="Close (Esc)"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"
       xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L16 16M16 4L4 16"
          stroke="#f1f5f9" stroke-width="2"
          stroke-linecap="round" />
  </svg></button>
          <button class="lightbox__btn lightbox__prev" aria-label="Previous (←)">‹</button>
          <img class="lightbox__img" alt="">
          <button class="lightbox__btn lightbox__next" aria-label="Next (→)">›</button>
          <div class="lightbox__counter" aria-live="polite"></div>
        </div>
      `;
      document.body.appendChild(lb);

      imgEl     = lb.querySelector('.lightbox__img');
      btnPrev   = lb.querySelector('.lightbox__prev');
      btnNext   = lb.querySelector('.lightbox__next');
      btnClose  = lb.querySelector('.lightbox__close');
      counterEl = lb.querySelector('.lightbox__counter');

       // === START of new ZOOM / PAN code ===
      if (!lb.dataset.zoomBound) {
  lb.dataset.zoomBound = '1';

  // ---- Zoom / Pan state ----
  const MIN_SCALE = 1;
  const MID_SCALE = 2;
  const MAX_SCALE = 4;
  const EPS = 0.001;

  let scale = MIN_SCALE;
  let tx = 0;
  let ty = 0;
  let prevTransition = "";

  const drag = {
    active: false,
    x: 0,
    y: 0,
    startTx: 0,
    startTy: 0,
    moved: false,
    suppressClick: false,
  };

  const inner = lb.querySelector('.lightbox__inner');

  function applyTransform() {
    // scale first, then translate: translation is in screen pixels
    imgEl.style.transform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
  }

  function updateZoomClasses() {
    lb.classList.toggle('is-zoomed', scale > MIN_SCALE + EPS);
    lb.classList.toggle('is-maxzoom', scale >= MAX_SCALE - EPS);
  }

  function clampPan() {
    if (!inner) return;

    const ir = inner.getBoundingClientRect();
    const r = imgEl.getBoundingClientRect();

    // Horizontal clamping
    if (r.width <= ir.width || Math.abs(scale - MIN_SCALE) < EPS) {
      // Center horizontally
      const cxImg = r.left + r.width / 2;
      const cxInner = ir.left + ir.width / 2;
      const dx = cxInner - cxImg;
      tx += dx;
    } else {
      // Prevent gaps left/right
      if (r.left > ir.left) {
        tx += ir.left - r.left;
      } else if (r.right < ir.right) {
        tx += ir.right - r.right;
      }
    }

    // Vertical clamping
    if (r.height <= ir.height || Math.abs(scale - MIN_SCALE) < EPS) {
      // Center vertically
      const cyImg = r.top + r.height / 2;
      const cyInner = ir.top + ir.height / 2;
      const dy = cyInner - cyImg;
      ty += dy;
    } else {
      // Prevent gaps top/bottom
      if (r.top > ir.top) {
        ty += ir.top - r.top;
      } else if (r.bottom < ir.bottom) {
        ty += ir.bottom - r.bottom;
      }
    }
  }

  function resetZoom(animated) {
    scale = MIN_SCALE;
    tx = 0;
    ty = 0;
    updateZoomClasses();

    if (animated) {
      applyTransform();
    } else {
      const old = imgEl.style.transition;
      imgEl.style.transition = 'none';
      applyTransform();
      void imgEl.offsetWidth; // force reflow
      imgEl.style.transition = old;
    }
  }

  // Allow show() to reset zoom instantly when switching images
  lb.resetZoom = () => resetZoom(false);

  function zoomAt(clientX, clientY, targetScale) {
    let newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale));
    const oldScale = scale;

    if (Math.abs(newScale - oldScale) < EPS) return;

    // If we're going back to 1x, always fully reset to original position
    if (newScale === MIN_SCALE) {
      resetZoom(true);
      return;
    }

    // Keep the point under the cursor stable while zooming
    const ir = inner.getBoundingClientRect();
    const cx = ir.left + ir.width / 2;
    const cy = ir.top + ir.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    // Derived formula: tx' = tx + dx * (1 - newScale / oldScale)
    tx = tx + dx * (1 - newScale / oldScale);
    ty = ty + dy * (1 - newScale / oldScale);

    scale = newScale;
    clampPan();
    applyTransform();
    updateZoomClasses();
  }

  // ---- Click to zoom: 1x -> MID -> MAX -> 1x, always at click point ----
  imgEl.addEventListener('click', (e) => {
    if (drag.suppressClick) {
      drag.suppressClick = false;
      return;
    }

    let target;
    if (scale < MID_SCALE - EPS) {
      target = MID_SCALE;
    } else if (scale < MAX_SCALE - EPS) {
      target = MAX_SCALE;
    } else {
      target = MIN_SCALE;
    }

    zoomAt(e.clientX, e.clientY, target);
  });

  // ---- Wheel zoom around cursor ----
  let wheelRAF = null;
  imgEl.addEventListener('wheel', (e) => {
    e.preventDefault();

    const clientX = e.clientX;
    const clientY = e.clientY;
    const delta = -e.deltaY; // up = zoom in

    let factor = delta > 0 ? 1.2 : 1 / 1.2;
    let target = scale * factor;

    if (target < MIN_SCALE + 0.01) target = MIN_SCALE;
    if (target > MAX_SCALE) target = MAX_SCALE;

    if (wheelRAF) cancelAnimationFrame(wheelRAF);
    wheelRAF = requestAnimationFrame(() => {
      wheelRAF = null;
      zoomAt(clientX, clientY, target);
    });
  }, { passive: false });

  // ---- Drag / pan when zoomed ----
  imgEl.addEventListener('mousedown', (e) => {
    if (scale <= MIN_SCALE + EPS) return;
    e.preventDefault();

    drag.active = true;
    drag.moved = false;
    drag.suppressClick = false;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.startTx = tx;
    drag.startTy = ty;

    prevTransition = imgEl.style.transition;
    imgEl.style.transition = 'none';
    imgEl.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!drag.active) return;

    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;

    if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      drag.moved = true;
    }

    if (!drag.moved) return;

    tx = drag.startTx + dx;
    ty = drag.startTy + dy;
    clampPan();
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!drag.active) return;

    drag.active = false;
    imgEl.style.cursor = scale > MIN_SCALE + EPS ? 'grab' : 'zoom-in';

    if (drag.moved) {
      drag.suppressClick = true;
      setTimeout(() => { drag.suppressClick = false; }, 0);
    }

    imgEl.style.transition = prevTransition || '';
    prevTransition = '';

    clampPan();
    applyTransform();
  });

  // Make sure current image is at 1x, centered, when the lightbox is first opened
  resetZoom(false);
}

      // === END of new ZOOM / PAN code ===



      // Close on backdrop click or image click
      lb.addEventListener('click', (e) => {
        const inner = lb.querySelector('.lightbox__inner');
        if (!inner.contains(e.target)) close();
      });
      btnPrev.addEventListener('click', () => nav(-1));
      btnNext.addEventListener('click', () => nav(1));
      btnClose.addEventListener('click', close);

      // Keyboard
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') nav(1);
        else if (e.key === 'ArrowLeft') nav(-1);
      });

      // Basic swipe
      let sx = 0, sy = 0, sw = false;
      lb.addEventListener('touchstart', (e) => {
        if (!e.touches[0]) return;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; sw = true;
      }, { passive: true });
      lb.addEventListener('touchend', (e) => {
        if (!sw) return;
        sw = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) > Math.max(50, Math.abs(dy) * 1.5)) nav(dx < 0 ? 1 : -1);
      }, { passive: true });
    }

    // Current state
    let group = [];
    let idx = 0;

    function getBestSrc(node) {
      // Prefer data-full, else currentSrc/src, else the biggest srcset candidate
      const el = node.tagName === 'IMG' ? node : node.querySelector('img');
      if (!el) return '';
      const df = el.getAttribute('data-full');
      if (df) return df;
      if (el.currentSrc) return el.currentSrc;
      if (el.src) return el.src;
      const ss = el.getAttribute('srcset');
      if (ss) {
        // pick the last (usually largest) candidate
        const last = ss.split(',').slice(-1)[0].trim().split(' ')[0];
        return last || '';
      }
      return '';
    }

    function openFrom(targetEl) {
      ensureOverlay();

      // Find the closest group-bearing element
      const itemEl = targetEl.closest(`[${CLICK_ATTR}]`);
      if (!itemEl) return;

      const groupName = itemEl.getAttribute(CLICK_ATTR);
      let scopeRoot;

      if (groupName === 'gallery') {
        scopeRoot = itemEl.closest('.gallery-grid');
      } else if (groupName === 'block') {
        scopeRoot = document.querySelector('.show-completed .container');
      }

      if (!scopeRoot) return;

      const nodes = Array.from(
        scopeRoot.querySelectorAll(`[${CLICK_ATTR}="${groupName}"]`)
      );

      group = nodes.map(n => ({
        node: n,
        src: getBestSrc(n),
        alt: (n.getAttribute('alt') || n.querySelector('img')?.getAttribute('alt') || '')
      }));

      // Index of the clicked item
      idx = Math.max(0, nodes.indexOf(itemEl));
      show(idx);

      // Open overlay & lock scroll
      // ensure we start from the "clxosed" state, then animate into open
      lb.classList.remove('closing');
      lb.classList.remove('open');   // make sure it's in the base state

      requestAnimationFrame(() => {
        lb.classList.add('open');
      });

      // Freeze page at current scroll position
      const y = window.scrollY;
      document.body.dataset.scrollY = String(y);
      document.body.classList.add('no-scroll');
      document.body.style.top = `-${y}px`;

      // Preload neighbors
      preload(idx + 1);
      preload(idx - 1);
    }

    

    function show(i) {  
      const item = group[i];
      if (!item) return;
      lb?.resetZoom?.();
      imgEl.alt = item.alt;
      imgEl.src = item.src;         // might be data-full or currentSrc
      counterEl.textContent = `${i + 1} / ${group.length}`;
    }

    function nav(step) {
      if (!group.length) return;
      idx = (idx + step + group.length) % group.length;
      show(idx);
      preload(idx + (step > 0 ? 1 : -1));
    }

    function preload(i) {
      if (!group.length) return;
      const ii = (i + group.length) % group.length;
      const pre = new Image();
      pre.src = group[ii].src;
    }

    function close() {
      // Start backdrop fade (purely visual)
      lb.classList.remove('open');
      lb.classList.add('closing');

      // Clear the image immediately
      const imgEl = lb.querySelector('.lightbox__img');
      if (imgEl) {
        imgEl.removeAttribute('src');
        imgEl.removeAttribute('srcset');
        imgEl.removeAttribute('alt');
      }

      // 🔥 Immediately restore scroll – no more waiting on animations
      const saved = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.classList.remove('no-scroll');
      document.body.style.top = "";
      window.scrollTo(0, saved);

      // Let the closing animation run on its own,
      // then just clear the `.closing` class so it's reset for next time.
      // (If you re-open before this fires, `openFrom` will remove `closing` anyway.)
      setTimeout(() => {
        lb.classList.remove('closing');
      }, 500); // match or slightly exceed your CSS close duration
    }


    // Delegate clicks globally (works for both gallery + block)
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest(`[${CLICK_ATTR}]`);
      if (!trigger) return;
      e.preventDefault();
      openFrom(e.target);
    });
  })();



    // ────── For Sale divider width on scroll ──────
  (function () {
    const dividers = document.querySelectorAll('.for-sale-divider');
    if (!dividers.length) return;

    const MIN_W = 40; // %
    const MAX_W = 70; // %

    let ticking = false;

    function computeWidthForDivider(rect, vh) {
      const center = rect.top + rect.height / 2;
      const f = center / vh; // 0 = top, 1 = bottom

      const topThreshold = 0.15; // top 15% of screen
      const bottomThreshold = 1.0; // we’ll fade from center down to bottom

      let width;

      if (f >= 0.5) {
        // Between center and bottom:
        //  center (0.5) => 70%, bottom (1.0) => 40%
        const tBottom = Math.min(1, (f - 0.5) / (bottomThreshold - 0.5));
        width = MAX_W - (MAX_W - MIN_W) * tBottom;
      } else if (f >= topThreshold && f < 0.5) {
        // Between top 15% line and center: stay at max width
        width = MAX_W;
      } else {
        // Above the top 15% line:
        //  f = topThreshold => 70%, f = 0 => 40%
        const tTop = Math.min(1, (topThreshold - f) / topThreshold);
        width = MAX_W - (MAX_W - MIN_W) * tTop;
      }

      return width;
    }

    function updateDividerWidths() {
      ticking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      dividers.forEach(divider => {
        const rect = divider.getBoundingClientRect();
        const width = computeWidthForDivider(rect, vh);
        divider.style.width = width.toFixed(2) + '%';
      });
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateDividerWidths);
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    window.addEventListener('load', updateDividerWidths);

    // initial run
    updateDividerWidths();
  })();
  // ────── End of For Sale divider width on scroll ──────






});
