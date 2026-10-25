import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Navigation,
  Tag,
  Heart,
  Sparkles,
  CheckCircle,
  AlertCircle,
  UserPlus,
  UserCheck,
  Trash2,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./DetailView.css";

// Default fallback coordinates: Bayombong, Nueva Vizcaya Town Center
const BAYOMBONG_CENTER = { lat: 16.4815, lng: 121.1497 };

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

  // User & Voucher state
  const [currentUser, setCurrentUser] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");

  // Follow state (follows table)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Interactive Rating & Reviews state (reviews table)
  const [reviewsList, setReviewsList] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState("");

  // User live GPS coordinates for dynamic distance
  const [userCoords, setUserCoords] = useState(BAYOMBONG_CENTER);

  useEffect(() => {
    // Request user's real-time location for accurate distance
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Keep Bayombong center fallback if denied
        },
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

        // 2. Fetch total followers count for this business
        fetchFollowerCount();

        // 3. Load community reviews for this business
        fetchReviews();

        if (activeUser) {
          // 4. Check if user already claimed a voucher for this business
          const { data: voucherData } = await supabase
            .from("user_vouchers")
            .select("*")
            .eq("user_id", activeUser.id)
            .eq("restaurant_id", restaurant.id)
            .maybeSingle();

          if (voucherData) {
            setClaimedVoucher(voucherData);
          }

          // 5. Check if user already follows this business
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("user_id", activeUser.id)
            .eq("business_id", restaurant.id)
            .maybeSingle();

          setIsFollowing(Boolean(followData));
        }
      }
    }

    loadDetailData();
  }, [restaurant.id, isUuidBusiness]);

  // --- HELPER: Log 1 visit per user per day (business_visits table) ---
  const logDailyVisit = async (businessId, userId) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      if (userId) {
        // Check if this logged-in user already visited this business today
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
        // Guest user: restrict to 1 visit per day using sessionStorage/localStorage key
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
      // Silently ignore analytics errors so UI never breaks
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

  // --- HELPER: Dynamic Distance Calculation (Haversine formula in km) ---
  const getDynamicDistance = () => {
    const lat = Number(restaurant.latitude);
    const lng = Number(restaurant.longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return restaurant.distance || "1.5 km";
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

    // Fallback for static mock cards
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

  // Check if current logged-in user already submitted a review for this business
  const existingUserReview = currentUser
    ? reviewsList.find((rev) => rev.user_id === currentUser.id)
    : null;

  // Helper function to check if currently open using "HH:mm" text format
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

  // Google Maps Redirection URL (uses exact coordinates or formatted address)
  const mapSearchUrl =
    restaurant.latitude && restaurant.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${restaurant.name} ${formattedAddress}`,
        )}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${restaurant.name} ${formattedAddress}`,
        )}`;

  // Handle Follow / Unfollow Toggle (follows table)
  const handleToggleFollow = async () => {
    if (!currentUser) {
      alert("Please sign in first to follow establishments!");
      return;
    }

    // Fallback toggle for static mock cards during demo
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

  // Handle Voucher Claiming (user_vouchers table)
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

    // Demo fallback for static mock cards
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

  // Handle Leaving a Review (1 per user limit)
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
      setReviewError("Please select a star rating (1 to 5 stars) first.");
      return;
    }

    if (!userComment.trim()) {
      setReviewError("Please write a brief comment for your review.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    // Demo fallback for static mock cards
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

  // Handle Removing Own Review
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
            {/* Circular Merchant Profile Avatar before name */}
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

          {/* Dynamic Info Grid (Structured Address, Distance, Hours) */}
          <div className="detail-info-grid">
            <div className="info-row">
              <MapPin size={16} color="var(--struct-secondary)" />
              <span>
                {formattedAddress} • <strong>{distanceText} away</strong>
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

          {/* Active Promo & Voucher Section */}
          <div className="promo-section promo-section-spaced">
            <h4>Digital Promo & Voucher 🎟️</h4>
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
                  className="claim-voucher-btn"
                  onClick={handleClaimVoucher}
                  disabled={claiming}
                >
                  {claiming ? "Claiming Voucher..." : "Claim Voucher Code"}
                </button>
              )}
            </div>
          </div>

          {/* Interactive Rating & Community Reviews Section */}
          <div className="reviews-section">
            <h4>Ratings & Community Reviews ⭐</h4>

            {existingUserReview ? (
              <div className="already-reviewed-box">
                <CheckCircle size={15} color="#10b981" />
                <span>
                  You have already rated & reviewed this spot. Remove your
                  review below if you wish to submit a new one.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form-card">
                <div className="star-rating-input">
                  <span className="star-rating-label">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setUserRating(starValue)}
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
                  placeholder="Share your dining experience..."
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

            {/* Existing Reviews List */}
            <div className="reviews-list">
              {reviewsList.length === 0 ? (
                <p className="reviews-empty-text">
                  No reviews yet. Be the first to leave a review!
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
        </div>
      </div>
    </div>
  );
}
