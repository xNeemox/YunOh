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
  ShieldCheck,
  X,
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

  // Option A: Post-Submit Terms & Conditions Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  // Step 1: Validate inputs, username uniqueness & email uniqueness, then open Terms Modal
  const handleInitiateRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      setErrorMessage("Please enter a valid username.");
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

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

    // 2. Pre-check if email address is already registered in public.profiles
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();

    setLoading(false);

    if (existingEmail) {
      setErrorMessage(
        "That email address is already registered. Please sign in or use a different email.",
      );
      return;
    }

    // Open Terms & Conditions Modal to finalize account creation
    setAgreedToTerms(false);
    setShowTermsModal(true);
  };

  // Step 2: Finalize Registration in Supabase after User Accepts Terms & Conditions
  const handleConfirmTermsAndRegister = async () => {
    if (!agreedToTerms) return;

    setLoading(true);
    setErrorMessage("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Sign up user in Supabase Auth and pass metadata for the DB trigger
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
      setShowTermsModal(false);
      setErrorMessage(authError.message);
      setLoading(false);
      return;
    }

    // Catch Supabase Auth's obfuscated duplicate email response (empty identities array)
    if (
      authData?.user &&
      Array.isArray(authData.user.identities) &&
      authData.user.identities.length === 0
    ) {
      setShowTermsModal(false);
      setErrorMessage(
        "This email address is already in use by another account. Please sign in instead.",
      );
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;

    // If an active session exists immediately, safely upsert profile row
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
        setShowTermsModal(false);
        if (profileError.code === "23505") {
          setErrorMessage(
            "That username or email address is already registered.",
          );
        } else {
          setErrorMessage(profileError.message);
        }
        setLoading(false);
        return;
      }
    }

    setShowTermsModal(false);
    setAgreedToTerms(false);
    setSuccessMessage(
      "Terms accepted & registration successful! You can now sign in.",
    );
    setUsername("");
    setEmail("");
    setPassword("");
    setLoading(false);
  };

  return (
    <div className="auth-penpot-container">
      {/* Brand Logo Badge */}
      <div className="auth-brand-badge">
        <span>YanOh</span>
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

      <form onSubmit={handleInitiateRegister} className="auth-penpot-form">
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
          {loading ? "Validating..." : "Sign Up"}
        </button>
      </form>

      <div className="penpot-footer-prompt">
        <span>Already have account? </span>
        <button onClick={switchToLogin} className="penpot-link-btn">
          Sign in
        </button>
      </div>

      {/* OPTION A: Post-Submit Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="auth-terms-overlay">
          <div className="auth-terms-modal">
            <div className="auth-terms-header">
              <div className="auth-terms-title-row">
                <ShieldCheck size={18} color="var(--accent-color)" />
                <h3>Terms & Conditions</h3>
              </div>
              <button
                type="button"
                className="auth-terms-close-btn"
                onClick={() => setShowTermsModal(false)}
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-terms-scroll-body">
              <div className="auth-terms-section">
                <h4>1. Welcome to YanOh (Bayombong, Nueva Vizcaya)</h4>
                <p>
                  By creating a consumer account on YanOh, you agree to use our
                  local dining discovery and digital promo platform responsibly
                  and in good faith.
                </p>
              </div>

              <div className="auth-terms-section">
                <h4>2. Community Reviews & Dish Ratings</h4>
                <p>
                  You agree to submit honest, respectful, and authentic reviews
                  and star ratings based on real dining experiences. Spam,
                  defamatory language, or fraudulent ratings may be removed by
                  administrators.
                </p>
              </div>

              <div className="auth-terms-section">
                <h4>3. Digital Vouchers & Storefront Promos</h4>
                <p>
                  Digital vouchers claimed on YanOh are limited to one voucher
                  per user per establishment and are subject to each local
                  merchant's operating hours and verification upon redemption.
                </p>
              </div>

              <div className="auth-terms-section">
                <h4>4. Location & Distance Services</h4>
                <p>
                  With your permission, YanOh uses device GPS coordinates solely
                  to calculate real-time distance to dining establishments in
                  Bayombong, Nueva Vizcaya.
                </p>
              </div>

              <div className="auth-terms-section">
                <h4>5. Data Privacy Compliance (RA 10173)</h4>
                <p>
                  In accordance with the Philippine Data Privacy Act of 2012,
                  your account details (username and email) are securely
                  encrypted and never shared with unauthorized third parties.
                </p>
              </div>
            </div>

            <label className="auth-terms-checkbox-row">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span>
                I have read and agree to the YanOh Terms & Conditions and Data
                Privacy Policy.
              </span>
            </label>

            <div className="auth-terms-actions">
              <button
                type="button"
                className="auth-terms-decline-btn"
                onClick={() => setShowTermsModal(false)}
                disabled={loading}
              >
                Decline
              </button>
              <button
                type="button"
                className="auth-terms-accept-btn"
                onClick={handleConfirmTermsAndRegister}
                disabled={!agreedToTerms || loading}
              >
                {loading ? "Creating Account..." : "Accept & Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
