import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUserCheck,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiUser,
  FiEdit2,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/Dashboard/MainLayout";
import DashboardModal from "../components/Dashboard/DashboardModal";
import * as ds from "../services/dashboardService";
import "../css/dashboard.css";

const MENU = ["Dashboard", "Invoices", "Account", "Logout"];

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const sanitizePhone = (val) => String(val || "").replace(/[^0-9]/g, "");

const MemberDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: res } = await ds.getMemberProfile();
      setData(res);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMenu = (item) => {
    if (item === "Logout") {
      setShowLogout(true);
      return;
    }
    setActiveItem(item);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const member = data?.member || {};
  const invoices = Array.isArray(data?.invoices) ? data.invoices : [];
  const totalInvoices = data?.totalInvoices ?? 0;
  const totalPaidAmount = data?.totalPaidAmount ?? 0;
  const totalUnpaidAmount = data?.totalUnpaidAmount ?? 0;
  const currentPlan = data?.currentPlan;

  const summaryCards = [
    { label: "Member Status", value: member.isActive ? "Active" : "Inactive", icon: FiUserCheck },
    { label: "Total Invoices", value: totalInvoices, icon: FiFileText },
    { label: "Total Paid Amount", value: `$${totalPaidAmount.toLocaleString()}`, icon: FiDollarSign },
    { label: "Pending Amount", value: `$${totalUnpaidAmount.toLocaleString()}`, icon: FiClock },
  ];

  const renderDashboard = () => (
    <div className="sa-member-dashboard">
      {/* <h2 className="sa-member-page-title">Dashboard</h2>
      <p className="sa-member-page-subtitle">Overview of your membership and payments</p> */}

      <div className="sa-cards-grid sa-dashboard-cards-grid sa-member-cards">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="sa-dashboard-card">
              <div className="sa-dashboard-card-top">
                <span className="sa-dashboard-card-icon">
                  <Icon size={18} />
                </span>
                <p className="sa-dashboard-card-value">{card.value}</p>
              </div>
              <p className="sa-dashboard-card-label">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="sa-member-dashboard-row">
        <div className="sa-memdash-subscription-card">
          <h3 className="sa-memdash-section-title">Current Subscription</h3>
          {currentPlan ? (
            <div className="sa-memdash-subscription-content">
              <div className="sa-memdash-subscription-row">
                <span className="sa-memdash-sub-label">Plan Name</span>
                <span className="sa-memdash-sub-value">{currentPlan.planName}</span>
              </div>
              <div className="sa-memdash-subscription-row">
                <span className="sa-memdash-sub-label">Amount</span>
                <span className="sa-memdash-sub-value">${currentPlan.amount?.toLocaleString() ?? 0}</span>
              </div>
              <div className="sa-memdash-subscription-row">
                <span className="sa-memdash-sub-label">Duration</span>
                <span className="sa-memdash-sub-value">{currentPlan.duration ?? 0} month(s)</span>
              </div>
              <div className="sa-memdash-subscription-row">
                <span className="sa-memdash-sub-label">Start Date</span>
                <span className="sa-memdash-sub-value">{formatDate(currentPlan.startDate)}</span>
              </div>
              <div className="sa-memdash-subscription-row">
                <span className="sa-memdash-sub-label">Next Due Date</span>
                <span className="sa-memdash-sub-value">{formatDate(currentPlan.nextDueDate)}</span>
              </div>
              <span
                className={`sa-badge sa-badge-invoice-status ${
                  (currentPlan.status || "").toLowerCase() === "paid" ? "sa-badge-paid" : "sa-badge-unpaid"
                }`}
              >
                {currentPlan.status ?? "Unpaid"}
              </span>
            </div>
          ) : (
            <p className="sa-empty">No subscription plan</p>
          )}
        </div>

        <div className="sa-memdash-payment-card">
          <h3 className="sa-memdash-section-title">Payment Summary</h3>
          <div className="sa-memdash-payment-content">
            <div className="sa-memdash-payment-row">
              <span className="sa-memdash-pay-label">Total Paid Amount</span>
              <span className="sa-memdash-pay-value sa-memdash-pay-success">
                ${totalPaidAmount.toLocaleString()}
              </span>
            </div>
            <div className="sa-memdash-payment-row">
              <span className="sa-memdash-pay-label">Total Unpaid Amount</span>
              <span className="sa-memdash-pay-value sa-memdash-pay-pending">
                ${totalUnpaidAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="sa-member-invoices-page">
      {/* <h2 className="sa-member-page-title">Invoices</h2>
      <p className="sa-member-page-subtitle">Your invoice history</p> */}

      <div className="sa-memdash-invoices-panel">
        {invoices.length === 0 ? (
          <p className="sa-empty">No invoices found</p>
        ) : (
          <div className="sa-memdash-invoices-table-wrap">
            <table className="sa-memdash-invoices-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Plan Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>{inv.invoiceNumber ?? "—"}</td>
                    <td>{inv.planName ?? "—"}</td>
                    <td>${(inv.amount ?? 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`sa-badge sa-badge-invoice-status ${
                          (inv.status || "").toLowerCase() === "paid" ? "sa-badge-paid" : "sa-badge-unpaid"
                        }`}
                      >
                        {inv.status ?? "Unpaid"}
                      </span>
                    </td>
                    <td>—</td>
                    <td>{formatDate(inv.invoiceDate || inv.date)}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderAccount = () => <MemberAccountSection member={member} onSaved={loadData} />;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="sa-panel">
          <div className="sa-panel-body">
            <p className="sa-empty">Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeItem) {
      case "Dashboard":
        return renderDashboard();
      case "Invoices":
        return renderInvoices();
      case "Account":
        return renderAccount();
      default:
        return renderDashboard();
    }
  };

  return (
    <MainLayout
      menuItems={MENU}
      activeItem={activeItem}
      onMenuSelect={handleMenu}
      title={activeItem}
      role={user?.role || "member"}
      onLogout={() => setShowLogout(true)}
    >
      {renderContent()}

      <DashboardModal open={showLogout} title="Confirm Logout" onClose={() => setShowLogout(false)}>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
          Are you sure you want to logout?
        </p>
        <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowLogout(false)}>
            Cancel
          </button>
          <button type="button" className="sa-btn sa-btn-danger" onClick={confirmLogout}>
            Yes, Logout
          </button>
        </div>
      </DashboardModal>
    </MainLayout>
  );
};

const MemberAccountSection = ({ member, onSaved }) => {
  const [profile, setProfile] = useState(member);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    companyName: "",
  });
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile(member);
    setForm({
      name: member?.name ?? "",
      email: member?.email ?? "",
      mobile: member?.mobile ?? "",
      companyName: member?.companyName ?? "",
    });
  }, [member]);

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
      const { data } = await ds.updateMemberProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: sanitizePhone(form.mobile),
        companyName: (form.companyName || "").trim(),
      });
      setProfile(data);
      setEditing(false);
      onSaved?.();
    } catch (ex) {
      setFormErr(ex?.response?.data?.message || "Failed to update profile");
    }
    setSaving(false);
  };

  return (
    <div className="sa-member-account-page">
      {/* <h2 className="sa-member-page-title">Account</h2>
      <p className="sa-member-page-subtitle">Manage your profile</p> */}

      <div className="sa-memdash-account-card">
        <div className="sa-memdash-account-header">
          <div className="sa-memdash-account-main">
            <div className="sa-memdash-profile-avatar">
              <FiUser size={28} />
            </div>
            <div>
              <h3 className="sa-memdash-account-name">{profile?.name ?? "—"}</h3>
              <p className="sa-memdash-account-code">{profile?.memberCode ?? "—"}</p>
            </div>
          </div>
          <span
            className={`sa-badge sa-badge-status ${profile?.isActive ? "sa-badge-active" : "sa-badge-inactive"}`}
          >
            {profile?.isActive ? "Active" : "Inactive"}
          </span>
          {!editing && (
            <button type="button" className="sa-btn sa-btn-outline" onClick={handleEdit}>
              <FiEdit2 /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <form className="sa-memdash-account-form" onSubmit={handleSave}>
            <div className="sa-memdash-account-grid">
              <div className="sa-memdash-account-field">
                <label className="sa-memdash-account-label">Name</label>
                <input
                  className="sa-memdash-account-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="sa-memdash-account-field">
                <label className="sa-memdash-account-label">Member Code (read-only)</label>
                <input
                  className="sa-memdash-account-input"
                  value={profile?.memberCode ?? ""}
                  readOnly
                  disabled
                  style={{ background: "#f8fafc", cursor: "default" }}
                />
              </div>
              <div className="sa-memdash-account-field">
                <label className="sa-memdash-account-label">Email</label>
                <input
                  className="sa-memdash-account-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="sa-memdash-account-field">
                <label className="sa-memdash-account-label">Mobile</label>
                <input
                  className="sa-memdash-account-input"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: sanitizePhone(e.target.value) })}
                  inputMode="numeric"
                />
              </div>
              <div className="sa-memdash-account-field sa-memdash-account-field-full">
                <label className="sa-memdash-account-label">Company Name</label>
                <input
                  className="sa-memdash-account-input"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
            </div>
            {formErr && <p className="sa-form-error">{formErr}</p>}
            <div className="sa-memdash-account-actions">
              <button type="button" className="sa-btn sa-btn-outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="sa-btn sa-btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="sa-memdash-account-details">
            <div className="sa-memdash-account-detail-row">
              <div className="sa-memdash-account-detail-item">
                <span className="sa-memdash-detail-label">Mobile Number</span>
                <span className="sa-memdash-detail-value">{profile?.mobile ?? "—"}</span>
              </div>
              <div className="sa-memdash-account-detail-item">
                <span className="sa-memdash-detail-label">Email Address</span>
                <span className="sa-memdash-detail-value">{profile?.email ?? "—"}</span>
              </div>
            </div>
            <div className="sa-memdash-account-detail-row">
              <div className="sa-memdash-account-detail-item">
                <span className="sa-memdash-detail-label">Company Name</span>
                <span className="sa-memdash-detail-value">{profile?.companyName ?? "—"}</span>
              </div>
              <div className="sa-memdash-account-detail-item">
                <span className="sa-memdash-detail-label">Joined Date</span>
                <span className="sa-memdash-detail-value">{formatDate(profile?.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
