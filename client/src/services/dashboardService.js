import api from "./api";

export const getSuperAdminStats = () => api.get("superadmin/stats");
export const getSuperAdminClientsByMonth = () => api.get("superadmin/clients-by-month");
export const getSuperAdminAdmins = () => api.get("superadmin/admins");
export const getSuperAdminReports = () => api.get("superadmin/reports");
export const getClientDetails = (adminId) => api.get(`superadmin/client/${adminId}`);
export const getAllSuperAdmins = () => api.get("superadmin/super-admins");
export const updateSuperAdmin = (id, payload) => api.put(`superadmin/super-admins/${id}`, payload);
export const softDeleteSuperAdmin = (id) => api.patch(`superadmin/super-admins/${id}/soft-delete`);
export const createAdmin = (payload) => api.post("superadmin/admins", payload);
export const createSuperAdmin = (payload) => api.post("superadmin/super-admins", payload);
export const toggleAdminStatus = (adminId) => api.patch(`superadmin/admins/${adminId}/status`);
export const softDeleteAdmin = (adminId, payload) =>
  api.patch(`superadmin/admins/${adminId}/soft-delete`, payload);

export const getAdminStats = () => api.get("admin/stats");
export const getAdminProfile = () => api.get("admin/profile");
export const updateAdminProfile = (payload) => api.put("admin/profile", payload);
export const getAdminMembers = () => api.get("admin/members");
export const createMember = (payload) => api.post("admin/members", payload);
export const updateMember = (memberId, payload) => api.put(`admin/members/${memberId}`, payload);
export const toggleMemberStatus = (memberId) => api.patch(`admin/members/${memberId}/status`);
export const softDeleteMember = (memberId, payload) =>
  api.patch(`admin/members/${memberId}/soft-delete`, payload);
export const getAdminReports = (date) => api.get("admin/reports", { params: { date } });
export const getAdminRevenueByMonth = () => api.get("admin/revenue-by-month");

export const getAdminSubscriptions = () => api.get("subscription");
export const createSubscription = (payload) => api.post("subscription", payload);
export const updateSubscription = (id, payload) => api.put(`subscription/${id}`, payload);
export const deleteSubscription = (id) => api.delete(`subscription/${id}`);

export const getAdminInvoices = () => api.get("admin/invoices");
export const createInvoice = (payload) => api.post("admin/invoices", payload);
export const updateInvoice = (invoiceId, payload) =>
  api.put(`admin/invoices/${invoiceId}`, payload);
export const toggleInvoiceStatus = (invoiceId) =>
  api.patch(`admin/invoices/${invoiceId}/status`);
export const softDeleteInvoice = (invoiceId, payload) =>
  api.patch(`admin/invoices/${invoiceId}/soft-delete`, payload);

export const getMemberProfile = () => api.get("member/profile");
export const updateMemberProfile = (payload) => api.put("member/profile", payload);

