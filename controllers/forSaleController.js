const db = require('../db'); // your pg Pool (has .query)

exports.index = async (req, res, next) => {
  const sql = `
    SELECT
      i.id, i.slug, i.title, i.description, i.is_sold, i.posted_at,
      COALESCE(
        json_agg(
          json_build_object('url', p.url, 'alt', p.alt)
          ORDER BY p.sort_order
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
      ) AS photos
    FROM for_sale_items AS i
    LEFT JOIN for_sale_photos AS p ON p.item_id = i.id
    WHERE i.is_active = TRUE
    GROUP BY i.id
    ORDER BY i.posted_at DESC;
  `;

  try {
    const { rows } = await db.query(sql);
    res.render('forSale', { title: 'For Sale', isForSale: true, items: rows });
  } catch (err) {
    next(err);
  }
};
