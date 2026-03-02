import { FiX, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import "../../css/dashboard.css";

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const MemberDetailsModal = ({
  open,
  member,
  memberInvoices = [],
  onClose,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onToggleInvoiceStatus,
}) => {
  if (!open) return null;

  const m = member || {};
  const invoices = Array.isArray(memberInvoices) ? memberInvoices : [];

  return (
    <div className="sa-modal-overlay sa-modal-no-close" aria-hidden="true">
      <div className="sa-modal sa-modal-member-details" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3 className="sa-modal-title">Member Details</h3>
          <button type="button" className="sa-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="sa-modal-body sa-modal-scroll">
          {/* Profile Header Card */}
          <div className="sa-member-profile-header">
            <div className="sa-member-profile-main">
              <h2 className="sa-member-profile-name">{m.name ?? "—"}</h2>
              {/* <p className="sa-member-profile-code">{m.memberCode ?? "—"}</p> */}
            </div>
            <span className={`sa-badge sa-badge-status ${m.isActive ? "sa-badge-active" : "sa-badge-inactive"}`}>
              {m.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Details Grid */}
          <div className="sa-member-details-grid">
            <div className="sa-member-detail-card">
              <span className="sa-member-detail-label">Mobile Number</span>
              <span className="sa-member-detail-value">{m.mobile ?? m.phone ?? "—"}</span>
            </div>
            <div className="sa-member-detail-card">
              <span className="sa-member-detail-label">Email Address</span>
              <span className="sa-member-detail-value">{m.email ?? "—"}</span>
            </div>
            <div className="sa-member-detail-card">
              <span className="sa-member-detail-label">Company Name</span>
              <span className="sa-member-detail-value">{m.companyName ?? "—"}</span>
            </div>
            <div className="sa-member-detail-card">
              <span className="sa-member-detail-label">Join Date</span>
              <span className="sa-member-detail-value">{formatDate(m.createdAt)}</span>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="sa-member-invoices-section">
            <div className="sa-member-invoices-header">
              <h4 className="sa-member-invoices-title">Member Invoices</h4>
              {onAddInvoice && (
                <button type="button" className="sa-btn sa-btn-primary sa-btn-sm" onClick={() => onAddInvoice(m)}>
                  <FiPlus /> Create Invoice
                </button>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="sa-member-invoices-empty">
                <p>No invoices found for this member.</p>
                {onAddInvoice && (
                  <button type="button" className="sa-btn sa-btn-outline" onClick={() => onAddInvoice(m)}>
                    <FiPlus /> Create First Invoice
                  </button>
                )}
              </div>
            ) : (
              <div className="sa-member-invoices-table-wrapper">
                <table className="sa-member-invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Member Code</th>
                      <th>Plan Name</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id ?? inv.invoiceNumber}>
                        <td>{inv.invoiceNumber ?? "—"}</td>
                        <td>{inv.memberCode ?? inv.memberId?.memberCode ?? m.memberCode ?? "—"}</td>
                        <td>{inv.planName ?? inv.subscriptionPlanId?.planName ?? "—"}</td>
                        <td>${inv.amount ?? 0}</td>
                        <td>
                          <span className={`sa-badge sa-badge-invoice-status ${(inv.status || "").toLowerCase() === "paid" ? "sa-badge-paid" : "sa-badge-unpaid"}`}>
                            {inv.status ?? "Unpaid"}
                          </span>
                        </td>
                        <td>{formatDate(inv.invoiceDate || inv.date)}</td>
                        <td>{formatDate(inv.dueDate)}</td>
                        <td>
                          <div className="sa-member-invoice-actions">
                            {(inv.status || "").toLowerCase() !== "paid" && onToggleInvoiceStatus && (
                              <button
                                type="button"
                                className="sa-btn sa-btn-outline sa-btn-sm"
                                onClick={() => onToggleInvoiceStatus(inv._id)}
                                title="Mark as Paid"
                                aria-label="Mark invoice as paid"
                              >
                                Mark as Paid
                              </button>
                            )}
                            {onEditInvoice && (inv.status || "").toLowerCase() !== "paid" && (
                              <button
                                type="button"
                                className="sa-btn-icon sa-btn-icon-edit"
                                onClick={() => onEditInvoice(inv._id)}
                                title="Edit"
                                aria-label="Edit invoice"
                              >
                                <FiEdit2 />
                              </button>
                            )}
                            {onDeleteInvoice && (
                              <button
                                type="button"
                                className="sa-btn-icon sa-btn-icon-delete"
                                onClick={() => onDeleteInvoice(inv._id)}
                                title="Delete"
                                aria-label="Delete invoice"
                              >
                                <FiTrash2 />
                              </button>
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

          {/* <div className="sa-modal-actions">
            <button type="button" className="sa-btn sa-btn-primary" onClick={onClose}>
              Close
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsModal;
