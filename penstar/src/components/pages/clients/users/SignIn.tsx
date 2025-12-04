import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "@/services/usersApi";
import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import useAuth from "@/hooks/useAuth";

const SignIn = () => {
  const navigate = useNavigate();
  const authRaw = useAuth();
  type AuthShape = { loginWithToken?: (t: string) => void } | null;
  const auth = authRaw as AuthShape;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async (token) => {
      console.debug(
        "[SignIn] login mutation onSuccess, token:",
        token,
        typeof token
      );
      if (!token || typeof token !== "string" || token.length < 10) {
        message.error(
          "Token trả về không hợp lệ! Vui lòng kiểm tra lại backend hoặc cấu hình JWT."
        );
        setError("Token trả về không hợp lệ!");
        return;
      }
      try {
        // Persist token to localStorage in case context isn't available or fails
        try {
          localStorage.setItem("penstar_token", token);
          console.debug(
            "[SignIn] localStorage token after set:",
            localStorage.getItem("penstar_token")
          );
        } catch (e) {
          console.debug("[SignIn] localStorage setItem failed", e);
        }
        if (auth && typeof auth.loginWithToken === "function") {
          auth.loginWithToken(token);
        }
        // Lấy thông tin user từ backend và lưu vào localStorage
        try {
          const { getCurrentUser } = await import("@/services/usersApi");
          const user = await getCurrentUser();
          if (user) {
            localStorage.setItem("penstar_user", JSON.stringify(user));
            console.debug("[SignIn] user info saved:", user);
          }
        } catch (e) {
          console.debug("[SignIn] getCurrentUser failed", e);
        }
      } catch (e) {
        // fallback and expose debug info
        console.debug("loginWithToken failed", e);
        localStorage.setItem("penstar_token", token);
      }
      message.success("Đăng nhập thành công");
      // Ensure token is persisted and app re-initializes auth state
      try {
        console.debug(
          "[SignIn] final localStorage token:",
          localStorage.getItem("penstar_token")
        );
      } catch (e) {
        console.debug("[SignIn] localStorage read failed", e);
      }
      navigate("/");
      // Reload to ensure AuthProvider re-initializes and picks up token
      setTimeout(() => window.location.reload(), 200);
    },
    onError: (err) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = (err as any)?.response?.data?.message;
      const errMsg =
        typeof axiosErr === "string" ? axiosErr : "Đăng nhập thất bại";
      setError(errMsg);
      message.error(errMsg);
    },
    onSettled: () => setLoading(false),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }
    setLoading(true);
    // Log before login
    try {
      localStorage.setItem("test_key", "test_value");
      console.debug(
        "[SignIn] test localStorage setItem success:",
        localStorage.getItem("test_key")
      );
    } catch (err) {
      console.debug("[SignIn] test localStorage setItem failed:", err);
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đăng nhập</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
