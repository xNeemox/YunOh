import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./AuthViews.css";

export default function LoginView({ onLoginSuccess, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(data.session);
    }
  };

  return (
    <div className="auth-penpot-container">
      {/* Brand Logo Badge */}
      <div className="auth-brand-badge">
        <span>YunOh</span>
      </div>

      <div className="auth-text-header" style={{ marginBottom: "24px" }}>
        <h2>Login</h2>
      </div>

      {errorMessage && (
        <div className="auth-alert error">
          <AlertCircle size={14} /> <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="auth-penpot-form">
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
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="penpot-footer-prompt">
        <span>You don't have account? </span>
        <button onClick={switchToRegister} className="penpot-link-btn">
          Sign up
        </button>
      </div>
    </div>
  );
}
