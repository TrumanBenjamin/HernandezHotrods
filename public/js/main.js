document.addEventListener('DOMContentLoaded', function () {
  // ────── Hamburger Menu ──────
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');

  if (toggle && navLinks && overlay) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  // ────── Scroll-Hide Header ──────
  const header = document.querySelector('.site-header');
    let lastScrollY = window.scrollY;
    let ticking = false;
    const scrollThreshold = 10; // Prevents jittery toggling

    if (header) {
    window.addEventListener('scroll', () => {
        if (!ticking) {
        window.requestAnimationFrame(() => {
            const currentScroll = window.scrollY;

            if (Math.abs(currentScroll - lastScrollY) >= scrollThreshold) {
            if (currentScroll > lastScrollY && currentScroll > 100) {
                // Scrolling down
                header.classList.add('hide-header');
            } else {
                // Scrolling up
                header.classList.remove('hide-header');
            }
            lastScrollY = currentScroll;
            }

            ticking = false;
        });

        ticking = true;
        }
    });
    }


  // ────── Hero Spacer + Fade ──────
  const spacer = document.querySelector('.hero-spacer');
  const topnav = document.querySelector('.site-header');
  const title = document.querySelector('.build-title-sticky');
  const fade = document.querySelector('.block-fade');
  const hero = document.querySelector('.hero');

  if (spacer && topnav && title && fade && hero) {
    function updateHeroSpacerHeight() {
        requestAnimationFrame(() => {
            const titleHeight = title.offsetHeight;
            const fadeHeight = fade.offsetHeight;

            const totalOffset = titleHeight + fadeHeight;

            spacer.style.height = `calc(100vh - ${totalOffset}px)`;
            console.log(`✅ Spacer height set to: 100vh - ${totalOffset}px`);
        });
    }



    function updateHeroOpacity() {
      const fadeDistance = title.getBoundingClientRect().top + window.scrollY;
      const scrollY = window.scrollY;

      let opacity = 1;
      if (scrollY >= fadeDistance) {
        opacity = 0;
      } else {
        opacity = 1 - (scrollY / fadeDistance);
      }

      hero.style.opacity = opacity.toFixed(3);
    }

    window.addEventListener('load', updateHeroSpacerHeight);
    window.addEventListener('resize', updateHeroSpacerHeight);
    window.addEventListener('scroll', updateHeroOpacity);
    window.addEventListener('load', updateHeroOpacity);
  }
});
