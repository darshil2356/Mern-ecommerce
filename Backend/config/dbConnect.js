const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error("MONGODB_URL environment variable is not set");
    }

    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
    });

    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Database connection error:", error.stack || error.message);
    process.exit(1);
  }
};

module.exports = dbConnect;
