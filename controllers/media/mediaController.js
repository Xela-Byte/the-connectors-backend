const multer = require('multer');
const ftp = require('ftp');
const path = require('path');
const fs = require('fs');

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir); // Temporary storage before FTP upload
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// FTP configuration
const ftpConfig = {
  host: 'ftp.theconnectorsng.com',
  user: 'media@media.theconnectorsng.com',
  password: 'WwzDP$l(FHf~',
};

// Utility function to upload a file via FTP
const uploadToFTP = (localFilePath, remoteFilePath) => {
  return new Promise((resolve, reject) => {
    const ftpClient = new ftp();

    ftpClient.on('ready', () => {
      // Ensure the FTP directory exists
      ftpClient.mkdir('/uploads', true, (err) => {
        if (err) return reject(err);

        // Upload the file
        ftpClient.put(localFilePath, remoteFilePath, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    ftpClient.on('error', (err) => reject(err));

    ftpClient.connect(ftpConfig);
  });
};

// Controller function
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const localFilePath = req.file.path; // Multer saves the file path here
  const remoteFilePath = `/uploads/${req.file.filename}`; // Remote path on the server
  const fileUrl = `https://www.media.theconnectorsng.com/media/uploads/${req.file.filename}`;

  try {
    // Upload the file to the FTP server
    await uploadToFTP(localFilePath, remoteFilePath);

    // Optionally clean up temporary file
    fs.unlinkSync(localFilePath);

    // Return the file URL
    res.json({ message: 'File uploaded successfully', url: fileUrl });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'FTP upload failed', details: error.message });
  }
};

// Export multer middleware for use in the route
exports.uploadMiddleware = upload.single('file');

