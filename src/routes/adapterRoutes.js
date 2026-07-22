const express = require("express");
const router = express.Router();
const adapterController = require("../controllers/adapterController");

router.get("/adapters", adapterController.listAdapters);

module.exports = router;
