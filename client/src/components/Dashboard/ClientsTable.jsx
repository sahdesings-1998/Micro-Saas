import "../../css/dashboard.css";

const ClientsTable = ({
  title = "Clients",
  addLabel = "Add",
  rows = [],
  showAddButton = false,
  onAdd,
  onToggleStatus,
  onSoftDelete,
  loading = false
}) => {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-topbar">
        {showAddButton ? (
          <button type="button" className="dashboard-button" onClick={onAdd}>
            {addLabel}
          </button>
        ) : null}
      </div>

      <h3 className="dashboard-subheading">{title}</h3>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile Number</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Gmail</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading...</td>
              </tr>
            ) : null}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan="6">No records found</td>
              </tr>
            ) : null}

            {!loading &&
              rows.map((row) => {
                const rowId =
                  row._id || row.userId || row.memberId || row.memberCode || row.adminCode || row.email;
                const actionId = row._id || row.userId || row.memberId || "";

                return (
                <tr key={rowId}>
                  <td>{row.name}</td>
                  <td>{row.mobile || "-"}</td>
                  <td>{row.isActive ? "Active" : "Inactive"}</td>
                  <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td>{row.email}</td>
                  <td>
                    <div className="dashboard-table-actions">
                      <button
                        type="button"
                        className="dashboard-button dashboard-button-sm"
                        onClick={() => onToggleStatus(actionId)}
                        disabled={!actionId}
                      >
                        {row.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="dashboard-button-secondary dashboard-button-sm"
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
    </section>
  );
};

export default ClientsTable;
