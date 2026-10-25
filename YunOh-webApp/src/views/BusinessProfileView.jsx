import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Star,
  Tag,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
} from "lucide-react";
import FollowButton from "../components/FollowButton";
import "./BusinessProfileView.css";

export default function BusinessProfileView({ business, onBack }) {
  if (!business) return null;

  const [activeTab, setActiveTab] = useState("gallery"); // 'gallery' or 'menu'

  // Fallbacks for arrays if they are empty or null
  const galleryImages =
    business.gallery_images && business.gallery_images.length > 0
      ? business.gallery_images
      : [];

  const menuImages =
    business.menu_images && business.menu_images.length > 0
      ? business.menu_images
      : [];

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
          {business.business_profile_image ? (
            <img
              src={business.business_profile_image}
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
          <span
            className="spot-rating"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <Star
              size={16}
              fill="var(--accent-color)"
              color="var(--accent-color)"
            />
            {Array.isArray(business.reviews)
              ? business.reviews.length
              : business.reviews || 50}
          </span>
        </div>

        {/* Category and Follow Button Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "4px 0 8px 0",
          }}
        >
          <p className="bp-category" style={{ margin: 0 }}>
            {business.category || "Local Delicacy"}
          </p>
        </div>

        <div className="bp-meta-row">
          <MapPin size={16} color="var(--struct-secondary)" />
          <span>{business.address || "Centro, Delfin Albano, Isabela"}</span>
        </div>

        <FollowButton initialFollowState={false} initialCount={24} />

        {business.promo && (
          <div className="bp-promo-banner">
            <Tag size={14} color="var(--accent-color)" />
            <span>{business.promo}</span>
          </div>
        )}
      </div>

      {/* Storefront Tabs: Gallery vs. Menu */}
      <div className="bp-tabs">
        <button
          className={`bp-tab-btn ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <ImageIcon size={16} /> Gallery ({galleryImages.length})
        </button>
        <button
          className={`bp-tab-btn ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          <BookOpen size={16} /> Menu Pages ({menuImages.length})
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="bp-tab-content">
        {activeTab === "gallery" ? (
          <div className="bp-grid-container">
            {galleryImages.length === 0 ? (
              <div className="bp-empty-state">
                <ImageIcon size={32} opacity={0.3} />
                <p>No gallery photos uploaded for this establishment yet.</p>
              </div>
            ) : (
              galleryImages.map((imgUrl, index) => (
                <div key={index} className="bp-media-card">
                  <img src={imgUrl} alt={`Gallery item ${index + 1}`} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bp-grid-container">
            {menuImages.length === 0 ? (
              <div className="bp-empty-state">
                <BookOpen size={32} opacity={0.3} />
                <p>No physical menu pages uploaded yet.</p>
              </div>
            ) : (
              menuImages.map((menuUrl, index) => (
                <div key={index} className="bp-media-card menu-card">
                  <img src={menuUrl} alt={`Menu page ${index + 1}`} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
