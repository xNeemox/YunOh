import React, { useState, useEffect } from "react";
import { Search, Star, MapPin, Sparkles, Heart, Clock } from "lucide-react";
import { supabase } from "../supabaseClient";
import "./HomeView.css";

const BAYOMBONG_CENTER = { lat: 16.4815, lng: 121.1497 };

const STANDARD_CATEGORIES = [
  "Local Delicacy",
  "Panciterias",
  "Cafe & Coffee",
  "Korean",
  "Japanese",
  "Tapsilogan",
  "Fine Dining",
  "Grill / Casual",
  "Bakery & Pastries",
  "Desserts",
];

export default function HomeView({
  favorites,
  toggleFavorite,
  onSelectRestaurant,
  onSelectBusinessProfile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBarangay, setSelectedBarangay] = useState("All");

  const [supabaseBusinesses, setSupabaseBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [userCoords, setUserCoords] = useState(BAYOMBONG_CENTER);

  useEffect(() => {
    fetchLiveBusinesses();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detectedLat = pos.coords.latitude;
          const detectedLng = pos.coords.longitude;
          // Only use live GPS if user is within 25km of Bayombong; otherwise keep Bayombong Town Center
          const distFromBayombong = calcHaversineKm(
            BAYOMBONG_CENTER.lat,
            BAYOMBONG_CENTER.lng,
            detectedLat,
            detectedLng,
          );
          if (distFromBayombong <= 25) {
            setUserCoords({ lat: detectedLat, lng: detectedLng });
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  const fetchLiveBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, reviews(rating)")
        .eq("is_verified", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSupabaseBusinesses(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fallbackRestaurants = [
    {
      id: 1,
      name: "Uncle Bob's Panciteria",
      category: "Panciterias, Local Delicacy",
      rating: 4.8,
      reviews: 124,
      distance: "1.2 km",
      imageColor: "#B8543A",
      promo: "10% off on Pancit Batil Patong",
      street: "National Highway",
      barangay: "District IV",
      municipality: "Bayombong",
      province: "Nueva Vizcaya",
      address: "National Highway, District IV, Bayombong, Nueva Vizcaya",
      latitude: 16.4815,
      longitude: 121.1497,
      open_time: "08:00",
      close_time: "21:00",
      business_profile_image: "",
      cover_image_url: "",
      gallery_images: [],
    },
    {
      id: 2,
      name: "Kape Indio Artisan Cafe",
      category: "Cafe & Coffee, Bakery & Pastries",
      rating: 4.9,
      reviews: 98,
      distance: "2.5 km",
      imageColor: "#D97706",
      promo: "Buy 1 Take 1 Cold Brew",
      street: "Magsaysay St",
      barangay: "Magsaysay",
      municipality: "Bayombong",
      province: "Nueva Vizcaya",
      address: "Magsaysay, Bayombong, Nueva Vizcaya",
      latitude: 16.4855,
      longitude: 121.1532,
      open_time: "09:00",
      close_time: "22:00",
      business_profile_image: "",
      cover_image_url: "",
      gallery_images: [],
    },
    {
      id: 3,
      name: "Bayombong Grill & BBQ",
      category: "Grill / Casual, Tapsilogan",
      rating: 4.7,
      reviews: 210,
      distance: "3.1 km",
      imageColor: "#78645E",
      promo: "Free iced tea for students",
      street: "Rizal St",
      barangay: "Salvacion",
      municipality: "Bayombong",
      province: "Nueva Vizcaya",
      address: "Rizal St, Salvacion, Bayombong, Nueva Vizcaya",
      latitude: 16.4782,
      longitude: 121.1445,
      open_time: "10:00",
      close_time: "23:00",
      business_profile_image: "",
      cover_image_url: "",
      gallery_images: [],
    },
  ];

  const restaurants =
    supabaseBusinesses.length > 0 ? supabaseBusinesses : fallbackRestaurants;
  const parseCategories = (catData) => {
    if (!catData) return ["Local Spot"];
    if (Array.isArray(catData)) return catData.filter(Boolean);
    return catData
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  };

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

  // Helper to calculate Haversine distance in km between two (lat, lng) pairs
  const calcHaversineKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- HELPER 4: Dynamic Distance Calculation (Supports manual lat/lng & auto-swaps if reversed) ---
  const getDynamicDistance = (spot) => {
    let lat = parseFloat(spot.latitude);
    let lng = parseFloat(spot.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return spot.distance || "1.5 km";
    }

    // Auto-correct if latitude and longitude were manually entered in reverse order
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      const temp = lat;
      lat = lng;
      lng = temp;
    }

    const distanceKm = calcHaversineKm(
      userCoords.lat,
      userCoords.lng,
      lat,
      lng,
    );

    if (distanceKm < 0.1) {
      return "0.1 km";
    }
    return `${distanceKm.toFixed(1)} km`;
  };

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
  const dynamicCategories = [
    "All",
    ...Array.from(
      new Set([
        ...STANDARD_CATEGORIES,
        ...restaurants.flatMap((spot) => parseCategories(spot.category)),
      ]),
    ),
  ];

  const dynamicBarangays = [
    "All",
    ...Array.from(new Set(restaurants.map((spot) => getSpotBarangay(spot)))),
  ];

  const filteredRestaurants = restaurants.filter((item) => {
    const itemCategories = parseCategories(item.category);
    const itemBarangay = getSpotBarangay(item);
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      itemCategories.some((c) => c.toLowerCase().includes(q)) ||
      itemBarangay.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "All" ||
      itemCategories.some(
        (c) => c.toLowerCase() === selectedCategory.toLowerCase(),
      );

    const matchesBarangay =
      selectedBarangay === "All" || itemBarangay === selectedBarangay;

    return matchesSearch && matchesCategory && matchesBarangay;
  });

  return (
    <div className="home-view">
      <div className="welcome-banner">
        <h3>Discover Local Flavors 🍜</h3>
        <p className="home-subtitle-muted">
          Find the best dining spots in Bayombong, Nueva Vizcaya.
        </p>

        <div className="search-bar-container">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search restaurants, barangay, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Dynamic Category Scroll */}
      <div className="category-scroll">
        {dynamicCategories.map((category) => (
          <button
            key={category}
            className={`category-chip ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Dynamic Town Barangay Filter */}
      <div className="barangay-filter-row">
        <span className="barangay-filter-label">
          <MapPin size={14} /> Sort by Barangay:
        </span>
        <select
          className="barangay-select"
          value={selectedBarangay}
          onChange={(e) => setSelectedBarangay(e.target.value)}
        >
          {dynamicBarangays.map((brgy) => (
            <option key={brgy} value={brgy}>
              {brgy === "All" ? "All Barangays (Bayombong)" : `Brgy. ${brgy}`}
            </option>
          ))}
        </select>
      </div>

      <div className="restaurant-list">
        <h4 className="home-section-title">
          Featured Spots Near You{" "}
          {loading && <span className="loading-badge">(Syncing...)</span>}
        </h4>

        {filteredRestaurants.length === 0 ? (
          <p className="home-empty-text">
            No dining spots found. Try a different search or filter!
          </p>
        ) : (
          filteredRestaurants.map((spot) => {
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
                className="restaurant-card cursor-pointer-cls"
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
                      fill={isFavorited ? "var(--heart-color)" : "none"}
                      color={
                        isFavorited ? "var(--heart-outline-color)" : "#FFFFFF"
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
                        onSelectBusinessProfile &&
                          onSelectBusinessProfile(spot);
                      }}
                      title="View Business Profile"
                      className="merchant-avatar-circle"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
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
                      {ratingInfo.avg} {ratingInfo.countText}
                    </span>
                  </div>

                  <div className="spot-meta spot-meta-wrap margin-top-sm">
                    <div className="category-tags-group">
                      {visibleCategories.map((cat, idx) => (
                        <span key={idx} className="category-tag">
                          {cat}
                        </span>
                      ))}
                      {extraCategoryCount > 0 && (
                        <span
                          className="category-more-badge"
                          title={spotCategories.slice(2).join(", ")}
                        >
                          +{extraCategoryCount}
                        </span>
                      )}
                    </div>

                    <span
                      className={`home-status-pill ${
                        isOpenNow ? "open" : "closed"
                      }`}
                    >
                      <Clock size={11} />
                      {isOpenNow ? "Open Now" : "Closed"}
                    </span>
                  </div>
                  <div className="spot-location-row">
                    <span className="barangay-tag">
                      <MapPin size={13} color="var(--accent-color)" /> Brgy.{" "}
                      {barangayName}
                    </span>
                    <span className="spot-distance">{distanceText} away</span>
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
