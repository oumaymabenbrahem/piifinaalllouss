const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // Informations de base
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleAuth;
    },
  },

  // Informations personnelles
  firstname: {
    type: String,
    required: false,
    trim: true,
  },
  lastname: {
    type: String,
    required: false,
    trim: true,
  },

  // Informations de contact
  address: {
    type: String,
    required: false,
    trim: true,
  },
  phone: {
    type: String,
    required: false,
    trim: true,
  },

  // Images
  image: {
    type: String,
    required: false,
  },
  imageVerif: {
    type: String,
    required: false,
  },

  // Rôle et statut
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  // Authentification
  isGoogleAuth: {
    type: Boolean,
    default: false,
  },
  isFacebookAuth: {
    type: Boolean,
    default: false,
  },

  // Tokens
  token: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // Options du schéma
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Supprimer le mot de passe lors de la sérialisation
      delete ret.password;
      return ret;
    }
  }
});

module.exports = mongoose.model("User", UserSchema);

