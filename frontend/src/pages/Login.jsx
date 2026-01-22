import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

const API_BASE_URL = "https://learn-with-nipun-react-1.onrender.com/api/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const sendOtp = async () => {
    try {
      await axios.post(`${API_BASE_URL}/send-otp`, {
        email,
      });
      alert("OTP sent");
      setStep(2); // ✅ move to OTP screen
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/verify-otp`, {
        email,
        otp,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "Invalid OTP");
    }
  };

  // ✅ Show email verified message after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      alert("Email verified successfully ✅");
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/Logo.png" alt="Logo" className="auth-logo" />

        <h2>Login</h2>

        {step === 1 && (
          <>
            <input
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button onClick={sendOtp}>Send OTP</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
            <button onClick={verifyOtp}>Verify OTP</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
