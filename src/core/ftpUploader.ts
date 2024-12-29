import ftp from 'ftp';
import fs from 'fs';

interface File {
  path: string;
  filename: string;
}

// FTP configuration
const ftpConfig = {
  host: 'ftp.theconnectorsng.com',
  user: 'media@media.theconnectorsng.com',
  password: 'WwzDP$l(FHf~',
};

// Utility function to upload a file via FTP
const uploadToFTP = (
  localFilePath: string,
  remoteFilePath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ftpClient = new ftp();

    ftpClient.on('ready', () => {
      // Ensure the FTP directory exists
      ftpClient.mkdir('/uploads', true, (err: any) => {
        if (err) return reject(err);

        // Upload the file
        ftpClient.put(localFilePath, remoteFilePath, (err: any) => {
          ftpClient.end(); // Close the connection
          if (err) return reject(err);
          resolve();
        });
      });
    });

    ftpClient.on('error', (err: any) => reject(err));

    ftpClient.connect(ftpConfig);
  });
};

// Abstract function to handle file upload
const uploadFileToFTP = async (
  file: File,
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const localFilePath = file.path;
  const remoteFilePath = `/uploads/${file.filename}`;
  const fileUrl = `https://www.media.theconnectorsng.com/media/uploads/${file.filename}`;

  try {
    await uploadToFTP(localFilePath, remoteFilePath);
    fs.unlinkSync(localFilePath); // Clean up local file
    return { success: true, url: fileUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { uploadFileToFTP };

