const db = require('../db'); // pg Pool

// GET /for-sale  (list page: only active items; newest by posted_at)
exports.index = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT
        i.id,
        i.slug,
        i.title,
        i.description,
        i.is_active,
        i.posted_at,
        i.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         p.id,
              'url',        p.url,
              'alt',        p.alt,
              'sort_order', p.sort_order
            )
            ORDER BY p.sort_order
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS photos
      FROM for_sale_items i
      LEFT JOIN for_sale_photos p ON p.item_id = i.id
      WHERE i.is_active = TRUE
      GROUP BY i.id, i.slug, i.title, i.description, i.is_active, i.posted_at, i.updated_at
      ORDER BY i.posted_at DESC NULLS LAST;
    `);

    // rows.photos is JSON already, but coerce defensively
    const items = rows.map(r => ({ ...r, photos: Array.isArray(r.photos) ? r.photos : [] }));

    res.render('forSale', { title: 'For Sale', isForSale: true, items });
  } catch (err) {
    next(err);
  }
};


// GET /for-sale/:id  (detail page)
exports.show = async (req, res, next) => {
  try {
    const { rows: items } = await db.query(
      `SELECT id, slug, title, description, price, status
       FROM for_sale_items
       WHERE id = $1`,
      [req.params.id]
    );
    const item = items[0];
    if (!item) return res.status(404).send('Not found');

    const { rows: photos } = await db.query(
      `SELECT id, url, alt, sort_order
         FROM for_sale_photos
        WHERE item_id = $1
        ORDER BY sort_order ASC`,
      [item.id]
    );

    res.render('forSaleShow', {
      title: item.title,
      item,
      photos
    });
  } catch (e) {
    next(e);
  }
};
