import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import * as ds from "../../services/dashboardService";
import "../../css/dashboard.css";

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const ClientDetailsModal = ({ open, adminId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !adminId) {
      setData(null);
      setError(null);
      return;
    }
    const id = String(adminId).trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    ds.getClientDetails(id)
      .then(({ data: res }) => {
        setData(res);
      })
      .catch(() => {
        setError("Unable to load client details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, adminId]);

  if (!open) return null;

  const client = data?.client || {};
  const totalMembers = data?.totalMembers ?? 0;
  const activeMembers = data?.activeMembers ?? 0;
  const inactiveMembers = data?.inactiveMembers ?? 0;
  const totalInvoices = data?.totalInvoices ?? 0;
  const paidInvoices = data?.paidInvoices ?? 0;
  const unpaidInvoices = data?.unpaidInvoices ?? 0;

  return (
    <div className="sa-modal-overlay sa-modal-no-close" aria-hidden="true">
      <div className="sa-modal sa-modal-member-details" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3 className="sa-modal-title">Client Details</h3>
          <button type="button" className="sa-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="sa-modal-body sa-modal-scroll">
          {loading ? (
            <p className="sa-empty">Loading...</p>
          ) : error ? (
            <p className="sa-form-error">{error}</p>
          ) : (
            <>
              <div className="sa-member-profile-header">
                <div className="sa-member-profile-main">
                  <h2 className="sa-member-profile-name">{client.name ?? "—"}</h2>
                  <p className="sa-member-profile-code">{client.adminCode ?? "—"}</p>
                </div>
                <span className={`sa-badge sa-badge-status ${client.isActive ? "sa-badge-active" : "sa-badge-inactive"}`}>
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="sa-member-details-grid">
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Email</span>
                  <span className="sa-member-detail-value">{client.email ?? "—"}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Mobile</span>
                  <span className="sa-member-detail-value">{client.mobile ?? "—"}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Company</span>
                  <span className="sa-member-detail-value">{client.companyName ?? "—"}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Created Date</span>
                  <span className="sa-member-detail-value">{formatDate(client.createdAt)}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Total Members</span>
                  <span className="sa-member-detail-value">{totalMembers}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Active Members</span>
                  <span className="sa-member-detail-value">{activeMembers}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Inactive Members</span>
                  <span className="sa-member-detail-value">{inactiveMembers}</span>
                </div>
                <div className="sa-member-detail-card">
                  <span className="sa-member-detail-label">Total Invoices</span>
                  <span className="sa-member-detail-value">{totalInvoices}</span>
                </div>
              </div>

              <div className="sa-member-invoices-section">
                <h4 className="sa-member-invoices-title">Invoice Summary</h4>
                <div className="sa-member-details-grid">
                  <div className="sa-member-detail-card">
                    <span className="sa-member-detail-label">Total Invoices</span>
                    <span className="sa-member-detail-value">{totalInvoices}</span>
                  </div>
                  <div className="sa-member-detail-card">
                    <span className="sa-member-detail-label">Paid Invoices</span>
                    <span className="sa-member-detail-value">{paidInvoices}</span>
                  </div>
                  <div className="sa-member-detail-card">
                    <span className="sa-member-detail-label">Unpaid Invoices</span>
                    <span className="sa-member-detail-value">{unpaidInvoices}</span>
                  </div>
                </div>
              </div>

              <div className="sa-modal-actions">
                <button type="button" className="sa-btn sa-btn-primary" onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;
