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

const customerRoute = require("./routes/customerRoute");
const reportRouter = require("./routes/reportRoute");
const bundleRouter = require("./routes/bundleRoute");
const spinRouter = require("./routes/spinRoute");
const rewardRouter = require("./routes/rewardRoute");
const shiprocketRouter = require("./routes/shiprocketRoute");
const { startTrackingCron } = require("./jobs/trackingCron");
const { startDailyBlogCron } = require("./jobs/blogCron");
const { startFeedCron } = require("./jobs/feedCron");
const feedRouter = require("./routes/feedRoute");
const notificationRouter = require("./routes/notificationRoute");
const { initFirebase } = require("./config/firebaseAdmin");
const trackingRouter = require("./routes/trackingRoute");
const aiGrowthRouter = require("./routes/aiGrowthRoute");
const marketIntelRouter = require("./routes/marketIntelRoute");
const rojmelRouter = require("./routes/rojmelRoute");
const offerRouter = require("./routes/offerRoute");
const sizeRouter = require("./routes/sizeRoute");
const googleReviewRouter = require("./routes/googleReviewRoute");
const productInquiryRouter = require("./routes/productInquiryRoute");
const udharRouter = require("./routes/udharRoute");
const vendorRouter = require("./routes/vendorRoute");
const purchaseRouter = require("./routes/purchaseRoute");
const wholesaleRouter = require("./routes/wholesaleRoute");
const staffRouter = require("./routes/staffRoute");

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

const startServer = async () => {
  await dbConnect();
  initFirebase();
};

app.use(compression());
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());
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
app.use("/api/offers", offerRouter);
app.use("/api/size", sizeRouter);
app.use("/api/google-review", googleReviewRouter);
app.use("/api/product-inquiry", productInquiryRouter);
app.use("/api/udhar", udharRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/purchase", purchaseRouter);
app.use("/api/wholesale", wholesaleRouter);
app.use("/api/staff", staffRouter);
app.use("/", feedRouter); // /feed.xml  /feed.json  /feed/refresh

app.get("/ppt", (req, res) => {
  res.sendFile(__dirname + "/public/ppt.html");
});

// Dynamic XML Sitemap — includes all online products and blogs
app.get("/api/sitemap.xml", async (req, res) => {
  try {
    const Product = require("./models/productModel");
    const Blog = require("./models/blogModel");
    const base = "https://www.yashodafashion.com";

    const [products, blogs] = await Promise.all([
      Product.find({ "inventory.online": true }).select("slug _id updatedAt").lean(),
      Blog.find().select("slug _id updatedAt").lean(),
    ]);

    const staticUrls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/product", priority: "0.9", changefreq: "daily" },
      { loc: "/blogs", priority: "0.8", changefreq: "weekly" },
      { loc: "/bundles", priority: "0.8", changefreq: "weekly" },
      { loc: "/reels", priority: "0.7", changefreq: "weekly" },
      { loc: "/about", priority: "0.6", changefreq: "monthly" },
      { loc: "/contact", priority: "0.6", changefreq: "monthly" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/shipping-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/term-conditions", priority: "0.3", changefreq: "yearly" },
    ];

    const productUrls = products.map((p) => ({
      loc: `/product/${p.slug}-${p._id}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : undefined,
    }));

    const blogUrls = blogs.map((b) => ({
      loc: `/blog/${b.slug || b._id}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: b.updatedAt ? new Date(b.updatedAt).toISOString().split("T")[0] : undefined,
    }));

    const allUrls = [...staticUrls, ...productUrls, ...blogUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Sitemap generation failed");
  }
});

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

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use(notFound);
app.use(errorHandler);

startServer()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running at PORT ${PORT}`);
      startTrackingCron();
      startDailyBlogCron();
      startFeedCron();
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
