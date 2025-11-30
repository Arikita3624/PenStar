import { Button, message, Dropdown, Avatar } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import useAuth from "@/hooks/useAuth";

const Header = () => {
  const auth = useAuth();
  const user = auth?.user;

  const handleLogout = () => {
    try {
      if (auth && typeof auth.logout === "function") {
        auth.logout();
        message.success("Đã đăng xuất");
      } else {
        // fallback
        localStorage.removeItem("penstar_token");
        message.success("Đã đăng xuất");
        window.location.href = "/signin";
      }
    } catch (e) {
      console.error(e);
      message.error("Lỗi khi đăng xuất");
    }
  };

  const roleName = auth?.getRoleName?.(user) || "User";
  const displayName = user?.full_name || user?.email || "Admin";
  const displayRole = roleName.charAt(0).toUpperCase() + roleName.slice(1);

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="px-2 py-1">
          <div className="font-semibold">{displayName}</div>
          <div className="text-xs text-gray-500">{displayRole}</div>
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
      </div>

      <div className="flex items-center gap-3">
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button
            type="text"
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Avatar size="small" icon={<UserOutlined />} />
            <span className="hidden md:inline text-gray-700">
              {displayName}
            </span>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
