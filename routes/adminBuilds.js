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
    .replace(/(^-|-$)+/g, '');
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

/* ------------------------------ ADD (current) ------------------------------ */
/**
 * POST /admin/builds/add
 * Body (multipart/form-data):
 *  - owner_name (required)
 *  - name (required)  // "Year Make Model" e.g., "1969 Camaro RS"
 *  - subtitle (required) // your semi-lengthy description
 *  - photos[] (optional, multiple)
 */
router.post(
  '/admin/builds/add',
  ensureAuth,
  upload.array('photos'),
  async (req, res, next) => {
    const { owner_name, name, subtitle } = req.body;

    if (!owner_name || !name || !subtitle) {
      return res.redirect('/admin'); // you can flash an error if you use connect-flash
    }

    const slug = slugify(name);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const insertBuild = `
        INSERT INTO builds (slug, name, subtitle, owner_name, is_published, is_completed)
        VALUES ($1,   $2,   $3,       $4,         TRUE,        FALSE)
        RETURNING id
      `;
      const { rows } = await client.query(insertBuild, [slug, name, subtitle, owner_name]);
      const buildId = rows[0].id;

      // Persist photos to disk + DB
      await persistPhotos(buildId, req.files);

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

/* ---------------------------- UPDATE (current) ---------------------------- */
/**
 * POST /admin/builds/update
 * Body (multipart/form-data):
 *  - build_id (required)
 *  - owner_name (optional)
 *  - name (optional)      // if provided, slug auto-updates
 *  - subtitle (optional)
 *  - photos[] (optional, multiple) // appended to gallery
 */
router.post(
  '/admin/builds/update',
  ensureAuth,
  upload.array('photos'),
  async (req, res, next) => {
    const { build_id, owner_name, name, subtitle } = req.body;

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
        return res.redirect('/admin'); // or flash "Not a current build"
      }

      // Build dynamic UPDATE
      const sets = [];
      const vals = [];
      let i = 1;

      if (owner_name) {
        sets.push(`owner_name = $${i++}`);
        vals.push(owner_name);
      }
      if (name) {
        sets.push(`name = $${i++}`);
        vals.push(name);
        sets.push(`slug = $${i++}`);
        vals.push(slugify(name));
      }
      if (subtitle) {
        sets.push(`subtitle = $${i++}`);
        vals.push(subtitle);
      }

      if (sets.length) {
        vals.push(build_id);
        await client.query(
          `UPDATE builds SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
          vals
        );
      }

      // Append any new photos
      if (req.files?.length) {
        await persistPhotos(build_id, req.files);
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
    try { await client.query('DELETE FROM build_qphotos WHERE build_id = $1', [build_id]); } catch {}

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

module.exports = router;
