const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs/promises');

const db = require('../db');
const { ensureAuth } = require('../middleware/auth');
const upload = require('../middleware/upload'); // your multer config (upload.array(...))

/* --------------------------------- helpers -------------------------------- */

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Move uploaded files from tmp to public/uploads/builds/:buildId
 * and insert rows into build_photos (url [, alt] [, sort_order]).
 */
async function persistPhotos(buildId, files) {
  if (!files?.length) return;

  const destDir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(buildId));
  await ensureDir(destDir);

  // Try to honor sort_order if your table has it
  let nextSort = 1;
  try {
    const { rows } = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS max FROM build_photos WHERE build_id = $1',
      [buildId]
    );
    nextSort = Number(rows?.[0]?.max || 0) + 1;
  } catch {
    // table may not have sort_order — that's fine
  }

  for (const f of files) {
    const filename = f.originalname;
    const destPath = path.join(destDir, filename);
    await fs.rename(f.path, destPath);

    const webPath = `/uploads/builds/${buildId}/${filename}`;

    // Try insert with sort_order; if it errors, fall back to url-only
    try {
      await db.query(
        `INSERT INTO build_photos (build_id, url, sort_order)
         VALUES ($1, $2, $3)`,
        [buildId, webPath, nextSort++]
      );
    } catch {
      await db.query(
        `INSERT INTO build_photos (build_id, url)
         VALUES ($1, $2)`,
        [buildId, webPath]
      );
    }
  }
}
// ----------------- add current ---------------
router.post(
  '/admin/builds/add',
  ensureAuth, 
  upload.fields([
    { name: 'thumb_image', maxCount: 1 },
    { name: 'hero_image',  maxCount: 1 },
    { name: 'photos',      maxCount: 400 }, // additional gallery
  ]),
  async (req, res, next) => {
    const { owner_name, name, subtitle } = req.body;
    if (!owner_name || !name || !subtitle) return res.redirect('/admin');

    const slug = slugify(name);
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 1) Insert build
      const insertBuild = `
        INSERT INTO builds (slug, name, subtitle, owner_name, is_published, is_completed)
        VALUES ($1,$2,$3,$4,TRUE,FALSE)
        RETURNING id
      `;
      const { rows } = await client.query(insertBuild, [slug, name, subtitle, owner_name]);
      const buildId = rows[0].id;

      const destDir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(buildId));
      await ensureDir(destDir);

      const saveToBuildCol = async (file, filename, colName) => {
        if (!file) return;
        const destPath = path.join(destDir, filename);
        await fs.rename(file.path, destPath);
        const webPath = `/uploads/builds/${buildId}/${filename}`;
        await client.query(
          `UPDATE builds SET ${colName} = $1, updated_at = NOW() WHERE id = $2`,
          [webPath, buildId]
        );
      };

      // save thumb/hero into builds table
      await saveToBuildCol(req.files.thumb_image?.[0], 'thumb.jpg', 'thumb_image');
      await saveToBuildCol(req.files.hero_image?.[0],  'hero.jpg',  'hero_image');

      // gallery photos start at 1.jpg
      let nextOrder = 1;
      if (req.files.photos?.length) {
        for (const f of req.files.photos) {
          const filename = `${nextOrder}.jpg`;
          const destPath = path.join(destDir, filename);
          await fs.rename(f.path, destPath);

          const webPath = `/uploads/builds/${buildId}/${filename}`;
          await client.query(
            `INSERT INTO build_photos (build_id, url, sort_order) VALUES ($1,$2,$3)`,
            [buildId, webPath, nextOrder]
          );
          nextOrder++;
        }
      }
      await client.query('COMMIT');
      res.redirect('/admin');
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// -------- Update Current ------------

