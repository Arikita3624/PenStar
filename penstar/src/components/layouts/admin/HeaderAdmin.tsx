import { FiSearch, FiBell } from "react-icons/fi";

const HeaderAdmin = () => {
  return (
    <header className="w-full h-16 bg-white text-gray-800 flex items-center justify-between px-6 shadow-md">
      {/* Left side: Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">/ Admin Panel</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Search box */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-100 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Notification */}
        <button className="relative text-gray-600 hover:text-pink-500 transition">
          <FiBell size={20} />
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://i.pravatar.cc/100"
            alt="User Avatar"
            className="w-9 h-9 rounded-full border border-gray-300 object-cover"
          />
          <span className="text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;
