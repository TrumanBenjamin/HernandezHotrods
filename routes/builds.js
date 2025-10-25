const express = require('express');
const router = express.Router();
const db = require('../db');

// ─────────────────────────────────────────────
// GET /builds — New Landing Page (Two-column UI)
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
  res.render('builds/index', { title: 'Builds', bodyClass: 'builds-index gate-hover'});
});

// ─────────────────────────────────────────────
// GET /builds/current — Filtered list (optional)
// ─────────────────────────────────────────────
router.get('/current', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT slug, name, subtitle, thumb_image2,
             COALESCE(thumb_image, hero_image) AS image
      FROM builds
      WHERE is_published = TRUE AND is_completed = FALSE
      ORDER BY created_at DESC
    `);


    res.render('builds/current', { title: 'Current Builds', builds: rows, bodyClass: 'builds-current gate-hover' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /builds/completed — Filtered list (optional)
// ─────────────────────────────────────────────
router.get('/completed', async (req, res, next) => {
  try { 
    const { rows } = await db.query(`
      SELECT slug, name, subtitle, thumb_image2,
             COALESCE(thumb_image, hero_image) AS image
      FROM builds
      WHERE is_published = TRUE AND is_completed = TRUE
      ORDER BY created_at DESC
    `);

    res.render('builds/completed', { title: 'Completed Builds', builds: rows, bodyClass: 'builds-completed gate-hover' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /builds/:slug — Detail page (show.ejs)
// ─────────────────────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows: buildRows } = await db.query(
      `SELECT id, slug, name, subtitle, hero_image, thumb_image, owner_name, is_completed::boolean AS is_completed
       FROM builds
       WHERE slug = $1 AND is_published = TRUE
       LIMIT 1`,
      [req.params.slug]
    );
    if (!buildRows.length) return next();
    const build = buildRows[0];

    const { rows: photos } = await db.query(
      `SELECT url, alt
       FROM build_photos
       WHERE build_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [build.id]
    );

    const { rows: sections } = await db.query(
      `SELECT s.id, s.title, s.sort_order,
              COALESCE(
                json_agg(
                  json_build_object('text', i.text, 'sort_order', i.sort_order)
                  ORDER BY i.sort_order, i.id
                ) FILTER (WHERE i.id IS NOT NULL),
                '[]'
              ) AS items
       FROM build_sections s
       LEFT JOIN build_section_items i ON i.section_id = s.id
       WHERE s.build_id = $1
       GROUP BY s.id
       ORDER BY s.sort_order ASC, s.id ASC`,
      [build.id]
    );

    const blocks = sections.map((sec, idx) => {
      const ph = photos[idx];
      return {
        title: sec.title,
        items: Array.isArray(sec.items) ? sec.items : JSON.parse(sec.items || '[]'),
        imageUrl: ph ? ph.url : (build.hero_image || null),
        imageAlt: ph ? (ph.alt || `${build.name} — ${sec.title}`) : `${build.name} — ${sec.title}`
      };
    });

    const extraPhotos = photos.slice(blocks.length);

    const view = build.is_completed ? 'builds/show' : 'builds/show-current';

    res.render(view, {
      title: build.name,
      build,
      blocks,
      extraPhotos
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
