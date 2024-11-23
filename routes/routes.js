'use strict';
const express = require('express');
const {
  uploadFile,
  uploadMiddleware,
} = require('../controllers/media/mediaController');
const {
  getAllBlogs,
  addBlog,
  blogMiddleware,
  getSingleBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blog/blogController');

const router = express.Router();

// Sample Code
// router.post('/wallet/sendToWallet', sendToWallet);

// Protected Route
// router.post('/auth/addUserLike', verifyToken, addUserLike);

// Blog
router.get('/blogs', getAllBlogs);
router.post('/blogs/create', blogMiddleware, addBlog);
router.get('/blogs/:blogID', getSingleBlog);
router.put('/blogs/:blogID', blogMiddleware, updateBlog);
router.delete('/blogs/:blogID', deleteBlog);

// Media
router.post('/uploadImage', uploadMiddleware, uploadFile);

module.exports = router;

