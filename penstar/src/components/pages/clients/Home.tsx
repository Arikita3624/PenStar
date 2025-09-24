const Home = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Video background */}
      <video
        src="/banner.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Overlay mờ */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Nội dung banner */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Bạn lựa chọn đặt phòng khách sạn nào?
        </h1>
        <p className="mb-6">Hơn 100 phòng hạng sang giá tốt đang chờ bạn</p>

        {/* Form tìm kiếm */}
        <div className="bg-white rounded-xl shadow-lg p-4 flex gap-4 text-black">
          <input
            type="text"
            placeholder="Nhập tên phòng"
            className="border rounded-md px-3 py-2 w-48"
          />
          <select className="border rounded-md px-3 py-2 w-40">
            <option>Địa điểm</option>
            <option>Hà Nội</option>
            <option>TP Hồ Chí Minh</option>
          </select>
          <select className="border rounded-md px-3 py-2 w-32">
            <option>Giá tiền</option>
            <option>1-2 triệu</option>
            <option>2-5 triệu</option>
          </select>
          <button className="bg-pink-400 text-white px-6 py-2 rounded-md hover:bg-pink-500">
            Tìm kiếm
          </button>
        </div>
      </div>
    </section>
  );
};

export default Home;
