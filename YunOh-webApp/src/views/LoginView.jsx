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

    // 1. Authenticate user credentials with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setErrorMessage(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;

    if (userId) {
      // 2. Fetch their role from your public.profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name, username")
        .eq("id", userId)
        .single();

      if (profileError) {
        setErrorMessage(
          "Login successful, but failed to fetch user role: " +
            profileError.message,
        );
        setLoading(false);
      } else {
        setLoading(false);
        // 3. Pass both session and role up to App.jsx for role-based routing
        if (onLoginSuccess) {
          onLoginSuccess({
            session: authData.session,
            role: profileData.role, // 'consumer', 'owner', or 'admin'
            profile: profileData,
          });
        }
      }
    }
  };

  return (
    <div className="auth-penpot-container">
      {/* Brand Logo Badge */}
      <div className="auth-brand-badge">
        <span>YanOh</span>
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
            type="email"
            placeholder="Email Address"
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
