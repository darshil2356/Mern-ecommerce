const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 8000;
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const blogRouter = require("./routes/blogRoute");
const categoryRouter = require("./routes/prodcategoryRoute");
const blogcategoryRouter = require("./routes/blogCatRoute");
const brandRouter = require("./routes/brandRoute");
const colorRouter = require("./routes/colorRoute");
const enqRouter = require("./routes/enqRoute");
const couponRouter = require("./routes/couponRoute");
const uploadRouter = require("./routes/uploadRoute");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const productRoute = require("./routes/productRoute");

const customerRoute = require("./routes/customerRoute");
const reportRouter = require("./routes/reportRoute");
const bundleRouter = require("./routes/bundleRoute");
const spinRouter = require("./routes/spinRoute");
const rewardRouter = require("./routes/rewardRoute");
const shiprocketRouter = require("./routes/shiprocketRoute");
const { startTrackingCron } = require("./jobs/trackingCron");
const notificationRouter = require("./routes/notificationRoute");
const { initFirebase } = require("./config/firebaseAdmin");


     

dbConnect();
initFirebase();
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/api/user/search", require("./routes/userRoute"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/blog", blogRouter);
app.use("/api/category", categoryRouter);
app.use("/api/blogcategory", blogcategoryRouter);
app.use("/api/brand", brandRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/color", colorRouter);
app.use("/api/enquiry", enqRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/product", productRoute);
app.use("/public", express.static("public"));
app.use("/api/customers", customerRoute);
app.use("/api/reports", reportRouter);
app.use("/api/bundles", bundleRouter);
app.use("/api/spin", spinRouter);
app.use("/api/rewards", rewardRouter);
app.use("/api", shiprocketRouter);
app.use("/api/notifications", notificationRouter);

app.get("/ppt", (req, res) => {
  res.sendFile(__dirname + "/public/ppt.html");
});

app.use("/api/product", productRouter);


// app.use("/api/user", require("./routes/userRoute"));





app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running  at PORT ${PORT}`);
  startTrackingCron();
});
