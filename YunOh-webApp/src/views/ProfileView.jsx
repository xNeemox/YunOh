import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient"; // Make sure this path matches your Phase 1 setup
import "./ProfileView.css"; // Optional: For styling the profile view

export default function ProfileView({ session, setSession }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle Login / Registration submission
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (isRegistering) {
      // Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(
          "Registration successful! Check your email for confirmation or sign in.",
        );
        setIsRegistering(false);
      }
    } else {
      // Supabase Sign In
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSession(data.session);
        setSuccessMessage("Successfully logged in!");
      }
    }
    setLoading(false);
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setEmail("");
    setPassword("");
    setSuccessMessage("Logged out successfully.");
  };

  return (
    <div className="profile-view">
      <div className="welcome-banner">
        <h3>Account & Profile 👤</h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            margin: "4px 0 16px 0",
          }}
        >
          {session
            ? "Manage your YunOh account session."
            : "Sign in to sync your favorites and preferences."}
        </p>
      </div>

      {session ? (
        /* --- LOGGED IN STATE --- */
        <div className="profile-card">
          <div className="profile-avatar">
            <User size={32} color="#FFFFFF" />
          </div>
          <div className="profile-info">
            <span
              style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
            >
              Signed in as
            </span>
            <h4 style={{ margin: "2px 0 12px 0", wordBreak: "break-all" }}>
              {session.user.email}
            </h4>
          </div>

          <button onClick={handleLogout} className="auth-submit-btn logout-btn">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      ) : (
        /* --- LOGGED OUT STATE (AUTH FORM) --- */
        <div className="auth-container">
          {/* Auth Mode Toggle Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${!isRegistering ? "active" : ""}`}
              onClick={() => {
                setIsRegistering(false);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${isRegistering ? "active" : ""}`}
              onClick={() => {
                setIsRegistering(true);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Register
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="auth-alert error">
              <AlertCircle size={16} /> <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="auth-alert success">
              <CheckCircle size={16} /> <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-field-wrapper">
                <Mail size={16} color="var(--text-secondary)" />
                <input
                  type="email"
                  placeholder="student@yunoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-field-wrapper">
                <Lock size={16} color="var(--text-secondary)" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isRegistering
                  ? "Create Account"
                  : "Sign In to YunOh"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
