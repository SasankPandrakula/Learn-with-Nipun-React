import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

const API_BASE_URL = "https://learn-with-nipun-react-1.onrender.com/api/auth";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (form.phone.length < 10) {
      setError("Phone number must be at least 10 digits");
      return false;
    }
    return true;
  };

  // ---------------- NORMAL SIGNUP ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/signup`, form, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000, // 30 second timeout for cold start
      });

      alert(res.data.message || "Verification email sent! Check your inbox.");
      setForm({ name: "", email: "", phone: "" });
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Signup failed. Please try again.";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE SIGNUP ----------------
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/google`,
        {
          token: credentialResponse.credential,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000, // 30 second timeout for cold start
        }
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        alert("Google signup successful!");
        navigate("/home");
      } else {
        setError("No token received from server");
        alert("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      const errorMessage =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Google signup failed";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("Google login failed:", error);
    setError("Google login failed. Please try again.");
    alert("Google login failed. Please try again.");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/Logo.png" alt="Logo" className="auth-logo" />

        <h2>Student Signup</h2>

        {/* Error Message */}
        {error && <div className="error-message" style={{
          color: "red",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "4px",
          backgroundColor: "#ffe0e0",
          fontSize: "14px"
        }}>
          {error}
        </div>}

        {/* Normal Signup */}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setError("");
            }}
            required
            disabled={loading}
          />
          <input
            placeholder="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value });
              setError("");
            }}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setError("");
            }}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Submit"}
          </button>
        </form>

        <p>OR</p>

        {/* Google Signup */}
        <div className="google-btn" style={{ opacity: googleLoading ? 0.6 : 1 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
          />
        </div>

        <p>
          Already registered?{" "}
          <span
            className="login-link"
            onClick={() => navigate("/login")}
            style={{ cursor: "pointer" }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
