import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type Props = { children: React.ReactNode; role?: string | string[] };

const ROLE_LEVEL: Record<string, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

const RequireRole = ({ children, role }: Props) => {
  try {
    const token = localStorage.getItem("penstar_token");
    if (!token) return <Navigate to="/signin" replace />;

    type DecodedToken = {
      role?: string;
      role_name?: string;
      role_id?: number;
    } & Record<string, unknown>;
    const decoded = jwtDecode<DecodedToken>(token);
    const userRoleName = (decoded?.role ?? decoded?.role_name ?? "")
      .toString()
      .toLowerCase();
    const userRoleId = decoded?.role_id;

    // if no role information at all, reject
    if (!userRoleName && typeof userRoleId !== "number")
      return <Navigate to="/403" replace />;

    // compute user's numeric level
    const userLevel =
      typeof userRoleName === "string" && ROLE_LEVEL[userRoleName] !== undefined
        ? ROLE_LEVEL[userRoleName]
        : typeof userRoleId === "number"
        ? userRoleId
        : -1;

    // if wrapper not given a required role, default: only block 'customer'
    if (!role) {
      if (userLevel <= (ROLE_LEVEL["customer"] ?? 0))
        return <Navigate to="/403" replace />;
      return <>{children}</>;
    }

    // normalize required role(s) to minimum level
    const requiredRoles = Array.isArray(role) ? role : [role];
    const requiredLevels = requiredRoles.map(
      (r) => ROLE_LEVEL[String(r).toLowerCase()] ?? Infinity
    );
    const minRequired = Math.min(...requiredLevels);

    if (userLevel >= minRequired) return <>{children}</>;
    return <Navigate to="/403" replace />;
  } catch (e) {
    console.debug("RequireRole decode error", e);
    return <Navigate to="/signin" replace />;
  }
};

export default RequireRole;
