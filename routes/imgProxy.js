const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const { HeadObjectCommand, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../services/r2");

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

router.get("/img/:w/:q/*", async (req, res) => {
  try {
    const width = Math.max(1, Math.min(parseInt(req.params.w, 10) || 0, 3000));
    const quality = Math.max(30, Math.min(parseInt(req.params.q, 10) || 0, 95));

    let relPath = decodeURIComponent(req.params[0] || "");

    // If someone accidentally passed a full URL, strip to pathname
    if (relPath.startsWith("http://") || relPath.startsWith("https://")) {
      try { relPath = new URL(relPath).pathname; } catch (_) {}
    }

    relPath = relPath.replace(/^\/+/, ""); // no leading slash
    relPath = relPath.replace(/\\/g, "/"); // windows slashes -> url slashes
    if (!relPath || relPath.includes("..")) return res.status(400).send("Bad path");

    // HEAD source object for cache-busting token
    const head = await r2.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: relPath,
    }));

    const etag = String(head.ETag || "").replace(/"/g, "");
    const v = `${etag}_${head.ContentLength || 0}`;

    const accept = req.headers["accept"] || "";
    const toWebP = accept.includes("image/avif") || accept.includes("image/webp");


    const baseName = relPath.replace(/[\\/]/g, "_");
    const outExt = toWebP ? "webp" : "jpg";

    const outName = `${width}_${quality}_${baseName}_${v}.${outExt}`;

    // R2 cache key (resized outputs go here)
    const r2CacheKey = `cache/img/${outName}`;

    // 1) Try R2 resized-cache first (shared across everyone)
    try {
      const cachedObj = await r2.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: r2CacheKey,
      }));

      const buf = await streamToBuffer(cachedObj.Body);

      res.setHeader("X-IMG-SOURCE", "R2-CACHE");

      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.type(outExt);
      return res.send(buf);
    } catch (_) {
      // miss -> continue
    }

    // 2) Fetch original from R2, resize, respond
    console.log("IMG ORIGINAL KEY:", JSON.stringify(relPath));
    const obj = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: relPath, // ✅ WAS "key" (undefined)
    }));

    const inputBuf = await streamToBuffer(obj.Body);

    let pipeline = sharp(inputBuf).rotate();
    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });

    pipeline = toWebP
      ? pipeline.webp({ quality })
      : pipeline.jpeg({ quality, mozjpeg: true });

    const buf = await pipeline.toBuffer();

    // ✅ IMPORTANT: write resized output back to R2 cache (shared across everyone)
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: r2CacheKey,
      Body: buf,
      ContentType: toWebP ? "image/webp" : "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    res.setHeader("X-IMG-SOURCE", "R2-ORIGIN-RESIZED");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.type(outExt);
    return res.send(buf);
  } catch (err) {
    console.error("img proxy error:", err);
    return res.status(404).end();
  }
});

module.exports = router;