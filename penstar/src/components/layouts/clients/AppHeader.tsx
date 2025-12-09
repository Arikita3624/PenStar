import { Button, message, Space } from "antd";
import { PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";

const AppHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const authRaw = useAuth();
  type AuthShape = { token?: string | null; logout?: () => void } | null;
  const auth = authRaw as AuthShape;
  const isLogged = !!auth?.token;
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // We rely on AuthProvider to update auth state across the app.

  const handleLogout = () => {
    try {
      if (auth && typeof auth.logout === "function") {
        auth.logout();
        message.success("Đã đăng xuất");
      } else {
        // fallback
        localStorage.removeItem("penstar_token");
        message.success("Đã đăng xuất");
        navigate("/");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header
      className={`bg-white text-gray-800 sticky top-0 z-50 transition-all duration-300 border-b border-gray-200 ${
        scrolled ? "shadow-md py-2" : "py-3"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            PS
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">
              Khách sạn Penstar
            </div>
            <div className="text-xs text-gray-600">
              Trải nghiệm thoải mái, tiện nghi hiện đại
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-gray-700 hover:text-[#0a4f86] font-medium transition"
          >
            Trang chủ
          </Link>
          <Link
            to="/rooms"
            className="text-gray-700 hover:text-[#0a4f86] font-medium transition"
          >
            Phòng
          </Link>
          <Link
            to="/bookings"
            className="text-gray-700 hover:text-[#0a4f86] font-medium transition"
          >
            Đặt phòng
          </Link>
          <Link
            to="/contact"
            className="text-gray-700 hover:text-[#0a4f86] font-medium transition"
          >
            Liên hệ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+84 394879813"
            className="hidden md:flex items-center gap-2 text-sm text-gray-700 hover:text-[#0a4f86] transition"
          >
            <PhoneOutlined className="text-base" /> <span>+84 394879813</span>
          </a>
          {isLogged ? (
            <Space>
              <Link to="/profile">
                <Button
                  style={{
                    backgroundColor: "#0a4f86",
                    borderColor: "#0a4f86",
                    color: "#ffffff",
                  }}
                >
                  Tài khoản
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                style={{
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                  color: "#ffffff",
                }}
              >
                Đăng xuất
              </Button>
            </Space>
          ) : (
            <Link to="/signin">
              <Button
                style={{
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: "500",
                }}
              >
                Đăng xuất
              </Button>
            </Link>
          )}
        </div>
        <div className="md:hidden">
          <Link to="/booking">
            <Button
              size="small"
              style={{
                backgroundColor: "#0a66a3",
                borderColor: "#0a66a3",
                color: "#ffffff",
              }}
            >
              Đặt
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
