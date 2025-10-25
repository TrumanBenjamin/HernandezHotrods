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


    // Set Landing Page Height!!
    function updateLandingHeight() {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const landing = document.querySelector('.builds-landing');

      if (header && footer && landing) {
        const headerHeight = header.getBoundingClientRect().height;
        const footerHeight = footer.getBoundingClientRect().height;
        const availableHeight = window.innerHeight - headerHeight - footerHeight;

        console.log(headerHeight, footerHeight, availableHeight); // ✅ for debugging

        landing.style.height = `${availableHeight}px`;
      }
    }
    // ✅ Run it on load and resize
    window.addEventListener('load', updateLandingHeight);
    window.addEventListener('resize', updateLandingHeight);



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



});
