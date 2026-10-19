import React from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Navigation,
  Tag,
  Heart,
  Sparkles,
} from "lucide-react";
import "./DetailView.css";

export default function DetailView({
  restaurant,
  onBack,
  favorites,
  toggleFavorite,
}) {
  if (!restaurant) return null;

  const isFavorited = favorites.some((fav) => fav.id === restaurant.id);

  // Helper function to dynamically check if currently open using "HH:mm" text format
  const checkIsCurrentlyOpen = (openStr, closeStr) => {
    if (!openStr || !closeStr) return true; // Default fallback

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
          <div className="detail-title-row">
            <h2 className="detail-name">{restaurant.name}</h2>
            <span className="spot-rating" style={{ fontSize: "0.9rem" }}>
              <Star
                size={16}
                fill="var(--accent-color)"
                color="var(--accent-color)"
              />
              {restaurant.rating || 4.8} ({restaurant.reviews || 100}+)
            </span>
          </div>

          {/* Dynamic Open / Closed Status Badge */}
          <div>
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

          {/* Active Promo Section */}
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
              <button
                className="claim-voucher-btn"
                onClick={() =>
                  alert(
                    "Voucher claimed successfully! Show this screen at the counter.",
                  )
                }
              >
                Claim Voucher Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
