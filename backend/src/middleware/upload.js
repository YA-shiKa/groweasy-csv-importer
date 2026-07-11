import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches frontend copy

const storage = multer.memoryStorage();

export const csvUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      return cb(new Error("Only .csv files are accepted."));
    }
    cb(null, true);
  },
});
