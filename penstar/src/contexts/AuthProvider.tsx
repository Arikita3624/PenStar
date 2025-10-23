import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { instance } from "@/services/api";
import type { User, RolesMap, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("penstar_token")
  );
  const [user, setUser] = useState<User>(null);
  const [rolesMap, setRolesMap] = useState<RolesMap>(null);

  useEffect(() => {
    if (!token) return setUser(null);
    try {
      type Decoded = {
        id?: number | string;
        email?: string;
        role_id?: number | string;
        role?: string;
      };
      const decoded = jwtDecode<Decoded>(token as string);
      setUser({
        id: Number(decoded.id) || 0,
        email: String(decoded.email || ""),
        role_id: decoded.role_id ? Number(decoded.role_id) : undefined,
        role: decoded.role ? String(decoded.role) : undefined,
      });
    } catch {
      localStorage.removeItem("penstar_token");
      setToken(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const res = await instance.get("/api/roles");
        const roles = Array.isArray(res.data)
          ? res.data
          : res.data?.roles || res.data?.data || [];
        const byId: Record<number, string> = {};
        const byName: Record<string, number> = {};
        const order: string[] = [];
        roles.sort(
          (
            a: { level?: number; id: number },
            b: { level?: number; id: number }
          ) => (a.level ?? a.id) - (b.level ?? b.id)
        );
        for (const r of roles) {
          byId[r.id] = r.name;
          byName[r.name] = r.id;
          order.push(r.name);
        }
        setRolesMap({ byId, byName, order });
      } catch (e) {
        console.debug("roles fetch failed", e);
      }
    })();
  }, []);

  const loginWithToken = (t: string) => {
    try {
      localStorage.setItem("penstar_token", t);
    } catch (e) {
      console.debug("store token failed", e);
    }
    setToken(t);
  };

  const logout = () => {
    try {
      localStorage.removeItem("penstar_token");
    } catch (e) {
      console.debug("remove token failed", e);
    }
    setToken(null);
    setUser(null);
    window.location.href = "/signin";
  };

  const getRoleName = (u?: User) => {
    if (!u) return null;
    if (u.role) return u.role;
    if (rolesMap && u.role_id) return rolesMap.byId[u.role_id] ?? null;
    return null;
  };

  return (
    <AuthContext.Provider
      value={{ token, user, rolesMap, loginWithToken, logout, getRoleName }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
