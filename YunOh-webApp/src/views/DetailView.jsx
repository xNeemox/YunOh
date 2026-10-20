import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Navigation,
  Tag,
  Heart,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./DetailView.css";

export default function DetailView({
  restaurant,
  onBack,
  favorites,
  toggleFavorite,
  onSelectBusinessProfile, // <--- Added prop here
}) {
  if (!restaurant) return null;

  const isFavorited = favorites.some((fav) => fav.id === restaurant.id);

  // Voucher state
  const [claiming, setClaiming] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Check current session and if user already claimed this voucher
  useEffect(() => {
    async function checkUserAndVoucher() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);

        // Check if user already claimed a voucher for this business
        const { data, error } = await supabase
          .from("user_vouchers")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("restaurant_id", restaurant.id)
          .single();

        if (data) {
          setClaimedVoucher(data);
        }
      }
    }
    checkUserAndVoucher();
  }, [restaurant.id]);

  // Helper function to check if currently open using "HH:mm" text format
  const checkIsCurrentlyOpen = (openStr, closeStr) => {
    if (!openStr || !closeStr) return true;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = openStr.split(":").map(Number);
    const [closeH, closeM] = closeStr.split(":").map(Number);

    const openMins = openH * 60 + (openM || 0);
    const closeMins = closeH * 60 + (closeM || 0);

    return currentMins >= openMins && currentMins <= closeMins;
  };

  const isOpenNow = checkIsCurrentlyOpen(
    restaurant.open_time,
    restaurant.close_time,
  );

  // Google Maps Redirection URL
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    restaurant.name + " " + (restaurant.address || "Delfin Albano Isabela"),
  )}`;

  // Handle Voucher Claiming
  const handleClaimVoucher = async () => {
    if (!currentUser) {
      alert("Please sign in from your Profile tab first to claim vouchers!");
      return;
    }

    setClaiming(true);
    setVoucherError("");

    const randomCode = `YUNOH-${restaurant.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const promoText = restaurant.promo || "10% discount on total order";

    const { data, error } = await supabase
      .from("user_vouchers")
      .insert([
        {
          user_id: currentUser.id,
          restaurant_id: restaurant.id,
          promo_text: promoText,
          voucher_code: randomCode,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        setVoucherError(
          "You have already claimed a voucher for this establishment!",
        );
      } else {
        setVoucherError(error.message);
      }
    } else if (data) {
      setClaimedVoucher(data);
    }
    setClaiming(false);
  };

  return (
    <div className="detail-view">
      {/* Back Button */}
      <button onClick={onBack} className="detail-back-btn">
        <ArrowLeft size={18} /> Back to feed
      </button>

      {/* Main Detail Card */}
      <div className="detail-header-card">
        <div
          className="detail-banner-placeholder"
          style={{ backgroundColor: restaurant.imageColor || "#B8543A" }}
        >
          <span className="promo-badge">
            <Sparkles size={12} /> {restaurant.category || "Local Dining"}
          </span>
          <button
            className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
            onClick={() => toggleFavorite(restaurant)}
            aria-label="Toggle favorite"
          >
            <Heart
              size={18}
              fill={isFavorited ? "var(--struct-secondary)" : "none"}
              color={isFavorited ? "var(--struct-secondary)" : "#FFFFFF"}
            />
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-title-row" style={{ alignItems: "center" }}>
            {/* Circular Merchant Profile Avatar before name */}
            <div
              onClick={() =>
                onSelectBusinessProfile && onSelectBusinessProfile(restaurant)
              }
              title="View Business Profile & Gallery"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor:
                  restaurant.imageColor || "var(--struct-secondary)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                border: "2px solid var(--accent-color)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  {restaurant.name.charAt(0)}
                </span>
              )}
            </div>

            <div style={{ flex: 1, marginLeft: "10px" }}>
              <h2
                className="detail-name"
                style={{ margin: 0, fontSize: "1.15rem" }}
              >
                {restaurant.name}
              </h2>
            </div>

            <span
              className="spot-rating"
              style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}
            >
              <Star
                size={16}
                fill="var(--accent-color)"
                color="var(--accent-color)"
              />
              {restaurant.rating || 4.8} ({restaurant.reviews || 100}+)
            </span>
          </div>

          {/* Dynamic Open / Closed Status Badge */}
          <div style={{ marginTop: "8px" }}>
            <span className={`status-badge ${isOpenNow ? "open" : "closed"}`}>
              ● {isOpenNow ? "Open Now" : "Closed Right Now"}
            </span>
          </div>

          {/* Info Grid */}
          <div className="detail-info-grid">
            <div className="info-row">
              <MapPin size={16} color="var(--struct-secondary)" />
              <span>
                {restaurant.address || "Centro, Delfin Albano, Isabela"}
              </span>
            </div>
            <div className="info-row">
              <Clock size={16} color="var(--struct-secondary)" />
              <span>
                {restaurant.open_time && restaurant.close_time
                  ? `${restaurant.open_time} - ${restaurant.close_time}`
                  : "10:00 - 21:00"}
              </span>
            </div>
          </div>

          {/* Map Redirect Button */}
          <a
            href={mapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="map-redirect-btn"
          >
            <Navigation size={16} /> View on Map & Get Directions
          </a>

          {/* Active Promo & Voucher Section */}
          <div className="promo-section" style={{ marginTop: "8px" }}>
            <h4>Digital Promo & Voucher 🎟️</h4>
            <div className="promo-card">
              <div className="promo-text">
                <Tag size={16} color="var(--accent-color)" />
                <span>
                  {restaurant.promo ||
                    "10% discount on total order for students!"}
                </span>
              </div>

              {voucherError && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <AlertCircle size={14} /> <span>{voucherError}</span>
                </div>
              )}

              {claimedVoucher ? (
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #10B981",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#10B981",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <CheckCircle size={14} /> Voucher Claimed Successfully!
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: "800",
                      letterSpacing: "1px",
                      color: "var(--text-primary)",
                      margin: "4px 0",
                    }}
                  >
                    {claimedVoucher.voucher_code}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Show this code at the cashier to redeem.
                  </div>
                </div>
              ) : (
                <button
                  className="claim-voucher-btn"
                  onClick={handleClaimVoucher}
                  disabled={claiming}
                >
                  {claiming ? "Claiming Voucher..." : "Claim Voucher Code"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
