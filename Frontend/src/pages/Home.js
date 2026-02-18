import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import BlogCard from "../components/BlogCard";
import Container from "../components/Container";
import { services } from "../utils/Data";
import wish from "../images/wish.svg";
import { useDispatch, useSelector } from "react-redux";
import { getAllBlogs } from "../features/blogs/blogSlice";
import moment from "moment";
import { getAllProducts } from "../features/products/productSlilce";
import ReactStars from "react-rating-stars-component";
import { addToWishlist } from "../features/products/productSlilce";
import ShopTheLook from "../components/ShopTheLook";



const Home = () => {
  const blogState = useSelector((state) => state?.blog?.blog);
  const productState = useSelector((state) => state?.product?.product);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    getblogs();
    getProducts();
  }, []);


  useEffect(() => {
    if (!productState) return;

    productState
      .filter(item => item?.inventory?.online === true)
      .forEach(item => {
        console.log("Only online items ", item.title);
      });
  }, [productState]);

  const getblogs = () => {
    dispatch(getAllBlogs());
  };

  const getProducts = () => {
    dispatch(getAllProducts());
  };

  const addToWish = (id) => {
    //alert(id);
    dispatch(addToWishlist(id));
  };
  return (
    <>
      <Container class1="home-wrapper-1 py-5">
        <div className="row block align-items-center">
          <div className="col-12 col-lg-6">
            <div className="main-banner position-relative ">
              <img
                src="images/main-banner-1.jpg"
                className="img-fluid rounded-3"
                alt="main banner"
              />
              <div className="main-banner-content position-absolute">
                <h4>SUPERCHARGED FOR PROS.</h4>
                <h5>iPad S13+ Pro.</h5>
                <p>From Rs. 81,900.00 </p>
                <Link className="button">BUY NOW</Link>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="d-flex flex-wrap gap-10 justify-content-between align-items-center">
              <div className="small-banner position-relative">
                <img
                  src="images/catbanner-01.jpg"
                  className="img-fluid rounded-3"
                  alt="main banner"
                />
                <div className="small-banner-content position-absolute">
                  <h4>Best Sake</h4>
                  <h5>MacBook Pro.</h5>
                  <p>
                    From Rs. 1,29,900.00 <br />
                  </p>
                </div>
              </div>
              <div className="small-banner position-relative">
                <img
                  src="images/catbanner-02.jpg"
                  className="img-fluid rounded-3"
                  alt="main banner"
                />
                <div className="small-banner-content position-absolute">
                  <h4>NEW ARRIVAL</h4>
                  <h5>But IPad Air</h5>
                  <p>
                    From Rs. 21,625.00 <br />
                  </p>
                </div>
              </div>
              <div className="small-banner position-relative ">
                <img
                  src="images/catbanner-03.jpg"
                  className="img-fluid rounded-3"
                  alt="main banner"
                />
                <div className="small-banner-content position-absolute">
                  <h4>NEW ARRIVAL</h4>
                  <h5>But IPad Air</h5>
                  <p>
                    From Rs. 41,900.00 <br />
                  </p>
                </div>
              </div>
              <div className="small-banner position-relative ">
                <img
                  src="images/catbanner-04.jpg"
                  className="img-fluid rounded-3"
                  alt="main banner"
                />
                <div className="small-banner-content position-absolute">
                  <h4>NEW ARRIVAL</h4>
                  <h5>But Headphone</h5>
                  <p>
                    From Rs. 41,000.00 <br />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <Container class1="home-wrapper-2">
        <div className="row">
          <div className="col-12">
            <div className="servies d-flex align-items-center justify-content-between">
              {services?.map((i, j) => {
                return (
                  <div className="d-flex align-items-center gap-15" key={j}>
                    <img src={i.image} alt="services" />
                    <div>
                      <h6>{i.title}</h6>
                      <p className="mb-0">{i.tagline}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
      <Container class1="home-wrapper-2 py-5">
        <div className="row">
          <div className="col-12">
            <ShopTheLook navigate={navigate} />
          </div>
        </div>
      </Container>


      <Container class1="featured-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-12">
            <h3 className="section-heading">Featured Collection</h3>
          </div>
          {productState &&
            productState.map((item, index) => {
              if (item.tags === "featured") {

                return (
                  <div
                    key={index}
                    className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 gap-y-3 mt-4"
                    onClick={() => navigate("/product/" + item?._id)}
                  >
                    <div className="product-card position-relative ">
                      <div className="wishlist-icon position-absolute cursor-pointer">
                        <button className="border-0 bg-transparent">
                          <img
                            src={wish}
                            alt="wishlist"
                            onClick={() => addToWish(item?._id)}
                          />
                        </button>
                      </div>

                      <div className="product-image cursor-pointer" >
                        <img
                          src={item?.images?.[0]?.url || "/images/placeholder.png"}
                          alt="product"
                          height="250"
                          width="100%"
                          onClick={() => navigate("/product/" + item?._id)}
                        />
                        <img
                          src={item?.images?.[0]?.url || "/images/placeholder.png"}
                          alt="product"
                          height="250"
                          width="100%"
                          onClick={() => navigate("/product/" + item?._id)}
                        />
                      </div>

                      <div className="product-details ">
                        <h6 className="brand">{item?.brand}</h6>

                        <h5 className=" cursor-pointer">

                          {item?.title?.substr(0, 70)}...
                        </h5>

                        {/* <ReactStars
                count={5}
                size={24}
                value={Number(item?.totalrating) || 0}
                edit={false}
                activeColor="#ffd700"
              /> */}

                        <p className="bg-red-600">Rs. {item?.price}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}

        </div>
      </Container>

      <Container class1="special-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-12">
            <h3 className="section-heading">Special Products</h3>
          </div>

          {productState &&
            productState.map((item, index) => {
              if (item.tags === "special") {
                return (
                  <div
                    key={index}
                    className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 mt-4"
                  >
                    <div className="product-card position-relative">
                      <div className="wishlist-icon position-absolute">
                        <button className="border-0 bg-transparent">
                          <img
                            src={wish}
                            alt="wishlist"
                            onClick={() => addToWish(item?._id)}
                          />
                        </button>
                      </div>

                      <div className="product-image">
                        <img
                          src={item?.images?.[0]?.url || "/images/placeholder.png"}
                          alt="product"
                          height="250"
                          width="100%"
                          onClick={() => navigate("/product/" + item?._id)}
                        />
                        <img
                          src={item?.images?.[0]?.url || "/images/placeholder.png"}
                          alt="product"
                          height="250"
                          width="100%"
                          onClick={() => navigate("/product/" + item?._id)}
                        />
                      </div>

                      <div className="product-details">
                        <h6 className="brand">{item?.brand}</h6>

                        <h5 className="product-title">
                          {item?.title?.substr(0, 70)}...
                        </h5>

                        {/* <ReactStars
                    count={5}
                    size={24}
                    value={Number(item?.totalrating) || 0}
                    edit={false}
                    activeColor="#ffd700"
                  /> */}

                        <p className="price">Rs. {item?.price}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
        </div>
      </Container>
      <Container class1="popular-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-12">
            <h3 className="section-heading">Our Popular Products</h3>
          </div>

          {productState &&
            productState.map((item, index) => {
              if (item.tags === "popular") {
                return (
                  <div
                    key={index}
                    className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 mt-4"
                  >
                    <div className="product-card position-relative">
                      <div className="wishlist-icon position-absolute">
                        <button className="border-0 bg-transparent">
                          <img
                            src={wish}
                            alt="wishlist"
                            onClick={() => addToWish(item?._id)}
                          />
                        </button>
                      </div>

                      <div className="product-image">
                        <img
                          src={item?.images?.[0]?.url || "/images/placeholder.png"}
                          alt="product"
                          height="250"
                          width="100%"
                          onClick={() => navigate("/product/" + item?._id)}
                        />
                        <img
                          src={item?.images?.[0]?.url || "/images/placeholder.png"}
                          alt="product"
                          height="250"
                          width="100%"
                          onClick={() => navigate("/product/" + item?._id)}
                        />
                      </div>

                      <div className="product-details">
                        <h6 className="brand">{item?.brand}</h6>

                        <h5 className="product-title">
                          {item?.title?.substr(0, 70)}...
                        </h5>

                        {/* <ReactStars
                    count={5}
                    size={24}
                    value={Number(item?.totalrating) || 0}
                    edit={false}
                    activeColor="#ffd700"
                  /> */}

                        <p className="price">Rs. {item?.price}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
        </div>
      </Container>
      {blogState && blogState.length > 0 && (
      <Container class1="blog-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-12">
            <h3 className="section-heading">Our Latest Blogs</h3>
          </div>
        </div>
        <div className="row">
          {blogState &&
            blogState?.map((item, index) => {
              if (index < 4) {
                return (
                  <div className="col-3 " key={index}>
                    <BlogCard
                      id={item?._id}
                      title={item?.title}
                      description={item?.description}
                      // image={item?.images[0]?.url}
                      image={item?.images?.[0]?.url || "/images/placeholder.png"}

                      date={moment(item?.createdAt).format(
                        "MMMM Do YYYY, h:mm a"
                      )}
                    />
                  </div>
                );
              }
            })}
        </div>
      </Container>
      )}
    </>
  );
};

export default Home;
