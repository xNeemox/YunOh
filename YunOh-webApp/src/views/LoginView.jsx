import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Circle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./AuthViews.css";

export default function LoginView({ onLoginSuccess, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Mode states: 'login' | 'forgot' | 'reset_new_password'
  const [authMode, setAuthMode] = useState("login");

  // New Password states when user clicks recovery link from email
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Listen for Supabase PASSWORD_RECOVERY event when user returns from email link
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset_new_password");
        setErrorMessage("");
        setSuccessMessage(
          "Recovery link verified! Please enter your new strong password below.",
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Real-Time Password Strength Evaluation (For Resetting Password) ---
  const pwdChecks = {
    minLength: newPassword.length >= 8,
    mixedCase: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSymbol: /[^A-Za-z0-9]/.test(newPassword),
  };

  const pwdScore = Object.values(pwdChecks).filter(Boolean).length;
  const isNewPasswordAcceptable = pwdChecks.minLength && pwdScore >= 3;

  const getStrengthMeta = () => {
    if (!newPassword) return { label: "Enter password", levelClass: "weak" };
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

  // 1. Standard Sign In Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError) {
      setErrorMessage(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;

    if (userId) {
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
        if (onLoginSuccess) {
          onLoginSuccess({
            session: authData.session,
            role: profileData.role,
            profile: profileData,
          });
        }
      }
    }
  };

  // 2. Send Password Reset Email Handler
  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Please enter your registered email address.");
      setLoading(false);
      return;
    }

    // Pre-check if email exists in public.profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (!existingProfile) {
      setErrorMessage("No account found with that email address.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage(
        "Password reset link sent! Please check your email inbox and spam folder.",
      );
    }
  };

  // 3. Save New Password After Clicking Email Recovery Link
  const handleUpdateNewPassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isNewPasswordAcceptable) {
      setErrorMessage(
        "Please create a stronger password (at least 8 characters with uppercase/lowercase letters, numbers, or symbols).",
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setNewPassword("");
      setAuthMode("login");
      setSuccessMessage(
        "Password updated! You can now sign in with your new password.",
      );
    }
  };

  return (
    <div className="auth-penpot-container">
      {/* Brand Logo Badge */}
      <div className="auth-brand-badge">
        <span>YanOh</span>
      </div>

      {/* ================= MODE 1: STANDARD LOGIN ================= */}
      {authMode === "login" && (
        <>
          <div className="auth-text-header login-spacing">
            <h2>Login</h2>
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

            <div className="penpot-forgot-row">
              <button
                type="button"
                className="penpot-forgot-link"
                onClick={() => {
                  setAuthMode("forgot");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="penpot-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="penpot-footer-prompt">
            <span>You don't have account? </span>
            <button onClick={switchToRegister} className="penpot-link-btn">
              Sign up
            </button>
          </div>
        </>
      )}

      {/* ================= MODE 2: FORGOT PASSWORD (SEND EMAIL) ================= */}
      {authMode === "forgot" && (
        <>
          <button
            type="button"
            className="penpot-back-login-btn"
            onClick={() => {
              setAuthMode("login");
              setErrorMessage("");
              setSuccessMessage("");
            }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>

          <div className="auth-text-header">
            <h2>Forgot Password</h2>
            <p>Enter your email to receive a password reset link</p>
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

          <form onSubmit={handleSendResetEmail} className="auth-penpot-form">
            <div className="penpot-input-group">
              <Mail size={18} className="penpot-input-icon" />
              <input
                type="email"
                placeholder="Registered Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="penpot-input"
              />
            </div>

            <button
              type="submit"
              className="penpot-submit-btn"
              disabled={loading}
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>
        </>
      )}

      {/* ================= MODE 3: CREATE NEW PASSWORD (RECOVERY RETURN) ================= */}
      {authMode === "reset_new_password" && (
        <>
          <div className="auth-text-header">
            <h2>Set New Password</h2>
            <p>Enter a strong new password for your account</p>
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

          <form onSubmit={handleUpdateNewPassword} className="auth-penpot-form">
            <div className="penpot-input-group">
              <Lock size={18} className="penpot-input-icon" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password (8+ characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="penpot-input"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="penpot-eye-btn"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="pwd-strength-box">
                <div className="pwd-strength-header">
                  <span className="pwd-strength-title">Password Strength</span>
                  <span
                    className={`pwd-strength-badge ${strengthMeta.levelClass}`}
                  >
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
                    className={`pwd-check-item ${
                      pwdChecks.minLength ? "met" : ""
                    }`}
                  >
                    {pwdChecks.minLength ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Circle size={12} />
                    )}
                    <span>8+ Characters</span>
                  </div>

                  <div
                    className={`pwd-check-item ${
                      pwdChecks.mixedCase ? "met" : ""
                    }`}
                  >
                    {pwdChecks.mixedCase ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Circle size={12} />
                    )}
                    <span>Upper & Lowercase</span>
                  </div>

                  <div
                    className={`pwd-check-item ${
                      pwdChecks.hasNumber ? "met" : ""
                    }`}
                  >
                    {pwdChecks.hasNumber ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Circle size={12} />
                    )}
                    <span>At least 1 Number</span>
                  </div>

                  <div
                    className={`pwd-check-item ${
                      pwdChecks.hasSymbol ? "met" : ""
                    }`}
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

            <button
              type="submit"
              className="penpot-submit-btn"
              disabled={loading}
            >
              {loading ? "Updating Password..." : "Save New Password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
