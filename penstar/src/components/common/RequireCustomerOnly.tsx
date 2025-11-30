import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { jwtDecode } from "jwt-decode";

/**
 * Component để chặn admin/staff vào các trang client dành riêng cho customer
 * Chỉ cho phép customer vào, redirect admin/staff về trang admin
 */
const RequireCustomerOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();
  const location = useLocation();

  // Nếu chưa đăng nhập, redirect về signin
  if (!auth?.user || !auth?.token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

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

    // Kiểm tra nếu là customer (role_id = 1 hoặc role_name = "customer")
    // Frontend mapping: customer: 1, staff: 2, manager: 3, admin: 4
    const isCustomer =
      roleName === "customer" ||
      (typeof roleId === "number" && roleId === 1); // role_id = 1 là customer

    // Nếu không phải customer (là admin/staff/manager), redirect về admin
    if (!isCustomer) {
      return <Navigate to="/admin" replace state={{ from: location }} />;
    }

    // Chỉ customer được phép vào
    return <>{children}</>;
  } catch (error) {
    // Nếu không decode được token, redirect về signin
    console.debug("RequireCustomerOnly: Failed to decode token", error);
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
};

export default RequireCustomerOnly;

