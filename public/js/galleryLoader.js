// /public/js/galleryLoader.js
(function () {
  // runs after HTML parse because we load with `defer`
  const grids = Array.from(document.querySelectorAll('.gallery-grid'));
  if (!grids.length) return;

  // Promote data-src -> src (lazy); resolve when REAL image finished (or errored)
    // Promote data-src -> src and resolve when the REAL image finishes (or errored)
    const waitImg = (img) => new Promise((resolve) => {
    const done = () => resolve();

    if (img.dataset && img.dataset.src) {
        // 1) attach listeners first to avoid cache race
        img.addEventListener('load',  done, { once: true });
        img.addEventListener('error', done, { once: true });

        // 2) now promote to real src
        const next = img.dataset.src;
        if (!img.src || img.src.startsWith('data:image/')) {
        img.src = next;
        }
        img.removeAttribute('data-src');

        // 3) if it was already complete from cache, resolve immediately
        if (img.complete && img.naturalWidth > 0) done();
        return;
    }

    // Non-lazy case
    if (img.complete && img.naturalWidth > 0) {
        done();
    } else {
        img.addEventListener('load',  done, { once: true });
        img.addEventListener('error', done, { once: true });
    }
    });


  // If a grid is missing wrappers for some reason, add them in chunks of 4 (doesn't break grid layout)
  const ensureRows = (grid) => {
    let rows = Array.from(grid.querySelectorAll('.gallery-row'));
    if (rows.length) return rows;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    for (let i = 0; i < items.length; i += 4) {
      const wrap = document.createElement('div');
      wrap.className = 'gallery-row';
      wrap.style.display = 'contents';
      const slice = items.slice(i, i + 4);
      slice[0].parentNode.insertBefore(wrap, slice[0]);
      slice.forEach(el => wrap.appendChild(el));
    }
    return Array.from(grid.querySelectorAll('.gallery-row'));
  };

  // Build a single, global list of all rows across the page in DOM order (top → bottom)
  const buildGlobalRowList = () => {
    const rows = [];
    grids.forEach(grid => {
      ensureRows(grid).forEach(row => rows.push(row));
    });
    return rows; // querySelectorAll yields DOM order already
  };

  const revealRowsSequentially = async () => {
    const rows = buildGlobalRowList();
    for (const row of rows) {
      const imgs = Array.from(row.querySelectorAll('img'));
      if (imgs.length) {
        await Promise.all(imgs.map(waitImg));  // wait for ALL imgs in this row
      }
      row.classList.add('row-visible');        // reveal the row together
    }
  };

  // go
  revealRowsSequentially().catch(err => console.error('gallery loader:', err));
})();
