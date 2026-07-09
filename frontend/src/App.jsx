import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useSocketStore } from "./store/useSocketStore";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Loader from "./components/Loader/Loader";
import { Toaster } from "react-hot-toast";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser) {
    return <Loader />;
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--wa-bg-main)", color: "var(--wa-text-primary)", fontFamily: "'Inter', sans-serif" }}
    >
      <Routes>
        <Route path="/"        element={authUser ? <HomePage />    : <Navigate to="/login" />} />
        <Route path="/login"   element={!authUser ? <LoginPage />  : <Navigate to="/" />} />
        <Route path="/signup"  element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="*"        element={<Navigate to="/" />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#202C33",
            color: "#E9EDEF",
            border: "1px solid #313D43",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}

export default App;