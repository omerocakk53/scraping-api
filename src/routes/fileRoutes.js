const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

router.get("/files", fileController.listFiles);
router.get("/files/:filename", fileController.getFile);
router.delete("/files/:filename", fileController.deleteFile);

module.exports = router;
