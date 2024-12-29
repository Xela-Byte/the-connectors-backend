"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToFTP = void 0;
const ftp_1 = __importDefault(require("ftp"));
const fs_1 = __importDefault(require("fs"));
// FTP configuration
const ftpConfig = {
    host: 'ftp.theconnectorsng.com',
    user: 'media@media.theconnectorsng.com',
    password: 'WwzDP$l(FHf~',
};
// Utility function to upload a file via FTP
const uploadToFTP = (localFilePath, remoteFilePath) => {
    return new Promise((resolve, reject) => {
        const ftpClient = new ftp_1.default();
        ftpClient.on('ready', () => {
            // Ensure the FTP directory exists
            ftpClient.mkdir('/uploads', true, (err) => {
                if (err)
                    return reject(err);
                // Upload the file
                ftpClient.put(localFilePath, remoteFilePath, (err) => {
                    ftpClient.end(); // Close the connection
                    if (err)
                        return reject(err);
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
        fs_1.default.unlinkSync(localFilePath); // Clean up local file
        return { success: true, url: fileUrl };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
};
exports.uploadFileToFTP = uploadFileToFTP;
