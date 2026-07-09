import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen gap-4"
      style={{ backgroundColor: "var(--wa-bg-main)" }}
    >
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--wa-border)", borderTopColor: "var(--wa-green)" }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--wa-text-secondary)" }}>
        Connecting...
      </p>
    </div>
  );
}
