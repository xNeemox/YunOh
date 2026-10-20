import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./AuthViews.css";

export default function RegisterView({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Supabase auth sign up (using email)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Registration successful! You can now sign in.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-penpot-container">
      {/* Brand Logo Badge */}
      <div className="auth-brand-badge">
        <span>YunOh</span>
      </div>

      <div className="auth-text-header">
        <h2>Register</h2>
        <p>Please register to login</p>
      </div>

      {errorMessage && (
        <div className="auth-alert error">
          <AlertCircle size={14} /> <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="auth-alert success">
          <CheckCircle size={14} /> <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="auth-penpot-form">
        <div className="penpot-input-group">
          <User size={18} className="penpot-input-icon" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="penpot-input"
          />
        </div>

        <div className="penpot-input-group">
          <Mail size={18} className="penpot-input-icon" />
          <input
            type="text"
            placeholder="Email/Phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="penpot-input"
          />
        </div>

        <div className="penpot-input-group">
          <Lock size={18} className="penpot-input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="penpot-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="penpot-eye-btn"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button type="submit" className="penpot-submit-btn" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <div className="penpot-footer-prompt">
        <span>Already have account? </span>
        <button onClick={switchToLogin} className="penpot-link-btn">
          Sign in
        </button>
      </div>
    </div>
  );
}
