import React, { useState, useEffect } from "react";
import {
  User,
  LogOut,
  Ticket,
  Store,
  Star,
  MessageSquare,
  Eye,
  Activity,
  Heart,
  Users,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./ProfileView.css";

export default function ProfileView({
  session,
  setSession,
  onSignOut, // <--- 1. ACCEPT GLOBAL SIGN OUT PROP
  onNavigateToLogin,
  onNavigateToRegister,
  onOpenBusinessRegistration,
}) {
  const [myVouchers, setMyVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  // Mode switch state: 'consumer' or 'business'
  const [userMode, setUserMode] = useState("consumer");

  // Settings-style active drawer in Consumer mode ('vouchers', 'reviews', 'favorites', or null)
  const [activeSettingTab, setActiveSettingTab] = useState(null);

  // Merchant stats state (if user owns a business)
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");

  useEffect(() => {
    if (session) {
      fetchMyVouchers();
      fetchOwnedBusinesses();
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

      if (!error) setMyVouchers(data || []);
    } finally {
      setVouchersLoading(false);
    }
  };

  const fetchOwnedBusinesses = async () => {
    setMerchantLoading(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", session.user.id);

      if (!error && data && data.length > 0) {
        setOwnedBusinesses(data);
        setEditingBusiness(data[0]);
      }
    } finally {
      setMerchantLoading(false);
    }
  };

  const handleUpdateStorefront = async (e) => {
    e.preventDefault();
    if (!editingBusiness) return;
    setUpdateStatus("Updating storefront...");

    const { error } = await supabase
      .from("businesses")
      .update({
        logo_url: editingBusiness.logo_url,
        cover_image_url: editingBusiness.cover_image_url,
        promo: editingBusiness.promo,
      })
      .eq("id", editingBusiness.id);

    if (error) {
      setUpdateStatus("Error updating storefront.");
    } else {
      setUpdateStatus("Storefront updated successfully!");
      setTimeout(() => setUpdateStatus(""), 3000);
      fetchOwnedBusinesses();
    }
  };

  // <--- 2. USE THE GLOBAL SIGN OUT PASSED FROM APP.JSX
  const handleLogout = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  if (!session) {
    return (
      <div className="profile-view">
        <div className="welcome-banner">
          <h3>Your Account 👤</h3>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              margin: "4px 0 16px 0",
            }}
          >
            Sign in to view your vouchers, manage saved spots, and access
            merchant tools.
          </p>
        </div>

        <div
          className="profile-logged-out-card"
          style={{
            textAlign: "center",
            padding: "30px 20px",
            background: "var(--bg-card)",
            borderRadius: "16px",
            border: "1px solid var(--border-color, #eee)",
          }}
        >
          <User
            size={48}
            color="var(--text-secondary)"
            style={{ opacity: 0.4, marginBottom: "12px" }}
          />
          <h4 style={{ margin: "0 0 6px 0" }}>You are not signed in</h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: "20px",
            }}
          >
            Access your digital wallet and personalized local feed.
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button
              onClick={onNavigateToLogin}
              className="auth-submit-btn"
              style={{ padding: "10px 20px" }}
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToRegister}
              className="auth-submit-btn"
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--struct-secondary)",
              }}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-view">
      <div className="welcome-banner">
        <h3>My Profile & Dashboard 👤</h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            margin: "4px 0 12px 0",
          }}
        >
          Manage your consumer settings or monitor your merchant establishment
          stats.
        </p>

        {/* User Mode Switcher Tabs */}
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.05)",
            padding: "4px",
            borderRadius: "12px",
            gap: "4px",
            marginTop: "10px",
          }}
        >
          <button
            onClick={() => setUserMode("consumer")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              backgroundColor:
                userMode === "consumer" ? "var(--bg-card)" : "transparent",
              color:
                userMode === "consumer"
                  ? "var(--accent-color)"
                  : "var(--text-secondary)",
              boxShadow:
                userMode === "consumer" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
            }}
          >
            Consumer Mode
          </button>
          <button
            onClick={() => setUserMode("business")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              backgroundColor:
                userMode === "business" ? "var(--bg-card)" : "transparent",
              color:
                userMode === "business"
                  ? "var(--accent-color)"
                  : "var(--text-secondary)",
              boxShadow:
                userMode === "business" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
            }}
          >
            Business Mode 🏢
          </button>
        </div>
      </div>

      {/* User Info Header Card */}
      <div
        className="profile-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          margin: "16px 0",
          background: "var(--bg-card)",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid var(--border-color, #eee)",
        }}
      >
        <div
          className="profile-avatar"
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            backgroundColor: "var(--accent-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={22} color="#FFFFFF" />
        </div>
        <div className="profile-info" style={{ overflow: "hidden", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
            Signed in as
          </span>
          <h4
            style={{
              margin: "2px 0 0 0",
              wordBreak: "break-all",
              fontSize: "0.9rem",
            }}
          >
            {session.user.email}
          </h4>
        </div>
      </div>

      {/* ================= CONSUMER MODE ================= */}
      {userMode === "consumer" && (
        <>
          {/* Consumer Activity Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                background: "var(--bg-card)",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border-color, #eee)",
                textAlign: "center",
              }}
            >
              <Activity
                size={18}
                color="var(--accent-color)"
                style={{ marginBottom: "4px" }}
              />
              <div
                style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}
              >
                Vouchers Claimed
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {myVouchers.length}
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-card)",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border-color, #eee)",
                textAlign: "center",
              }}
            >
              <Heart
                size={18}
                color="#EF4444"
                style={{ marginBottom: "4px" }}
              />
              <div
                style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}
              >
                Saved Favorites
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                3 Spots
              </div>
            </div>
          </div>

          {/* --- SETTINGS-LIKE ACTIVITY HUB --- */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color, #eee)",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-color, #eee)",
                fontSize: "0.8rem",
                fontWeight: "bold",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Activity & Preferences
            </div>

            {/* Row 1: My Vouchers Wallet */}
            <div>
              <div
                onClick={() =>
                  setActiveSettingTab(
                    activeSettingTab === "vouchers" ? null : "vouchers",
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-color, #eee)",
                  backgroundColor:
                    activeSettingTab === "vouchers"
                      ? "rgba(0,0,0,0.02)"
                      : "transparent",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Ticket size={18} color="var(--accent-color)" />
                  <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                    My Vouchers Wallet 🎟️
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {myVouchers.length} items
                  </span>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    style={{
                      transform:
                        activeSettingTab === "vouchers"
                          ? "rotate(90deg)"
                          : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </div>

              {/* Expandable Vouchers List */}
              {activeSettingTab === "vouchers" && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(0,0,0,0.01)",
                    borderBottom: "1px solid var(--border-color, #eee)",
                  }}
                >
                  {vouchersLoading ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Loading your vouchers...
                    </p>
                  ) : myVouchers.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        margin: 0,
                      }}
                    >
                      No vouchers claimed yet.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {myVouchers.map((v) => (
                        <div
                          key={v.id}
                          style={{
                            padding: "8px",
                            border: "1px solid var(--accent-color)",
                            borderRadius: "6px",
                            background: "var(--bg-card)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              color: "var(--accent-color)",
                            }}
                          >
                            {v.businesses?.name || "Local Spot"}
                          </div>
                          <div style={{ fontSize: "0.8rem", margin: "2px 0" }}>
                            {v.promo_text}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "800",
                              background: "rgba(0,0,0,0.05)",
                              display: "inline-block",
                              padding: "1px 5px",
                              borderRadius: "4px",
                            }}
                          >
                            {v.voucher_code}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: My Reviews & Comments */}
            <div>
              <div
                onClick={() =>
                  setActiveSettingTab(
                    activeSettingTab === "reviews" ? null : "reviews",
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-color, #eee)",
                  backgroundColor:
                    activeSettingTab === "reviews"
                      ? "rgba(0,0,0,0.02)"
                      : "transparent",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                    My Reviews & Comments ⭐
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    2 left
                  </span>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    style={{
                      transform:
                        activeSettingTab === "reviews"
                          ? "rotate(90deg)"
                          : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </div>

              {activeSettingTab === "reviews" && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(0,0,0,0.01)",
                    borderBottom: "1px solid var(--border-color, #eee)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    <b>Delfin Brews Cafe</b> — 5 ⭐
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    "Super cozy ambiance and great iced lattes!"
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Saved Favorites */}
            <div>
              <div
                onClick={() =>
                  setActiveSettingTab(
                    activeSettingTab === "favorites" ? null : "favorites",
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  cursor: "pointer",
                  backgroundColor:
                    activeSettingTab === "favorites"
                      ? "rgba(0,0,0,0.02)"
                      : "transparent",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Bookmark size={18} color="#EF4444" fill="#EF4444" />
                  <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                    Saved Favorites ❤️
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    3 spots
                  </span>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    style={{
                      transform:
                        activeSettingTab === "favorites"
                          ? "rotate(90deg)"
                          : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </div>

              {activeSettingTab === "favorites" && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(0,0,0,0.01)",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", fontWeight: "500" }}>
                    • Centro Bakery & Restaurant
                  </div>
                  <div style={{ fontSize: "0.8rem", fontWeight: "500" }}>
                    • Delfin Brews Cafe
                  </div>
                  <div style={{ fontSize: "0.8rem", fontWeight: "500" }}>
                    • Isabela Grill & Barbecue
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= BUSINESS MODE (MERCHANT DASHBOARD) ================= */}
      {userMode === "business" && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--accent-color)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <h4
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.95rem",
              margin: "0 0 12px 0",
              color: "var(--accent-color)",
            }}
          >
            <Store size={18} /> Merchant Analytics & Storefront
          </h4>

          {ownedBusinesses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                You do not own a registered business yet. Register one to access
                merchant analytics!
              </p>
              <button
                onClick={onOpenBusinessRegistration}
                className="auth-submit-btn"
                style={{ fontSize: "0.85rem" }}
              >
                Register Business Now 🏢
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                {editingBusiness?.name || ownedBusinesses[0].name}
              </div>

              {/* Analytics Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Rating Score
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <Star
                      size={14}
                      fill="var(--accent-color)"
                      color="var(--accent-color)"
                    />{" "}
                    {editingBusiness?.rating || 5.0}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Total Reviews
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <MessageSquare size={14} color="var(--struct-secondary)" />{" "}
                    {editingBusiness?.reviews || 1}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Profile Visits
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <Eye size={14} color="var(--accent-color)" />{" "}
                    {editingBusiness?.profile_visits || 42}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Followers
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <Users size={14} color="var(--accent-color)" /> 24
                  </div>
                </div>
              </div>

              {/* Storefront Asset Manager Form */}
              <form
                onSubmit={handleUpdateStorefront}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                  }}
                >
                  Manage Storefront Assets
                </div>

                {updateStatus && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: updateStatus.includes("Error")
                        ? "#EF4444"
                        : "#10B981",
                    }}
                  >
                    {updateStatus}
                  </div>
                )}

                <div className="input-group" style={{ textAlign: "left" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Logo Image URL
                  </label>
                  <input
                    type="text"
                    value={editingBusiness?.logo_url || ""}
                    onChange={(e) =>
                      setEditingBusiness({
                        ...editingBusiness,
                        logo_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/logo.jpg"
                    className="auth-input"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div className="input-group" style={{ textAlign: "left" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cover Banner URL
                  </label>
                  <input
                    type="text"
                    value={editingBusiness?.cover_image_url || ""}
                    onChange={(e) =>
                      setEditingBusiness({
                        ...editingBusiness,
                        cover_image_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/cover.jpg"
                    className="auth-input"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div className="input-group" style={{ textAlign: "left" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Active Promo Text
                  </label>
                  <input
                    type="text"
                    value={editingBusiness?.promo || ""}
                    onChange={(e) =>
                      setEditingBusiness({
                        ...editingBusiness,
                        promo: e.target.value,
                      })
                    }
                    placeholder="10% off on special items"
                    className="auth-input"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  style={{
                    padding: "8px",
                    fontSize: "0.85rem",
                    marginTop: "4px",
                  }}
                >
                  Save Storefront Changes
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Sign Out Button */}
      <button
        onClick={handleLogout}
        className="auth-submit-btn logout-btn"
        style={{ width: "100%" }}
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
