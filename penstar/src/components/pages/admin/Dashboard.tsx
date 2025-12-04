import useAuth from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "@/services/statisticsApi";
import { Spin } from "antd";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const roleName = auth?.getRoleName(auth.user) || "user";
  const isStaff = roleName === "staff";
  const isManagerOrAdmin = roleName === "manager" || roleName === "admin";

  const { data: statistics, isLoading } = useQuery({
    queryKey: ["statistics", "month"],
    queryFn: () => getStatistics("month"),
    enabled: isManagerOrAdmin, // Only fetch for manager/admin
    retry: 1,
  });

  return (
    <div className="p-6 bg-gray-50">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          {isStaff ? "Staff Dashboard" : "Admin Dashboard"}
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back,{" "}
          {roleName
            ? roleName.charAt(0).toUpperCase() + roleName.slice(1)
            : "User"}
          ! Here's what's happening.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users - Manager and Admin only */}
        {!isStaff && (
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.234-1.256-.644-1.724M11 16v-2a3 3 0 013-3h2m-3 3H9m2 0v2m0-2v-2a3 3 0 00-3-3H7m2 10H7m0 0v-2c0-.653.234-1.256.644-1.724M7 16H5m2 0v2m0-2v-2a3 3 0 013-3h2m-5 3H3m2 0v2m0-2v-2a3 3 0 00-3-3H3m12 10v-2a3 3 0 00-3-3H9m9 6v2m0-2h-2m-2 2H9m10-2v-2a3 3 0 00-3-3h-2m-3 3h2m-2 0h-2m2 0v2m-2-2v-2"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">
                  {isLoading ? (
                    <Spin size="small" />
                  ) : (
                    statistics?.totalUsers.toLocaleString("vi-VN") || 0
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-green-100 text-green-600 p-4 rounded-full">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 font-medium">Bookings</p>
              <p className="text-3xl font-bold text-gray-800">
                {isLoading && !isStaff ? (
                  <Spin size="small" />
                ) : (
                  statistics?.totalBookings.toLocaleString("vi-VN") || 0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 font-medium">Available Rooms</p>
              <p className="text-3xl font-bold text-gray-800">
                {isLoading && !isStaff ? (
                  <Spin size="small" />
                ) : (
                  statistics?.availableRooms.toLocaleString("vi-VN") || 0
                )}
              </p>
            </div>
          </div>
        </div>
        {/* Revenue - Manager and Admin only */}
        {!isStaff && (
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1H8.5m3.5 1H12m0-1h3.5m-3.5 1H12m0 0h.01M12 3v1m0-1c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1H8.5m3.5 1H12m0-1h3.5m-3.5 1H12m0 0h.01M12 3v1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-800">
                  {isLoading ? (
                    <Spin size="small" />
                  ) : (
                    new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(statistics?.totalRevenue || 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart - Only for Manager and Admin */}
        {!isStaff && (
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Revenue Overview
            </h2>
            {isLoading ? (
              <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : statistics?.revenueByMonth && statistics.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={statistics.revenueByMonth.map((item) => ({
                    month: format(new Date(item.month), "MM/yyyy", { locale: vi }),
                    revenue: item.revenue,
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("vi-VN", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(value)
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0a4f86"
                    strokeWidth={2}
                    name="Doanh thu"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chưa có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div
          className={`bg-white p-6 rounded-xl shadow-lg ${
            isStaff ? "lg:col-span-3" : ""
          }`}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          {isLoading && !isStaff ? (
            <div className="text-center py-8">
              <Spin />
            </div>
          ) : (
            <ul className="space-y-4">
              {statistics?.recentBookings &&
              statistics.recentBookings.length > 0 ? (
                statistics.recentBookings.slice(0, 5).map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                  >
                    <div className="bg-green-100 text-green-600 p-2 rounded-full mr-4 mt-1">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700">
                        Booking #{booking.id} - {booking.customer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.stay_status_name} -{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(booking.total_price)}{" "}
                        -{" "}
                        {format(
                          new Date(booking.created_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: vi }
                        )}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-center py-4 text-gray-500">
                  Chưa có booking nào
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
