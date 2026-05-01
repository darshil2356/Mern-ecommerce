import axios from "axios";
import { base_url } from "./axiosConfig";
import { cachedFetch } from "./apiCache";

const CACHE_KEY = "public-settings";
const TTL = 10 * 60 * 1000; // 10 minutes

const DEFAULT = {
  storeName: "Yashoda Fashion",
  storeTagline: "Your One-Stop Shopping Destination",
  storeAddress: "",
  storePhone: "",
  storeEmail: "",
  requireOtpForSignup: false,
  cgst: 0,
  sgst: 0,
  igst: 0,
  storeState: "Gujarat",
  taxIncluded: false,
  shippingCharge: 100,
};

export const getPublicSettings = () =>
  cachedFetch(
    CACHE_KEY,
    () => axios.get(`${base_url}user/public-settings`).then((r) => ({ ...DEFAULT, ...r.data })),
    TTL
  ).catch(() => DEFAULT);
