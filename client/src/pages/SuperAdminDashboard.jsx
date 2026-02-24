import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import MainLayout from "../components/Dashboard/MainLayout";
import DashboardModal from "../components/Dashboard/DashboardModal";
import DashboardCards from "../components/Dashboard/DashboardCards";
import ClientsTable from "../components/Dashboard/ClientsTable";
import ReportsSection from "../components/Dashboard/ReportsSection";
import "../css/dashboard.css";
import { useAuth } from "../context/AuthContext";
import {
  createAdmin,
  createSuperAdmin,
  getSuperAdminAdmins,
  getSuperAdminReports,
  getSuperAdminStats,
  softDeleteAdmin,
  toggleAdminStatus
} from "../services/dashboardService";

const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);

const validateUserForm = ({ name, email, password, mobile }) => {
  if (!name.trim()) return "Name is required";
  if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return "Valid email is required";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  if (mobile && mobile.length !== 10) return "Mobile number must be 10 digits";
  return "";
};

const SuperAdminDashboard = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalMembers: 0,
    totalRevenue: 0
  });
  const [admins, setAdmins] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [reportDate, setReportDate] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminError, setCreateAdminError] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [deleteAdminState, setDeleteAdminState] = useState({
    show: false,
    adminId: "",
    reason: "",
    error: "",
    submitting: false
  });
  const [showCreateSuperAdmin, setShowCreateSuperAdmin] = useState(false);
  const [creatingSuperAdmin, setCreatingSuperAdmin] = useState(false);
  const [createSuperAdminError, setCreateSuperAdminError] = useState("");
  const [createSuperAdminSuccess, setCreateSuperAdminSuccess] = useState("");
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: ""
  });
  const [superAdminForm, setSuperAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: ""
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = useMemo(
    () => ["Dashboard", "Clients", "Reports", "Settings", "Logout"],
    []
  );

  const cards = [
    { label: "Total Clients", value: String(stats.totalClients) },
    { label: "Active Clients", value: String(stats.activeClients) },
    { label: "Total Members", value: String(stats.totalMembers) },
    { label: "Total Revenue", value: `$${Number(stats.totalRevenue || 0).toFixed(2)}` }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const { data } = await getSuperAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load super admin stats", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (activeItem !== "Clients") return;

    const fetchAdmins = async () => {
      try {
        setLoadingAdmins(true);
        const { data } = await getSuperAdminAdmins();
        setAdmins(data.admins || []);
      } catch (error) {
        console.error("Failed to load admins", error);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, [activeItem]);

  useEffect(() => {
    if (activeItem !== "Reports") return;

    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const { data } = await getSuperAdminReports(reportDate);
        setReportRows(data.rows || []);
      } catch (error) {
        console.error("Failed to load super admin reports", error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [activeItem, reportDate]);

  const handleToggleAdminStatus = async (adminId) => {
    try {
      await toggleAdminStatus(adminId);
      const { data } = await getSuperAdminAdmins();
      setAdmins(data.admins || []);
      const statsResponse = await getSuperAdminStats();
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Failed to toggle admin status", error);
    }
  };

  const handleSoftDeleteAdmin = async (adminId) => {
    setDeleteAdminState({
      show: true,
      adminId,
      reason: "",
      error: "",
      submitting: false
    });
  };

  const handleDeleteAdminReasonChange = (e) => {
    setDeleteAdminState((prev) => ({ ...prev, reason: e.target.value, error: "" }));
  };

  const handleCancelDeleteAdmin = () => {
    setDeleteAdminState({
      show: false,
      adminId: "",
      reason: "",
      error: "",
      submitting: false
    });
  };

  const handleConfirmSoftDeleteAdmin = async (e) => {
    e.preventDefault();

    if (!deleteAdminState.reason.trim()) {
      setDeleteAdminState((prev) => ({ ...prev, error: "Deletion reason is required" }));
      return;
    }

    try {
      setDeleteAdminState((prev) => ({ ...prev, submitting: true, error: "" }));
      await softDeleteAdmin(deleteAdminState.adminId, { reason: deleteAdminState.reason.trim() });
      const [adminsResponse, statsResponse] = await Promise.all([
        getSuperAdminAdmins(),
        getSuperAdminStats()
      ]);
      setAdmins(adminsResponse.data.admins || []);
      setStats(statsResponse.data);
      handleCancelDeleteAdmin();
    } catch (error) {
      setDeleteAdminState((prev) => ({
        ...prev,
        submitting: false,
        error: error.response?.data?.message || "Failed to soft delete admin"
      }));
    }
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: name === "mobile" ? sanitizePhone(value) : value }));
    setCreateAdminError("");
  };

  const handleSuperAdminFormChange = (e) => {
    const { name, value } = e.target;
    setSuperAdminForm((prev) => ({ ...prev, [name]: name === "mobile" ? sanitizePhone(value) : value }));
    setCreateSuperAdminError("");
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateAdminError("");
    const validationError = validateUserForm(adminForm);
    if (validationError) {
      setCreateAdminError(validationError);
      return;
    }

    try {
      setCreatingAdmin(true);
      await createAdmin(adminForm);
      setAdminForm({ name: "", email: "", password: "", mobile: "" });
      setShowCreateAdmin(false);

      const [adminsResponse, statsResponse] = await Promise.all([
        getSuperAdminAdmins(),
        getSuperAdminStats()
      ]);
      setAdmins(adminsResponse.data.admins || []);
      setStats(statsResponse.data);
    } catch (error) {
      setCreateAdminError(error.response?.data?.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setCreateSuperAdminError("");
    setCreateSuperAdminSuccess("");
    const validationError = validateUserForm(superAdminForm);
    if (validationError) {
      setCreateSuperAdminError(validationError);
      return;
    }

    try {
      setCreatingSuperAdmin(true);
      await createSuperAdmin(superAdminForm);
      setSuperAdminForm({ name: "", email: "", password: "", mobile: "" });
      setShowCreateSuperAdmin(false);
      setCreateSuperAdminSuccess("Super Admin account created successfully");
    } catch (error) {
      setCreateSuperAdminError(error.response?.data?.message || "Failed to create super admin");
    } finally {
      setCreatingSuperAdmin(false);
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
      if (loadingStats) {
        return <div className="dashboard-empty">Loading dashboard...</div>;
      }
      return <DashboardCards cards={cards} />;
    }
    if (activeItem === "Clients") {
      return (
        <ClientsTable
          title="Admins"
          addLabel="Add Admin"
          rows={admins}
          showAddButton
          onAdd={() => {
            setCreateAdminError("");
            setShowCreateAdmin(true);
          }}
          onToggleStatus={handleToggleAdminStatus}
          onSoftDelete={handleSoftDeleteAdmin}
          loading={loadingAdmins}
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
      return (
        <section className="dashboard-section">
          <div className="dashboard-section-topbar">
            <button
              type="button"
              className="dashboard-button"
              onClick={() => {
                setCreateSuperAdminError("");
                setShowCreateSuperAdmin(true);
              }}
            >
              Add Super Admin
            </button>
          </div>
          {createSuperAdminSuccess ? (
            <p className="dashboard-success-text">{createSuperAdminSuccess}</p>
          ) : null}
          <div className="dashboard-empty">Use this section to manage Super Admin access.</div>
        </section>
      );
    }
    return null;
  };

  return (
    <MainLayout
      menuItems={menuItems}
      activeItem={activeItem}
      onMenuSelect={handleMenuSelect}
      title={activeItem}
      brandTitle="Super Admin Dashboard"
    >
      <DashboardModal
        open={activeItem === "Clients" && showCreateAdmin}
        title="Create Admin"
        onClose={() => setShowCreateAdmin(false)}
      >
          <form className="dashboard-form-grid" onSubmit={handleCreateAdmin}>
            <input
              className="dashboard-input"
              name="name"
              placeholder="Name"
              value={adminForm.name}
              onChange={handleAdminFormChange}
              required
            />
            <input
              className="dashboard-input"
              name="email"
              type="email"
              placeholder="Email"
              value={adminForm.email}
              onChange={handleAdminFormChange}
              required
            />
            <div className="dashboard-password-wrapper">
              <input
                className="dashboard-input"
                name="password"
                type={showAdminPassword ? "text" : "password"}
                placeholder="Password"
                value={adminForm.password}
                onChange={handleAdminFormChange}
                required
              />
              <button
                type="button"
                className="dashboard-password-toggle"
                onClick={() => setShowAdminPassword((prev) => !prev)}
                aria-label={showAdminPassword ? "Hide password" : "Show password"}
              >
                {showAdminPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <input
              className="dashboard-input"
              name="mobile"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Mobile Number"
              value={adminForm.mobile}
              onChange={handleAdminFormChange}
            />
            {createAdminError ? <p className="dashboard-error-text">{createAdminError}</p> : null}
            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={creatingAdmin}>
                {creatingAdmin ? "Creating..." : "Create Admin"}
              </button>
              <button
                type="button"
                className="dashboard-button-secondary"
                onClick={() => setShowCreateAdmin(false)}
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
      <DashboardModal
        open={activeItem === "Settings" && showCreateSuperAdmin}
        title="Create Super Admin"
        onClose={() => setShowCreateSuperAdmin(false)}
      >
          <form className="dashboard-form-grid" onSubmit={handleCreateSuperAdmin}>
            <input
              className="dashboard-input"
              name="name"
              placeholder="Name"
              value={superAdminForm.name}
              onChange={handleSuperAdminFormChange}
              required
            />
            <input
              className="dashboard-input"
              name="email"
              type="email"
              placeholder="Email"
              value={superAdminForm.email}
              onChange={handleSuperAdminFormChange}
              required
            />
            <div className="dashboard-password-wrapper">
              <input
                className="dashboard-input"
                name="password"
                type={showSuperAdminPassword ? "text" : "password"}
                placeholder="Password"
                value={superAdminForm.password}
                onChange={handleSuperAdminFormChange}
                required
              />
              <button
                type="button"
                className="dashboard-password-toggle"
                onClick={() => setShowSuperAdminPassword((prev) => !prev)}
                aria-label={showSuperAdminPassword ? "Hide password" : "Show password"}
              >
                {showSuperAdminPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <input
              className="dashboard-input"
              name="mobile"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Mobile Number"
              value={superAdminForm.mobile}
              onChange={handleSuperAdminFormChange}
            />
            {createSuperAdminError ? <p className="dashboard-error-text">{createSuperAdminError}</p> : null}
            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={creatingSuperAdmin}>
                {creatingSuperAdmin ? "Creating..." : "Create Super Admin"}
              </button>
              <button
                type="button"
                className="dashboard-button-secondary"
                onClick={() => setShowCreateSuperAdmin(false)}
              >
                Cancel
              </button>
            </div>
          </form>
      </DashboardModal>
      {activeItem === "Clients" && deleteAdminState.show ? (
        <section className="dashboard-section">
          <h3 className="dashboard-subheading">Delete Admin (Soft Delete)</h3>
          <form className="dashboard-form-grid" onSubmit={handleConfirmSoftDeleteAdmin}>
            <textarea
              className="dashboard-textarea"
              placeholder="Enter deletion reason"
              value={deleteAdminState.reason}
              onChange={handleDeleteAdminReasonChange}
              required
            />
            {deleteAdminState.error ? (
              <p className="dashboard-error-text">{deleteAdminState.error}</p>
            ) : null}
            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={deleteAdminState.submitting}>
                {deleteAdminState.submitting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                type="button"
                className="dashboard-button-secondary"
                onClick={handleCancelDeleteAdmin}
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

export default SuperAdminDashboard;
