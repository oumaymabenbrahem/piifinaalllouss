const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Routes de réinitialisation de mot de passe
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router; 