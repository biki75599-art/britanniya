const multer = require("multer");
const path = require("path");

// Cloudflare Workers do not provide persistent local disk storage.
// Keep uploaded QR images in memory; the controller stores them in MongoDB.
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname || "").toLowerCase();

        if (![".png", ".jpg", ".jpeg"].includes(ext)) {
            return cb(new Error("Only PNG, JPG and JPEG images are allowed."));
        }

        cb(null, true);
    }
});

module.exports = upload;
