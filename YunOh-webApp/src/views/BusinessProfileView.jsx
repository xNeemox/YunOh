import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Star,
  Tag,
  Image as ImageIcon,
  Sparkles,
  UserPlus,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./BusinessProfileView.css";

export default function BusinessProfileView({ business, onBack }) {
  if (!business) return null;

  // Check if this is a live UUID business from Supabase vs a numeric mock card
  const isUuidBusiness =
    typeof business.id === "string" && business.id.length > 10;

  // Sliding Underline Navigation ('reviews' | 'contacts' | 'about')
  const [activeNavTab, setActiveNavTab] = useState("reviews");

  // Lightbox state for tapping a Justified Gallery image
  const [lightboxImg, setLightboxImg] = useState(null);

  // User & Live Follow State
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Interactive Rating & Community Reviews State (Default 0 stars, tap same star to undo)
  const [reviewsList, setReviewsList] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState("");

  // Gallery images array (menu_images completely removed per schema update)
  const galleryImages = Array.isArray(business.gallery_images)
    ? business.gallery_images.filter(Boolean)
    : [];

  useEffect(() => {
    async function loadStorefrontData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const activeUser = session?.user || null;
      setCurrentUser(activeUser);

      if (isUuidBusiness) {
        fetchFollowerCount();
        fetchReviews();

        if (activeUser) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("user_id", activeUser.id)
            .eq("business_id", business.id)
            .maybeSingle();

          setIsFollowing(Boolean(followData));
        }
      } else {
        setFollowerCount(24);
      }
    }

    loadStorefrontData();
  }, [business.id, isUuidBusiness]);

  const fetchFollowerCount = async () => {
    const { count, error } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);

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
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviewsList(data);
    }
  };

  // --- HELPER: Parse Multiple Categories (up to 2 + '+N') ---
  const parseCategories = (catData) => {
    if (!catData) return ["Local Delicacy"];
    if (Array.isArray(catData)) return catData.filter(Boolean);
    return catData
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  };

  const spotCategories = parseCategories(business.category);
  const visibleCategories = spotCategories.slice(0, 2);
  const extraCategoryCount = spotCategories.length - 2;

  // --- HELPER: Build Dynamic Structured Bayombong Address ---
  const getFormattedAddress = () => {
    const parts = [
      business.street,
      business.barangay ? `Brgy. ${business.barangay}` : null,
      business.municipality,
      business.province,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }
    return business.address || "Bayombong, Nueva Vizcaya";
  };

  // --- HELPER: Dynamic Star Rating & Review Count ---
  const getDynamicRatingInfo = () => {
    if (isUuidBusiness || reviewsList.length > 0) {
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

    if (Array.isArray(business.reviews)) {
      const count = business.reviews.length;
      if (count === 0) return { avg: "New", countText: "(0)" };
      const sum = business.reviews.reduce(
        (acc, rev) => acc + (Number(rev.rating) || 0),
        0,
      );
      return { avg: (sum / count).toFixed(1), countText: `(${count})` };
    }

    return {
      avg: business.rating || 4.8,
      countText: `(${business.reviews || 50}+)`,
    };
  };

  const ratingInfo = getDynamicRatingInfo();
  const formattedAddress = getFormattedAddress();
  const avatarUrl = business.business_profile_image || business.logo_url;

  // Check if current logged-in user already submitted a review for this business
  const existingUserReview = currentUser
    ? reviewsList.find((rev) => rev.user_id === currentUser.id)
    : null;

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
        .eq("business_id", business.id);

      if (!error) {
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase.from("follows").insert([
        {
          user_id: currentUser.id,
          business_id: business.id,
        },
      ]);

      if (!error) {
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    }
    setFollowLoading(false);
  };

  // Handle Leaving a Review (1 per user limit, default 0 stars)
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
        business_id: business.id,
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

  const slidingTabIndex =
    activeNavTab === "reviews" ? 0 : activeNavTab === "contacts" ? 1 : 2;

  return (
    <div className="business-profile-view">
      {/* Back Button Header */}
      <button onClick={onBack} className="detail-back-btn">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Cover Image / Hero Banner */}
      <div className="bp-cover-container">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={business.name}
            className="bp-cover-img"
          />
        ) : (
          <div
            className="bp-cover-placeholder"
            style={{ backgroundColor: business.imageColor || "#B8543A" }}
          >
            <Sparkles size={24} color="#FFF" />
          </div>
        )}

        {/* Floating Logo Overlay */}
        <div className="bp-logo-wrapper">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${business.name} logo`}
              className="bp-logo-img"
            />
          ) : (
            <div className="bp-logo-fallback">
              {business.name ? business.name.charAt(0).toUpperCase() : "Y"}
            </div>
          )}
        </div>
      </div>

      {/* Business Info Header */}
      <div className="bp-header-content">
        <div className="bp-title-row">
          <h2 className="bp-name">{business.name}</h2>
          <span className="spot-rating bp-rating-badge">
            <Star
              size={16}
              fill="var(--accent-color)"
              color="var(--accent-color)"
            />
            {ratingInfo.avg} {ratingInfo.countText}
          </span>
        </div>

        {/* Multi-Category Pills & Live Follow Button Row */}
        <div className="bp-category-follow-row">
          <div className="bp-category-pills">
            {visibleCategories.map((cat, idx) => (
              <span key={idx} className="bp-category-pill">
                {cat}
              </span>
            ))}
            {extraCategoryCount > 0 && (
              <span
                className="bp-category-more"
                title={spotCategories.slice(2).join(", ")}
              >
                +{extraCategoryCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleFollow}
            disabled={followLoading}
            className={`bp-follow-btn ${isFollowing ? "following" : ""}`}
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

        <div className="bp-meta-row">
          <MapPin size={16} color="var(--struct-secondary)" />
          <span>{formattedAddress}</span>
        </div>

        {business.promo && (
          <div className="bp-promo-banner">
            <Tag size={14} color="var(--accent-color)" />
            <span>{business.promo}</span>
          </div>
        )}

        {/* ================= JUSTIFIED IMAGE GALLERY (Establishment Photos Only) ================= */}
        <div className="bp-gallery-section">
          <h4 className="bp-section-label">
            <ImageIcon size={16} color="var(--accent-color)" /> Establishment
            Gallery ({galleryImages.length})
          </h4>

          {galleryImages.length === 0 ? (
            <div className="bp-empty-state">
              <ImageIcon size={30} opacity={0.3} />
              <p>No gallery photos uploaded for this establishment yet.</p>
            </div>
          ) : (
            <div className="bp-justified-gallery">
              {galleryImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className="bp-justified-item"
                  onClick={() => setLightboxImg(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt={`${business.name} gallery ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= SLIDING UNDERLINE NAVIGATION (Reviews | Contacts | About) ================= */}
        <div className="bp-sliding-tabs">
          <button
            type="button"
            className={`bp-sliding-tab ${
              activeNavTab === "reviews" ? "active" : ""
            }`}
            onClick={() => setActiveNavTab("reviews")}
          >
            Reviews ({reviewsList.length})
          </button>
          <button
            type="button"
            className={`bp-sliding-tab ${
              activeNavTab === "contacts" ? "active" : ""
            }`}
            onClick={() => setActiveNavTab("contacts")}
          >
            Contacts
          </button>
          <button
            type="button"
            className={`bp-sliding-tab ${
              activeNavTab === "about" ? "active" : ""
            }`}
            onClick={() => setActiveNavTab("about")}
          >
            About
          </button>
          <div className={`bp-sliding-indicator tab-${slidingTabIndex}`} />
        </div>

        {/* ================= TAB 1: REVIEWS ================= */}
        {activeNavTab === "reviews" && (
          <div className="bp-reviews-wrap">
            {existingUserReview ? (
              <div className="bp-already-reviewed">
                <CheckCircle size={15} color="#10b981" />
                <span>
                  You have already rated & reviewed this spot. Remove your
                  review below if you wish to submit a new one.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                className="bp-review-form-card"
              >
                <div className="bp-star-input-row">
                  <span className="bp-star-label">
                    Your Rating {userRating > 0 ? `(${userRating}★)` : ""}:
                  </span>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() =>
                        // Tap the same star value again to undo back to 0!
                        setUserRating((prev) =>
                          prev === starValue ? 0 : starValue,
                        )
                      }
                      className="bp-star-btn"
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
                  className="bp-review-textarea"
                  placeholder="Share your experience with this business..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                />

                {reviewError && (
                  <div className="bp-error-alert">
                    <AlertCircle size={14} /> <span>{reviewError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="bp-submit-review-btn"
                  disabled={submittingReview}
                >
                  {submittingReview ? "Posting Review..." : "Leave a Review"}
                </button>
              </form>
            )}

            {/* Community Reviews List */}
            {reviewsList.length === 0 ? (
              <div className="bp-empty-state">
                <p>No reviews yet. Be the first to review this business!</p>
              </div>
            ) : (
              reviewsList.map((rev) => {
                const isOwnReview =
                  currentUser && rev.user_id === currentUser.id;

                return (
                  <div key={rev.id} className="bp-review-card">
                    <div className="bp-review-card-header">
                      <span className="bp-review-author">
                        @
                        {rev.profiles?.username ||
                          rev.profiles?.full_name ||
                          "foodlover"}
                      </span>

                      <div className="bp-review-header-right">
                        <div className="bp-review-stars">
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
                            className="bp-delete-review-btn"
                            onClick={() => handleDeleteReview(rev.id)}
                            disabled={deletingReviewId === rev.id}
                          >
                            <Trash2 size={13} />
                            {deletingReviewId === rev.id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="bp-review-comment">{rev.comment}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ================= TAB 2: CONTACTS (Empty Placeholder For Now) ================= */}
        {activeNavTab === "contacts" && <div className="bp-tab-content" />}

        {/* ================= TAB 3: ABOUT (Empty Placeholder For Now) ================= */}
        {activeNavTab === "about" && <div className="bp-tab-content" />}
      </div>

      {/* Fullscreen Lightbox when a Gallery Photo is tapped */}
      {lightboxImg && (
        <div
          className="bp-lightbox-overlay"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            className="bp-lightbox-close"
            onClick={() => setLightboxImg(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImg}
            alt="Gallery preview"
            className="bp-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
