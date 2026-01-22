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

    // ✅ Send response FIRST
    res.json({ message: "Verification email sent" });

    // 🔄 Send verification email in background (non-blocking)
    sendEmail(email, "Verify your email", `
      <h3>Email Verification</h3>
      <a href="${link}">Click here to verify your email</a>
    `)
      .then(() => {
        console.log(`✅ Verification email sent successfully to ${email}`);
        User.findOneAndUpdate({ email }, { verificationEmailSent: true });
      })
      .catch(async (err) => {
        console.error(`❌ Failed to send verification email to ${email}:`, err.message);
        console.error("Full error:", err);
        // Log error to database
        await User.findOneAndUpdate(
          { email },
          { verificationEmailError: err.message }
        ).catch(dbErr => console.error("DB update error:", dbErr));
      });

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

    console.log("OTP generated:", otp); // 🔥 DEBUG

    try {
      // Send OTP via email
      await sendEmail(
        email,
        "Your OTP for Login",
        `
          <h3>Email Verification OTP</h3>
          <p>Your OTP is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 5 minutes.</p>
          <p>Do not share this OTP with anyone.</p>
        `
      );
      console.log(`✅ OTP email sent to ${email}`);
      res.json({ message: "OTP sent to your email" });
    } catch (emailError) {
      console.error(`❌ Email sending failed for ${email}:`, emailError.message);
      // Still return success but log the error
      res.status(500).json({ 
        message: "OTP generated but failed to send email",
        error: emailError.message,
        otp: otp // Debug: Return OTP for testing
      });
    }
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
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

    const payload = ticket.getPayload();
    const { name, email, sub, picture } = payload;

    if (!email) return res.status(400).json({ msg: "Email not found in token" });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        isVerified: true,
        googleId: sub,
      });
      console.log("New user created:", email);
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      token: jwtToken, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error("Google login error:", err.message);
    
    if (err.message && err.message.includes("Token used too late")) {
      return res.status(401).json({ msg: "Token expired. Please try again." });
    }
    if (err.message && err.message.includes("Invalid token")) {
      return res.status(401).json({ msg: "Invalid token. Please try again." });
    }
    
    res.status(401).json({ msg: "Google authentication failed", error: err.message });
  }
};
