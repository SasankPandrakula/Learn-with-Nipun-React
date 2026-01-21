import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const navigate = useNavigate();

  // ---------------- NORMAL SIGNUP ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://learn-with-nipun-react-1.onrender.com/api/auth/signup",
        form,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      alert(res.data.message || "Verification email sent!");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  // ---------------- GOOGLE SIGNUP ----------------
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        "https://learn-with-nipun-react-1.onrender.com/api/auth/google",
        {
          token: credentialResponse.credential,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (error) {
      console.error("Google login error:", error.response?.data || error.message);
      alert("Google signup failed");
    }
  };

  const handleGoogleFailure = () => {
    alert("Google login failed");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/Logo.png" alt="Logo" className="auth-logo" />

        <h2>Student Signup</h2>

        {/* Normal Signup */}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <button type="submit">Submit</button>
        </form>

        <p>OR</p>

        {/* Google Signup */}
        <div className="google-btn">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
          />
        </div>

        <p>
          Already registered?{" "}
          <span className="login-link" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
