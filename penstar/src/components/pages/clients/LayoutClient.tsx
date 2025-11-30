import AppFooter from "@/components/layouts/clients/AppFooter";
import AppHeader from "@/components/layouts/clients/AppHeader";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { jwtDecode } from "jwt-decode";

const LayoutClient = () => {
  const auth = useAuth();
  const location = useLocation();

  // Kiểm tra nếu đã đăng nhập và là admin/staff, chặn vào trang client
  if (auth?.user && auth?.token) {
    try {
      // Decode token trực tiếp để lấy role chính xác
      type DecodedToken = {
        role?: string;
        role_name?: string;
        role_id?: number;
      } & Record<string, unknown>;

      const decoded = jwtDecode<DecodedToken>(auth.token);
      const roleName = (decoded?.role ?? decoded?.role_name ?? "")
        .toString()
        .toLowerCase();
      const roleId = decoded?.role_id;

      // Kiểm tra nếu là customer
      // Frontend mapping: customer: 1, staff: 2, manager: 3, admin: 4
      const isCustomer =
        roleName === "customer" || (typeof roleId === "number" && roleId === 1);

      const currentPath = location.pathname;

      // Cho phép vào signin/signup để có thể đăng nhập/đăng ký
      // Nếu không phải customer và không phải ở trang signin/signup, redirect về admin
      if (
        !isCustomer &&
        currentPath !== "/signin" &&
        currentPath !== "/signup"
      ) {
        return <Navigate to="/admin" replace />;
      }
    } catch (error) {
      // Nếu không decode được token, cho phép vào (fallback)
      console.debug("LayoutClient: Failed to decode token", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      {/* Main content with max-width container */}
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
};

export default LayoutClient;
