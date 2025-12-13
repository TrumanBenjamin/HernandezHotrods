// services/instagram.js
const TTL = Number(process.env.IG_CACHE_TTL_SECONDS || 600); // 10 min
let cache = { data: null, ts: 0 };

const pool = require('../db');

async function getCurrentIgToken() {
  const { rows } = await pool.query(
    `SELECT access_token, expires_at
     FROM ig_tokens
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
}

async function fetchInstagramPosts(limit = 3) {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL * 1000) return cache.data;

  const current = await getCurrentIgToken();
    if (!current) {
      console.warn('No IG token found in database.');
    }
    const token = current.access_token;

  // Basic Display API: /me/media (token authorizes the user)
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'thumbnail_url',
    'permalink',
    'timestamp',
    'username'
  ].join(',');

  const url = new URL(`https://graph.facebook.com/v24.0/${process.env.IG_USER_ID}/media`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', token);

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram error ${resp.status}: ${text}`);
  }
  const json = await resp.json();

  // Normalize: choose a display image for both photos & videos
  const posts = (json.data || []).map(p => ({
    id: p.id,
    caption: p.caption || '',
    permalink: p.permalink,
    mediaType: p.media_type,
    image: p.media_type === 'VIDEO' ? (p.thumbnail_url || p.media_url) : p.media_url,
    videoUrl: p.media_type === 'VIDEO' ? p.media_url : null,
    timestamp: p.timestamp
  }));

  cache = { data: posts, ts: now };
  return posts;
}

module.exports = { fetchInstagramPosts };
