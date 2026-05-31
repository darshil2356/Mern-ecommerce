require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/userModel");

const makeCode = (name) => {
  const prefix = (name || "USER").replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 4);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}${suffix}`;
};

const ADMIN = {
  firstname: "Yashoda",
  lastname: "Fashion",
  email: "info@yashodafashion.com",
  mobile: "7046252356",
  password: "Yashoda@#123",
  role: "admin",
};

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ DB Connected");

  const exists = await User.findOne({ role: "admin" });
  if (exists) {
    console.log("⚠️  Admin already exists:", exists.email || exists.mobile);
    process.exit(0);
  }

  // Generate unique referral code
  let referralCode = makeCode(ADMIN.firstname);
  while (await User.findOne({ referralCode })) {
    referralCode = makeCode(ADMIN.firstname);
  }

  const admin = await User.create({ ...ADMIN, referralCode });
  console.log("🎉 Admin created successfully!");
  console.log("   Mobile       :", admin.mobile);
  console.log("   Email        :", admin.email);
  console.log("   Role         :", admin.role);
  console.log("   Referral Code:", admin.referralCode);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
