import { useEffect } from "react"
import BannerWithAboutUs from "./Main/About"
import HotelPromotion from "./Main/HotelPromotion"
import News from "./Main/News"

const LayoutHome = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (

    <div style={{ background: 'transparent' }}>
      <BannerWithAboutUs/>
      <HotelPromotion/>
      <News/>
    </div>
  )
}

export default LayoutHome
