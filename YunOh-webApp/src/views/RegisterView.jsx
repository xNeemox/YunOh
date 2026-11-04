import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Circle,
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

  // --- Real-Time Password Strength Evaluation ---
  const pwdChecks = {
    minLength: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  const pwdScore = Object.values(pwdChecks).filter(Boolean).length;

  // Mandate at least 8 characters AND at least 3 of 4 security rules ("Decent/Good" or "Strong")
  const isPasswordAcceptable = pwdChecks.minLength && pwdScore >= 3;

  const getStrengthMeta = () => {
    if (!password) return { label: "Enter password", levelClass: "weak" };
    if (!pwdChecks.minLength || pwdScore <= 1) {
      return { label: "Weak", levelClass: "weak" };
    }
    if (pwdScore === 2) {
      return { label: "Fair (Too Weak)", levelClass: "fair" };
    }
    if (pwdScore === 3) {
      return { label: "Decent / Good", levelClass: "good" };
    }
    return { label: "Strong", levelClass: "strong" };
  };

  const strengthMeta = getStrengthMeta();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      setErrorMessage("Please enter a valid username.");
      setLoading(false);
      return;
    }

    // Enforce Decent-Strong Password Gate before calling Supabase
    if (!isPasswordAcceptable) {
      setErrorMessage(
        "Please create a stronger password (at least 8 characters with a mix of uppercase/lowercase letters, numbers, or symbols).",
      );
      setLoading(false);
      return;
    }

    // 1. Pre-check if username is already taken in public.profiles
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingUser) {
      setErrorMessage("That username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    // 2. Sign up user in Supabase Auth and pass metadata for the DB trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: cleanUsername,
          role: "consumer",
        },
      },
    });

    if (authError) {
      setErrorMessage(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;

    // 3. If an active session exists immediately, safely upsert profile row
    if (userId && authData.session) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        [
          {
            id: userId,
            username: cleanUsername,
            email: cleanEmail,
            full_name: cleanUsername,
            role: "consumer",
          },
        ],
        { onConflict: "id" },
      );

      if (profileError) {
        setErrorMessage(profileError.message);
        setLoading(false);
        return;
      }
    }

    setSuccessMessage("Registration successful! You can now sign in.");
    setUsername("");
    setEmail("");
    setPassword("");
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
            placeholder="Password (8+ characters)"
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

        {/* Live Password Strength Meter & Checklist (Visible while typing) */}
        {password.length > 0 && (
          <div className="pwd-strength-box">
            <div className="pwd-strength-header">
              <span className="pwd-strength-title">Password Strength</span>
              <span className={`pwd-strength-badge ${strengthMeta.levelClass}`}>
                {strengthMeta.label}
              </span>
            </div>

            <div className="pwd-bars-row">
              {[1, 2, 3, 4].map((barNum) => (
                <div
                  key={barNum}
                  className={`pwd-bar-segment ${
                    pwdScore >= barNum
                      ? `active ${strengthMeta.levelClass}`
                      : ""
                  }`}
                />
              ))}
            </div>

            <div className="pwd-checklist">
              <div
                className={`pwd-check-item ${pwdChecks.minLength ? "met" : ""}`}
              >
                {pwdChecks.minLength ? (
                  <CheckCircle size={12} />
                ) : (
                  <Circle size={12} />
                )}
                <span>8+ Characters</span>
              </div>

              <div
                className={`pwd-check-item ${pwdChecks.mixedCase ? "met" : ""}`}
              >
                {pwdChecks.mixedCase ? (
                  <CheckCircle size={12} />
                ) : (
                  <Circle size={12} />
                )}
                <span>Upper & Lowercase</span>
              </div>

              <div
                className={`pwd-check-item ${pwdChecks.hasNumber ? "met" : ""}`}
              >
                {pwdChecks.hasNumber ? (
                  <CheckCircle size={12} />
                ) : (
                  <Circle size={12} />
                )}
                <span>At least 1 Number</span>
              </div>

              <div
                className={`pwd-check-item ${pwdChecks.hasSymbol ? "met" : ""}`}
              >
                {pwdChecks.hasSymbol ? (
                  <CheckCircle size={12} />
                ) : (
                  <Circle size={12} />
                )}
                <span>Special Symbol</span>
              </div>
            </div>
          </div>
        )}

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
