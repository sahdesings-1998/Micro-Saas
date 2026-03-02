import { FiX } from "react-icons/fi";
import "../../css/dashboard.css";

const DashboardModal = ({ open, title, onClose, children, size }) => {
  if (!open) return null;

  const modalClass = size === "form" ? "sa-modal sa-modal-form" : "sa-modal";

  return (
    <div className="sa-modal-overlay" aria-hidden="true">
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3 className="sa-modal-title">{title}</h3>
          <button
            type="button"
            className="sa-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
        <div className="sa-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default DashboardModal;
