import React, { useState } from "react";
import { Search, Star, MapPin, Sparkles, Heart } from "lucide-react";
import "./HomeView.css";

export default function HomeView({
  favorites,
  toggleFavorite,
  onSelectRestaurant,
  onSelectBusinessProfile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const restaurants = [
    {
      id: 1,
      name: "Uncle Bob's Panciteria",
      category: "Local Delicacy",
      rating: 4.8,
      reviews: 124,
      distance: "1.2 km",
      imageColor: "#B8543A",
      promo: "10% off on Pancit Batil Patong",
      address: "Centro 1, Delfin Albano, Isabela",
      open_time: "08:00",
      close_time: "21:00",
      logo_url: "",
      cover_image_url: "",
      menu_images: [],
      gallery_images: [],
    },
    {
      id: 2,
      name: "Kape Indio Artisan Cafe",
      category: "Cafe & Coffee",
      rating: 4.9,
      reviews: 98,
      distance: "2.5 km",
      imageColor: "#D97706",
      promo: "Buy 1 Take 1 Cold Brew",
      address: "Magsaysay, Delfin Albano, Isabela",
      open_time: "09:00",
      close_time: "22:00",
      logo_url: "",
      cover_image_url: "",
      menu_images: [],
      gallery_images: [],
    },
    {
      id: 3,
      name: "Tuguegarao Grill & BBQ",
      category: "Grill / Casual",
      rating: 4.7,
      reviews: 210,
      distance: "3.1 km",
      imageColor: "#78645E",
      promo: "Free iced tea for students",
      address: "Rizal St, Delfin Albano, Isabela",
      open_time: "10:00",
      close_time: "23:00",
      logo_url: "",
      cover_image_url: "",
      menu_images: [],
      gallery_images: [],
    },
  ];

  const categories = [
    "All",
    "Local Delicacy",
    "Cafe & Coffee",
    "Grill / Casual",
  ];

  const filteredRestaurants = restaurants.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="home-view">
      <div className="welcome-banner">
        <h3>Discover Local Flavors 🍜</h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            margin: "4px 0 16px 0",
          }}
        >
          Find the best dining spots and digital promos around you.
        </p>

        <div className="search-bar-container">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search restaurants, dishes, promos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="category-scroll">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-chip ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="restaurant-list">
        <h4
          style={{
            margin: "16px 0 12px 0",
            fontSize: "1rem",
            color: "var(--text-primary)",
          }}
        >
          Featured Spots Near You
        </h4>

        {filteredRestaurants.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              padding: "20px",
            }}
          >
            No dining spots found. Try a different search!
          </p>
        ) : (
          filteredRestaurants.map((spot) => {
            const isFavorited = favorites.some((fav) => fav.id === spot.id);
            return (
              <div
                key={spot.id}
                className="restaurant-card"
                onClick={() => onSelectRestaurant(spot)} // Triggers Detail View on card click
                style={{ cursor: "pointer" }}
              >
                <div
                  className="card-img-placeholder"
                  style={{ backgroundColor: spot.imageColor }}
                >
                  <span className="promo-badge">
                    <Sparkles size={12} /> {spot.promo}
                  </span>
                  <button
                    className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(spot);
                    }}
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
                  <div
                    className="card-header-row"
                    style={{ alignItems: "center" }}
                  >
                    {/* Circular Merchant Profile Avatar before name */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents opening the DetailView
                        onSelectBusinessProfile(spot); // Opens Business Profile View
                      }}
                      title="View Business Profile"
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
          })
        )}
      </div>
    </div>
  );
}
