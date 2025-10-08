import Dashboard from "@/components/pages/admin/Dashboard";
import LayoutAdmin from "@/components/pages/admin/LayoutAdmin";
import Rooms from "@/components/pages/admin/rooms/Rooms";
import { Route, Routes } from "react-router-dom";

const AppRouter = () => {
  return (
    <div>
      <Routes>
        <Route path="admin" element={<LayoutAdmin />}>
          <Route index element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AppRouter;
