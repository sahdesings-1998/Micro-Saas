import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/Dashboard/MainLayout";
import DatePicker from "../components/DatePicker";
import DashboardCards from "../components/Dashboard/DashboardCards";
import RevenueChart from "../components/Dashboard/RevenueChart";
import MembersTable from "../components/Dashboard/MembersTable";
import SubscriptionsTable from "../components/Dashboard/SubscriptionsTable";
import InvoicesTable from "../components/Dashboard/InvoicesTable";
import ReportsSection from "../components/Dashboard/ReportsSection";
import AccountSection from "../components/Dashboard/AccountSection";
import DashboardModal from "../components/Dashboard/DashboardModal";
import MemberDetailsModal from "../components/Dashboard/MemberDetailsModal";
import * as ds from "../services/dashboardService";
import "../css/dashboard.css";

const MENU = ["Dashboard", "Members", "Subscriptions", "Invoices", "Reports", "Account", "Logout"];

const sanitizePhone = (val) => String(val || "").replace(/[^0-9]/g, "");

const validateMemberForm = (f, isEdit = false) => {
  if (!f.name?.trim()) return "Name is required";
  if (!f.email?.trim()) return "Email is required";
  if (!/\S+@\S+\.\S+/.test(f.email)) return "Invalid email";
  if (f.password && f.password.length < 6) return "Password must be at least 6 characters";
  if (!isEdit && !f.subscriptionPlanId) return "Subscription plan is required for initial invoice";
  return "";
};

const validateSubscriptionForm = (f) => {
  if (!f.planName?.trim()) return "Plan name is required";
  if (f.amount == null || f.amount === "" || Number(f.amount) < 0)
    return "Valid amount is required";
  if (f.duration == null || f.duration === "" || Number(f.duration) < 1)
    return "Duration must be at least 1 month";
  return "";
};

