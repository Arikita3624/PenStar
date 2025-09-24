import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import HeaderAdmin from "./HeaderAdmin";

const LayoutAdmin = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <HeaderAdmin />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
