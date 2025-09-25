import LayoutAdmin from "@/components/layouts/admin/LayoutAdmin";
import LayoutClient from "@/components/layouts/clients/LayoutClient";
import Dashboard from "@/components/pages/admin/Dashboard";
import Home from "@/components/pages/clients/Home";
import { Route, Routes } from "react-router-dom";
import Hotels from "@/components/pages/admin/hotels/Hotels";
import HotelAdd from "@/components/pages/admin/hotels/HotelAdd";
import Locations from "@/components/pages/admin/location/Locations";
import Users from "@/components/pages/admin/users/Users";
import Rooms from "@/components/pages/admin/rooms/Rooms";
import RoomAdd from "@/components/pages/admin/rooms/RoomAdd";
import LocationAdd from "@/components/pages/admin/location/LocationAdd";
import RoomEdit from "@/components/pages/admin/rooms/RoomEdit";

const AppRouter = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LayoutClient />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="admin" element={<LayoutAdmin />}>
          <Route index element={<Dashboard />} />
          {/* Rooms */}
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/add" element={<RoomAdd />} />
          <Route path="rooms/edit/:id" element={<RoomEdit />} />
          {/* Hotels */}
          <Route path="hotels" element={<Hotels />} />
          <Route path="hotels/add" element={<HotelAdd />} />
          {/* Locations */}
          <Route path="locations" element={<Locations />} />
          <Route path="locations/add" element={<LocationAdd />} />
          {/* Users */}
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AppRouter;
