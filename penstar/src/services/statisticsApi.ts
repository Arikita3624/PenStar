import instance from "./api";

export interface Statistics {
  period: string;
  totalUsers: number;
  totalBookings: number;
  availableRooms: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  bookingsByStatus: Array<{
    statusId: number;
    statusName: string;
    count: number;
  }>;
  recentBookings: Array<{
    id: number;
    customer_name: string;
    total_price: number;
    created_at: string;
    stay_status_name: string;
    email: string;
  }>;
  deviceDamage?: {
    totalCases: number;
    bookingsWithDamage: number;
    details: Array<{
      booking_id: number;
      customer_name: string;
      created_at: string;
      damage_count: number;
      damage_items: string[];
    }>;
  };
}

export const getStatistics = async (
  period: "day" | "week" | "month" | "year" = "month"
): Promise<Statistics> => {
  const response = await instance.get("/statistics", {
    params: { period },
  });
  return response.data.data;
};

