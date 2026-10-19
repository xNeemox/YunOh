import React, { useState, useEffect } from "react";
import { Search, Star, MapPin, Sparkles, Database } from "lucide-react";
import { supabase } from "../supabaseClient";
import "./DiscoverView.css";

export default function DiscoverView({ favorites, toggleFavorite }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live restaurant data from Supabase on component mount
  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const { data, error } = await supabase.from("restaurants").select("*");

        if (error) {
          console.error("Error fetching restaurants:", error.message);
        } else if (data) {
          setRestaurants(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  // Filter logic based on user search input
  const filteredRestaurants = restaurants.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="discover-view">
      <div className="welcome-banner">
        <h3>Discover Database 🧭</h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            margin: "4px 0 16px 0",
          }}
        >
          Browsing live dining establishments stored in Supabase.
        </p>

        <div className="search-bar-container">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search database tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="restaurant-list">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4
            style={{
              margin: "8px 0",
              fontSize: "1rem",
              color: "var(--text-primary)",
            }}
          >
            Live Supabase Feed
          </h4>
          <span className="supabase-badge">
            <Database size={12} /> Connected
          </span>
        </div>

        {loading ? (
          <p className="discover-loading">Loading records from Supabase...</p>
        ) : filteredRestaurants.length === 0 ? (
          <p className="discover-empty">
            No dining records found in your Supabase database.
          </p>
        ) : (
          filteredRestaurants.map((spot) => {
            // Map database schema fields flexibly (handles common column naming conventions)
            const spotId = spot.id || spot.restaurant_id;
            const spotName = spot.name || spot.restaurant_name;
            const spotCategory = spot.category || "Local Dining";
            const spotRating = spot.rating || 4.5;
            const spotReviews = spot.reviews || spot.review_count || 50;
            const spotDistance = spot.distance || "1.0 km";
            const spotPromo =
              spot.promo || spot.description || "Special local discount";
            const spotColor = spot.imageColor || spot.color || "#B8543A";

            const formattedSpot = {
              id: spotId,
              name: spotName,
              category: spotCategory,
              rating: spotRating,
              reviews: spotReviews,
              distance: spotDistance,
              promo: spotPromo,
              imageColor: spotColor,
            };

            const isFavorited = favorites.some((fav) => fav.id === spotId);

            return (
              <div key={spotId} className="restaurant-card">
                <div
                  className="card-img-placeholder"
                  style={{ backgroundColor: spotColor }}
                >
                  <span className="promo-badge">
                    <Sparkles size={12} /> {spotPromo}
                  </span>
                  <button
                    className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
                    onClick={() => toggleFavorite(formattedSpot)}
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      size={16}
                      fill={isFavorited ? "var(--struct-secondary)" : "none"}
                      color={
                        isFavorited ? "var(--struct-secondary)" : "#FFFFFF"
                      }
                    />
                  </button>
                </div>

                <div className="card-body">
                  <div className="card-header-row">
                    <h4 className="spot-name">{spotName}</h4>
                    <span className="spot-rating">
                      <Star
                        size={14}
                        fill="var(--accent-color)"
                        color="var(--accent-color)"
                      />
                      {spotRating} ({spotReviews})
                    </span>
                  </div>

                  <div className="spot-meta">
                    <span className="category-tag">{spotCategory}</span>
                    <span className="spot-distance">
                      <MapPin size={13} /> {spotDistance}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
