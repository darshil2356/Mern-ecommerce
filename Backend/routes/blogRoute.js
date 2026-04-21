const express = require("express");
const {
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
} = require("../controller/blogCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { blogImgResize, uploadPhoto } = require("../middlewares/uploadImage");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createBlog);
router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  uploadPhoto.array("images", 2),
  blogImgResize,
  uploadImages
);
router.put("/likes", authMiddleware, liketheBlog);
router.put("/dislikes", authMiddleware, disliketheBlog);

router.put("/publish/:id", authMiddleware, isAdmin, publishBlog);
router.put("/:id", authMiddleware, isAdmin, updateBlog);

router.get("/admin/all", authMiddleware, isAdmin, getAllBlogsAdmin);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id", getBlog);
router.get("/", getAllBlogs);

router.delete("/:id", authMiddleware, isAdmin, deleteBlog);

module.exports = router;
