import { Outlet } from "react-router-dom"
import Footer from "./Footer"
import Header from "./Header"

const LayoutPages = () => {
  return (
    <div>
      <Header />
      <div className="pt-20">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default LayoutPages
