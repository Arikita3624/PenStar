/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import logo from '../../../assets/logo.png';
// import Login from '../components/Login';
// import Register from './Register';
// import { Popover } from 'antd';
// import { FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Header = () => {
    const navLinks = [
        { name: 'Các địa điểm du lịch', path: '/destinations' },
        { name: 'Khách sạn', path: '/hotels' },
        { name: 'Giới Thiệu', path: '/introduce' },
        { name: 'Blog', path: '/blog' },
        { name: 'Các câu hỏi thường gặp', path: '/hotelPolicy' },
    ];

    const [userId, setUserId] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        setUserId(localStorage.getItem("userId"));

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        setUserId(null); // Cập nhật lại state
        window.location.href = "/";
    };

    const token = localStorage.getItem("token");

    const user = (

        <div className="flex flex-col gap-1 p-2 min-w-[150px] ">
            <h3 className="text-[#8B4513] text-sm font-medium pb-1  mb-1">
                Tài khoản
            </h3>
            <Link to={"/infouser"}>
                <div className="hover:bg-[#E6D5B8]/50 px-3 py-1.5 rounded-md transition-all text-[#8B4513] text-sm">
                    Thông Tin
                </div>
            </Link>
            <div
                onClick={handleLogout}
                className="hover:bg-[#E6D5B8]/50 px-3 py-1.5 rounded-md transition-all cursor-pointer text-red-600 hover:text-red-700 text-sm"
            >
                Đăng Xuất
            </div>
        </div>
    );

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full flex items-center justify-center transition-all duration-500 z-50 ${isScrolled ? "shadow-md text-gray-700 backdrop-blur-lg py-1 md:py-1.5" : "py-0 md:py-0.5"}`}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="logo" className="h-20" />
                    </Link>
                    <div className="hidden md:flex text-black font-semibold text-lg items-center gap-4 lg:gap-8">
                        {navLinks.map((link, i) => (
                            <Link
                                key={i}
                                to={link.path}
                                className="group flex flex-col gap-0.5 hover:text-blue-800 transition-colors duration-200"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    <div className="hidden md:flex items-center gap-4 ">
                        {userId ? (
                            <></>
                            // <Popover content={user} trigger="click" className="cursor-pointer">
                            //     <div className="text-[#8B4513] hover:text-[#6B3E26] transition-all duration-300 hover:scale-110 text-center">
                            //         <FaUserCircle className="text-2xl" />
                            //     </div>
                            // </Popover>
                        ) : (
                            <button onClick={() => setShowLogin(true)} className="bg-black text-white px-8 py-2.5 rounded-full ml-4 transition-all duration-500">
                                Login
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 md:hidden">
                        <svg onClick={() => setIsMenuOpen(!isMenuOpen)} className={`h-6 w-6 cursor-pointer ${isScrolled ? "invert" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                        </svg>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {navLinks.map((link, i) => (
                        <a key={i} href={link.path} onClick={() => setIsMenuOpen(false)}>
                            {link.name}
                        </a>
                    ))}

                    {/* <div className="px-8 py-2.5 rounded-full transition-all duration-500">
                        {userId ? (
                            <Popover content={user} trigger="click" className="cursor-pointer">
                                <div className="text-[#8B4513] hover:text-[#6B3E26] transition-all duration-300 hover:scale-110 text-center">
                                    <FaUserCircle className="text-2xl" />
                                    <div className="text-xs text-gray-500">ID: {userId}</div>
                                </div>
                            </Popover>
                        ) : (
                            <button onClick={() => setShowLogin(true)} className="bg-black text-white px-8 py-2.5 rounded-full ml-4 transition-all duration-500">
                                Login
                            </button>
                        )}
                    </div> */}
                </div>
            </nav>

            {/* Hiển thị login modal nếu showLogin true */}
            {/* {showLogin && (
                <Login
                    onClose={() => setShowLogin(false)}
                    onLoginSuccess={() => {
                        setShowLogin(false);
                        // Đóng mobile menu nếu đang mở
                        setIsMenuOpen(false);
                        // Cập nhật lại userId sau khi đăng nhập thành công
                        setUserId(localStorage.getItem("userId"));
                    }}
                    openRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                />
            )}

            {showRegister && (
                <Register
                    onClose={() => setShowRegister(false)}
                    openLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                />
            )} */}
        </>
    );
};

export default Header;
