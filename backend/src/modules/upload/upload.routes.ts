import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../../middleware/auth';
import fs from 'fs';

export const uploadRouter = Router();
uploadRouter.use(authenticate);

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    // Basic extension/mime check is enough for now
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Зөвхөн зураг файл (jpg, png, gif, webp, pdf)'));
  },
});

// POST /api/upload - Single file
uploadRouter.post('/', (req, res, next) => {
  console.log('Upload request headers:', req.headers['content-type']);
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      console.error('No file received');
      return res.status(400).json({ success: false, error: 'Файл оруулна уу' });
    }
    console.log('File uploaded:', req.file);
    next();
  });
}, async (req, res) => {

  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: 'Файл оруулна уу' });
  }

  res.json({
    success: true,
    data: {
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    },
  });
});


// POST /api/upload/multiple - Multiple files (max 5)
uploadRouter.post('/multiple', upload.array('files', 5), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ success: false, error: 'Файл оруулна уу' });
  res.json({
    success: true,
    data: {
      files: files.map(f => ({
        url: `/uploads/${f.filename}`,
        originalName: f.originalname,
        size: f.size,
      })),
    },
  });
});
