const mongoose = require("mongoose");

const twoFactorAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
    unique: true
  },
  secret: {
    type: String,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TwoFactorAuth", twoFactorAuthSchema); 