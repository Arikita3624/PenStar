import Dashboard from "@/components/pages/admin/Dashboard";
import LayoutAdmin from "@/components/pages/admin/LayoutAdmin";
import RoomAdd from "@/components/pages/admin/rooms/RoomAdd";
import RoomEdit from "@/components/pages/admin/rooms/RoomEdit";
import Rooms from "@/components/pages/admin/rooms/Rooms";
import { Route, Routes } from "react-router-dom";

const AppRouter = () => {
  return (
    <div>
      <Routes>
        <Route path="admin" element={<LayoutAdmin />}>
          <Route index element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/add" element={<RoomAdd />} />
          <Route path="rooms/edit/:id" element={<RoomEdit />} />
          {/* Branches */}
        </Route>
      </Routes>
    </div>
  );
};

export default AppRouter;
