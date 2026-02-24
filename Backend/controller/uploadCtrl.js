// const fs = require("fs");
// const asyncHandler = require("express-async-handler");

// const {
//   cloudinaryUploadImg,
//   cloudinaryDeleteImg,
// } = require("../utils/cloudinary");
// const uploadImages = asyncHandler(async (req, res) => {
//   try {
//     const uploader = (path) => cloudinaryUploadImg(path, "images");
//     const urls = [];
//     const files = req.files;
//     for (const file of files) {
//       const { path } = file;
//       const newpath = await uploader(path);
//       console.log(newpath);
//       urls.push(newpath);
//       fs.unlinkSync(path);
//     }
//     const images = urls.map((file) => {
//       return file;
//     });
//     res.json(images);
//   } catch (error) {
//     throw new Error(error);
//   }
// });
// const deleteImages = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   try {
//     const deleted = cloudinaryDeleteImg(id, "images");
//     res.json({ message: "Deleted" });
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// module.exports = {
//   uploadImages,
//   deleteImages,
// };





// const fs = require("fs");
// const asyncHandler = require("express-async-handler");
// const {
//   cloudinaryUploadImg,
//   cloudinaryDeleteImg,
// } = require("../utils/cloudinary");

// const uploadImages = asyncHandler(async (req, res) => {
//   const urls = [];
//   const files = req.files;

//   for (const file of files) {
//     const result = await cloudinaryUploadImg(file.path);

//     urls.push({
//       url: result.secure_url,
//       public_id: result.public_id,
//     });

//     fs.unlinkSync(file.path);
//   }

//   res.json(urls);
// });

// const deleteImages = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   await cloudinaryDeleteImg(id);
//   res.json({ message: "Deleted" });
// });

// module.exports = {
//   uploadImages,
//   deleteImages,
// };
  


const fs = require("fs");
const asyncHandler = require("express-async-handler");
const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("../utils/cloudinary");

/* IMAGES */
const uploadImages = asyncHandler(async (req, res) => {
  const urls = [];
  const files = req.files;

  for (const file of files) {
    const result = await cloudinaryUploadImg(file.path);

    urls.push({
      url: result.secure_url,
      public_id: result.public_id,
    });

    fs.unlinkSync(file.path);
  }

  res.json(urls);
});

/* VIDEOS */
const uploadVideos = asyncHandler(async (req, res) => {
  const urls = [];
  const files = req.files;

  for (const file of files) {
    const result = await cloudinaryUploadImg(file.path, "video");

    urls.push({
      url: result.secure_url,
      public_id: result.public_id,
    });

    fs.unlinkSync(file.path);
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
