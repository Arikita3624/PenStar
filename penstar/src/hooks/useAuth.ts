import React from "react";
import AuthContext from "@/contexts/AuthProvider";

const useAuth = () => {
  return React.useContext(AuthContext as unknown as React.Context<unknown>);
};

export default useAuth;
