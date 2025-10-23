import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type Props = { children: React.ReactNode };

const RequireRole = ({ children }: Props) => {
  try {
    const token = localStorage.getItem("penstar_token");
    if (!token) return <Navigate to="/signin" replace />;

    type DecodedToken = { role?: string; role_name?: string } & Record<
      string,
      unknown
    >;
    const decoded = jwtDecode<DecodedToken>(token);
    const role = decoded?.role ?? decoded?.role_name ?? null;
    if (!role) return <Navigate to="/403" replace />;
    if (String(role).toLowerCase() === "customer")
      return <Navigate to="/403" replace />;

    return <>{children}</>;
  } catch (e) {
    // token invalid or decode failed
    // redirect to signin to force fresh login
    console.debug("RequireRole decode error", e);
    return <Navigate to="/signin" replace />;
  }
};

export default RequireRole;
