// import { useEffect, useRef, useState } from "react";

// // IMPORTANT: this bypasses React Router completely
// const VIDEO_BASE = process.env.PUBLIC_URL + "/videos";

// const videos = [
//   { src: `${VIDEO_BASE}/look1.mp4`, productId: "123" },
//   { src: `${VIDEO_BASE}/look2.mp4`, productId: "456" },
//   { src: `${VIDEO_BASE}/look3.mp4`, productId: "789" },
// ];

// const ShopTheLook = ({ navigate }) => {
//   const videoRefs = useRef([]);
//   const [active, setActive] = useState(0);

//   // change slide every 5s
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setActive((prev) => (prev + 1) % videos.length);
//     }, 5000);

//     return () => clearInterval(interval);
//   }, []);

//   // play only active video
//   useEffect(() => {
//     videoRefs.current.forEach((video, index) => {
//       if (!video) return;

//       if (index === active) {
//         video.currentTime = 0;
//         video.play().catch(() => {});
//       } else {
//         video.pause();
//       }
//     });
//   }, [active]);

//   return (
//     <div className="row">
//       <div className="col-12">
//         <h3 className="section-heading mb-4">Shop the Look</h3>

//         <div className="d-flex gap-3 overflow-auto">
//           {videos.map((item, index) => (
//             <div
//               key={index}
//               style={{
//                 minWidth: "280px",
//                 height: "460px",
//                 borderRadius: "12px",
//                 overflow: "hidden",
//                 border: index === active ? "2px solid black" : "1px solid #ddd",
//                 background: "#000",
//               }}
//             >
//               <video
//                 ref={(el) => (videoRefs.current[index] = el)}
//                 src={item.src}
//                 muted
//                 playsInline
//                 preload="metadata"
//                 style={{
//                   width: "100%",
//                   height: "420px",
//                   objectFit: "cover",
//                   display: "block",
//                 }}
//                 onError={(e) => {
//                   console.error("VIDEO FAILED:", e.target.src);
//                 }}
//               />

//               <button
//                 className="btn btn-dark w-100 rounded-0"
//                 onClick={() => navigate(`/product/${item.productId}`)}
//               >
//                 Shop This Look
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShopTheLook;



// import { useSelector } from "react-redux";
// import { useEffect, useRef, useState } from "react";
// import { useDispatch } from "react-redux";
// import { getAllProducts } from "../features/products/productSlilce";








// const ShopTheLook = ({ navigate }) => {
//   const productState = useSelector(
//   (state) => state?.product?.product?.products || []
// );



//   const fullProductState = useSelector((state) => state.product);
// console.log("FULL PRODUCT STATE", fullProductState);

// useEffect(() => {
//   console.log("PRODUCTS USED IN SHOP THE LOOK", productState);
// }, [productState]);



//   const dynamicVideos = Array.isArray(productState)
//     ? productState
//         .filter((p) => Array.isArray(p?.videos) && p.videos.length > 0)
//         .map((p) => ({
//           src: p.videos[0].url,
//           productId: p._id,
//         }))
//     : [];

//   // const videos =
//   //   dynamicVideos.length > 0 ? dynamicVideos : fallbackVideos;

//   const videoRefs = useRef([]);
//   const [active, setActive] = useState(0);

//   const dispatch = useDispatch();

// useEffect(() => {
//   dispatch(getAllProducts());

// }, [dispatch]);
// console.log("PRODUCTS USED IN SHOP THE LOOK", productState);


//   useEffect(() => {
//     const interval = setInterval(() => {
//       setActive((prev) => (prev + 1) % videos.length);
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [videos.length]);

//   useEffect(() => {
//     videoRefs.current.forEach((video, index) => {
//       if (!video) return;
//       if (index === active) {
//         video.currentTime = 0;
//         video.play().catch(() => {});
//       } else {
//         video.pause();
//       }
//     });
//   }, [active, videos.length]);

//   return (
//     <div className="row">
//       <div className="col-12">
//         <h3 className="section-heading mb-4">Shop the Look</h3>

//         <div className="d-flex gap-3 overflow-auto">
//           {videos.map((item, index) => (
//             <div
//               key={index}
//               style={{
//                 minWidth: "280px",
//                 height: "460px",
//                 borderRadius: "12px",
//                 overflow: "hidden",
//                 background: "#000",
//                 border: index === active ? "2px solid black" : "1px solid #ddd",
//               }}
//             >
//               <video
//                 ref={(el) => (videoRefs.current[index] = el)}
//                 src={item.src}
//                 muted
//                 playsInline
//                 preload="metadata"
//                 style={{
//                   width: "100%",
//                   height: "420px",
//                   objectFit: "cover",
//                   display: "block",
//                 }}
//               />

//               <button
//                 className="btn btn-dark w-100 rounded-0"
//                 onClick={() => navigate(`/product/${item.productId}`)}
//               >
//                 Shop This Look
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShopTheLook;






import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import { getAllProducts } from "../features/products/productSlilce";

const ShopTheLook = ({ navigate }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllProducts());
  }, [dispatch]);

  // products array
  const productState = useSelector(
    (state) => state?.product?.product || []
  );

  // build video list
  const dynamicVideos = productState
    .filter(
      (p) =>
        Array.isArray(p?.videos) &&
        p.videos.length > 0 &&
        p.videos[0]?.url
    )
    .map((p) => ({
      src: p.videos[0].url,
      productId: p._id,
      name: p.title,
    }));

  const videoRefs = useRef([]);

  // 🔥 PLAY ALL VIDEOS TOGETHER
  useEffect(() => {
    if (!dynamicVideos.length) return;

    const playAll = () => {
      videoRefs.current.forEach((video) => {
        if (!video) return;
        video.muted = true;
        video.loop = true;
        video.play().catch(() => {});
      });
    };

    // wait for DOM + refs
    requestAnimationFrame(() => {
      requestAnimationFrame(playAll);
    });
  }, [dynamicVideos.length]);

  return (
    <div className="row">
      <div className="col-12">
        <h3 className="section-heading mb-4">Shop the Look</h3>

        <div className="d-flex gap-3 overflow-auto">
          {dynamicVideos.length === 0 ? (
            <div className="text-muted">No videos available</div>
          ) : (
            dynamicVideos.map((item, index) => (
              <div
                key={index}
                style={{
                  width: "270px",
                  aspectRatio: "9 / 16",
                  borderRadius: "14px",
                  overflow: "hidden",
                  backgroundColor: "#000",
                  border: "1px solid #ddd",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="text-white text-center py-2">
                  {item.name}
                </div>

                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={item.src}
                  muted
                  playsInline
                  loop
                  preload="auto"
                  style={{
                    width: "100%",
                    height: "420px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <button
                  className="btn btn-dark w-100 rounded-0"
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  Shop This Look
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopTheLook;
