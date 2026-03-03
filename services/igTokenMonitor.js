
const pool = require("../db");
const { sendAlert } = require("./emailer");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let running = false;


async function canSend(key) {
  const { rows } = await pool.query(
    `SELECT last_sent_at FROM ig_alert_log WHERE key=$1`, 
    [key]
  );

  if (!rows.length) return true;

  const last = new Date(rows[0].last_sent_at).getTime(); 
  return Date.now() - last > ONE_DAY_MS;
}

async function markSent(key) {
  await pool.query(
    `INSERT INTO ig_alert_log(key, last_sent_at)
     VALUES ($1, NOW())
     ON CONFLICT (key) DO UPDATE SET last_sent_at = NOW()`,
    [key]
  );
}

async function getCurrentIgToken() {
    const { rows } = await pool.query(
    `SELECT access_token FROM ig_tokens ORDER BY created_at DESC LIMIT 1`
  );
  return rows[0]?.access_token || null;
}

async function debugToken(inputToken) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Missing META_APP_ID / META_APP_SECRET");

  const appAccessToken = `${appId}|${appSecret}`;

  const url =
    "https://graph.facebook.com/debug_token" +
    `?input_token=${encodeURIComponent(inputToken)}` +
    `&access_token=${encodeURIComponent(appAccessToken)}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(`debug_token failed: ${res.status} ${JSON.stringify(json)}`);
  }

  return json?.data || null;
}

function fmt(tsSeconds) {
  if (!tsSeconds) return "unknown";
  return new Date(tsSeconds * 1000).toLocaleString();
}

async function runIgTokenMonitor() {
  if (running) return;
  running = true;

  try {
    const token = await getCurrentIgToken();

    if (!token) {
      console.log("[IG MONITOR] ❌ No token found");
      return;
    }

    let data;
    try {
      data = await debugToken(token);
    } catch (err) {
    console.log("[IG MONITOR] ❌ Token check failed", err?.message || err);

    const key = "ig_token_check_failed";
    if (await canSend(key)) {
        await sendAlert({
        subject: "HHR IG TOKEN CHECK FAILED",
        text:
    `Instagram token check failed.

    Time: ${new Date().toLocaleString()}
    Error: ${err?.message || err}
    `,
        });
        await markSent(key);
    }

    return;
    }

    if (!data?.is_valid) {
    console.log("[IG MONITOR] ❌ Token invalid");

    const key = "ig_token_invalid";
    if (await canSend(key)) {
        await sendAlert({
        subject: "HHR IG TOKEN INVALID",
        text:
    `Instagram token is INVALID.

    Time: ${new Date().toLocaleString()}
    App ID: ${process.env.META_APP_ID || "unknown"}
    Token type: ${data?.type || "unknown"}
    Expires at: ${fmt(data?.expires_at)}
    Data: ${JSON.stringify(data)}
    `,
        });
        await markSent(key);
    }

    return;
    }

    console.log("[IG MONITOR] ✅ Token valid");

  } finally {
    running = false;
  }
}


module.exports = { runIgTokenMonitor };