router.post(
  '/admin/builds/update',
  ensureAuth,   
  upload.fields([
    { name: 'thumb_image', maxCount: 1 },
    { name: 'hero_image',  maxCount: 1 },
    { name: 'photos',      maxCount: 400 },
  ]),
  async (req, res, next) => {
    const { build_id, owner_name, name, subtitle } = req.body;
    if (!build_id) return res.redirect('/admin');

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // ensure it's a CURRENT build
      const { rows: chk } = await client.query(
        'SELECT id FROM builds WHERE id = $1 AND is_completed = FALSE',
        [build_id]
      );
      if (!chk.length) {
        await client.query('ROLLBACK');
        return res.redirect('/admin');
      }

      // Update text fields if provided
      const sets = [];
      const vals = [];
      let i = 1;

      if (owner_name) { sets.push(`owner_name = $${i++}`); vals.push(owner_name); }
      if (name)       { sets.push(`name = $${i++}`);       vals.push(name);
                        sets.push(`slug = $${i++}`);       vals.push(slugify(name)); }
      if (subtitle)   { sets.push(`subtitle = $${i++}`);   vals.push(subtitle); }

      if (sets.length) {
        vals.push(build_id);
        await client.query(
          `UPDATE builds SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
          vals
        );
      }

      // Prepare dest dir
      const destDir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(build_id));
      await ensureDir(destDir);

      const replaceBuildColumn = async (file, filename, colName) => {
        if (!file) return;
        const destPath = path.join(destDir, filename);
        await fs.rename(file.path, destPath);
        const webPath = `/uploads/builds/${build_id}/${filename}`;

        // (optional) clean up any legacy photo row that pointed to this path
        await client.query(`DELETE FROM build_photos WHERE build_id=$1 AND url=$2`, [build_id, webPath]);

        // update the builds column
        await client.query(
          `UPDATE builds SET ${colName} = $1, updated_at = NOW() WHERE id = $2`,
          [webPath, build_id]
        );
      };

      // If new fixed images were uploaded, replace them in the builds row
      await replaceBuildColumn(req.files.thumb_image?.[0], 'thumb.jpg', 'thumb_image');
      await replaceBuildColumn(req.files.hero_image?.[0],  'hero.jpg',  'hero_image');

      // append new gallery photos
      let nextOrder = 1;
      const { rows: maxRows } = await client.query(
        `SELECT COALESCE(MAX(sort_order), 0) AS max FROM build_photos WHERE build_id=$1`,
        [build_id]
      );
      nextOrder = Number(maxRows[0].max) + 1;

      if (req.files.photos?.length) {
        for (const f of req.files.photos) {
          const filename = `${nextOrder}.jpg`;
          const destPath = path.join(destDir, filename);
          await fs.rename(f.path, destPath);

          const webPath = `/uploads/builds/${build_id}/${filename}`;
          await client.query(
            `INSERT INTO build_photos (build_id, url, sort_order) VALUES ($1,$2,$3)`,
            [build_id, webPath, nextOrder]
          );
          nextOrder++;
        }
      }

      await client.query('COMMIT');
      res.redirect('/admin');
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

/* ---------------------------- DELETE (current) ---------------------------- */
/**
 * POST /admin/builds/delete
 * Body:
 *  - build_id (required)
 *
 * Removes photos, section items/sections (if present), and the build itself.
 * Uses a transaction; adjust if you have ON DELETE CASCADE constraints.
 */
router.post('/admin/builds/delete', ensureAuth, async (req, res, next) => {
  const { build_id } = req.body;
  if (!build_id) return res.redirect('/admin');

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Ensure it's a CURRENT build
    const { rows: chk } = await client.query(
      'SELECT id FROM builds WHERE id = $1 AND is_completed = FALSE',
      [build_id]
    );
    if (!chk.length) {
      await client.query('ROLLBACK');
      return res.redirect('/admin');
    }

    // Delete dependent rows first if no cascade
    try { await client.query('DELETE FROM build_section_items WHERE section_id IN (SELECT id FROM build_sections WHERE build_id = $1)', [build_id]); } catch {}
    try { await client.query('DELETE FROM build_sections WHERE build_id = $1', [build_id]); } catch {}
    try { await client.query('DELETE FROM build_photos WHERE build_id = $1', [build_id]); } catch {}

    await client.query('DELETE FROM builds WHERE id = $1', [build_id]);

    // Optionally remove uploaded folder from disk
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(build_id));
    try { await fs.rm(dir, { recursive: true, force: true }); } catch {}

    await client.query('COMMIT');
    res.redirect('/admin');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

/* ------------------------------ ADD (completed) ------------------------------ */
/**
 * POST /admin/builds/add-completed
 * Receives (multipart/form-data):
 *  - owner_name (required)
 *  - name (required)
 *  - subtitle (optional)
 *  - sections[engine][], sections[chassis][], sections[interior][], sections[body][]
 *  - thumb_image, hero_image, image_engine, image_chassis, image_interior, image_body (single each)
 *  - photos[] (extra gallery, multiple)
 */
router.post(
  '/admin/builds/add-completed',
  ensureAuth,
  upload.fields([
    { name: 'thumb_image',    maxCount: 1 },
    { name: 'hero_image',     maxCount: 1 },
    { name: 'image_engine',   maxCount: 1 },
    { name: 'image_chassis',  maxCount: 1 },
    { name: 'image_interior', maxCount: 1 },
    { name: 'image_body',     maxCount: 1 },
    { name: 'photos',         maxCount: 400 },
  ]),
  async (req, res, next) => {
    const { owner_name, name, subtitle = '', sections = {} } = req.body;
    if (!owner_name || !name) return res.redirect('/admin');

    const slug = slugify(name);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1) Create the build
      const { rows: buildRows } = await client.query(
        `INSERT INTO builds (slug, name, subtitle, owner_name, is_published, is_completed)
         VALUES ($1,$2,$3,$4,TRUE,TRUE)
         RETURNING id`,
        [slug, name, subtitle, owner_name]
      );
      const buildId = buildRows[0].id;

      // 2) Prepare destination folder
      const destDir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(buildId));
      await ensureDir(destDir);

      // helper to save a fixed file and return its web path
      const saveFixed = async (file, filename) => {
        if (!file) return null;
        const destPath = path.join(destDir, filename);
        await fs.rename(file.path, destPath);
        return `/uploads/builds/${buildId}/${filename}`;
      };

      // save thumb & hero, update the builds row
      const thumbWeb = await saveFixed(req.files.thumb_image?.[0], 'thumb.jpg');
      const heroWeb  = await saveFixed(req.files.hero_image?.[0],  'hero.jpg');

      await client.query(
        `UPDATE builds
        SET thumb_image = $1, hero_image = $2, updated_at = NOW()
        WHERE id = $3`,
        [thumbWeb, heroWeb, buildId]
      );

        // 3) Helper to rename an uploaded file and insert a photo row
       const moveAndInsert = async (file, filename, altText, sortOrder) => {
        if (!file) return;
        const destPath = path.join(destDir, filename);

        // Ensure extension is .jpg in your store; if different, you can transcode later.
        // For now we just rename to your convention, regardless of original extension.
        await fs.rename(file.path, destPath);

        const webPath = `/uploads/builds/${buildId}/${filename}`;
        await client.query(
          `INSERT INTO build_photos (build_id, url, alt, sort_order)
           VALUES ($1,$2,$3,$4)`,
          [buildId, webPath, altText || null, sortOrder]
        );
      };

      // 4) Save the six “fixed” images with your exact names
      await moveAndInsert(req.files.image_engine?.[0],   '1.jpg',     'Engine section',      1);
      await moveAndInsert(req.files.image_chassis?.[0],  '2.jpg',     'Chassis section',     2);
      await moveAndInsert(req.files.image_interior?.[0], '3.jpg',     'Interior section',    3);
      await moveAndInsert(req.files.image_body?.[0],     '4.jpg',     'Body & Paint section',4);

      // 5) Additional photos start at 5.jpg
      let nextOrder = 5;
      if (req.files.photos?.length) {
        for (const f of req.files.photos) {
          const filename = `${nextOrder}.jpg`;
          const destPath = path.join(destDir, filename);
          await fs.rename(f.path, destPath);

          const webPath = `/uploads/builds/${buildId}/${filename}`;
          await client.query(
            `INSERT INTO build_photos (build_id, url, sort_order) VALUES ($1,$2,$3)`,
            [buildId, webPath, nextOrder]
          );

          nextOrder++;
        }
      }

      // 6) Insert the four sections + bullet items (rows in build_sections + build_section_items)
      const SECTIONS = [
        { key: 'engine',   title: 'Engine & Drivetrain' },
        { key: 'chassis',  title: 'Chassis & Suspension' },
        { key: 'interior', title: 'Interior & Electronics' },
        { key: 'body',     title: 'Body & Paint' },
      ];

      for (let i = 0; i < SECTIONS.length; i++) {
        const s = SECTIONS[i];
        const secRes = await client.query(
          `INSERT INTO build_sections (build_id, title, sort_order)
           VALUES ($1,$2,$3)
           RETURNING id`,
          [buildId, s.title, i + 1]
        );
        const sectionId = secRes.rows[0].id;

        const items = Array.isArray(sections[s.key]) ? sections[s.key] : (sections[s.key] ? [sections[s.key]] : []);
        const cleaned = items.map(t => String(t).trim()).filter(Boolean);

        for (let j = 0; j < cleaned.length; j++) {
          await client.query(
            `INSERT INTO build_section_items (section_id, text, sort_order)
             VALUES ($1,$2,$3)`,
            [sectionId, cleaned[j], j + 1]
          );
        }
      }

      await client.query('COMMIT');
      res.redirect('/admin');
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// ----------- update completed ----------------- // 

const completedFields = [
  { name: 'thumb_image',    maxCount: 1 },
  { name: 'hero_image',     maxCount: 1 },
  { name: 'image_engine',   maxCount: 1 },
  { name: 'image_chassis',  maxCount: 1 },
  { name: 'image_interior', maxCount: 1 },
  { name: 'image_body',     maxCount: 1 },
  { name: 'photos',         maxCount: 400 },
];

router.post(
  '/admin/builds/update-completed',
  ensureAuth,
  upload.fields(completedFields),
  async (req, res, next) => {
    const { build_id, owner_name, name, subtitle, sections = {} } = req.body;
    if (!build_id) return res.redirect('/admin');

    const client = await db.connect(); // or db.pool.connect() if that's your interface
    try {
      await client.query('BEGIN');

      // Ensure this is a COMPLETED build
      const { rows: chk } = await client.query(
        'SELECT id FROM builds WHERE id = $1 AND is_completed = TRUE',
        [build_id]
      );
      if (!chk.length) {
        await client.query('ROLLBACK');
        return res.redirect('/admin');
      }

      // Update text fields if present
      const sets = [];
      const vals = [];
      let i = 1;
      if (owner_name) { sets.push(`owner_name = $${i++}`); vals.push(owner_name); }
      if (name)       { sets.push(`name = $${i++}`);       vals.push(name);
                        sets.push(`slug = $${i++}`);       vals.push(slugify(name)); }
      if (subtitle)   { sets.push(`subtitle = $${i++}`);   vals.push(subtitle); }

      if (sets.length) {
        vals.push(build_id);
        await client.query(
          `UPDATE builds SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
          vals
        );
      }

      // Destination dir for files
      const destDir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(build_id));
      await ensureDir(destDir);

      // --- Helpers ---
      const saveReplaceBuildColumn = async (file, filename, column) => {
        if (!file) return;
        const destPath = path.join(destDir, filename);
        await fs.rename(file.path, destPath);
        const webPath = `/uploads/builds/${build_id}/${filename}`;
        // (optional) remove any legacy photo row that used to point at this URL
        await client.query(`DELETE FROM build_photos WHERE build_id=$1 AND url=$2`, [build_id, webPath]);
        await client.query(
          `UPDATE builds SET ${column} = $1, updated_at = NOW() WHERE id = $2`,
          [webPath, build_id]
        );
      };

      const replaceFixedPhoto = async (file, filename, altText, sortOrder) => {
        if (!file) return;
        const destPath = path.join(destDir, filename);
        await fs.rename(file.path, destPath);
        const webPath = `/uploads/builds/${build_id}/${filename}`;
        // replace existing DB row for that numbered slot
        await client.query(`DELETE FROM build_photos WHERE build_id=$1 AND url=$2`, [build_id, webPath]);
        await client.query(
          `INSERT INTO build_photos (build_id, url, alt, sort_order) VALUES ($1,$2,$3,$4)`,
          [build_id, webPath, altText || null, sortOrder]
        );
      };

      // 1) Replace thumb/hero -> update columns on builds
      await saveReplaceBuildColumn(req.files.thumb_image?.[0], 'thumb.jpg', 'thumb_image');
      await saveReplaceBuildColumn(req.files.hero_image?.[0],  'hero.jpg',  'hero_image');

      // 2) Replace numbered section images in build_photos (1..4)
      await replaceFixedPhoto(req.files.image_engine?.[0],   '1.jpg', 'Engine section',   1);
      await replaceFixedPhoto(req.files.image_chassis?.[0],  '2.jpg', 'Chassis section',  2);
      await replaceFixedPhoto(req.files.image_interior?.[0], '3.jpg', 'Interior section', 3);
      await replaceFixedPhoto(req.files.image_body?.[0],     '4.jpg', 'Body & Paint',     4);

      // 3) Append extra photos (start at 5.jpg)
      let nextOrder = 5;
      const { rows: maxRows } = await client.query(
        `SELECT COALESCE(MAX(sort_order), 4) AS max
           FROM build_photos
          WHERE build_id=$1 AND sort_order >= 5`,
        [build_id]
      );
      nextOrder = Math.max(5, Number(maxRows[0].max) + 1);

      if (req.files.photos?.length) {
        for (const f of req.files.photos) {
          const filename = `${nextOrder}.jpg`;
          const destPath = path.join(destDir, filename);
          await fs.rename(f.path, destPath);
          const webPath = `/uploads/builds/${build_id}/${filename}`;
          await client.query(
            `INSERT INTO build_photos (build_id, url, sort_order) VALUES ($1,$2,$3)`,
            [build_id, webPath, nextOrder]
          );
          nextOrder++;
        }
      }

      // 4) Append new bullets to sections (create section if missing)
      const META = [
        { key: 'engine',   title: 'Engine & Drivetrain',    sort: 1 },
        { key: 'chassis',  title: 'Chassis & Suspension',   sort: 2 },
        { key: 'interior', title: 'Interior & Electronics', sort: 3 },
        { key: 'body',     title: 'Body & Paint',           sort: 4 },
      ];

      for (const s of META) {
        const incoming = Array.isArray(sections[s.key]) ? sections[s.key] : (sections[s.key] ? [sections[s.key]] : []);
        const cleaned = incoming.map(v => String(v).trim()).filter(Boolean);
        if (!cleaned.length) continue;

        // find or create the section
        const { rows: secRows } = await client.query(
          `SELECT id FROM build_sections WHERE build_id=$1 AND title=$2`,
          [build_id, s.title]
        );
        let sectionId = secRows[0]?.id;
        if (!sectionId) {
          const { rows: ins } = await client.query(
            `INSERT INTO build_sections (build_id, title, sort_order) VALUES ($1,$2,$3) RETURNING id`,
            [build_id, s.title, s.sort]
          );
          sectionId = ins[0].id;
        }

        // append items at next sort
        const { rows: maxItem } = await client.query(
          `SELECT COALESCE(MAX(sort_order), 0) AS max FROM build_section_items WHERE section_id=$1`,
          [sectionId]
        );
        let next = Number(maxItem[0].max) + 1;

        for (const txt of cleaned) {
          await client.query(
            `INSERT INTO build_section_items (section_id, text, sort_order) VALUES ($1,$2,$3)`,
            [sectionId, txt, next++]
          );
        }
      }

      await client.query('COMMIT');
      res.redirect('/admin');
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// ===== Completed build: section items API =====

// Map section titles <-> keys once, so the client can stay key-based
const SECTION_META = [
  { key: 'engine',   title: 'Engine & Drivetrain' },
  { key: 'chassis',  title: 'Chassis & Suspension' },
  { key: 'interior', title: 'Interior & Electronics' },
  { key: 'body',     title: 'Body & Paint' },
];

// GET existing sections + items for a completed build
router.get('/admin/builds/:id/sections', ensureAuth, async (req, res, next) => {
  try {
    const buildId = req.params.id;
    // ensure it’s a completed build
    const ok = await db.query(
      'SELECT 1 FROM builds WHERE id=$1 AND is_completed=TRUE',
      [buildId]
    );
    if (!ok.rows.length) return res.status(404).json({ ok:false, error:'Not found' });

    const { rows: secs } = await db.query(
      'SELECT id, title, sort_order FROM build_sections WHERE build_id=$1 ORDER BY sort_order ASC',
      [buildId]
    );
    const secIds = secs.map(s => s.id);
    let items = [];
    if (secIds.length) {
      const { rows } = await db.query(
        `SELECT id, section_id, text, sort_order
           FROM build_section_items
          WHERE section_id = ANY($1::int[])
          ORDER BY sort_order ASC`,
        [secIds]
      );
      items = rows;
    }

    // group by key (engine/chassis/…)
    const byTitle = Object.fromEntries(SECTION_META.map(s => [s.title, s.key]));
    const payload = {};
    for (const s of secs) {
      const key = byTitle[s.title] || s.title; // fallback to title
      payload[key] = {
        section_id: s.id,
        title: s.title,
        items: items.filter(i => i.section_id === s.id)
      };
    }
    // ensure all four keys exist
    for (const m of SECTION_META) {
      if (!payload[m.key]) payload[m.key] = { section_id: null, title: m.title, items: [] };
    }
    res.json({ ok:true, sections: payload });
  } catch (e) { next(e); }
});

// Update a single bullet’s text
router.post('/admin/builds/section-item/update', ensureAuth, upload.none(), async (req, res, next) => {
  const { item_id, text } = req.body;
  if (!item_id || typeof text !== 'string') return res.status(400).json({ ok:false, error:'Missing fields' });
  try {
    await db.query('UPDATE build_section_items SET text=$1 WHERE id=$2', [text.trim(), item_id]);
    res.json({ ok:true });
  } catch (e) { next(e); }
});

// Delete a single bullet (and compact sort_order within its section)
router.post('/admin/builds/section-item/delete', ensureAuth, upload.none(), async (req, res, next) => {
  const { item_id } = req.body;
  if (!item_id) return res.status(400).json({ ok:false, error:'Missing item_id' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT section_id, sort_order FROM build_section_items WHERE id=$1',
      [item_id]
    );
    const row = rows[0];
    if (!row) { await client.query('ROLLBACK'); return res.status(404).json({ ok:false, error:'Not found' }); }

    await client.query('DELETE FROM build_section_items WHERE id=$1', [item_id]);
    await client.query(
      'UPDATE build_section_items SET sort_order = sort_order - 1 WHERE section_id=$1 AND sort_order > $2',
      [row.section_id, row.sort_order]
    );
    await client.query('COMMIT');
    res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK'); next(e);
  } finally { client.release(); }
}); 






/* -------------------------- DELETE (completed) -------------------------- */
/**
 * POST /admin/builds/delete-completed
 * Body: build_id (required)
 *
 * Removes photos, section items/sections, and the completed build itself.
 * Uses a transaction; adjust if you rely on ON DELETE CASCADE.
 */
router.post('/admin/builds/delete-completed', ensureAuth, async (req, res, next) => {
  const { build_id } = req.body;
  if (!build_id) return res.redirect('/admin');

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Ensure it's a COMPLETED build
    const { rows: chk } = await client.query(
      'SELECT id FROM builds WHERE id = $1 AND is_completed = TRUE',
      [build_id]
    );
    if (!chk.length) {
      await client.query('ROLLBACK');
      return res.redirect('/admin');
    }

    // Delete dependent rows first (if you don't have CASCADE)
    try {
      // Items -> Sections
      await client.query(
        'DELETE FROM build_section_items WHERE section_id IN (SELECT id FROM build_sections WHERE build_id = $1)',
        [build_id]
      );
    } catch {}
    try {
      await client.query('DELETE FROM build_sections WHERE build_id = $1', [build_id]);
    } catch {}
    try {
      await client.query('DELETE FROM build_photos WHERE build_id = $1', [build_id]);
    } catch {}

    // Finally delete the build
    await client.query('DELETE FROM builds WHERE id = $1', [build_id]);

    // Remove uploaded folder from disk
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(build_id));
    try { await fs.rm(dir, { recursive: true, force: true }); } catch {}

    await client.query('COMMIT');
    res.redirect('/admin');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------- Add For Sale ------------------- //

// Save photos to /public/uploads/for-sale/<item_id>/ and INSERT rows
async function saveForSalePhotos(client, itemId, files) {
  if (!files || !files.length) return;

  const dir = path.join(__dirname, '..', 'public', 'uploads', 'for-sale', String(itemId));
  await fs.mkdir(dir, { recursive: true });

  // keep order of upload as sort_order 1..n
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const dest = path.join(dir, f.originalname);
    await fs.rename(f.path, dest);

    const url = `/uploads/for-sale/${itemId}/${f.originalname}`;
    await client.query(
      `INSERT INTO for_sale_photos (item_id, url, alt, sort_order)
       VALUES ($1, $2, NULL, $3)`,
      [itemId, url, i + 1]
    );
  }
}

/**
 * POST /admin/for-sale/add
 * Body: title (required), description (optional)
 * Files: photos[] (0..16 images)
 */
router.post(
  '/admin/for-sale/add',
  ensureAuth,
  upload.array('photos', 16),
  async (req, res, next) => {
    const { title, description } = req.body;
    if (!title || !title.trim()) return res.redirect('/admin');

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const slug = slugify(title);

      // create the item; default active, not sold, set posted_at now()
      const { rows } = await client.query(
        `INSERT INTO for_sale_items (slug, title, description, is_active, is_sold, posted_at)
         VALUES ($1, $2, $3, TRUE, FALSE, NOW())
         RETURNING id`,
        [slug, title.trim(), (description || '').trim()]
      );
      const itemId = rows[0].id;

      // Save photos (if any) and insert for_sale_photos rows
      await saveForSalePhotos(client, itemId, req.files);

      await client.query('COMMIT');
      res.redirect('/admin'); // or wherever your dashboard lives
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// ---------------- Update For Sale ------------------- //
// ─────────── For-Sale: photo listing / replace / delete (new) ─────────── //

/** small helper to resolve "/uploads/..." -> absolute path under /public */
const toPublicAbs = (u) =>
  path.join(__dirname, '..', 'public', String(u).replace(/^[\\/]+/, '').replace(/\//g, path.sep));

/**
 * GET /admin/for-sale/:id/photos
 * Returns [{ id, url, sort_order }] for the admin grid.
 */
router.get('/admin/for-sale/:id/photos', ensureAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, url, sort_order FROM for_sale_photos WHERE item_id = $1 ORDER BY sort_order ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post(
  '/admin/for-sale/photo/replace',
  ensureAuth,
  upload.single('new_photo'),
  async (req, res, next) => {
    const { item_id, photo_id } = req.body;
    if (!item_id || !photo_id || !req.file) return res.redirect('/admin');

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await db.query(
        'SELECT url FROM for_sale_photos WHERE id=$1 AND item_id=$2',
        [photo_id, item_id]
      );
      const row = rows[0];
      if (!row) { await client.query('ROLLBACK'); return res.redirect('/admin'); }

      const destAbs = toPublicAbs(row.url);
      await fs.mkdir(path.dirname(destAbs), { recursive: true });
      try { await fs.unlink(destAbs); } catch {}
      await fs.rename(req.file.path, destAbs);

      await client.query('COMMIT');

      const wantsJSON =
        (req.headers.accept && req.headers.accept.includes('application/json')) ||
        req.body.ajax === '1';

      if (wantsJSON) {
        // URL didn’t change; front-end will cache-bust with ?v=timestamp
        return res.json({ ok: true, url: row.url });
      }
      return res.redirect('/admin');
    } catch (e) {
      await client.query('ROLLBACK');
      try { if (req.file?.path) await fs.unlink(req.file.path); } catch {}
      next(e);
    } finally {
      client.release();
    }
  }
);

// MAX photos per for-sale item
const MAX_SALE_PHOTOS = 16;

// Ensure a folder exists
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * POST /admin/for-sale/photos/add
 * Body: item_id
 * Files: photos[] (multiple)
 *
 * Appends up to MAX_SALE_PHOTOS total. If too many selected, only first N are used
 * and the rest are discarded (temp files removed). Responds with JSON for AJAX or
 * redirects with a flash-style message.
 */
router.post(
  '/admin/for-sale/photos/add',
  ensureAuth,
  upload.array('photos', MAX_SALE_PHOTOS), // multer per-request cap (safe guard)
  async (req, res, next) => {
    const wantsJSON =
      (req.headers.accept && req.headers.accept.includes('application/json')) ||
      req.body.ajax === '1';

    const { item_id } = req.body;
    const files = req.files || [];

    if (!item_id) {
      return wantsJSON
        ? res.status(400).json({ ok: false, error: 'Missing item_id' })
        : res.redirect('/admin');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Current count and next sort slot
      const { rows: cntRows } = await client.query(
        'SELECT COUNT(*)::int AS n FROM for_sale_photos WHERE item_id = $1',
        [item_id]
      );
      const have = Number(cntRows[0]?.n || 0);
      const room = Math.max(0, MAX_SALE_PHOTOS - have);

      if (room === 0 || files.length === 0) {
        await client.query('ROLLBACK');
        const msg = room === 0
          ? `This item already has the maximum of ${MAX_SALE_PHOTOS} photos.`
          : 'No files selected.';
        return wantsJSON ? res.status(400).json({ ok: false, error: msg })
                         : res.redirect('/admin?msg=' + encodeURIComponent(msg));
      }

      // Keep only as many as will fit; delete the rest from tmp
      const allowed = files.slice(0, room);
      const extra = files.slice(room);
      for (const f of extra) { try { await fs.unlink(f.path); } catch {} }

      // Prepare destination folder
      const destDir = path.join(__dirname, '..', 'public', 'uploads', 'for-sale', String(item_id));
      await ensureDir(destDir);

      // Determine next sort_order accurately
      const { rows: maxRows } = await client.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max FROM for_sale_photos WHERE item_id=$1',
        [item_id]
      );
      let nextOrder = Number(maxRows[0].max) + 1;

      // Move each allowed file and insert row
      let added = 0;
      for (const f of allowed) {
        const filename = `${nextOrder}.jpg`;                       // keep numeric slot filenames
        const destPath = path.join(destDir, filename);
        await fs.rename(f.path, destPath);

        const webPath = `/uploads/for-sale/${item_id}/${filename}`;
        await client.query(
          'INSERT INTO for_sale_photos (item_id, url, sort_order) VALUES ($1,$2,$3)',
          [item_id, webPath, nextOrder]
        );
        nextOrder++;
        added++;
      }

      await client.query('COMMIT');

      const note = added === files.length
        ? `Added ${added} photo(s).`
        : `Added ${added} photo(s). You can only have ${MAX_SALE_PHOTOS} total, so ${files.length - added} were ignored.`;

      return wantsJSON
        ? res.json({ ok: true, added, total_allowed: MAX_SALE_PHOTOS, message: note })
        : res.redirect('/admin?msg=' + encodeURIComponent(note));
    } catch (e) {
      await client.query('ROLLBACK');
      // cleanup any remaining tmp files on error
      try { for (const f of files) if (f.path) await fs.unlink(f.path); } catch {}
      return next(e);
    } finally {
      client.release();
    }
  }
);



/**
 * POST /admin/for-sale/photo/delete
 * Body: item_id, photo_id
 *
 * Deletes the file + row, then compacts sort_order (shifts later photos up by 1).
 * (We do NOT rename files to match the new order; DB order controls gallery.)
 */
router.post('/admin/for-sale/photo/delete', ensureAuth, upload.none(), async (req, res, next) => {
  const wantsJSON =
    (req.headers.accept && req.headers.accept.includes('application/json')) ||
    req.body.ajax === '1';

  const { item_id, photo_id } = req.body;
  if (!item_id || !photo_id) {
    return wantsJSON ? res.status(400).json({ ok: false, error: 'Missing item_id or photo_id' })
                     : res.redirect('/admin');
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // find the row we’re deleting
    const { rows } = await client.query(
      'SELECT url, sort_order FROM for_sale_photos WHERE id=$1 AND item_id=$2',
      [photo_id, item_id]
    );
    const row = rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return wantsJSON ? res.status(404).json({ ok: false, error: 'Photo not found' })
                       : res.redirect('/admin');
    }

    // delete file from disk (best-effort)
    try { await fs.unlink(toPublicAbs(row.url)); } catch {}

    // delete row
    await client.query('DELETE FROM for_sale_photos WHERE id=$1', [photo_id]);

    // compact sort_order so it stays 1..N
    await client.query(
      'UPDATE for_sale_photos SET sort_order = sort_order - 1 WHERE item_id=$1 AND sort_order > $2',
      [item_id, row.sort_order]
    );

    await client.query('COMMIT');

    if (wantsJSON) {
      return res.json({ ok: true, removed_sort_order: row.sort_order });
    }
    return res.redirect('/admin');
  } catch (e) {
    await client.query('ROLLBACK');
    return wantsJSON ? res.status(500).json({ ok: false, error: 'Server error' })
                     : next(e);
  } finally {
    client.release();
  }
});

// ---------------- Update For Sale ------------------- //
// Update a For-Sale item (only existing cols; blank = no change)
router.post('/admin/for-sale/update', ensureAuth, upload.none(), async (req, res, next) => {
  const { item_id, title, description, is_active_mode } = req.body; // is_active_mode: '', '1', '0'
  if (!item_id) return res.redirect('/admin');

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM for_sale_items WHERE id = $1', [item_id]);
    const cur = rows[0];
    if (!cur) { await client.query('ROLLBACK'); return res.redirect('/admin'); }

    const updates = [];
    const params  = [];
    let i = 1;

    if (typeof title === 'string' && title.trim() !== '') {
      updates.push(`title = $${i++}`); params.push(title.trim());
    }
    if (typeof description === 'string' && description.trim() !== '') {
      updates.push(`description = $${i++}`); params.push(description.trim());
    }

    // is_active tri-state: '' = no change, '1' = set true, '0' = set false
    if (is_active_mode === '1') { updates.push(`is_active = TRUE`); }
    else if (is_active_mode === '0') { updates.push(`is_active = FALSE`); }

    if (updates.length) {
      updates.push(`updated_at = NOW()`);
      params.push(item_id);
      const sql = `UPDATE for_sale_items SET ${updates.join(', ')} WHERE id = $${i}`;
      await client.query(sql, params);
    }

    await client.query('COMMIT');
    res.redirect('/admin');
  } catch (e) {
    await client.query('ROLLBACK'); next(e);
  } finally {
    client.release();
  }
});

  // -------------- for sale delete ------------- //

router.post('/admin/for-sale/delete', ensureAuth, async (req, res, next) => {
  const { item_id } = req.body;
  if (!item_id) return res.redirect('/admin');

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // collect photo URLs to delete from disk
    const { rows: photos } = await client.query(
      'SELECT url FROM for_sale_photos WHERE item_id = $1', [item_id]
    );

    await client.query('DELETE FROM for_sale_photos WHERE item_id = $1', [item_id]);
    await client.query('DELETE FROM for_sale_items  WHERE id = $1',      [item_id]);

    // remove files/folder
    const toPublic = (u) => path.join(__dirname, '..', 'public', String(u).replace(/^[\\/]+/, ''));
    for (const p of photos) { try { await fs.unlink(toPublic(p.url)); } catch {} }

    const dir = path.join(__dirname, '..', 'public', 'uploads', 'for-sale', String(item_id));
    try { await fs.rm(dir, { recursive: true, force: true }); } catch {}

    await client.query('COMMIT');
    res.redirect('/admin');
  } catch (err) {
    await client.query('ROLLBACK'); next(err);
  } finally { client.release(); }
});



// -------------- TEAM: Add --------------- //

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const webJoin = (...parts) => '/' + parts.map(p => String(p).replace(/^\/+|\/+$/g, '')).join('/');
const toPublicPath = (url) => path.join(PUBLIC_DIR, String(url).replace(/^[\\/]+/, '').replace(/\//g, path.sep));
const safeName = (name) => String(name).replace(/[^\w.\-]+/g, '_');


async function saveTeamPhoto(memberId, file) {
  const fname = safeName(file.originalname);
  const dir   = path.join(PUBLIC_DIR, 'uploads', 'team', String(memberId));
  await fs.mkdir(dir, { recursive: true });
  const dest  = path.join(dir, fname);
  await fs.rename(file.path, dest);
  return webJoin('uploads', 'team', String(memberId), fname); // => "/uploads/team/3/me.jpg"
}

router.post('/admin/team/add', ensureAuth, upload.single('photo'), async (req, res, next) => {
  const { name, role, bio } = req.body;
  if (!name || !role) return res.redirect('/admin');

  const file = req.file && req.file.mimetype?.startsWith('image/') ? req.file : null;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 🔹 NEW: get next sort order
    const { rows: nx } = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM team'
    );
    const nextSort = nx[0].next;

    // 🔹 UPDATED: include sort_order in insert
    const { rows } = await client.query(
      `INSERT INTO team (name, role, bio, photo_url, sort_order)
       VALUES ($1,$2,$3,NULL,$4)
       RETURNING id`,
      [name.trim(), role.trim(), (bio || '').trim(), nextSort]
    );
    const memberId = rows[0].id;

    if (file) {
      const url = await saveTeamPhoto(memberId, file);
      await client.query(`UPDATE team SET photo_url = $1 WHERE id = $2`, [url, memberId]);
    } else if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }

    await client.query('COMMIT');
    res.redirect('/admin');
  } catch (e) { await client.query('ROLLBACK'); next(e); }
  finally { client.release(); }
});




