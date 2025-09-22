// controllers/buildsController.js
const path = require('path');
const fs = require('fs/promises');
const pool = require('../db');

function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// helper: make sure directory exists
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

exports.addCurrent = async (req, res) => {
  const { owner_name, name, subtitle } = req.body;
  const is_completed = false;

  try {
    const slug = slugify(name);
    // Insert build
    const buildRes = await pool.query(
      `INSERT INTO builds (slug, name, subtitle, owner_name, is_published, is_completed)
       VALUES ($1,$2,$3,$4,true,$5) RETURNING id`,
      [slug, name, subtitle, owner_name, is_completed]
    );
    const buildId = buildRes.rows[0].id;

    // Save photos (if any uploaded)
    if (req.files && req.files.length) {
      const dirPublic = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(buildId));
      await ensureDir(dirPublic);

      // move temp -> public and insert rows
      for (const f of req.files) {
        const destPath = path.join(dirPublic, f.originalname);
        await fs.rename(f.path, destPath);

        // store as web path used by your site
        const webPath = `/uploads/builds/${buildId}/${f.originalname}`;
        await pool.query(
          `INSERT INTO build_photos (build_id, url) VALUES ($1, $2)`,
          [buildId, webPath]
        );
      }
    }

    res.redirect('/admin');
  } catch (err) {
    console.error('addCurrent error:', err);
    res.redirect('/admin'); // you can flash an error if you have flash
  }
};

exports.updateCurrent = async (req, res) => {
  const { build_id, owner_name, name, subtitle } = req.body;

  try {
    // Build dynamic UPDATE for optional fields
    const sets = [];
    const vals = [];
    let i = 1;

    if (owner_name) { sets.push(`owner_name=$${i++}`); vals.push(owner_name); }
    if (name)       { sets.push(`name=$${i++}, slug=$${i++}`); vals.push(name, slugify(name)); }
    if (subtitle)   { sets.push(`subtitle=$${i++}`); vals.push(subtitle); }

    if (sets.length) {
      vals.push(build_id);
      await pool.query(`UPDATE builds SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${i}`, vals);
    }

    // add more photos if provided
    if (req.files && req.files.length) {
      const dirPublic = path.join(__dirname, '..', 'public', 'uploads', 'builds', String(build_id));
      await ensureDir(dirPublic);

      for (const f of req.files) {
        const destPath = path.join(dirPublic, f.originalname);
        await fs.rename(f.path, destPath);
        const webPath = `/uploads/builds/${build_id}/${f.originalname}`;
        await pool.query(`INSERT INTO build_photos (build_id, url) VALUES ($1,$2)`, [build_id, webPath]);
      }
    }

    res.redirect('/admin');
  } catch (err) {
    console.error('updateCurrent error:', err);
    res.redirect('/admin');
  }
};

exports.deleteCurrent = async (req, res) => {
  const { build_id } = req.body;
  try {
    // delete photos first if FK constraints
    await pool.query(`DELETE FROM build_photos WHERE build_id=$1`, [build_id]);
    await pool.query(`DELETE FROM builds WHERE id=$1 AND is_completed=false`, [build_id]);
    res.redirect('/admin');
  } catch (err) {
    console.error('deleteCurrent error:', err);
    res.redirect('/admin');
  }
};
