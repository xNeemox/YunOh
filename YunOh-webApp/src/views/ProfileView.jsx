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
  Image as ImageIcon,
  Edit3,
  Clock,
  X,
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

  // Collapsible Dropdown State for "Business Settings" ('menu' | 'storefront' | 'gallery' | null)
  const [activeBizSettingRow, setActiveBizSettingRow] = useState(null);

  // Storefront Image File Upload States
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [uploadingStorefront, setUploadingStorefront] = useState(false);

  // Gallery Management State (Upload / Remove photos from businesses.gallery_images)
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryStatusMsg, setGalleryStatusMsg] = useState("");

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

  // Inline Edit Dish Toggle State
  const [editingDishId, setEditingDishId] = useState(null);
  const [editDishForm, setEditDishForm] = useState({
    name: "",
    price: "",
    description: "",
    special_tag: "None",
    image_url: "",
  });
  const [editDishImageFile, setEditDishImageFile] = useState(null);
  const [editDishImagePreview, setEditDishImagePreview] = useState("");
  const [savingDishEdit, setSavingDishEdit] = useState(false);

  // Unregister Business Confirmation State
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [unregisterConfirmText, setUnregisterConfirmText] = useState("");
  const [unregisterLoading, setUnregisterLoading] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approvalFeedbackMsg, setApprovalFeedbackMsg] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawingApp, setWithdrawingApp] = useState(false);

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
    const fileName = `${folder}/${session.user.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.${fileExt}`;

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

    const { data: revData } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, businesses(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMyReviews(revData || []);

    const { data: rateData } = await supabase
      .from("menu_item_ratings")
      .select("id, rating, created_at, menu_items(name, price)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMyDishRatings(rateData || []);

    const { data: vouchData } = await supabase
      .from("user_vouchers")
      .select("id, voucher_code, promo_text, claimed_at, businesses(name)")
      .eq("user_id", userId)
      .order("claimed_at", { ascending: false });
    setMyVouchers(vouchData || []);

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
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setOwnedBusinesses(data);
      const biz = data[0];
      setEditingBusiness(biz);
      setProfileImagePreview(biz.business_profile_image || "");
      setCoverImagePreview(biz.cover_image_url || "");
      if (biz.is_verified) {
        fetchMerchantDetails(biz.id);
      }
    } else {
      setOwnedBusinesses([]);
      setEditingBusiness(null);
    }
  };

  const handleCheckApprovalStatus = async () => {
    setCheckingApproval(true);
    setApprovalFeedbackMsg("Checking live approval status from Supabase...");

    const latestBiz = await fetchOwnedBusinesses();
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setCheckingApproval(false);

    if (!latestBiz) {
      setApprovalFeedbackMsg("No active business registration found.");
    } else if (latestBiz.is_verified) {
      setApprovalFeedbackMsg("Approved! Unlocking your merchant tools...");
    } else {
      setApprovalFeedbackMsg(
        `Still pending Admin review (Last checked at ${timeStr}).`,
      );
    }
  };

  const fetchMerchantDetails = async (businessId) => {
    const { data: revs } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(username)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMerchantReviews(revs || []);

    const { data: fols } = await supabase
      .from("follows")
      .select("id, created_at, profiles(username, email)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMerchantFollowers(fols || []);

    const { count: visitCount } = await supabase
      .from("business_visits")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);
    setMerchantVisitsCount(visitCount || 0);

    const { data: items } = await supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMerchantMenuItems(items || []);

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

  // Withdraw Pending Application (If still unverified)
  const handleWithdrawPendingApplication = async () => {
    if (!session?.user?.id) return;
    setWithdrawingApp(true);

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("owner_id", session.user.id);

    setWithdrawingApp(false);

    if (error) {
      setApprovalFeedbackMsg(`Error withdrawing: ${error.message}`);
    } else {
      setShowWithdrawConfirm(false);
      setApprovalFeedbackMsg("");
      setOwnedBusinesses([]);
      setEditingBusiness(null);
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

  // Update Storefront Settings
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
          promo: editingBusiness.promo || null,
          description: editingBusiness.description || null,
          contact_number: editingBusiness.contact_number || null,
        })
        .eq("id", editingBusiness.id);

      if (error) {
        setUpdateStatus(`Error: ${error.message}`);
      } else {
        setProfileImageFile(null);
        setCoverImageFile(null);
        setUpdateStatus("Storefront settings updated!");
        setTimeout(() => setUpdateStatus(""), 3000);
        fetchOwnedBusinesses();
      }
    } catch (err) {
      setUpdateStatus(`Error uploading image: ${err.message}`);
    } finally {
      setUploadingStorefront(false);
    }
  };

  // Add New Dish to menu_items
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

  // Start Editing an Existing Dish Inline
  const handleStartEditDish = (item) => {
    if (editingDishId === item.id) {
      setEditingDishId(null);
      return;
    }
    setEditingDishId(item.id);
    setEditDishForm({
      name: item.name || "",
      price: item.price || "",
      description: item.description || "",
      special_tag: item.special_tag || "None",
      image_url: item.image_url || "",
    });
    setEditDishImageFile(null);
    setEditDishImagePreview(item.image_url || "");
  };

  // Save Edited Dish to menu_items
  const handleSaveEditDish = async (itemId) => {
    if (!editDishForm.name.trim() || editDishForm.price === "") return;
    setSavingDishEdit(true);

    try {
      let finalImageUrl = editDishForm.image_url || null;
      if (editDishImageFile) {
        finalImageUrl = await uploadImageToStorage(
          editDishImageFile,
          "menu-items",
        );
      }

      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editDishForm.name.trim(),
          price: parseFloat(editDishForm.price),
          description: editDishForm.description.trim() || null,
          special_tag: editDishForm.special_tag,
          image_url: finalImageUrl,
        })
        .eq("id", itemId);

      if (error) {
        setMenuStatusMsg(`Error updating dish: ${error.message}`);
      } else {
        setEditingDishId(null);
        setEditDishImageFile(null);
        setMenuStatusMsg("Dish updated successfully!");
        fetchMerchantDetails(editingBusiness.id);
        setTimeout(() => setMenuStatusMsg(""), 3000);
      }
    } catch (err) {
      setMenuStatusMsg(`Error uploading dish photo: ${err.message}`);
    } finally {
      setSavingDishEdit(false);
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

  // Upload New Photos to Establishment Gallery
  const handleUploadGalleryPhotos = async (e) => {
    e.preventDefault();
    if (!editingBusiness || newGalleryFiles.length === 0) return;

    setGalleryUploading(true);
    setGalleryStatusMsg("Uploading photos to gallery...");

    try {
      const uploadedUrls = [];
      for (const file of newGalleryFiles) {
        const url = await uploadImageToStorage(file, "gallery");
        uploadedUrls.push(url);
      }

      const existingGallery = Array.isArray(editingBusiness.gallery_images)
        ? editingBusiness.gallery_images.filter(Boolean)
        : [];
      const updatedGallery = [...existingGallery, ...uploadedUrls];

      const { error } = await supabase
        .from("businesses")
        .update({ gallery_images: updatedGallery })
        .eq("id", editingBusiness.id);

      if (error) {
        setGalleryStatusMsg(`Error: ${error.message}`);
      } else {
        setNewGalleryFiles([]);
        setEditingBusiness((prev) => ({
          ...prev,
          gallery_images: updatedGallery,
        }));
        setGalleryStatusMsg("Gallery photos added!");
        setTimeout(() => setGalleryStatusMsg(""), 3000);
      }
    } catch (err) {
      setGalleryStatusMsg(`Error uploading gallery photos: ${err.message}`);
    } finally {
      setGalleryUploading(false);
    }
  };

  // Remove Photo from Establishment Gallery
  const handleRemoveGalleryPhoto = async (photoUrlToRemove) => {
    if (!editingBusiness) return;

    const currentGallery = Array.isArray(editingBusiness.gallery_images)
      ? editingBusiness.gallery_images.filter(Boolean)
      : [];
    const updatedGallery = currentGallery.filter(
      (url) => url !== photoUrlToRemove,
    );

    const { error } = await supabase
      .from("businesses")
      .update({ gallery_images: updatedGallery })
      .eq("id", editingBusiness.id);

    if (!error) {
      setEditingBusiness((prev) => ({
        ...prev,
        gallery_images: updatedGallery,
      }));
      setGalleryStatusMsg("Photo removed from gallery.");
      setTimeout(() => setGalleryStatusMsg(""), 2500);
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

  const currentGalleryList = Array.isArray(editingBusiness?.gallery_images)
    ? editingBusiness.gallery_images.filter(Boolean)
    : [];

  return (
    <div className="profile-view">
      {/* 1. Centered Profile Header (Strictly Username) */}
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
          <div className="profile-tinted-section">
            <h4 className="profile-tinted-heading">Community</h4>

            <div className="profile-stats-grid-2x2">
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
                  <span>Ratings</span>
                </div>
                <div className="profile-stat-number">
                  {myDishRatings.length}
                </div>
              </div>

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
            /* STATE 1: No Business Registered Yet */
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
          ) : !editingBusiness?.is_verified ? (
            /* STATE 2: Business Registered, Pending Admin Approval (is_verified === false) */
            <div className="merchant-pending-card">
              <span className="merchant-pending-badge">
                <Clock size={14} /> Pending Admin Verification
              </span>

              <h4 className="merchant-pending-title">{editingBusiness.name}</h4>

              <p className="merchant-pending-sub">
                Your business registration and uploaded credentials have been
                submitted! It is currently hidden from the public feed until a
                YunOh Admin reviews and verifies your application.
              </p>

              <div className="merchant-pending-meta">
                <div>
                  <strong>Category:</strong> {editingBusiness.category}
                </div>
                <div>
                  <strong>Address:</strong>{" "}
                  {editingBusiness.address ||
                    `Brgy. ${editingBusiness.barangay}, Bayombong`}
                </div>
                <div>
                  <strong>Coordinates:</strong> {editingBusiness.latitude},{" "}
                  {editingBusiness.longitude}
                </div>
                <div>
                  <strong>Credentials Attached:</strong>{" "}
                  {Array.isArray(editingBusiness.credentials_images)
                    ? editingBusiness.credentials_images.length
                    : 0}{" "}
                  files
                </div>
              </div>

              {approvalFeedbackMsg && (
                <div
                  className={`merchant-approval-feedback ${
                    editingBusiness.is_verified ? "approved" : ""
                  }`}
                >
                  {approvalFeedbackMsg}
                </div>
              )}

              {!showWithdrawConfirm ? (
                <div className="merchant-pending-actions">
                  <button
                    type="button"
                    onClick={handleCheckApprovalStatus}
                    disabled={checkingApproval}
                    className="merchant-refresh-status-btn"
                  >
                    {checkingApproval
                      ? "Checking Status..."
                      : "Check Approval Status"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="merchant-cancel-app-btn"
                  >
                    Withdraw
                  </button>
                </div>
              ) : (
                <div className="merchant-withdraw-confirm-box">
                  <p className="merchant-withdraw-confirm-text">
                    Withdraw "{editingBusiness.name}" and delete its pending
                    registration?
                  </p>
                  <div className="merchant-pending-actions">
                    <button
                      type="button"
                      onClick={handleWithdrawPendingApplication}
                      disabled={withdrawingApp}
                      className="unregister-confirm-btn"
                    >
                      {withdrawingApp ? "Withdrawing..." : "Yes, Withdraw Now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawConfirm(false)}
                      className="unregister-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STATE 3: Admin Approved & Verified (is_verified === true) */
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

              {/* 2. Business Community List Card */}
              <div className="profile-list-card">
                <div className="profile-list-card-header">Community</div>

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

              {/* 3. BUSINESS SETTINGS DROPDOWN CARD */}
              <div className="profile-list-card">
                <div className="profile-list-card-header">
                  Business Settings
                </div>

                {/* Dropdown 1: Digital Menu Manager */}
                <div
                  className="profile-list-row"
                  onClick={() =>
                    setActiveBizSettingRow(
                      activeBizSettingRow === "menu" ? null : "menu",
                    )
                  }
                >
                  <div className="profile-list-row-left">
                    <Utensils size={18} />
                    <span>
                      Digital Menu Manager ({merchantMenuItems.length})
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    className={
                      activeBizSettingRow === "menu" ? "chevron-rotated" : ""
                    }
                  />
                </div>

                {activeBizSettingRow === "menu" && (
                  <div className="profile-list-drawer">
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
                                {newDishImageFile
                                  ? "Change Photo"
                                  : "Upload Photo"}
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
                              <img
                                src={newDishImagePreview}
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
                          <div key={item.id}>
                            <div className="merchant-menu-item-row">
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

                              <div className="merchant-item-actions">
                                <button
                                  type="button"
                                  className="merchant-icon-btn edit"
                                  onClick={() => handleStartEditDish(item)}
                                  title="Edit Dish"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="merchant-icon-btn"
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  title="Delete Dish"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {editingDishId === item.id && (
                              <div className="merchant-edit-dish-box">
                                <div className="merchant-row-2col">
                                  <div className="merchant-input-group">
                                    <label>Dish Name</label>
                                    <input
                                      type="text"
                                      value={editDishForm.name}
                                      onChange={(e) =>
                                        setEditDishForm({
                                          ...editDishForm,
                                          name: e.target.value,
                                        })
                                      }
                                      className="merchant-text-input"
                                    />
                                  </div>
                                  <div className="merchant-input-group">
                                    <label>Price (₱)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editDishForm.price}
                                      onChange={(e) =>
                                        setEditDishForm({
                                          ...editDishForm,
                                          price: e.target.value,
                                        })
                                      }
                                      className="merchant-text-input"
                                    />
                                  </div>
                                </div>

                                <div className="merchant-row-2col">
                                  <div className="merchant-input-group">
                                    <label>Special Tag</label>
                                    <select
                                      value={editDishForm.special_tag}
                                      onChange={(e) =>
                                        setEditDishForm({
                                          ...editDishForm,
                                          special_tag: e.target.value,
                                        })
                                      }
                                      className="merchant-select-input"
                                    >
                                      <option value="None">None</option>
                                      <option value="Best Seller">
                                        Best Seller
                                      </option>
                                      <option value="New Arrivals">
                                        New Arrivals
                                      </option>
                                      <option value="Special Offer">
                                        Special Offer
                                      </option>
                                    </select>
                                  </div>

                                  <div className="merchant-input-group">
                                    <label>Replace Photo</label>
                                    <div className="merchant-file-upload-row">
                                      <label className="merchant-file-label-btn">
                                        <Upload size={13} />
                                        <span>
                                          {editDishImageFile
                                            ? "Selected"
                                            : "New Photo"}
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="merchant-file-input-hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              setEditDishImageFile(file);
                                              setEditDishImagePreview(
                                                URL.createObjectURL(file),
                                              );
                                            }
                                          }}
                                        />
                                      </label>
                                      {editDishImagePreview && (
                                        <img
                                          src={editDishImagePreview}
                                          alt="Edit dish preview"
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
                                    value={editDishForm.description}
                                    onChange={(e) =>
                                      setEditDishForm({
                                        ...editDishForm,
                                        description: e.target.value,
                                      })
                                    }
                                    className="merchant-text-input"
                                  />
                                </div>

                                <div className="merchant-edit-actions">
                                  <button
                                    type="button"
                                    className="merchant-save-sm-btn"
                                    disabled={savingDishEdit}
                                    onClick={() => handleSaveEditDish(item.id)}
                                  >
                                    {savingDishEdit
                                      ? "Saving..."
                                      : "Save Dish Changes"}
                                  </button>
                                  <button
                                    type="button"
                                    className="merchant-cancel-sm-btn"
                                    onClick={() => setEditingDishId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dropdown 2: Storefront Settings */}
                <div
                  className="profile-list-row"
                  onClick={() =>
                    setActiveBizSettingRow(
                      activeBizSettingRow === "storefront"
                        ? null
                        : "storefront",
                    )
                  }
                >
                  <div className="profile-list-row-left">
                    <Store size={18} />
                    <span>Storefront Settings</span>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    className={
                      activeBizSettingRow === "storefront"
                        ? "chevron-rotated"
                        : ""
                    }
                  />
                </div>

                {activeBizSettingRow === "storefront" && (
                  <div className="profile-list-drawer">
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
                                  setProfileImagePreview(
                                    URL.createObjectURL(file),
                                  );
                                }
                              }}
                            />
                          </label>
                          {profileImagePreview && (
                            <img
                              src={profileImagePreview}
                              alt="Profile preview"
                              className="merchant-upload-preview-thumb"
                            />
                          )}
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
                                  setCoverImagePreview(
                                    URL.createObjectURL(file),
                                  );
                                }
                              }}
                            />
                          </label>
                          {coverImagePreview && (
                            <img
                              src={coverImagePreview}
                              alt="Cover preview"
                              className="merchant-upload-preview-banner"
                            />
                          )}
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

                      <div className="merchant-input-group">
                        <label>Active Voucher / Promo Text</label>
                        <input
                          type="text"
                          placeholder="e.g. 10% off on total order for students!"
                          value={editingBusiness?.promo || ""}
                          onChange={(e) =>
                            setEditingBusiness({
                              ...editingBusiness,
                              promo: e.target.value,
                            })
                          }
                          className="merchant-text-input"
                        />
                      </div>

                      <div className="merchant-input-group">
                        <label>Establishment Description</label>
                        <input
                          type="text"
                          placeholder="Tell customers about your specialties & ambiance..."
                          value={editingBusiness?.description || ""}
                          onChange={(e) =>
                            setEditingBusiness({
                              ...editingBusiness,
                              description: e.target.value,
                            })
                          }
                          className="merchant-text-input"
                        />
                      </div>

                      <div className="merchant-input-group">
                        <label>Contact Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 0917-XXX-XXXX"
                          value={editingBusiness?.contact_number || ""}
                          onChange={(e) =>
                            setEditingBusiness({
                              ...editingBusiness,
                              contact_number: e.target.value,
                            })
                          }
                          className="merchant-text-input"
                        />
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
                )}

                {/* Dropdown 3: Establishment Gallery */}
                <div
                  className="profile-list-row"
                  onClick={() =>
                    setActiveBizSettingRow(
                      activeBizSettingRow === "gallery" ? null : "gallery",
                    )
                  }
                >
                  <div className="profile-list-row-left">
                    <ImageIcon size={18} />
                    <span>
                      Establishment Gallery ({currentGalleryList.length})
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--text-secondary)"
                    className={
                      activeBizSettingRow === "gallery" ? "chevron-rotated" : ""
                    }
                  />
                </div>

                {activeBizSettingRow === "gallery" && (
                  <div className="profile-list-drawer">
                    {galleryStatusMsg && (
                      <div
                        className={`merchant-status-msg ${
                          galleryStatusMsg.includes("Error")
                            ? "error"
                            : "success"
                        }`}
                      >
                        {galleryStatusMsg}
                      </div>
                    )}

                    <form
                      onSubmit={handleUploadGalleryPhotos}
                      className="merchant-form-stack"
                    >
                      <div className="merchant-input-group">
                        <label>Add New Establishment Photos</label>
                        <div className="merchant-file-upload-row">
                          <label className="merchant-file-label-btn">
                            <Upload size={14} />
                            <span>
                              {newGalleryFiles.length > 0
                                ? `${newGalleryFiles.length} file(s) selected`
                                : "Select Gallery Photos"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="merchant-file-input-hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  setNewGalleryFiles((prev) => [
                                    ...prev,
                                    ...files,
                                  ]);
                                }
                              }}
                            />
                          </label>
                          {newGalleryFiles.length > 0 && (
                            <button
                              type="button"
                              className="merchant-icon-btn"
                              onClick={() => setNewGalleryFiles([])}
                              title="Clear selection"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {newGalleryFiles.length > 0 && (
                        <button
                          type="submit"
                          className="auth-submit-btn"
                          disabled={galleryUploading}
                        >
                          <Plus size={15} />{" "}
                          {galleryUploading
                            ? "Uploading Photos..."
                            : `Upload ${newGalleryFiles.length} Photo(s) to Gallery`}
                        </button>
                      )}
                    </form>

                    {currentGalleryList.length === 0 ? (
                      <p className="profile-drawer-empty">
                        No photos in your establishment gallery yet.
                      </p>
                    ) : (
                      <div className="merchant-gallery-grid">
                        {currentGalleryList.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="merchant-gallery-thumb-card"
                          >
                            <img
                              src={imgUrl}
                              alt={`Establishment gallery ${idx + 1}`}
                            />
                            <button
                              type="button"
                              className="merchant-gallery-delete-btn"
                              onClick={() => handleRemoveGalleryPhoto(imgUrl)}
                              title="Remove photo from gallery"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Separate Unregister Business Danger Card */}
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

      {/* ================= SHARED ACCOUNT SECTION ================= */}
      <h4 className="profile-section-heading">Account</h4>
      <div className="profile-list-card">
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
