const fs = require("fs");
const asyncHandler = require("express-async-handler");
const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("../utils/cloudinary");

/* IMAGES */
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }
  const urls = [];
  for (const file of req.files) {
    const result = await cloudinaryUploadImg(file.path);
    urls.push({ url: result.secure_url, public_id: result.public_id });
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
  res.json(urls);
});

/* VIDEOS */
const uploadVideos = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }
  const urls = [];
  for (const file of req.files) {
    const result = await cloudinaryUploadImg(file.path, "video");
    urls.push({ url: result.secure_url, public_id: result.public_id });
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
  res.json(urls);
});

/* DELETE IMAGE */
const deleteImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await cloudinaryDeleteImg(id, "image");
  res.json({ message: "Image Deleted" });
});

/* DELETE VIDEO */
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await cloudinaryDeleteImg(id, "video");
  res.json({ message: "Video Deleted" });
});

module.exports = {
  uploadImages,
  uploadVideos,
  deleteImage,
  deleteVideo,
};
