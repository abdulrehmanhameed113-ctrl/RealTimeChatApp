import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Calendar, ShieldCheck, ChevronLeft, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { authUser, updateProfile, isUpdatingProfile, logout } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image."); return; }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("profilePic", file);
      await updateProfile(fd);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--wa-bg-main)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-4 py-3"
        style={{ backgroundColor: "var(--wa-teal)" }}
      >
        <button onClick={() => navigate("/")} className="cursor-pointer" style={{ color: "#fff" }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-white">Profile</h1>
      </div>

      {/* Avatar Section */}
      <div
        className="flex flex-col items-center py-10 gap-3"
        style={{ backgroundColor: "var(--wa-bg-panel-2)" }}
      >
        <div className="relative">
          <img
            src={authUser?.profilePic || `https://ui-avatars.com/api/?name=${authUser?.name}&background=00A884&color=fff&size=128`}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4"
            style={{ borderColor: "var(--wa-bg-panel)" }}
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
            style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
          >
            <Camera className="w-4.5 h-4.5" />
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        <p className="text-xl font-semibold" style={{ color: "var(--wa-text-primary)" }}>{authUser?.name}</p>
        {uploading && <p className="text-xs" style={{ color: "var(--wa-green)" }}>Uploading...</p>}
      </div>

      {/* Info fields */}
      <div className="flex-1 px-4 py-6 space-y-3 max-w-lg mx-auto w-full">
        {/* About label */}
        <p className="text-xs font-medium px-1" style={{ color: "var(--wa-green)" }}>YOUR INFO</p>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--wa-bg-panel)" }}>
          <InfoRow icon={<User className="w-5 h-5" />} label="Name" value={authUser?.name} />
          <div style={{ height: "1px", backgroundColor: "var(--wa-border)", marginLeft: "56px" }} />
          <InfoRow icon={<Mail className="w-5 h-5" />} label="Email" value={authUser?.email} />
          <div style={{ height: "1px", backgroundColor: "var(--wa-border)", marginLeft: "56px" }} />
          <InfoRow icon={<Calendar className="w-5 h-5" />} label="Joined" value={formatDate(authUser?.createdAt)} />
          <div style={{ height: "1px", backgroundColor: "var(--wa-border)", marginLeft: "56px" }} />
          <InfoRow
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Status"
            value="Active"
            valueColor="var(--wa-green)"
          />
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm cursor-pointer mt-4 transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--wa-bg-panel)", color: "#EF4444" }}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span style={{ color: "var(--wa-text-secondary)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: "var(--wa-text-secondary)" }}>{label}</p>
        <p className="text-sm font-medium mt-0.5 truncate" style={{ color: valueColor || "var(--wa-text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}