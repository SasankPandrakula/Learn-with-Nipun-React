const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
  googleId: String
});

module.exports = mongoose.model("User", userSchema);

