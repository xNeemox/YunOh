import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
  Store,
  Tag,
  Clock,
  Ticket,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./ProfileView.css";

export default function ProfileView({ session, setSession }) {
  const [isRegisteringAuth, setIsRegisteringAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Business Registration Form State
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizCategory, setBizCategory] = useState("Local Delicacy");
  const [bizAddress, setBizAddress] = useState("");
  const [bizPromo, setBizPromo] = useState("");
  const [bizOpenTime, setBizOpenTime] = useState("08:00");
  const [bizCloseTime, setBizCloseTime] = useState("21:00");
  const [bizLoading, setBizLoading] = useState(false);
  const [bizSuccess, setBizSuccess] = useState("");

  // --- NEW: User Vouchers Wallet State ---
  const [myVouchers, setMyVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  // Fetch user's claimed vouchers when session is active
  useEffect(() => {
    if (session) {
      fetchMyVouchers();
    }
  }, [session]);

  const fetchMyVouchers = async () => {
    setVouchersLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_vouchers")
        .select(
          `
          id,
          voucher_code,
          promo_text,
          claimed_at,
          businesses ( name, address )
        `,
        )
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching vouchers:", error.message);
      } else {
        setMyVouchers(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching vouchers:", err);
    } finally {
      setVouchersLoading(false);
    }
  };

  // Handle Login / Registration submission
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (isRegisteringAuth) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(
          "Registration successful! Check your email for confirmation or sign in.",
        );
        setIsRegisteringAuth(false);
      }
    } else {
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
    setShowBusinessForm(false);
    setMyVouchers([]);
    setSuccessMessage("Logged out successfully.");
  };

  // Handle Business Submission to Supabase
  const handleRegisterBusiness = async (e) => {
    e.preventDefault();
    setBizLoading(true);
    setBizSuccess("");
    setErrorMessage("");

    try {
      const { error } = await supabase.from("businesses").insert([
        {
          name: bizName,
          category: bizCategory,
          address: bizAddress,
          promo: bizPromo,
          open_time: bizOpenTime,
          close_time: bizCloseTime,
          rating: 5.0,
          reviews: 1,
          distance: "0.5 km",
          imageColor: "#B8543A",
          owner_id: session.user.id,
        },
      ]);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setBizSuccess(
          "Establishment registered successfully! Check your Discover feed.",
        );
        setBizName("");
        setBizAddress("");
        setBizPromo("");
        setShowBusinessForm(false);
      }
    } catch (err) {
      setErrorMessage("Unexpected error inserting business record.");
    } finally {
      setBizLoading(false);
    }
  };

  return (
    <div className="profile-view">
      <div className="welcome-banner">
        <h3>Account & Wallet 👤</h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            margin: "4px 0 16px 0",
          }}
        >
          {session
            ? "Manage your business, profile, and claimed promotional vouchers."
            : "Sign in to sync your favorites and digital vouchers."}
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

          {/* Success / Error Messages */}
          {bizSuccess && (
            <div
              className="auth-alert success"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <CheckCircle size={16} /> <span>{bizSuccess}</span>
            </div>
          )}
          {errorMessage && (
            <div
              className="auth-alert error"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <AlertCircle size={16} /> <span>{errorMessage}</span>
            </div>
          )}

          {/* Business Registration Toggle / Form */}
          {!showBusinessForm ? (
            <button
              onClick={() => setShowBusinessForm(true)}
              className="auth-submit-btn"
              style={{
                width: "100%",
                backgroundColor: "var(--accent-color)",
                marginBottom: "16px",
              }}
            >
              <Store size={16} /> Register Your Establishment 🏢
            </button>
          ) : (
            <form
              onSubmit={handleRegisterBusiness}
              className="auth-form"
              style={{
                width: "100%",
                textAlign: "left",
                marginTop: "10px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem" }}>
                  Add New Dining Spot
                </h4>
                <button
                  type="button"
                  onClick={() => setShowBusinessForm(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Cancel
                </button>
              </div>

              <div className="input-group">
                <label>Restaurant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kape Indio"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  required
                  className="auth-input input-field-wrapper"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div className="input-group">
                <label>Category</label>
                <select
                  value={bizCategory}
                  onChange={(e) => setBizCategory(e.target.value)}
                  className="auth-input input-field-wrapper"
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  <option value="Local Delicacy">Local Delicacy</option>
                  <option value="Cafe & Coffee">Cafe & Coffee</option>
                  <option value="Grill / Casual">Grill / Casual</option>
                  <option value="Fast Food">Fast Food</option>
                </select>
              </div>

              <div className="input-group">
                <label>Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Centro 1, Delfin Albano"
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  required
                  className="auth-input input-field-wrapper"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div className="input-group">
                <label>Active Promo / Voucher</label>
                <input
                  type="text"
                  placeholder="e.g. 10% off on special meals"
                  value={bizPromo}
                  onChange={(e) => setBizPromo(e.target.value)}
                  required
                  className="auth-input input-field-wrapper"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Opening Time (24h)</label>
                  <input
                    type="text"
                    placeholder="08:00"
                    value={bizOpenTime}
                    onChange={(e) => setBizOpenTime(e.target.value)}
                    required
                    className="auth-input input-field-wrapper"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Closing Time (24h)</label>
                  <input
                    type="text"
                    placeholder="21:00"
                    value={bizCloseTime}
                    onChange={(e) => setBizCloseTime(e.target.value)}
                    required
                    className="auth-input input-field-wrapper"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={bizLoading}
                style={{ width: "100%", marginTop: "8px" }}
              >
                {bizLoading
                  ? "Publishing to Supabase..."
                  : "Publish Establishment"}
              </button>
            </form>
          )}

          {/* --- NEW: My Claimed Vouchers Wallet Section --- */}
          <div
            style={{
              width: "100%",
              textAlign: "left",
              borderTop: "1px solid var(--border-color, #eee)",
              paddingTop: "16px",
              marginTop: "8px",
            }}
          >
            <h4
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "1rem",
                marginBottom: "12px",
              }}
            >
              <Ticket size={18} color="var(--accent-color)" /> My Claimed
              Vouchers Wallet 🎟️
            </h4>

            {vouchersLoading ? (
              <p
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
              >
                Loading your vouchers...
              </p>
            ) : myVouchers.length === 0 ? (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  No vouchers claimed yet. Browse live spots in Discover to
                  claim promos!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "250px",
                  overflowY: "auto",
                }}
              >
                {myVouchers.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: "10px",
                      border: "1px solid var(--accent-color)",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-card, #fff)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "var(--accent-color)",
                      }}
                    >
                      {v.businesses?.name || "Local Establishment"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                        margin: "2px 0",
                      }}
                    >
                      {v.promo_text}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          background: "rgba(0,0,0,0.05)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {v.voucher_code}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {new Date(v.claimed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: "100%", marginTop: "16px" }}>
            <button
              onClick={handleLogout}
              className="auth-submit-btn logout-btn"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      ) : (
        /* --- LOGGED OUT STATE (AUTH FORM) --- */
        <div className="auth-container">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${!isRegisteringAuth ? "active" : ""}`}
              onClick={() => {
                setIsRegisteringAuth(false);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${isRegisteringAuth ? "active" : ""}`}
              onClick={() => {
                setIsRegisteringAuth(true);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Register
            </button>
          </div>

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
                : isRegisteringAuth
                  ? "Create Account"
                  : "Sign In to YunOh"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
