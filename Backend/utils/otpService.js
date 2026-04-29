const crypto = require("crypto");

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const storeOTP = (mobile, otp) => {
  otpStore.set(mobile, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
  });
};

const verifyOTP = (mobile, otp) => {
  const data = otpStore.get(mobile);
  
  if (!data) return { success: false, message: "OTP expired or not found" };
  
  if (Date.now() > data.expiresAt) {
    otpStore.delete(mobile);
    return { success: false, message: "OTP expired" };
  }
  
  if (data.attempts >= 3) {
    otpStore.delete(mobile);
    return { success: false, message: "Too many attempts" };
  }
  
  data.attempts++;
  
  if (data.otp !== otp) {
    return { success: false, message: "Invalid OTP" };
  }
  
  otpStore.delete(mobile);
  return { success: true };
};

const sendOTP = async (mobile, otp) => {
  // Integrate with SMS provider (Twilio, MSG91, etc.)
  console.log(`OTP for ${mobile}: ${otp}`);
  // TODO: Implement actual SMS sending
  return true;
};

module.exports = { generateOTP, storeOTP, verifyOTP, sendOTP };
