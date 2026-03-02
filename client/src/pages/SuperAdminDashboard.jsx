import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/Dashboard/MainLayout";
import DashboardCards from "../components/Dashboard/DashboardCards";
import ClientsChart from "../components/Dashboard/ClientsChart";
import ClientsTable from "../components/Dashboard/ClientsTable";
import ClientDetailsModal from "../components/Dashboard/ClientDetailsModal";
import SuperAdminReportsSection from "../components/Dashboard/SuperAdminReportsSection";
import SuperAdminSettings from "../components/Dashboard/SuperAdminSettings";
import DashboardModal from "../components/Dashboard/DashboardModal";
import * as ds from "../services/dashboardService";
import "../css/dashboard.css";

const MENU = ["Dashboard", "Clients", "Reports", "Settings", "Logout"];

const sanitizePhone = (val) => String(val || "").replace(/[^0-9]/g, "");

const validateForm = (f) => {
  if (!f.name?.trim()) return "Name is required";
  if (!f.email?.trim()) return "Email is required";
  if (!/\S+@\S+\.\S+/.test(f.email)) return "Invalid email";
  if (f.password?.length < 6) return "Password must be at least 6 characters";
  return "";
};

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("Dashboard");

  const [stats, setStats] = useState(null);
  const [clientsByMonth, setClientsByMonth] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", mobile: "" });
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminFormErr, setAdminFormErr] = useState("");

  const [showAddSuperAdmin, setShowAddSuperAdmin] = useState(false);
  const [saForm, setSaForm] = useState({ name: "", email: "", password: "", mobile: "" });
  const [showSaPw, setShowSaPw] = useState(false);
  const [saFormErr, setSaFormErr] = useState("");

  const [showLogout, setShowLogout] = useState(false);
  const [viewClientId, setViewClientId] = useState(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null);
  const [statusConfirmAction, setStatusConfirmAction] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const settingsRefreshRef = useRef(null);

  const loadStats = async () => {
    try {
      const { data } = await ds.getSuperAdminStats();
      setStats(data);
    } catch { /* silent */ }
  };

  const loadClientsByMonth = async () => {
    try {
      const { data } = await ds.getSuperAdminClientsByMonth();
      setClientsByMonth(data?.months || []);
    } catch { /* silent */ }
  };

  const loadAdmins = async () => {
    setAdminsLoading(true);
    try {
      const { data } = await ds.getSuperAdminAdmins();
      setAdmins(data.admins || data || []);
    } catch { /* silent */ }
    setAdminsLoading(false);
  };

  useEffect(() => { loadStats(); loadClientsByMonth(); }, []);
  useEffect(() => {
    if (activeItem === "Dashboard") {
      loadStats();
      loadClientsByMonth();
    }
  }, [activeItem]);
  useEffect(() => {
    if (activeItem === "Clients") loadAdmins();
  }, [activeItem]);

  const handleMenu = (item) => {
    if (item === "Logout") { setShowLogout(true); return; }
    setActiveItem(item);
  };

  const confirmLogout = () => { logout(); navigate("/login"); };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const err = validateForm({ ...adminForm, password: adminForm.password || "x" });
    if (err && !adminForm.password) { setAdminFormErr("Password is required"); return; }
    if (err) { setAdminFormErr(err); return; }
    try {
      await ds.createAdmin(adminForm);
      setShowAddAdmin(false);
      setAdminForm({ name: "", email: "", password: "", mobile: "" });
      setAdminFormErr("");
      loadAdmins();
      loadStats();
    } catch (ex) {
      setAdminFormErr(ex.response?.data?.message || "Failed to create admin");
    }
  };

  const handleToggleAdmin = (id, row) => {
    const isActive = row?.isActive !== false;
    setStatusConfirmTarget(id);
    setStatusConfirmAction(isActive ? "deactivate" : "activate");
    setShowStatusConfirm(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusConfirmTarget) return;
    try {
      await ds.toggleAdminStatus(statusConfirmTarget);
      setShowStatusConfirm(false);
      setStatusConfirmTarget(null);
      setStatusConfirmAction(null);
      loadAdmins();
      loadStats();
    } catch { /* silent */ }
  };

  const handleStatusCancel = () => {
    setShowStatusConfirm(false);
    setStatusConfirmTarget(null);
    setStatusConfirmAction(null);
  };

  const openDeleteAdmin = (id) => { setDeleteTarget(id); setDeleteReason(""); };
  const handleDeleteAdmin = async () => {
    if (!deleteReason?.trim()) return;
    try {
      await ds.softDeleteAdmin(deleteTarget, { reason: deleteReason });
      setDeleteTarget(null);
      setDeleteReason("");
      loadAdmins();
      loadStats();
    } catch { /* silent */ }
  };

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    const err = validateForm(saForm);
    if (err) { setSaFormErr(err); return; }
    try {
      await ds.createSuperAdmin(saForm);
      setShowAddSuperAdmin(false);
      setSaForm({ name: "", email: "", password: "", mobile: "" });
      setSaFormErr("");
      settingsRefreshRef.current?.();
    } catch (ex) {
      setSaFormErr(ex.response?.data?.message || "Failed to create super admin");
    }
  };

  const cards = stats
    ? [
        { label: "Total Clients", value: stats.totalClients ?? 0 },
        { label: "Active Clients", value: stats.activeClients ?? 0 },
        { label: "Inactive Clients", value: stats.inactiveClients ?? 0 },
      ]
    : [];

  const renderContent = () => {
    switch (activeItem) {
      case "Dashboard":
        return (
          <>
            <DashboardCards cards={cards} />
            <div className="sa-panel sa-revenue-chart-panel">
              <h3 className="sa-panel-title">Clients Added Over Time</h3>
              <p className="sa-revenue-chart-subtitle">New clients per month</p>
              <ClientsChart data={clientsByMonth} />
            </div>
          </>
        );

      case "Clients":
        return (
          <ClientsTable
            title="Admin Accounts"
            addLabel="+ Add Admin"
            rows={admins}
            showAddButton
            onAdd={() => { setShowAddAdmin(true); setAdminFormErr(""); }}
            onView={(row) => setViewClientId(row._id || row.userId)}
            onToggleStatus={handleToggleAdmin}
            onSoftDelete={openDeleteAdmin}
            loading={adminsLoading}
          />
        );

      case "Reports":
        return <SuperAdminReportsSection />;

      case "Settings":
        return (
          <SuperAdminSettings
            onAddSuperAdmin={() => { setShowAddSuperAdmin(true); setSaFormErr(""); }}
            onRefresh={(fn) => { settingsRefreshRef.current = fn; }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout
      menuItems={MENU}
      activeItem={activeItem}
      onMenuSelect={handleMenu}
      title={activeItem}
      role={user?.role || "superadmin"}
      onLogout={() => setShowLogout(true)}
    >
      {renderContent()}

      <ClientDetailsModal
        open={Boolean(viewClientId)}
        adminId={viewClientId}
        onClose={() => setViewClientId(null)}
      />

      <DashboardModal open={showAddAdmin} title="Add New Admin" onClose={() => setShowAddAdmin(false)} size="form">
        <form className="sa-form" onSubmit={handleCreateAdmin}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Name</label>
              <input className="sa-form-input" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} required />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Email</label>
              <input className="sa-form-input" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} required />
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Password</label>
              <div className="sa-form-pw-wrap">
                <input className="sa-form-input" type={showAdminPw ? "text" : "password"} value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required />
                <button type="button" className="sa-form-pw-toggle" onClick={() => setShowAdminPw((v) => !v)}>{showAdminPw ? <FiEyeOff /> : <FiEye />}</button>
              </div>
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Mobile</label>
              <input className="sa-form-input" value={adminForm.mobile} onChange={(e) => setAdminForm({ ...adminForm, mobile: sanitizePhone(e.target.value) })} inputMode="numeric" />
            </div>
          </div>
          {adminFormErr && <p className="sa-form-error">{adminFormErr}</p>}
          <div className="sa-form-actions">
            <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowAddAdmin(false)}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary">Create Admin</button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={showAddSuperAdmin} title="Add New Super Admin" onClose={() => setShowAddSuperAdmin(false)} size="form">
        <form className="sa-form" onSubmit={handleCreateSuperAdmin}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Name</label>
              <input className="sa-form-input" value={saForm.name} onChange={(e) => setSaForm({ ...saForm, name: e.target.value })} required />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Email</label>
              <input className="sa-form-input" type="email" value={saForm.email} onChange={(e) => setSaForm({ ...saForm, email: e.target.value })} required />
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Password</label>
              <div className="sa-form-pw-wrap">
                <input className="sa-form-input" type={showSaPw ? "text" : "password"} value={saForm.password} onChange={(e) => setSaForm({ ...saForm, password: e.target.value })} required />
                <button type="button" className="sa-form-pw-toggle" onClick={() => setShowSaPw((v) => !v)}>{showSaPw ? <FiEyeOff /> : <FiEye />}</button>
              </div>
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Mobile</label>
              <input className="sa-form-input" value={saForm.mobile} onChange={(e) => setSaForm({ ...saForm, mobile: sanitizePhone(e.target.value) })} inputMode="numeric" />
            </div>
          </div>
          {saFormErr && <p className="sa-form-error">{saFormErr}</p>}
          <div className="sa-form-actions">
            <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowAddSuperAdmin(false)}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary">Create Super Admin</button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={showStatusConfirm} title={statusConfirmAction === "activate" ? "Activate Client" : "Deactivate Client"} onClose={handleStatusCancel}>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          {statusConfirmAction === "activate"
            ? "Are you sure you want to activate this client?"
            : "Are you sure you want to deactivate this client?"}
        </p>
        <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={handleStatusCancel}>Cancel</button>
          <button type="button" className="sa-btn sa-btn-primary" onClick={handleStatusConfirm}>Confirm</button>
        </div>
      </DashboardModal>

      <DashboardModal open={deleteTarget !== null} title="Delete Admin" onClose={() => { setDeleteTarget(null); setDeleteReason(""); }}>
        <div className="sa-form">
          <p style={{ color: "#64748b", fontSize: 14 }}>This will deactivate the admin account. Please provide a reason.</p>
          <div className="sa-form-field">
            <label className="sa-form-label">Reason</label>
            <textarea className="sa-form-textarea" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="Enter deletion reason..." />
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-btn sa-btn-outline" onClick={() => { setDeleteTarget(null); setDeleteReason(""); }}>Cancel</button>
            <button type="button" className="sa-btn sa-btn-danger" onClick={handleDeleteAdmin} disabled={!deleteReason?.trim()}>Confirm Delete</button>
          </div>
        </div>
      </DashboardModal>

      <DashboardModal open={showLogout} title="Confirm Logout" onClose={() => setShowLogout(false)}>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>Are you sure you want to logout?</p>
        <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowLogout(false)}>Cancel</button>
          <button type="button" className="sa-btn sa-btn-danger" onClick={confirmLogout}>Yes, Logout</button>
        </div>
      </DashboardModal>
    </MainLayout>
  );
};

export default SuperAdminDashboard;
