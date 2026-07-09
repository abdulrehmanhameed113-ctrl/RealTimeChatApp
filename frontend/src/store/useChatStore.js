import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create((set, get) => ({
  users: [],
  groups: [],
  messages: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  typingUsers: {}, // { userId: boolean } or { "groupId_userId": boolean }
  unreadCounts: {}, // { userId: number } or { groupId: number }
  hasMoreMessages: true,

  getUsers: async () => {
    try {
      set({ isUsersLoading: true });
      const res = await axiosInstance.get("/users");
      set({ users: res.data, isUsersLoading: false });
    } catch (error) {
      console.error("Error in getUsers:", error);
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    try {
      set({ isGroupsLoading: true });
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data, isGroupsLoading: false });
    } catch (error) {
      console.error("Error in getGroups:", error);
      set({ isGroupsLoading: false });
    }
  },

  getMessages: async (id, isLoadMore = false) => {
    try {
      const { messages } = get();
      let url = `/messages/${id}?limit=20`;

      if (isLoadMore) {
        if (messages.length === 0) return;
        const before = messages[0].createdAt;
        url += `&before=${before}`;
      } else {
        set({ isMessagesLoading: true, hasMoreMessages: true });
      }

      const res = await axiosInstance.get(url);
      
      if (isLoadMore) {
        set({
          messages: [...res.data, ...messages],
          hasMoreMessages: res.data.length === 20,
        });
      } else {
        set({
          messages: res.data,
          isMessagesLoading: false,
          hasMoreMessages: res.data.length === 20,
        });

        // Mark direct messages as read on backend
        const isGroup = get().selectedGroup !== null;
        if (!isGroup) {
          await axiosInstance.post(`/messages/read/${id}`);
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [id]: 0,
            },
          }));
        } else {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [id]: 0,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error in getMessages:", error);
      set({ isMessagesLoading: false });
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, selectedGroup: null, messages: [], hasMoreMessages: true });
    if (selectedUser) {
      get().getMessages(selectedUser._id);
    }
  },

  setSelectedGroup: (selectedGroup) => {
    set({ selectedGroup, selectedUser: null, messages: [], hasMoreMessages: true });
    if (selectedGroup) {
      get().getMessages(selectedGroup._id);
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups", groupData);
      const newGroup = res.data.group;

      set((state) => ({
        groups: [newGroup, ...state.groups],
      }));

      // Join socket room
      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit("joinGroupRoom", { groupId: newGroup._id });
      }

      get().setSelectedGroup(newGroup);
      return newGroup;
    } catch (error) {
      console.error("Error in createGroup:", error);
      throw error;
    }
  },

  joinGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/join`);
      const updatedGroup = res.data.group;

      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? updatedGroup : g)),
      }));

      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit("joinGroupRoom", { groupId });
      }

      get().setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error("Error in joinGroup:", error);
      throw error;
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/leave`);
      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit("leaveGroupRoom", { groupId });
      }

      set((state) => {
        const isCurrentSelected = state.selectedGroup?._id === groupId;
        const filteredGroups = state.groups.filter((g) => g._id !== groupId);
        
        return {
          groups: res.data.groupId ? filteredGroups : state.groups.map((g) => g._id === groupId ? res.data.group : g),
          selectedGroup: isCurrentSelected ? null : state.selectedGroup,
          messages: isCurrentSelected ? [] : state.messages,
        };
      });
    } catch (error) {
      console.error("Error in leaveGroup:", error);
      throw error;
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages } = get();
    const chatEntity = selectedUser || selectedGroup;
    try {
      const res = await axiosInstance.post(
        `/messages/send/${chatEntity._id}`,
        messageData
      );
      const newMessage = res.data.data;
      set({ messages: [...messages, newMessage] });
      return newMessage;
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const getSocket = () => useSocketStore.getState().socket;
    const socket = getSocket();
    if (!socket) {
      setTimeout(() => {
        const retrySocket = getSocket();
        if (retrySocket) {
          get()._attachSocketListeners(retrySocket);
        }
      }, 500);
      return;
    }
    get()._attachSocketListeners(socket);
  },

  _attachSocketListeners: (socket) => {
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("userTyping");
    socket.off("userStoppedTyping");

    socket.on("newMessage", async (newMessage) => {
      const { selectedUser, selectedGroup, messages } = get();

      const alreadyExists = messages.some((m) => m._id === newMessage._id);
      if (alreadyExists) return;

      if (newMessage.groupId) {
        // Group message
        const isRelevant = selectedGroup && selectedGroup._id === newMessage.groupId;
        if (isRelevant) {
          set((state) => ({ messages: [...state.messages, newMessage] }));
        } else {
          // Increment group unread badge
          const groupId = newMessage.groupId;
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [groupId]: (state.unreadCounts[groupId] || 0) + 1,
            },
          }));
        }
      } else {
        // Direct message
        const mySelectedUserId = selectedUser?._id;
        const msgSenderId = String(newMessage.senderId?._id || newMessage.senderId);
        const msgReceiverId = String(newMessage.receiverId?._id || newMessage.receiverId || "");

        const isRelevantToCurrentChat =
          mySelectedUserId &&
          (msgSenderId === String(mySelectedUserId) ||
            msgReceiverId === String(mySelectedUserId));

        if (isRelevantToCurrentChat) {
          set((state) => ({ messages: [...state.messages, newMessage] }));

          if (msgSenderId === String(mySelectedUserId)) {
            try {
              await axiosInstance.post(`/messages/read/${mySelectedUserId}`);
            } catch (err) {
              console.error("Failed to mark message as read:", err);
            }
          }
        } else {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [msgSenderId]: (state.unreadCounts[msgSenderId] || 0) + 1,
            },
          }));
        }
      }
    });

    socket.on("messagesRead", ({ readBy }) => {
      const { selectedUser, messages } = get();
      if (selectedUser && String(readBy) === String(selectedUser._id)) {
        const updatedMessages = messages.map((msg) => ({
          ...msg,
          isRead: true,
        }));
        set({ messages: updatedMessages });
      }
    });

    socket.on("userTyping", ({ senderId, groupId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [groupId ? `${groupId}_${senderId}` : senderId]: true,
        },
      }));
    });

    socket.on("userStoppedTyping", ({ senderId, groupId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [groupId ? `${groupId}_${senderId}` : senderId]: false,
        },
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
  },
}));
