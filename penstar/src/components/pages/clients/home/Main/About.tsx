
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import instanceClient from '../../../../configs/instance';

import { CompassOutlined, SearchOutlined } from "@ant-design/icons";
import bannerImage from '@/assets/banner.png';
import { dataAboutUs } from '@/mock/dataAboutUs';

interface Destination {
    _id: string;
    locationName: string;
    country: string;
}

interface Employee {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    position: string;
    full_name: string;
    employee_id: string;
}

interface Tour {
    _id: string;
    nameTour: string;
    destination: Destination;
    departure_location: string;
    duration: string;
    price: number;
    discountPercent?: number | null;
    finalPrice?: number | null;
    discountExpiryDate?: string | null;
    imageTour: string[];
    featured?: boolean;
    priceChildren: number;
    priceLittleBaby: number;
    pricebaby: number;
    assignedEmployee?: Employee | null;
    tourStatus: string;
    createdAt: string;
    updatedAt: string;
    descriptionTour?: string;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.5, duration: 0.6 },
    }),
};

const BannerWithAboutUs = () => {

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Tour[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const navigate = useNavigate();

    // Tour được tìm nhiều nhất
    const popularTours: Tour[] = dataAboutUs?.slice(0, 3) || [];
    // Điểm đến nổi bật
    const featuredTours: Tour[] = dataAboutUs?.slice(3, 6) || [];

    const highlights = [
        { number: 27, label: "Năm hình thành và phát triển" },
        { number: 6, label: "Văn phòng nước ngoài" },
        { number: 43, label: "Chi nhánh và giao dịch" },
        { number: 15, label: "Công ty thành viên" },
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // if (isLoading) {
        //     alert("Đang tải dữ liệu, vui lòng đợi!");
        //     return;
        // }

        // if (!tours || tours.length === 0) {
        //     alert("Không có dữ liệu tour, vui lòng thử lại!");
        //     return;
        // }

        const searchTerm = searchQuery.toLowerCase().trim();
        if (!searchTerm) {
            alert("Vui lòng nhập từ khóa tìm kiếm!");
            return;
        }

        // const foundTours = tours.filter((tour: any) => {
        //     const tourName = tour.nameTour?.toLowerCase() || '';
        //     const destination = tour.destination?.locationName?.toLowerCase() || '';
        //     const departure = tour.departure_location?.toLowerCase() || '';

        //     return tourName.includes(searchTerm) ||
        //         destination.includes(searchTerm) ||
        //         departure.includes(searchTerm);
        // });

        // if (foundTours.length > 0) {
        //     setSearchResults(foundTours);
        //     setShowResults(true);
        //     setShowSuggestions(false);
        // } else {
        //     alert(`Không tìm thấy tour nào phù hợp với từ khóa "${searchQuery}"`);
        // }
    };

    const handleTourClick = (tourId: string) => {
        navigate(`/detailtour/${tourId}`);
        setShowSuggestions(false);
    };

    const handleCloseResults = () => {
        setShowResults(false);
        setSearchResults([]);
    };

    const handleSearchBarClick = () => {
        setShowSuggestions(true);
    };

    const handleCloseSuggestions = () => {
        setShowSuggestions(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (e.target.value.trim()) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className="relative">
            {/* Banner Section */}
            <div className="relative z-10">
                <div className="w-full h-[400px] sm:h-[400px] md:h-[500px] lg:h-[600px] 
            bg-gradient-to-r from-[#00CFFF] to-[#001BFF]" />
                <img
                    src={bannerImage}
                    alt="banner"
                    className="absolute top-1/2 right-16 -translate-y-1/2 max-h-[60%] object-contain"
                />

                {/* Overlay text */}
                <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:px-20 py-10">
                    <div className="w-full max-w-7xl mx-auto">
                        <div className="p-6 rounded-lg max-w-3xl text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 text-white">
                                Du lịch cùng Elite Travel
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-6">
                                Với nguồn lực dồi dào, kinh nghiệm và uy tín trong lĩnh vực dịch vụ du lịch,
                                Lữ hành Elite Travel luôn mang đến cho khách hàng những dịch vụ du lịch giá trị nhất.
                            </p>
                            <button
                                onClick={() => navigate("/destinations")}
                                className="hidden md:inline-block bg-white text-blue-900 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300"
                            >
                                Tìm hiểu ngay
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Form Container */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full px-4 mb-20 md:mb-0 z-20">
                    <div className="w-full max-w-7xl mx-auto">
                        {/* Search Form */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl relative">
                            <form onSubmit={handleSubmit} className="flex gap-4">
                                {/* Input tìm kiếm */}
                                <div className="relative flex-1">
                                    <CompassOutlined className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleInputChange}
                                        onFocus={handleSearchBarClick}
                                        placeholder="Bạn muốn đi đâu?"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                                        required
                                    />
                                </div>

                                {/* Nút tìm kiếm */}
                                <button
                                    type="submit"
                                    disabled={false}
                                    className={`rounded-lg py-3 px-8 transition-colors flex items-center justify-center gap-2 ${
                                        'bg-blue-600 hover:bg-blue-700'
                                        } text-white`}
                                >
                                    <SearchOutlined className="w-5 h-5" />
                                    {/* <span>{isLoading ? 'Đang tải...' : 'Tìm kiếm'}</span> */}
                                </button>
                            </form>
                        </div>

                        {/* Search Suggestions Dropdown - Right under search form */}
                        {showSuggestions && (
                            <div className="relative">
                                {/* Overlay để đóng dropdown khi click ngoài */}
                                <div
                                    className="fixed inset-0 z-[998]"
                                    onClick={handleCloseSuggestions}
                                />

                                {/* Dropdown content */}
                                <div className="absolute top-4 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-[999] max-h-[500px] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Tour được tìm nhiều nhất */}
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-4">Tour được tìm nhiều nhất</h3>
                                                <div className="space-y-4">
                                                    {popularTours.map((tour: Tour) => (
                                                        <div
                                                            key={tour._id}
                                                            onClick={() => handleTourClick(tour._id)}
                                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={tour.imageTour?.[0] || 'https://via.placeholder.com/64x64?text=Tour'}
                                                                    alt={tour.nameTour}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                                                    {tour.nameTour}
                                                                </h4>
                                                                <div className="flex items-center text-xs text-gray-600 mt-1">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {tour.duration || 'Chưa có thông tin'}
                                                                </div>
                                                                <div className="text-sm font-bold text-red-600 mt-1">
                                                                    Chỉ từ {tour.finalPrice ? tour.finalPrice.toLocaleString() : tour.price ? tour.price.toLocaleString() : 'Liên hệ'} ₫
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Điểm đến nổi bật */}
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-4">Điểm đến nổi bật</h3>
                                                <div className="space-y-4">
                                                    {featuredTours.map((tour: Tour) => (
                                                        <div
                                                            key={tour._id}
                                                            onClick={() => handleTourClick(tour._id)}
                                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={tour.imageTour?.[0] || 'https://via.placeholder.com/64x64?text=Tour'}
                                                                    alt={tour.nameTour}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                                    {tour.nameTour}
                                                                </h4>
                                                                <div className="flex items-center text-xs text-gray-600 mt-1">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {tour.duration || 'Chưa có thông tin'}
                                                                </div>
                                                                <div className="text-sm font-bold text-red-600 mt-1">
                                                                    Chỉ từ {tour.finalPrice ? tour.finalPrice.toLocaleString() : tour.price ? tour.price.toLocaleString() : 'Liên hệ'} ₫
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nút đóng */}
                                        <div className="mt-6 text-center">
                                            <button
                                                onClick={handleCloseSuggestions}
                                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                            >
                                                Đóng
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Results Modal */}
            {showResults && (
                <div className="fixed inset-0 z-[99997] flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Kết quả tìm kiếm cho "{searchQuery}" ({searchResults.length} tour)
                            </h2>
                            <button
                                onClick={handleCloseResults}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map((tour: Tour) => (
                                <div
                                    key={tour._id}
                                    onClick={() => handleTourClick(tour._id)}
                                    className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                                >
                                    <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                                        <img
                                            src={tour.imageTour?.[0] || 'https://via.placeholder.com/300x200?text=Tour+Image'}
                                            alt={tour.nameTour}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                                            {tour.nameTour}
                                        </h3>

                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {tour.duration || 'Chưa có thông tin'}
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {tour.departure_location} → {tour.destination?.locationName}
                                        </div>

                                        <div className="pt-2">
                                            <span className="text-lg font-bold text-blue-600">
                                                {tour.finalPrice ? tour.finalPrice.toLocaleString() : tour.price ? tour.price.toLocaleString() : 'Liên hệ'} ₫
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={handleCloseResults}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* About Us Section - Lower z-index */}
            <div className="mt-20 min-h-[700px] py-16 relative z-0">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                        {/* Text Section */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="w-full md:w-1/2 space-y-6 text-left"
                        >
                            <motion.h4 variants={fadeInUp} custom={0} className="text-blue-400 text-3xl md:text-4xl font-semibold uppercase tracking-wide">
                                VỀ CHÚNG TÔI
                            </motion.h4>
                            <motion.h2 variants={fadeInUp} custom={1} className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                                Công ty cổ phần <span className="text-blue-400">Elite Travel</span>
                            </motion.h2>
                            <motion.p variants={fadeInUp} custom={2} className="text-gray-200 text-lg leading-relaxed">
                                Chúng tôi luôn lắng nghe và chia sẻ mong muốn của từng Quý khách hàng,
                                mang lại sự hài lòng về dịch vụ và thái độ phục vụ của từng nhân viên.
                                Mỗi dịch vụ là một mắt xích kết nối hoàn hảo cho chuyến đi của Quý khách.
                                Hạnh phúc và sự hài lòng của khách hàng chính là giá trị cốt lõi của chúng tôi.
                            </motion.p>
                            <div className="grid grid-cols-1 gap-6 mt-8">
                                {highlights.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        variants={fadeInUp}
                                        custom={3 + i}
                                        className="flex items-baseline text-4xl"
                                    >
                                        <span className="text-blue-400 text-5xl font-bold mr-4">
                                            {String(item.number).padStart(2, "0")}
                                        </span>
                                        <span className="leading-tight text-white text-2xl">{item.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="w-full md:w-1/2 relative h-[400px] sm:h-[500px] md:h-[600px] z-50"
                        >
                            <motion.img
                                custom={0}
                                variants={fadeInUp}
                                src="https://i.pinimg.com/736x/f6/5d/ea/f65dea5017f8fdc298d49d6753197717.jpg"
                                alt="Pool"
                                className="absolute top-10 left-1/4 w-56 md:w-72 rounded-2xl shadow-2xl z-30 rotate-[6deg]"
                            />

                            <motion.img
                                custom={1}
                                variants={fadeInUp}
                                src="https://i.pinimg.com/736x/fc/94/12/fc94123c91b63e453980abd64b2925cd.jpg"
                                alt="Villa"
                                className="absolute top-40 left-1/3 w-56 md:w-72 rounded-2xl shadow-2xl z-5 rotate-[-20deg] -translate-x-1/2 transition-transform duration-500 hover:scale-105"
                            />

                            <motion.img
                                custom={2}
                                variants={fadeInUp}
                                src="https://i.pinimg.com/736x/45/85/70/45857057981d48c1a63e2b9a11539f16.jpg"
                                alt="View"
                                className="absolute top-60 left-2/3 w-64 md:w-80 rounded-2xl shadow-2xl z-5 rotate-[5deg] -translate-x-1/2 transition-transform duration-500 hover:scale-105"
                            />
                        </motion.div>

                    </div>
                </div>

                {/* Feature boxes section */}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mt-16 pb-16 relative z-5">
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {/* Box 1 */}
                        <div className="w-80 border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 relative z-6">
                            <div className="flex flex-col items-center px-5 py-4 relative">
                                <img
                                    className="h-24 w-24 absolute -top-14 rounded-full object-cover border-4 border-white shadow z-7"
                                    src="https://i.pinimg.com/736x/a0/fa/cd/a0facd0bfff2ebbc27ebfb66cf66b272.jpg"
                                    alt="tourInfo"
                                />
                                <div className="pt-12 text-center">
                                    <h1 className="text-lg font-medium text-gray-800">
                                        Các Thông Tin Tour Mới Nhất
                                    </h1>
                                    <p className="text-gray-800/80 mt-1">
                                        Luôn cập nhật các thông tin mới nhất, đầy đủ nhất về các tour tốt nhất hiện nay.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Box 2 */}
                        <div className="w-80 border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 relative z-6">
                            <div className="flex flex-col items-center px-5 py-4 relative">
                                <img
                                    className="h-24 w-24 absolute -top-14 rounded-full object-cover border-4 border-white shadow z-7"
                                    src="https://bizweb.dktcdn.net/100/489/447/themes/912592/assets/why_2.png?1743654439525"
                                    alt="consultant"
                                />
                                <div className="pt-12 text-center">
                                    <h1 className="text-lg font-medium text-gray-800">
                                        Chuyên Gia Tư Vấn Chi Tiết Nhất
                                    </h1>
                                    <p className="text-gray-800/80 mt-1">
                                        Các tư vấn viên chuyên nghiệp luôn sẵn sàng hỗ trợ bạn tận tâm và chi tiết nhất.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Box 3 */}
                        <div className="w-80 border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 relative z-6">
                            <div className="flex flex-col items-center px-5 py-4 relative">
                                <img
                                    className="h-24 w-24 absolute -top-14 rounded-full object-cover border-4 border-white shadow z-7"
                                    src="https://bizweb.dktcdn.net/100/489/447/themes/912592/assets/why_3.png?1743654439525"
                                    alt="promotion"
                                />
                                <div className="pt-12 text-center">
                                    <h1 className="text-lg font-medium text-gray-800">
                                        Khuyến Mãi & Giá Luôn Tốt Nhất
                                    </h1>
                                    <p className="text-gray-800/80 mt-1">
                                        Các chương trình khuyến mãi hấp dẫn và giá tour cạnh tranh được cập nhật liên tục.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannerWithAboutUs;