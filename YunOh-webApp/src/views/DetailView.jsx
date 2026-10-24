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
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./DetailView.css";

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
  const [followLoading, setFollowLoading] = useState(false);

  // Interactive Rating & Reviews state (reviews table)
  const [reviewsList, setReviewsList] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function loadDetailData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setCurrentUser(session.user);

        if (isUuidBusiness) {
          // 1. Check if user already claimed a voucher for this business
          const { data: voucherData } = await supabase
            .from("user_vouchers")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("restaurant_id", restaurant.id)
            .maybeSingle();

          if (voucherData) {
            setClaimedVoucher(voucherData);
          }

          // 2. Check if user already follows this business
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("business_id", restaurant.id)
            .maybeSingle();

          setIsFollowing(Boolean(followData));
        }
      }

      // 3. Load community reviews for this business
      if (isUuidBusiness) {
        fetchReviews();
      }
    }

    loadDetailData();
  }, [restaurant.id, isUuidBusiness]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
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

  // Google Maps Redirection URL
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    restaurant.name + " " + (restaurant.address || "Bayombong Nueva Vizcaya"),
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
      return;
    }

    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("business_id", restaurant.id);

      if (!error) setIsFollowing(false);
    } else {
      const { error } = await supabase.from("follows").insert([
        {
          user_id: currentUser.id,
          business_id: restaurant.id,
        },
      ]);

      if (!error) setIsFollowing(true);
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

  // Handle Leaving a Review (reviews table)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in first to leave a review!");
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
        rating: userRating,
        comment: userComment.trim(),
        profiles: { username: currentUser.email?.split("@")[0] || "Consumer" },
      };
      setReviewsList((prev) => [mockNewReview, ...prev]);
      setUserComment("");
      setUserRating(5);
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
      setUserRating(5);
      fetchReviews();
    }
    setSubmittingReview(false);
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
          <span className="promo-badge">
            <Sparkles size={12} /> {restaurant.category || "Local Dining"}
          </span>
          <button
            className={`fav-toggle-btn ${isFavorited ? "active" : ""}`}
            onClick={() => toggleFavorite(restaurant)}
            aria-label="Toggle favorite"
          >
            <Heart
              size={18}
              fill={isFavorited ? "var(--struct-secondary)" : "none"}
              color={isFavorited ? "var(--struct-secondary)" : "#FFFFFF"}
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

            <span className="spot-rating detail-rating-badge">
              <Star
                size={16}
                fill="var(--accent-color)"
                color="var(--accent-color)"
              />
              {restaurant.rating || 4.8} ({restaurant.reviews || 100}+)
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
                  <UserCheck size={14} /> Unfollow
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Follow
                </>
              )}
            </button>
          </div>

          {/* Info Grid */}
          <div className="detail-info-grid">
            <div className="info-row">
              <MapPin size={16} color="var(--struct-secondary)" />
              <span>
                {restaurant.address || "Centro, Bayombong, Nueva Vizcaya"}
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

          <div className="reviews-section">
            <h4>Ratings & Community Reviews ⭐</h4>

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
                        starValue <= userRating ? "var(--accent-color)" : "none"
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

            {/* Existing Reviews List */}
            <div className="reviews-list">
              {reviewsList.length === 0 ? (
                <p className="reviews-empty-text">
                  No reviews yet. Be the first to leave a review!
                </p>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev.id} className="review-item-card">
                    <div className="review-item-header">
                      <span className="review-author">
                        @
                        {rev.profiles?.username ||
                          rev.profiles?.full_name ||
                          "foodlover"}
                      </span>
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
                    </div>
                    <p className="review-comment-text">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
