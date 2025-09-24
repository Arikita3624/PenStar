import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const LayoutClient = () => {
  return (
    <div>
      <Header />
      <div>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default LayoutClient;
