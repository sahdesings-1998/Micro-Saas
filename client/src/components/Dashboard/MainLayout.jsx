import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "./Sidebar";
import "../../css/dashboard.css";

const MainLayout = ({
  menuItems,
  activeItem,
  onMenuSelect,
  title,
  role,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuSelect = (item) => {
    onMenuSelect(item);
    setSidebarOpen(false);
  };

  return (
    <div className="sa-layout">
      <Sidebar
        menuItems={menuItems}
        activeItem={activeItem}
        onMenuSelect={handleMenuSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="sa-main">
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <button
              type="button"
              className="sa-mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu />
            </button>
            <h1 className="sa-topbar-title">{title}</h1>
          </div>
          <div className="sa-topbar-right">
            <span className="sa-role-badge">{role}</span>
            <button
              type="button"
              className="sa-topbar-logout"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="sa-page">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
