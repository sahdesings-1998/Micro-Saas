import "../../css/dashboard.css";

const ReportsSection = ({ reportRows = [], filterDate, onFilterDateChange, loading = false }) => {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-topbar">
        <input
          type="date"
          className="dashboard-input"
          value={filterDate}
          onChange={(e) => onFilterDateChange(e.target.value)}
        />
      </div>

      <div className="dashboard-graph">
        <h3 className="dashboard-subheading">Revenue Graph</h3>
        <div className="dashboard-graph-bars">
          <div className="dashboard-bar bar-1" />
          <div className="dashboard-bar bar-2" />
          <div className="dashboard-bar bar-3" />
          <div className="dashboard-bar bar-4" />
        </div>
      </div>

      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Users</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3">Loading...</td>
              </tr>
            ) : null}

            {!loading && reportRows.length === 0 ? (
              <tr>
                <td colSpan="3">No report data found</td>
              </tr>
            ) : null}

            {!loading &&
              reportRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.totalUsers}</td>
                  <td>{`$${Number(row.totalRevenue || 0).toFixed(2)}`}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReportsSection;
