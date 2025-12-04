import { Link } from "react-router-dom";
import {
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const AppFooter = () => {
  return (
    <footer className="bg-[#0a4f86] text-white mt-4">
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="text-2xl font-bold mb-3">Khách sạn PenStar</div>
          <p className="text-gray-200 flex items-center gap-2 mb-1">
            <EnvironmentOutlined /> Số 1, Đường Chính, Quận Trung tâm
          </p>
          <p className="text-gray-200 flex items-center gap-2 mb-1">
            <MailOutlined /> info@penstar.example
          </p>
          <p className="text-gray-200 flex items-center gap-2">
            <PhoneOutlined /> 0123 456 789
          </p>
        </div>

        <div>
          <div className="text-lg font-semibold mb-3">Khám phá</div>
          <ul className="space-y-2 text-gray-200">
            <li>
              <Link to="/rooms" className="hover:text-white transition">
                Phòng
              </Link>
            </li>
            <li>
              <Link to="/booking" className="hover:text-white transition">
                Đặt phòng
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition">
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-lg font-semibold mb-3">Về chúng tôi</div>
          <ul className="space-y-2 text-gray-200">
            <li>
              <Link to="/about" className="hover:text-white transition">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link to="/policy" className="hover:text-white transition">
                Chính sách & Điều khoản
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-white transition">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-lg font-semibold mb-3">Theo dõi chúng tôi</div>
          <div className="flex gap-4 text-2xl">
            <a
              href="https://www.facebook.com/nguyen.duy.hung.3624/"
              className="hover:text-blue-400 transition"
              aria-label="Facebook"
            >
              <FacebookOutlined />
            </a>
            <a
              href="https://www.instagram.com/arikita_000/"
              className="hover:text-pink-400 transition"
              aria-label="Instagram"
            >
              <InstagramOutlined />
            </a>
            <a
              href="#"
              className="hover:text-sky-400 transition"
              aria-label="Twitter"
            >
              <TwitterOutlined />
            </a>
          </div>

          <div className="mt-6 text-sm text-gray-200">
            <div>Thanh toán an toàn với:</div>
            <div className="flex gap-3 mt-3">
              <div className="w-10 h-6 bg-white/20 rounded"></div>
              <div className="w-10 h-6 bg-white/20 rounded"></div>
              <div className="w-10 h-6 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-200">
          <div>
            © {new Date().getFullYear()} Khách sạn PenStar. Tất cả các quyền
            được bảo lưu.
          </div>
          <div className="mt-3 md:mt-0">Ngôn ngữ / Tiền tệ</div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
