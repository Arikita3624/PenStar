/* eslint-disable @typescript-eslint/no-explicit-any */
import Dashboard from "@/components/pages/admin/Dashboard";
import LayoutAdmin from "@/components/pages/admin/LayoutAdmin";
import RequireRole from "@/components/common/RequireRole";
import Rooms from "@/components/pages/admin/rooms/Rooms";
import RoomAdd from "@/components/pages/admin/rooms/RoomAdd";
import RoomEdit from "@/components/pages/admin/rooms/RoomEdit";
import RoomType from "@/components/pages/admin/roomtypes/RoomType";
import RoomTypeAdd from "@/components/pages/admin/roomtypes/RoomTypeAdd";
import RoomTypeEdit from "@/components/pages/admin/roomtypes/RoomTypeEdit";
import FloorList from "@/components/pages/admin/floors/FloorList";
import FloorAdd from "@/components/pages/admin/floors/FloorAdd";
import FloorEdit from "@/components/pages/admin/floors/FloorEdit";
import ServicesPage from "@/components/pages/admin/services/Services";
import ServiceAdd from "@/components/pages/admin/services/ServiceAdd";
import ServiceEdit from "@/components/pages/admin/services/ServiceEdit";
import { Route, Routes } from "react-router-dom";
import LayoutClient from "@/components/pages/clients/LayoutClient";
import HomePage from "@/components/pages/clients/HomePage";
import RoomsList from "@/components/pages/clients/roooms/RoomsList";
import RoomDetail from "@/components/pages/clients/roooms/RoomDetail";
import BookingConfirm from "@/components/pages/clients/bookings/BookingConfirm";
import BookingsList from "@/components/pages/admin/bookings/BookingsList";
import BookingCreate from "@/components/pages/clients/bookings/BookingCreate";
import BookingSuccess from "@/components/pages/clients/bookings/BookingSuccess";
import MyBookings from "@/components/pages/clients/bookings/MyBookings";
import SignUp from "@/components/pages/clients/users/SignUp";
import SignIn from "@/components/pages/clients/users/SignIn";
import Userslist from "@/components/pages/admin/users/Userslist";
import NotFound from "@/components/common/NotFound";
import BookingDetail from "@/components/pages/admin/bookings/BookingDetail";

const AppRouter = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LayoutClient />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="rooms" element={<RoomsList />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
          <Route path="booking/create" element={<BookingCreate />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="bookings/confirm" element={<BookingConfirm />} />
          <Route path="bookings/success/:id" element={<BookingSuccess />} />
          {/* admin booking routes moved to admin layout below */}
          <Route path="signup" element={<SignUp />} />
          <Route path="signin" element={<SignIn />} />
        </Route>
        <Route
          path="admin"
          element={
            <RequireRole role="staff">
              <LayoutAdmin />
            </RequireRole>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="bookings"
            element={
              <RequireRole {...({ role: "staff" } as any)}>
                <BookingsList />
              </RequireRole>
            }
          />
          <Route
            path="bookings/:id"
            element={
              <RequireRole {...({ role: "staff" } as any)}>
                <BookingDetail />
              </RequireRole>
            }
          />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/add" element={<RoomAdd />} />
          <Route path="rooms/:id/edit" element={<RoomEdit />} />
          <Route path="roomtypes" element={<RoomType />} />
          <Route path="roomtypes/new" element={<RoomTypeAdd />} />
          <Route path="roomtypes/:id/edit" element={<RoomTypeEdit />} />
          <Route path="floors" element={<FloorList />} />
          <Route path="floors/new" element={<FloorAdd />} />
          <Route path="floors/:id/edit" element={<FloorEdit />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/new" element={<ServiceAdd />} />
          <Route path="services/:id/edit" element={<ServiceEdit />} />
          <Route path="users" element={<Userslist />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default AppRouter;
