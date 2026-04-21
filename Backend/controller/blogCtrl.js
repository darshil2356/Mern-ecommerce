const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const cloudinaryUploadImg = require("../utils/cloudinary");
const fs = require("fs");
const createBlog = asyncHandler(async (req, res) => {
  try {
    const newBlog = await Blog.create(req.body);
    res.json(newBlog);
  } catch (error) {
    throw new Error(error);
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateBlog);
  } catch (error) {
    throw new Error(error);
  }
});

const getBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getBlog = await Blog.findById(id)
      .populate("likes")
      .populate("dislikes");
    const updateViews = await Blog.findByIdAndUpdate(
      id,
      {
        $inc: { numViews: 1 },
      },
      { new: true }
    );
    res.json(getBlog);
  } catch (error) {
    throw new Error(error);
  }
});
const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const getBlogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(getBlogs);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllBlogsAdmin = asyncHandler(async (req, res) => {
  try {
    const getBlogs = await Blog.find().sort({ createdAt: -1 });
    res.json(getBlogs);
  } catch (error) {
    throw new Error(error);
  }
});

const publishBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const blog = await Blog.findById(id);
    if (!blog) { res.status(404); throw new Error("Blog not found"); }
    const updated = await Blog.findByIdAndUpdate(
      id,
      { isPublished: !blog.isPublished },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    throw new Error(error);
  }
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) { res.status(404); throw new Error("Blog not found"); }
    await Blog.findByIdAndUpdate(blog._id, { $inc: { numViews: 1 } });
    res.json(blog);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedBlog = await Blog.findByIdAndDelete(id);
    res.json(deletedBlog);
  } catch (error) {
    throw new Error(error);
  }
});

const liketheBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.body;
  validateMongoDbId(blogId);
  const blog = await Blog.findById(blogId);
  const loginUserId = req?.user?._id;
  const isLiked = blog?.isLiked;
  const alreadyDisliked = blog?.dislikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  if (alreadyDisliked) {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $pull: { dislikes: loginUserId }, isDisliked: false },
      { new: true }
    );
    return res.json(updated);
  }
  if (isLiked) {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $pull: { likes: loginUserId }, isLiked: false },
      { new: true }
    );
    return res.json(updated);
  } else {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $push: { likes: loginUserId }, isLiked: true },
      { new: true }
    );
    return res.json(updated);
  }
});
const disliketheBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.body;
  validateMongoDbId(blogId);
  const blog = await Blog.findById(blogId);
  const loginUserId = req?.user?._id;
  const isDisLiked = blog?.isDisliked;
  const alreadyLiked = blog?.likes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  if (alreadyLiked) {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $pull: { likes: loginUserId }, isLiked: false },
      { new: true }
    );
    return res.json(updated);
  }
  if (isDisLiked) {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $pull: { dislikes: loginUserId }, isDisliked: false },
      { new: true }
    );
    return res.json(updated);
  } else {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $push: { dislikes: loginUserId }, isDisliked: true },
      { new: true }
    );
    return res.json(updated);
  }
});

const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const uploader = (path) => cloudinaryUploadImg(path, "images");
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newpath = await uploader(path);
      console.log(newpath);
      urls.push(newpath);
      fs.unlinkSync(path);
    }
    const findBlog = await Blog.findByIdAndUpdate(
      id,
      {
        images: urls.map((file) => {
          return file;
        }),
      },
      {
        new: true,
      }
    );
    res.json(findBlog);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createBlog,
  updateBlog,
  getBlog,
  getAllBlogs,
  getAllBlogsAdmin,
  getBlogBySlug,
  deleteBlog,
  liketheBlog,
  disliketheBlog,
  uploadImages,
  publishBlog,
};
