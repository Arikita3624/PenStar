import AppFooter from "@/components/layouts/clients/AppFooter";
import AppHeader from "@/components/layouts/clients/AppHeader";
import { Outlet } from "react-router-dom";

const LayoutClient = () => {
  return (
    <div>
      <AppHeader />
      <Outlet />
      <AppFooter />
    </div>
  );
};

export default LayoutClient;
