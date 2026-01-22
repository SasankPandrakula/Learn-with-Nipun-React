const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  googleId: String,
  avatar: String,
  verificationEmailSent: { type: Boolean, default: false },
  verificationEmailError: String
});

module.exports = mongoose.model("User", userSchema);

