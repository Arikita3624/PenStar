import pool from "../db.js";

export const getStatistics = async (req, res) => {
  try {
    const { period = "month" } = req.query; // day, week, month, year

    let dateFilter = "";
    const params = [];

    const now = new Date();
    let startDate;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    dateFilter = "WHERE created_at >= $1";
    params.push(startDate);

    // Total Users - Always count all users, not filtered by period
    const usersRes = await pool.query(
      `SELECT COUNT(*) as count FROM users`
    );
    const totalUsers = parseInt(usersRes.rows[0].count);

    // Total Bookings
    const bookingsRes = await pool.query(
      `SELECT COUNT(*) as count FROM bookings ${dateFilter}`,
      params
    );
    const totalBookings = parseInt(bookingsRes.rows[0].count);

    // Available Rooms
    const availableRoomsRes = await pool.query(
      "SELECT COUNT(*) as count FROM rooms WHERE status = 'available'"
    );
    const availableRooms = parseInt(availableRoomsRes.rows[0].count);

    // Total Revenue (from paid bookings)
    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as total 
       FROM bookings 
       ${dateFilter} 
       AND payment_status = 'paid'`,
      params
    );
    const totalRevenue = parseFloat(revenueRes.rows[0].total) || 0;

    // Revenue by month (last 12 months)
    const revenueByMonthRes = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(total_price), 0) as revenue
       FROM bookings
       WHERE payment_status = 'paid'
         AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month ASC`
    );

    // Bookings by status
    const bookingsByStatusParams = dateFilter ? [...params] : [];
    const bookingsByStatusRes = await pool.query(
      `SELECT 
        ss.id,
        ss.name,
        COUNT(b.id) as count
       FROM stay_status ss
       LEFT JOIN bookings b ON ss.id = b.stay_status_id ${dateFilter ? "AND b." + dateFilter.replace("WHERE ", "") : ""}
       GROUP BY ss.id, ss.name
       ORDER BY ss.id`,
      bookingsByStatusParams
    );

    // Recent bookings (last 10)
    const recentBookingsRes = await pool.query(
      `SELECT 
        b.id,
        b.customer_name,
        b.total_price,
        b.created_at,
        ss.name as stay_status_name,
        u.email
       FROM bookings b
       LEFT JOIN stay_status ss ON b.stay_status_id = ss.id
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    // Room occupancy rate
    const totalRoomsRes = await pool.query(
      "SELECT COUNT(*) as count FROM rooms"
    );
    const totalRooms = parseInt(totalRoomsRes.rows[0].count);
    const occupiedRoomsParams = dateFilter ? [...params] : [];
    const occupiedRoomsRes = await pool.query(
      `SELECT COUNT(DISTINCT bi.room_id) as count
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       WHERE b.stay_status_id IN (1, 2) -- reserved or checked_in
       ${dateFilter ? "AND b." + dateFilter.replace("WHERE ", "") : ""}`,
      occupiedRoomsParams
    );
    const occupiedRooms = parseInt(occupiedRoomsRes.rows[0].count) || 0;
    const occupancyRate =
      totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      message: "✅ Get statistics successfully",
      data: {
        period,
        totalUsers,
        totalBookings,
        availableRooms,
        totalRooms,
        occupiedRooms,
        occupancyRate: parseFloat(occupancyRate),
        totalRevenue,
        revenueByMonth: revenueByMonthRes.rows.map((row) => ({
          month: row.month,
          revenue: parseFloat(row.revenue) || 0,
        })),
        bookingsByStatus: bookingsByStatusRes.rows.map((row) => ({
          statusId: row.id,
          statusName: row.name,
          count: parseInt(row.count) || 0,
        })),
        recentBookings: recentBookingsRes.rows,
      },
    });
  } catch (error) {
    console.error("statistics.getStatistics error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

