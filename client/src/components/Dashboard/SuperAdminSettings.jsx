import { useCallback, useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import DashboardModal from "./DashboardModal";
import * as ds from "../../services/dashboardService";
import "../../css/dashboard.css";

const SuperAdminSettings = ({ onAddSuperAdmin, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [editFormErr, setEditFormErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateTargetId, setDeactivateTargetId] = useState(null);

  const loadSuperAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ds.getAllSuperAdmins();
      setSuperAdmins(data?.superAdmins || data || []);
    } catch {
      setSuperAdmins([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSuperAdmins();
  }, [loadSuperAdmins]);

  useEffect(() => {
    if (typeof onRefresh === "function") {
      onRefresh(loadSuperAdmins);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onRefresh is a ref setter, omit to avoid loops
  }, [loadSuperAdmins]);

  const handleEdit = (sa) => {
    setEditingId(sa._id);
    setEditForm({
      name: sa.name || "",
      email: sa.email || "",
      mobile: sa.mobile || "",
      password: "",
    });
    setEditFormErr("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.name?.trim()) { setEditFormErr("Name is required"); return; }
    if (!editForm.email?.trim()) { setEditFormErr("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(editForm.email)) { setEditFormErr("Invalid email"); return; }
    if (editForm.password && editForm.password.length < 6) { setEditFormErr("Password must be at least 6 characters"); return; }

    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        mobile: (editForm.mobile || "").replace(/[^0-9]/g, ""),
      };
      if (editForm.password?.trim()) payload.password = editForm.password;
      await ds.updateSuperAdmin(editingId, payload);
      setEditingId(null);
      setEditForm({ name: "", email: "", mobile: "", password: "" });
      loadSuperAdmins();
    } catch (ex) {
      setEditFormErr(ex?.response?.data?.message || "Failed to update");
    }
  };

  const handleDeactivate = (id) => {
    setDeactivateTargetId(id);
    setShowDeactivateConfirm(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTargetId) return;
    try {
      await ds.softDeleteSuperAdmin(deactivateTargetId);
      setShowDeactivateConfirm(false);
      setDeactivateTargetId(null);
      loadSuperAdmins();
    } catch { /* silent */ }
  };

  return (
    <div className="sa-panel">
      <div className="sa-panel-header">
        <h3 className="sa-panel-title">Super Admins</h3>
        <button type="button" className="sa-btn sa-btn-primary" onClick={onAddSuperAdmin}>
          + Add Super Admin
        </button>
      </div>
      <div className="sa-panel-body">
        {loading ? (
          <p className="sa-empty">Loading...</p>
        ) : superAdmins.length === 0 ? (
          <p className="sa-empty">No Super Admins found.</p>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {superAdmins.map((sa) => (
                  <tr key={sa._id}>
                    <td>{sa.name ?? "—"}</td>
                    <td>{sa.email ?? "—"}</td>
                    <td>{sa.role ?? "Super Admin"}</td>
                    <td>
                      <span className={`sa-badge ${sa.isActive ? "sa-badge-active" : "sa-badge-inactive"}`}>
                        {sa.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="sa-table-actions">
                        {sa.isActive && (
                          <>
                            <button
                              type="button"
                              className="sa-btn sa-btn-outline sa-btn-sm"
                              onClick={() => handleEdit(sa)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="sa-btn sa-btn-danger sa-btn-sm"
                              onClick={() => handleDeactivate(sa._id)}
                              title="Deactivate"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DashboardModal
        open={editingId !== null}
        title="Edit Super Admin"
        onClose={() => { setEditingId(null); setEditFormErr(""); }}
        size="form"
      >
        <form className="sa-form" onSubmit={handleUpdate}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Name</label>
              <input
                className="sa-form-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Email</label>
              <input
                className="sa-form-input"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Mobile</label>
              <input
                className="sa-form-input"
                value={editForm.mobile}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value.replace(/[^0-9]/g, "") })}
                inputMode="numeric"
              />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">New Password (optional)</label>
              <input
                className="sa-form-input"
                type={showPw ? "text" : "password"}
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>
          {editFormErr && <p className="sa-form-error">{editFormErr}</p>}
          <div className="sa-form-actions">
            <button type="button" className="sa-btn sa-btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary">Update</button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={showDeactivateConfirm}
        title="Deactivate Super Admin"
        onClose={() => { setShowDeactivateConfirm(false); setDeactivateTargetId(null); }}
      >
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          Are you sure you want to deactivate this Super Admin?
        </p>
        <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={() => { setShowDeactivateConfirm(false); setDeactivateTargetId(null); }}>Cancel</button>
          <button type="button" className="sa-btn sa-btn-danger" onClick={confirmDeactivate}>Confirm</button>
        </div>
      </DashboardModal>
    </div>
  );
};

export default SuperAdminSettings;
