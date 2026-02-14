import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { authenticate } from '../../middleware/auth';
import { admin } from '../../lib/firebase-admin';

export const uploadRouter = Router();
uploadRouter.use(authenticate);

// Use memory storage for Buffer processing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for cloud
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Зөвхөн зураг файл (jpg, png, gif, webp, pdf)'));
  },
});

async function uploadToFirebase(file: Express.Multer.File): Promise<string> {
  const bucket = admin.storage().bucket();
  const filename = `uploads/${uuid()}-${file.originalname}`;
  const blob = bucket.file(filename);

  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    resumable: false,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', async () => {
      // Make the file public or get a signed URL
      // For simplicity in a prototype/dev, we can make it public
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      } catch (err) {
        // If makePublic fails (e.g. permission issues), we can fallback to signed URL
        const [url] = await blob.getSignedUrl({
          action: 'read',
          expires: '03-01-2500', // Far future
        });
        resolve(url);
      }
    });
    blobStream.end(file.buffer);
  });
}

// POST /api/upload - Single file
uploadRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл оруулна уу' });
    }

    const publicUrl = await uploadToFirebase(req.file);

    res.json({
      success: true,
      data: {
        url: publicUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ success: false, error: 'Файл хуулахад алдаа гарлаа' });
  }
});

// POST /api/upload/multiple - Multiple files (max 5)
uploadRouter.post('/multiple', upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ success: false, error: 'Файл оруулна уу' });

    const uploadPromises = files.map(file => uploadToFirebase(file));
    const urls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: {
        files: files.map((f, i) => ({
          url: urls[i],
          originalName: f.originalname,
          size: f.size,
        })),
      },
    });
  } catch (e) {
    console.error('Multiple upload error:', e);
    res.status(500).json({ success: false, error: 'Файлуудыг хуулахад алдаа гарлаа' });
  }
});
