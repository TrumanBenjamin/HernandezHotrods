const { sendAlert } = require("./emailer");
const { normalizeIp, isOwnerIpWhitelisted } = require("./ipWhiteList");

async function maybeSendOwnerLoginAlert(req, user) {
  const isOwner = user.role === "owner";

  if (!isOwner) return;

  if (isOwnerIpWhitelisted(req)) return;

  const ip = normalizeIp((req.ips && req.ips[0]) || req.ip);
  const ua = req.get("user-agent") || "";
  const when = new Date();
  const timeLocal = when.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  await sendAlert({
    subject: `HHR OWNER LOGIN (${ip})`,
    text:
`Owner session started. WAS THIS YOU?! 😱

Time: ${timeLocal}
IP: ${ip}
User-Agent: ${ua}
Path: ${req.originalUrl}
`,
  });
}

module.exports = { maybeSendOwnerLoginAlert };