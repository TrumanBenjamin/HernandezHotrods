(function () {
  function updateHomeHeroHeight() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    // True fullscreen section regardless of header/footer
    if (window.innerWidth > 426) {
      hero.style.height = window.innerHeight + 'px';
    } else {
      // Remove the inline height so CSS can take over on mobile
      hero.style.removeProperty('height');
      hero.style.removeProperty('min-height');
    }
  }

  window.addEventListener('load', updateHomeHeroHeight);
  window.addEventListener('resize', updateHomeHeroHeight);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateHomeHeroHeight);
  }
  // Home header-logo reveal after hero
  const navLogoBox = document.querySelector('.site-header .nav-logo');
  const hero = document.querySelector('.home-hero');

  // If not on home (no hero) just ensure the logo shows
  if (!hero) {
    navLogoBox?.classList.add('visible');
    return;
  }

  // Use IntersectionObserver so we don't rely on scroll math
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // hero on screen -> keep header logo hidden
        navLogoBox?.classList.remove('visible');
      } else {
        // hero left viewport -> show header logo
        navLogoBox?.classList.add('visible');
      }
    },
    { threshold: 0 } // flip as soon as hero leaves
  );

  const spacerEl = document.querySelector('.home-hero-spacer');
  io.observe(spacerEl || hero);

  // Set correct state on load without waiting for scroll
  window.addEventListener('load', () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom <= 0) navLogoBox?.classList.add('visible');
  });
})();

  // Fire 1000ms after the page is marked “ready”
  // const onReady = () => {
  //   const logo = document.querySelector('.home-hero .hero-logo');
  //   if (!logo) return;
  //   setTimeout(() => logo.classList.add('start'), 1700);
  // };

  // If your main.js flips html.is-ready, hook that moment:
  // const readyObserver = new MutationObserver((muts) => {
  //   if (document.documentElement.classList.contains('is-ready')) {
  //     readyObserver.disconnect();
  //     onReady();
  //   }
  // });
  // readyObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // // Fallback if something else sets readiness earlier
  // window.addEventListener('DOMContentLoaded', () => {
  //   if (document.documentElement.classList.contains('is-ready')) onReady();
  // });








  // --- Sync existing hero logo transition to a timestamp in the hero video (fire ONCE) ---
  (function syncHeroLogoToVideo() {
    const video = document.getElementById('homeHeroVideo');
    const logo  = document.querySelector('.home-hero .hero-logo');
    if (!video || !logo) return;

    // NEW: if the hero is already scrolled past when the page loads,
    // just show the logo immediately and skip the timing logic.
    const heroSection = document.querySelector('.home-hero');
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      const heroIsAboveViewport = rect.bottom <= 0; // completely above screen

      if (heroIsAboveViewport) {
        logo.classList.add('start');   // show it right away
        return;                        // don’t hook any video listeners
      }
    }

    const CUE_TIME = 1.6;   // seconds
    const TOL = 0.03;

    let done = false;
    let rafBound = null;

    const fire = () => {
      if (done) return;
      done = true;
      logo.classList.add('start');

      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('loadedmetadata', onLoadedMeta);
    };

    const check = (t) => {
      if (!done && t + TOL >= CUE_TIME) fire();
    };

    const onFrame = (_now, meta) => {
      if (done) return;
      check(meta.mediaTime);
      if (!done && !video.paused) video.requestVideoFrameCallback(rafBound);
    };

    const onTimeUpdate = () => check(video.currentTime);
    const onLoadedMeta = () => { /* no-op, we only fire once */ };

    const onPlay = () => {
      if (done) return;

      // If user scrubbed past the cue before play, fire immediately
      if (video.currentTime >= CUE_TIME - TOL) {
        fire();
      } else if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        rafBound = onFrame;
        video.requestVideoFrameCallback(rafBound);
      }
    };

    // Wire up listeners (one-time)
    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('play', onPlay);

    if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
      video.addEventListener('timeupdate', onTimeUpdate);
    }
  })();

document.querySelector('.scroll-cue')
  ?.addEventListener('click', () => {
    window.scrollBy({
      top: window.innerHeight * 1,
      behavior: 'smooth'
    });
  });




