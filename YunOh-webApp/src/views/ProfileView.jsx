import React, { useState, useEffect } from "react";
import {
  User,
  LogOut,
  Ticket,
  Store,
  Star,
  MessageSquare,
  Eye,
  Users,
  ChevronRight,
  Sliders,
  Plus,
  Trash2,
  AlertTriangle,
  Utensils,
  Upload,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./ProfileView.css";

export default function ProfileView({
  session,
  setSession,
  onSignOut,
  onNavigateToLogin,
  onNavigateToRegister,
  onOpenBusinessRegistration,
}) {
  // Mode switch state: 'consumer' ('User') or 'business' ('Business')
  const [userMode, setUserMode] = useState("consumer");

  // User Profile data (username & avatar)
  const [profileData, setProfileData] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [profileSaveMsg, setProfileSaveMsg] = useState("");

  // Consumer Community Data & Active Drawer ('reviews' | 'ratings' | 'vouchers' | 'following' | null)
  const [myReviews, setMyReviews] = useState([]);
  const [myDishRatings, setMyDishRatings] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [myFollowing, setMyFollowing] = useState([]);
  const [activeConsumerBox, setActiveConsumerBox] = useState(null);

  // Account List Expandable Row ('preferences' | 'profile' | null)
  const [activeAccountRow, setActiveAccountRow] = useState(null);

  // Business Mode State
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");

  // Storefront Image File Upload States
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [uploadingStorefront, setUploadingStorefront] = useState(false);

  // Merchant Analytics & Community Details
  const [merchantReviews, setMerchantReviews] = useState([]);
  const [merchantDishRatings, setMerchantDishRatings] = useState([]);
  const [merchantFollowers, setMerchantFollowers] = useState([]);
  const [merchantVisitsCount, setMerchantVisitsCount] = useState(0);
  const [activeMerchantCommRow, setActiveMerchantCommRow] = useState(null);

  // Digital Menu CRUD State (menu_items table)
  const [merchantMenuItems, setMerchantMenuItems] = useState([]);
  const [newDishName, setNewDishName] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishDesc, setNewDishDesc] = useState("");
  const [newDishTag, setNewDishTag] = useState("None");
  const [newDishImageFile, setNewDishImageFile] = useState(null);
  const [newDishImagePreview, setNewDishImagePreview] = useState("");
  const [addingDish, setAddingDish] = useState(false);
  const [menuStatusMsg, setMenuStatusMsg] = useState("");

  // Unregister Business Confirmation State
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [unregisterConfirmText, setUnregisterConfirmText] = useState("");
  const [unregisterLoading, setUnregisterLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchConsumerCommunityData();
      fetchOwnedBusinesses();
    }
  }, [session]);

  // --- HELPER: Upload File to 'yunoh-media' Supabase Storage Bucket ---
  const uploadImageToStorage = async (file, folder = "uploads") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${session.user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("yunoh-media")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("yunoh-media")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // 1. Fetch User Profile (Strictly use username)
  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, email, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (data) {
      setProfileData(data);
      setEditUsername(
        data.username || session.user.email?.split("@")[0] || "user",
      );
    } else {
      const fallbackName = session.user.email?.split("@")[0] || "user";
      setProfileData({ username: fallbackName, avatar_url: null });
      setEditUsername(fallbackName);
    }
  };

  // 2. Fetch Consumer Community Stats & Details
  const fetchConsumerCommunityData = async () => {
    const userId = session.user.id;

    // Reviews written by user
    const { data: revData } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, businesses(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMyReviews(revData || []);

    // Dish ratings given by user (menu_item_ratings)
    const { data: rateData } = await supabase
      .from("menu_item_ratings")
      .select("id, rating, created_at, menu_items(name, price)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMyDishRatings(rateData || []);

    // Claimed Vouchers
    const { data: vouchData } = await supabase
      .from("user_vouchers")
      .select("id, voucher_code, promo_text, claimed_at, businesses(name)")
      .eq("user_id", userId)
      .order("claimed_at", { ascending: false });
    setMyVouchers(vouchData || []);

    // Followed Businesses
    const { data: followData } = await supabase
      .from("follows")
      .select("id, created_at, businesses(id, name, category, barangay)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMyFollowing(followData || []);
  };

  // 3. Fetch Owned Business & Live Merchant Analytics
  const fetchOwnedBusinesses = async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", session.user.id);

    if (!error && data && data.length > 0) {
      setOwnedBusinesses(data);
      const biz = data[0];
      setEditingBusiness(biz);
      setProfileImagePreview(biz.business_profile_image || "");
      setCoverImagePreview(biz.cover_image_url || "");
      fetchMerchantDetails(biz.id);
    } else {
      setOwnedBusinesses([]);
      setEditingBusiness(null);
    }
  };

  const fetchMerchantDetails = async (businessId) => {
    // A. Reviews on this business
    const { data: revs } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(username)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMerchantReviews(revs || []);

    // B. Followers of this business
    const { data: fols } = await supabase
      .from("follows")
      .select("id, created_at, profiles(username, email)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMerchantFollowers(fols || []);

    // C. Profile Visits count (from business_visits)
    const { count: visitCount } = await supabase
      .from("business_visits")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);
    setMerchantVisitsCount(visitCount || 0);

    // D. Menu Items for this business
    const { data: items } = await supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMerchantMenuItems(items || []);

    // E. Menu Item Ratings across all dishes of this business
    if (items && items.length > 0) {
      const itemIds = items.map((i) => i.id);
      const { data: itemRatings } = await supabase
        .from("menu_item_ratings")
        .select("id, rating, created_at, menu_items(name), profiles(username)")
        .in("menu_item_id", itemIds)
        .order("created_at", { ascending: false });
      setMerchantDishRatings(itemRatings || []);
    } else {
      setMerchantDishRatings([]);
    }
  };

  // Update Username in Profile Drawer
  const handleSaveProfileUsername = async (e) => {
    e.preventDefault();
    const cleanUsername = editUsername.trim();
    if (!cleanUsername) return;

    setProfileSaveMsg("Saving...");
    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", session.user.id);

    if (error) {
      setProfileSaveMsg(`Error: ${error.message}`);
    } else {
      setProfileData((prev) => ({ ...prev, username: cleanUsername }));
      setProfileSaveMsg("Username updated!");
      setTimeout(() => setProfileSaveMsg(""), 3000);
    }
  };

  // Update Storefront Assets (Uploads new image files if selected)
  const handleUpdateStorefront = async (e) => {
    e.preventDefault();
    if (!editingBusiness) return;

    setUploadingStorefront(true);
    setUpdateStatus("Uploading & updating storefront...");

    try {
      let updatedProfileImgUrl = editingBusiness.business_profile_image || null;
      let updatedCoverImgUrl = editingBusiness.cover_image_url || null;

      if (profileImageFile) {
        updatedProfileImgUrl = await uploadImageToStorage(
          profileImageFile,
          "storefronts",
        );
      }

      if (coverImageFile) {
        updatedCoverImgUrl = await uploadImageToStorage(
          coverImageFile,
          "storefronts",
        );
      }

      const { error } = await supabase
        .from("businesses")
        .update({
          business_profile_image: updatedProfileImgUrl,
          cover_image_url: updatedCoverImgUrl,
          open_time: editingBusiness.open_time,
          close_time: editingBusiness.close_time,
        })
        .eq("id", editingBusiness.id);

      if (error) {
        setUpdateStatus(`Error: ${error.message}`);
      } else {
        setProfileImageFile(null);
        setCoverImageFile(null);
        setUpdateStatus("Storefront updated successfully!");
        setTimeout(() => setUpdateStatus(""), 3000);
        fetchOwnedBusinesses();
      }
    } catch (err) {
      setUpdateStatus(`Error uploading image: ${err.message}`);
    } finally {
      setUploadingStorefront(false);
    }
  };

  // Add New Dish to menu_items (Uploads dish photo file to 'yunoh-media')
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!editingBusiness || !newDishName.trim() || !newDishPrice) return;

    setAddingDish(true);
    setMenuStatusMsg("Uploading & adding dish...");

    try {
      let uploadedDishUrl = null;
      if (newDishImageFile) {
        uploadedDishUrl = await uploadImageToStorage(
          newDishImageFile,
          "menu-items",
        );
      }

      const { error } = await supabase.from("menu_items").insert([
        {
          business_id: editingBusiness.id,
          name: newDishName.trim(),
          price: parseFloat(newDishPrice),
          description: newDishDesc.trim() || null,
          special_tag: newDishTag,
          image_url: uploadedDishUrl,
        },
      ]);

      if (error) {
        setMenuStatusMsg(`Error: ${error.message}`);
      } else {
        setMenuStatusMsg("Dish added to your digital menu!");
        setNewDishName("");
        setNewDishPrice("");
        setNewDishDesc("");
        setNewDishTag("None");
        setNewDishImageFile(null);
        setNewDishImagePreview("");
        fetchMerchantDetails(editingBusiness.id);
        setTimeout(() => setMenuStatusMsg(""), 3000);
      }
    } catch (err) {
      setMenuStatusMsg(`Error uploading dish photo: ${err.message}`);
    } finally {
      setAddingDish(false);
    }
  };

  // Delete Dish from menu_items
  const handleDeleteMenuItem = async (itemId) => {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId);

    if (!error && editingBusiness) {
      fetchMerchantDetails(editingBusiness.id);
    }
  };

  // Permanently Unregister Business with Verification
  const handleUnregisterBusiness = async () => {
    if (!editingBusiness) return;
    if (
      unregisterConfirmText.trim().toLowerCase() !==
      editingBusiness.name.trim().toLowerCase()
    ) {
      alert("Please type the exact business name to confirm unregistration.");
      return;
    }

    setUnregisterLoading(true);
    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", editingBusiness.id)
      .eq("owner_id", session.user.id);

    setUnregisterLoading(false);

    if (error) {
      alert(`Failed to unregister business: ${error.message}`);
    } else {
      setShowUnregisterConfirm(false);
      setUnregisterConfirmText("");
      setOwnedBusinesses([]);
      setEditingBusiness(null);
    }
  };

  const handleLogout = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  // Calculate dynamic Merchant Rating Score
  const getMerchantRatingScore = () => {
    if (merchantReviews.length === 0) return "0";
    const sum = merchantReviews.reduce(
      (acc, r) => acc + (Number(r.rating) || 0),
      0,
    );
    return (sum / merchantReviews.length).toFixed(1);
  };

  if (!session) {
    return (
      <div className="profile-view">
        <div className="welcome-banner">
          <h3>Your Account 👤</h3>
          <p className="profile-welcome-subtitle">
            Sign in to view your vouchers, manage saved spots, and access
            merchant tools.
          </p>
        </div>

        <div className="profile-logged-out-card">
          <User
            size={48}
            color="var(--text-secondary)"
            className="profile-logged-out-icon"
          />
          <h4 className="profile-logged-out-title">You are not signed in</h4>
          <p className="profile-logged-out-desc">
            Access your digital wallet and personalized local feed.
          </p>
          <div className="profile-logged-out-actions">
            <button
              onClick={onNavigateToLogin}
              className="auth-submit-btn profile-auth-btn"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToRegister}
              className="auth-submit-btn profile-auth-btn secondary"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayUsername =
    profileData?.username || session.user.email?.split("@")[0] || "user";

  return (
    <div className="profile-view">
      {/* 1. Centered Profile Header (Strictly Username, No Full Name) */}
      <div className="profile-centered-header">
        <div className="profile-avatar-circle-lg">
          {profileData?.avatar_url ? (
            <img src={profileData.avatar_url} alt={displayUsername} />
          ) : (
            <User size={38} color="#78716c" />
          )}
        </div>
        <h3 className="profile-username-title">{displayUsername}</h3>
        <p className="profile-location-subtitle">Bayombong, Nueva Vizcaya</p>
      </div>

      {/* 2. Sliding Underline Mode Switcher (User | Business) */}
      <div className="profile-underline-tabs">
        <button
          type="button"
          className={`profile-underline-tab ${
            userMode === "consumer" ? "active" : ""
          }`}
          onClick={() => setUserMode("consumer")}
        >
          User
        </button>
        <button
          type="button"
          className={`profile-underline-tab ${
            userMode === "business" ? "active" : ""
          }`}
          onClick={() => setUserMode("business")}
        >
          Business
        </button>
        <div
          className={`profile-tab-indicator ${
            userMode === "business" ? "right" : ""
          }`}
        />
      </div>

      {/* ================= USER (CONSUMER) MODE ================= */}
      {userMode === "consumer" && (
        <>
          {/* Warm Tinted Community Card (2x2 Grid) */}
          <div className="profile-tinted-section">
            <h4 className="profile-tinted-heading">Community</h4>

            <div className="profile-stats-grid-2x2">
              {/* Box 1: Reviews */}
              <div
                className={`profile-stat-white-box ${
                  activeConsumerBox === "reviews" ? "active-box" : ""
                }`}
                onClick={() =>
                  setActiveConsumerBox(
                    activeConsumerBox === "reviews" ? null : "reviews",
                  )
                }
              >
                <div className="profile-stat-label-row">
                  <span>Reviews</span>
                  <Star size={15} fill="#F59E0B" color="#F59E0B" />
                </div>
                <div className="profile-stat-number">{myReviews.length}</div>
              </div>

              {/* Box 2: Ratings (Menu Item Ratings) */}
              <div
                className={`profile-stat-white-box ${
                  activeConsumerBox === "ratings" ? "active-box" : ""
                }`}
                onClick={() =>
                  setActiveConsumerBox(
                    activeConsumerBox === "ratings" ? null : "ratings",
                  )
                }
              >
                <div className="profile-stat-label-row">
                  <Star size={15} color="var(--accent-color)" />
                  <span>Food Ratings</span>
                </div>
                <div className="profile-stat-number">
                  {myDishRatings.length}
                </div>
              </div>

              {/* Box 3: Vouchers */}
              <div
                className={`profile-stat-white-box ${
                  activeConsumerBox === "vouchers" ? "active-box" : ""
                }`}
                onClick={() =>
                  setActiveConsumerBox(
                    activeConsumerBox === "vouchers" ? null : "vouchers",
                  )
                }
              >
                <div className="profile-stat-label-row">
                  <Ticket size={15} color="var(--accent-color)" />
                  <span>Vouchers</span>
                </div>
                <div className="profile-stat-number">{myVouchers.length}</div>
              </div>

              {/* Box 4: Following */}
              <div
                className={`profile-stat-white-box ${
                  activeConsumerBox === "following" ? "active-box" : ""
                }`}
                onClick={() =>
                  setActiveConsumerBox(
                    activeConsumerBox === "following" ? null : "following",
                  )
                }
              >
                <div className="profile-stat-label-row">
                  <Users size={15} color="var(--accent-color)" />
                  <span>Following</span>
                </div>
                <div className="profile-stat-number">{myFollowing.length}</div>
              </div>
            </div>

            {/* Expandable Drawer when a Community Box is tapped */}
            {activeConsumerBox === "reviews" && (
              <div className="profile-drawer-panel">
                <div className="profile-drawer-header">
                  <span>My Establishment Reviews</span>
                  <span>{myReviews.length} total</span>
                </div>
                {myReviews.length === 0 ? (
                  <p className="profile-drawer-empty">
                    You haven't written any reviews yet.
                  </p>
                ) : (
                  myReviews.map((rev) => (
                    <div key={rev.id} className="profile-drawer-item">
                      <div className="profile-drawer-item-title">
                        <span>{rev.businesses?.name || "Establishment"}</span>
                        <span>{rev.rating} ⭐</span>
                      </div>
                      <div className="profile-drawer-item-sub">
                        "{rev.comment}"
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeConsumerBox === "ratings" && (
              <div className="profile-drawer-panel">
                <div className="profile-drawer-header">
                  <span>My Dish Ratings</span>
                  <span>{myDishRatings.length} total</span>
                </div>
                {myDishRatings.length === 0 ? (
                  <p className="profile-drawer-empty">
                    You haven't rated any menu items yet.
                  </p>
                ) : (
                  myDishRatings.map((rt) => (
                    <div key={rt.id} className="profile-drawer-item">
                      <div className="profile-drawer-item-title">
                        <span>{rt.menu_items?.name || "Menu Dish"}</span>
                        <span>{rt.rating} ⭐</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeConsumerBox === "vouchers" && (
              <div className="profile-drawer-panel">
                <div className="profile-drawer-header">
                  <span>My Claimed Vouchers Wallet</span>
                  <span>{myVouchers.length} active</span>
                </div>
                {myVouchers.length === 0 ? (
                  <p className="profile-drawer-empty">
                    No vouchers claimed yet.
                  </p>
                ) : (
                  myVouchers.map((v) => (
                    <div key={v.id} className="profile-drawer-item">
                      <div className="profile-drawer-item-title">
                        <span>{v.businesses?.name || "Local Spot"}</span>
                      </div>
                      <div className="profile-drawer-item-sub">
                        {v.promo_text}
                      </div>
                      <span className="profile-voucher-code-pill">
                        {v.voucher_code}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeConsumerBox === "following" && (
              <div className="profile-drawer-panel">
                <div className="profile-drawer-header">
                  <span>Establishments You Follow</span>
                  <span>{myFollowing.length} spots</span>
                </div>
                {myFollowing.length === 0 ? (
                  <p className="profile-drawer-empty">
                    You are not following any establishments yet.
                  </p>
                ) : (
                  myFollowing.map((f) => (
                    <div key={f.id} className="profile-drawer-item">
                      <div className="profile-drawer-item-title">
                        <span>{f.businesses?.name || "Establishment"}</span>
                      </div>
                      <div className="profile-drawer-item-sub">
                        {f.businesses?.category} • Brgy.{" "}
                        {f.businesses?.barangay || "Bayombong"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= BUSINESS MODE ================= */}
      {userMode === "business" && (
        <>
          {ownedBusinesses.length === 0 ? (
            <div className="profile-tinted-section">
              <h4 className="profile-tinted-heading centered">
                Merchant Analytics & Storefront
              </h4>
              <div className="profile-drawer-panel">
                <p className="profile-drawer-empty">
                  You do not own a registered business yet. Register your
                  establishment to unlock analytics and digital menu tools!
                </p>
                <button
                  type="button"
                  onClick={onOpenBusinessRegistration}
                  className="auth-submit-btn"
                >
                  Register Business Now 🏢
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Merchant Analytics & Storefront Tinted 2x2 Card */}
              <div className="profile-tinted-section">
                <h4 className="profile-tinted-heading centered">
                  Merchant Analytics & Storefront
                </h4>

                <div className="profile-stats-grid-2x2">
                  <div className="profile-stat-white-box">
                    <div className="profile-stat-label-row">Rating Score</div>
                    <div className="profile-stat-paren-value">
                      ({getMerchantRatingScore()}{" "}
                      <Star size={14} fill="#F59E0B" color="#F59E0B" />)
                    </div>
                  </div>

                  <div className="profile-stat-white-box">
                    <div className="profile-stat-label-row">Total Reviews</div>
                    <div className="profile-stat-paren-value">
                      ({merchantReviews.length} <MessageSquare size={14} />)
                    </div>
                  </div>

                  <div className="profile-stat-white-box">
                    <div className="profile-stat-label-row">Profile Visits</div>
                    <div className="profile-stat-paren-value">
                      ({merchantVisitsCount} <Eye size={14} />)
                    </div>
                  </div>

                  <div className="profile-stat-white-box">
                    <div className="profile-stat-label-row">Followers</div>
                    <div className="profile-stat-paren-value">
                      ({merchantFollowers.length} <Users size={14} />)
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Business Community List Card (Reviews, Ratings, Followers Details) */}
              <div className="profile-list-card">
                <div className="profile-list-card-header">Community</div>

                {/* Row 1: Reviews Details */}
                <div
                  className="profile-list-row"
                  onClick={() =>
                    setActiveMerchantCommRow(
                      activeMerchantCommRow === "reviews" ? null : "reviews",
                    )
                  }
                >
                  <div className="profile-list-row-left">
                    <MessageSquare size={18} />
                    <span>Reviews ({merchantReviews.length})</span>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    className={
                      activeMerchantCommRow === "reviews"
                        ? "chevron-rotated"
                        : ""
                    }
                  />
                </div>
                {activeMerchantCommRow === "reviews" && (
                  <div className="profile-list-drawer">
                    {merchantReviews.length === 0 ? (
                      <p className="profile-drawer-empty">
                        No customer reviews for your business yet.
                      </p>
                    ) : (
                      merchantReviews.map((rev) => (
                        <div key={rev.id} className="profile-drawer-item">
                          <div className="profile-drawer-item-title">
                            <span>@{rev.profiles?.username || "consumer"}</span>
                            <span>{rev.rating} ⭐</span>
                          </div>
                          <div className="profile-drawer-item-sub">
                            "{rev.comment}"
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Row 2: Dish Ratings Details */}
                <div
                  className="profile-list-row"
                  onClick={() =>
                    setActiveMerchantCommRow(
                      activeMerchantCommRow === "ratings" ? null : "ratings",
                    )
                  }
                >
                  <div className="profile-list-row-left">
                    <Star size={18} />
                    <span>Ratings ({merchantDishRatings.length})</span>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    className={
                      activeMerchantCommRow === "ratings"
                        ? "chevron-rotated"
                        : ""
                    }
                  />
                </div>
                {activeMerchantCommRow === "ratings" && (
                  <div className="profile-list-drawer">
                    {merchantDishRatings.length === 0 ? (
                      <p className="profile-drawer-empty">
                        No dish ratings received on your menu items yet.
                      </p>
                    ) : (
                      merchantDishRatings.map((rt) => (
                        <div key={rt.id} className="profile-drawer-item">
                          <div className="profile-drawer-item-title">
                            <span>{rt.menu_items?.name || "Dish"}</span>
                            <span>{rt.rating} ⭐</span>
                          </div>
                          <div className="profile-drawer-item-sub">
                            Rated by @{rt.profiles?.username || "consumer"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Row 3: Followers Details */}
                <div
                  className="profile-list-row"
                  onClick={() =>
                    setActiveMerchantCommRow(
                      activeMerchantCommRow === "followers"
                        ? null
                        : "followers",
                    )
                  }
                >
                  <div className="profile-list-row-left">
                    <Users size={18} />
                    <span>Followers ({merchantFollowers.length})</span>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    className={
                      activeMerchantCommRow === "followers"
                        ? "chevron-rotated"
                        : ""
                    }
                  />
                </div>
                {activeMerchantCommRow === "followers" && (
                  <div className="profile-list-drawer">
                    {merchantFollowers.length === 0 ? (
                      <p className="profile-drawer-empty">No followers yet.</p>
                    ) : (
                      merchantFollowers.map((fol) => (
                        <div key={fol.id} className="profile-drawer-item">
                          <div className="profile-drawer-item-title">
                            <span>@{fol.profiles?.username || "follower"}</span>
                            <span>Following</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 3. Digital Menu Manager (menu_items CRUD with Direct Image Upload) */}
              <div className="merchant-manager-card">
                <h5 className="merchant-manager-title">
                  <span>
                    <Utensils size={15} /> Menu Manager (
                    {merchantMenuItems.length})
                  </span>
                </h5>

                {menuStatusMsg && (
                  <div
                    className={`merchant-status-msg ${
                      menuStatusMsg.includes("Error") ? "error" : "success"
                    }`}
                  >
                    {menuStatusMsg}
                  </div>
                )}

                <form
                  onSubmit={handleAddMenuItem}
                  className="merchant-form-stack"
                >
                  <div className="merchant-row-2col">
                    <div className="merchant-input-group">
                      <label>Dish Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Pancit Batil Patong"
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        required
                        className="merchant-text-input"
                      />
                    </div>
                    <div className="merchant-input-group">
                      <label>Price (₱) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="135.00"
                        value={newDishPrice}
                        onChange={(e) => setNewDishPrice(e.target.value)}
                        required
                        className="merchant-text-input"
                      />
                    </div>
                  </div>

                  <div className="merchant-row-2col">
                    <div className="merchant-input-group">
                      <label>Special Tag</label>
                      <select
                        value={newDishTag}
                        onChange={(e) => setNewDishTag(e.target.value)}
                        className="merchant-select-input"
                      >
                        <option value="None">None</option>
                        <option value="Best Seller">Best Seller</option>
                        <option value="New Arrivals">New Arrivals</option>
                        <option value="Special Offer">Special Offer</option>
                      </select>
                    </div>

                    <div className="merchant-input-group">
                      <label>Dish Photo</label>
                      <div className="merchant-file-upload-row">
                        <label className="merchant-file-label-btn">
                          <Upload size={14} />
                          <span>
                            {newDishImageFile ? "Change Photo" : "Upload Photo"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="merchant-file-input-hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewDishImageFile(file);
                                setNewDishImagePreview(
                                  URL.createObjectURL(file),
                                );
                              }
                            }}
                          />
                        </label>
                        {newDishImagePreview && (
                          <image_url
                            alt="Dish preview"
                            className="merchant-upload-preview-thumb"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="merchant-input-group">
                    <label>Description / Ingredients</label>
                    <input
                      type="text"
                      placeholder="Short description of the dish..."
                      value={newDishDesc}
                      onChange={(e) => setNewDishDesc(e.target.value)}
                      className="merchant-text-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={addingDish}
                  >
                    <Plus size={15} />{" "}
                    {addingDish ? "Uploading Dish..." : "Add Dish to Menu"}
                  </button>
                </form>

                {merchantMenuItems.length > 0 && (
                  <div className="merchant-menu-list">
                    {merchantMenuItems.map((item) => (
                      <div key={item.id} className="merchant-menu-item-row">
                        <div className="merchant-menu-item-info">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="merchant-menu-thumb"
                            />
                          )}
                          <div className="merchant-menu-text">
                            <div className="merchant-menu-name">
                              {item.name}
                            </div>
                            <div className="merchant-menu-meta">
                              ₱{Number(item.price).toFixed(2)} •{" "}
                              {item.special_tag}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="merchant-icon-btn"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          title="Delete Dish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Storefront Settings Form (Direct Image File Uploads) */}
              <div className="merchant-manager-card">
                <h5 className="merchant-manager-title">
                  <span>
                    <Store size={15} /> Storefront Settings (
                    {editingBusiness?.name})
                  </span>
                </h5>

                {updateStatus && (
                  <div
                    className={`merchant-status-msg ${
                      updateStatus.includes("Error") ? "error" : "success"
                    }`}
                  >
                    {updateStatus}
                  </div>
                )}

                <form
                  onSubmit={handleUpdateStorefront}
                  className="merchant-form-stack"
                >
                  <div className="merchant-input-group">
                    <label>Business Profile Image (Avatar)</label>
                    <div className="merchant-file-upload-row">
                      <label className="merchant-file-label-btn">
                        <Upload size={14} />
                        <span>
                          {profileImageFile
                            ? profileImageFile.name
                            : "Upload Profile Image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="merchant-file-input-hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setProfileImageFile(file);
                              setProfileImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      {/* {profileImagePreview && (
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="merchant-upload-preview-thumb"
                        />
                      )} */}
                    </div>
                  </div>

                  <div className="merchant-input-group">
                    <label>Cover Banner Photo</label>
                    <div className="merchant-file-upload-row">
                      <label className="merchant-file-label-btn">
                        <Upload size={14} />
                        <span>
                          {coverImageFile
                            ? coverImageFile.name
                            : "Upload Cover Banner"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="merchant-file-input-hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCoverImageFile(file);
                              setCoverImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      {/* {coverImagePreview && (
                        <img
                          src={coverImagePreview}
                          alt="Cover preview"
                          className="merchant-upload-preview-banner"
                        />
                      )} */}
                    </div>
                  </div>

                  <div className="merchant-row-2col">
                    <div className="merchant-input-group">
                      <label>Opening Time</label>
                      <input
                        type="time"
                        value={editingBusiness?.open_time || "08:00"}
                        onChange={(e) =>
                          setEditingBusiness({
                            ...editingBusiness,
                            open_time: e.target.value,
                          })
                        }
                        className="merchant-text-input"
                      />
                    </div>
                    <div className="merchant-input-group">
                      <label>Closing Time</label>
                      <input
                        type="time"
                        value={editingBusiness?.close_time || "21:00"}
                        onChange={(e) =>
                          setEditingBusiness({
                            ...editingBusiness,
                            close_time: e.target.value,
                          })
                        }
                        className="merchant-text-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={uploadingStorefront}
                  >
                    {uploadingStorefront
                      ? "Uploading & Saving..."
                      : "Save Storefront Changes"}
                  </button>
                </form>
              </div>

              {/* 5. Unregister Business (With Warning & Verification) */}
              <div className="unregister-danger-card">
                <h5 className="unregister-danger-title">
                  <AlertTriangle size={15} /> Unregister Business
                </h5>
                <p className="unregister-danger-desc">
                  Unregistering permanently removes your business storefront,
                  menu items, and analytics from YunOh.
                </p>

                {!showUnregisterConfirm ? (
                  <button
                    type="button"
                    className="unregister-btn-outline"
                    onClick={() => setShowUnregisterConfirm(true)}
                  >
                    Unregister Establishment
                  </button>
                ) : (
                  <div className="merchant-form-stack">
                    <div className="merchant-input-group">
                      <label>
                        Type <strong>{editingBusiness?.name}</strong> to
                        confirm:
                      </label>
                      <input
                        type="text"
                        value={unregisterConfirmText}
                        onChange={(e) =>
                          setUnregisterConfirmText(e.target.value)
                        }
                        placeholder={editingBusiness?.name}
                        className="merchant-text-input"
                      />
                    </div>
                    <div className="unregister-confirm-actions">
                      <button
                        type="button"
                        className="unregister-confirm-btn"
                        onClick={handleUnregisterBusiness}
                        disabled={unregisterLoading}
                      >
                        {unregisterLoading
                          ? "Removing..."
                          : "Confirm Unregister"}
                      </button>
                      <button
                        type="button"
                        className="unregister-cancel-btn"
                        onClick={() => {
                          setShowUnregisterConfirm(false);
                          setUnregisterConfirmText("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ================= SHARED ACCOUNT SECTION (Preferences & Profile Only) ================= */}
      <h4 className="profile-section-heading">Account</h4>
      <div className="profile-list-card">
        {/* Row 1: Preferences */}
        <div
          className="profile-list-row"
          onClick={() =>
            setActiveAccountRow(
              activeAccountRow === "preferences" ? null : "preferences",
            )
          }
        >
          <div className="profile-list-row-left">
            <Sliders size={18} />
            <span>Preferences</span>
          </div>
          <ChevronRight
            size={16}
            color="var(--text-secondary)"
            className={
              activeAccountRow === "preferences" ? "chevron-rotated" : ""
            }
          />
        </div>
        {activeAccountRow === "preferences" && (
          <div className="profile-list-drawer">
            <div className="profile-drawer-item">
              <div className="profile-drawer-item-title">
                <span>Default Town Discovery</span>
                <span>Bayombong, NV</span>
              </div>
              <div className="profile-drawer-item-sub">
                GPS distance calculation and barangay filters are active.
              </div>
            </div>
          </div>
        )}

        {/* Row 2: Profile */}
        <div
          className="profile-list-row"
          onClick={() =>
            setActiveAccountRow(
              activeAccountRow === "profile" ? null : "profile",
            )
          }
        >
          <div className="profile-list-row-left">
            <User size={18} />
            <span>Profile</span>
          </div>
          <ChevronRight
            size={16}
            color="var(--text-secondary)"
            className={activeAccountRow === "profile" ? "chevron-rotated" : ""}
          />
        </div>
        {activeAccountRow === "profile" && (
          <div className="profile-list-drawer">
            <form
              onSubmit={handleSaveProfileUsername}
              className="merchant-form-stack"
            >
              <div className="merchant-input-group">
                <label>Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="merchant-text-input"
                />
              </div>
              <div className="merchant-input-group">
                <label>Email Address</label>
                <input
                  type="text"
                  value={session.user.email}
                  disabled
                  className="merchant-text-input"
                />
              </div>
              {profileSaveMsg && (
                <div className="merchant-status-msg success">
                  {profileSaveMsg}
                </div>
              )}
              <button type="submit" className="auth-submit-btn">
                Save Username
              </button>
            </form>

            <button
              type="button"
              onClick={handleLogout}
              className="unregister-btn-outline"
            >
              <LogOut size={14} /> Sign Out of YunOh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
