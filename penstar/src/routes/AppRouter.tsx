import Branches from "@/components/pages/admin/branches/Branches";
import BranchAdd from "@/components/pages/admin/branches/BranchesAdd";
import BranchEdit from "@/components/pages/admin/branches/BranchesEdit";
import Dashboard from "@/components/pages/admin/Dashboard";
import LayoutAdmin from "@/components/pages/admin/LayoutAdmin";
import RoomTypes from "@/components/pages/admin/rooms type/RoomTypes";
import RTAdd from "@/components/pages/admin/rooms type/RTAdd";
import RTEdit from "@/components/pages/admin/rooms type/RTEdit";
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
          <Route path="branches" element={<Branches />} />
          <Route path="branches/add" element={<BranchAdd />} />
          <Route path="branches/edit/:id" element={<BranchEdit />} />
          {/* Room Types */}
          <Route path="room-types" element={<RoomTypes />} />
          <Route path="room-types/add" element={<RTAdd />} />
          <Route path="room-types/edit/:id" element={<RTEdit />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AppRouter;