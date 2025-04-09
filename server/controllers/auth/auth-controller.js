const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ResetToken = require("../../models/ResetToken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const TwoFactorAuth = require('../../models/TwoFactorAuth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const result = await cloudinary.uploader.upload_stream({
      resource_type: 'auto',
      folder: 'user_images'
    }, (error, result) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Error uploading image to Cloudinary"
        });
      }
      
      res.status(200).json({
        success: true,
        result
      });
    }).end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error processing image upload"
    });
  }
};

//register
const registerUser = async (req, res) => {
  const { username, email, password, firstname, lastname, address, phone, image, imageVerif } = req.body;

  try {
    // Vérifier que tous les champs requis sont présents
    const requiredFields = {
      username: "Username",
      email: "Email",
      password: "Password",
      firstname: "First Name",
      lastname: "Last Name",
      address: "Address",
      phone: "Phone",
      image: "Profile Image",
      imageVerif: "Verification Image"
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Valider la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Valider le format du numéro de téléphone
    const phoneRegex = /^[0-9+\-\s()]*$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    // Check if user already exists
    const checkUser = await User.findOne({ email });
    if (checkUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with the same email! Please try again",
      });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 12);

    // Organiser les données de l'utilisateur
    const userData = {
      // Informations de base
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashPassword,
      
      // Informations personnelles
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      
      // Informations de contact
      address: address.trim(),
      phone: phone.trim(),
      
      // Images
      image: image,
      imageVerif: imageVerif,
      
      // Rôle et statut
      role: "user"
    };

    // Create a new user
    const newUser = new User(userData);

    await newUser.save();

    // Générer les tokens
    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        email: newUser.email,
        username: newUser.username,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    const refreshToken = jwt.sign(
      { id: newUser._id },
      "CLIENT_REFRESH_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Mettre à jour l'utilisateur avec les tokens
    newUser.token = token;
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: {
        // Informations de base
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        
        // Informations personnelles
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        
        // Informations de contact
        address: newUser.address,
        phone: newUser.phone,
        
        // Images
        image: newUser.image,
        imageVerif: newUser.imageVerif,
        
        // Rôle et statut
        role: newUser.role,
        
        // Tokens
        token: newUser.token,
        refreshToken: newUser.refreshToken
      }
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred during registration",
      error: error.message
    });
  }
};

