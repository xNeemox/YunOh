import React, { useState } from "react";
import { X, Store, Upload } from "lucide-react";
import "./BusinessRegistrationModal.css";

export default function BusinessRegistrationModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: "",
    category: "Local Delicacy",
    address: "Centro, Delfin Albano, Isabela",
    phone: "",
    promo: "",
    permitFile: null,
    storefrontFile: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate submission to manual approval queue
    setTimeout(() => {
      setSubmitting(false);
      alert(
        "Business registration submitted successfully! Pending manual admin review.",
      );
      if (onSubmitSuccess) onSubmitSuccess(formData);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-card">
        <div className="modal-header">
          <h3>Register Establishment 🏢</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="modal-instruction">
            Submit your local business details in Delfin Albano for manual
            verification and listing.
          </p>

          <div className="reg-input-group">
            <label>Business Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Delfin Brews Cafe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="reg-input-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="Local Delicacy">Local Delicacy / Food</option>
              <option value="Cafe & Bakery">Cafe & Bakery</option>
              <option value="Retail Store">Retail Store</option>
              <option value="Services">Services</option>
            </select>
          </div>

          <div className="reg-input-group">
            <label>Address in Delfin Albano</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="reg-input-group">
            <label>Contact Number</label>
            <input
              type="text"
              placeholder="e.g., 0917-XXX-XXXX"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="reg-input-group">
            <label>Initial Promo / Tagline (Optional)</label>
            <input
              type="text"
              placeholder="e.g., 10% off on your first order"
              value={formData.promo}
              onChange={(e) =>
                setFormData({ ...formData, promo: e.target.value })
              }
            />
          </div>

          {/* Verification Document Uploads */}
          <div className="reg-input-group">
            <label>
              Proof of Business Registration (Mayor's Permit / DTI / BIR)
            </label>
            <div className="file-upload-box">
              <input
                type="file"
                required
                accept=".pdf,image/*"
                onChange={(e) =>
                  setFormData({ ...formData, permitFile: e.target.files[0] })
                }
              />
            </div>
          </div>

          <div className="reg-input-group">
            <label>Physical Storefront / Establishment Photo</label>
            <div className="file-upload-box">
              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    storefrontFile: e.target.files[0],
                  })
                }
              />
            </div>
          </div>

          <div
            className="modal-footer"
            style={{ padding: 0, marginTop: "8px" }}
          >
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
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
