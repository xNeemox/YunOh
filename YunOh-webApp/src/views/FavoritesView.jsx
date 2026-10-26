import React, { useState, useEffect } from "react";
import { Star, MapPin, Heart, Sparkles, Clock } from "lucide-react";
import "./FavoritesView.css";

// Default fallback coordinates: Bayombong, Nueva Vizcaya Town Center
const BAYOMBONG_CENTER = { lat: 16.4815, lng: 121.1497 };

export default function FavoritesView({
  favorites,
  toggleFavorite,
  setActiveTab,
  onSelectRestaurant,
  onSelectBusinessProfile,
}) {
  // User live GPS coordinates for dynamic distance calculation
  const [userCoords, setUserCoords] = useState(BAYOMBONG_CENTER);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Keep default Bayombong coordinates if permission is denied
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  // --- HELPER 1: Parse Multiple Categories (up to 2 + '+N') ---
  const parseCategories = (catData) => {
    if (!catData) return ["Local Spot"];
    if (Array.isArray(catData)) return catData.filter(Boolean);
    return catData
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  };

  // --- HELPER 2: Extract Barangay from spot.barangay or fallback address ---
  const getSpotBarangay = (spot) => {
    if (spot.barangay && spot.barangay.trim() !== "") {
      return spot.barangay.trim();
    }
    if (spot.address) {
      const parts = spot.address.split(",").map((p) => p.trim());
      if (parts.length >= 3) return parts[1];
      if (parts.length === 2) return parts[0];
    }
    return "Poblacion";
  };

  // --- HELPER 3: Dynamic "Is Open" Status from open_time and close_time ---
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

  // --- HELPER 4: Dynamic Distance Calculation (Haversine formula in km) ---
  const getDynamicDistance = (spot) => {
    const lat = Number(spot.latitude);
    const lng = Number(spot.longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return spot.distance || "1.5 km";
    }

    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat - userCoords.lat);
    const dLng = toRad(lng - userCoords.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userCoords.lat)) *
        Math.cos(toRad(lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return `${(R * c).toFixed(1)} km`;
  };

  // --- HELPER 5: Dynamic Star Rating & Review Count (prevents array render crash) ---
  const getDynamicRatingInfo = (spot) => {
    if (Array.isArray(spot.reviews)) {
      const count = spot.reviews.length;
      if (count === 0) {
        return { avg: "New", countText: "(0)" };
      }
      const sum = spot.reviews.reduce(
        (acc, rev) => acc + (Number(rev.rating) || 0),
        0,
      );
      const avg = (sum / count).toFixed(1);
      return { avg, countText: `(${count})` };
    }
    return {
      avg: spot.rating || 4.8,
      countText: `(${spot.reviews || 50}+)`,
    };
  };

  return (
    <div className="favorites-view">
      <div className="welcome-banner">
        <h3>Your Favorites 💖</h3>
        <p className="favorites-subtitle">
          Saved local dining spots you want to visit.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-empty-box">
          <Heart size={40} className="favorites-empty-icon" />
          <p className="favorites-empty-text">No favorite spots saved yet.</p>
          <button
            onClick={() => setActiveTab("home")}
            className="favorites-explore-btn"
          >
            Explore Dining Spots
          </button>
        </div>
      ) : (
        <div className="restaurant-list">
          {favorites.map((spot) => {
            const isFavorited = favorites.some((fav) => fav.id === spot.id);
            const isOpenNow = checkIsCurrentlyOpen(
              spot.open_time,
              spot.close_time,
            );
            const ratingInfo = getDynamicRatingInfo(spot);
            const distanceText = getDynamicDistance(spot);
            const barangayName = getSpotBarangay(spot);

            const spotCategories = parseCategories(spot.category);
            const visibleCategories = spotCategories.slice(0, 2);
            const extraCategoryCount = spotCategories.length - 2;
            const avatarUrl = spot.business_profile_image || spot.logo_url;

            return (
              <div
                key={spot.id}
                className="restaurant-card fav-card-clickable"
                onClick={() => onSelectRestaurant(spot)}
              >
                <div className="card-img-placeholder">
                  {spot.cover_image_url && (
                    <img
                      src={spot.cover_image_url}
                      alt={`${spot.name} cover`}
                      className="cover-img"
                    />
                  )}
                  {spot.promo && (
                    <span className="promo-badge">
                      <Sparkles size={12} /> {spot.promo}
                    </span>
                  )}
                  {/* Favorite Toggle Button */}
                  <button
                    className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(spot);
                    }}
                    aria-label="Remove from favorites"
                  >
                    <Heart
                      size={16}
                      fill={isFavorited ? "var(--heart-color)" : "none"}
                      color={
                        isFavorited ? "var(--heart-outline-color)" : "#FFFFFF"
                      }
                    />
                  </button>
                </div>

                <div className="card-body">
                  <div className="card-header-row fav-header-align">
                    {/* Circular Merchant Profile Avatar before name */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBusinessProfile &&
                          onSelectBusinessProfile(spot);
                      }}
                      title="View Business Profile & Gallery"
                      className="fav-merchant-avatar"
                      style={{
                        backgroundColor:
                          spot.imageColor || "var(--struct-secondary)",
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={spot.name}
                          className="fav-merchant-avatar-img"
                        />
                      ) : (
                        <span className="fav-merchant-avatar-letter">
                          {spot.name ? spot.name.charAt(0) : "Y"}
                        </span>
                      )}
                    </div>

                    <div className="fav-name-wrap">
                      <h4 className="spot-name fav-spot-name">{spot.name}</h4>
                    </div>

                    <span className="spot-rating fav-rating-nowrap">
                      <Star
                        size={14}
                        fill="var(--accent-color)"
                        color="var(--accent-color)"
                      />
                      {ratingInfo.avg} {ratingInfo.countText}
                    </span>
                  </div>

                  {/* Dynamic Categories & Open/Closed Status */}
                  <div className="spot-meta fav-meta-wrap">
                    <div className="fav-category-group">
                      {visibleCategories.map((cat, idx) => (
                        <span key={idx} className="category-tag">
                          {cat}
                        </span>
                      ))}
                      {extraCategoryCount > 0 && (
                        <span
                          className="fav-category-more-badge"
                          title={spotCategories.slice(2).join(", ")}
                        >
                          +{extraCategoryCount}
                        </span>
                      )}
                    </div>

                    <span
                      className={`fav-status-pill ${
                        isOpenNow ? "open" : "closed"
                      }`}
                    >
                      <Clock size={11} />
                      {isOpenNow ? "Open Now" : "Closed"}
                    </span>
                  </div>

                  {/* Dynamic Barangay & Distance */}
                  <div className="fav-location-row">
                    <span className="fav-barangay-tag">
                      <MapPin size={13} color="var(--accent-color)" /> Brgy.{" "}
                      {barangayName}
                    </span>
                    <span className="spot-distance">{distanceText} away</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
