const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  uploadImage,
  googleAuth,
  facebookAuth,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  generate2FASecret,
  verify2FAToken,
  disable2FA
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/upload-image", uploadImage);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/google", googleAuth);
router.post("/facebook", facebookAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);
router.put("/update/:id", authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'imageVerif', maxCount: 1 }
]), updateProfile);
router.get("/check-auth", authMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      address: user.address,
      phone: user.phone,
      image: user.image,
      imageVerif: user.imageVerif,
      role: user.role
    }
  });
});

// 2FA Routes
router.post("/2fa/generate", authMiddleware, generate2FASecret);
router.post("/2fa/verify", authMiddleware, verify2FAToken);
router.post("/2fa/disable", authMiddleware, disable2FA);

module.exports = router;
