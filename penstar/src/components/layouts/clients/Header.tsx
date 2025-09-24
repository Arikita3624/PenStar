import logo from "@/assets/images/logo.jpg.jpg";

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      {/* Top header: logo + login */}
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-2xl">PenStar</span>
        </div>
        <img
          src={logo}
          alt="logo"
          className="w-20 h-20 object-cover rounded-full"
        />

        {/* Login button */}
        <button className="bg-gray-800 hover:bg-black text-white px-5 py-2 rounded-md transition">
          Đăng nhập
        </button>
      </div>

      {/* Bottom navigation bar */}
      <nav className="border-t border-gray-200">
        <ul className="flex justify-center items-center gap-8 py-3">
          <li>
            <a href="#" className="hover:text-blue-500">
              Trang chủ
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-500">
              Giới thiệu
            </a>
          </li>

          {/* Dropdown chi nhánh */}
          <li className="relative group">
            <button className="hover:text-blue-500 flex items-center gap-1">
              Chi nhánh ▾
            </button>
            <ul
              className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block 
             w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            >
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                CN Hà Nội
              </li>
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                CN Hồ Chí Minh
              </li>
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                CN Khánh Hoà
              </li>
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                CN Thanh Hoá
              </li>
            </ul>
          </li>

          <li>
            <a href="#" className="hover:text-blue-500">
              Tìm phòng
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-500">
              Khuyến mãi
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-500">
              Hướng dẫn
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-500">
              Lịch sử đặt phòng
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
