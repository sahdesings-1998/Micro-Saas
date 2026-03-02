import {
  FiGrid,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiCreditCard,
  FiLogOut,
  FiX,
  FiPackage,
  FiFileText,
} from "react-icons/fi";
import "../../css/dashboard.css";

const iconMap = {
  Dashboard: FiGrid,
  Clients: FiUsers,
  Members: FiUsers,
  Reports: FiBarChart2,
  Settings: FiSettings,
  Profile: FiUser,
  Account: FiUser,
  Payments: FiCreditCard,
  Subscriptions: FiPackage,
  Invoices: FiFileText,
};

const Sidebar = ({ menuItems, activeItem, onMenuSelect, isOpen, onClose }) => {
  return (
    <>
      <div
        className={`sa-sidebar-backdrop ${isOpen ? "sa-sidebar-backdrop-show" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sa-sidebar ${isOpen ? "sa-sidebar-open" : ""}`}>
        <div className="sa-sidebar-header">
          <div className="sa-sidebar-brand">
            <div className="sa-sidebar-logo">M</div>
            <h2 className="sa-sidebar-app-name">Micro SaaS</h2>
          </div>
          <button
            type="button"
            className="sa-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        <nav className="sa-sidebar-nav">
          {menuItems
            .filter((item) => item !== "Logout")
            .map((item) => {
              const Icon = iconMap[item] || FiGrid;
              return (
                <button
                  key={item}
                  type="button"
                  className={`sa-nav-item ${activeItem === item ? "active" : ""}`}
                  onClick={() => onMenuSelect(item)}
                >
                  <span className="sa-nav-icon">
                    <Icon />
                  </span>
                  {item}
                </button>
              );
            })}
        </nav>

        {menuItems.includes("Logout") && (
          <div className="sa-sidebar-footer">
            <button
              type="button"
              className="sa-nav-logout"
              onClick={() => onMenuSelect("Logout")}
            >
              <span className="sa-nav-icon">
                <FiLogOut />
              </span>
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
