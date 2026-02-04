require("dotenv").config();
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

(async () => {
  try {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
        MaxKeys: 5,
      })
    );

    const keys = (res.Contents || []).map((o) => o.Key);
    console.log("Objects:", keys);
    console.log("✅ R2 auth works (object-level).");
  } catch (err) {
    console.error("R2 test failed:", err);
    process.exit(1);
  }
})();
