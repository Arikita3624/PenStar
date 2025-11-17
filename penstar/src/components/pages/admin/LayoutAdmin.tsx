import Header from "@/components/layouts/admin/Header";
import Sidebar from "@/components/layouts/admin/Sidebar";
import { Outlet } from "react-router-dom";

const LayoutAdmin = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
