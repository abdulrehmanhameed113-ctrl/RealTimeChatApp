import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { MessageSquare, Settings, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { authUser, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-transform duration-200 active:scale-95 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-500 transition-colors duration-200 group-hover:bg-indigo-600/20">
            {/* Glowing spot */}
            <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <MessageSquare className="h-6 w-6 relative z-10" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors duration-200">
            Chatly
          </span>
        </Link>

        {/* Right Side: Navigation Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            <Settings className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {authUser && (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
              >
                {authUser.profilePic ? (
                  <img
                    src={authUser.profilePic}
                    alt={authUser.name}
                    className="h-6 w-6 rounded-full object-cover ring-2 ring-indigo-500/30"
                  />
                ) : (
                  <User className="h-4.5 w-4.5" />
                )}
                <span className="hidden sm:inline">Profile</span>
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
