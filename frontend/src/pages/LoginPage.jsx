import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export default function LoginPage() {
  const { login, isLoggingIn } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--wa-bg-main)" }}
    >
      {/* Logo area */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--wa-green)" }}
        >
          <svg viewBox="0 0 24 24" fill="white" width="42" height="42">
            <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975.99-3.648-.235-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--wa-text-primary)" }}>
          Chatly
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--wa-text-secondary)" }}>
          Sign in to your account
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: "var(--wa-bg-panel)" }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--wa-text-secondary)" }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              disabled={isLoggingIn}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--wa-bg-input)",
                color: "var(--wa-text-primary)",
                border: errors.email ? "1px solid #ef4444" : "1px solid var(--wa-border)",
              }}
              onFocus={(e) => {
                if (!errors.email) e.target.style.borderColor = "var(--wa-green)";
              }}
              onBlur={(e) => {
                if (!errors.email) e.target.style.borderColor = "var(--wa-border)";
              }}
            />
            {errors.email && (
              <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--wa-text-secondary)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoggingIn}
                className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--wa-bg-input)",
                  color: "var(--wa-text-primary)",
                  border: errors.password ? "1px solid #ef4444" : "1px solid var(--wa-border)",
                }}
                onFocus={(e) => {
                  if (!errors.password) e.target.style.borderColor = "var(--wa-green)";
                }}
                onBlur={(e) => {
                  if (!errors.password) e.target.style.borderColor = "var(--wa-border)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "var(--wa-text-secondary)" }}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-98 disabled:opacity-60 cursor-pointer mt-2"
            style={{ backgroundColor: "var(--wa-green)", color: "#fff" }}
          >
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color: "var(--wa-text-secondary)" }}>
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold"
            style={{ color: "var(--wa-green)" }}
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}