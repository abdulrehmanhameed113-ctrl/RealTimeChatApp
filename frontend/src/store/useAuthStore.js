import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useSocketStore } from "./useSocketStore";

export const useAuthStore = create((set) => ({
  authUser: null,
  token: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,

  checkAuth: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ authUser: null, token: null, isCheckingAuth: false });
        return;
      }

      const res = await axiosInstance.get("/auth/profile");
      set({ authUser: res.data.user, token, isCheckingAuth: false });

      // Connect socket on successful checkAuth
      useSocketStore.getState().connectSocket(res.data.user._id, token);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      localStorage.removeItem("token");
      set({ authUser: null, token: null, isCheckingAuth: false });
      useSocketStore.getState().disconnectSocket();
    }
  },

  signup: async (data) => {
    try {
      set({ isSigningUp: true });
      const res = await axiosInstance.post("/auth/register", data);
      const { user, token, refreshToken } = res.data;
      set({ authUser: user, token, isSigningUp: false });
      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      useSocketStore.getState().connectSocket(user._id, token);
      return res.data;
    } catch (error) {
      set({ isSigningUp: false });
      throw error;
    }
  },

  login: async (data) => {
    try {
      set({ isLoggingIn: true });
      const res = await axiosInstance.post("/auth/login", data);
      const { user, token, refreshToken } = res.data;

      set({
        authUser: user,
        token,
        isLoggingIn: false,
      });

      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      
      // Connect socket on successful login
      useSocketStore.getState().connectSocket(user._id, token);
    } catch (error) {
      set({ isLoggingIn: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const localRefreshToken = localStorage.getItem("refreshToken");
      await axiosInstance.post("/auth/logout", { refreshToken: localRefreshToken });
    } catch (error) {
      console.error("Error in logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      set({ authUser: null, token: null });
      useSocketStore.getState().disconnectSocket();
    }
  },

  updateProfile: async (formData) => {
    try {
      set({ isUpdatingProfile: true });
      const res = await axiosInstance.put("/auth/update-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      set({ authUser: res.data.user, isUpdatingProfile: false });
      return res.data;
    } catch (error) {
      set({ isUpdatingProfile: false });
      throw error;
    }
  },
}));