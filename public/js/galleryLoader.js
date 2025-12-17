// /public/js/galleryLoader.js
(function () {
  const debug = (...args) => console.log('[gallery]', ...args);

  // --- helpers ---
  async function waitRowStrict(row) {
    const imgs = Array.from(row.querySelectorAll('.gallery-item img'));

    imgs.forEach((img) => {
      img.style.opacity = '0';
      img.style.transform = 'translateY(8px)';
      img.loading = 'eager';
      try { img.fetchPriority = 'high'; } catch (_) {}
      img.decoding = 'async';
      if (img.dataset && img.dataset.src) {
        img._hlrPromoted = true;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });

    const waitOne = (img) =>
      new Promise((resolve) => {
        const finalize = () => {
          const d = img.decode ? img.decode() : Promise.resolve();
          d.catch(() => {}).finally(resolve);
        };

        if (img.complete && img.naturalWidth > 0) return finalize();
        img.addEventListener('load', finalize, { once: true });
      });

    await Promise.all(imgs.map(waitOne));

    if (!imgs.every(i => i.complete && i.naturalWidth > 0)) {
      await new Promise(r => requestAnimationFrame(r));
      if (!imgs.every(i => i.complete && i.naturalWidth > 0)) return { ok:false, imgs };
    }

    return { ok:true, imgs };
  }
  
  function primeRowImages(row) {
    const imgs = Array.from(row.querySelectorAll('.gallery-item')).map(ensureImgForItem);
    imgs.forEach((img) => {
      img.style.opacity = '0';
      img.style.transform = 'translateY(8px)';

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
      img.loading = 'eager';
      if (item.dataset.src) img.dataset.src = item.dataset.src;
      if (item.dataset.alt) img.alt = item.dataset.alt;
      if (item.dataset.w) img.width = parseInt(item.dataset.w, 10);
      if (item.dataset.h) img.height = parseInt(item.dataset.h, 10);
      item.appendChild(img);
    } else {
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

  function waitImg(img) {
    return new Promise((resolve) => {
      const settle = () => {
        if (img.decode) {
          img.decode().catch(() => {}).finally(resolve);
        } else {
          resolve();
        }
      };

      img.loading = 'eager';
      try { img.fetchPriority = 'high'; } catch (_) {}
      img.decoding = 'async';

      if (img.dataset && img.dataset.src) {
        img.addEventListener('load', settle, { once: true });
        img.src = img.dataset.src;
        img.removeAttribute('data-src');

        if (img.complete && img.naturalWidth > 0) settle();
        return;
      }

      if (img.complete && img.naturalWidth > 0) { settle(); return; }
      img.addEventListener('load', settle, { once: true });
    });
  }

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

    grid.querySelectorAll('img').forEach((img) => {
      img.style.opacity = '0';
      img.style.transform = 'translateY(8px)';
    });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];

      const { ok, imgs } = await waitRowStrict(row);

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

  
  // Start the load when the gallery top reaches viewport top
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
            io.unobserve(e.target);
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -20% 0px',
        threshold: 0.2,               
      }
    );
    io.observe(grid);

    setTimeout(() => {
      if (!kicked) {
        debug('fallback timer → start');
        start();
      }
    }, 1500);
  }

  // --- init ---
  function init() {
    const grids = Array.from(document.querySelectorAll('.gallery-grid'));
    if (!grids.length) return;
    grids.forEach((g) => kickWhenTopReachesViewport(g));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
