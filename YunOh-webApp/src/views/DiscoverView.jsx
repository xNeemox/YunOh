import React, { useState, useEffect } from "react";
import {
  Search,
  Star,
  MapPin,
  Sparkles,
  Database,
  Heart,
  Clock,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./DiscoverView.css";

const BAYOMBONG_CENTER = { lat: 16.4815, lng: 121.1497 };

// Standard YunOh categories synced with Business Registration & HomeView
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
];

export default function DiscoverView({
  favorites,
  toggleFavorite,
  onSelectRestaurant,
  onSelectBusinessProfile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBarangay, setSelectedBarangay] = useState("All");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userCoords, setUserCoords] = useState(BAYOMBONG_CENTER);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        // Strictly fetch ONLY Admin-verified businesses for the public Discover feed
        const { data, error } = await supabase
          .from("businesses")
          .select("*, reviews(rating)")
          .eq("is_verified", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching businesses:", error.message);
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

  // --- HELPER 1: Parse Multiple Categories ---
  const parseCategories = (catData) => {
    if (!catData) return ["Local Spot"];
    if (Array.isArray(catData)) return catData.filter(Boolean);
    return catData
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  };

  // --- HELPER 2: Extract Barangay ---
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

  // --- HELPER 3: Check Is Open Now ---
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

  // --- HELPER 5: Dynamic Star Rating & Review Count from public.reviews ---
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

  // Build Dynamic Category Filter List combining Standard Categories + any custom DB categories
  const dynamicCategories = [
    "All",
    ...Array.from(
      new Set([
        ...STANDARD_CATEGORIES,
        ...restaurants.flatMap((spot) => parseCategories(spot.category)),
      ]),
    ),
  ];

  // Build Dynamic Barangay Filter List from existing businesses
  const dynamicBarangays = [
    "All",
    ...Array.from(new Set(restaurants.map((spot) => getSpotBarangay(spot)))),
  ];

  // Filter restaurants by Search, Category, and Barangay
  const filteredRestaurants = restaurants.filter((item) => {
    const itemCategories = parseCategories(item.category);
    const itemBarangay = getSpotBarangay(item);
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
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
    <div className="discover-view">
      <div className="welcome-banner">
        <h3>Discover</h3>
        <p className="discover-subtitle-muted">Spot great place around you.</p>

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
      <div className="discover-category-scroll">
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
      <div className="discover-barangay-filter-row">
        <span className="discover-barangay-label">
          <MapPin size={14} /> Sort by Barangay:
        </span>
        <select
          className="discover-barangay-select"
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
        <div className="discover-feed-header-row">
          <h4 className="discover-section-title">Place you might like</h4>
          <span className="supabase-badge"></span>
        </div>

        {loading ? (
          <p className="discover-loading">Loading records from Supabase...</p>
        ) : filteredRestaurants.length === 0 ? (
          <p className="discover-empty">
            No dining records found in your Supabase database.
          </p>
        ) : (
          filteredRestaurants.map((spot) => {
            const isFavorited = favorites.some((fav) => fav.id === spot.id);
            const isOpenNow = checkIsCurrentlyOpen(
              spot.open_time,
              spot.close_time,
            );
            const ratingInfo = getDynamicRatingInfo(spot);
            const barangayName = getSpotBarangay(spot);
            const distanceText = getDynamicDistance(spot);
            const spotCategories = parseCategories(spot.category);
            const visibleCategories = spotCategories.slice(0, 2);
            const extraCategoryCount = spotCategories.length - 2;
            const avatarUrl = spot.business_profile_image || spot.logo_url;

            return (
              <div
                key={spot.id}
                className="restaurant-card discover-card-clickable"
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
                  <div className="card-header-row discover-card-header-row">
                    {/* Circular Merchant Profile Avatar */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBusinessProfile &&
                          onSelectBusinessProfile(spot);
                      }}
                      title="View Business Profile & Gallery"
                      className="discover-merchant-avatar"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={spot.name}
                          className="discover-merchant-avatar-img"
                        />
                      ) : (
                        <span className="discover-merchant-avatar-fallback">
                          {spot.name ? spot.name.charAt(0) : "Y"}
                        </span>
                      )}
                    </div>

                    <div className="discover-merchant-name-wrap">
                      <h4 className="spot-name discover-spot-name">
                        {spot.name}
                      </h4>
                    </div>

                    <span className="spot-rating discover-spot-rating">
                      <Star
                        size={14}
                        fill="var(--accent-color)"
                        color="var(--accent-color)"
                      />
                      {ratingInfo.avg} {ratingInfo.countText}
                    </span>
                  </div>

                  {/* Multi-Category Tags & Open Status */}
                  <div className="discover-meta-wrap">
                    <div className="discover-category-group">
                      {visibleCategories.map((cat, idx) => (
                        <span key={idx} className="category-tag">
                          {cat}
                        </span>
                      ))}
                      {extraCategoryCount > 0 && (
                        <span
                          className="discover-category-more-badge"
                          title={spotCategories.slice(2).join(", ")}
                        >
                          +{extraCategoryCount}
                        </span>
                      )}
                    </div>

                    <span
                      className={`discover-status-pill ${
                        isOpenNow ? "open" : "closed"
                      }`}
                    >
                      <Clock size={11} />
                      {isOpenNow ? "Open Now" : "Closed"}
                    </span>
                  </div>

                  {/* Barangay & Distance */}
                  <div className="discover-location-row">
                    <span className="discover-barangay-tag">
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
