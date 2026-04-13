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
  getAll: async (params) => {
    try {
      return await api.get("/tickets", { params });
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      return { data: { content: tickets, totalPages: 1 } };
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/tickets/${id}`);
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      const t = tickets.find((x) => String(x.id) === String(id));
      if (t) return { data: t };
      throw err;
    }
  },
  create: async (data) => {
    try {
      return await api.post("/tickets", data);
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      const id = Date.now();
      // attach current demo user as creator when available
      const storedUser = localStorage.getItem("user");
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const createdBy = currentUser ? { firstName: currentUser.firstName, lastName: currentUser.lastName } : data.createdBy || null;
      const t = { id, ...data, status: data.status || "OUVERT", createdAt: new Date().toISOString(), createdBy };
      tickets.unshift(t);
      localStorage.setItem("demo_tickets", JSON.stringify(tickets));
      return { data: t };
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/tickets/${id}`, data);
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      const idx = tickets.findIndex((x) => String(x.id) === String(id));
      if (idx !== -1) {
        tickets[idx] = { ...tickets[idx], ...data };
        localStorage.setItem("demo_tickets", JSON.stringify(tickets));
        return { data: tickets[idx] };
      }
      throw err;
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/tickets/${id}`);
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      const filtered = tickets.filter((x) => String(x.id) !== String(id));
      localStorage.setItem("demo_tickets", JSON.stringify(filtered));
      return { data: {} };
    }
  },
  updateStatus: async (id, status) => {
    try {
      return await api.put(`/tickets/${id}/status`, { status });
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      const idx = tickets.findIndex((x) => String(x.id) === String(id));
      if (idx !== -1) {
        tickets[idx].status = status;
        localStorage.setItem("demo_tickets", JSON.stringify(tickets));
        return { data: tickets[idx] };
      }
      throw err;
    }
  },
  addComment: async (id, content) => {
    try {
      return await api.post(`/tickets/${id}/comments`, { content });
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      const idx = tickets.findIndex((x) => String(x.id) === String(id));
      const comment = { id: Date.now(), content, createdAt: new Date().toISOString() };
      if (idx !== -1) {
        tickets[idx].comments = [...(tickets[idx].comments || []), comment];
        localStorage.setItem("demo_tickets", JSON.stringify(tickets));
        return { data: comment };
      }
      throw err;
    }
  },
  getAssigned: async () => {
    try {
      return await api.get("/tickets/assigned");
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      return { data: tickets.filter(t => t.status !== "RESOLU") };
    }
  },
  getMyTickets: async () => {
    try {
      return await api.get("/tickets/mine");
    } catch (err) {
      const raw = localStorage.getItem("demo_tickets");
      const tickets = raw ? JSON.parse(raw) : [];
      return { data: tickets };
    }
  },
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
