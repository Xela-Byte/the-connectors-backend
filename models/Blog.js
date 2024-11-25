const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema(
  {
    coverImage: {
      type: String,
      required: true,
    },
    blogTitle: {
      type: String,
      required: true,
    },
    blogContent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Blog = mongoose.model('Blog', blogSchema);

module.exports = {
  Blog: Blog,
};

