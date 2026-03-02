import { FiEye } from "react-icons/fi";
import "../../css/dashboard.css";

const MembersTable = ({
  title = "Members",
  addLabel = "+ Add Member",
  rows = [],
  showAddButton = false,
  onAdd,
  onView,
  onEdit,
  onSoftDelete,
  loading = false,
}) => {
  return (
    <div className="sa-panel">
      <div className="sa-panel-header">
        <h3 className="sa-panel-title">{title}</h3>
        {showAddButton && (
          <button type="button" className="sa-btn sa-btn-primary" onClick={onAdd}>
            {addLabel}
          </button>
        )}
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Member Code</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Member Status</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="sa-table-empty">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="7" className="sa-table-empty">
                  No members found
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => {
                const rowId = String(row._id || row.userId || row.memberCode || row.email || "");
                const actionId = row._id || row.userId || "";

                return (
                  <tr key={rowId}>
                    <td>{row.name}</td>
                    <td>{row.memberCode || "—"}</td>
                    <td>{row.mobile || row.phone || "—"}</td>
                    <td>{row.companyName || "—"}</td>
                    <td>
                      <span
                        className={`sa-badge ${
                          row.isActive ? "sa-badge-active" : "sa-badge-inactive"
                        }`}
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="sa-table-actions">
                        {onView && (
                          <button
                            type="button"
                            className="sa-btn sa-btn-outline sa-btn-sm"
                            onClick={() => onView(row)}
                            disabled={!actionId}
                            title="View Details"
                            aria-label="View member details"
                          >
                            <FiEye />
                          </button>
                        )}
                        <button
                          type="button"
                          className="sa-btn sa-btn-outline sa-btn-sm"
                          onClick={() => onEdit(actionId)}
                          disabled={!actionId}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-danger sa-btn-sm"
                          onClick={() => onSoftDelete(actionId)}
                          disabled={!actionId}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersTable;
