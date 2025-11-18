import Dashboard from "@/components/pages/admin/Dashboard";
import LayoutAdmin from "@/components/pages/admin/LayoutAdmin";
import RequireRole from "@/components/common/RequireRole";
import Rooms from "@/components/pages/admin/rooms/Rooms";
import RoomAdd from "@/components/pages/admin/rooms/RoomAdd";
import RoomEdit from "@/components/pages/admin/rooms/RoomEdit";
import RoomTypesPage from "@/components/pages/admin/roomtypes/RoomType";
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
import RoomsList from "@/components/pages/clients/rooms/RoomsList";
import RoomDetail from "@/components/pages/clients/rooms/RoomDetail";
import RoomSearchResults from "@/components/pages/clients/rooms/RoomSearchResults";
import BookingConfirm from "@/components/pages/clients/bookings/BookingConfirm";
import BookingsList from "@/components/pages/admin/bookings/BookingsList";
import MultiRoomBookingCreate from "@/components/pages/clients/bookings/MultiRoomBookingCreate";
import BookingSuccess from "@/components/pages/clients/bookings/BookingSuccess";
import ChangeRoomPage from "@/components/pages/clients/bookings/ChangeRoomPage";
import MyBookings from "@/components/pages/clients/bookings/MyBookings";
import SignUp from "@/components/pages/clients/users/SignUp";
import SignIn from "@/components/pages/clients/users/SignIn";
import Userslist from "@/components/pages/admin/users/Userslist";
import UserEdit from "@/components/pages/admin/users/UserEdit";
import NotFound from "@/components/common/NotFound";
import Forbidden from "@/components/common/Forbidden";
import BookingDetail from "@/components/pages/admin/bookings/BookingDetail";
import PaymentMethodSelect from "@/components/pages/clients/bookings/PaymentMethodSelect";
import PaymentResult from "@/components/pages/clients/bookings/PaymentResult";
import BookingCreate from "@/components/pages/admin/bookings/BookingCreate";

const AppRouter = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LayoutClient />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="rooms" element={<RoomsList />} />
          <Route path="rooms/search-results" element={<RoomSearchResults />} />
          <Route path="rooms/:id" element={<RoomDetail />} />

          {/* Staff booking - Walk-in customers (staff creates for guest) */}

          {/* Customer bookings - REQUIRE authentication */}
          <Route
            path="booking/multi-create"
            element={
              <RequireRole role="customer">
                <MultiRoomBookingCreate />
              </RequireRole>
            }
          />
          <Route
            path="bookings"
            element={
              <RequireRole role="customer">
                <MyBookings />
              </RequireRole>
            }
          />
          <Route
            path="my-bookings"
            element={
              <RequireRole role="customer">
                <MyBookings />
              </RequireRole>
            }
          />
          <Route
            path="bookings/confirm"
            element={
              <RequireRole role="customer">
                <BookingConfirm />
              </RequireRole>
            }
          />
          <Route path="bookings/success/:id" element={<BookingSuccess />} />
          <Route
            path="bookings/:id/change-room"
            element={
              <RequireRole role="customer">
                <ChangeRoomPage />
              </RequireRole>
            }
          />
          <Route
            path="bookings/payment-method"
            element={<PaymentMethodSelect />}
          />
          <Route path="payment-result" element={<PaymentResult />} />
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

          {/* Bookings management - Staff+ */}
          <Route path="bookings" element={<BookingsList />} />
          <Route
            path="bookings/create"
            element={
              <RequireRole role="staff">
                <BookingCreate />
              </RequireRole>
            }
          />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="bookings/:id/change-room" element={<ChangeRoomPage />} />

          {/* Rooms, Services, Floors, RoomTypes - Staff+ */}
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/add" element={<RoomAdd />} />
          <Route path="rooms/:id/edit" element={<RoomEdit />} />
          <Route path="roomtypes" element={<RoomTypesPage />} />
          <Route path="roomtypes/new" element={<RoomTypeAdd />} />
          <Route path="roomtypes/:id/edit" element={<RoomTypeEdit />} />
          <Route path="floors" element={<FloorList />} />
          <Route path="floors/new" element={<FloorAdd />} />
          <Route path="floors/:id/edit" element={<FloorEdit />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/new" element={<ServiceAdd />} />
          <Route path="services/:id/edit" element={<ServiceEdit />} />

          {/* Users management - Manager+ */}
          <Route
            path="users"
            element={
              <RequireRole role="manager">
                <Userslist />
              </RequireRole>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <RequireRole role="manager">
                <UserEdit />
              </RequireRole>
            }
          />
        </Route>
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default AppRouter;