//login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const checkUser = await User.findOne({ email });
    if (!checkUser)
      return res.json({
        success: false,
        message: "User doesn't exist! Please register first",
      });

    // Si l'utilisateur s'authentifie avec Google ou Facebook
    if (password.startsWith('google_auth_') || password.startsWith('facebook_auth_')) {
      // Vérifier si le mot de passe correspond au préfixe attendu
      if (checkUser.isGoogleAuth && !password.startsWith('google_auth_')) {
        return res.json({
          success: false,
          message: "Please use Google authentication",
        });
      }
      if (checkUser.isFacebookAuth && !password.startsWith('facebook_auth_')) {
        return res.json({
          success: false,
          message: "Please use Facebook authentication",
        });
      }
    } else {
      // Pour l'authentification normale, vérifier le mot de passe
      const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
      if (!checkPasswordMatch)
        return res.json({
          success: false,
          message: "Incorrect password! Please try again",
        });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        username: checkUser.username,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: checkUser._id },
      "CLIENT_REFRESH_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Save tokens to the user document
    checkUser.token = token;
    checkUser.refreshToken = refreshToken;
    await checkUser.save();

    res.cookie("token", token, { httpOnly: true, secure: false }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        username: checkUser.username,
        firstname: checkUser.firstname,
        lastname: checkUser.lastname,
        image: checkUser.image,
        imageVerif: checkUser.imageVerif,
        address: checkUser.address,
        phone: checkUser.phone,
        isGoogleAuth: checkUser.isGoogleAuth,
        isFacebookAuth: checkUser.isFacebookAuth
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

//logout
const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

//auth middleware
const authMiddleware = async (req, res, next) => {
  // Check for token in cookie first
  let token = req.cookies.token;
  
  // If no token in cookie, check Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
  }

  try {
    const decoded = jwt.verify(token, "CLIENT_SECRET_KEY");
    const user = await User.findById(decoded.id).select('-password -token -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found!",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
  }
};

// Google authentication
const googleAuth = async (req, res) => {
  const { email, username, image } = req.body;

  try {
    // Validate required fields
    if (!email || !username) {
      return res.status(400).json({
        success: false,
        message: "Email and username are required"
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        username,
        image,
        role: 'user',
        isGoogleAuth: true,
        password: 'google_auth_' + Math.random().toString(36).substring(7) // Generate a random password for Google auth users
      });
      await user.save();
    } else if (!user.isGoogleAuth) {
      // If user exists but not with Google auth, update the user
      user.isGoogleAuth = true;
      user.image = image || user.image;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET || "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || "CLIENT_REFRESH_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Save tokens to the user document
    user.token = token;
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie and send response
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: user.email,
        role: user.role,
        id: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        image: user.image,
        imageVerif: user.imageVerif,
        address: user.address,
        phone: user.phone,
        isGoogleAuth: user.isGoogleAuth
      }
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Error during Google authentication",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Facebook authentication
const facebookAuth = async (req, res) => {
  const { email, username, image } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        username,
        image,
        role: 'user',
        isFacebookAuth: true,
        password: 'facebook_auth_' + Math.random().toString(36).substring(7) // Generate a random password for Facebook auth users
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        username: user.username,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      "CLIENT_REFRESH_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Save tokens to the user document
    user.token = token;
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie and send response like normal login
    res.cookie("token", token, { httpOnly: true, secure: false }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: user.email,
        role: user.role,
        id: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        image: user.image,
        imageVerif: user.imageVerif,
        address: user.address,
        phone: user.phone,
        isFacebookAuth: user.isFacebookAuth
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error during Facebook authentication"
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, address, phone, password } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update user fields if provided
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (address) user.address = address;
    if (phone) user.phone = phone;

    // Handle profile image upload
    if (req.files && req.files.image) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
          resource_type: 'auto',
          folder: 'user_images'
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        uploadStream.end(req.files.image[0].buffer);
      });
      user.image = result.secure_url;
    }

    // Handle verification image upload
    if (req.files && req.files.imageVerif) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
          resource_type: 'auto',
          folder: 'user_verifications'
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        uploadStream.end(req.files.imageVerif[0].buffer);
      });
      user.imageVerif = result.secure_url;
    }

    // Update password if provided
    if (password) {
      const hashPassword = await bcrypt.hash(password, 12);
      user.password = hashPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    console.log("Starting forgot password process for email:", email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log("No user found with email:", email);
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé avec cet email"
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    console.log("Generated reset token for user:", user._id);
    
    // Save reset token
    const resetToken = await ResetToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });
    console.log("Reset token saved to database:", resetToken._id);

    // Create email transporter with updated configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("Email transporter verified successfully");
    } catch (error) {
      console.error("Email transporter verification failed:", error);
      throw new Error("Email configuration error");
    }

    // Email content
    const resetUrl = `http://localhost:5173/auth/reset-password/${token}`;
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `
    };

    // Send email
    console.log("Attempting to send reset email to:", email);
    const info = await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully:", info.messageId);

    res.status(200).json({
      success: true,
      message: "Email de réinitialisation envoyé"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de réinitialisation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token et nouveau mot de passe requis"
    });
  }

  try {
    console.log("Starting password reset process for token:", token);
    
    // Find valid reset token
    const resetToken = await ResetToken.findOne({
      token: token.trim(),
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      console.log("Invalid or expired token");
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }

    console.log("Found valid reset token for user:", resetToken.userId);

    // Find user
    const user = await User.findById(resetToken.userId);
    if (!user) {
      console.log("User not found for token");
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    console.log("Found user:", user._id);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Password hashed successfully");

    // Update user password
    user.password = hashedPassword;
    await user.save();
    console.log("User password updated successfully");

    // Delete used token
    await ResetToken.deleteOne({ _id: resetToken._id });
    console.log("Reset token deleted successfully");

    res.status(200).json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify Reset Token
const verifyResetToken = async (req, res) => {
  const { token } = req.body;

  try {
    const resetToken = await ResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }

    res.status(200).json({
      success: true,
      message: "Token valide"
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du token"
    });
  }
};

// Generate 2FA Secret
const generate2FASecret = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: `YourApp:${user.email}`
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save or update 2FA secret
    await TwoFactorAuth.findOneAndUpdate(
      { userId: user._id },
      { 
        secret: secret.base32,
        isEnabled: false
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    console.error("Generate 2FA secret error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du secret 2FA"
    });
  }
};

// Verify 2FA Token
const verify2FAToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    // Get user's 2FA secret
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId: user._id });
    if (!twoFactorAuth) {
      return res.status(400).json({
        success: false,
        message: "2FA non configuré"
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Code invalide"
      });
    }

    // Enable 2FA
    twoFactorAuth.isEnabled = true;
    await twoFactorAuth.save();

    res.status(200).json({
      success: true,
      message: "2FA activé avec succès"
    });
  } catch (error) {
    console.error("Verify 2FA token error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du token 2FA"
    });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const user = req.user;

    await TwoFactorAuth.findOneAndDelete({ userId: user._id });

    res.status(200).json({
      success: true,
      message: "2FA désactivé avec succès"
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du 2FA"
    });
  }
};

module.exports = { 
  registerUser,
  uploadImage: [upload.single('my_file'), uploadImage],
  loginUser, 
  logoutUser, 
  authMiddleware,
  googleAuth,
  facebookAuth,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  generate2FASecret,
  verify2FAToken,
  disable2FA
};