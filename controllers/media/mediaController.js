const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFileToFTP } = require('../../core/ftpUploader');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir); // Temporary storage
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Route handler for file upload
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const result = await uploadFileToFTP(req.file);

  if (result.success) {
    res.json({ message: 'File uploaded successfully', url: result.url });
  } else {
    res.status(500).json({ error: 'FTP upload failed', details: result.error });
  }
};

// Multer middleware for use in routes
exports.uploadMiddleware = upload.single('file');

