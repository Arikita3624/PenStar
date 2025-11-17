import React from "react";
import AuthContext from "@/contexts/AuthProvider";
import type { AuthContextType } from "@/types/auth";

const useAuth = () => {
  return React.useContext(AuthContext as React.Context<AuthContextType | null>);
};

export default useAuth;
