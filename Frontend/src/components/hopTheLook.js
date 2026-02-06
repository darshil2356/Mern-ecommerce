import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const shopTheLookVideos = [
  {
    video: "/videos/look1.mp4",
    productId: "123",
  },
  {
    video: "/videos/look2.mp4",
    productId: "456",
  },
  {
    video: "/videos/look3.mp4",
    productId: "789",
  },
];

const ShopTheLook = ({ navigate }) => {
  const videoRefs = useRef([]);

  return (
    <div className="shop-the-look">
      <h3 className="section-heading mb-4">Shop the Look</h3>

      <Swiper
        modules={[Autoplay]}
        slidesPerView={3}
        spaceBetween={20}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        onSlideChange={(swiper) => {
          videoRefs.current.forEach((video, index) => {
            if (!video) return;
            if (index === swiper.activeIndex) {
              video.currentTime = 0;
              video.play();
            } else {
              video.pause();
            }
          });
        }}
      >
        {shopTheLookVideos.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="position-relative rounded-3 overflow-hidden">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={item.video}
                muted
                playsInline
                loop
                preload="metadata"
                autoPlay={index === 0}
                className="w-100"
                style={{ height: "420px", objectFit: "cover" }}
              />

              {/* CTA */}
              <button
                className="btn btn-dark position-absolute bottom-0 w-100 rounded-0"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                Shop This Lookfdsafaaaaaaaa
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ShopTheLook;
