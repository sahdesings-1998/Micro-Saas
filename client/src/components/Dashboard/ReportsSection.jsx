import { useMemo, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  FiDownload,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiCreditCard,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiRotateCcw,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import DatePicker from "../DatePicker";
import "../../css/dashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = {
  active: "#059669",
  inactive: "#dc2626",
  paid: "#2563eb",
  unpaid: "#f59e0b",
};

const CARD_ICONS = {
  "Total Members": FiUsers,
  "Active Members": FiUserCheck,
  "Inactive Members": FiUserX,
  "Paid Members": FiCreditCard,
  "Unpaid Members": FiClock,
  "Total Revenue": FiDollarSign,
};

const CARD_DESCRIPTIONS = {
  "Total Members": "All registered members",
  "Active Members": "Members with active status",
  "Inactive Members": "Members with inactive status",
  "Paid Members": "Members with completed payments",
  "Unpaid Members": "Members with pending payments",
  "Total Revenue": "Total paid invoice revenue",
};

const toDateStart = (str) => {
  if (!str || typeof str !== "string") return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const toDateEnd = (str) => {
  if (!str || typeof str !== "string") return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

const isInRange = (dateVal, from, to) => {
  if (!from || !to) return true;
  const d = dateVal ? new Date(dateVal) : null;
  if (!d || isNaN(d.getTime())) return false;
  const start = toDateStart(from);
  const end = toDateEnd(to);
  if (!start || !end) return true;
  return d >= start && d <= end;
};

const ReportCard = ({ label, value, icon: Icon, description }) => (
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

const ReportsSection = ({
  stats = null,
  members = [],
  invoices = [],
  loading = false,
  onExportMembers,
  onExportRevenue,
}) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const hasFilter = Boolean(appliedFrom && appliedTo);

  const applyFilter = useCallback(() => {
    if (fromDate && toDate) {
      setAppliedFrom(fromDate);
      setAppliedTo(toDate);
    }
  }, [fromDate, toDate]);

  const resetFilter = useCallback(() => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
  }, []);

  const filteredMembers = useMemo(() => {
    const safe = Array.isArray(members) ? members : [];
    if (!hasFilter) return safe;
    return safe.filter((m) => isInRange(m.createdAt, appliedFrom, appliedTo));
  }, [members, hasFilter, appliedFrom, appliedTo]);

  const filteredInvoices = useMemo(() => {
    const safe = Array.isArray(invoices) ? invoices : [];
    const nonDeleted = safe.filter((inv) => inv.isDeleted !== true);
    if (!hasFilter) return nonDeleted;
    return nonDeleted.filter((inv) => isInRange(inv.invoiceDate || inv.date, appliedFrom, appliedTo));
  }, [invoices, hasFilter, appliedFrom, appliedTo]);

  const memberIdsWithPaidInvoice = useMemo(() => {
    const paid = filteredInvoices.filter((inv) => (inv.status || "").toLowerCase() === "paid");
    return new Set(paid.map((inv) => String(inv.memberId?._id ?? inv.memberId ?? "")));
  }, [filteredInvoices]);

  const reportCards = useMemo(() => {
    const totalMembers = filteredMembers.length;
    const activeMembers = filteredMembers.filter((m) => m.isActive === true).length;
    const inactiveMembers = totalMembers - activeMembers;
    const paidMembers = filteredMembers.filter((m) =>
      memberIdsWithPaidInvoice.has(String(m._id ?? m.userId ?? ""))
    ).length;
    const unpaidMembers = totalMembers - paidMembers;
    const totalRevenue = filteredInvoices
      .filter((inv) => (inv.status || "").toLowerCase() === "paid")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    return [
      { label: "Total Members", value: totalMembers, icon: CARD_ICONS["Total Members"], description: CARD_DESCRIPTIONS["Total Members"] },
      { label: "Active Members", value: activeMembers, icon: CARD_ICONS["Active Members"], description: CARD_DESCRIPTIONS["Active Members"] },
      { label: "Inactive Members", value: inactiveMembers, icon: CARD_ICONS["Inactive Members"], description: CARD_DESCRIPTIONS["Inactive Members"] },
      { label: "Paid Members", value: paidMembers, icon: CARD_ICONS["Paid Members"], description: CARD_DESCRIPTIONS["Paid Members"] },
      { label: "Unpaid Members", value: unpaidMembers, icon: CARD_ICONS["Unpaid Members"], description: CARD_DESCRIPTIONS["Unpaid Members"] },
      { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: CARD_ICONS["Total Revenue"], description: CARD_DESCRIPTIONS["Total Revenue"] },
    ];
  }, [filteredMembers, filteredInvoices, memberIdsWithPaidInvoice]);

  const memberChartData = useMemo(() => {
    const active = filteredMembers.filter((m) => m.isActive === true).length;
    const inactive = filteredMembers.filter((m) => m.isActive !== true).length;

    if (active === 0 && inactive === 0) {
      return {
        labels: ["No data"],
        datasets: [{
          data: [1],
          backgroundColor: ["#e2e8f0"],
          borderWidth: 0,
        }],
      };
    }

    return {
      labels: ["Active", "Inactive"],
      datasets: [{
        data: [active, inactive],
        backgroundColor: [COLORS.active, COLORS.inactive],
        borderWidth: 2,
        borderColor: "#fff",
        hoverOffset: 4,
      }],
    };
  }, [filteredMembers]);

  const paymentChartData = useMemo(() => {
    const paid = filteredMembers.filter((m) =>
      memberIdsWithPaidInvoice.has(String(m._id ?? m.userId ?? ""))
    ).length;
    const unpaid = filteredMembers.length - paid;

    if (paid === 0 && unpaid === 0) {
      return {
        labels: ["No data"],
        datasets: [{
          data: [1],
          backgroundColor: ["#e2e8f0"],
          borderWidth: 0,
        }],
      };
    }

    return {
      labels: ["Paid", "Unpaid"],
      datasets: [{
        data: [paid, unpaid],
        backgroundColor: [COLORS.paid, COLORS.unpaid],
        borderWidth: 2,
        borderColor: "#fff",
        hoverOffset: 4,
      }],
    };
  }, [filteredMembers]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.2,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 16,
            usePointStyle: true,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${ctx.raw} (${pct}%)`;
            },
          },
        },
      },
    }),
    []
  );

  const membersReportRows = useMemo(() => {
    return filteredMembers.map((m) => ({
      memberCode: m.memberCode || "—",
      memberName: m.name || "—",
      companyName: m.companyName || "—",
      memberStatus: m.isActive ? "Active" : "Inactive",
      joinDate: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—",
      mobile: m.mobile || "—",
    }));
  }, [filteredMembers]);

  const revenueReportRows = useMemo(() => {
    return filteredInvoices.map((inv) => ({
      memberCode: inv.memberCode || inv.memberId?.memberCode || "—",
      memberName: inv.memberName || inv.memberId?.name || "—",
      subscriptionPlan: inv.planName || inv.subscriptionPlanId?.planName || "—",
      invoiceAmount: inv.amount ?? 0,
      paymentStatus: inv.status || "Unpaid",
      invoiceDate: (inv.invoiceDate || inv.date) ? new Date(inv.invoiceDate || inv.date).toLocaleDateString() : "—",
      invoiceId: inv.invoiceNumber || inv._id,
    }));
  }, [filteredInvoices]);

  const handleExportMembers = () => {
    const data = membersReportRows.map((r) => ({
      "Member Code": r.memberCode,
      "Member Name": r.memberName,
      "Company Name": r.companyName,
      "Phone": r.mobile,
      "Status": r.memberStatus,
      "Join Date": r.joinDate,
    }));
    const ws = XLSX.utils.json_to_sheet(
      data.length ? data : [{ "Member Code": "", "Member Name": "", "Company Name": "", "Phone": "", "Status": "", "Join Date": "" }]
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members Report");
    const suffix = hasFilter ? `_${appliedFrom}_to_${appliedTo}` : `_${new Date().toISOString().slice(0, 10)}`;
    XLSX.writeFile(wb, `Members_Report${suffix}.xlsx`);
    onExportMembers?.();
  };

  const handleExportRevenue = () => {
    const data = revenueReportRows.map((r) => ({
      "Invoice ID": r.invoiceId || "",
      "Member Code": r.memberCode,
      "Member Name": r.memberName,
      "Subscription Plan": r.subscriptionPlan,
      "Amount": r.invoiceAmount,
      "Payment Status": r.paymentStatus,
      "Invoice Date": r.invoiceDate,
    }));
    const ws = XLSX.utils.json_to_sheet(
      data.length ? data : [{ "Invoice ID": "", "Member Code": "", "Member Name": "", "Subscription Plan": "", "Amount": "", "Payment Status": "", "Invoice Date": "" }]
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
    const suffix = hasFilter ? `_${appliedFrom}_to_${appliedTo}` : `_${new Date().toISOString().slice(0, 10)}`;
    XLSX.writeFile(wb, `Revenue_Report${suffix}.xlsx`);
    onExportRevenue?.();
  };

  if (loading) {
    return (
      <div className="sa-panel">
        <div className="sa-panel-body">
          <p className="sa-empty">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-reports-dashboard">
      <h2 className="sa-reports-dashboard-title">Reports Dashboard</h2>
      <p className="sa-reports-dashboard-subtitle">
        Overview of your members and revenue. Filter by date range to narrow results.
      </p>

      {/* Date Filter Section */}
      <div className="sa-reports-filter-panel">
        <div className="sa-reports-filter-row">
          <div className="sa-reports-filter-field">
            <label className="sa-reports-filter-label">From Date</label>
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="From date"
              className="sa-reports-filter-input"
              aria-label="From date"
            />
          </div>
          <div className="sa-reports-filter-field">
            <label className="sa-reports-filter-label">To Date</label>
            <DatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="To date"
              className="sa-reports-filter-input"
              minDate={fromDate || undefined}
              aria-label="To date"
            />
          </div>
          <div className="sa-reports-filter-actions">
            <button
              type="button"
              className="sa-btn sa-btn-primary"
              onClick={applyFilter}
              disabled={!fromDate || !toDate || (fromDate > toDate)}
            >
              <FiFilter /> Apply Filter
            </button>
            <button
              type="button"
              className="sa-btn sa-btn-outline"
              onClick={resetFilter}
              disabled={!hasFilter}
            >
              <FiRotateCcw /> Reset Filter
            </button>
          </div>
        </div>
        {hasFilter && (
          <p className="sa-reports-filter-active">
            Showing data from {new Date(appliedFrom).toLocaleDateString()} to {new Date(appliedTo).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Report Cards */}
      <div className="sa-reports-cards-grid">
        {reportCards.map((card) => (
          <ReportCard key={card.label} label={card.label} value={card.value} icon={card.icon} description={card.description} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="sa-reports-charts-row">
        <div className="sa-panel sa-reports-chart-panel">
          <h3 className="sa-panel-title">Member Status</h3>
          <div className="sa-reports-chart-wrapper">
            <Doughnut data={memberChartData} options={chartOptions} />
          </div>
        </div>
        <div className="sa-panel sa-reports-chart-panel">
          <h3 className="sa-panel-title">Payment Status</h3>
          <div className="sa-reports-chart-wrapper">
            <Doughnut data={paymentChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Members Report Table */}
      <div className="sa-panel">
        <div className="sa-panel-header">
          <h3 className="sa-panel-title">Members Report</h3>
          <button
            type="button"
            className="sa-btn sa-btn-primary sa-btn-sm"
            onClick={handleExportMembers}
          >
            <FiDownload /> Export Members {hasFilter ? "(Filtered)" : ""}
          </button>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Member Code</th>
                <th>Member Name</th>
                <th>Company Name</th>
                <th>Member Status</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {membersReportRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="sa-table-empty">
                    {hasFilter ? "No members found in selected date range" : "No members found"}
                  </td>
                </tr>
              ) : (
                membersReportRows.map((row, idx) => (
                  <tr key={(row.memberCode || "") + idx}>
                    <td>{row.memberCode}</td>
                    <td>{row.memberName}</td>
                    <td>{row.companyName}</td>
                    <td>
                      <span
                        className={`sa-badge ${
                          row.memberStatus === "Active" ? "sa-badge-active" : "sa-badge-inactive"
                        }`}
                      >
                        {row.memberStatus}
                      </span>
                    </td>
                    <td>{row.joinDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Report Table */}
      <div className="sa-panel">
        <div className="sa-panel-header">
          <h3 className="sa-panel-title">Revenue Report</h3>
          <button
            type="button"
            className="sa-btn sa-btn-primary sa-btn-sm"
            onClick={handleExportRevenue}
          >
            <FiDownload /> Export Revenue {hasFilter ? "(Filtered)" : ""}
          </button>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Member Code</th>
                <th>Member Name</th>
                <th>Subscription Plan</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Invoice Date</th>
              </tr>
            </thead>
            <tbody>
              {revenueReportRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sa-table-empty">
                    {hasFilter ? "No invoices found in selected date range" : "No invoices found"}
                  </td>
                </tr>
              ) : (
                revenueReportRows.map((row, idx) => (
                  <tr key={row.invoiceId || idx}>
                    <td>{row.invoiceId}</td>
                    <td>{row.memberCode}</td>
                    <td>{row.memberName}</td>
                    <td>{row.subscriptionPlan}</td>
                    <td>${row.invoiceAmount}</td>
                    <td>
                      <span
                        className={`sa-badge sa-badge-invoice-status ${
                          (row.paymentStatus || "").toLowerCase() === "paid"
                            ? "sa-badge-paid"
                            : "sa-badge-unpaid"
                        }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td>{row.invoiceDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;
