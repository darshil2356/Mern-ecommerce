const express = require("express");
const router = express.Router();
const { addEntry, getTodayEntries, getByDate, getSummary, deleteEntry } = require("../controller/rojmelCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/add", authMiddleware, isAdmin, addEntry);
router.get("/today", authMiddleware, isAdmin, getTodayEntries);
router.get("/by-date", authMiddleware, isAdmin, getByDate);
router.get("/summary", authMiddleware, isAdmin, getSummary);
router.delete("/:id", authMiddleware, isAdmin, deleteEntry);

module.exports = router;
