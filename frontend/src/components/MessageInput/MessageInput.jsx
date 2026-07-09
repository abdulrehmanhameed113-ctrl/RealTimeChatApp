import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSocketStore } from "../../store/useSocketStore";
import { Paperclip, Smile, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const EMOJIS = ["😀","😂","😍","🤔","👍","❤️","🔥","🎉","✨","😢","🙏","💪","🤣","😎","🥰","😅","🤗","🥳","😭","😤"];

export default function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileRef = useRef(null);
  const typingTimeout = useRef(null);
  const emojiRef = useRef(null);

  const { selectedUser, selectedGroup, sendMessage } = useChatStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocketStore();

  const chatEntity = selectedUser || selectedGroup;

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Accept images as well as PDFs and common document types
    const allowedTypes = ["image/", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));

    if (!isAllowed) {
      toast.error("Please select an image or a valid document (PDF/Word/Text).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      setIsSending(true);
      if (socket && chatEntity) {
        socket.emit("stopTyping", {
          senderId: authUser._id,
          receiverId: selectedUser ? selectedUser._id : undefined,
          groupId: selectedGroup ? selectedGroup._id : undefined,
        });
        setIsTypingLocal(false);
      }
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    if (!socket || !chatEntity) return;

    if (!isTypingLocal) {
      setIsTypingLocal(true);
      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser ? selectedUser._id : undefined,
        groupId: selectedGroup ? selectedGroup._id : undefined,
      });
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedUser ? selectedUser._id : undefined,
        groupId: selectedGroup ? selectedGroup._id : undefined,
      });
      setIsTypingLocal(false);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div
      className="shrink-0 px-3 py-2"
      style={{ backgroundColor: "var(--wa-bg-panel)", borderTop: "1px solid var(--wa-border)" }}
    >
      {/* File/Image preview strip */}
      {imagePreview && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="relative">
            {imagePreview.startsWith("data:image/") ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 object-cover rounded-lg border"
                style={{ borderColor: "var(--wa-border)" }}
              />
            ) : (
              <div
                className="h-16 w-16 flex flex-col items-center justify-center rounded-lg border text-[10px] text-slate-300 font-bold bg-slate-900"
                style={{ borderColor: "var(--wa-border)" }}
              >
                <span>📎 File</span>
                <span>Ready</span>
              </div>
            )}
            <button
              onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: "var(--wa-bg-panel)", border: "1px solid var(--wa-border)" }}
            >
              <X className="w-3 h-3" style={{ color: "var(--wa-text-secondary)" }} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Emoji button */}
        <div className="relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2 rounded-full cursor-pointer transition-colors"
            style={{ color: "var(--wa-icon)" }}
          >
            <Smile className="w-6 h-6" />
          </button>

          {showEmojis && (
            <div
              className="absolute bottom-12 left-0 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-xl z-50 w-52"
              style={{ backgroundColor: "var(--wa-bg-panel-2)", border: "1px solid var(--wa-border)" }}
            >
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => { setText((p) => p + em); setShowEmojis(false); }}
                  className="text-xl p-1.5 rounded-lg hover:bg-opacity-50 cursor-pointer transition-transform active:scale-90"
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-full cursor-pointer"
          style={{ color: imagePreview ? "var(--wa-green)" : "var(--wa-icon)" }}
        >
          <Paperclip className="w-6 h-6" />
        </button>
        <input type="file" ref={fileRef} onChange={handleImageChange} className="hidden" />

        {/* Text input */}
        <div
          className="flex-1 flex items-center rounded-full px-4 py-2"
          style={{ backgroundColor: "var(--wa-bg-input)" }}
        >
          <input
            type="text"
            placeholder="Type a message"
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--wa-text-primary)" }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !imagePreview)}
          className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
        >
          <Send className="w-5 h-5" style={{ transform: "translateX(1px)" }} />
        </button>
      </form>
    </div>
  );
}
