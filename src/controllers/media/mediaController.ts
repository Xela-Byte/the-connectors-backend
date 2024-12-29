import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { uploadFileToFTP } from '../../core/ftpUploader';

// Multer setup for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, destination: string) => void,
  ) => {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir); // Temporary storage
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, filename: string) => void,
  ) => {
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Route handler for file upload
export const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await uploadFileToFTP(req.file);

    if (result.success) {
      res.json({ message: 'File uploaded successfully', url: result.url });
    } else {
      res
        .status(500)
        .json({ error: 'FTP upload failed', details: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Multer middleware for use in routes
export const uploadMiddleware = upload.single('file');

