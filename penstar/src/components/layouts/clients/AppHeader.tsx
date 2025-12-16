import { Button, message, Dropdown, Avatar } from "antd";
import FullLogo from "@/assets/images/FullLogo.jpg";
import {
  UserOutlined,
  ProfileOutlined,
  BookOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
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
      <div
        className="container mx-auto px-4 flex items-center relative"
        style={{ minHeight: 72 }}
      >
        {/* Left: Slogan */}
        <div className="flex flex-col justify-center z-10 min-w-[180px]">
          <div className="text-xl font-bold text-gray-800 leading-tight">
            Khách sạn Penstar
          </div>
          <div className="text-xs text-gray-600 leading-tight">
            Trải nghiệm thoải mái, tiện nghi hiện đại
          </div>
        </div>

        {/* Center: Logo only */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center">
          <Link to="/">
            <img
              src={FullLogo}
              alt="Logo"
              className="h-24 w-auto object-contain"
              style={{ maxHeight: 120 }}
            />
          </Link>
        </div>

        {/* Right: Profile/Avatar and mobile booking button */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto z-10">
          {isLogged ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <ProfileOutlined />,
                    label: <Link to="/profile">Thông tin</Link>,
                  },
                  {
                    key: "bookings",
                    icon: <BookOutlined />,
                    label: <Link to="/bookings">Đặt phòng</Link>,
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    icon: <LogoutOutlined style={{ color: "#dc2626" }} />,
                    label: <span style={{ color: "#dc2626" }}>Đăng xuất</span>,
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Avatar
                style={{ backgroundColor: "#444", cursor: "pointer" }}
                size={40}
                icon={<UserOutlined style={{ fontSize: 24 }} />}
              />
            </Dropdown>
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
                Đăng nhập
              </Button>
            </Link>
          )}
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
      </div>
    </header>
  );
};

export default AppHeader;
