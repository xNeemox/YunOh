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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMyVouchers([]);
    setOwnedBusinesses([]);
  };

  if (!session) {
    return (
      <div className="profile-view">
        <div className="welcome-banner">
          <h3>Your Account 👤</h3>
          <p className="profile-subtitle-muted">
            Sign in to view your vouchers, manage saved spots, and access
            merchant tools.
          </p>
        </div>

        <div className="profile-logged-out-card">
          <User size={48} className="logged-out-icon" />
          <h4 className="logged-out-title">You are not signed in</h4>
          <p className="logged-out-desc">
            Access your digital wallet and personalized local feed.
          </p>
          <div className="logged-out-actions">
            <button
              onClick={onNavigateToLogin}
              className="auth-submit-btn btn-pad-custom"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToRegister}
              className="auth-submit-btn btn-secondary-custom"
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
        <p className="profile-subtitle-muted">
          Manage your consumer settings or monitor your merchant establishment
          stats.
        </p>

        {/* User Mode Switcher Tabs */}
        <div className="mode-switcher-container">
          <button
            onClick={() => setUserMode("consumer")}
            className={`mode-tab-btn ${userMode === "consumer" ? "active" : ""}`}
          >
            Consumer Mode
          </button>
          <button
            onClick={() => setUserMode("business")}
            className={`mode-tab-btn ${userMode === "business" ? "active" : ""}`}
          >
            Business Mode 🏢
          </button>
        </div>
      </div>

      {/* User Info Header Card */}
      <div className="profile-card profile-user-info-card">
        <div className="profile-avatar profile-avatar-wrapper">
          <User size={22} color="#FFFFFF" />
        </div>
        <div className="profile-info profile-info-text-wrap">
          <span className="profile-signed-in-label">Signed in as</span>
          <h4 className="profile-email-text">{session.user.email}</h4>
        </div>
      </div>

      {/* ================= CONSUMER MODE ================= */}
      {userMode === "consumer" && (
        <>
          {/* Consumer Activity Stats */}
          <div className="consumer-stats-grid">
            <div className="stat-box-card">
              <Activity
                size={18}
                color="var(--accent-color)"
                className="stat-icon-margin"
              />
              <div className="stat-box-label">Vouchers Claimed</div>
              <div className="stat-box-value">{myVouchers.length}</div>
            </div>
            <div className="stat-box-card">
              <Heart size={18} color="#EF4444" className="stat-icon-margin" />
              <div className="stat-box-label">Saved Favorites</div>
              <div className="stat-box-value">3 Spots</div>
            </div>
          </div>

          {/* --- SETTINGS-LIKE ACTIVITY HUB --- */}
          <div className="settings-activity-hub">
            <div className="settings-hub-header">Activity & Preferences</div>

            {/* Row 1: My Vouchers Wallet */}
            <div>
              <div
                onClick={() =>
                  setActiveSettingTab(
                    activeSettingTab === "vouchers" ? null : "vouchers",
                  )
                }
                className={`settings-row-item ${activeSettingTab === "vouchers" ? "active-row" : ""}`}
              >
                <div className="settings-row-left">
                  <Ticket size={18} color="var(--accent-color)" />
                  <span className="settings-row-title">
                    My Vouchers Wallet 🎟️
                  </span>
                </div>
                <div className="settings-row-right">
                  <span className="settings-row-meta">
                    {myVouchers.length} items
                  </span>
                  <ChevronRight
                    size={16}
                    className={`chevron-icon ${activeSettingTab === "vouchers" ? "rotated" : ""}`}
                  />
                </div>
              </div>

              {/* Expandable Vouchers List */}
              {activeSettingTab === "vouchers" && (
                <div className="settings-drawer-content">
                  {vouchersLoading ? (
                    <p className="drawer-loading-text">
                      Loading your vouchers...
                    </p>
                  ) : myVouchers.length === 0 ? (
                    <p className="drawer-loading-text">
                      No vouchers claimed yet.
                    </p>
                  ) : (
                    <div className="drawer-vouchers-list">
                      {myVouchers.map((v) => (
                        <div key={v.id} className="drawer-voucher-item">
                          <div className="drawer-voucher-biz">
                            {v.businesses?.name || "Local Spot"}
                          </div>
                          <div className="drawer-voucher-promo">
                            {v.promo_text}
                          </div>
                          <div className="drawer-voucher-pill">
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
                className={`settings-row-item ${activeSettingTab === "reviews" ? "active-row" : ""}`}
              >
                <div className="settings-row-left">
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span className="settings-row-title">
                    My Reviews & Comments ⭐
                  </span>
                </div>
                <div className="settings-row-right">
                  <span className="settings-row-meta">2 left</span>
                  <ChevronRight
                    size={16}
                    className={`chevron-icon ${activeSettingTab === "reviews" ? "rotated" : ""}`}
                  />
                </div>
              </div>

              {activeSettingTab === "reviews" && (
                <div className="settings-drawer-content">
                  <div className="drawer-review-item-title">
                    <b>Delfin Brews Cafe</b> — 5 ⭐
                  </div>
                  <div className="drawer-review-item-body">
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
                className={`settings-row-item ${activeSettingTab === "favorites" ? "active-row" : ""}`}
              >
                <div className="settings-row-left">
                  <Bookmark size={18} color="#EF4444" fill="#EF4444" />
                  <span className="settings-row-title">Saved Favorites ❤️</span>
                </div>
                <div className="settings-row-right">
                  <span className="settings-row-meta">3 spots</span>
                  <ChevronRight
                    size={16}
                    className={`chevron-icon ${activeSettingTab === "favorites" ? "rotated" : ""}`}
                  />
                </div>
              </div>

              {activeSettingTab === "favorites" && (
                <div className="settings-drawer-content favorites-list-wrap">
                  <div className="favorite-spot-row">
                    • Centro Bakery & Restaurant
                  </div>
                  <div className="favorite-spot-row">• Delfin Brews Cafe</div>
                  <div className="favorite-spot-row">
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
        <div className="merchant-dashboard-container">
          <h4 className="merchant-dashboard-header">
            <Store size={18} /> Merchant Analytics & Storefront
          </h4>

          {ownedBusinesses.length === 0 ? (
            <div className="merchant-empty-wrapper">
              <p className="merchant-empty-text">
                You do not own a registered business yet. Register one to access
                merchant analytics!
              </p>
              <button
                onClick={onOpenBusinessRegistration}
                className="auth-submit-btn btn-sm-text"
              >
                Register Business Now 🏢
              </button>
            </div>
          ) : (
            <>
              <div className="merchant-biz-name">
                {editingBusiness?.name || ownedBusinesses[0].name}
              </div>

              {/* Analytics Stats Grid */}
              <div className="merchant-stats-grid">
                <div className="merchant-stat-box">
                  <div className="merchant-stat-label">Rating Score</div>
                  <div className="merchant-stat-val-row">
                    <Star
                      size={14}
                      fill="var(--accent-color)"
                      color="var(--accent-color)"
                    />{" "}
                    {editingBusiness?.rating || 5.0}
                  </div>
                </div>
                <div className="merchant-stat-box">
                  <div className="merchant-stat-label">Total Reviews</div>
                  <div className="merchant-stat-val-row">
                    <MessageSquare size={14} color="var(--struct-secondary)" />{" "}
                    {editingBusiness?.reviews || 1}
                  </div>
                </div>
                <div className="merchant-stat-box">
                  <div className="merchant-stat-label">Profile Visits</div>
                  <div className="merchant-stat-val-row">
                    <Eye size={14} color="var(--accent-color)" />{" "}
                    {editingBusiness?.profile_visits || 42}
                  </div>
                </div>
                <div className="merchant-stat-box">
                  <div className="merchant-stat-label">Followers</div>
                  <div className="merchant-stat-val-row">
                    <Users size={14} color="var(--accent-color)" /> 24
                  </div>
                </div>
              </div>

              {/* Storefront Asset Manager Form */}
              <form
                onSubmit={handleUpdateStorefront}
                className="merchant-asset-form"
              >
                <div className="asset-form-heading">
                  Manage Storefront Assets
                </div>

                {updateStatus && (
                  <div
                    className={`update-status-msg ${updateStatus.includes("Error") ? "error-text" : "success-text"}`}
                  >
                    {updateStatus}
                  </div>
                )}

                <div className="input-group">
                  <label className="asset-input-label">Logo Image URL</label>
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
                    className="auth-input asset-text-input"
                  />
                </div>

                <div className="input-group">
                  <label className="asset-input-label">Cover Banner URL</label>
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
                    className="auth-input asset-text-input"
                  />
                </div>

                <div className="input-group">
                  <label className="asset-input-label">Active Promo Text</label>
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
                    className="auth-input asset-text-input"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn btn-sm-text btn-mt-custom"
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
        className="auth-submit-btn logout-btn btn-full-width"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
