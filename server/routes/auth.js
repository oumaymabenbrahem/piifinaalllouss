const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth/auth-controller");

// ... existing code ...

// Password reset routes
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ... existing code ...

module.exports = router; 