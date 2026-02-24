import api from "./api";

export const getSuperAdminStats = () => api.get("/superadmin/stats");
export const getSuperAdminAdmins = () => api.get("/superadmin/admins");
export const createAdmin = (payload) => api.post("/superadmin/admins", payload);
export const createSuperAdmin = (payload) => api.post("/superadmin/super-admins", payload);
export const toggleAdminStatus = (adminId) => api.patch(`/superadmin/admins/${adminId}/status`);
export const softDeleteAdmin = (adminId, payload) =>
  api.patch(`/superadmin/admins/${adminId}/soft-delete`, payload);
export const getSuperAdminReports = (date) => api.get("/superadmin/reports", { params: { date } });

export const getAdminStats = () => api.get("/admin/stats");
export const getAdminMembers = () => api.get("/admin/members");
export const createMember = (payload) => api.post("/admin/members", payload);
export const toggleMemberStatus = (memberId) => api.patch(`/admin/members/${memberId}/status`);
export const softDeleteMember = (memberId, payload) =>
  api.patch(`/admin/members/${memberId}/soft-delete`, payload);
export const getAdminReports = (date) => api.get("/admin/reports", { params: { date } });

export const getMemberProfile = () => api.get("/member/profile");

