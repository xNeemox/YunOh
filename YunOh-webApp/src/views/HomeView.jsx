import React, { useState, useEffect } from "react";
import { Search, Star, MapPin, Sparkles, Heart } from "lucide-react";
import { supabase } from "../supabaseClient";
import "./HomeView.css";

export default function HomeView({
  favorites,
  toggleFavorite,
  onSelectRestaurant,
  onSelectBusinessProfile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Supabase live businesses state
  const [supabaseBusinesses, setSupabaseBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLiveBusinesses();
  }, []);

  const fetchLiveBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("businesses").select("*");

      if (!error && data) {
        setSupabaseBusinesses(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback static mock list if no database items exist yet
  const fallbackRestaurants = [
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

  // Use Supabase data if available, otherwise fallback to mock data
  const restaurants =
    supabaseBusinesses.length > 0 ? supabaseBusinesses : fallbackRestaurants;

  const categories = [
    "All",
    "Local Delicacy",
    "Cafe & Coffee",
    "Grill / Casual",
  ];

  const filteredRestaurants = restaurants.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category &&
        item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="home-view">
      <div className="welcome-banner">
        <h3>Discover Local Flavors 🍜</h3>
        <p className="home-subtitle-muted">
          Find the best dining spots and digital promos around you in Delfin
          Albano.
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
        <h4 className="home-section-title">
          Featured Spots Near You{" "}
          {loading && <span className="loading-badge">(Syncing...)</span>}
        </h4>

        {filteredRestaurants.length === 0 ? (
          <p className="home-empty-text">
            No dining spots found. Try a different search!
          </p>
        ) : (
          filteredRestaurants.map((spot) => {
            const isFavorited = favorites.some((fav) => fav.id === spot.id);
            return (
              <div
                key={spot.id}
                className="restaurant-card cursor-pointer-cls"
                onClick={() => onSelectRestaurant(spot)}
              >
                <div
                  className="card-img-placeholder"
                  style={{
                    backgroundColor: spot.imageColor || "var(--accent-color)",
                  }}
                >
                  {spot.promo && (
                    <span className="promo-badge">
                      <Sparkles size={12} /> {spot.promo}
                    </span>
                  )}
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
                  <div className="card-header-row align-items-center-cls">
                    {/* Circular Merchant Profile Avatar */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBusinessProfile(spot);
                      }}
                      title="View Business Profile"
                      className="merchant-avatar-circle"
                      style={{
                        backgroundColor:
                          spot.imageColor || "var(--struct-secondary)",
                      }}
                    >
                      {spot.logo_url ? (
                        <img
                          src={spot.logo_url}
                          alt={spot.name}
                          className="merchant-avatar-img"
                        />
                      ) : (
                        <span className="merchant-avatar-fallback">
                          {spot.name ? spot.name.charAt(0) : "Y"}
                        </span>
                      )}
                    </div>

                    <div className="merchant-name-wrap">
                      <h4 className="spot-name margin-zero-cls">{spot.name}</h4>
                    </div>

                    <span className="spot-rating whitespace-nowrap-cls">
                      <Star
                        size={14}
                        fill="var(--accent-color)"
                        color="var(--accent-color)"
                      />
                      {spot.rating || 4.8} ({spot.reviews || 50}+)
                    </span>
                  </div>

                  <div className="spot-meta margin-top-sm">
                    <span className="category-tag">
                      {spot.category || "Local Spot"}
                    </span>
                    <span className="spot-distance">
                      <MapPin size={13} /> {spot.distance || "1.5 km"}
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
