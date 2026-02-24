import "../css/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Dashboard/MainLayout";
import DashboardModal from "../components/Dashboard/DashboardModal";
import { useAuth } from "../context/AuthContext";
import { getMemberProfile } from "../services/dashboardService";

const MemberDashboard = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = useMemo(
    () => ["Dashboard", "Profile", "Logout"],
    []
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data } = await getMemberProfile();
        setProfile(data.member || null);
      } catch (error) {
        console.error("Failed to load member profile", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleMenuSelect = (item) => {
    if (item === "Logout") {
      setShowLogoutConfirm(true);
      return;
    }
    setActiveItem(item);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    if (loadingProfile) {
      return <div className="dashboard-empty">Loading profile...</div>;
    }

    if (!profile) {
      return <div className="dashboard-empty">Profile data not available</div>;
    }

    if (activeItem === "Dashboard" || activeItem === "Profile") {
      return (
        <section className="dashboard-section">
          <h3 className="dashboard-subheading">My Profile</h3>
          <div className="dashboard-profile-grid">
            <div className="dashboard-card-box">
              <p className="dashboard-card-title">Name</p>
              <p className="dashboard-card-value">{profile.name}</p>
            </div>
            <div className="dashboard-card-box">
              <p className="dashboard-card-title">Mobile Number</p>
              <p className="dashboard-card-value">{profile.mobile || "-"}</p>
            </div>
            <div className="dashboard-card-box">
              <p className="dashboard-card-title">Email</p>
              <p className="dashboard-card-value">{profile.email}</p>
            </div>
            <div className="dashboard-card-box">
              <p className="dashboard-card-title">Status</p>
              <p className="dashboard-card-value">{profile.isActive ? "Active" : "Inactive"}</p>
            </div>
            <div className="dashboard-card-box">
              <p className="dashboard-card-title">Created Date</p>
              <p className="dashboard-card-value">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>
      );
    }

    return <div className="dashboard-empty">No data</div>;
  };

  return (
    <MainLayout
      menuItems={menuItems}
      activeItem={activeItem}
      onMenuSelect={handleMenuSelect}
      title={activeItem}
      brandTitle="Member Dashboard"
    >
      <DashboardModal
        open={showLogoutConfirm}
        title="Confirm Logout"
        onClose={() => setShowLogoutConfirm(false)}
      >
        <div className="dashboard-empty">
          <p className="dashboard-form-title">Are you sure you want to logout?</p>
        </div>
        <div className="dashboard-form-actions">
          <button type="button" className="dashboard-button" onClick={handleConfirmLogout}>
            Yes, Logout
          </button>
          <button
            type="button"
            className="dashboard-button-secondary"
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </DashboardModal>
      {renderContent()}
    </MainLayout>
  );
};

export default MemberDashboard;
