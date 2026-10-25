import React from "react";
import { Star, MapPin, Heart, Sparkles } from "lucide-react";
import "./FavoritesView.css";

export default function FavoritesView({
  favorites,
  toggleFavorite,
  setActiveTab,
  onSelectRestaurant,
  onSelectBusinessProfile, // <--- 1. Added prop for business profile
}) {
  return (
    <div className="favorites-view">
      <div className="welcome-banner">
        <h3>Your Favorites 💖</h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            margin: "4px 0 16px 0",
          }}
        >
          Saved local dining spots you want to visit.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--text-secondary)",
          }}
        >
          <Heart size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ margin: "0 0 12px 0", fontWeight: "500" }}>
            No favorite spots saved yet.
          </p>
          <button
            onClick={() => setActiveTab("home")}
            style={{
              backgroundColor: "var(--struct-secondary)",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 16px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem",
            }}
          >
            Explore Dining Spots
          </button>
        </div>
      ) : (
        <div className="restaurant-list">
          {favorites.map((spot) => {
            const isFavorited = favorites.some((fav) => fav.id === spot.id);
            return (
              <div
                key={spot.id}
                className="restaurant-card"
                onClick={() => onSelectRestaurant(spot)} // Triggers DetailView on card click
                style={{ cursor: "pointer" }}
              >
                <div className="card-img-placeholder">
                  <img
                    src={spot.cover_image_url}
                    alt={`${spot.name} cover`}
                    className="cover-img"
                  />
                  <span className="promo-badge">
                    <Sparkles size={12} /> {spot.promo}
                  </span>
                  {/* Favorite Toggle Button */}
                  <button
                    className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents card click when tapping the heart icon
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
                  <div
                    className="card-header-row"
                    style={{ alignItems: "center" }}
                  >
                    {/* Circular Merchant Profile Avatar before name */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents opening DetailView
                        onSelectBusinessProfile &&
                          onSelectBusinessProfile(spot); // Opens Business Profile View
                      }}
                      title="View Business Profile & Gallery"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor:
                          spot.imageColor || "var(--struct-secondary)",
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
                      {spot.logo_url ? (
                        <img
                          src={spot.logo_url}
                          alt={spot.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            color: "#fff",
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                          }}
                        >
                          {spot.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, marginLeft: "10px" }}>
                      <h4 className="spot-name" style={{ margin: 0 }}>
                        {spot.name}
                      </h4>
                    </div>

                    <span
                      className="spot-rating"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <Star
                        size={14}
                        fill="var(--accent-color)"
                        color="var(--accent-color)"
                      />
                      {spot.rating} ({spot.reviews})
                    </span>
                  </div>

                  <div className="spot-meta" style={{ marginTop: "8px" }}>
                    <span className="category-tag">{spot.category}</span>
                    <span className="spot-distance">
                      <MapPin size={13} /> {spot.distance}
                    </span>
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
