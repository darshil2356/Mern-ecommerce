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
  storeWhatsapp: "",
  storeOpeningHours: "10:00 AM - 08:30 PM",
  googleMapsUrl: "",
  googleBusinessProfileUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  storeLogo: "",
  storeFavicon: "",
  socialShareImage: "",
  googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJP-z0FraHXjkRP-xoeP6FaF0",
  googleReviewRequestMessage: "Thank you for shopping with Yashoda Fashion ❤️ If you loved your shopping experience, we'd really appreciate your honest Google review. Your feedback helps our business grow!",
  homepageMetaTitle: "Yashoda Fashion | Women's Clothing Store in Bapunagar, Ahmedabad",
  homepageMetaDescription: "Shop women's kurtis, sarees, suit sets, western wear, pants, tops and festive wear at Yashoda Fashion, Bapunagar, Ahmedabad. Stylish collections at affordable prices.",
  heroBannerImage: "",
  heroBannerTitle: "Yashoda Fashion",
  heroBannerSubtext: "Women's Fashion for Every Occasion",
  heroBannerCta: "SHOP NOW",
  promoBannerImage: "",
  promoBannerLink: "",
  homepageSectionsOrder: "hero,categories,newArrivals,bestsellers,trending,festive,premium,ethnic,western,pants,plusSize,offers,whyChooseUs,testimonials,faq,location",
  homepageHiddenSections: "",
  storeFaqsJson: "[]",
};

export const getPublicSettings = () =>
  cachedFetch(
    CACHE_KEY,
    () => axios.get(`${base_url}user/public-settings`).then((r) => ({ ...DEFAULT, ...r.data })),
    TTL
  ).catch(() => DEFAULT);
