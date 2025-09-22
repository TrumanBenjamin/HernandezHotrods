document.addEventListener('DOMContentLoaded', function () {
  
  // ===== Lazy gallery loader (4 concurrent) =====

  // end of lazy loader



  // Global page reveal (waits for DOM + images + CSS background images, with a short fallback)
  (function () {
  const docEl = document.documentElement;

  // Collect <img> tags
  let imgs = Array.from(document.images); 
  imgs = imgs.filter(img => !img.closest('.gallery-grid'));
  // If we are on the home page, skip the hero + nav logos
  if (document.body.classList.contains('is-home')) {
    imgs = imgs.filter(img =>
      !img.classList.contains('hero-logo') &&
      !img.classList.contains('nav-logo')
    );
  }

  // Collect elements that use CSS background images
  const bgEls = Array.from(document.querySelectorAll('.bg-image'));
  const bgUrls = bgEls.map(el => {
    const bg = getComputedStyle(el).backgroundImage;
    const m = /url\(["']?([^"')]+)["']?\)/.exec(bg); 
    return m ? m[1] : null;
  }).filter(Boolean);

  // Promises for <img> tags
  const imgPromises = imgs.map(img => new Promise(resolve => {
    if (img.complete) {
      img.classList.add('is-loaded');
      return resolve();
    }
    img.addEventListener('load', () => { img.classList.add('is-loaded'); resolve(); }, { once: true });
    img.addEventListener('error', resolve, { once: true });
  }));

  // Promises for CSS background images
  const bgPromises = bgUrls.map(src => new Promise(resolve => {
    const im = new Image();
    im.onload = im.onerror = () => resolve();
    im.src = src;
  }));

  // Don’t hang forever — cap the wait (adjust if you want)
  const TIMEOUT_MS = 1200;
  const timeout = new Promise(res => setTimeout(res, TIMEOUT_MS));

  // When done (or timeout), mark bg elements as loaded and reveal the page
  Promise.race([Promise.allSettled([imgPromises, bgPromises]), timeout]).then(() => {
    bgEls.forEach(el => el.classList.add('is-loaded'));
    docEl.classList.remove('is-loading');
    docEl.classList.add('is-ready');
  });
})();
// end of page load animation

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

  if (spacer && topnav && title && hero) {
    function updateHeroSpacerHeight() {
        requestAnimationFrame(() => {
            const heroHeight = hero.offsetHeight;
            const titleHeight = title.offsetHeight;
            const topnavHeight = topnav.offsetHeight;

            const totalOffset = titleHeight;

            spacer.style.height = `calc(100vh - ${totalOffset}px)`;
            console.log(`titleHeight = ${titleHeight}`)
            console.log(`✅ Spacer height set to: 100vh - ${totalOffset}px`);
        });
    }


    // HERO OPACITY!!
    function updateHeroOpacity() {
      if (document.body.classList.contains('no-scroll')) return;

      const fadeDistance = title.getBoundingClientRect().top + window.scrollY;
      const scrollY = window.scrollY;

      let opacity = 1;
      if (scrollY >= fadeDistance) {
        opacity = 0;
      } else {
        opacity = 1 - (scrollY / fadeDistance);
      }

      hero.style.opacity = opacity.toFixed(3);
      if (opacity <= 0) {
        hero.style.display = 'none';
      } else {
        hero.style.display ='';
      }
    }

    window.addEventListener('load', updateHeroSpacerHeight);
    window.addEventListener('resize', updateHeroSpacerHeight);
    window.addEventListener('scroll', updateHeroOpacity);
    window.addEventListener('load', updateHeroOpacity);
  }

  // ────── Slide/Fade In with Stagger ──────
  const animatedEls = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('visible');
        obs.unobserve(el); // Only animate once
      }
    });
  }, { threshold: 0.15 });

  animatedEls.forEach(el => observer.observe(el));



  // Uncomment this code when you've made your gallery and start build sections!! 
  // const revealOnce = (selector) => {
  //   const element = document.querySelector(selector);
  //   if (!element) return;

  //   const revealObserver = new IntersectionObserver(
  //     (entries, obs) => {
  //       entries.forEach(entry => {
  //         if (entry.isIntersecting) {
  //           element.classList.add('revealed');
  //           obs.unobserve(entry.target);
  //         }  
  //       });
  //     },
  //     { threshold: 0.2 }
  //   );

  //   element.classList.add('reveal');
  //   revealObserver.observe(element);
  // };

  // revealOnce('.gallery');
  // revealOnce('.cta');


});
