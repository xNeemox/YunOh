import React, { useState, useEffect } from "react";
import {
  User,
  LogOut,
  Ticket,
  Store,
  Star,
  MessageSquare,
  ShieldCheck,
  PlusCircle,
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

  // Merchant stats state (if user owns a business)
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [merchantLoading, setMerchantLoading] = useState(false);

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

      if (!error) setOwnedBusinesses(data || []);
    } finally {
      setMerchantLoading(false);
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
            margin: "4px 0 16px 0",
          }}
        >
          Manage your consumer wallet or monitor your merchant establishment
          stats.
        </p>
      </div>

      {/* User Info Header Card */}
      <div
        className="profile-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        <div
          className="profile-avatar"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "var(--accent-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={24} color="#FFFFFF" />
        </div>
        <div className="profile-info" style={{ overflow: "hidden", flex: 1 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Signed in as
          </span>
          <h4
            style={{
              margin: "2px 0 0 0",
              wordBreak: "break-all",
              fontSize: "0.95rem",
            }}
          >
            {session.user.email}
          </h4>
        </div>
      </div>

      {/* --- SECTION 1: MERCHANT DASHBOARD (If user owns a business) --- */}
      {ownedBusinesses.length > 0 && (
        <div
          style={{
            marginBottom: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--accent-color)",
            borderRadius: "12px",
            padding: "16px",
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
            <Store size={18} /> Merchant Dashboard 🏢
          </h4>

          {ownedBusinesses.map((biz) => (
            <div
              key={biz.id}
              style={{
                marginBottom: "12px",
                borderBottom: "1px solid var(--border-color, #eee)",
                paddingBottom: "10px",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                {biz.name}
              </div>
              <div
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
              >
                {biz.category} • {biz.address}
              </div>

              {/* Stats Row */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.03)",
                    padding: "8px",
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
                    {biz.rating || 5.0}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.03)",
                    padding: "8px",
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
                    {biz.reviews || 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Business Prompt for Users who don't have one */}
      {ownedBusinesses.length === 0 && (
        <div style={{ marginBottom: "16px", textAlign: "right" }}>
          <button
            onClick={onOpenBusinessRegistration}
            className="auth-submit-btn"
            style={{
              width: "100%",
              backgroundColor: "var(--accent-color)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <PlusCircle size={16} /> Register Your Establishment 🏢
          </button>
        </div>
      )}

      {/* --- SECTION 2: MY CLAIMED VOUCHERS WALLET --- */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color, #eee)",
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
            marginBottom: "12px",
          }}
        >
          <Ticket size={18} color="var(--accent-color)" /> My Claimed Vouchers
          Wallet 🎟️
        </h4>

        {vouchersLoading ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
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
              No vouchers claimed yet. Explore live spots to claim promos!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "220px",
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
                      fontSize: "0.85rem",
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
