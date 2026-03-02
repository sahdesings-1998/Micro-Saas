import { useEffect, useState } from "react";
import { FiUser, FiEdit2 } from "react-icons/fi";
import * as ds from "../../services/dashboardService";
import "../../css/dashboard.css";

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const sanitizePhone = (val) => String(val || "").replace(/[^0-9]/g, "");

const AccountSection = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", companyName: "" });
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await ds.getAdminProfile();
      setProfile(data);
      setForm({
        name: data?.name ?? "",
        email: data?.email ?? "",
        mobile: data?.mobile ?? "",
        companyName: data?.companyName ?? "",
      });
    } catch {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEdit = () => {
    setForm({
      name: profile?.name ?? "",
      email: profile?.email ?? "",
      mobile: profile?.mobile ?? "",
      companyName: profile?.companyName ?? "",
    });
    setFormErr("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormErr("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      setFormErr("Name is required");
      return;
    }
    if (!form.email?.trim()) {
      setFormErr("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setFormErr("Invalid email");
      return;
    }
    setFormErr("");
    setSaving(true);
    try {
      const { data } = await ds.updateAdminProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: sanitizePhone(form.mobile),
        companyName: (form.companyName || "").trim(),
      });
      setProfile(data);
      setEditing(false);
    } catch (ex) {
      setFormErr(ex?.response?.data?.message || "Failed to update profile");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="sa-panel">
        <div className="sa-panel-body">
          <p className="sa-empty">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-account-section">
      <h2 className="sa-account-title">Account</h2>
      <p className="sa-account-subtitle">Manage your admin account details</p>

      <div className="sa-account-profile-card">
        <div className="sa-account-profile-header">
          <div className="sa-account-profile-main">
            <div className="sa-account-profile-avatar">
              <FiUser size={28} />
            </div>
            <div>
              <h3 className="sa-account-profile-name">{profile?.name ?? "—"}</h3>
              <p className="sa-account-profile-code">{profile?.adminCode ?? "—"}</p>
            </div>
          </div>
          {!editing && (
            <button type="button" className="sa-btn sa-btn-outline" onClick={handleEdit}>
              <FiEdit2 /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <form className="sa-account-form" onSubmit={handleSave}>
            <div className="sa-account-form-grid">
              <div className="sa-account-form-field">
                <label className="sa-account-form-label">Name</label>
                <input
                  className="sa-account-form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="sa-account-form-field">
                <label className="sa-account-form-label">Admin Code (read-only)</label>
                <input
                  className="sa-account-form-input"
                  value={profile?.adminCode ?? ""}
                  readOnly
                  disabled
                  style={{ background: "#f8fafc", cursor: "default" }}
                />
              </div>
              <div className="sa-account-form-field">
                <label className="sa-account-form-label">Email</label>
                <input
                  className="sa-account-form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="sa-account-form-field">
                <label className="sa-account-form-label">Mobile</label>
                <input
                  className="sa-account-form-input"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: sanitizePhone(e.target.value) })}
                  inputMode="numeric"
                />
              </div>
              <div className="sa-account-form-field sa-account-form-field-full">
                <label className="sa-account-form-label">Company Name</label>
                <input
                  className="sa-account-form-input"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
              <div className="sa-account-form-field">
                <label className="sa-account-form-label">Created Date</label>
                <input
                  className="sa-account-form-input"
                  value={formatDate(profile?.createdAt)}
                  readOnly
                  disabled
                  style={{ background: "#f8fafc", cursor: "default" }}
                />
              </div>
            </div>
            {formErr && <p className="sa-form-error">{formErr}</p>}
            <div className="sa-account-form-actions">
              <button type="button" className="sa-btn sa-btn-outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="sa-btn sa-btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="sa-account-details-grid">
            <div className="sa-account-detail-item">
              <span className="sa-account-detail-label">Name</span>
              <span className="sa-account-detail-value">{profile?.name ?? "—"}</span>
            </div>
            <div className="sa-account-detail-item">
              <span className="sa-account-detail-label">Admin Code</span>
              <span className="sa-account-detail-value">{profile?.adminCode ?? "—"}</span>
            </div>
            <div className="sa-account-detail-item">
              <span className="sa-account-detail-label">Email</span>
              <span className="sa-account-detail-value">{profile?.email ?? "—"}</span>
            </div>
            <div className="sa-account-detail-item">
              <span className="sa-account-detail-label">Mobile</span>
              <span className="sa-account-detail-value">{profile?.mobile ?? "—"}</span>
            </div>
            <div className="sa-account-detail-item">
              <span className="sa-account-detail-label">Company Name</span>
              <span className="sa-account-detail-value">{profile?.companyName ?? "—"}</span>
            </div>
            <div className="sa-account-detail-item">
              <span className="sa-account-detail-label">Created Date</span>
              <span className="sa-account-detail-value">{formatDate(profile?.createdAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSection;
