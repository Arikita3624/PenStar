import { Button } from "antd";
import { PhoneOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const AppHeader = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`bg-[#0a4f86] text-white sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-xl py-1" : "py-2"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white font-bold">
            PS
          </div>
          <div>
            <div className="text-lg font-semibold">Khách sạn Penstar</div>
            <div className="text-xs text-white/80">
              Trải nghiệm thoải mái, tiện nghi hiện đại
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-white/90 hover:text-white">
            Trang chủ
          </Link>
          <Link to="/rooms" className="text-white/90 hover:text-white">
            Phòng
          </Link>
          <Link to="/booking" className="text-white/90 hover:text-white">
            Đặt phòng
          </Link>
          <Link to="/contact" className="text-white/90 hover:text-white">
            Liên hệ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+840000000"
            className="hidden md:flex items-center gap-2 text-sm text-white/90"
          >
            <PhoneOutlined className="text-base" /> <span>+84 24 0000 000</span>
          </a>
          <Link to="/booking">
            <Button
              style={{
                backgroundColor: "#0a66a3",
                borderColor: "#0a66a3",
                color: "#ffffff",
              }}
            >
              Đăng nhập
            </Button>
          </Link>
        </div>
        <div className="md:hidden">
          <Link to="/booking">
            <Button
              size="small"
              style={{
                backgroundColor: "#0a66a3",
                borderColor: "#0a66a3",
                color: "#ffffff",
              }}
            >
              Đặt
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
