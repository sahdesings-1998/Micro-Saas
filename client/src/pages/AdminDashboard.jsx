import "../css/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import MainLayout from "../components/Dashboard/MainLayout";
import DashboardModal from "../components/Dashboard/DashboardModal";
import DashboardCards from "../components/Dashboard/DashboardCards";
import ClientsTable from "../components/Dashboard/ClientsTable";
import ReportsSection from "../components/Dashboard/ReportsSection";
import { useAuth } from "../context/AuthContext";
import {
  createMember,
  getAdminMembers,
  getAdminReports,
  getAdminStats,
  softDeleteMember,
  toggleMemberStatus
} from "../services/dashboardService";

const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);

const validateMemberForm = ({ name, email, password, mobile, revenue }) => {
  if (!name.trim()) return "Name is required";
  if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return "Valid email is required";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  if (mobile && mobile.length !== 10) return "Mobile number must be 10 digits";
  if (revenue && Number(revenue) < 0) return "Revenue cannot be negative";
  return "";
};

const AdminDashboard = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0
  });
  const [members, setMembers] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [reportDate, setReportDate] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [createMemberError, setCreateMemberError] = useState("");
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [deleteMemberState, setDeleteMemberState] = useState({
    show: false,
    memberId: "",
    reason: "",
    error: "",
    submitting: false
  });
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    revenue: ""
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = useMemo(
    () => ["Dashboard", "Members", "Reports", "Settings", "Logout"],
    []
  );

  const cards = [
    { label: "Total Members", value: String(stats.totalMembers) },
    { label: "Active Members", value: String(stats.activeMembers) },
    { label: "Inactive Members", value: String(stats.totalMembers - stats.activeMembers) },
    { label: "Total Revenue", value: `$${Number(stats.totalRevenue || 0).toFixed(2)}` }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const { data } = await getAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load admin stats", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (activeItem !== "Members") return;

    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const { data } = await getAdminMembers();
        setMembers(data.members || []);
      } catch (error) {
        console.error("Failed to load members", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [activeItem]);

  useEffect(() => {
    if (activeItem !== "Reports") return;

    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const { data } = await getAdminReports(reportDate);
        setReportRows(data.rows || []);
      } catch (error) {
        console.error("Failed to load admin reports", error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [activeItem, reportDate]);

  const handleToggleMemberStatus = async (memberId) => {
    try {
      await toggleMemberStatus(memberId);
      const [membersResponse, statsResponse] = await Promise.all([getAdminMembers(), getAdminStats()]);
      setMembers(membersResponse.data.members || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Failed to toggle member status", error);
    }
  };

  const handleSoftDeleteMember = async (memberId) => {
    setDeleteMemberState({
      show: true,
      memberId,
      reason: "",
      error: "",
      submitting: false
    });
  };

  const handleDeleteMemberReasonChange = (e) => {
    setDeleteMemberState((prev) => ({ ...prev, reason: e.target.value, error: "" }));
  };

  const handleCancelDeleteMember = () => {
    setDeleteMemberState({
      show: false,
      memberId: "",
      reason: "",
      error: "",
      submitting: false
    });
  };

  const handleConfirmSoftDeleteMember = async (e) => {
    e.preventDefault();

    if (!deleteMemberState.reason.trim()) {
      setDeleteMemberState((prev) => ({ ...prev, error: "Deletion reason is required" }));
      return;
    }

    try {
      setDeleteMemberState((prev) => ({ ...prev, submitting: true, error: "" }));
      await softDeleteMember(deleteMemberState.memberId, { reason: deleteMemberState.reason.trim() });
      const [membersResponse, statsResponse] = await Promise.all([getAdminMembers(), getAdminStats()]);
      setMembers(membersResponse.data.members || []);
      setStats(statsResponse.data);
      handleCancelDeleteMember();
    } catch (error) {
      setDeleteMemberState((prev) => ({
        ...prev,
        submitting: false,
        error: error.response?.data?.message || "Failed to soft delete member"
      }));
    }
  };

  const handleMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((prev) => ({
      ...prev,
      [name]: name === "mobile" ? sanitizePhone(value) : value
    }));
    setCreateMemberError("");
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setCreateMemberError("");
    const validationError = validateMemberForm(memberForm);
    if (validationError) {
      setCreateMemberError(validationError);
      return;
    }

    try {
      setCreatingMember(true);
      await createMember(memberForm);
      setMemberForm({ name: "", email: "", password: "", mobile: "", revenue: "" });
      setShowCreateMember(false);

      const [membersResponse, statsResponse] = await Promise.all([getAdminMembers(), getAdminStats()]);
      setMembers(membersResponse.data.members || []);
      setStats(statsResponse.data);
    } catch (error) {
      setCreateMemberError(error.response?.data?.message || "Failed to create member");
    } finally {
      setCreatingMember(false);
    }
  };

  const handleMenuSelect = (item) => {
    if (item === "Logout") {
      setShowLogoutConfirm(true);
      return;
    }
    setActiveItem(item);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    if (activeItem === "Dashboard") {
      if (loadingStats) return <div className="dashboard-empty">Loading dashboard...</div>;
      return <DashboardCards cards={cards} />;
    }
    if (activeItem === "Members") {
      return (
        <ClientsTable
          title="Members"
          addLabel="Add Member"
          rows={members}
          showAddButton
          onAdd={() => {
            setCreateMemberError("");
            setShowCreateMember(true);
          }}
          onToggleStatus={handleToggleMemberStatus}
          onSoftDelete={handleSoftDeleteMember}
          loading={loadingMembers}
        />
      );
    }
    if (activeItem === "Reports") {
      return (
        <ReportsSection
          reportRows={reportRows}
          filterDate={reportDate}
          onFilterDateChange={setReportDate}
          loading={loadingReports}
        />
      );
    }
    if (activeItem === "Settings") {
      return <div className="dashboard-empty">Settings content</div>;
    }
    return null;
  };

  return (
    <MainLayout
      menuItems={menuItems}
      activeItem={activeItem}
      onMenuSelect={handleMenuSelect}
      title={activeItem}
      brandTitle="Admin Dashboard"
    >
      <DashboardModal
        open={activeItem === "Members" && showCreateMember}
        title="Create Member"
        onClose={() => setShowCreateMember(false)}
      >
          <form className="dashboard-form-grid" onSubmit={handleCreateMember}>
            <input
              className="dashboard-input"
              name="name"
              placeholder="Name"
              value={memberForm.name}
              onChange={handleMemberFormChange}
              required
            />
            <input
              className="dashboard-input"
              name="email"
              type="email"
              placeholder="Email"
              value={memberForm.email}
              onChange={handleMemberFormChange}
              required
            />
            <div className="dashboard-password-wrapper">
              <input
                className="dashboard-input"
                name="password"
                type={showMemberPassword ? "text" : "password"}
                placeholder="Password"
                value={memberForm.password}
                onChange={handleMemberFormChange}
                required
              />
              <button
                type="button"
                className="dashboard-password-toggle"
                onClick={() => setShowMemberPassword((prev) => !prev)}
                aria-label={showMemberPassword ? "Hide password" : "Show password"}
              >
                {showMemberPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <input
              className="dashboard-input"
              name="mobile"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Mobile Number"
              value={memberForm.mobile}
              onChange={handleMemberFormChange}
            />
            <input
              className="dashboard-input"
              name="revenue"
              type="number"
              placeholder="Revenue (optional)"
              value={memberForm.revenue}
              onChange={handleMemberFormChange}
            />
            {createMemberError ? <p className="dashboard-error-text">{createMemberError}</p> : null}
            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={creatingMember}>
                {creatingMember ? "Creating..." : "Create Member"}
              </button>
              <button
                type="button"
                className="dashboard-button-secondary"
                onClick={() => setShowCreateMember(false)}
              >
                Cancel
              </button>
            </div>
          </form>
      </DashboardModal>
      <DashboardModal
        open={showLogoutConfirm}
        title="Confirm Logout"
        onClose={() => setShowLogoutConfirm(false)}
      >
        <div className="dashboard-empty">
          <p className="dashboard-form-title">Are you sure you want to logout?</p>
        </div>
        <div className="dashboard-form-actions">
          <button type="button" className="dashboard-button" onClick={handleConfirmLogout}>
            Yes, Logout
          </button>
          <button
            type="button"
            className="dashboard-button-secondary"
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </DashboardModal>
      {activeItem === "Members" && deleteMemberState.show ? (
        <section className="dashboard-section">
          <h3 className="dashboard-subheading">Delete Member (Soft Delete)</h3>
          <form className="dashboard-form-grid" onSubmit={handleConfirmSoftDeleteMember}>
            <textarea
              className="dashboard-textarea"
              placeholder="Enter deletion reason"
              value={deleteMemberState.reason}
              onChange={handleDeleteMemberReasonChange}
              required
            />
            {deleteMemberState.error ? (
              <p className="dashboard-error-text">{deleteMemberState.error}</p>
            ) : null}
            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={deleteMemberState.submitting}>
                {deleteMemberState.submitting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                type="button"
                className="dashboard-button-secondary"
                onClick={handleCancelDeleteMember}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}
      {renderContent()}
    </MainLayout>
  );
};

export default AdminDashboard;
