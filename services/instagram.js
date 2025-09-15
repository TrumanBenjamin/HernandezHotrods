// services/instagram.js
const TTL = Number(process.env.IG_CACHE_TTL_SECONDS || 600); // 10 min
let cache = { data: null, ts: 0 };

async function fetchInstagramPosts(limit = 4) {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL * 1000) return cache.data;

  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error('Missing IG_ACCESS_TOKEN');

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

  const url = new URL('https://graph.instagram.com/me/media');
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
    timestamp: p.timestamp
  }));

  cache = { data: posts, ts: now };
  return posts;
}

module.exports = { fetchInstagramPosts };
