// services/api.js
import axios from "axios";
import { auth } from "../firebase";

/* ================================
   Base URL
================================ */
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL || "https://your-backend-domain.com/api"
    : "http://localhost:5000/api";

/* ================================
   Axios Instance
================================ */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================================
   Request Interceptor (JWT + Firebase)
================================ */
api.interceptors.request.use(
  async (config) => {
    // 1️⃣ Firebase token (discussion system)
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const firebaseToken = await firebaseUser.getIdToken();
      config.headers.Authorization = `Bearer ${firebaseToken}`;
      return config;
    }

    // 2️⃣ JWT token (existing auth system)
    const jwtToken = localStorage.getItem("token");
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================================
   Response Interceptor
================================ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized – redirecting to login");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ================================
   AUTH API
================================ */
export const authAPI = {
  sendOTP: (email) =>
    api.post("/auth/send-otp", { email }),

  verifyOTP: (email, otp) =>
    api.post("/auth/verify-otp", { email, otp }),

  sendForgotPasswordOTP: (email) =>
    api.post("/auth/forgot-password/send-otp", { email }),

  verifyForgotPasswordOTP: (email, otp) =>
    api.post("/auth/forgot-password/verify-otp", { email, otp }),

  resetPassword: (data) =>
    api.post("/auth/forgot-password/reset", data),

  register: (userData) =>
    api.post("/auth/register", userData),

  login: (credentials) =>
    api.post("/auth/login", credentials),

  getProfile: () =>
    api.get("/auth/profile"),
};

/* ================================
   PROFILE API
================================ */
export const profileAPI = {
  get: () => api.get("/profile"),
  update: (data) => api.put("/profile", data),
};

/* ================================
   REMINDER API
================================ */
export const reminderAPI = {
  sendReminderEmail: (email, eventTitle, eventDate) =>
    api.post("/reminder/send", { email, eventTitle, eventDate }),
};

/* ================================
   ATTENDANCE API
================================ */
export const attendanceAPI = {
  mark: (data) => api.post("/attendance", data),
  getAll: () => api.get("/attendance"),
};

/* ================================
   DISCUSSION API
================================ */
export const discussionAPI = {
  getAll: (params) =>
    api.get("/discussions", { params }),

  getById: (id, userId) =>
    api.get(`/discussions/${id}`, { params: { userId } }),

  create: (data) =>
    api.post("/discussions", data),

  update: (id, data) =>
    api.put(`/discussions/${id}`, data),

  delete: (id) =>
    api.delete(`/discussions/${id}`),

  vote: (id) =>
    api.post(`/discussions/${id}/vote`),
};

/* ================================
   COMMENT API
================================ */
export const commentAPI = {
  getByDiscussion: (discussionId) =>
    api.get("/comments", { params: { discussionId } }),

  create: (data) =>
    api.post("/comments", data),

  update: (id, data) =>
    api.put(`/comments/${id}`, data),

  delete: (id) =>
    api.delete(`/comments/${id}`),
};

/* ================================
   FILE UPLOAD API
================================ */
export const uploadAPI = {
  uploadFile: (file, discussionId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("discussionId", discussionId || "temp");

    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        console.log(`Upload: ${percent}%`);
      },
    });
  },

  deleteFile: (filePath) =>
    api.delete("/upload", { data: { filePath } }),
};

/* ================================
   HEALTH CHECK
================================ */
export const healthAPI = {
  check: () => api.get("/health"),
};

export default api;
