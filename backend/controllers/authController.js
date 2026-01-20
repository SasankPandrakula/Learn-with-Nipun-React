// authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../Utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// 🔹 Signup → Send verification email
exports.signup = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Generate JWT token for verification
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "10m" });

    // Create user in DB with isVerified: false
    await User.create({ name, email, phone, isVerified: false });

    // Verification link
    const link = `${process.env.SERVER_URL || "http://localhost:5000"}/api/auth/verify/${token}`;
    console.log("Verification link:", link); // 🔥 DEBUG

    // Send verification email
    await sendEmail(email, "Verify your email", `
      <h3>Email Verification</h3>
      <a href="${link}">Click here to verify your email</a>
    `);

    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Email verification
exports.verifyEmail = async (req, res) => {
  try {
    console.log("VERIFY ROUTE HIT ✅");

    const token = req.params.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      { isVerified: true },
      { new: true }
    );

    if (!user) return res.status(400).send("User not found");

    res.redirect(`${CLIENT_URL}/login?verified=true`);
  } catch (err) {
    console.error("Email verification error:", err);

    // Handle token expired
    if (err.name === "TokenExpiredError") {
      return res.redirect(`${CLIENT_URL}/login?verified=expired`);
    }

    res.redirect(`${CLIENT_URL}/login?verified=false`);
  }
};

// 🔹 Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    console.log("OTP:", otp); // 🔥 DEBUG
    // You can send email via nodemailer here

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ msg: "OTP verification failed" });
  }
};

// 🔹 Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: "Token missing" });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        isVerified: true,
        googleId: sub,
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ msg: "Google authentication failed" });
  }
};
