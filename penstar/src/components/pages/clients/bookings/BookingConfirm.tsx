/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, List, Divider, message } from "antd";
import { createBooking } from "@/services/bookingsApi";
import type { BookingItem, BookingService } from "@/types/bookings";
import useAuth from "@/hooks/useAuth";

type BookingState = {
  payload: unknown;
  rooms: (BookingItem & { name?: string })[];
  services?: (BookingService & { name?: string })[];
} | null;

const BookingConfirm: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const auth = useAuth() as unknown as { user?: { email?: string } };
  const data = (loc.state as unknown as BookingState) || null;

  React.useEffect(() => {
    if (!data) {
      navigate("/rooms");
    }
    // Redirect to sign-in if not authenticated
    if (!auth || !auth.user) {
      navigate("/signin", { state: { from: loc } });
    }
  }, [data, navigate]);

  const onConfirm = async () => {
    try {
      if (!data) {
        message.error("No booking data");
        return;
      }
      // ensure required customer_name is present (backend Joi requires it)
      const payload = {
        ...(data.payload as Record<string, unknown>),
      } as Record<string, unknown>;
      // Tính lại tổng tiền từ danh sách phòng và dịch vụ
      const totalRoomPrice = (data.rooms || []).reduce(
        (acc, item) => acc + (item.room_price || 0),
        0
      );
      const totalServicePrice = (data.services || []).reduce(
        (acc, item) => acc + (item.total_service_price || 0),
        0
      );
      payload.total_price = totalRoomPrice + totalServicePrice;
      if (!payload.customer_name && auth?.user?.email) {
        payload.customer_name = auth.user.email;
      }

      // Render email HTML bằng React Email
      // Chuyển dữ liệu phòng và dịch vụ sang dạng template
      const roomsForEmail = (data.rooms || []).map((r) => ({
        roomType: r.name || "", // hoặc lấy từ room_type nếu có
        roomId: r.room_id,
        checkIn: r.check_in,
        checkOut: r.check_out,
        numAdults: r.num_adults || 1,
        numChildren: r.num_children || 0,
      }));
      const servicesForEmail = (data.services || []).map((s) => ({
        name: s.name || `Service ${s.service_id}`,
        quantity: s.quantity,
        price: s.total_service_price,
      }));

      // Import động để tránh lỗi SSR nếu cần
      const { render } = await import("@react-email/render");
      const { BookingConfirmationEmail } = await import(
        "@/emailTemplates/BookingConfirmationEmail"
      );
      const emailHtml = render(
        <BookingConfirmationEmail
          customerName={payload.customer_name as string}
          bookingId={0} // bookingId chưa có, backend sẽ thay thế nếu cần
          rooms={roomsForEmail}
          services={servicesForEmail}
          totalPrice={payload.total_price as number}
          paymentStatus={payload.payment_status as string}
        />
      );
      payload.email_html = emailHtml;

      const res = await createBooking(payload as any);
      const booking = res;
      console.log("[DEBUG] booking object:", booking);
      if (!booking || !booking.id) {
        message.error("Booking created but missing ID");
        return;
      }
      let successMessage = "Booking created successfully";
      if (booking.payment_method === "cod") {
        successMessage += ". Please pay at the front desk when checking in.";
        message.success(successMessage);
        navigate(`/bookings/success/${booking.id}`, { state: { booking } });
      } else {
        successMessage += ". Please select a payment method.";
        message.success(successMessage);
        // Lưu bookingInfo vào localStorage để PaymentMethodSelect có thể lấy được
        try {
          localStorage.setItem("bookingInfo", JSON.stringify(booking));
        } catch {
          // Do nothing
        }
        navigate("/bookings/payment-method", {
          state: {
            bookingId: booking.id,
            bookingInfo: booking,
          },
        });
      }
    } catch (errorUnknown) {
      console.error(errorUnknown);
      const e = errorUnknown as unknown;
      // try to pluck common message paths
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (e as Error).message ||
        "Create failed";
      message.error(String(msg));
    }
  };

  if (!data) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card title="Confirm booking">
        <div>
          <h3>Customer</h3>
          <div>{auth?.user?.email ?? "(your account)"}</div>
          <Divider />

          <h3>Rooms</h3>
          <List
            dataSource={data.rooms}
            renderItem={(r) => (
              <List.Item>
                <div className="w-full">
                  <div className="font-semibold">{r.name}</div>
                  <div>
                    Check in: {r.check_in} — Check out: {r.check_out}
                  </div>
                  <div>Price: {r.room_price}</div>
                </div>
              </List.Item>
            )}
          />

          <Divider />
          <h3>Services</h3>
          <List
            dataSource={data.services || []}
            renderItem={(s) => (
              <List.Item>
                <div className="w-full">
                  <div className="font-semibold">
                    {s.name || `Service ${s.service_id}`}
                  </div>
                  <div>
                    Qty: {s.quantity} — Price: {s.total_service_price}
                  </div>
                </div>
              </List.Item>
            )}
          />

          <Divider />
          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate(-1)}>Back</Button>
            <Button type="primary" onClick={onConfirm}>
              Confirm booking
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingConfirm;
