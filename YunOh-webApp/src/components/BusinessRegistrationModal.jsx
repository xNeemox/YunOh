import React, { useState } from "react";
import {
  ArrowLeft,
  Store,
  Upload,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./BusinessRegistrationModal.css";

const AVAILABLE_CATEGORIES = [
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

const BAYOMBONG_BARANGAYS = [
  "District IV",
  "Don Domingo Maddela",
  "Don Mariano Marcos",
  "Don Tomas Maddela",
  "Salvacion",
  "Magsaysay",
  "Bonfal Proper",
  "Bonfal East",
  "Bonfal West",
  "Vista Alegre",
  "Busilac",
  "La Torre North",
  "La Torre South",
  "Santa Rosa",
  "Casat",
];

export default function BusinessRegistrationModal({
  isOpen,
  session,
  onClose,
  onSubmitSuccess,
}) {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([
    "Local Delicacy",
  ]);
  const [description, setDescription] = useState("");

  // Structured Address Fields
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("District IV");
  const [municipality, setMunicipality] = useState("Bayombong");
  const [province, setProvince] = useState("Nueva Vizcaya");

  // GPS Coordinates (Default: Bayombong Town Center)
  const [latitude, setLatitude] = useState(16.4815);
  const [longitude, setLongitude] = useState(121.1497);
  const [gpsStatus, setGpsStatus] = useState("");

  // Contact, Hours & Promo
  const [contactNumber, setContactNumber] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("21:00");

  // Image Upload States
  const [profileImgFile, setProfileImgFile] = useState(null);
  const [profileImgPreview, setProfileImgPreview] = useState("");

  const [coverImgFile, setCoverImgFile] = useState(null);
  const [coverImgPreview, setCoverImgPreview] = useState("");

  const [galleryFiles, setGalleryFiles] = useState([]);
  const [credentialFiles, setCredentialFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Toggle Multi-Category Chip
  const handleToggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  // Detect User Live GPS Coordinates
  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("Detecting GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGpsStatus("Live GPS coordinates locked!");
      },
      () => {
        setGpsStatus("Permission denied. Using default Bayombong center.");
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  // Upload helper to 'yunoh-media' Supabase Storage bucket
  const uploadFileToBucket = async (file, folder, userId) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from("yunoh-media")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("yunoh-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    let activeUserId = session?.user?.id;
    if (!activeUserId) {
      const { data: authData } = await supabase.auth.getUser();
      activeUserId = authData?.user?.id;
    }

    if (!activeUserId) {
      setErrorMsg("You must be signed in to register a business.");
      return;
    }

    if (!profileImgFile || !coverImgFile) {
      setErrorMsg(
        "Please upload both a Business Profile Image (Logo) and a Cover Banner Photo.",
      );
      return;
    }

    if (credentialFiles.length < 3) {
      setErrorMsg(
        `Please upload at least 3 business credential documents (currently attached: ${credentialFiles.length}/3).`,
      );
      return;
    }

    // Validate & Auto-Correct Swapped Latitude / Longitude
    let parsedLat = parseFloat(latitude);
    let parsedLng = parseFloat(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setErrorMsg("Please enter valid numeric Latitude and Longitude values.");
      return;
    }

    // If user accidentally typed Longitude (e.g. 121.14) into Latitude and Latitude (16.48) into Longitude, swap them!
    if (Math.abs(parsedLat) > 90 && Math.abs(parsedLng) <= 90) {
      const temp = parsedLat;
      parsedLat = parsedLng;
      parsedLng = temp;
    }

    if (
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      setErrorMsg(
        "Latitude must be between -90 and 90 (e.g. 16.4815) and Longitude between -180 and 180 (e.g. 121.1497).",
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload Profile Image & Cover Banner
      const profileImageUrl = await uploadFileToBucket(
        profileImgFile,
        "storefronts",
        activeUserId,
      );
      const coverImageUrl = await uploadFileToBucket(
        coverImgFile,
        "storefronts",
        activeUserId,
      );

      // 2. Upload Gallery Photos (if any)
      const galleryUrls = [];
      for (const file of galleryFiles) {
        const url = await uploadFileToBucket(file, "gallery", activeUserId);
        galleryUrls.push(url);
      }

      // 3. Upload Minimum 3 Credential Documents
      const credentialUrls = [];
      for (const file of credentialFiles) {
        const url = await uploadFileToBucket(file, "credentials", activeUserId);
        credentialUrls.push(url);
      }

      // 4. Build Full Formatted Address & Category String
      const fullAddress = [
        street.trim(),
        barangay.trim(),
        municipality.trim(),
        province.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const categoryString = selectedCategories.join(", ");

      // 5. Purge any leftover/withdrawn registration for this owner so no duplicate rows conflict
      await supabase.from("businesses").delete().eq("owner_id", activeUserId);

      // 6. Insert Fresh Business Record into public.businesses
      const { data: insertedBiz, error: insertError } = await supabase
        .from("businesses")
        .insert([
          {
            owner_id: activeUserId,
            name: name.trim(),
            category: categoryString,
            description: description.trim() || null,
            street: street.trim(),
            barangay: barangay.trim(),
            municipality: municipality.trim(),
            province: province.trim(),
            address: fullAddress,
            latitude: parsedLat,
            longitude: parsedLng,
            contact_number: contactNumber.trim() || null,
            social_link: socialLink.trim() || null,
            open_time: openTime,
            close_time: closeTime,
            business_profile_image: profileImageUrl,
            cover_image_url: coverImageUrl,
            gallery_images: galleryUrls,
            credentials_images: credentialUrls,
            is_verified: false,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 7. Update User Role to 'owner' in public.profiles (unless user is already admin)
      await supabase
        .from("profiles")
        .update({ role: "owner" })
        .eq("id", activeUserId)
        .neq("role", "admin");

      setSuccessMsg(
        "Establishment submitted! Approve it in the Admin Control Center to publish it on Home & Discover.",
      );

      setTimeout(() => {
        if (onSubmitSuccess) onSubmitSuccess(insertedBiz);
        onClose();
      }, 1300);
    } catch (err) {
      console.error("Business Registration Error:", err);
      setErrorMsg(err.message || "Failed to register business.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="biz-reg-page">
      {/* Top Page Navigation */}
      <button type="button" onClick={onClose} className="biz-reg-back-btn">
        <ArrowLeft size={18} /> Back to Profile
      </button>

      <div className="biz-reg-card">
        <div className="biz-reg-header">
          <h3>Register Establishment 🏢</h3>
          <p>
            Complete your business details and upload your verification
            documents to list your establishment on YunOh.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 1. Basic Establishment Details */}
          <div className="reg-input-group">
            <label>Business Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., G & B Panciteria"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="reg-input-group">
            <label>
              Select Categories * (Choose 1 or more — first 2 show on card)
            </label>
            <div className="biz-reg-chip-grid">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`biz-reg-category-chip ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="reg-input-group">
            <label>Short Description / Specialties</label>
            <input
              type="text"
              placeholder="Tell customers about your best dishes & vibe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 2. Structured Address Section */}
          <h4 className="biz-reg-section-title">
            <MapPin size={15} /> Establishment Address & GPS
          </h4>

          <div className="reg-input-group">
            <label>Street / Building / Landmark *</label>
            <input
              type="text"
              required
              placeholder="e.g., National Highway, Near NVSU Gate"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="reg-input-group">
            <label>Barangay *</label>
            <select
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
            >
              {BAYOMBONG_BARANGAYS.map((brgy) => (
                <option key={brgy} value={brgy}>
                  Brgy. {brgy}
                </option>
              ))}
            </select>
          </div>

          <div className="biz-reg-grid-2col">
            <div className="reg-input-group">
              <label>Municipality *</label>
              <input
                type="text"
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              />
            </div>
            <div className="reg-input-group">
              <label>Province *</label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>
          </div>

          <div className="biz-reg-grid-2col">
            <div className="reg-input-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="reg-input-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            className="biz-reg-gps-btn"
          >
            <MapPin size={14} /> Use My Current GPS Location
          </button>
          {gpsStatus && (
            <span className="biz-reg-count-badge valid">{gpsStatus}</span>
          )}

          {/* 3. Operating Hours & Contact Info */}
          <h4 className="biz-reg-section-title">
            <Clock size={15} /> Operating Hours & Contact
          </h4>

          <div className="biz-reg-grid-2col">
            <div className="reg-input-group">
              <label>Opening Time *</label>
              <input
                type="time"
                required
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>
            <div className="reg-input-group">
              <label>Closing Time *</label>
              <input
                type="time"
                required
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>

          <div className="biz-reg-grid-2col">
            <div className="reg-input-group">
              <label>Contact Number</label>
              <input
                type="text"
                placeholder="0917-XXX-XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>
            <div className="reg-input-group">
              <label>Social / Facebook Link</label>
              <input
                type="text"
                placeholder="https://facebook.com/..."
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
              />
            </div>
          </div>

          {/* 4. Storefront Visuals & Gallery Uploads */}
          <h4 className="biz-reg-section-title">
            <Store size={15} /> Storefront Photos
          </h4>

          <div className="biz-reg-grid-2col">
            <div className="reg-input-group">
              <label>Business Profile Image *</label>
              <label className="biz-reg-upload-label">
                <Upload size={14} />
                <span>{profileImgFile ? "Change Logo" : "Upload Logo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="biz-reg-hidden-file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setProfileImgFile(f);
                      setProfileImgPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
              {profileImgPreview && (
                <div className="biz-reg-preview-strip">
                  <div className="biz-reg-preview-item">
                    <img src={profileImgPreview} alt="Profile preview" />
                  </div>
                </div>
              )}
            </div>

            <div className="reg-input-group">
              <label>Cover Banner Photo *</label>
              <label className="biz-reg-upload-label">
                <Upload size={14} />
                <span>{coverImgFile ? "Change Cover" : "Upload Cover"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="biz-reg-hidden-file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCoverImgFile(f);
                      setCoverImgPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
              {coverImgPreview && (
                <div className="biz-reg-preview-strip">
                  <div className="biz-reg-preview-item">
                    <img src={coverImgPreview} alt="Cover preview" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="reg-input-group">
            <label>Establishment Gallery Photos (Optional, Multiple)</label>
            <label className="biz-reg-upload-label">
              <Upload size={14} />
              <span>Add Gallery Photos ({galleryFiles.length} selected)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="biz-reg-hidden-file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setGalleryFiles((prev) => [...prev, ...files]);
                  }
                }}
              />
            </label>
            {galleryFiles.length > 0 && (
              <div className="biz-reg-preview-strip">
                {galleryFiles.map((file, idx) => (
                  <div key={idx} className="biz-reg-preview-item">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Gallery ${idx + 1}`}
                    />
                    <button
                      type="button"
                      className="biz-reg-remove-file-btn"
                      onClick={() =>
                        setGalleryFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Business Credentials Upload (Minimum 3 Required) */}
          <h4 className="biz-reg-section-title">
            <ShieldCheck size={15} /> Business Verification Credentials
          </h4>

          <div className="biz-reg-credentials-guide">
            <strong>
              Please upload at least 3 of the following documents:
            </strong>
            <ul>
              <li>Mayor's / Business Permit</li>
              <li>DTI Business Name Registration or SEC Certificate</li>
              <li>BIR Certificate of Registration (Form 2303)</li>
              <li>Barangay Business Clearance</li>
              <li>Sanitary Permit / Fire Safety Inspection Certificate</li>
            </ul>
          </div>

          <div className="reg-input-group">
            <label>Upload Credential Photos / Scans (Minimum 3) *</label>
            <label className="biz-reg-upload-label">
              <Upload size={14} />
              <span>Select Credential Files (Add 3 or more)</span>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="biz-reg-hidden-file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setCredentialFiles((prev) => [...prev, ...files]);
                  }
                }}
              />
            </label>

            <span
              className={`biz-reg-count-badge ${
                credentialFiles.length >= 3 ? "valid" : "invalid"
              }`}
            >
              {credentialFiles.length} of 3 minimum required credentials
              attached
            </span>

            {credentialFiles.length > 0 && (
              <div className="biz-reg-preview-strip">
                {credentialFiles.map((file, idx) => (
                  <div key={idx} className="biz-reg-preview-item">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Credential ${idx + 1}`}
                    />
                    <button
                      type="button"
                      className="biz-reg-remove-file-btn"
                      onClick={() =>
                        setCredentialFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Feedback Right Above Submit Button */}
          {errorMsg && (
            <div className="biz-reg-alert error">
              <AlertCircle size={16} /> <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="biz-reg-alert success">
              <CheckCircle size={16} /> <span>{successMsg}</span>
            </div>
          )}

          <div className="modal-footer biz-reg-footer-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="modal-submit-btn"
            >
              {submitting
                ? "Uploading & Registering..."
                : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
