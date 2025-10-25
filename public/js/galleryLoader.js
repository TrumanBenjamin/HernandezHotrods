// /public/js/galleryLoader.js
(function () {
  // --- tiny logger -----------------------------------------------------------
  const debug = (...args) => console.log('[gallery]', ...args);

  // --- helpers ---------------------------------------------------------------
  // Ensure each .gallery-item has an <img>. If the figure has data-* attributes,
  // create an <img> and migrate them; otherwise return the existing <img>.
  // Waits until ALL <img> in a row are truly ready (loaded + decoded).
  async function waitRowStrict(row) {
    const imgs = Array.from(row.querySelectorAll('.gallery-item img'));

    // start any lazy ones now, but keep them hidden (no prepaint)
    imgs.forEach((img) => {
      img.style.opacity = '0';
      img.style.transform = 'translateY(8px)';
      img.loading = 'eager';
      try { img.fetchPriority = 'high'; } catch (_) {}
      img.decoding = 'async';
      if (img.dataset && img.dataset.src) {
        // attach listeners BEFORE promoting
        // (avoids missing 'load' on cached images)
        img._hlrPromoted = true;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });

    // per-image promise that resolves ONLY on real readiness
    const waitOne = (img) =>
      new Promise((resolve) => {
        const finalize = () => {
          const d = img.decode ? img.decode() : Promise.resolve();
          d.catch(() => {}).finally(resolve);
        };

        if (img.complete && img.naturalWidth > 0) return finalize();
        img.addEventListener('load', finalize, { once: true });
      });

    // Strict barrier: do not continue until ALL 4 are ready
    await Promise.all(imgs.map(waitOne));

    // double-check (belt & suspenders)
    if (!imgs.every(i => i.complete && i.naturalWidth > 0)) {
      // if something was dodgy, wait one animation frame and recheck
      await new Promise(r => requestAnimationFrame(r));
      if (!imgs.every(i => i.complete && i.naturalWidth > 0)) return { ok:false, imgs };
    }

    return { ok:true, imgs };
  }
  
  function primeRowImages(row) {
    const imgs = Array.from(row.querySelectorAll('.gallery-item')).map(ensureImgForItem);
    imgs.forEach((img) => {
      // keep hidden so nothing prepaints
      img.style.opacity = '0';
      img.style.transform = 'translateY(8px)';

      // if still lazy, promote now so requests start immediately
      if (img.dataset && img.dataset.src) {
        img.loading = 'eager';
        try { img.fetchPriority = 'high'; } catch (_) {}
        img.decoding = 'async';
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }

  function ensureImgForItem(item) {
    let img = item.querySelector('img');
    if (!img) {
      img = new Image();
      img.decoding = 'async';
      img.loading = 'eager'; // we control reveal timing; don't lazy-load
      // pull metadata from the figure if present
      if (item.dataset.src) img.dataset.src = item.dataset.src;
      if (item.dataset.alt) img.alt = item.dataset.alt;
      if (item.dataset.w) img.width = parseInt(item.dataset.w, 10);
      if (item.dataset.h) img.height = parseInt(item.dataset.h, 10);
      item.appendChild(img);
    } else {
      // If <img> exists but src is on data-attr, inherit it
      if (!img.src && item.dataset.src && !img.dataset.src) {
        img.dataset.src = item.dataset.src;
      }
      if (!img.alt && item.dataset.alt) img.alt = item.dataset.alt;
    }
    return img;
  }

  function waitAndRevealRow(row) {
  const items = Array.from(row.querySelectorAll('.gallery-item'));
  const imgs = items.map(ensureImgForItem);

  // make sure nothing prepaints
  imgs.forEach((img) => {
    img.classList.remove('is-loaded', 'loaded', 'lazyloaded');
    img.style.opacity = '0';
    img.style.transform = 'translateY(8px)';
  });

  return Promise.all(imgs.map(waitImg)).then(() => {
    row.classList.add('row-visible');
    imgs.forEach((img) => {
      img.classList.add('is-loaded');
      img.style.removeProperty('opacity');
      img.style.removeProperty('transform');
    });
  });
}

  // Wait for a single <img> to be truly ready (loaded + decoded)
  function waitImg(img) {
    return new Promise((resolve) => {
      const settle = () => {
        if (img.decode) {
          img.decode().catch(() => {}).finally(resolve);
        } else {
          resolve();
        }
      };

      // Always force eager/high priority
      img.loading = 'eager';
      try { img.fetchPriority = 'high'; } catch (_) {}
      img.decoding = 'async';

      // If we have a lazy source, promote it
      if (img.dataset && img.dataset.src) {
        // attach listeners BEFORE setting src
        img.addEventListener('load', settle, { once: true });
        // don't resolve on error — we only reveal on successful loads
        img.src = img.dataset.src;
        img.removeAttribute('data-src');

        if (img.complete && img.naturalWidth > 0) settle();
        return;
      }

      // Already has a real src
      if (img.complete && img.naturalWidth > 0) { settle(); return; }
      img.addEventListener('load', settle, { once: true });
    });
  }

  // Wrap every 4 .gallery-item into a logical "row" (display: contents)
  function ensureRows(grid) {
    let rows = Array.from(grid.querySelectorAll('.gallery-row'));
    if (rows.length) return rows;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    for (let i = 0; i < items.length; i += 4) {
      const wrap = document.createElement('div');
      wrap.className = 'gallery-row';
      wrap.style.display = 'contents';
      const slice = items.slice(i, i + 4);
      slice[0].parentNode.insertBefore(wrap, slice[0]);
      slice.forEach((el) => wrap.appendChild(el));
    }
    rows = Array.from(grid.querySelectorAll('.gallery-row'));
    return rows;
  }

    // Load and reveal rows strictly in DOM order; each row reveals when all 4 ready
    async function loadAndRevealGrid(grid) {
    if (grid.__started) return;
    grid.__started = true;

    const rows = ensureRows(grid);
    debug('rows found:', rows.length);

    const vh = window.innerHeight || document.documentElement.clientHeight;

    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const inView = rect.top <= vh && rect.bottom >= 0;
      if (inView) primeRowImages(row);
    });

    // force-hide all images immediately (in case browser painted before JS ran)
    grid.querySelectorAll('img').forEach((img) => {
      img.style.opacity = '0';
      img.style.transform = 'translateY(8px)';
    });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];

      // Wait for all images in this row to be truly ready (loaded + decoded)
      const { ok, imgs } = await waitRowStrict(row);

      // Optional: tiny settle for the first row when it was visible at init
      if (r === 0) {
        const rect0 = row.getBoundingClientRect();
        const inView0 = rect0.top <= vh && rect0.bottom >= 0;
        if (inView0) await new Promise((res) => setTimeout(res, 180));
      }

      if (ok) {
        row.classList.add('row-visible');
        imgs.forEach((img) => {
          img.classList.add('is-loaded');
          img.style.removeProperty('opacity');
          img.style.removeProperty('transform');
        });
      }

      debug(`row ${r + 1}: revealed`);
    }
  }

  // end of loadgrid

  
  // Start the load when the gallery top reaches viewport top (or is already visible)
  function kickWhenTopReachesViewport(grid) {
    let kicked = false;

    const start = () => {
      if (kicked) return;
      kicked = true;
      try { io && io.disconnect(); } catch (_) {}
      loadAndRevealGrid(grid).catch((e) => console.error('[gallery] error:', e));
    };

    // If already visible at load, start immediately
    const rect = grid.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top <= vh && rect.bottom >= 0) {
      debug('already in view → start now');
      start();
      return;
    }

    // IntersectionObserver
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            debug('IO fired → start');
            start();
            io.unobserve(e.target); // prevent retrigger
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -20% 0px', // start when ~20% from bottom
        threshold: 0.2,                 // 20% of element visible
      }
    );
    io.observe(grid);

    // Safety net: if IO fails for some reason, start after a short delay
    setTimeout(() => {
      if (!kicked) {
        debug('fallback timer → start');
        start();
      }
    }, 1500);
  }

  // --- init ------------------------------------------------------------------
  function init() {
    const grids = Array.from(document.querySelectorAll('.gallery-grid'));
    if (!grids.length) return;
    grids.forEach((g) => kickWhenTopReachesViewport(g));
  }

  // Run ASAP; also on DOMContentLoaded just in case this file is in <head>
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
