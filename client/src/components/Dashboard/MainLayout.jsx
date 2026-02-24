import { useState } from "react";
import Sidebar from "./Sidebar";
import "../../css/dashboard.css";

const MainLayout = ({ menuItems, activeItem, onMenuSelect, title, brandTitle, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuSelect = (item) => {
    onMenuSelect(item);
    setSidebarOpen(false);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        menuItems={menuItems}
        activeItem={activeItem}
        onMenuSelect={handleMenuSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="dashboard-content">
        <div className="dashboard-content-header">
          <button
            type="button"
            className="dashboard-mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>
          <h2 className="dashboard-brand-title">{brandTitle}</h2>
          <h1 className="dashboard-heading">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
