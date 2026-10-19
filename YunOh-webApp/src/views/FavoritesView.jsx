import React from "react";
import { Star, MapPin, Heart, Sparkles } from "lucide-react";
import "./FavoritesView.css";

export default function FavoritesView({
  favorites,
  toggleFavorite,
  setActiveTab,
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
          {favorites.map((spot) => (
            <div key={spot.id} className="restaurant-card">
              <div
                className="card-img-placeholder"
                style={{ backgroundColor: spot.imageColor }}
              >
                <span className="promo-badge">
                  <Sparkles size={12} /> {spot.promo}
                </span>
                {/* Favorite Toggle Button */}
                <button
                  className="fav-toggle-btn active"
                  onClick={() => toggleFavorite(spot)}
                  aria-label="Remove from favorites"
                >
                  <Heart
                    size={16}
                    fill="var(--struct-secondary)"
                    color="var(--struct-secondary)"
                  />
                </button>
              </div>

              <div className="card-body">
                <div className="card-header-row">
                  <h4 className="spot-name">{spot.name}</h4>
                  <span className="spot-rating">
                    <Star
                      size={14}
                      fill="var(--accent-color)"
                      color="var(--accent-color)"
                    />
                    {spot.rating} ({spot.reviews})
                  </span>
                </div>

                <div className="spot-meta">
                  <span className="category-tag">{spot.category}</span>
                  <span className="spot-distance">
                    <MapPin size={13} /> {spot.distance}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
