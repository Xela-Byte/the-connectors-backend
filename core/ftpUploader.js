const ftp = require('ftp');
const fs = require('fs');

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
          ftpClient.end(); // Close the connection
          if (err) return reject(err);
          resolve();
        });
      });
    });

    ftpClient.on('error', (err) => reject(err));

    ftpClient.connect(ftpConfig);
  });
};

// Abstract function to handle file upload
const uploadFileToFTP = async (file) => {
  const localFilePath = file.path;
  const remoteFilePath = `/uploads/${file.filename}`;
  const fileUrl = `https://www.media.theconnectorsng.com/media/uploads/${file.filename}`;

  try {
    await uploadToFTP(localFilePath, remoteFilePath);
    fs.unlinkSync(localFilePath); // Clean up local file
    return { success: true, url: fileUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { uploadFileToFTP };