// --------- TEAM: Update  ---------- //

router.post('/admin/team/update', ensureAuth, upload.single('photo'), async (req, res, next) => {
  const { member_id, name, role, bio } = req.body;
  if (!member_id) return res.redirect('/admin');

  const file = req.file && req.file.mimetype?.startsWith('image/') ? req.file : null;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`SELECT photo_url FROM team WHERE id = $1`, [member_id]);
    if (!rows.length) { await client.query('ROLLBACK'); return res.redirect('/admin'); }
    const currentUrl = rows[0].photo_url;

    const sets = [], vals = []; let i = 1;
    if (typeof name === 'string' && name.trim() !== '') { sets.push(`name = $${i++}`); vals.push(name.trim()); }
    if (typeof role === 'string' && role.trim() !== '') { sets.push(`role = $${i++}`); vals.push(role.trim()); }
    if (typeof bio === 'string' && bio.trim() !== '') {sets.push(`bio = $${i++}`); vals.push(bio.trim());}
      

    if (file) {
      if (currentUrl) { try { await fs.unlink(toPublicPath(currentUrl)); } catch {} }
      const url = await saveTeamPhoto(member_id, file);
      sets.push(`photo_url = $${i++}`); vals.push(url);
    } else if (req.file) {
      // non-image uploaded; discard
      try { await fs.unlink(req.file.path); } catch {}
    }

    if (sets.length) {
      vals.push(member_id);
      await client.query(`UPDATE team SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    }

    await client.query('COMMIT');
    res.redirect('/admin');
  } catch (e) { await client.query('ROLLBACK'); next(e); }
  finally { client.release(); }
});

// Drag-to-reorder team
router.post('/admin/team/reorder', ensureAuth, express.json(), async (req, res, next) => {
  const { order } = req.body; // [{id, sort}, ...]
  if (!Array.isArray(order) || !order.length) return res.status(400).json({ ok:false });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Update in a transaction (loop is fine; small table)
    for (const row of order) {
      const id = Number(row.id);
      const sort = Number(row.sort);
      if (!Number.isInteger(id) || !Number.isInteger(sort)) continue;
      await client.query('UPDATE team SET sort_order = $1 WHERE id = $2', [sort, id]);
    }

    await client.query('COMMIT');
    res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK'); next(e);
  } finally {
    client.release();
  }
});


// --- TEAM: Delete ---
router.post('/admin/team/delete', ensureAuth, async (req, res, next) => {
  const { member_id } = req.body;
  if (!member_id) return res.redirect('/admin');

  try {
    await db.query(`DELETE FROM team WHERE id = $1`, [member_id]);
    res.redirect('/admin');
  } catch (err) { next(err); }
});


module.exports = router;
