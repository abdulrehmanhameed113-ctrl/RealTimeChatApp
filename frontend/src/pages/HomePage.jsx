import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatContainer from "../components/ChatContainer/ChatContainer";
import { MessageSquare } from "lucide-react";

export default function HomePage() {
  const {
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { socket } = useSocketStore();
  const chatEntity = selectedUser || selectedGroup;

  useEffect(() => {
    if (!socket) return;
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [socket, subscribeToMessages, unsubscribeFromMessages]);

  const handleBack = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950 min-h-0">
      {/* Sidebar Section */}
      <div className={`h-full min-h-0 shrink-0 ${chatEntity ? "hidden lg:block" : "w-full lg:w-auto"}`}>
        <Sidebar />
      </div>

      {/* Main Chat Panel / Empty State */}
      {chatEntity ? (
        <div className="flex-1 flex flex-col h-full min-h-0">
          {/* Back button for mobile view */}
          <div className="lg:hidden p-3 bg-slate-950 border-b border-slate-800 flex items-center shrink-0">
            <button
              onClick={handleBack}
              className="text-indigo-400 font-semibold text-sm hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              &larr; Back to Conversations
            </button>
          </div>
          <ChatContainer />
        </div>
      ) : (
        /* Empty Conversation State */
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-slate-950 p-8 text-center text-slate-500 relative">
          <div className="absolute w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 rounded-full bg-indigo-600/10 blur-xl opacity-60 animate-pulse"></div>
            <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center relative z-10 shadow-lg">
              <MessageSquare className="h-8 w-8" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Welcome to Chatly!</h2>
          <p className="text-sm max-w-sm leading-relaxed text-slate-400">
            Select a buddy or group from the sidebar list to start exchanging real-time messages, sharing files, and viewing indicators.
          </p>
        </div>
      )}
    </div>
  );
}