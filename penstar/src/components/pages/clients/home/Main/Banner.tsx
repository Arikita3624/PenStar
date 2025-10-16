/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import instanceClient from '../../../../configs/instance';

import bannerImage from '../../../assets/banner.png';

const Banner = () => {
  const { data, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['location'],
    queryFn: () => instanceClient.get('/location'),
  });

  const locations = data?.data?.location || [];

  const { data: tourData, isLoading: isLoadingTours } = useQuery({
    queryKey: ['tour'],
    queryFn: () => instanceClient.get('/tour'),
  });

  const tours = tourData?.data?.tours || [];

  const isLoading = isLoadingLocations || isLoadingTours;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();

  // Tour được tìm nhiều nhất
  const popularTours = tours?.slice(0, 3) || [];
  // Điểm đến nổi bật
  const featuredTours = tours?.slice(3, 6) || [];

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (isLoading) {
      alert("Đang tải dữ liệu, vui lòng đợi!");
      return;
    }

    if (!tours || tours.length === 0) {
      alert("Không có dữ liệu tour, vui lòng thử lại!");
      return;
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    if (!searchTerm) {
      alert("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    const foundTours = tours.filter((tour: any) => {
      const tourName = tour.nameTour?.toLowerCase() || '';
      const destination = tour.destination?.locationName?.toLowerCase() || '';
      const departure = tour.departure_location?.toLowerCase() || '';

      return tourName.includes(searchTerm) ||
        destination.includes(searchTerm) ||
        departure.includes(searchTerm);
    });

    if (foundTours.length > 0) {
      setSearchResults(foundTours);
      setShowResults(true);
      setShowSuggestions(false);
    } else {
      alert(`Không tìm thấy tour nào phù hợp với từ khóa "${searchQuery}"`);
    }
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

  return (
    <div className="relative">
      {/* Banner Image */}
      <div className="relative">
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

        {/* Search Form */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full px-4 mb-20 md:mb-0">
          <div className="w-full max-w-7xl mx-auto relative">
            <div className="bg-white rounded-2xl p-6 shadow-xl relative z-50">
              <form onSubmit={handleSubmit} className="flex gap-4 relative z-50">
                {/* Input tìm kiếm */}
                <div className="relative flex-1">
                  <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={handleSearchBarClick}
                    placeholder="Bạn muốn đi đâu?"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    required
                  />
                </div>

                {/* Nút tìm kiếm */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`rounded-lg py-3 px-8 transition-colors flex items-center justify-center gap-2 ${isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <span>{isLoading ? 'Đang tải...' : 'Tìm kiếm'}</span>
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <>
                  {/* Overlay click ngoài */}
                  <div
                    className="fixed inset-0 z-0 pointer-events-auto"
                    onClick={handleCloseSuggestions}
                  />

                  {/* Dropdown chính */}
                  <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 w-full max-w-7xl bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Tour được tìm nhiều nhất */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Tour được tìm nhiều nhất</h3>
                          <div className="space-y-4">
                            {popularTours.map((tour: any) => (
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
                            {featuredTours.map((tour: any) => (
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
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Search Results Modal */}
      {showResults && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-60">
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
              {searchResults.map((tour: any) => (
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
    </div>
  );
};

export default Banner;
