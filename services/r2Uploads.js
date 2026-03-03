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
    const sharpStart = Date.now();
    jpegBuf = await sharp(tmpPath)
      .rotate()
      .jpeg({ quality: 80 })
      .toBuffer();

    console.log("[IMG] sharp ms:", Date.now() - sharpStart);

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

    const readStart = Date.now();
    // Only read into memory if HEIC
    const input = await fs.readFile(tmpPath);
    console.log("[IMG] read HEIC ms:", Date.now() - readStart);

    const convertStart = Date.now();
    const converted = await heicConvert({
      buffer: input,
      format: "JPEG",
      quality: 0.85, // 0..1
    });
    console.log("[IMG] heic convert ms:", Date.now() - convertStart);

    const sharpStart = Date.now();
    jpegBuf = await sharp(converted)
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer();
      console.log("[IMG] sharp after HEIC ms:", Date.now() - sharpStart);
  }

  const uploadStart = Date.now();
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: jpegBuf,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  console.log("[IMG] upload ms:", Date.now() - uploadStart);
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
