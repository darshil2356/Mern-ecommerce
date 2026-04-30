const express = require("express");
const router = express.Router();
const { addUdhar, recordPayment, getAll, getOne, deleteUdhar } = require("../controller/udharCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/add", authMiddleware, isAdmin, addUdhar);
router.post("/:id/pay", authMiddleware, isAdmin, recordPayment);
router.get("/", authMiddleware, isAdmin, getAll);
router.get("/:id", authMiddleware, isAdmin, getOne);
router.delete("/:id", authMiddleware, isAdmin, deleteUdhar);

module.exports = router;
