import AppFooter from "@/components/layouts/clients/AppFooter";
import AppHeader from "@/components/layouts/clients/AppHeader";
import { Outlet } from "react-router-dom";

const LayoutClient = () => {
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
