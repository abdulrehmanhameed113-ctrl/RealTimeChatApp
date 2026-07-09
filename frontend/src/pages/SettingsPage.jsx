import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Moon, Lock, HelpCircle, Info } from "lucide-react";

const SETTINGS = [
  { icon: <Bell className="w-5 h-5" />, label: "Notifications", sub: "Message, group & call tones" },
  { icon: <Moon className="w-5 h-5" />, label: "Appearance", sub: "Dark theme enabled" },
  { icon: <Lock className="w-5 h-5" />, label: "Privacy", sub: "Last seen, profile photo" },
  { icon: <HelpCircle className="w-5 h-5" />, label: "Help", sub: "Help centre, contact us, privacy policy" },
  { icon: <Info className="w-5 h-5" />, label: "About", sub: "Chatly v1.0.0" },
];

export default function SettingsPage() {
  const navigate = useNavigate();

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
        <h1 className="text-lg font-semibold text-white">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">

        {/* App info badge */}
        <div
          className="flex items-center gap-3 px-4 py-4 rounded-xl"
          style={{ backgroundColor: "var(--wa-bg-panel)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--wa-green)" }}
          >
            <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975.99-3.648-.235-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--wa-text-primary)" }}>Chatly</p>
            <p className="text-xs" style={{ color: "var(--wa-text-secondary)" }}>Real-time messaging app</p>
          </div>
        </div>

        {/* Settings list */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--wa-bg-panel)" }}>
          {SETTINGS.map((item, i) => (
            <div key={item.label}>
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left cursor-pointer transition-colors"
                style={{ color: "var(--wa-text-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--wa-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span style={{ color: "var(--wa-text-secondary)" }}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--wa-text-secondary)" }}>{item.sub}</p>
                </div>
                <ChevronLeft className="w-4 h-4 rotate-180" style={{ color: "var(--wa-text-secondary)" }} />
              </button>
              {i < SETTINGS.length - 1 && (
                <div style={{ height: "1px", backgroundColor: "var(--wa-border)", marginLeft: "56px" }} />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs py-2" style={{ color: "var(--wa-text-secondary)" }}>
          from Chatly Team
        </p>
      </div>
    </div>
  );
}