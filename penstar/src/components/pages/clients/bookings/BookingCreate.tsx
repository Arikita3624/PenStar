import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  DatePicker,
  Button,
  InputNumber,
  List,
  message,
  Spin,
} from "antd";
import { instance } from "@/services/api";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const BookingCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = Number(searchParams.get("room_id") || 0);

  const [room, setRoom] = React.useState<Record<string, unknown> | null>(null);
  const [services, setServices] = React.useState<
    Array<Record<string, unknown>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [dates, setDates] = React.useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [serviceQuantities, setServiceQuantities] = React.useState<
    Record<number, number>
  >({});

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const roomRes = await instance.get(`/rooms/${roomId}`);
        const servicesRes = await instance.get(`/services`);
        setRoom(roomRes.data?.data ?? roomRes.data);
        setServices(
          Array.isArray(servicesRes.data)
            ? servicesRes.data
            : servicesRes.data?.data ?? []
        );
      } catch (err) {
        console.error(err);
        message.error("Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  const onChangeQty = (serviceId: number, val?: number) => {
    setServiceQuantities((s) => ({ ...s, [serviceId]: val || 0 }));
  };

  const onNext = () => {
    if (!dates || dates.length !== 2) return message.error("Chọn ngày ở");
    const check_in = dayjs(dates[0]).format("YYYY-MM-DD");
    const check_out = dayjs(dates[1]).format("YYYY-MM-DD");

    const items = [
      {
        room_id: roomId,
        check_in,
        check_out,
        room_price: Number(room?.price as unknown as number) || 0,
      },
    ];

    const servicesPayload = Object.entries(serviceQuantities)
      .map(([k, v]) => {
        const srv = services.find(
          (s) => Number(s.id as unknown as number) === Number(k)
        );
        const price = srv ? Number((srv.price as unknown as number) || 0) : 0;
        return {
          service_id: Number(k),
          quantity: v,
          total_service_price: v * price,
        };
      })
      .filter((s) => s.quantity > 0);

    const total_price =
      items.reduce((acc, it) => acc + Number(it.room_price || 0), 0) +
      servicesPayload.reduce(
        (acc, s) => acc + Number(s.total_service_price || 0),
        0
      );

    const payload = {
      customer_name: "",
      total_price,
      payment_status: "pending",
      booking_method: "online",
      stay_status_id: 1,
      items,
      services: servicesPayload,
    } as unknown;

    const state = {
      payload,
      rooms: [{ ...items[0], name: room?.name }],
      services: servicesPayload,
    };
    navigate("/bookings/confirm", { state });
  };

  if (loading)
    return (
      <div className="p-8">
        <Spin />
      </div>
    );
  if (!room) return <div className="p-8">Room not found</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card title={`Đặt phòng: ${String(room.name ?? "")}`}>
        <div className="mb-4">
          <label className="block mb-2">Chọn ngày</label>
          <RangePicker
            onChange={(vals) =>
              setDates(vals as unknown as [dayjs.Dayjs, dayjs.Dayjs])
            }
          />
        </div>

        <div className="mb-4">
          <h3>Dịch vụ thêm</h3>
          <List
            dataSource={services}
            renderItem={(s: Record<string, unknown>) => (
              <List.Item>
                <div className="w-full flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{String(s.name ?? "")}</div>
                    <div className="text-sm">{String(s.price ?? "")} VND</div>
                  </div>
                  <InputNumber
                    min={0}
                    value={serviceQuantities[s.id as unknown as number] || 0}
                    onChange={(v) =>
                      onChangeQty(s.id as unknown as number, v as number)
                    }
                  />
                </div>
              </List.Item>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={() => history.back()}>Back</Button>
          <Button type="primary" onClick={onNext}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BookingCreate;
