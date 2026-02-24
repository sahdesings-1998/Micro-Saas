import "../../css/dashboard.css";

const DashboardCards = ({ cards }) => {
  return (
    <section className="dashboard-cards-grid">
      {cards.map((card) => (
        <article key={card.label} className="dashboard-card">
          <h3 className="dashboard-card-title">{card.label}</h3>
          <p className="dashboard-card-value">{card.value}</p>
        </article>
      ))}
    </section>
  );
};

export default DashboardCards;
