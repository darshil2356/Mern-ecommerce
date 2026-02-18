import React, { useEffect } from "react";
import ReactStars from "react-rating-stars-component";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "../features/products/productSlilce";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useState } from "react";


const ProductCard = (props) => {
  const navigate = useNavigate();
  const { grid, data } = props;
  const dispatch = useDispatch();
  const location = useLocation();
  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);
  const [wishlist, setWishlist] = useState(wishlistState || []);
  const [autoPlayIndexes, setAutoPlayIndexes] = useState([]);
  useEffect(() => {
    if (data?.length > 0) {
      const shuffled = [...data.keys()]
        .sort(() => 0.5 - Math.random());
      // 👉 choose how many videos should autoplay
      const randomCount = Math.floor(data.length * 0.3); // 30% autoplay
      setAutoPlayIndexes(shuffled.slice(0, randomCount));
    }
  }, [data]);
  useEffect(() => {
    setWishlist(wishlistState || []);
  }, [wishlistState]);

  const isProductInWishlist = (productId) => {
    return wishlist?.some((item) => item._id === productId);
  };

  const addToWish = (productId) => {
    if (isProductInWishlist(productId)) {
      dispatch(addToWishlist(productId)); // Dispatch the action to update the wishlist in Redux store

      const updatedWishlist = wishlist.filter((item) => item._id !== productId);
      setWishlist(updatedWishlist);
    } else {
      dispatch(addToWishlist(productId)); // Dispatch the action to update the wishlist in Redux store

      const product = data.find((item) => item._id === productId);
      setWishlist([...wishlist, product]);
    }
  };

  return (
    <>
      {data?.map((item, index) => {
        const isWishlist = isProductInWishlist(item._id);
        console.log(isWishlist);
        return (
          <div
            key={index}
            className={` ${location.pathname == "/product" ? `gr-${grid}` : "col-3"
              } `}
          >
            <div className="product-card position-relative">
              <div className="wishlist-icon position-absolute">
                <button
                  className="border-0 bg-transparent"
                  onClick={(e) => addToWish(item?._id)}
                >
                  {isWishlist ? (
                    <AiFillHeart className="fs-5 me-1" />
                  ) : (
                    <AiOutlineHeart className="fs-5 me-1" />
                  )}
                </button>
              </div>
              <div
                className="product-image"
                onClick={() => navigate("/product/" + item?._id)}
                style={{
                  cursor: "pointer",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}
              >
                {item?.videos?.[0]?.url ? (
                  <video
                    src={item.videos[0].url}
                    muted
                    loop
                    playsInline
                    autoPlay={autoPlayIndexes.includes(index)}
                    preload="metadata"
                    style={{
                      width: "100%",
                      height: "250px",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => {
                      if (!autoPlayIndexes.includes(index)) {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }
                    }}
                  />


                ) : item?.images?.[0]?.url ? (
                  <img
                    src={item.images[0].url}
                    alt={item?.title || "product"}
                    style={{
                      width: "100%",
                      height: "250px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "250px",
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      color: "#999",
                    }}
                  >
                    No Media Available
                  </div>
                )}
              </div>
              <div className="product-details">
                <div className="wishlist-icon position-absolute">
                  <button
                    className="border-0 bg-transparent"
                    onClick={(e) => addToWish(item?._id)}
                  >
                    {isWishlist ? (
                      <AiFillHeart className="fs-5 me-1" />
                    ) : (
                      <AiOutlineHeart className="fs-5 me-1" />
                    )}
                  </button>
                </div>
                <h6 className="brand">{item?.brand}</h6>
                <h5 className="product-title">
                  {grid === 12 || grid === 6
                    ? item?.title
                    : item?.title?.length > 80
                      ? item.title.slice(0, 80) + "..."
                      : item?.title}
                </h5>
                {/* <ReactStars
                  count={5}
                  size={24}
                  value={item?.totalrating}
                  edit={false}
                  activeColor="#ffd700"
                /> */}
                <p className="price">Rs.{item?.price}</p>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ProductCard;
