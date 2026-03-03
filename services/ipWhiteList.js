function normalizeIp(ip) {
  let s = String(ip || "").trim();

  // IPv4-mapped IPv6: ::ffff:1.2.3.4
  s = s.replace(/^::ffff:/, "");

  // Localhost IPv6
  if (s === "::1") return "127.0.0.1";

  return s;
}

function isOwnerIpWhitelisted(req) {
  const raw = process.env.OWNER_IP_WHITELIST || "";
  const whitelist = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (!whitelist.length) return false;

  const ip = normalizeIp(req.ip);
  return whitelist.includes(ip);
}

module.exports = { normalizeIp, isOwnerIpWhitelisted };