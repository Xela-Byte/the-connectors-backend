const { Blog } = require('../../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFileToFTP } = require('../../core/ftpUploader');
const { default: mongoose } = require('mongoose');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir); // Temporary storage before FTP upload
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Middleware for handling file uploads
exports.blogMiddleware = upload.single('coverImage');

// Updated addBlog function using both multer and FTP upload
exports.addBlog = async (req, res, next) => {
  try {
    const { blogTitle, blogContent } = req.body;
    const coverImage = req.file;

    if (!coverImage) {
      return res.status(400).json({ error: 'Please provide a cover image.' });
    }

    if (!blogTitle) {
      return res.status(400).json({ error: 'Please provide blog title.' });
    }

    if (!blogContent) {
      return res.status(400).json({ error: 'Please provide blog content.' });
    }

    // If you want to use the standalone FTP upload:
    const uploadResult = await uploadFileToFTP(coverImage);

    if (uploadResult.success) {
      const newBlog = new Blog({
        blogTitle,
        blogContent,
        coverImage: uploadResult.url,
      });

      await newBlog.save();

      return res.status(200).json({
        message: 'Blog created successfully',
        data: newBlog,
      });
    } else {
      return res
        .status(500)
        .json({ error: 'FTP upload failed.', details: uploadResult.error });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.getAllBlogs = async (req, res) => {
  let blogs;

  const page = parseInt(req.query.page, 10) || 1;
  const searchQuery = req.query.search || '';

  try {
    // Build the search criteria
    const searchCriteria = searchQuery
      ? {
          $or: [{ blogTitle: { $regex: searchQuery, $options: 'i' } }],
        }
      : {};

    // Combine status filter with search criteria
    const filterCriteria = {
      ...searchCriteria,
    };

    // Get the total number of blog with the specified status and search criteria
    const totalFilteredBlogs = await Blog.countDocuments(filterCriteria);

    const totalBlogs = await Blog.countDocuments();

    // Calculate the number of blog to skip
    const skip = (page - 1) * 10;

    // Query to get the blog with pagination, sorting, and search
    blogs = await Blog.find(filterCriteria)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(10);

    const totalPages = Math.ceil(totalFilteredBlogs / 10);

    // Return the paginated response
    return res.status(200).json({
      statusCode: 200,
      data: blogs,
      currentPage: page,
      totalPages: totalPages,
      totalLength: searchQuery ? totalFilteredBlogs : totalBlogs,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

exports.getSingleBlog = async (req, res) => {
  const { blogID } = req.params;

  if (!blogID) {
    res.status(400).json({ message: `Please provide customer ID.` });
  }

  const isValidObjectId = mongoose.Types.ObjectId.isValid(blogID);

  if (!isValidObjectId) {
    res.status(400).json({ message: `Invalid Blog ID.` });
  }

  const blog = await Blog.findById(blogID);

  if (!blog) {
    res.status(400).json({ message: `Blog not found.` });
  } else {
    return res.status(200).json({
      message: 'Blog found.',
      data: blog,
    });
  }
};

// Updated addBlog function using both multer and FTP upload
exports.updateBlog = async (req, res, next) => {
  try {
    const { blogID } = req.params;
    const { blogTitle, blogContent } = req.body;

    const coverImage = req.file;

    if (!blogID) {
      res.status(400).json({ message: `Please provide customer ID.` });
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(blogID);

    if (!isValidObjectId) {
      res.status(400).json({ message: `Invalid Blog ID.` });
    }

    const blog = await Blog.findById(blogID);

    if (!blog) {
      res.status(400).json({ message: `Blog not found.` });
    } else {
      if (!coverImage) {
        await Blog.findOneAndUpdate(
          { _id: blogID },
          {
            blogTitle,
            blogContent,
          },
        );
        const updatedBlog = await Blog.findById(blogID);

        return res.status(200).json({
          message: 'Blog updated.',
          data: updatedBlog,
        });
      } else {
        // If you want to use the standalone FTP upload:
        const uploadResult = await uploadFileToFTP(coverImage);

        if (uploadResult.success) {
          const updatedBlog = await Blog.findOneAndUpdate(
            { _id: blogID.toString() },
            {
              blogContent,
              blogTitle,
              coverImage: uploadResult.url,
            },
            {
              new: true, // Return the updated document
              runValidators: true, // Ensure the update passes schema validation
            },
          );

          return res.status(200).json({
            message: 'Blog updated.',
            data: updatedBlog,
          });
        } else {
          return res
            .status(500)
            .json({ error: 'FTP upload failed.', details: uploadResult.error });
        }
      }
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.deleteBlog = async (req, res) => {
  const { blogID } = req.params;

  if (!blogID) {
    res.status(400).json({ message: `Please provide customer ID.` });
  }

  const isValidObjectId = mongoose.Types.ObjectId.isValid(blogID);

  if (!isValidObjectId) {
    res.status(400).json({ message: `Invalid Blog ID.` });
  }

  const blog = await Blog.findById(blogID);

  if (!blog) {
    res.status(400).json({ message: `Blog not found.` });
  } else {
    await Blog.findByIdAndDelete(blogID);
    return res.status(200).json({
      message: 'Blog deleted.',
      data: blog,
    });
  }
};