const validateInvoiceForm = (f) => {
  if (!f.memberId) return "Member is required";
  if (!f.subscriptionPlanId) return "Subscription plan is required";
  return "";
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("Dashboard");

  const [stats, setStats] = useState(null);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    companyName: "",
    subscriptionPlanId: "",
    startDate: "",
    isActive: true,
  });
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [showMemberPw, setShowMemberPw] = useState(false);
  const [memberFormErr, setMemberFormErr] = useState("");

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    planName: "",
    amount: "",
    duration: "",
    description: "",
  });
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [subscriptionFormErr, setSubscriptionFormErr] = useState("");

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    memberId: "",
    subscriptionPlanId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "Unpaid",
  });
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceFormErr, setInvoiceFormErr] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatusValue, setPendingStatusValue] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);

  const loadStats = async () => {
    try {
      const { data } = await ds.getAdminStats();
      setStats(data);
    } catch { /* silent */ }
  };

  const loadRevenueByMonth = async () => {
    try {
      const { data } = await ds.getAdminRevenueByMonth();
      setRevenueByMonth(data?.months || []);
    } catch { /* silent */ }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const { data } = await ds.getAdminMembers();
      setMembers(data?.members || data || []);
    } catch { /* silent */ }
    setMembersLoading(false);
  };

  const loadSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const { data } = await ds.getAdminSubscriptions();
      setSubscriptions(data?.plans || data || []);
    } catch { /* silent */ }
    setSubscriptionsLoading(false);
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const { data } = await ds.getAdminInvoices();
      setInvoices(data?.invoices || data || []);
    } catch { /* silent */ }
    setInvoicesLoading(false);
  };

  useEffect(() => { loadStats(); loadRevenueByMonth(); }, []);
  useEffect(() => {
    if (activeItem === "Dashboard") {
      loadStats();
      loadRevenueByMonth();
    }
  }, [activeItem]);
  useEffect(() => {
    if (activeItem === "Members") {
      loadMembers();
      loadSubscriptions();
      loadInvoices();
    }
  }, [activeItem]);
  useEffect(() => {
    if (activeItem === "Subscriptions") loadSubscriptions();
  }, [activeItem]);
  useEffect(() => {
    if (activeItem === "Invoices") {
      loadInvoices();
      loadMembers();
      loadSubscriptions();
    }
  }, [activeItem]);
  useEffect(() => {
    if (activeItem === "Reports") {
      loadMembers();
      loadInvoices();
      loadStats();
    }
  }, [activeItem]);

  const handleMenu = (item) => {
    if (item === "Logout") { setShowLogout(true); return; }
    setActiveItem(item);
  };

  const confirmLogout = () => { logout(); navigate("/login"); };

  const resetMemberForm = () => {
    setMemberForm({
      name: "",
      email: "",
      password: "",
      mobile: "",
      companyName: "",
      subscriptionPlanId: "",
      startDate: "",
      isActive: true,
    });
    setEditingMemberId(null);
    setMemberFormErr("");
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    const err = validateMemberForm({ ...memberForm, password: memberForm.password || "dummy123" }, false);
    if (err) { setMemberFormErr(err); return; }
    if (!memberForm.password?.trim()) {
      setMemberFormErr("Password is required");
      return;
    }
    try {
      const payload = {
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        password: memberForm.password,
        mobile: sanitizePhone(memberForm.mobile),
        companyName: (memberForm.companyName || "").trim(),
        subscriptionPlanId: memberForm.subscriptionPlanId,
        startDate: memberForm.startDate || new Date().toISOString().slice(0, 10),
      };
      await ds.createMember(payload);
      setShowMemberModal(false);
      resetMemberForm();
      loadMembers();
      loadStats();
      loadInvoices();
      loadRevenueByMonth();
    } catch (ex) {
      setMemberFormErr(ex?.response?.data?.message || "Failed to create member");
    }
  };

  const handleEditMember = (id) => {
    const m = members.find((x) => String(x._id || x.userId || "") === String(id));
    if (!m) return;
    setMemberForm({
      name: m.name || "",
      email: m.email || "",
      password: "",
      mobile: m.mobile || "",
      companyName: m.companyName || "",
      subscriptionPlanId: "",
      startDate: "",
      isActive: m.isActive !== false,
    });
    setEditingMemberId(id);
    setShowMemberModal(true);
    setMemberFormErr("");
  };

  const handleStatusDropdownChange = (e) => {
    const newActive = e.target.value === "Active";
    const originalMember = members.find((x) => String(x._id || x.userId || "") === String(editingMemberId));
    if (originalMember && originalMember.isActive !== newActive) {
      setPendingStatusValue(newActive);
      setShowStatusConfirm(true);
    } else {
      setMemberForm((prev) => ({ ...prev, isActive: newActive }));
    }
  };

  const handleStatusConfirm = async () => {
    if (!editingMemberId || pendingStatusValue === null) return;
    try {
      await ds.updateMember(editingMemberId, { isActive: pendingStatusValue });
      setMemberForm((prev) => ({ ...prev, isActive: pendingStatusValue }));
      setShowStatusConfirm(false);
      setPendingStatusValue(null);
      loadMembers();
      loadStats();
    } catch (ex) {
      setMemberFormErr(ex?.response?.data?.message || "Failed to update status");
    }
  };

  const handleStatusCancel = () => {
    setShowStatusConfirm(false);
    setPendingStatusValue(null);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    const err = validateMemberForm(memberForm, true);
    if (err) { setMemberFormErr(err); return; }
    if (!editingMemberId) return;
    const originalMember = members.find((x) => String(x._id || x.userId || "") === String(editingMemberId));
    if (!originalMember) return;

    const payload = {};
    const trimmedName = (memberForm.name || "").trim();
    const trimmedEmail = (memberForm.email || "").trim();
    const trimmedMobile = sanitizePhone(memberForm.mobile || "");
    const trimmedCompany = (memberForm.companyName || "").trim();

    if (trimmedName !== (originalMember.name || "")) payload.name = trimmedName;
    if (trimmedEmail !== (originalMember.email || "")) payload.email = trimmedEmail;
    if (trimmedMobile !== (originalMember.mobile || "")) payload.mobile = trimmedMobile;
    if (trimmedCompany !== (originalMember.companyName || "")) payload.companyName = trimmedCompany;
    if (memberForm.password?.trim()) payload.password = memberForm.password;

    if (Object.keys(payload).length === 0) {
      setMemberFormErr("No changes to save");
      return;
    }

    try {
      await ds.updateMember(editingMemberId, payload);
      setShowMemberModal(false);
      resetMemberForm();
      loadMembers();
      loadStats();
    } catch (ex) {
      setMemberFormErr(ex?.response?.data?.message || "Failed to update member");
    }
  };

  const openDeleteMember = (id) => {
    setDeleteTarget(id);
    setDeleteReason("");
    setDeleteType("member");
  };

  const handleDeleteMember = async () => {
    if (!deleteReason?.trim() || deleteType !== "member") return;
    try {
      await ds.softDeleteMember(deleteTarget, { reason: deleteReason });
      setDeleteTarget(null);
      setDeleteReason("");
      setDeleteType("");
      loadMembers();
      loadInvoices();
      loadStats();
    } catch { /* silent */ }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    const err = validateSubscriptionForm(subscriptionForm);
    if (err) { setSubscriptionFormErr(err); return; }
    try {
      await ds.createSubscription({
        planName: subscriptionForm.planName.trim(),
        amount: Number(subscriptionForm.amount),
        duration: Number(subscriptionForm.duration),
        description: (subscriptionForm.description || "").trim(),
      });
      setShowSubscriptionModal(false);
      setSubscriptionForm({ planName: "", amount: "", duration: "", description: "" });
      setEditingPlanId(null);
      setSubscriptionFormErr("");
      loadSubscriptions();
    } catch (ex) {
      setSubscriptionFormErr(ex?.response?.data?.message || "Failed to create plan");
    }
  };

  const handleEditSubscription = (id) => {
    const p = subscriptions.find((x) => String(x._id || "") === String(id));
    if (!p) return;
    setSubscriptionForm({
      planName: p.planName || "",
      amount: String(p.amount ?? ""),
      duration: String(p.duration ?? ""),
      description: p.description || "",
    });
    setEditingPlanId(id);
    setShowSubscriptionModal(true);
    setSubscriptionFormErr("");
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    const err = validateSubscriptionForm(subscriptionForm);
    if (err) { setSubscriptionFormErr(err); return; }
    if (!editingPlanId) return;
    try {
      await ds.updateSubscription(String(editingPlanId), {
        planName: subscriptionForm.planName.trim(),
        amount: Number(subscriptionForm.amount),
        duration: Number(subscriptionForm.duration),
        description: (subscriptionForm.description || "").trim(),
      });
      setShowSubscriptionModal(false);
      setSubscriptionForm({ planName: "", amount: "", duration: "", description: "" });
      setEditingPlanId(null);
      setSubscriptionFormErr("");
      loadSubscriptions();
    } catch (ex) {
      setSubscriptionFormErr(ex?.response?.data?.message || "Failed to update plan");
    }
  };

  const openDeleteSubscription = (id) => {
    setDeleteTarget(id);
    setDeleteReason("");
    setDeleteType("subscription");
  };

  const handleDeleteSubscription = async () => {
    if (deleteType !== "subscription") return;
    try {
      await ds.deleteSubscription(deleteTarget);
      setDeleteTarget(null);
      setDeleteReason("");
      setDeleteType("");
      loadSubscriptions();
    } catch { /* silent */ }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const err = validateInvoiceForm(invoiceForm);
    if (err) { setInvoiceFormErr(err); return; }
    try {
      await ds.createInvoice({
        memberId: invoiceForm.memberId,
        subscriptionPlanId: invoiceForm.subscriptionPlanId,
        date: invoiceForm.date || new Date().toISOString().slice(0, 10),
        status: invoiceForm.status || "Unpaid",
      });
      setShowInvoiceModal(false);
      setInvoiceForm({
        memberId: "",
        subscriptionPlanId: "",
        date: new Date().toISOString().slice(0, 10),
        status: "Unpaid",
      });
      setEditingInvoiceId(null);
      setInvoiceFormErr("");
      loadInvoices();
      loadStats();
    } catch (ex) {
      setInvoiceFormErr(ex?.response?.data?.message || "Failed to create invoice");
    }
  };

  const handleEditInvoice = (id) => {
    const inv = invoices.find((x) => String(x._id || "") === String(id));
    if (!inv) return;
    const mid = inv.memberId?._id ?? inv.memberId;
    const planId = inv.subscriptionPlanId?._id ?? inv.subscriptionPlanId;
    setInvoiceForm({
      memberId: mid ? String(mid) : "",
      subscriptionPlanId: planId ? String(planId) : "",
      date: (inv.invoiceDate || inv.date) ? new Date(inv.invoiceDate || inv.date).toISOString().slice(0, 10) : "",
      status: inv.status || "Unpaid",
    });
    setEditingInvoiceId(id);
    setShowInvoiceModal(true);
    setInvoiceFormErr("");
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    const err = validateInvoiceForm(invoiceForm);
    if (err) { setInvoiceFormErr(err); return; }
    if (!editingInvoiceId) return;
    try {
      await ds.updateInvoice(editingInvoiceId, {
        memberId: invoiceForm.memberId || undefined,
        subscriptionPlanId: invoiceForm.subscriptionPlanId || undefined,
        date: invoiceForm.date || new Date().toISOString().slice(0, 10),
        status: invoiceForm.status || "Unpaid",
      });
      setShowInvoiceModal(false);
      setInvoiceForm({
        memberId: "",
        subscriptionPlanId: "",
        date: new Date().toISOString().slice(0, 10),
        status: "Unpaid",
      });
      setEditingInvoiceId(null);
      setInvoiceFormErr("");
      loadInvoices();
      loadMembers();
      loadStats();
      loadRevenueByMonth();
    } catch (ex) {
      setInvoiceFormErr(ex?.response?.data?.message || "Failed to update invoice");
    }
  };

  const handleToggleInvoiceStatus = async (id) => {
    try {
      await ds.toggleInvoiceStatus(id);
      loadInvoices();
      loadMembers();
      loadStats();
      loadRevenueByMonth();
    } catch { /* silent */ }
  };

  const openDeleteInvoice = (id) => {
    setDeleteTarget(id);
    setDeleteReason("");
    setDeleteType("invoice");
  };

  const handleDeleteInvoice = async () => {
    if (!deleteReason?.trim() || deleteType !== "invoice") return;
    try {
      await ds.softDeleteInvoice(deleteTarget, { reason: deleteReason });
      setDeleteTarget(null);
      setDeleteReason("");
      setDeleteType("");
      loadInvoices();
    } catch { /* silent */ }
  };

  const handleDeleteConfirm = () => {
    if (deleteType === "member") handleDeleteMember();
    else if (deleteType === "subscription") handleDeleteSubscription();
    else if (deleteType === "invoice") handleDeleteInvoice();
  };

  const cards = stats
    ? [
        { label: "Total Members", value: stats.totalMembers ?? 0 },
        { label: "Active Members", value: stats.activeMembers ?? 0 },
        { label: "Inactive Members", value: stats.inactiveMembers ?? 0 },
        { label: "Paid Members", value: stats.paidMembers ?? 0 },
        { label: "Unpaid Members", value: stats.unpaidMembers ?? 0 },
        { label: "Total Revenue", value: `$${stats.totalRevenue ?? 0}` },
      ]
    : [];

  const renderContent = () => {
    switch (activeItem) {
      case "Dashboard":
        return (
          <>
            <DashboardCards cards={cards} />
            <div className="sa-panel sa-revenue-chart-panel">
              <h3 className="sa-panel-title">Admin Revenue Over Time</h3>
              <p className="sa-revenue-chart-subtitle">Revenue from Paid invoices only</p>
              <RevenueChart data={revenueByMonth} />
            </div>
          </>
        );

      case "Members":
        return (
          <MembersTable
            title="Members"
            addLabel="+ Add Member"
            rows={members}
            showAddButton
            onAdd={() => { resetMemberForm(); setShowMemberModal(true); }}
            onView={(row) => {
              setViewMember(row);
              setShowMemberDetailsModal(true);
            }}
            onEdit={handleEditMember}
            onSoftDelete={openDeleteMember}
            loading={membersLoading}
          />
        );

      case "Subscriptions":
        return (
          <SubscriptionsTable
            title="Subscription Plans"
            addLabel="+ Add Plan"
            rows={subscriptions}
            showAddButton
            onAdd={() => { setSubscriptionForm({ planName: "", amount: "", duration: "", description: "" }); setEditingPlanId(null); setShowSubscriptionModal(true); }}
            onEdit={handleEditSubscription}
            onSoftDelete={openDeleteSubscription}
            loading={subscriptionsLoading}
          />
        );

      case "Invoices":
        return (
          <InvoicesTable
            title="Invoices"
            addLabel="+ Create Invoice"
            rows={invoices}
            showAddButton
            onAdd={() => { setInvoiceForm({ memberId: "", subscriptionPlanId: "", date: new Date().toISOString().slice(0, 10), status: "Unpaid" }); setEditingInvoiceId(null); setShowInvoiceModal(true); }}
            onEdit={handleEditInvoice}
            onToggleStatus={handleToggleInvoiceStatus}
            onSoftDelete={openDeleteInvoice}
            loading={invoicesLoading}
          />
        );

      case "Reports":
        return (
          <ReportsSection
            stats={stats}
            members={members}
            invoices={invoices}
            loading={membersLoading || invoicesLoading}
          />
        );

      case "Account":
        return <AccountSection />;

      default:
        return null;
    }
  };

  const isMemberEdit = Boolean(editingMemberId);
  const isSubscriptionEdit = Boolean(editingPlanId);
  const isInvoiceEdit = Boolean(editingInvoiceId);

  return (
    <MainLayout
      menuItems={MENU}
      activeItem={activeItem}
      onMenuSelect={handleMenu}
      title={activeItem}
      role={user?.role || "admin"}
      onLogout={() => setShowLogout(true)}
    >
      {renderContent()}

      {/* Member Details Modal */}
      <MemberDetailsModal
        open={showMemberDetailsModal}
        member={viewMember}
        memberInvoices={
          viewMember
            ? (invoices || []).filter(
                (inv) =>
                  inv.isDeleted !== true &&
                  String(inv.memberId?._id ?? inv.memberId ?? "") === String(viewMember._id ?? viewMember.userId ?? "")
              )
            : []
        }
        onClose={() => {
          setShowMemberDetailsModal(false);
          setViewMember(null);
        }}
        onAddInvoice={(member) => {
          setInvoiceForm({
            memberId: String(member._id ?? member.userId ?? ""),
            subscriptionPlanId: "",
            date: new Date().toISOString().slice(0, 10),
            status: "Unpaid",
          });
          setEditingInvoiceId(null);
          setInvoiceFormErr("");
          setShowInvoiceModal(true);
        }}
        onEditInvoice={handleEditInvoice}
        onDeleteInvoice={openDeleteInvoice}
        onToggleInvoiceStatus={handleToggleInvoiceStatus}
      />

      {/* Member Modal */}
      {/* <DashboardModal
        open={showMemberModal}
        title={isMemberEdit ? "Edit Member" : "Add New Member"}
        onClose={() => { setShowMemberModal(false); resetMemberForm(); }}
      >
        <form className="sa-form" onSubmit={isMemberEdit ? handleUpdateMember : handleCreateMember}>
          <div className="sa-form-field">
            <label className="sa-form-label">Name</label>
            <input
              className="sa-form-input"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              required
            />
          </div>
          <div className="sa-form-field">
            <label className="sa-form-label">Email</label>
            <input
              className="sa-form-input"
              type="email"
              value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              required
            />
          </div>
          <div className="sa-form-field">
            <label className="sa-form-label">Password {isMemberEdit && "(leave blank to keep)"}</label>
            <div className="sa-form-pw-wrap">
              <input
                className="sa-form-input"
                type={showMemberPw ? "text" : "password"}
                value={memberForm.password}
                onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                required={!isMemberEdit}
                placeholder={isMemberEdit ? "Leave blank to keep" : ""}
              />
              <button
                type="button"
                className="sa-form-pw-toggle"
                onClick={() => setShowMemberPw((v) => !v)}
              >
                {showMemberPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="sa-form-field">
            <label className="sa-form-label">Phone</label>
            <input
              className="sa-form-input"
              value={memberForm.mobile}
              onChange={(e) => setMemberForm({ ...memberForm, mobile: sanitizePhone(e.target.value) })}
              inputMode="numeric"
            />
          </div>
          <div className="sa-form-field">
            <label className="sa-form-label">Subscription Plan</label>
            <select
              className="sa-form-input"
              value={memberForm.subscriptionPlanId}
              onChange={(e) => setMemberForm({ ...memberForm, subscriptionPlanId: e.target.value })}
            >
              <option value="">— Select Plan —</option>
              {(subscriptions || []).map((p) => (
                <option key={String(p._id || "")} value={String(p._id || "")}>
                  {p.planName} – ${p.amount ?? 0} – {p.duration ?? 0} Month(s)
                </option>
              ))}
            </select>
          </div>
          {memberForm.subscriptionPlanId && (
            <div className="sa-form-field">
              <label className="sa-form-label">Start Date</label>
              <input
                className="sa-form-input"
                type="date"
                value={memberForm.startDate}
                onChange={(e) => setMemberForm({ ...memberForm, startDate: e.target.value })}
              />
            </div>
          )}
          <div className="sa-form-field">
            <label className="sa-form-label">Payment Status</label>
            <select
              className="sa-form-input"
              value={memberForm.paymentStatus}
              onChange={(e) => setMemberForm({ ...memberForm, paymentStatus: e.target.value })}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          {memberFormErr && <p className="sa-form-error">{memberFormErr}</p>}
          <div className="sa-form-actions">
            <button type="submit" className="sa-btn sa-btn-primary">
              {isMemberEdit ? "Update Member" : "Create Member"}
            </button>
            <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowMemberModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </DashboardModal> */}
      <DashboardModal
        open={showMemberModal}
        title={isMemberEdit ? "Edit Member" : "Add New Member"}
        onClose={() => { setShowMemberModal(false); resetMemberForm(); }}
        size="form"
      >
        <form className="sa-form" onSubmit={isMemberEdit ? handleUpdateMember : handleCreateMember}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Name</label>
              <input className="sa-form-input" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Email</label>
              <input className="sa-form-input" type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} required />
            </div>
          </div>

          <div className="sa-form-row">
            {!isMemberEdit && (
              <div className="sa-form-field">
                <label className="sa-form-label">Password</label>
                <div className="sa-form-pw-wrap">
                  <input className="sa-form-input" type={showMemberPw ? "text" : "password"} value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} required />
                  <button type="button" className="sa-form-pw-toggle" onClick={() => setShowMemberPw((v) => !v)}>{showMemberPw ? <FiEyeOff /> : <FiEye />}</button>
                </div>
              </div>
            )}
            <div className="sa-form-field">
              <label className="sa-form-label">Phone</label>
              <input className="sa-form-input" value={memberForm.mobile} onChange={(e) => setMemberForm({ ...memberForm, mobile: sanitizePhone(e.target.value) })} inputMode="numeric" />
            </div>
          </div>

          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Company Name</label>
              <input className="sa-form-input" value={memberForm.companyName} onChange={(e) => setMemberForm({ ...memberForm, companyName: e.target.value })} placeholder="Optional" />
            </div>
            {!isMemberEdit && (
              <div className="sa-form-field">
                <label className="sa-form-label">Subscription Plan</label>
                <select className="sa-form-input" value={memberForm.subscriptionPlanId} onChange={(e) => setMemberForm({ ...memberForm, subscriptionPlanId: e.target.value })}>
                  <option value="">— Select Plan —</option>
                  {(subscriptions || []).map((p) => (
                    <option key={String(p._id || "")} value={String(p._id || "")}>{p.planName} – ${p.amount ?? 0} – {p.duration ?? 0} Month(s)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {memberForm.subscriptionPlanId && (
            <div className="sa-form-row">
              <div className="sa-form-field">
                <label className="sa-form-label">Start Date</label>
                <DatePicker value={memberForm.startDate} onChange={(v) => setMemberForm({ ...memberForm, startDate: v })} placeholder="Select start date" />
              </div>
              {isMemberEdit && (
                <div className="sa-form-field">
                  <label className="sa-form-label">Member Status</label>
                  <select className="sa-form-input" value={memberForm.isActive ? "Active" : "Inactive"} onChange={handleStatusDropdownChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {isMemberEdit && !memberForm.subscriptionPlanId && (
            <div className="sa-form-row">
              <div className="sa-form-field">
                <label className="sa-form-label">Member Status</label>
                <select className="sa-form-input" value={memberForm.isActive ? "Active" : "Inactive"} onChange={handleStatusDropdownChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {memberFormErr && <p className="sa-form-error">{memberFormErr}</p>}

          <div className="sa-form-actions">
            <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowMemberModal(false)}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary">{isMemberEdit ? "Update Member" : "Create Member"}</button>
          </div>
        </form>
      </DashboardModal>

      {/* Status Change Confirmation */}
      <DashboardModal
        open={showStatusConfirm}
        title="Change Member Status"
        onClose={handleStatusCancel}
      >
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          Are you sure you want to change this member&apos;s status?
        </p>
        <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={handleStatusCancel}>
            Cancel
          </button>
          <button type="button" className="sa-btn sa-btn-primary" onClick={handleStatusConfirm}>
            Confirm
          </button>
        </div>
      </DashboardModal>

      {/* Subscription Modal */}
      <DashboardModal
        open={showSubscriptionModal}
        title={isSubscriptionEdit ? "Edit Subscription Plan" : "Add Subscription Plan"}
        onClose={() => { setShowSubscriptionModal(false); setEditingPlanId(null); }}
        size="form"
      >
        <form className="sa-form" onSubmit={isSubscriptionEdit ? handleUpdateSubscription : handleCreateSubscription}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Plan Name</label>
              <input
                className="sa-form-input"
                value={subscriptionForm.planName}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planName: e.target.value })}
                placeholder="e.g. Monthly"
                required
              />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Amount</label>
              <input
                className="sa-form-input"
                type="number"
                min="0"
                step="0.01"
                value={subscriptionForm.amount}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Duration (Months)</label>
              <input
                className="sa-form-input"
                type="number"
                min="1"
                value={subscriptionForm.duration}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, duration: e.target.value })}
                required
              />
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Description</label>
              <textarea
                className="sa-form-textarea"
                value={subscriptionForm.description}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, description: e.target.value })}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
          {subscriptionFormErr && <p className="sa-form-error">{subscriptionFormErr}</p>}
          <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowSubscriptionModal(false)}>
              Cancel
            </button>
            <button type="submit" className="sa-btn sa-btn-primary">
              {isSubscriptionEdit ? "Update Plan" : "Create Plan"}
            </button>
            
          </div>
        </form>
      </DashboardModal>

      {/* Invoice Modal */}
      <DashboardModal
        open={showInvoiceModal}
        title={isInvoiceEdit ? "Edit Invoice" : "Create Invoice"}
        onClose={() => { setShowInvoiceModal(false); setEditingInvoiceId(null); }}
        size="form"
      >
        <form className="sa-form" onSubmit={isInvoiceEdit ? handleUpdateInvoice : handleCreateInvoice}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label className="sa-form-label">Member</label>
              <select
                className="sa-form-input"
                value={invoiceForm.memberId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, memberId: e.target.value })}
                required
              >
                <option value="">— Select Member —</option>
                {(members || []).map((m) => (
                  <option key={String(m._id || m.userId || "")} value={String(m._id || m.userId || "")}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="sa-form-field">
              <label className="sa-form-label">Subscription Plan</label>
              <select
                className="sa-form-input"
                value={invoiceForm.subscriptionPlanId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, subscriptionPlanId: e.target.value })}
                required
              >
                <option value="">— Select Plan —</option>
                {(subscriptions || []).map((p) => (
                  <option key={String(p._id || "")} value={String(p._id || "")}>
                    {p.planName} – ${p.amount ?? 0}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {invoiceForm.subscriptionPlanId && (
            <div className="sa-form-row">
              <div className="sa-form-field">
                <label className="sa-form-label">Amount (from plan)</label>
                <div
                  className="sa-form-input"
                  style={{ background: "#f8fafc", cursor: "default", color: "#0f172a" }}
                >
                  $
                  {(subscriptions || []).find((p) => String(p._id || "") === String(invoiceForm.subscriptionPlanId))
                    ?.amount ?? 0}
                </div>
              </div>
              <div className="sa-form-field">
                <label className="sa-form-label">Invoice Date</label>
                <DatePicker
                  value={invoiceForm.date}
                  onChange={(v) => setInvoiceForm({ ...invoiceForm, date: v })}
                  placeholder="Select invoice date"
                />
              </div>
            </div>
          )}
          {!invoiceForm.subscriptionPlanId && (
            <div className="sa-form-row">
              <div className="sa-form-field">
                <label className="sa-form-label">Invoice Date</label>
                <DatePicker
                  value={invoiceForm.date}
                  onChange={(v) => setInvoiceForm({ ...invoiceForm, date: v })}
                  placeholder="Select invoice date"
                />
              </div>
              <div className="sa-form-field">
                <label className="sa-form-label">Status</label>
                {(invoiceForm.status || "").toLowerCase() === "paid" ? (
                  <div className="sa-form-input" style={{ background: "#f8fafc", cursor: "default" }}>
                    Paid (read-only)
                  </div>
                ) : (
                  <select
                    className="sa-form-input"
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                )}
              </div>
            </div>
          )}
          {invoiceForm.subscriptionPlanId && (
            <div className="sa-form-row">
              <div className="sa-form-field">
                <label className="sa-form-label">Status</label>
                {(invoiceForm.status || "").toLowerCase() === "paid" ? (
                  <div className="sa-form-input" style={{ background: "#f8fafc", cursor: "default" }}>
                    Paid (read-only)
                  </div>
                ) : (
                  <select
                    className="sa-form-input"
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                )}
              </div>
            </div>
          )}
          {invoiceFormErr && <p className="sa-form-error">{invoiceFormErr}</p>}
          <div className="sa-form-actions">
          <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowInvoiceModal(false)}>
              Cancel
            </button>
            <button type="submit" className="sa-btn sa-btn-primary">
              {isInvoiceEdit ? "Update Invoice" : "Create Invoice"}
            </button>
           
          </div>
        </form>
      </DashboardModal>

      {/* Soft Delete Modal */}
      <DashboardModal
        open={deleteTarget !== null}
        title="Delete"
        onClose={() => { setDeleteTarget(null); setDeleteReason(""); setDeleteType(""); }}
        size="form"
      >
        <div className="sa-form">
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {deleteType === "member"
              ? "Enter reason for deletion. This will soft delete the member and all their invoices."
              : "Enter reason for deletion. This will soft delete the record."}
          </p>
          <div className="sa-form-field">
            <label className="sa-form-label">Reason</label>
            <textarea
              className="sa-form-textarea"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter deletion reason..."
            />
          </div>
          <div className="sa-form-actions">
          <button
              type="button"
              className="sa-btn sa-btn-outline"
              onClick={() => { setDeleteTarget(null); setDeleteReason(""); setDeleteType(""); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="sa-btn sa-btn-danger"
              onClick={handleDeleteConfirm}
              disabled={deleteType !== "subscription" && !deleteReason?.trim()}
            >
              Confirm Delete
            </button>
           
          </div>
        </div>
      </DashboardModal>

      {/* Logout Modal */}
      <DashboardModal open={showLogout} title="Confirm Logout" onClose={() => setShowLogout(false)}>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
          Are you sure you want to logout?
        </p>
        <div className="sa-form-actions">
        <button type="button" className="sa-btn sa-btn-outline" onClick={() => setShowLogout(false)}>
            Cancel
          </button>
          <button type="button" className="sa-btn sa-btn-danger" onClick={confirmLogout}>
            Yes, Logout
          </button>
          
        </div>
      </DashboardModal>
    </MainLayout>
  );
};

export default AdminDashboard;
