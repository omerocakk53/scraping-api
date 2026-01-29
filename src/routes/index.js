const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const authRoutes = require("./authRoutes");
const scraperRoutes = require("./scraperRoutes");
const fileRoutes = require("./fileRoutes");
const userRoutes = require("./userRoutes");

// Public Routes
router.use("/auth", authRoutes);

// Protected Routes
router.use("/", authenticateToken, scraperRoutes);
router.use("/", authenticateToken, fileRoutes);
router.use("/", authenticateToken, userRoutes);

module.exports = router;
