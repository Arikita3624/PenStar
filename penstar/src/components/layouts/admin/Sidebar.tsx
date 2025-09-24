import { FiHome, FiKey, FiMapPin, FiUsers, FiBookOpen } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
      isActive
        ? "bg-pink-100 text-pink-600 font-medium"
        : "hover:bg-gray-200 hover:text-pink-600 text-gray-700"
    }`;

  return (
    <aside className="w-64 h-screen bg-white text-gray-800 flex flex-col shadow-md">
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-3">
          <li>
            <NavLink to="/admin/rooms" className={linkClasses}>
              <FiKey size={20} /> Rooms
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/hotels" className={linkClasses}>
              <FiHome size={20} /> Hotel
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/locations" className={linkClasses}>
              <FiMapPin size={20} /> Location
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" className={linkClasses}>
              <FiUsers size={20} /> Users
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/bookings" className={linkClasses}>
              <FiBookOpen size={20} /> Booked
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
