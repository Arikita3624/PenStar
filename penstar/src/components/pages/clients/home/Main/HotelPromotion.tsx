import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
// Removed Ant Design imports as we're using Tailwind CSS
import { dataHotel } from '@/mock/dataHotel';
import { EnvironmentOutlined, LeftOutlined, RightOutlined, StarOutlined } from '@ant-design/icons';

// Animation variants cho từng card
const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: index * 0.1,
            duration: 0.6,
            ease: 'easeOut',
        },
    }),
};

const HotelPromotion = () => {
    // const { data } = useQuery({
    //     queryKey: ['hotels'],
    //     queryFn: () => instanceClient.get('/hotels')
    // })
    const hotels = dataHotel;
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' })
        }
    }
    
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' })
        }
    }
    
    // Auto scroll functionality
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container || hotels.length === 0) return
        
        const autoScroll = setInterval(() => {
            const maxScrollLeft = container.scrollWidth - container.clientWidth
            if (container.scrollLeft >= maxScrollLeft) {
                container.scrollTo({ left: 0, behavior: 'smooth' })
            } else {
                container.scrollBy({ left: 320, behavior: 'smooth' })
            }
        }, 4000)
        
        return () => clearInterval(autoScroll)
    }, [hotels])
    
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-blue-600 mb-3">
                        Khách Sạn Nổi Bật
                    </h2>
                    <p className="text-blue-400 max-w-2xl mx-auto text-lg">
                        Khám phá những khách sạn chất lượng cao với dịch vụ tuyệt vời và vị trí thuận lợi
                    </p>
                </div>

                <div className="relative">
                    {/* Left Navigation Button */}
                    <button 
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110"
                    >
                        <LeftOutlined className="w-6 h-6 text-blue-600" />
                    </button>
                    
                    {/* Right Navigation Button */}
                    <button 
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110"
                    >
                        <RightOutlined className="w-6 h-6 text-blue-600" />
                    </button>
                    
                    <div 
                        ref={scrollContainerRef}
                        className="flex gap-6 pb-4 overflow-x-auto horizontal-scroll px-12"
                    >
                        {hotels.slice(0, 6).map((hotel: any, index: number) => {
                            const formatPrice = (price: number) => {
                                return new Intl.NumberFormat('vi-VN').format(price);
                            };
                            
                            const getMinPrice = (roomTypes: any[]) => {
                                if (!roomTypes || roomTypes.length === 0) return 0;
                                return Math.min(...roomTypes.map(room => room.finalPrice || room.basePrice || 0));
                            };
                            
                            const handleViewHotel = (hotelId: string) => {
                                window.location.href = `/hotels/${hotelId}`;
                            };
                            
                            return (
                                <motion.div
                                    key={`${hotel._id}-${index}`}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col flex-shrink-0 w-80"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.4 }}
                                    custom={index}
                                    variants={cardVariants}
                                >
                                    <div className="relative">
                                        <div 
                                            className="cursor-pointer"
                                            onClick={() => handleViewHotel(hotel._id)}
                                        >
                                            <img
                                                alt={hotel.hotelName}
                                                src={hotel.hotelImages[0] || '/placeholder-hotel.jpg'}
                                                className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                                            />
                                        </div>
                                        <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {hotel.starRating} ⭐
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-grow">
                                        <div 
                                            className="cursor-pointer"
                                            onClick={() => handleViewHotel(hotel._id)}
                                        >
                                            <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug truncate">
                                                {hotel.hotelName}
                                            </h3>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-gray-500 mb-2">
                                            <EnvironmentOutlined className="w-4 h-4" />
                                            <span className="text-sm">📍 {hotel.location?.locationName}</span>
                                        </div>
                                        
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {hotel.description || 'Khách sạn chất lượng cao với dịch vụ tuyệt vời'}
                                        </p>
                                            
                                        <div className="mb-4">
                                            {hotel.hotelAmenities?.slice(0, 2).map((amenity: any, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded mr-2 mb-2"
                                                >
                                                    {typeof amenity === 'string' ? amenity : (amenity.name || 'Tiện ích')}
                                                </span>
                                            ))}
                                            {hotel.hotelAmenities?.length > 2 && (
                                                <span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded font-semibold">
                                                    +{hotel.hotelAmenities.length - 2} tiện ích
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-between items-end min-h-[56px]">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-blue-600">
                                                    💰 {formatPrice(getMinPrice(hotel.roomTypes))} VNĐ
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    / đêm
                                                </span>
                                            </div>
                                                
                                            {hotel.averageRating > 0 && (
                                                <div className="text-right bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-2 rounded-lg text-white">
                                                    <div className="flex items-center justify-center">
                                                        <StarOutlined className="mr-1 text-sm" />
                                                        <span className="font-bold text-sm">
                                                            {hotel.averageRating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs opacity-90 mt-1">
                                                        ({hotel.totalReviews} đánh giá)
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            className="mt-auto w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                                            onClick={() => handleViewHotel(hotel._id)}
                                        >
                                            Xem chi tiết & Đặt phòng
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button className="px-6 py-3 bg-white border border-blue-600 text-blue-600 font-semibold rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-300 shadow">
                            Xem thêm khách sạn
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HotelPromotion;