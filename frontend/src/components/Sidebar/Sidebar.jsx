import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Search, Settings, User, LogOut, MessageSquare, Users, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Group name must be at least 3 characters long"),
  description: z.string().trim().optional(),
});

export default function Sidebar() {
  const {
    users,
    getUsers,
    groups,
    getGroups,
    selectedUser,
    setSelectedUser,
    selectedGroup,
    setSelectedGroup,
    isUsersLoading,
    isGroupsLoading,
    typingUsers,
    unreadCounts,
    createGroup,
    joinGroup,
    leaveGroup,
  } = useChatStore();

  const { onlineUsers } = useSocketStore();
  const { authUser, logout } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "groups"
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const handleCreateGroupSubmit = async (data) => {
    try {
      await createGroup(data);
      toast.success("Group created successfully!");
      setShowModal(false);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isOnline = onlineUsers.includes(u._id);
    return matchSearch && (!showOnlineOnly || isOnline);
  });

  const filteredGroups = groups.filter((g) => {
    return g.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside
      className="flex flex-col h-full w-full lg:w-[360px] shrink-0 relative"
      style={{ backgroundColor: "var(--wa-bg-sidebar)", borderRight: "1px solid var(--wa-border)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: "var(--wa-bg-panel)" }}
      >
        <Link to="/profile" className="flex items-center gap-2 group cursor-pointer">
          {authUser?.profilePic ? (
            <img
              src={authUser.profilePic}
              alt={authUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
            >
              {authUser?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <span className="font-semibold text-base" style={{ color: "var(--wa-text-primary)" }}>
          Chatly
        </span>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <Link
            to="/settings"
            className="p-2 rounded-full transition-colors cursor-pointer"
            style={{ color: "var(--wa-icon)" }}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={logout}
            className="p-2 rounded-full transition-colors cursor-pointer"
            style={{ color: "var(--wa-icon)" }}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-3 py-2 shrink-0" style={{ backgroundColor: "var(--wa-bg-sidebar)" }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ backgroundColor: "var(--wa-bg-panel)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--wa-text-secondary)" }} />
          <input
            type="text"
            placeholder={activeTab === "chats" ? "Search or start new chat" : "Search groups..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--wa-text-primary)" }}
          />
        </div>
      </div>

      {/* ── Tabs (Chats vs Groups) ── */}
      <div className="flex px-3 pb-2 gap-2 shrink-0">
        <button
          onClick={() => {
            setActiveTab("chats");
            setSearchTerm("");
          }}
          className="flex-1 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer text-center"
          style={
            activeTab === "chats"
              ? { backgroundColor: "var(--wa-bg-hover)", color: "var(--wa-text-primary)", border: "1px solid var(--wa-border)" }
              : { backgroundColor: "transparent", color: "var(--wa-text-secondary)" }
          }
        >
          Chats
        </button>
        <button
          onClick={() => {
            setActiveTab("groups");
            setSearchTerm("");
          }}
          className="flex-1 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer text-center"
          style={
            activeTab === "groups"
              ? { backgroundColor: "var(--wa-bg-hover)", color: "var(--wa-text-primary)", border: "1px solid var(--wa-border)" }
              : { backgroundColor: "transparent", color: "var(--wa-text-secondary)" }
          }
        >
          Groups
        </button>
      </div>

      {/* Online-only filter (Only for chats) */}
      {activeTab === "chats" && (
        <div
          className="flex gap-2 px-4 pb-2 shrink-0"
          style={{ borderBottom: "1px solid var(--wa-border)" }}
        >
          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className="text-xs px-3 py-1 rounded-full font-medium transition-all cursor-pointer"
            style={
              showOnlineOnly
                ? { backgroundColor: "var(--wa-green)", color: "#fff" }
                : { backgroundColor: "var(--wa-bg-panel)", color: "var(--wa-text-secondary)" }
            }
          >
            Online {showOnlineOnly && `(${onlineUsers.length})`}
          </button>
          <button
            onClick={() => setShowOnlineOnly(false)}
            className="text-xs px-3 py-1 rounded-full font-medium transition-all cursor-pointer"
            style={
              !showOnlineOnly
                ? { backgroundColor: "var(--wa-green)", color: "#fff" }
                : { backgroundColor: "var(--wa-bg-panel)", color: "var(--wa-text-secondary)" }
            }
          >
            All
          </button>
        </div>
      )}

      {/* Group controls bar (Only for groups) */}
      {activeTab === "groups" && (
        <div
          className="flex items-center justify-between px-4 pb-2 shrink-0"
          style={{ borderBottom: "1px solid var(--wa-border)" }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--wa-text-secondary)" }}>
            Available Rooms ({filteredGroups.length})
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold hover:brightness-110"
            style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Group
          </button>
        </div>
      )}

      {/* ── Content List ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "chats" ? (
          isUsersLoading ? (
            <div className="flex items-center justify-center h-32">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--wa-border)", borderTopColor: "var(--wa-green)" }}
              />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-8 h-8" style={{ color: "var(--wa-text-secondary)" }} />
              <span className="text-sm" style={{ color: "var(--wa-text-secondary)" }}>No contacts found</span>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              const isSelected = selectedUser?._id === user._id;
              const unread = unreadCounts[user._id] || 0;
              const isTyping = typingUsers[user._id];

              return (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-left"
                  style={{
                    backgroundColor: isSelected ? "var(--wa-bg-hover)" : "transparent",
                    borderBottom: "1px solid var(--wa-border)",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "var(--wa-bg-hover)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white"
                        style={{ backgroundColor: "#6B7280" }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isOnline && (
                      <span
                        className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ backgroundColor: "var(--wa-green)", borderColor: "var(--wa-bg-sidebar)" }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate" style={{ color: "var(--wa-text-primary)" }}>
                        {user.name}
                      </span>
                      {unread > 0 && !isSelected && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse"
                          style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5">
                      {isTyping ? (
                        <span className="text-xs font-medium animate-pulse" style={{ color: "var(--wa-green)" }}>
                          typing...
                        </span>
                      ) : (
                        <span className="text-xs truncate block" style={{ color: "var(--wa-text-secondary)" }}>
                          {isOnline ? "online" : "offline"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          /* ── Groups tab ── */
          isGroupsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--wa-border)", borderTopColor: "var(--wa-green)" }}
              />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-8 h-8" style={{ color: "var(--wa-text-secondary)" }} />
              <span className="text-sm" style={{ color: "var(--wa-text-secondary)" }}>No groups available</span>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isSelected = selectedGroup?._id === group._id;
              const isMember = group.members.some((m) => m._id === authUser._id);
              const unread = unreadCounts[group._id] || 0;
              const groupTypers = Object.keys(typingUsers).filter(
                (k) => k.startsWith(`${group._id}_`) && typingUsers[k]
              );
              const isTyping = groupTypers.length > 0;

              return (
                <div
                  key={group._id}
                  className="w-full flex items-center justify-between px-4 py-3 border-b transition-colors"
                  style={{
                    backgroundColor: isSelected ? "var(--wa-bg-hover)" : "transparent",
                    borderColor: "var(--wa-border)",
                  }}
                >
                  <button
                    disabled={!isMember}
                    onClick={() => setSelectedGroup(group)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer disabled:cursor-default"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                      style={{ backgroundColor: "var(--wa-bg-panel-2)", border: "1px solid var(--wa-border)" }}
                    >
                      {group.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate" style={{ color: "var(--wa-text-primary)" }}>
                          {group.name}
                        </span>
                        {unread > 0 && !isSelected && (
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                            style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
                          >
                            {unread}
                          </span>
                        )}
                      </div>

                      <span className="text-xs block truncate mt-0.5" style={{ color: "var(--wa-text-secondary)" }}>
                        {isTyping ? (
                          <span className="font-medium animate-pulse" style={{ color: "var(--wa-green)" }}>
                            someone is typing...
                          </span>
                        ) : (
                          `${group.members.length} members`
                        )}
                      </span>
                    </div>
                  </button>

                  <div className="ml-2 shrink-0">
                    {isMember ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Leave group "${group.name}"?`)) {
                            try {
                              await leaveGroup(group._id);
                              toast.success(`Left group ${group.name}`);
                            } catch (err) {
                              toast.error("Failed to leave group");
                            }
                          }
                        }}
                        className="text-[10px] px-2 py-1 rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer font-medium"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await joinGroup(group._id);
                            toast.success(`Joined group ${group.name}`);
                          } catch (err) {
                            toast.error("Failed to join group");
                          }
                        }}
                        className="text-[10px] px-2.5 py-1 rounded font-semibold text-white transition-all cursor-pointer"
                        style={{ backgroundColor: "var(--wa-green)" }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* ── Create Group Modal ── */}
      {showModal && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="w-full max-w-sm rounded-2xl p-5 shadow-2xl relative border"
            style={{ backgroundColor: "var(--wa-bg-panel)", borderColor: "var(--wa-border)" }}
          >
            <button
              onClick={() => {
                setShowModal(false);
                reset();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Create Group Room
            </h3>

            <form onSubmit={handleSubmit(handleCreateGroupSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--wa-text-secondary)" }}>
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Team"
                  {...register("name")}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "var(--wa-bg-input)",
                    color: "var(--wa-text-primary)",
                    border: errors.name ? "1px solid #ef4444" : "1px solid var(--wa-border)",
                  }}
                />
                {errors.name && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--wa-text-secondary)" }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What is this group about?"
                  rows="3"
                  {...register("description")}
                  className="w-full rounded-lg px-3.5 py-2 text-sm outline-none resize-none transition-all"
                  style={{
                    backgroundColor: "var(--wa-bg-input)",
                    color: "var(--wa-text-primary)",
                    border: "1px solid var(--wa-border)",
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 cursor-pointer text-white"
                style={{ backgroundColor: "var(--wa-green)" }}
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
