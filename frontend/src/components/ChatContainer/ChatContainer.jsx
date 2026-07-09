import { useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSocketStore } from "../../store/useSocketStore";
import MessageInput from "../MessageInput/MessageInput";
import { Phone, Video, Search, ChevronLeft, LogOut } from "lucide-react";
import toast from "react-hot-toast";

// WhatsApp double-check SVG icon
const CheckIcon = ({ isRead }) => (
  <svg viewBox="0 0 18 18" width="16" height="16" style={{ display: "inline" }}>
    {isRead ? (
      <>
        <path
          d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198a.38.38 0 01-.577.039l-.427-.388a.381.381 0 00-.578.038l-.451.576a.497.497 0 00.043.645l1.575 1.51a.38.38 0 00.577-.039l7.483-9.602a.436.436 0 00-.076-.609z"
          fill="#53bdeb"
        />
        <path
          d="M11.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198a.38.38 0 01-.577.039l-1.614-1.566a.497.497 0 00-.648.021l-.498.506a.476.476 0 00.012.665l2.764 2.655a.38.38 0 00.577-.039l7.483-9.602a.436.436 0 00-.076-.609z"
          fill="#53bdeb"
        />
      </>
    ) : (
      <path
        d="M11.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198a.38.38 0 01-.577.039l-1.614-1.566a.497.497 0 00-.648.021l-.498.506a.476.476 0 00.012.665l2.764 2.655a.38.38 0 00.577-.039l7.483-9.602a.436.436 0 00-.076-.609z"
        fill="#8696A0"
      />
    )}
  </svg>
);

