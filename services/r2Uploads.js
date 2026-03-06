const r2 = require("./r2");
const sharp = require("sharp");
const fs = require("fs/promises");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const heicConvert = require("heic-convert");

function urlToR2Key(url) {
  // only manage /uploads/*
  if (!url || !url.startsWith("/uploads/")) return null;
  return url.slice(1); // remove leading "/"
}

async function uploadTmpAsJpegToKeyStrict(tmpPath, key, originalName = "") {

  let jpegBuf;
  const totalStart = Date.now();

  try {
    // Normal formats
    jpegBuf = await sharp(tmpPath)
      .rotate()
      .jpeg({ quality: 80 })
      .toBuffer();

  } catch (err) {
    // HEIC/HEIF fallback
    const ext = path.extname(originalName || tmpPath).toLowerCase();
    const msg = String(err?.message || "").toLowerCase();

    const looksHeic =
      ext === ".heic" || ext === ".heif" ||
      msg.includes("heif") || msg.includes("heic");

    if (!looksHeic) {
      await fs.unlink(tmpPath).catch(() => {});
      throw err;
    }

    const heicStart = Date.now();

    const input = await fs.readFile(tmpPath);

    const converted = await heicConvert({
      buffer: input,
      format: "JPEG",
      quality: 0.85,
    });

    console.log("[IMG] HEIC read + convert ms:", Date.now() - heicStart);

    jpegBuf = await sharp(converted)
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: jpegBuf,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  console.log("[IMG] total ms:", Date.now() - totalStart);

  await fs.unlink(tmpPath).catch(() => {});
}

async function deleteByUrlIfUploads(url) {
  const key = urlToR2Key(url);
  if (!key) return;
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  }));
}

module.exports = {
  urlToR2Key,
  uploadTmpAsJpegToKeyStrict,
  deleteByUrlIfUploads,
};