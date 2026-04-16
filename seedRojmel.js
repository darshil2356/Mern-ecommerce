/**
 * Seed script for Rojmel dummy data
 * Run: node Backend/seedRojmel.js
 */
require("dotenv").config({ path: "./Backend/.env" });
const mongoose = require("mongoose");
const Rojmel = require("./Backend/models/rojmelModel");

const dbConnect = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("DB connected");
};

const seeds = [
  { daysAgo: 6, particulars: "Opening Stock Purchase", type: "EXPENSE", amount: 15000, paymentMethod: "Online", category: "Inventory" },
  { daysAgo: 6, particulars: "Online Order #ORD-001 - Samsung TV", type: "INCOME", amount: 45000, paymentMethod: "Online", category: "Orders" },
  { daysAgo: 5, particulars: "Office Rent - June", type: "EXPENSE", amount: 8000, paymentMethod: "Cash", category: "Rent" },
  { daysAgo: 5, particulars: "COD Order #ORD-002 - Headphones", type: "INCOME", amount: 2500, paymentMethod: "COD", category: "Orders" },
  { daysAgo: 4, particulars: "Google Ads Campaign", type: "EXPENSE", amount: 3000, paymentMethod: "Online", category: "Ads" },
  { daysAgo: 4, particulars: "Online Order #ORD-003 - Laptop", type: "INCOME", amount: 65000, paymentMethod: "Online", category: "Orders" },
  { daysAgo: 3, particulars: "Staff Salary - Ravi", type: "EXPENSE", amount: 12000, paymentMethod: "Cash", category: "Salary" },
  { daysAgo: 3, particulars: "Refund - Order #ORD-001 (Cancelled)", type: "EXPENSE", amount: 45000, paymentMethod: "Online", category: "Refund" },
  { daysAgo: 2, particulars: "Online Order #ORD-004 - Watch", type: "INCOME", amount: 8500, paymentMethod: "Online", category: "Orders" },
  { daysAgo: 2, particulars: "Electricity Bill", type: "EXPENSE", amount: 1800, paymentMethod: "Online", category: "Utilities" },
  { daysAgo: 1, particulars: "COD Order #ORD-005 - Shoes", type: "INCOME", amount: 3200, paymentMethod: "COD", category: "Orders" },
  { daysAgo: 1, particulars: "Packaging Material", type: "EXPENSE", amount: 500, paymentMethod: "Cash", category: "Inventory" },
  { daysAgo: 0, particulars: "Online Order #ORD-006 - Camera", type: "INCOME", amount: 22000, paymentMethod: "Online", category: "Orders" },
  { daysAgo: 0, particulars: "Courier Charges", type: "EXPENSE", amount: 350, paymentMethod: "Cash", category: "Utilities" },
];

const run = async () => {
  await dbConnect();
  await Rojmel.deleteMany({});
  console.log("Cleared existing entries");

  let balance = 0;
  for (const s of seeds) {
    const date = new Date();
    date.setDate(date.getDate() - s.daysAgo);
    date.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);

    balance = s.type === "INCOME" ? balance + s.amount : balance - s.amount;

    await Rojmel.create({
      date,
      particulars: s.particulars,
      voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
      type: s.type,
      amount: s.amount,
      paymentMethod: s.paymentMethod,
      category: s.category,
      entrySource: s.category === "Orders" ? "AUTO" : "MANUAL",
      balance,
    });
    console.log(`✓ ${s.type === "INCOME" ? "+" : "-"}₹${s.amount} — ${s.particulars}`);
  }

  console.log(`\n✅ Seeded ${seeds.length} entries. Final balance: ₹${balance}`);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
