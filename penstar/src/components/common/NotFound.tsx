import { Button } from "antd";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded shadow">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-xl">Không tìm thấy trang này.</p>
        <div className="mt-6">
          <Link to="/">
            <Button type="primary">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
