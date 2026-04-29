const User = require("../models/userModel");

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    if (!token) {
      res.status(401);
      throw new Error("There is no token attached to header");
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded?.id);
      if (!user) {
        res.status(401);
        throw new Error("User not found");
      }
      if (user.isBlocked) {
        res.status(403);
        throw new Error("Your account has been blocked");
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        res.status(401);
        throw new Error("Token expired");
      }
      res.status(401);
      throw new Error("Not Authorized token expired, Please Login again");
    }
  } else {
    res.status(401);
    throw new Error("There is no token attached to header");
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("You are not an admin");
  } else {
    next();
  }
});

module.exports = { authMiddleware, isAdmin };
