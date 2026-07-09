import { create } from "zustand";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5000";

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: (userId, token) => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(BASE_URL, {
      query: { userId },
      auth: { token },
    });

    newSocket.connect();

    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (users) => {
      set({ onlineUsers: users });
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
