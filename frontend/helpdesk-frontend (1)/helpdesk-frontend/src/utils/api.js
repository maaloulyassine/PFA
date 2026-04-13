import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ───────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ── Tickets ────────────────────────────────────────────
export const ticketAPI = {
  getAll: (params) => api.get("/tickets", { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post("/tickets", data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  updateStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
  addComment: (id, content) => api.post(`/tickets/${id}/comments`, { content }),
  getAssigned: () => api.get("/tickets/assigned"),
  getMyTickets: () => api.get("/tickets/mine"),
};

// ── Users ──────────────────────────────────────────────
export const userAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  getTechnicians: () => api.get("/users/technicians"),
};

// ── Admin Stats ────────────────────────────────────────
export const statsAPI = {
  getGlobal: () => api.get("/admin/statistics"),
  getTicketsByPriority: () => api.get("/admin/statistics/by-priority"),
  getTicketsByCategory: () => api.get("/admin/statistics/by-category"),
  getResolutionTimes: () => api.get("/admin/statistics/resolution-times"),
  getTechnicianPerformance: () => api.get("/admin/statistics/technicians"),
};

// ── Categories ─────────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  delete: (id) => api.delete(`/categories/${id}`),
};
