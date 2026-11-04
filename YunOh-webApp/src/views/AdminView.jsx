import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  Users,
  MessageSquare,
  Search,
  MapPin,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./AdminView.css";

export default function AdminView({ onSignOut }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [businesses, setBusinesses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [openCredBizId, setOpenCredBizId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Inline Delete Confirmation State (Replaces blocked window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    setLoading(true);
    try {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      setBusinesses(bizData || []);

      const { data: profData } = await supabase
        .from("profiles")
        .select("id, username, email, role, created_at")
        .order("created_at", { ascending: false });

      setUsersList(profData || []);

      const { count: revCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true });

      setTotalReviewsCount(revCount || 0);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Business Verification (Approve or Revoke)
  const handleToggleVerify = async (biz, targetStatus) => {
    setActionLoadingId(biz.id);
    const { error } = await supabase
      .from("businesses")
      .update({ is_verified: targetStatus })
      .eq("id", biz.id);

    setActionLoadingId(null);

    if (!error) {
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === biz.id ? { ...item, is_verified: targetStatus } : item,
        ),
      );
    }
  };

  // Permanently Delete a Business Registration (No window.confirm block)
  const handleConfirmDeleteBusiness = async (bizId) => {
    setActionLoadingId(bizId);
    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", bizId);

    setActionLoadingId(null);
    setConfirmDeleteId(null);

    if (!error) {
      setBusinesses((prev) => prev.filter((item) => item.id !== bizId));
    }
  };

  const getFormattedAddress = (biz) => {
    const parts = [
      biz.street,
      biz.barangay ? `Brgy. ${biz.barangay}` : null,
      biz.municipality,
      biz.province,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : biz.address || "Bayombong, Nueva Vizcaya";
  };

  const getOwnerLabel = (ownerId) => {
    const owner = usersList.find((u) => u.id === ownerId);
    if (!owner) return "Registered Owner";
    return `@${owner.username || "owner"} (${owner.email || "No email"})`;
  };

  const pendingBusinesses = businesses.filter((b) => !b.is_verified);
  const verifiedBusinesses = businesses.filter((b) => Boolean(b.is_verified));

  const q = searchQuery.toLowerCase();

  const filteredBusinesses = (
    activeTab === "pending" ? pendingBusinesses : verifiedBusinesses
  ).filter(
    (b) =>
      b.name?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.barangay?.toLowerCase().includes(q),
  );

  const filteredUsers = usersList.filter(
    (u) =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q),
  );

  const slidingTabIndex =
    activeTab === "pending" ? 0 : activeTab === "verified" ? 1 : 2;

  return (
    <div className="admin-view">
      {/* 1. Top Admin Header Banner */}
      <div className="admin-top-banner">
        <div className="admin-banner-text">
          <h2>
            <ShieldCheck size={22} color="var(--accent-color)" /> Admin Control
            Center
          </h2>
          <p>
            Inspect business permits, verify local establishments in Bayombong,
            and manage accounts.
          </p>
        </div>

        <div className="admin-banner-actions">
          <button
            type="button"
            onClick={fetchAdminDashboardData}
            className="admin-refresh-btn"
            title="Refresh live data"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="admin-signout-btn"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* 2. Responsive 4-Card Summary Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Pending Review</span>
            <Clock size={15} color="#d97706" />
          </div>
          <div className="admin-stat-value">{pendingBusinesses.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Verified Spots</span>
            <ShieldCheck size={15} color="#10b981" />
          </div>
          <div className="admin-stat-value">{verifiedBusinesses.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Users</span>
            <Users size={15} color="var(--accent-color)" />
          </div>
          <div className="admin-stat-value">{usersList.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Reviews</span>
            <MessageSquare size={15} color="var(--accent-color)" />
          </div>
          <div className="admin-stat-value">{totalReviewsCount}</div>
        </div>
      </div>

      {/* 3. Search Bar & Sliding Underline Navigation */}
      <div className="admin-controls-bar">
        <div className="admin-search-box">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search businesses, barangay, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="admin-sliding-tabs">
          <button
            type="button"
            className={`admin-sliding-tab ${
              activeTab === "pending" ? "active" : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingBusinesses.length})
          </button>
          <button
            type="button"
            className={`admin-sliding-tab ${
              activeTab === "verified" ? "active" : ""
            }`}
            onClick={() => setActiveTab("verified")}
          >
            Verified ({verifiedBusinesses.length})
          </button>
          <button
            type="button"
            className={`admin-sliding-tab ${
              activeTab === "users" ? "active" : ""
            }`}
            onClick={() => setActiveTab("users")}
          >
            Users ({usersList.length})
          </button>
          <div className={`admin-sliding-indicator tab-${slidingTabIndex}`} />
        </div>
      </div>

      {/* 4. Main Content Area */}
      {loading ? (
        <div className="admin-empty-box">Syncing records from Supabase...</div>
      ) : activeTab === "users" ? (
        <div className="admin-cards-grid">
          {filteredUsers.length === 0 ? (
            <div className="admin-empty-box">No matching user accounts.</div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="admin-user-card">
                <div className="admin-user-info">
                  <span className="admin-user-name">
                    @{u.username || "user"}
                  </span>
                  <span className="admin-user-email">
                    {u.email || "No email"}
                  </span>
                </div>
                <span className={`admin-role-pill ${u.role || "consumer"}`}>
                  {u.role || "consumer"}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="admin-cards-grid">
          {filteredBusinesses.length === 0 ? (
            <div className="admin-empty-box">
              {activeTab === "pending"
                ? "No pending business registrations waiting for review!"
                : "No verified businesses found."}
            </div>
          ) : (
            filteredBusinesses.map((biz) => {
              const creds = Array.isArray(biz.credentials_images)
                ? biz.credentials_images.filter(Boolean)
                : [];
              const isCredOpen = openCredBizId === biz.id;
              const avatarUrl = biz.business_profile_image || biz.logo_url;
              const isConfirmingDelete = confirmDeleteId === biz.id;

              return (
                <div key={biz.id} className="admin-biz-card">
                  <div className="admin-biz-header">
                    <div className="admin-biz-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={biz.name} />
                      ) : (
                        <span className="admin-biz-avatar-letter">
                          {biz.name ? biz.name.charAt(0) : "Y"}
                        </span>
                      )}
                    </div>

                    <div className="admin-biz-title-wrap">
                      <h4 className="admin-biz-name">{biz.name}</h4>
                      <span className="admin-biz-owner">
                        {getOwnerLabel(biz.owner_id)}
                      </span>
                    </div>

                    <span
                      className={`admin-status-badge ${
                        biz.is_verified ? "verified" : "pending"
                      }`}
                    >
                      {biz.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="admin-biz-meta-list">
                    <div className="admin-biz-meta-row">
                      <MapPin size={13} color="var(--accent-color)" />
                      <span>
                        {getFormattedAddress(biz)} ({biz.latitude},{" "}
                        {biz.longitude})
                      </span>
                    </div>
                    <div className="admin-biz-meta-row">
                      <Clock size={13} color="var(--accent-color)" />
                      <span>
                        {biz.open_time || "08:00"} - {biz.close_time || "21:00"}{" "}
                        • {biz.category || "Local Delicacy"}
                      </span>
                    </div>
                    {biz.contact_number && (
                      <div className="admin-biz-meta-row">
                        <Phone size={13} color="var(--accent-color)" />
                        <span>{biz.contact_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Credentials Inspector */}
                  <button
                    type="button"
                    className="admin-cred-toggle-btn"
                    onClick={() => setOpenCredBizId(isCredOpen ? null : biz.id)}
                  >
                    <span>
                      <FileText size={14} /> Inspect Uploaded Credentials (
                      {creds.length} files)
                    </span>
                    {isCredOpen ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </button>

                  {isCredOpen && (
                    <div className="admin-cred-drawer">
                      {creds.length === 0 ? (
                        <span className="admin-biz-owner">
                          No credential documents uploaded for this record.
                        </span>
                      ) : (
                        <div className="admin-cred-grid">
                          {creds.map((fileUrl, idx) => {
                            const isPdf = fileUrl
                              .toLowerCase()
                              .includes(".pdf");
                            return (
                              <div
                                key={idx}
                                className="admin-cred-thumb"
                                onClick={() => {
                                  if (!isPdf) setLightboxUrl(fileUrl);
                                }}
                              >
                                {isPdf ? (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-cred-pdf-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FileText size={20} />
                                    <span>
                                      PDF #{idx + 1} <ExternalLink size={10} />
                                    </span>
                                  </a>
                                ) : (
                                  <img
                                    src={fileUrl}
                                    alt={`Credential ${idx + 1}`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Moderation Actions (Inline Confirm for Remove) */}
                  <div className="admin-card-actions">
                    {!biz.is_verified ? (
                      <button
                        type="button"
                        className="admin-approve-btn"
                        disabled={actionLoadingId === biz.id}
                        onClick={() => handleToggleVerify(biz, true)}
                      >
                        <CheckCircle size={15} />
                        {actionLoadingId === biz.id
                          ? "Verifying..."
                          : "Approve & Verify"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-revoke-btn"
                        disabled={actionLoadingId === biz.id}
                        onClick={() => handleToggleVerify(biz, false)}
                      >
                        <XCircle size={15} />
                        {actionLoadingId === biz.id
                          ? "Updating..."
                          : "Revoke Verification"}
                      </button>
                    )}

                    {!isConfirmingDelete ? (
                      <button
                        type="button"
                        className="admin-reject-btn"
                        disabled={actionLoadingId === biz.id}
                        onClick={() => setConfirmDeleteId(biz.id)}
                        title="Delete business registration"
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    ) : (
                      <div className="admin-confirm-delete-row">
                        <button
                          type="button"
                          className="admin-confirm-yes-btn"
                          disabled={actionLoadingId === biz.id}
                          onClick={() => handleConfirmDeleteBusiness(biz.id)}
                        >
                          {actionLoadingId === biz.id
                            ? "Deleting..."
                            : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          className="admin-confirm-no-btn"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Fullscreen Credential Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="admin-lightbox-overlay"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="admin-lightbox-close"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Credential document preview"
            className="admin-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
