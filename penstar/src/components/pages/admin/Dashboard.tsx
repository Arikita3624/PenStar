const Dashboard = () => {
  return (
    <div className="p-6 bg-gray-50">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, Admin! Here's what's happening.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-3xl font-bold text-gray-800">1,428</p>
            </div>
          </div>
        </div>
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
              <p className="text-3xl font-bold text-gray-800">759</p>
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
              <p className="text-3xl font-bold text-gray-800">120</p>
            </div>
          </div>
        </div>
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
              <p className="text-3xl font-bold text-gray-800">$45,678</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Revenue Overview
          </h2>
          <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Chart Placeholder]</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-4 mt-1">
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
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-700">
                  New user registered
                </p>
                <p className="text-sm text-gray-500">
                  John Doe just signed up. - 2 min ago
                </p>
              </div>
            </li>
            <li className="flex items-start">
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
              <div>
                <p className="font-semibold text-gray-700">
                  New booking created
                </p>
                <p className="text-sm text-gray-500">
                  Booking #1234 for Room 101. - 15 min ago
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full mr-4 mt-1">
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
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-700">
                  Low inventory warning
                </p>
                <p className="text-sm text-gray-500">
                  Deluxe rooms are almost full. - 1 hour ago
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
