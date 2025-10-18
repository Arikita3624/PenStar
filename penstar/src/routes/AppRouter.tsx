import Dashboard from "@/components/pages/admin/Dashboard";
import LayoutAdmin from "@/components/pages/admin/LayoutAdmin";
import Rooms from "@/components/pages/admin/rooms/Rooms";
import RoomType from "@/components/pages/admin/roomtypes/RoomType";
import FloorList from "@/components/pages/admin/floors/FloorList";
import ServicesPage from "@/components/pages/admin/services/Services";
import { Route, Routes } from "react-router-dom";
import LayoutHome from "@/components/pages/clients/home/Home";
import LayoutPages from "@/components/layouts/clients/LayoutClient";

const AppRouter = () => {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="admin" element={<LayoutAdmin />}>
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="roomtypes" element={<RoomType />} />
        <Route path="floors" element={<FloorList />} />
        <Route path="services" element={<ServicesPage />} />
      </Route>

      {/* Client Routes */}
      <Route path="/" element={<LayoutPages />}>
        <Route index element={<LayoutHome />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
