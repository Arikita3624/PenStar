import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "@/services/usersApi";
import { useMutation } from "@tanstack/react-query";
import { message } from "antd";

const SignUp = () => {
  const navigate = useNavigate();
  const [payload, setPayload] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const regMut = useMutation({
    mutationFn: (p: typeof payload) => register(p),
    onSuccess: () => {
      message.success("Đăng ký thành công");
      navigate("/signin");
    },
    onError: (err) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = (err as any)?.response?.data?.message;
      const errMsg =
        typeof axiosErr === "string" ? axiosErr : "Đăng ký thất bại";
      setError(errMsg);
      message.error(errMsg);
    },
    onSettled: () => setLoading(false),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!payload.email || !payload.password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }
    setLoading(true);
    regMut.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đăng ký</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Họ và tên
            </label>
            <input
              value={payload.full_name}
              onChange={(e) =>
                setPayload({ ...payload, full_name: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              type="text"
              placeholder="Nguyen Van A"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              value={payload.email}
              onChange={(e) =>
                setPayload({ ...payload, email: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <input
              value={payload.password}
              onChange={(e) =>
                setPayload({ ...payload, password: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Số điện thoại
            </label>
            <input
              value={payload.phone}
              onChange={(e) =>
                setPayload({ ...payload, phone: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              type="text"
              placeholder="0123456789"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/signin" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
