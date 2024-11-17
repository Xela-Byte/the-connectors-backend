'use strict';
const express = require('express');
const {
  uploadFile,
  uploadMiddleware,
} = require('../controllers/media/mediaController');
const { updateLocale } = require('moment/moment');

const router = express.Router();

// Sample Code
// router.post('/wallet/sendToWallet', sendToWallet);

// Protected Route
// router.post('/auth/addUserLike', verifyToken, addUserLike);

router.post('/uploadImage', uploadMiddleware, uploadFile);

module.exports = router;