export default function ChatContainer() {
  const {
    messages,
    selectedUser,
    selectedGroup,
    isMessagesLoading,
    typingUsers,
    setSelectedUser,
    setSelectedGroup,
    getMessages,
    hasMoreMessages,
    leaveGroup,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesCount = useRef(0);

  const chatEntity = selectedUser || selectedGroup;
  const isGroup = !!selectedGroup;

  // Direct chat presence details
  const isOnline = !isGroup && selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  // Group typing list
  const typersInThisGroup = isGroup
    ? Object.keys(typingUsers)
        .filter((k) => k.startsWith(`${selectedGroup._id}_`) && typingUsers[k])
        .map((k) => {
          const senderId = k.split("_")[1];
          const member = selectedGroup.members.find((m) => m._id === senderId);
          return member ? member.name : "Someone";
        })
    : [];

  const isTyping = isGroup ? typersInThisGroup.length > 0 : selectedUser && typingUsers[selectedUser._id];

  const getSubheadingText = () => {
    if (isGroup) {
      if (typersInThisGroup.length > 0) {
        return `${typersInThisGroup.join(", ")} ${
          typersInThisGroup.length > 1 ? "are" : "is"
        } typing...`;
      }
      return `${selectedGroup.members.length} members`;
    } else {
      if (isTyping) return "typing...";
      return isOnline ? "online" : "offline";
    }
  };

  // Prevent scroll jump and maintain scroll positions on pagination loading
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (messages.length > prevMessagesCount.current && prevScrollHeightRef.current > 0) {
        // We prepended older messages
        const addedHeight = container.scrollHeight - prevScrollHeightRef.current;
        container.scrollTop = addedHeight;
      } else {
        // Initial chat loaded or new messages received -> scroll to bottom
        container.scrollTop = container.scrollHeight;
      }
      prevScrollHeightRef.current = container.scrollHeight;
      prevMessagesCount.current = messages.length;
    }
  }, [messages]);

  // Initial scroll when typing starts
  useEffect(() => {
    if (isTyping && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Scroll to bottom if we are already close to the bottom
      const isCloseToBottom =
        container.scrollHeight - container.clientHeight - container.scrollTop < 200;
      if (isCloseToBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [isTyping]);

  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollTop === 0 && hasMoreMessages && !isMessagesLoading) {
      prevScrollHeightRef.current = container.scrollHeight;
      getMessages(chatEntity._id, true);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "var(--wa-bg-chat)" }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--wa-border)", borderTopColor: "var(--wa-green)" }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* ── Chat Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{ backgroundColor: "var(--wa-bg-panel)", borderBottom: "1px solid var(--wa-border)" }}
      >
        <button
          onClick={handleBack}
          className="lg:hidden p-1 rounded-full cursor-pointer"
          style={{ color: "var(--wa-icon)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative">
          {isGroup ? (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm"
              style={{ backgroundColor: "var(--wa-bg-panel-2)", border: "1px solid var(--wa-border)" }}
            >
              {selectedGroup.name.slice(0, 2).toUpperCase()}
            </div>
          ) : selectedUser?.profilePic ? (
            <img src={selectedUser.profilePic} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
              style={{ backgroundColor: "#6B7280" }}
            >
              {selectedUser?.name.charAt(0).toUpperCase()}
            </div>
          )}
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ backgroundColor: "var(--wa-green)", borderColor: "var(--wa-bg-panel)" }}
            />
          )}
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--wa-text-primary)" }}>
            {chatEntity.name}
          </p>
          <p className="text-xs truncate" style={{ color: isTyping ? "var(--wa-green)" : "var(--wa-text-secondary)" }}>
            {getSubheadingText()}
          </p>
        </div>

        {/* Header icons */}
        <div className="flex items-center gap-2">
          {isGroup && (
            <button
              onClick={async () => {
                if (confirm(`Leave group "${selectedGroup.name}"?`)) {
                  try {
                    await leaveGroup(selectedGroup._id);
                    toast.success(`Left group ${selectedGroup.name}`);
                  } catch (err) {
                    toast.error("Failed to leave group");
                  }
                }
              }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all border border-rose-500/20 font-medium"
              title="Leave Group"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Group</span>
            </button>
          )}
          <button className="p-2 rounded-full cursor-pointer" style={{ color: "var(--wa-icon)" }}>
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 min-h-0 chat-bg"
      >
        {isMessagesLoading && hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--wa-border)", borderTopColor: "var(--wa-green)" }}
            />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "rgba(17,27,33,0.85)", color: "var(--wa-text-secondary)" }}
            >
              No messages yet. Say hello! 👋
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex justify-center my-3">
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ backgroundColor: "var(--wa-bg-panel)", color: "var(--wa-text-secondary)" }}
                >
                  {formatDateSeparator(msgs[0].createdAt)}
                </span>
              </div>

              {/* Messages */}
              {msgs.map((msg) => {
                const msgSenderId = msg.senderId?._id || msg.senderId;
                const isSent = String(msgSenderId) === String(authUser._id);

                return (
                  <div
                    key={msg._id}
                    className={`flex mb-1.5 ${isSent ? "justify-end msg-sent" : "justify-start msg-received"}`}
                  >
                    <div
                      className={`max-w-[65%] px-3 py-2 shadow-sm ${isSent ? "bubble-sent" : "bubble-received"}`}
                      style={{ minWidth: "80px" }}
                    >
                      {/* Sender Name (Only in Group Chats for received messages) */}
                      {!isSent && isGroup && (
                        <span className="text-[11px] font-bold block mb-1 text-emerald-400">
                          {msg.senderId?.name || "Unknown"}
                        </span>
                      )}

                      {/* Attached Image/File */}
                      {msg.image && (
                        <div className="mb-1 rounded-md overflow-hidden bg-slate-900 border border-slate-800">
                          {msg.image.toLowerCase().endsWith(".pdf") ||
                          !msg.image.match(/\.(jpeg|jpg|gif|png|webp|svg)/gi) ? (
                            // Document view
                            <div className="p-3 flex items-center justify-between gap-3 text-xs">
                              <span className="truncate text-slate-300">Shared File Link</span>
                              <a
                                href={msg.image}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded transition-colors text-[10px]"
                              >
                                Open File
                              </a>
                            </div>
                          ) : (
                            // Image view
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="max-h-64 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.image, "_blank")}
                            />
                          )}
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && (
                        <p
                          className="text-sm leading-relaxed break-words"
                          style={{ color: "var(--wa-text-primary)" }}
                        >
                          {msg.text}
                        </p>
                      )}

                      {/* Timestamp + Receipts */}
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className="text-xs" style={{ color: "var(--wa-text-secondary)", fontSize: "10px" }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isSent && !isGroup && <CheckIcon isRead={msg.isRead} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex justify-start mb-2 msg-received">
            <div
              className="bubble-received px-4 py-3 shadow-sm flex items-center gap-1"
              style={{ minWidth: "60px" }}
            >
              {isGroup && (
                <span className="text-[10px] font-bold block text-emerald-400 mr-2">
                  {typersInThisGroup.length === 1 ? typersInThisGroup[0] : "People"} typing
                </span>
              )}
              <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--wa-text-secondary)" }} />
              <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--wa-text-secondary)" }} />
              <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--wa-text-secondary)" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Message Input ── */}
      <MessageInput />
    </div>
  );
}
