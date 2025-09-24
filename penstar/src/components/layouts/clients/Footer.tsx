import { FaFacebook, FaTiktok } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";

const Footer = () => {
  return (
    <footer className="  mt-8 border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo + mô tả */}
        <div>
          <h2 className="text-xl font-bold mb-2">PentaStar</h2>
          <p className="text-sm">
            Hệ thống đặt phòng khách sạn số 1 Việt Nam. Đặt phòng nhanh chóng,
            tiện lợi và uy tín.
          </p>
        </div>

        {/* Liên kết nhanh */}
        <div>
          <h3 className="font-semibold mb-3">Liên kết nhanh</h3>
          <ul className="space-y-2 text-sm">
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
          </ul>
        </div>

        {/* Thông tin liên hệ */}
        <div>
          <h3 className="font-semibold mb-3">Liên hệ</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <AiOutlineMail className="text-red-500 text-lg" />{" "}
              bookinghotel@gmail.com
            </li>
            <li>Hotline: 0394879813</li>
            <li>Địa chỉ: Hà Nội, Việt Nam</li>
          </ul>
        </div>

        {/* Mạng xã hội */}
        <div>
          <h3 className="font-semibold mb-3">Kết nối với chúng tôi</h3>
          <div className="flex gap-4 text-2xl">
            <a href="#" className="hover:text-blue-600">
              <FaFacebook />
            </a>
            <a href="#" className="hover:text-pink-500">
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-300 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} PentaStar. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
