import "../../css/dashboard.css";

const Sidebar = ({ menuItems, activeItem, onMenuSelect, isOpen, onClose }) => {
  return (
    <>
      <div
        className={`dashboard-sidebar-backdrop ${isOpen ? "dashboard-sidebar-backdrop-show" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`dashboard-sidebar ${isOpen ? "dashboard-sidebar-open" : ""}`}>
      <div className="dashboard-sidebar-brand">
        <h2 className="dashboard-heading">Menu</h2>
        <button
          type="button"
          className="dashboard-sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          X
        </button>
      </div>

      <nav className="dashboard-menu">
        {menuItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`dashboard-menu-item ${activeItem === item ? "active" : ""}`}
            onClick={() => onMenuSelect(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      </aside>
    </>
  );
};

export default Sidebar;
