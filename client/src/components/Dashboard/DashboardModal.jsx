import "../../css/dashboard.css";

const DashboardModal = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="dashboard-modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-modal-header">
          <h3 className="dashboard-form-title">{title}</h3>
          <button
            type="button"
            className="dashboard-button-secondary dashboard-button-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            x
          </button>
        </div>
        <div className="dashboard-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default DashboardModal;


