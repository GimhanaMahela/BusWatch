const express = require("express");

const router = express.Router();

router.use("/reports", require("./report.routes"));
router.use("/auth", require("./auth.routes"));

module.exports = router;
