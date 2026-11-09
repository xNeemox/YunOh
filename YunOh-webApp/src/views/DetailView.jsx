import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Send,
  Tag,
  Heart,
  Sparkles,
  CheckCircle,
  AlertCircle,
  UserPlus,
  UserCheck,
  Trash2,
  Utensils,
  X,
  Navigation,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./DetailView.css";

// Default fallback coordinates: Bayombong, Nueva Vizcaya Town Center
const BAYOMBONG_CENTER = { lat: 16.4815, lng: 121.1497 };

// Fallback sample menu items for non-UUID mock cards
const FALLBACK_MENU_ITEMS = [
  {
    id: "mock-dish-1",
    name: "Special Pancit Batil Patong",
    description:
      "Authentic miki noodles topped with seasoned beef, crispy chicharon, poached egg, and served with rich egg drop soup.",
    price: 135.0,
    special_tag: "Best Seller",
    image_url:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "mock-dish-2",
    name: "Sizzling Pork Sisig Platter",
    description:
      "Crispy chopped pork belly tossed in calamansi-chili dressing on a hot cast-iron plate.",
    price: 180.0,
    special_tag: "Special Offer",
    image_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
];

export default function DetailView({
  restaurant,
  onBack,
  favorites,
  toggleFavorite,
  onSelectBusinessProfile,
}) {
  if (!restaurant) return null;

  const isFavorited = favorites.some((fav) => fav.id === restaurant.id);

  // Check if this is a live UUID business from Supabase vs a numeric mock fallback card
  const isUuidBusiness =
    typeof restaurant.id === "string" && restaurant.id.length > 10;

  // Option 2: Embedded Exact-Pin Map Preview Toggle State
  const [showMapPreview, setShowMapPreview] = useState(false);

  // Primary Sliding Tab Navigation ('menu' | 'reviews' | 'promos')
  const [activeNavTab, setActiveNavTab] = useState("menu");

  // Secondary Special Tag Pill Filter ('All Menu' | 'Best Seller' | 'New Arrivals' | 'Special Offer')
  const [selectedSpecialTag, setSelectedSpecialTag] = useState("All Menu");

  // Menu Items & Dish Ratings State
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [dishRatingsMap, setDishRatingsMap] = useState({}); // { [menu_item_id]: [{ id, user_id, rating }] }
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [ratingDishLoading, setRatingDishLoading] = useState(false);

  // User & Voucher state
  const [currentUser, setCurrentUser] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");

  // Follow state (follows table)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Interactive Establishment Rating & Reviews state (reviews table) — Default 0!
  const [reviewsList, setReviewsList] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState("");

  // User live GPS coordinates for dynamic distance
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
        () => {},
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  useEffect(() => {
    async function loadDetailData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const activeUser = session?.user || null;
      setCurrentUser(activeUser);

      if (isUuidBusiness) {
        // 1. Log 1 visit per user per day into business_visits
        await logDailyVisit(restaurant.id, activeUser?.id || null);

        // 2. Fetch total followers count
        fetchFollowerCount();

        // 3. Fetch digital menu items & their ratings
        fetchMenuAndRatings();

        // 4. Load establishment community reviews
        fetchReviews();

        if (activeUser) {
          // 5. Check if user already claimed a voucher
          const { data: voucherData } = await supabase
            .from("user_vouchers")
            .select("*")
            .eq("user_id", activeUser.id)
            .eq("restaurant_id", restaurant.id)
            .maybeSingle();

          if (voucherData) {
            setClaimedVoucher(voucherData);
          }

          // 6. Check if user already follows this business
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("user_id", activeUser.id)
            .eq("business_id", restaurant.id)
            .maybeSingle();

          setIsFollowing(Boolean(followData));
        }
      } else {
        setMenuItems(FALLBACK_MENU_ITEMS);
      }
    }

    loadDetailData();
  }, [restaurant.id, isUuidBusiness]);

  // --- HELPER: Fetch Menu Items & Dish Ratings ---
  const fetchMenuAndRatings = async () => {
    setMenuLoading(true);
    try {
      const { data: items, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("business_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (!error && items) {
        setMenuItems(items);

        if (items.length > 0) {
          const itemIds = items.map((i) => i.id);
          const { data: ratingsData } = await supabase
            .from("menu_item_ratings")
            .select("id, menu_item_id, user_id, rating")
            .in("menu_item_id", itemIds);

          const grouped = {};
          (ratingsData || []).forEach((r) => {
            if (!grouped[r.menu_item_id]) grouped[r.menu_item_id] = [];
            grouped[r.menu_item_id].push(r);
          });
          setDishRatingsMap(grouped);
        } else {
          setDishRatingsMap({});
        }
      }
    } finally {
      setMenuLoading(false);
    }
  };

  // --- HELPER: Get Average Rating & User's Own Rating for a Menu Item ---
  const getDishRatingStats = (dishId) => {
    const list = dishRatingsMap[dishId] || [];
    const count = list.length;
    const myEntry = currentUser
      ? list.find((r) => r.user_id === currentUser.id)
      : null;
    const myRating = myEntry ? Number(myEntry.rating) : 0;

    if (count === 0) {
      return { avgText: "New", count: 0, myRating };
    }
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return {
      avgText: (sum / count).toFixed(1),
      count,
      myRating,
    };
  };

  // --- HELPER: Rate or Undo Rating on a Menu Item (Tap same star to remove!) ---
  const handleToggleDishStar = async (dish, starValue) => {
    if (!currentUser) {
      alert("Please sign in first to rate menu items!");
      return;
    }

    const currentList = dishRatingsMap[dish.id] || [];
    const existingEntry = currentList.find((r) => r.user_id === currentUser.id);
    const isUndoingSameStar =
      existingEntry && Number(existingEntry.rating) === starValue;

    setRatingDishLoading(true);

    if (!isUuidBusiness) {
      setDishRatingsMap((prev) => {
        const list = prev[dish.id] || [];
        const filtered = list.filter((r) => r.user_id !== currentUser.id);
        return {
          ...prev,
          [dish.id]: isUndoingSameStar
            ? filtered
            : [
                ...filtered,
                { id: Date.now(), user_id: currentUser.id, rating: starValue },
              ],
        };
      });
      setRatingDishLoading(false);
      return;
    }

    try {
      if (isUndoingSameStar) {
        const { error } = await supabase
          .from("menu_item_ratings")
          .delete()
          .eq("menu_item_id", dish.id)
          .eq("user_id", currentUser.id);

        if (!error) {
          setDishRatingsMap((prev) => ({
            ...prev,
            [dish.id]: (prev[dish.id] || []).filter(
              (r) => r.user_id !== currentUser.id,
            ),
          }));
        }
      } else {
        const { data, error } = await supabase
          .from("menu_item_ratings")
          .upsert(
            [
              {
                menu_item_id: dish.id,
                user_id: currentUser.id,
                rating: starValue,
              },
            ],
            { onConflict: "menu_item_id,user_id" },
          )
          .select()
          .single();

        if (!error && data) {
          setDishRatingsMap((prev) => {
            const filtered = (prev[dish.id] || []).filter(
              (r) => r.user_id !== currentUser.id,
            );
            return {
              ...prev,
              [dish.id]: [...filtered, data],
            };
          });
        }
      }
    } finally {
      setRatingDishLoading(false);
    }
  };

  // --- HELPER: Log 1 visit per user per day (business_visits table) ---
  const logDailyVisit = async (businessId, userId) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      if (userId) {
        const { data: existingVisit } = await supabase
          .from("business_visits")
          .select("id")
          .eq("business_id", businessId)
          .eq("user_id", userId)
          .gte("visited_at", todayIso)
          .limit(1);

        if (!existingVisit || existingVisit.length === 0) {
          await supabase.from("business_visits").insert([
            {
              business_id: businessId,
              user_id: userId,
            },
          ]);
        }
      } else {
        const dateKey = todayStart.toISOString().split("T")[0];
        const storageKey = `yunoh_visit_${businessId}_${dateKey}`;
        if (!localStorage.getItem(storageKey)) {
          await supabase.from("business_visits").insert([
            {
              business_id: businessId,
              user_id: null,
            },
          ]);
          localStorage.setItem(storageKey, "true");
        }
      }
    } catch {
      // Ignore analytics errors
    }
  };

  const fetchFollowerCount = async () => {
    const { count, error } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("business_id", restaurant.id);

    if (!error && typeof count === "number") {
      setFollowerCount(count);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        user_id,
        rating,
        comment,
        created_at,
        profiles ( username, full_name )
      `,
      )
      .eq("business_id", restaurant.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviewsList(data);
    }
  };

  // --- HELPER: Parse Multiple Categories (up to 2 + '+N') ---
  const parseCategories = (catData) => {
    if (!catData) return ["Local Dining"];
    if (Array.isArray(catData)) return catData.filter(Boolean);
    return catData
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  };

  const spotCategories = parseCategories(restaurant.category);
  const visibleCategories = spotCategories.slice(0, 2);
  const extraCategoryCount = spotCategories.length - 2;

  // --- HELPER: Build Dynamic Structured Address ---
  const getFormattedAddress = () => {
    const parts = [
      restaurant.street,
      restaurant.barangay ? `Brgy. ${restaurant.barangay}` : null,
      restaurant.municipality,
      restaurant.province,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }
    return restaurant.address || "Centro, Bayombong, Nueva Vizcaya";
  };

  // --- HELPER: Resolve Exact Valid Coordinates (With Auto-Swap Safeguard) ---
  const getExactCoordinates = () => {
    let lat = parseFloat(restaurant.latitude);
    let lng = parseFloat(restaurant.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return {
        lat: BAYOMBONG_CENTER.lat,
        lng: BAYOMBONG_CENTER.lng,
        hasExactCoords: false,
      };
    }

    // Auto-swap if longitude was accidentally typed into latitude
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      const temp = lat;
      lat = lng;
      lng = temp;
    }

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      hasExactCoords: true,
    };
  };

  const exactCoords = getExactCoordinates();

  // Google Maps Embed URL (Street-level zoom z=18 locked onto exact red pin)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${exactCoords.lat},${exactCoords.lng}&z=18&output=embed`;

  // Exact External Google Maps Pin & Directions URL
  const mapDirectUrl = `https://www.google.com/maps/search/?api=1&query=${exactCoords.lat},${exactCoords.lng}`;

  // --- HELPER: Dynamic Distance Calculation (Haversine formula in km) ---
  const getDynamicDistance = () => {
    const lat = exactCoords.lat;
    const lng = exactCoords.lng;

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

  // --- HELPER: Dynamic Star Rating & Review Count ---
  const getDynamicHeaderRating = () => {
    if (isUuidBusiness) {
      const count = reviewsList.length;
      if (count === 0) {
        return { avg: "New", countText: "(0)" };
      }
      const sum = reviewsList.reduce(
        (acc, rev) => acc + (Number(rev.rating) || 0),
        0,
      );
      return { avg: (sum / count).toFixed(1), countText: `(${count})` };
    }

    if (reviewsList.length > 0) {
      const count = reviewsList.length;
      const sum = reviewsList.reduce(
        (acc, rev) => acc + (Number(rev.rating) || 0),
        0,
      );
      return { avg: (sum / count).toFixed(1), countText: `(${count})` };
    }

    const fallbackCount = Array.isArray(restaurant.reviews)
      ? restaurant.reviews.length
      : restaurant.reviews || 100;
    return {
      avg: restaurant.rating || 4.8,
      countText: `(${fallbackCount}+)`,
    };
  };

  const ratingInfo = getDynamicHeaderRating();
  const formattedAddress = getFormattedAddress();
  const distanceText = getDynamicDistance();

  const existingUserReview = currentUser
    ? reviewsList.find((rev) => rev.user_id === currentUser.id)
    : null;

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

  // Handle Follow / Unfollow Toggle
  const handleToggleFollow = async () => {
    if (!currentUser) {
      alert("Please sign in first to follow establishments!");
      return;
    }

    if (!isUuidBusiness) {
      setIsFollowing((prev) => !prev);
      setFollowerCount((prev) =>
        isFollowing ? Math.max(0, prev - 1) : prev + 1,
      );
      return;
    }

    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("business_id", restaurant.id);

      if (!error) {
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase.from("follows").insert([
        {
          user_id: currentUser.id,
          business_id: restaurant.id,
        },
      ]);

      if (!error) {
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    }
    setFollowLoading(false);
  };

  // Handle Voucher Claiming
  const handleClaimVoucher = async () => {
    if (!currentUser) {
      alert("Please sign in from your Profile tab first to claim vouchers!");
      return;
    }

    setClaiming(true);
    setVoucherError("");

    const randomCode = `YUNOH-${restaurant.name
      .slice(0, 3)
      .toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const promoText = restaurant.promo || "10% discount on total order";

    if (!isUuidBusiness) {
      setClaimedVoucher({
        voucher_code: randomCode,
        promo_text: promoText,
      });
      setClaiming(false);
      return;
    }

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

  // Handle Leaving an Establishment Review (1 per user limit)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in first to leave a review!");
      return;
    }

    if (existingUserReview) {
      setReviewError(
        "You have already reviewed this establishment. Remove your existing review first to post a new one.",
      );
      return;
    }

    if (userRating < 1 || userRating > 5) {
      setReviewError("Please tap a star (1 to 5) to rate this establishment.");
      return;
    }

    if (!userComment.trim()) {
      setReviewError("Please write a brief comment for your review.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    if (!isUuidBusiness) {
      const mockNewReview = {
        id: Date.now(),
        user_id: currentUser.id,
        rating: userRating,
        comment: userComment.trim(),
        profiles: { username: currentUser.email?.split("@")[0] || "Consumer" },
      };
      setReviewsList((prev) => [mockNewReview, ...prev]);
      setUserComment("");
      setUserRating(0);
      setSubmittingReview(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert([
      {
        business_id: restaurant.id,
        user_id: currentUser.id,
        rating: userRating,
        comment: userComment.trim(),
      },
    ]);

    if (error) {
      setReviewError(error.message);
    } else {
      setUserComment("");
      setUserRating(0);
      fetchReviews();
    }
    setSubmittingReview(false);
  };

  // Handle Removing Own Establishment Review
  const handleDeleteReview = async (reviewId) => {
    if (!currentUser) return;

    setDeletingReviewId(reviewId);
    setReviewError("");

    if (!isUuidBusiness) {
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      setDeletingReviewId(null);
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", currentUser.id);

    if (error) {
      setReviewError(error.message);
    } else {
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
    }
    setDeletingReviewId(null);
  };

  // --- DYNAMIC SPECIAL TAG PILLS (Only render tags that actually exist in menuItems) ---
  const ORDERED_SPECIAL_TAGS = ["Best Seller", "New Arrivals", "Special Offer"];
  const availableSpecialTags = [
    "All Menu",
    ...ORDERED_SPECIAL_TAGS.filter((tag) =>
      menuItems.some((item) => item.special_tag === tag),
    ),
  ];

  const filteredMenuItems =
    selectedSpecialTag === "All Menu"
      ? menuItems
      : menuItems.filter((item) => item.special_tag === selectedSpecialTag);

  const slidingTabIndex =
    activeNavTab === "menu" ? 0 : activeNavTab === "reviews" ? 1 : 2;

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
          {restaurant.cover_image_url && (
            <img
              src={restaurant.cover_image_url}
              alt={`${restaurant.name} cover`}
              className="detail-banner-img"
            />
          )}

          {/* Dynamic Multi-Category Badges (up to 2 + '+N') */}
          <div className="detail-banner-badges">
            {visibleCategories.map((cat, idx) => (
              <span key={idx} className="promo-badge">
                <Sparkles size={12} /> {cat}
              </span>
            ))}
            {extraCategoryCount > 0 && (
              <span
                className="detail-category-more-badge"
                title={spotCategories.slice(2).join(", ")}
              >
                +{extraCategoryCount}
              </span>
            )}
          </div>

          <button
            className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
            onClick={() => toggleFavorite(restaurant)}
            aria-label="Toggle favorite"
          >
            <Heart
              size={18}
              fill={isFavorited ? "var(--heart-color)" : "none"}
              color={isFavorited ? "var(--heart-outline-color)" : "#FFFFFF"}
            />
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-title-row align-center">
            {/* Circular Merchant Profile Avatar */}
            <div
              onClick={() =>
                onSelectBusinessProfile && onSelectBusinessProfile(restaurant)
              }
              title="View Business Profile & Gallery"
              className="detail-merchant-avatar"
              style={{
                backgroundColor:
                  restaurant.imageColor || "var(--struct-secondary)",
              }}
            >
              {restaurant.business_profile_image ? (
                <img
                  src={restaurant.business_profile_image}
                  alt={restaurant.name}
                  className="detail-merchant-avatar-img"
                />
              ) : (
                <span className="detail-merchant-avatar-letter">
                  {restaurant.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="detail-title-wrap">
              <h2 className="detail-name compact">{restaurant.name}</h2>
            </div>

            {/* Dynamic Average Rating & Review Count */}
            <span className="spot-rating detail-rating-badge">
              <Star
                size={16}
                fill="var(--accent-color)"
                color="var(--accent-color)"
              />
              {ratingInfo.avg} {ratingInfo.countText}
            </span>
          </div>

          {/* Dynamic Open / Closed Status Badge + Follow Toggle Button */}
          <div className="detail-status-follow-row">
            <span className={`status-badge ${isOpenNow ? "open" : "closed"}`}>
              ● {isOpenNow ? "Open Now" : "Closed Right Now"}
            </span>

            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`follow-toggle-btn ${isFollowing ? "following" : ""}`}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={14} /> Unfollow{" "}
                  {followerCount > 0 ? `(${followerCount})` : ""}
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Follow{" "}
                  {followerCount > 0 ? `(${followerCount})` : ""}
                </>
              )}
            </button>
          </div>

          {/* Optional Dynamic Business Description */}
          {restaurant.description && (
            <p className="detail-description-text">{restaurant.description}</p>
          )}

          {/* Dynamic Info Grid + Compact "See on map" Paper Airplane Button */}
          <div className="detail-info-grid">
            <div className="detail-address-map-row">
              <div className="info-row">
                <MapPin size={16} color="var(--struct-secondary)" />
                <span>
                  {formattedAddress} • <strong>{distanceText} away</strong>
                </span>
              </div>

              <button
                type="button"
                className="compact-map-btn"
                onClick={() => setShowMapPreview((prev) => !prev)}
                title="See exact location on map"
              >
                <Send size={12} /> {showMapPreview ? "Hide map" : "See on map"}
              </button>
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

          {/* OPTION 2: Embedded Exact-Pin Street-Level Map Preview */}
          {showMapPreview && (
            <div className="detail-map-preview-card">
              <div className="detail-map-iframe-wrap">
                <iframe
                  title={`${restaurant.name} Exact Map Location`}
                  src={mapEmbedUrl}
                  className="detail-map-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <span className="detail-map-coords-pill">
                  {exactCoords.lat}, {exactCoords.lng}
                </span>
              </div>

              <a
                href={mapDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-open-gmaps-btn"
              >
                <Navigation size={15} />
                <span>Open in Google Maps & Get Directions</span>
              </a>
            </div>
          )}

          {/* ================= PRIMARY SLIDING UNDERLINE NAVIGATION ================= */}
          <div className="detail-sliding-tabs">
            <button
              type="button"
              className={`detail-sliding-tab ${
                activeNavTab === "menu" ? "active" : ""
              }`}
              onClick={() => setActiveNavTab("menu")}
            >
              Menu ({menuItems.length})
            </button>
            <button
              type="button"
              className={`detail-sliding-tab ${
                activeNavTab === "reviews" ? "active" : ""
              }`}
              onClick={() => setActiveNavTab("reviews")}
            >
              Reviews ({reviewsList.length})
            </button>
            <button
              type="button"
              className={`detail-sliding-tab ${
                activeNavTab === "promos" ? "active" : ""
              }`}
              onClick={() => setActiveNavTab("promos")}
            >
              Promos
            </button>
            <div
              className={`detail-sliding-indicator tab-${slidingTabIndex}`}
            />
          </div>

          {/* ================= TAB 1: DIGITAL MENU ================= */}
          {activeNavTab === "menu" && (
            <div className="detail-menu-section">
              {/* Dynamic Special Tag Pill Navigation (Only renders tags that exist) */}
              <div className="menu-tag-pills-row">
                {availableSpecialTags.map((tagLabel) => (
                  <button
                    key={tagLabel}
                    type="button"
                    className={`menu-tag-pill ${
                      selectedSpecialTag === tagLabel ? "active" : ""
                    }`}
                    onClick={() => setSelectedSpecialTag(tagLabel)}
                  >
                    {tagLabel}
                  </button>
                ))}
              </div>

              {menuLoading ? (
                <p className="reviews-empty-text">Loading digital menu...</p>
              ) : filteredMenuItems.length === 0 ? (
                <p className="reviews-empty-text">
                  No menu items posted for this category yet.
                </p>
              ) : (
                <div className="detail-menu-grid">
                  {filteredMenuItems.map((dish) => {
                    const stats = getDishRatingStats(dish.id);
                    return (
                      <div
                        key={dish.id}
                        className="detail-menu-card"
                        onClick={() => setSelectedDishModal(dish)}
                      >
                        <div className="detail-menu-img-wrap">
                          {dish.image_url ? (
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="detail-menu-img"
                            />
                          ) : (
                            <Utensils size={28} color="#a8a29e" />
                          )}
                          {dish.special_tag && dish.special_tag !== "None" && (
                            <span className="detail-menu-tag-badge">
                              {dish.special_tag}
                            </span>
                          )}
                        </div>

                        <div className="detail-menu-card-body">
                          <h5 className="detail-menu-title">{dish.name}</h5>
                          <div className="detail-menu-footer">
                            <span className="detail-menu-price">
                              ₱{Number(dish.price).toFixed(2)}
                            </span>
                            <span className="detail-menu-rating">
                              <Star
                                size={12}
                                fill={
                                  stats.count === 0
                                    ? "none"
                                    : "var(--accent-color)"
                                }
                                color="var(--accent-color)"
                              />
                              {stats.avgText}
                              {stats.count > 0 ? ` (${stats.count})` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: ESTABLISHMENT REVIEWS ================= */}
          {activeNavTab === "reviews" && (
            <div className="reviews-section">
              {existingUserReview ? (
                <div className="already-reviewed-box">
                  <CheckCircle size={15} color="#10b981" />
                  <span>
                    You have already rated & reviewed this spot. Remove your
                    review below if you wish to submit a new one.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitReview}
                  className="review-form-card"
                >
                  <div className="star-rating-input">
                    <span className="star-rating-label">
                      Your Rating {userRating > 0 ? `(${userRating}★)` : ""}:
                    </span>
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() =>
                          setUserRating((prev) =>
                            prev === starValue ? 0 : starValue,
                          )
                        }
                        className="star-select-btn"
                        aria-label={`Rate ${starValue} stars`}
                      >
                        <Star
                          size={18}
                          fill={
                            starValue <= userRating
                              ? "var(--accent-color)"
                              : "none"
                          }
                          color={
                            starValue <= userRating
                              ? "var(--accent-color)"
                              : "var(--text-secondary)"
                          }
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="review-textarea"
                    placeholder="Share your experience at this establishment..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                  />

                  {reviewError && (
                    <div className="voucher-error-msg">
                      <AlertCircle size={14} /> <span>{reviewError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="leave-review-btn"
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Posting Review..." : "Leave a Review"}
                  </button>
                </form>
              )}

              {/* Existing Establishment Reviews List */}
              <div className="reviews-list">
                {reviewsList.length === 0 ? (
                  <p className="reviews-empty-text">
                    No establishment reviews yet. Be the first to leave one!
                  </p>
                ) : (
                  reviewsList.map((rev) => {
                    const isOwnReview =
                      currentUser && rev.user_id === currentUser.id;

                    return (
                      <div key={rev.id} className="review-item-card">
                        <div className="review-item-header">
                          <span className="review-author">
                            @
                            {rev.profiles?.username ||
                              rev.profiles?.full_name ||
                              "foodlover"}
                          </span>

                          <div className="review-header-right">
                            <div className="review-stars-display">
                              {[...Array(rev.rating || 5)].map((_, idx) => (
                                <Star
                                  key={idx}
                                  size={12}
                                  fill="var(--accent-color)"
                                  color="var(--accent-color)"
                                />
                              ))}
                            </div>

                            {isOwnReview && (
                              <button
                                type="button"
                                className="delete-review-btn"
                                onClick={() => handleDeleteReview(rev.id)}
                                disabled={deletingReviewId === rev.id}
                                title="Remove your review"
                              >
                                <Trash2 size={13} />
                                {deletingReviewId === rev.id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="review-comment-text">{rev.comment}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: PROMOS & VOUCHERS ================= */}
          {activeNavTab === "promos" && (
            <div className="promo-section">
              <div className="promo-card">
                <div className="promo-text">
                  <Tag size={16} color="var(--accent-color)" />
                  <span>
                    {restaurant.promo ||
                      "10% discount on total order for students!"}
                  </span>
                </div>

                {voucherError && (
                  <div className="voucher-error-msg">
                    <AlertCircle size={14} /> <span>{voucherError}</span>
                  </div>
                )}

                {claimedVoucher ? (
                  <div className="voucher-claimed-box">
                    <div className="voucher-claimed-title">
                      <CheckCircle size={14} /> Voucher Claimed Successfully!
                    </div>
                    <div className="voucher-claimed-code">
                      {claimedVoucher.voucher_code}
                    </div>
                    <div className="voucher-claimed-hint">
                      Show this code at the cashier to redeem.
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="claim-voucher-btn"
                    onClick={handleClaimVoucher}
                    disabled={claiming}
                  >
                    {claiming ? "Claiming Voucher..." : "Claim Voucher Code"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MENU ITEM POP-OUT MODAL ================= */}
      {selectedDishModal && (
        <div
          className="dish-modal-overlay"
          onClick={() => setSelectedDishModal(null)}
        >
          <div className="dish-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dish-modal-img-header">
              {selectedDishModal.image_url ? (
                <img
                  src={selectedDishModal.image_url}
                  alt={selectedDishModal.name}
                />
              ) : (
                <Utensils size={42} color="#a8a29e" />
              )}

              {selectedDishModal.special_tag &&
                selectedDishModal.special_tag !== "None" && (
                  <span className="detail-menu-tag-badge">
                    {selectedDishModal.special_tag}
                  </span>
                )}

              <button
                type="button"
                className="dish-modal-close-btn"
                onClick={() => setSelectedDishModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dish-modal-body">
              <div className="dish-modal-title-row">
                <h4 className="dish-modal-title">{selectedDishModal.name}</h4>
                <span className="dish-modal-price">
                  ₱{Number(selectedDishModal.price).toFixed(2)}
                </span>
              </div>

              {(() => {
                const stats = getDishRatingStats(selectedDishModal.id);
                return (
                  <>
                    <div className="dish-modal-meta-row">
                      <Star
                        size={14}
                        fill="var(--accent-color)"
                        color="var(--accent-color)"
                      />
                      <span>
                        {stats.avgText}{" "}
                        {stats.count > 0
                          ? `(${stats.count} rating${
                              stats.count > 1 ? "s" : ""
                            })`
                          : "(No ratings yet)"}
                      </span>
                    </div>

                    <div className="dish-modal-desc-box">
                      {selectedDishModal.description ||
                        "Freshly prepared house specialty made with local ingredients."}
                    </div>

                    <div className="dish-modal-rating-box">
                      <span className="dish-modal-rating-title">
                        {stats.myRating > 0
                          ? `You rated this dish ${stats.myRating} ★`
                          : "Rate this Menu Item"}
                      </span>

                      <div className="dish-modal-stars-row">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            type="button"
                            disabled={ratingDishLoading}
                            className="dish-star-btn"
                            onClick={() =>
                              handleToggleDishStar(selectedDishModal, starVal)
                            }
                            aria-label={`Rate dish ${starVal} stars`}
                          >
                            <Star
                              size={24}
                              fill={
                                starVal <= stats.myRating
                                  ? "var(--accent-color)"
                                  : "none"
                              }
                              color={
                                starVal <= stats.myRating
                                  ? "var(--accent-color)"
                                  : "var(--text-secondary)"
                              }
                            />
                          </button>
                        ))}
                      </div>

                      <span className="dish-modal-rating-hint">
                        {stats.myRating > 0
                          ? `Tap ${stats.myRating}★ again to undo and remove your rating`
                          : "Tap a star to rate (1 rating per consumer)"}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
