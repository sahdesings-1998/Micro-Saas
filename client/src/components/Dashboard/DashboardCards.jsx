import { FiUsers, FiUserCheck, FiUserX, FiCheck, FiClock, FiDollarSign } from "react-icons/fi";
import "../../css/dashboard.css";

const CARD_CONFIG = {
  "Member Status": { icon: FiUserCheck, description: "Your account status" },
  "Total Invoices": { icon: FiClock, description: "Total invoice count" },
  "Total Paid Amount": { icon: FiDollarSign, description: "Total amount paid" },
  "Pending Amount": { icon: FiClock, description: "Amount due" },
  "Total Members": { icon: FiUsers, description: "All registered members" },
  "Active Members": { icon: FiUserCheck, description: "Members with active status" },
  "Inactive Members": { icon: FiUserX, description: "Members with inactive status" },
  "Paid Members": { icon: FiCheck, description: "Members with completed payments" },
  "Unpaid Members": { icon: FiClock, description: "Members with pending payments" },
  "Total Revenue": { icon: FiDollarSign, description: "Total paid invoice revenue" },
  "Total Clients": { icon: FiUsers, description: "All admin/client accounts" },
  "Active Clients": { icon: FiUserCheck, description: "Clients with active status" },
  "Inactive Clients": { icon: FiUserX, description: "Clients with inactive status" },
  "Revenue": { icon: FiDollarSign, description: "Total paid invoice revenue" },
};

const DashboardCard = ({ label, value, icon: Icon, description }) => (
  <div className="sa-dashboard-card">
    <div className="sa-dashboard-card-top">
      {Icon && (
        <span className="sa-dashboard-card-icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      <p className="sa-dashboard-card-value">{value}</p>
    </div>
    <p className="sa-dashboard-card-label">{label}</p>
    {description && <p className="sa-dashboard-card-desc">{description}</p>}
  </div>
);

const DashboardCards = ({ cards = [] }) => {
  return (
    <div className="sa-cards-grid sa-dashboard-cards-grid">
      {cards.map((card) => {
        const config = CARD_CONFIG[card.label] || {};
        return (
          <DashboardCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={config.icon}
            description={config.description || ""}
          />
        );
      })}
    </div>
  );
};

export default DashboardCards;
