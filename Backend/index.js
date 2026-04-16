const bodyParser = require("body-parser");
const express = require("express");
const compression = require("compression");
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
const { startDailyBlogCron } = require("./jobs/blogCron");
const notificationRouter = require("./routes/notificationRoute");
const { initFirebase } = require("./config/firebaseAdmin");
const trackingRouter = require("./routes/trackingRoute");
const aiGrowthRouter = require("./routes/aiGrowthRoute");
const marketIntelRouter = require("./routes/marketIntelRoute");
const rojmelRouter = require("./routes/rojmelRoute");

// Socket.io setup
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3001",
  process.env.ADMIN_URL  || "http://localhost:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});


     

dbConnect();
initFirebase();
app.use(compression());
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
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
app.use("/api/tracking", trackingRouter);
app.use("/api/ai/growth", aiGrowthRouter);
app.use("/api/marketIntel", marketIntelRouter);
app.use("/api/rojmel", rojmelRouter);

app.get("/ppt", (req, res) => {
  res.sendFile(__dirname + "/public/ppt.html");
});

app.get("/api/product", productRouter);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user-specific room for targeted updates
  socket.on("join-user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join session room
  socket.on("join-session", (sessionId) => {
    if (sessionId) {
      socket.join(`session_${sessionId}`);
    }
  });

  // Admin dashboard room
  socket.on("join-admin", () => {
    socket.join("admin_dashboard");
  });

  // Handle heartbeat from clients
  socket.on("heartbeat", async (data) => {
    const { sessionId, currentPage } = data;

    if (sessionId) {
      // Update session activity
      await require("./models/sessionModel").findOneAndUpdate(
        { sessionId },
        {
          lastActivity: new Date(),
          currentPage,
          isActive: true,
        }
      );

      // Broadcast to admin dashboard
      io.to("admin_dashboard").emit("user_activity", {
        sessionId,
        currentPage,
        timestamp: new Date(),
      });
    }
  });

  // Handle tracking events
  socket.on("track_event", async (eventData) => {
    try {
      if (!eventData.sessionId) return; // ignore events without session

      const Event = require("./models/eventModel");
      const Session = require("./models/sessionModel");

      // Save event
      const event = await Event.create(eventData);

      // Update session
      await Session.findOneAndUpdate(
        { sessionId: eventData.sessionId },
        { lastActivity: new Date(), currentPage: eventData.page }
      );

      // Broadcast to admin dashboard
      io.to("admin_dashboard").emit("new_event", event);

      // Check for issues
      const trackingCtrl = require("./controller/trackingCtrl");
      await trackingCtrl.checkForIssues(
        eventData.sessionId,
        eventData.userId,
        eventData.guestId,
        eventData.eventType,
        eventData.metadata
      );

    } catch (error) {
      console.error("Error handling track_event:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);


// app.use("/api/user", require("./routes/userRoute"));





app.use(notFound);
app.use(errorHandler);
server.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
  startTrackingCron();
  startDailyBlogCron();
});
