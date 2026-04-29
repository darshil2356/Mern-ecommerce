const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/userModel");

// In-memory store (replace with Redis in production using your existing redis package)
const otpStore = new Map();
const rateLimitStore = new Map();

const RATE_LIMIT = 3;       // max OTP requests per phone per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY = 5 * 60 * 1000;   // 5 minutes
const MAX_VERIFY_ATTEMPTS = 3;

const isRateLimited = (mobile) => {
  const data = rateLimitStore.get(mobile);
  if (!data) return false;
  if (Date.now() > data.resetAt) {
    rateLimitStore.delete(mobile);
    return false;
  }
  return data.count >= RATE_LIMIT;
};

const incrementRateLimit = (mobile) => {
  const data = rateLimitStore.get(mobile) || { count: 0, resetAt: Date.now() + RATE_WINDOW };
  data.count++;
  rateLimitStore.set(mobile, data);
};

// Send OTP to phone number
const sendPhoneOTP = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    res.status(400);
    throw new Error("Valid 10-digit Indian mobile number is required");
  }

  if (isRateLimited(mobile)) {
    res.status(429);
    throw new Error("Too many OTP requests. Try again after 1 hour.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  otpStore.set(mobile, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY,
    attempts: 0,
  });

  incrementRateLimit(mobile);

  if (!process.env.FAST2SMS_API_KEY || process.env.FAST2SMS_API_KEY === "your_fast2sms_api_key_here") {
    console.log(`[OTP DEV] ${mobile}: ${otp}`);
    return res.json({ success: true, message: "OTP sent (dev mode - check server logs)", devOtp: process.env.NODE_ENV !== "production" ? otp : undefined });
  }

  // Send OTP via Fast2SMS (OTP route - cheapest at ~₹0.25/SMS)
  try {
    const smsRes = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: mobile,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("[Fast2SMS Response]", JSON.stringify(smsRes.data, null, 2));
    if (smsRes.data?.return === false) {
      const msg = Array.isArray(smsRes.data?.message) ? smsRes.data.message.join(", ") : String(smsRes.data?.message || "SMS provider rejected the request");
      res.status(500);
      throw new Error(msg);
    }
  } catch (smsErr) {
    const rawData = smsErr?.response?.data;
    console.error("[OTP SMS Error Raw]", JSON.stringify(rawData, null, 2));
    console.error("[OTP SMS Error Message]", smsErr.message);
    const errMsg = (Array.isArray(rawData?.message) ? rawData.message.join(", ") : rawData?.message) || smsErr.message;
    res.status(500);
    throw new Error(`SMS Error: ${errMsg}`);
  }

  res.json({ success: true, message: "OTP sent successfully" });
});

// Verify OTP — returns a short-lived token to use during signup
const verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    res.status(400);
    throw new Error("Mobile and OTP are required");
  }

  const data = otpStore.get(mobile);

  if (!data) {
    res.status(400);
    throw new Error("OTP expired or not found. Request a new one.");
  }

  if (Date.now() > data.expiresAt) {
    otpStore.delete(mobile);
    res.status(400);
    throw new Error("OTP expired. Request a new one.");
  }

  if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(mobile);
    res.status(400);
    throw new Error("Too many wrong attempts. Request a new OTP.");
  }

  data.attempts++;

  if (data.otp !== otp) {
    res.status(400);
    throw new Error(`Invalid OTP. ${MAX_VERIFY_ATTEMPTS - data.attempts} attempts left.`);
  }

  otpStore.delete(mobile);

  // Issue a short-lived verification token (valid 10 min) for signup
  const verifyToken = crypto.randomBytes(32).toString("hex");
  otpStore.set(`verified:${mobile}`, {
    token: verifyToken,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  res.json({ success: true, verifyToken });
});

// Middleware: validate phone verification token before signup
const requirePhoneVerified = (req, res, next) => {
  const { mobile, verifyToken } = req.body;

  if (!mobile || !verifyToken) {
    res.status(400);
    throw new Error("Phone verification required before signup");
  }

  const data = otpStore.get(`verified:${mobile}`);

  if (!data || data.token !== verifyToken || Date.now() > data.expiresAt) {
    res.status(400);
    throw new Error("Phone not verified or verification expired. Please verify again.");
  }

  // Clean up after use
  otpStore.delete(`verified:${mobile}`);
  next();
};

module.exports = { sendPhoneOTP, verifyPhoneOTP, requirePhoneVerified };
