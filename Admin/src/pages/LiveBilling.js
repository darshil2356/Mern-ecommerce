import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import QRCode from "qrcode";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import { Modal, Input, Form } from "antd";
import Swal from "sweetalert2";
import { 
  FaBarcode, 
  FaRupeeSign, 
  FaPrint, 
  FaCheckCircle, 
  FaUser, 
  FaMapMarkerAlt, 
  FaPhone,
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaBuilding,
  FaGift,
  FaTag,
  FaCoins,
  FaUserPlus,
  FaSync,
  FaExchangeAlt,
  FaArrowRight,
  FaBoxOpen,
  FaUndo
} from "react-icons/fa";
import SpinWheel from "../components/SpinWheel";
import PrintBillButton from "../components/PrintBillButton";

const LiveBilling = () => {
  const [buffer, setBuffer] = useState("");
  const [cart, setCart] = useState({});

  // Tab mode: "BILLING" | "RETURN_EXCHANGE"
  const [posTabMode, setPosTabMode] = useState("BILLING");

  // Return & Exchange Tab Multi-Item Basket State
  const [retBarcode, setRetBarcode] = useState("");
  const [retCart, setRetCart] = useState({}); // { [barcode]: { product, barcode, qty, qcStatus, price, purchaseVerification } }

  const [exBarcode, setExBarcode] = useState("");
  const [exCart, setExCart] = useState({}); // { [barcode]: { product, barcode, qty, price } }

  const [retPaymentMethod, setRetPaymentMethod] = useState("CASH"); // CASH | ONLINE | COINS | UDHAR | NONE
  const [retPaymentDestination, setRetPaymentDestination] = useState("CASH"); // CASH | CURRENT_ACCOUNT
  const [retNote, setRetNote] = useState("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Return Customer Search Auto-Suggest & Purchase Verification state
  const [retCustSearchInput, setRetCustSearchInput] = useState("");
  const [retCustResults, setRetCustResults] = useState([]);
  const [showRetCustDropdown, setShowRetCustDropdown] = useState(false);
  const [purchaseVerification, setPurchaseVerification] = useState(null);

  const [cgstPercent, setCgstPercent] = useState(0);
  const [sgstPercent, setSgstPercent] = useState(0);
  const [igstPercent, setIgstPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [flatDiscount, setFlatDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percent"); // "percent" | "flat"
  // GST type: "CGST_SGST" for intra-state, "IGST" for inter-state, "NONE" for no tax
  const [gstType, setGstType] = useState("CGST_SGST");
  const [storeState, setStoreState] = useState("Gujarat");

  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [contactResults, setContactResults] = useState([]);
  const [nameResults, setNameResults] = useState([]);

  const clampNonNegative = (v) => {
    if (v === "" || isNaN(v)) return 0;
    return Math.max(0, Number(v));
  };

  const [customer, setCustomer] = useState({
    name: "",
    address: "",
    contact: "",
    referralContact: "",
    referralCode: ""
  });

  // Referral validation state
  const [referrerName, setReferrerName] = useState("");
  const [referrerError, setReferrerError] = useState("");
  const [referrerCode, setReferrerCode] = useState("");
  const [referralSearch, setReferralSearch] = useState("");
  const [referralResults, setReferralResults] = useState([]);
  const [showReferralDropdown, setShowReferralDropdown] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // GSTIN state
  const [gstin, setGstin] = useState("");
  const [gstinModalVisible, setGstinModalVisible] = useState(false);
  const [gstinInput, setGstinInput] = useState("");

  // Spin Wheel state
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [customerOffer, setCustomerOffer] = useState({ hasOffer: false, offerDiscount: 0, offerType: "" });
  const [appliedOfferAmount, setAppliedOfferAmount] = useState(0);

  // Settings state - loaded from backend
  const [showSpinner, setShowSpinner]           = useState(false);
  const [showReferralOffer, setShowReferralOffer] = useState(false);
  const [referralCoinPercent, setReferralCoinPercent] = useState(10);
  const [storeName, setStoreName]               = useState("Yashoda Fashion");
  const [storeTagline, setStoreTagline]         = useState("Your One-Stop Shopping Destination");
  // Tax settings — persisted from backend, NOT reset after sale
  const [taxIncluded, setTaxIncluded]           = useState(false);
  const [defaultCgst, setDefaultCgst]           = useState(0);
  const [defaultSgst, setDefaultSgst]           = useState(0);
  const [defaultIgst, setDefaultIgst]           = useState(0);
  const [defaultStoreState, setDefaultStoreState] = useState("Gujarat");
  // Customer shipping state for GST determination
  const [customerState, setCustomerState]       = useState("Gujarat");

  // Coin config for preview
  const [coinConfig, setCoinConfig] = useState(null);
  const [referralConfig, setReferralConfig] = useState(null);

  // Coins state
  const [customerCoins, setCustomerCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [sendReferrerCoins, setSendReferrerCoins] = useState(true);
  const [sendBuyerCoins, setSendBuyerCoins] = useState(true);
  const [showCoinCelebration, setShowCoinCelebration] = useState(false);
  const [celebratedCoins, setCelebratedCoins] = useState(0);
  const coinCelebrationTimerRef = useRef(null);

  // UPI IDs for QR code
  const [upiIdA, setUpiIdA] = useState("");
  const [upiIdB, setUpiIdB] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  // Payment received state
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  // ac: "C" = current (all GST products), "S" = saving (any non-GST product)
  const [ac, setAc] = useState("S");
  const GST_CHARS = ["K", "M", "R", "T", "W"];

  // Auto-derive account type from cart pkeys
  const resolvedAc = useMemo(() => {
    const items = Object.values(cart);
    if (!items.length) return "S";
    const allGst = items.every(item => GST_CHARS.includes((item.pkey || "")[5]));
    return allGst ? "C" : "S";
  }, [cart]);

  useEffect(() => { setAc(resolvedAc); }, [resolvedAc]);

  // Sale processing state
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const isProcessingSaleRef = useRef(false);

  // Scanner input ref
  const scannerRef = useRef(null);

  /* =========================
     FETCH PRODUCT
     ========================= */
  const fetchProductByBarcode = async (barcode) => {
    const res = await axios.get(
      `${base_url}product/barcode/${barcode}`,
      config
    );
    return res.data;
  };

  /* =========================
     CHECK STOCK
     ========================= */
  const checkStock = async (barcode, quantity) => {
    try {
      const res = await axios.post(
        `${base_url}user/check-stock`,
        { barcode, quantity },
        config
      );
      return res.data;
    } catch (err) {
      return null;
    }
  };

  /* =========================
     RETURN & EXCHANGE HANDLERS
     ========================= */
  /* =========================
     MULTI-ITEM RETURN & EXCHANGE HANDLERS
     ========================= */

  // Return Basket Handlers
  const handleAddReturnProductByBarcode = async (codeToLookup) => {
    const b = (codeToLookup || retBarcode).trim();
    if (!b) return;
    try {
      const prod = await fetchProductByBarcode(b);
      if (prod && prod._id) {
        let verData = null;
        if (customer?._id) {
          try {
            const verRes = await axios.post(
              `${base_url}user/pos/verify-return-product`,
              { customerId: customer._id, barcode: b, productId: prod._id },
              config
            );
            if (verRes.data) verData = verRes.data;
          } catch (err) { console.error(err); }
        }

        setRetCart(prev => {
          const existing = prev[b];
          const qty = existing ? existing.qty + 1 : 1;
          return {
            ...prev,
            [b]: {
              product: prod,
              barcode: b,
              qty,
              qcStatus: existing ? existing.qcStatus : "RESELLABLE",
              price: existing ? existing.price : (verData?.pricePaid || prod.price || 0),
              purchaseVerification: verData || null,
            }
          };
        });
        setRetBarcode("");
      } else {
        Swal.fire({ icon: "error", title: "Product Not Found", text: `No product found for barcode: ${b}` });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Product Not Found", text: `Error fetching barcode: ${b}` });
    }
  };

  const updateRetCartQty = (barcode, newQty) => {
    const q = Math.max(1, Number(newQty) || 1);
    setRetCart(prev => ({
      ...prev,
      [barcode]: { ...prev[barcode], qty: q }
    }));
  };

  const updateRetCartPrice = (barcode, newPrice) => {
    setRetCart(prev => ({
      ...prev,
      [barcode]: { ...prev[barcode], price: Math.max(0, Number(newPrice) || 0) }
    }));
  };

  const updateRetCartQc = (barcode, qcStatus) => {
    setRetCart(prev => ({
      ...prev,
      [barcode]: { ...prev[barcode], qcStatus }
    }));
  };

  const removeRetCartItem = (barcode) => {
    setRetCart(prev => {
      const next = { ...prev };
      delete next[barcode];
      return next;
    });
  };

  // Exchange Basket Handlers
  const handleAddExchangeProductByBarcode = async (codeToLookup) => {
    const b = (codeToLookup || exBarcode).trim();
    if (!b) return;
    try {
      const prod = await fetchProductByBarcode(b);
      if (prod && prod._id) {
        setExCart(prev => {
          const existing = prev[b];
          const qty = existing ? existing.qty + 1 : 1;
          return {
            ...prev,
            [b]: {
              product: prod,
              barcode: b,
              qty,
              price: existing ? existing.price : (prod.price || 0),
            }
          };
        });
        setExBarcode("");
      } else {
        Swal.fire({ icon: "error", title: "Product Not Found", text: `No product found for barcode: ${b}` });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Product Not Found", text: `Error fetching barcode: ${b}` });
    }
  };

  const updateExCartQty = (barcode, newQty) => {
    const q = Math.max(1, Number(newQty) || 1);
    setExCart(prev => ({
      ...prev,
      [barcode]: { ...prev[barcode], qty: q }
    }));
  };

  const updateExCartPrice = (barcode, newPrice) => {
    setExCart(prev => ({
      ...prev,
      [barcode]: { ...prev[barcode], price: Math.max(0, Number(newPrice) || 0) }
    }));
  };

  const removeExCartItem = (barcode) => {
    setExCart(prev => {
      const next = { ...prev };
      delete next[barcode];
      return next;
    });
  };

  // Aggregations
  const retTotalVal = useMemo(() => {
    return Object.values(retCart).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
  }, [retCart]);

  const exTotalVal = useMemo(() => {
    return Object.values(exCart).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
  }, [exCart]);

  const retDifferential = exTotalVal - retTotalVal;

  const handleExecutePosReturnExchange = async () => {
    if (!customer?._id) {
      return Swal.fire({
        icon: "warning",
        title: "Customer Required",
        text: "Please select or add a customer first so reward coins/refund records can be assigned to their account!",
      });
    }

    const retItemsList = Object.values(retCart);
    if (retItemsList.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Return Products Required",
        text: "Please scan or add at least one product to the Return Basket!",
      });
    }

    const exItemsList = Object.values(exCart);

    if (retDifferential > 0 && retPaymentMethod === "COINS") {
      if ((customer.coins || 0) < retDifferential) {
        return Swal.fire({
          icon: "error",
          title: "Insufficient Customer Coins",
          text: `Customer has only ${customer.coins || 0} coins, but required differential is ₹${retDifferential}`,
        });
      }
    }

    const confirmRes = await Swal.fire({
      title: "Process Return & Exchange?",
      html: `
        <div style="text-align: left; font-size: 13px;">
          <p style="margin-bottom: 6px;"><strong>Customer:</strong> ${customer.name} (${customer.contact || "No Mobile"})</p>
          <p style="margin-bottom: 4px;"><strong>Returned Items (${retItemsList.length}):</strong></p>
          <ul style="padding-left: 16px; margin-bottom: 8px;">
            ${retItemsList.map(i => `<li>${i.product.title} x${i.qty} = ₹${i.price * i.qty}</li>`).join("")}
          </ul>
          <p style="margin-bottom: 4px;"><strong>Exchange Items (${exItemsList.length}):</strong></p>
          <ul style="padding-left: 16px; margin-bottom: 8px;">
            ${exItemsList.length > 0 ? exItemsList.map(i => `<li>${i.product.title} x${i.qty} = ₹${i.price * i.qty}</li>`).join("") : "<li>None (Pure Return for Coins)</li>"}
          </ul>
          <hr style="margin: 8px 0;" />
          <p style="font-size: 15px; font-weight: bold;">
            ${retDifferential > 0 
              ? (retPaymentMethod === "UDHAR"
                  ? `<span style="color: #dc2626; font-weight: bold;">Added to Udhar Khata: ₹${retDifferential}</span>`
                  : `<span style="color: #16a34a;">Customer Pays Extra: +₹${retDifferential} (${retPaymentMethod})</span>`) 
              : retDifferential < 0 
              ? `<span style="color: #d97706;">Coins Credited: ${Math.abs(retDifferential)} Coins (NO CASH REFUND)</span>`
              : `<span style="color: #2563eb;">Even Exchange (₹0)</span>`
            }
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Confirm & Complete",
      cancelButtonText: "Cancel",
    });

    if (!confirmRes.isConfirmed) return;

    const getProductColorVal = (prod) => {
      const c = prod?.color;
      if (!c) return null;
      if (Array.isArray(c)) return c[0] || null;
      return c;
    };

    setIsProcessingReturn(true);
    try {
      const payload = {
        customerId: customer._id,
        returnedItems: retItemsList.map(i => ({
          productId: i.product._id,
          barcode: i.barcode,
          title: i.product.title,
          price: Number(i.price),
          quantity: Number(i.qty),
          qcStatus: i.qcStatus,
          colorId: getProductColorVal(i.product),
          size: i.product.size || "",
        })),
        exchangeItems: exItemsList.map(i => ({
          productId: i.product._id,
          barcode: i.barcode,
          title: i.product.title,
          price: Number(i.price),
          quantity: Number(i.qty),
          colorId: getProductColorVal(i.product),
          size: i.product.size || "",
        })),
        paymentMethod: retDifferential > 0 ? retPaymentMethod : "NONE",
        paymentDestination: retPaymentDestination,
        note: retNote,
      };

      const res = await axios.post(`${base_url}user/pos/return-exchange`, payload, config);

      if (res.data && res.data.success) {
        if (typeof res.data.customerCoins !== "undefined") {
          setCustomer(prev => ({ ...prev, coins: res.data.customerCoins }));
        }

        const rawPhone = (customer.contact || res.data.customerMobile || "").replace(/\D/g, "");
        const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        const encodedMsg = encodeURIComponent(res.data.whatsappMessage || "");

        Swal.fire({
          icon: "success",
          title: "Return & Exchange Completed!",
          html: `
            <div style="font-size: 14px;">
              <p>Return ID: <strong>${res.data.returnExchange?.returnId}</strong></p>
              ${retDifferential < 0 
                ? `<p style="color: #2563eb; font-weight: bold; margin-top: 6px;">Credited ${Math.abs(retDifferential)} Coins to ${customer.name}!</p>` 
                : retDifferential > 0 
                ? (retPaymentMethod === "UDHAR"
                    ? `<p style="color: #dc2626; font-weight: bold; margin-top: 6px;">🤝 Auto-saved ₹${retDifferential} to Udhar Khata!</p>`
                    : `<p style="color: #16a34a; font-weight: bold; margin-top: 6px;">Collected ₹${retDifferential} via ${retPaymentMethod}</p>`)
                : `<p style="margin-top: 6px;">Even Exchange complete</p>`
              }
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "📱 Send WhatsApp Receipt",
          cancelButtonText: "Done",
          confirmButtonColor: "#25D366",
        }).then((result) => {
          if (result.isConfirmed && cleanPhone && res.data.whatsappMessage) {
            window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, "_blank");
          }
        });

        // Clear Return & Exchange Baskets
        setRetCart({});
        setExCart({});
        setRetBarcode("");
        setExBarcode("");
        setRetNote("");
        setRetPaymentMethod("CASH");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Processing Failed",
        text: err.response?.data?.message || "Failed to process return & exchange",
      });
    } finally {
      setIsProcessingReturn(false);
    }
  };

  /* =========================
     TOTAL CALCULATIONS
     ========================= */
  const grandTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.qty * item.price, 0);
  }, [cart]);

  const totalMrp = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      return sum + item.qty * itemMrp;
    }, 0);
  }, [cart]);

  const productSavings = useMemo(() => {
    return Math.max(0, totalMrp - grandTotal);
  }, [totalMrp, grandTotal]);

  // Tax-included mode: tax is already inside the price, we extract it
  // Tax-excluded mode: tax is added on top of the price
  const cgstAmount = useMemo(() => {
    if (taxIncluded) {
      // Extract: tax = price - price/(1 + rate/100)
      const totalRate = (cgstPercent + sgstPercent) / 100;
      if (totalRate === 0) return 0;
      const baseAmount = grandTotal / (1 + totalRate);
      return (baseAmount * cgstPercent) / 100;
    }
    return (grandTotal * cgstPercent) / 100;
  }, [grandTotal, cgstPercent, sgstPercent, taxIncluded]);

  const sgstAmount = useMemo(() => {
    if (taxIncluded) {
      const totalRate = (cgstPercent + sgstPercent) / 100;
      if (totalRate === 0) return 0;
      const baseAmount = grandTotal / (1 + totalRate);
      return (baseAmount * sgstPercent) / 100;
    }
    return (grandTotal * sgstPercent) / 100;
  }, [grandTotal, sgstPercent, cgstPercent, taxIncluded]);

  const igstAmount = useMemo(() => {
    if (gstType !== "IGST") return 0;
    if (taxIncluded) {
      const totalRate = igstPercent / 100;
      if (totalRate === 0) return 0;
      const baseAmount = grandTotal / (1 + totalRate);
      return baseAmount * totalRate;
    }
    return (grandTotal * igstPercent) / 100;
  }, [grandTotal, igstPercent, gstType, taxIncluded]);

  // Total tax amount (either CGST+SGST or IGST)
  const totalTaxAmount = useMemo(() => {
    return gstType === "IGST" ? igstAmount : cgstAmount + sgstAmount;
  }, [gstType, igstAmount, cgstAmount, sgstAmount]);

  // Active product-level offers from Offer model
  const [activeOffers, setActiveOffers] = useState([]);

  // Compute best Offer-model discount for the current cart
  const offerModelDiscount = useMemo(() => {
    if (!activeOffers.length || !Object.keys(cart).length) return 0;
    let total = 0;
    Object.entries(cart).forEach(([barcode, item]) => {
      let best = 0;
      for (const offer of activeOffers) {
        const appliesToAll = (!offer.applicableProducts?.length && !offer.applicableCategories?.length);
        if (!appliesToAll) continue;
        let saving = 0;
        if (offer.offerType === "FLAT_OFF") {
          saving = Math.min(offer.discountAmount || 0, item.price) * item.qty;
        } else if (offer.offerType === "PERCENT_OFF") {
          saving = (item.price * (offer.discountPercent || 0) / 100) * item.qty;
        } else if (offer.offerType === "BUY_X_FOR_PRICE" && item.qty >= (offer.buyQty || 1)) {
          const sets = Math.floor(item.qty / offer.buyQty);
          const rem = item.qty % offer.buyQty;
          saving = (item.price * item.qty) - (sets * offer.fixedPrice + rem * item.price);
        } else if (offer.offerType === "MIN_QTY_DISCOUNT" && item.qty >= (offer.minQty || 1)) {
          saving = (item.price * (offer.discountPercent || 0) / 100) * item.qty;
        } else if (offer.offerType === "BUY_X_GET_Y_FREE" && item.qty >= (offer.buyQty || 1)) {
          const sets = Math.floor(item.qty / offer.buyQty);
          saving = sets * (offer.getFreeQty || 0) * item.price;
        }
        if (saving > best) best = saving;
      }
      total += best;
    });
    return Math.min(total, grandTotal);
  }, [activeOffers, cart, grandTotal]);

  // Discount is always on grandTotal (subtotal) — clamped so it never exceeds grandTotal
  const discountAmount = useMemo(() => {
    const manualDiscount = discountType === "flat"
      ? flatDiscount
      : (grandTotal * discountPercent) / 100;
    const raw = manualDiscount + appliedOfferAmount + offerModelDiscount;
    return Math.min(raw, grandTotal);
  }, [grandTotal, discountPercent, flatDiscount, discountType, appliedOfferAmount, offerModelDiscount]);

  const coinDiscountAmount = useMemo(() => {
    if (!useCoins || coinAmount <= 0) return 0;
    const amountBeforeCoins = taxIncluded
      ? grandTotal - discountAmount
      : grandTotal + totalTaxAmount - discountAmount;
    const maxCoins = Math.min(customerCoins, Math.floor(Math.max(0, amountBeforeCoins)));
    return Math.min(Math.max(0, coinAmount), maxCoins);
  }, [useCoins, coinAmount, customerCoins, grandTotal, totalTaxAmount, discountAmount, taxIncluded]);

  const totalSavings = useMemo(() => {
    return productSavings + discountAmount + coinDiscountAmount;
  }, [productSavings, discountAmount, coinDiscountAmount]);

  const payableAmount = useMemo(() => {
    const base = taxIncluded
      ? grandTotal - discountAmount - coinDiscountAmount
      : grandTotal + totalTaxAmount - discountAmount - coinDiscountAmount;
    return Math.max(0, Math.round(base * 100) / 100);
  }, [grandTotal, totalTaxAmount, discountAmount, coinDiscountAmount, taxIncluded]);

  // The amount coins are calculated on = final payable (after ALL discounts)
  const coinBaseAmount = payableAmount;

  // Payment received calculations
  const parsedAmountPaid = useMemo(() => {
    if (amountPaid === '') return payableAmount;
    const n = Number(amountPaid);
    return isNaN(n) ? payableAmount : Math.max(0, n);
  }, [amountPaid, payableAmount]);

  const balanceDue = useMemo(() => Math.max(0, Math.round((payableAmount - parsedAmountPaid) * 100) / 100), [payableAmount, parsedAmountPaid]);
  const changeToReturn = useMemo(() => Math.max(0, Math.round((parsedAmountPaid - payableAmount) * 100) / 100), [parsedAmountPaid, payableAmount]);

  // Generate QR code whenever payment method, account type, or payable amount changes
  // Must be AFTER payableAmount is defined
  useEffect(() => {
    const activeUpi = ac === "C" ? upiIdA : upiIdB;
    if (paymentMethod !== "ONLINE" || !activeUpi || payableAmount <= 0) {
      setQrDataUrl("");
      return;
    }
    const upiUrl = `upi://pay?pa=${encodeURIComponent(activeUpi)}&pn=${encodeURIComponent(storeName)}&am=${payableAmount.toFixed(2)}&cu=INR`;
    QRCode.toDataURL(upiUrl, { width: 200, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [paymentMethod, ac, upiIdA, upiIdB, payableAmount, storeName]);

  const itemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const triggerCoinCelebration = (appliedCoins) => {
    if (!appliedCoins || appliedCoins <= 0) return;
    setCelebratedCoins(appliedCoins);
    setShowCoinCelebration(true);

    if (coinCelebrationTimerRef.current) {
      clearTimeout(coinCelebrationTimerRef.current);
    }

    coinCelebrationTimerRef.current = setTimeout(() => {
      setShowCoinCelebration(false);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (coinCelebrationTimerRef.current) {
        clearTimeout(coinCelebrationTimerRef.current);
      }
    };
  }, []);

  /* =========================
     BARCODE HANDLER
     ========================= */
  const handleKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    if (buffer.trim() === "") {
      if (!isProcessingSaleRef.current) {
        await finalizeSale();
      }
      return;
    }

    const barcode = buffer.trim();

    try {
      const product = await fetchProductByBarcode(barcode);

      // Check stock before adding
      const currentQtyInCart = cart[barcode] ? cart[barcode].qty : 0;
      const requestedQty = currentQtyInCart + 1;
      
      const stockInfo = await checkStock(barcode, requestedQty);
      
      if (!stockInfo) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock Check Failed',
          text: 'Unable to verify stock. Please try again.',
          confirmButtonColor: '#d4af37',
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
          width: '280px',
          padding: '8px'
        });
        setBuffer("");
        return;
      }

      if (!stockInfo.isAvailable) {
        // Show smaller and sleeker SweetAlert at top-right
        Swal.fire({
          icon: 'warning',
          title: 'Cannot Add More',
          text: `Only ${stockInfo.availableStock} in stock`,
          confirmButtonColor: '#d4af37',
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
          width: '280px',
          padding: '8px'
        });
        setBuffer("");
        return;
      }

      setCart((prev) => {
        if (prev[barcode]) {
          return {
            ...prev,
            [barcode]: {
              ...prev[barcode],
              qty: prev[barcode].qty + 1,
            },
          };
        }

        return {
          ...prev,
          [barcode]: {
            name: product.title,
            price: product.price,
            mrp: Number(product.mrp) || product.price,
            qty: 1,
            size: product.size || null, // Store size info
            color: product.color || null, // Store color info
            isSizeSpecific: product.isSizeSpecific || false,
            pkey: product.pkey || "",
          },
        };
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Product Not Found',
        text: `Product not found for barcode: ${barcode}`,
        confirmButtonColor: '#1a1a1a'
      });
    }

    setBuffer("");
  };

  /* =========================
     QTY CONTROLS
     ========================= */
  const increaseQty = async (barcode) => {
    // Check stock before increasing
    const currentQty = cart[barcode] ? cart[barcode].qty : 0;
    const requestedQty = currentQty + 1;
    
    const stockInfo = await checkStock(barcode, requestedQty);
    
    if (!stockInfo) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock Check Failed',
        text: 'Unable to verify stock. Please try again.',
        confirmButtonColor: '#d4af37',
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
        width: '280px',
        padding: '8px'
      });
      return;
    }

    if (!stockInfo.isAvailable) {
      // Show smaller and sleeker SweetAlert at top-right
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Add More Product',
        text: `Only ${stockInfo.availableStock} in stock`,
        confirmButtonColor: '#d4af37',
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
        width: '280px',
        padding: '8px'
      });
      return;
    }
    
    setCart((prev) => ({
      ...prev,
      [barcode]: {
        ...prev[barcode],
        qty: prev[barcode].qty + 1,
      },
    }));
  };

  const decreaseQty = (barcode) => {
    setCart((prev) => {
      if (prev[barcode].qty === 1) return prev;
      return {
        ...prev,
        [barcode]: {
          ...prev[barcode],
          qty: prev[barcode].qty - 1,
        },
      };
    });
  };

  const removeItem = (barcode) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[barcode];
      return newCart;
    });
  };

  /* =========================
     GLOBAL SCANNER HANDLER
     ========================= */
  useEffect(() => {
    let scanBuffer = "";
    let scanTimeout = null;

    const isValidChar = (key) => {
      return /^[a-zA-Z0-9\-]$/.test(key);
    };

    const handleScanKeyDown = async (e) => {
      const activeTag = document.activeElement.tagName;

      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

      if (
        e.key === "Shift" ||
        e.key === "Alt" ||
        e.key === "Control" ||
        e.key === "Meta"
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (!scanBuffer) return;

        const barcode = scanBuffer;
        scanBuffer = "";

        try {
          const product = await fetchProductByBarcode(barcode);

          // Check stock before adding
          const currentQtyInCart = cart[barcode] ? cart[barcode].qty : 0;
          const requestedQty = currentQtyInCart + 1;
          
          const stockInfo = await checkStock(barcode, requestedQty);
          
          if (!stockInfo) {
            Swal.fire({
              icon: 'warning',
              title: 'Stock Check Failed',
              text: 'Unable to verify stock. Please try again.',
              confirmButtonColor: '#d4af37',
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false,
              width: '200px',
              padding: '6px 10px'
            });
            return;
          }

          if (!stockInfo.isAvailable) {
            // Show smaller and sleeker SweetAlert at top-right
            Swal.fire({
              icon: 'warning',
              title: '',
              html: `<span class="text-sm font-medium">Only ${stockInfo.availableStock} in stock</span>`,
              confirmButtonColor: '#d4af37',
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false,
              width: '200px',
              padding: '6px 10px'
            });
            return;
          }

          setCart((prev) => {
            if (prev[barcode]) {
              return {
                ...prev,
                [barcode]: {
                  ...prev[barcode],
                  qty: prev[barcode].qty + 1,
                },
              };
            }
            return {
              ...prev,
              [barcode]: {
                name: product.title,
                price: product.price,
                mrp: Number(product.mrp) || product.price,
                qty: 1,
                size: product.size || null,
                color: product.color || null,
                isSizeSpecific: product.isSizeSpecific || false,
                pkey: product.pkey || "",
              },
            };
          });
        } catch {
          Swal.fire({
            icon: 'error',
            title: 'Product Not Found',
            text: `Product not found for barcode: ${barcode}`,
            confirmButtonColor: '#1a1a1a'
          });
        }

        return;
      }

      if (isValidChar(e.key)) {
        scanBuffer += e.key;
      }

      clearTimeout(scanTimeout);
      scanTimeout = setTimeout(() => {
        scanBuffer = "";
      }, 80);
    };

    window.addEventListener("keydown", handleScanKeyDown);
    return () => window.removeEventListener("keydown", handleScanKeyDown);
  }, [cart]);

  // Auto-detect GST type based on customer state vs store state
  useEffect(() => {
    if (!customerState) {
      // No state selected — default to intra-state (CGST+SGST)
      setGstType("CGST_SGST");
      setCgstPercent(defaultCgst);
      setSgstPercent(defaultSgst);
      setIgstPercent(0);
      return;
    }
    if (customerState === defaultStoreState) {
      // Intra-state: CGST + SGST
      setGstType("CGST_SGST");
      setCgstPercent(defaultCgst);
      setSgstPercent(defaultSgst);
      setIgstPercent(0);
    } else {
      // Inter-state: IGST only
      setGstType("IGST");
      setCgstPercent(0);
      setSgstPercent(0);
      setIgstPercent(defaultIgst);
    }
  }, [customerState, defaultStoreState, defaultCgst, defaultSgst, defaultIgst]);

  // Fetch POS consolidated configuration on mount in a single API call
  useEffect(() => {
    const fetchPosConfig = async () => {
      try {
        const res = await axios.get(`${base_url}user/pos-config`, config);
        const data = res.data || {};

        // Active offers
        setActiveOffers(data.activeOffers || []);

        // GSTIN
        setGstin(data.gstin || data.settings?.gstin || "");

        // Rewards coin & referral configs
        if (data.coinConfig) setCoinConfig(data.coinConfig);
        if (data.referralConfig) setReferralConfig(data.referralConfig);

        // Settings & Spin config
        const s = data.settings || {};
        const cgst = s.cgst || 0;
        const sgst = s.sgst || 0;
        const igst = s.igst || 0;
        const sState = s.storeState || "Gujarat";
        setCgstPercent(cgst);
        setSgstPercent(sgst);
        setIgstPercent(igst);
        setDefaultCgst(cgst);
        setDefaultSgst(sgst);
        setDefaultIgst(igst);
        setDefaultStoreState(sState);
        setStoreState(sState);
        setGstType("CGST_SGST");
        setTaxIncluded(s.taxIncluded === true);
        setShowSpinner(data.spinConfig?.isEnabled === true);
        setStoreName(s.storeName || "Yashoda Fashion");
        setStoreTagline(s.storeTagline || "Your One-Stop Shopping Destination");
        setUpiIdA(s.upiIdA || "");
        setUpiIdB(s.upiIdB || "");
      } catch (err) {
        console.error("Failed to fetch POS config:", err);
      }
    };
    fetchPosConfig();
  }, []);

  // Open GSTIN modal
  const openGstinModal = () => {
    setGstinInput(gstin);
    setGstinModalVisible(true);
  };

  // Save GSTIN
  const saveGstin = async () => {
    try {
      const res = await axios.put(`${base_url}user/gstin`, { gstin: gstinInput }, config);
      setGstin(res.data.gstin);
      setGstinModalVisible(false);
    } catch (err) {
      console.error("Failed to save GSTIN:", err);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save GSTIN. Please try again.',
        confirmButtonColor: '#1a1a1a'
      });
    }
  };

  // Fetch customer offer when customer is selected
  const fetchCustomerOffer = async (mobile) => {
    if (!mobile) return;
    try {
      const res = await axios.get(`${base_url}user/customer-offer?mobile=${mobile}`, config);
      setCustomerOffer({
        hasOffer: res.data.hasOffer,
        offerDiscount: res.data.offerDiscount || 0,
        offerType: res.data.offerType || ''
      });
      setCustomerCoins(res.data.coins || 0);
      setAppliedOfferAmount(0);
    } catch (err) {
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: '' });
      setCustomerCoins(0);
      setAppliedOfferAmount(0);
    }
  };

  // Handle use coins toggle
  const handleUseCoinsChange = (checked) => {
    setUseCoins(checked);
    if (!checked) {
      setCoinAmount(0);
      setShowCoinCelebration(false);
    } else {
      const amountBeforeCoins = taxIncluded
        ? grandTotal - discountAmount
        : grandTotal + totalTaxAmount - discountAmount;
      const maxCoins = Math.min(customerCoins, Math.floor(amountBeforeCoins));
      setCoinAmount(maxCoins);
      triggerCoinCelebration(maxCoins);
    }
  };

  const handleCoinAmountChange = (value) => {
    const val = parseInt(value) || 0;
    const amountBeforeCoins = taxIncluded
      ? grandTotal - discountAmount
      : grandTotal + totalTaxAmount - discountAmount;
    const maxCoins = Math.min(customerCoins, Math.floor(amountBeforeCoins));
    setCoinAmount(Math.min(val, maxCoins));
  };

  // Search referrals by name, phone, or referral code
  const searchReferrals = async (query) => {
    if (!query || query.trim().length < 2) {
      setReferralResults([]);
      return;
    }
    try {
      const res = await axios.get(`${base_url}user/search?query=${query}`, config);
      setReferralResults(res.data || []);
    } catch (err) {
      setReferralResults([]);
    }
  };

  const selectReferrer = (user) => {
    setReferrerName(user.firstname + " " + user.lastname);
    setReferrerCode(user.referralCode || "N/A");
    setReferrerError("");
    setReferralSearch(user.mobile);
    setCustomer(prev => ({ ...prev, referralContact: user.mobile, referralCode: user.referralCode || "" }));
    setReferralResults([]);
    setShowReferralDropdown(false);
  };

  const selectCustomerWithReferral = async (user) => {
    try {
      const res = await axios.get(`${base_url}user/${user._id}`, config);
      const fullCustomer = res.data.getaUser;
      const fullName = `${fullCustomer.firstname || user.firstname || ''} ${fullCustomer.lastname || user.lastname || ''}`.trim();
      setCustomer({
        name: fullName,
        address: fullCustomer.address || user.address || '',
        contact: fullCustomer.mobile || user.mobile || '',
        referralContact: '',
        referralCode: '',
      });
      clearReferrer();

      if (fullCustomer.referredBy) {
        const referrer = fullCustomer.referredBy;
        const referrerName = `${referrer.firstname || ''} ${referrer.lastname || ''}`.trim();
        setReferrerName(referrerName || 'Referrer');
        setReferrerCode(referrer.referralCode || 'N/A');
        setReferralSearch(referrer.mobile || '');
        setCustomer(prev => ({ ...prev, referralContact: referrer.mobile || '', referralCode: referrer.referralCode || '' }));
      }
    } catch (err) {
      console.error('Failed to load customer details', err);
      const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
      setCustomer({
        name: fullName,
        address: user.address || '',
        contact: user.mobile || '',
        referralContact: '',
        referralCode: '',
      });
      clearReferrer();
    }
  };

  const clearReferrer = () => {
    setReferrerName("");
    setReferrerCode("");
    setReferrerError("");
    setReferralSearch("");
    setReferralResults([]);
    setCustomer(prev => ({ ...prev, referralContact: "", referralCode: "" }));
  };

  // Clear referral when customer contact changes (to prevent self-referral)
  useEffect(() => {
    if (customer.contact && customer.referralContact) {
      if (customer.contact === customer.referralContact) {
        clearReferrer();
      }
    }
  }, [customer.contact]);

  // Fetch active product-level offers from Offer model (Issue 11)
  // Apply offer to current bill
  const applyOffer = () => {
    if (!customerOffer.hasOffer || grandTotal === 0) return;
    let offerAmt = 0;
    if (customerOffer.offerType === "percentage") {
      offerAmt = (grandTotal * customerOffer.offerDiscount) / 100;
    } else if (customerOffer.offerType === "flat") {
      offerAmt = Math.min(customerOffer.offerDiscount, grandTotal);
    } else if (customerOffer.offerType === "free_product") {
      // Free product — enforce as a flat discount equal to the cheapest item in cart
      const prices = Object.values(cart).map(i => i.price);
      if (!prices.length) return;
      const cheapest = Math.min(...prices);
      offerAmt = cheapest;
      Swal.fire({
        icon: 'success',
        title: 'Free Product Applied!',
        text: `Cheapest item (₹${cheapest.toFixed(2)}) discounted as free product reward.`,
        confirmButtonColor: '#d4af37',
        timer: 2500,
        showConfirmButton: false,
      });
      setAppliedOfferAmount(offerAmt);
      return;
    }
    setAppliedOfferAmount(offerAmt);
    Swal.fire({
      icon: 'success', title: 'Offer Applied!',
      text: `Offer applied: -₹${offerAmt.toFixed(2)}`,
      confirmButtonColor: '#d4af37', timer: 2000, showConfirmButton: false,
    });
  };

  // Remove applied offer
  const removeOffer = () => {
    setAppliedOfferAmount(0);
  };

  // Handle spin wheel result — called ONLY when user clicks "Claim & Continue" or closes after result
  const handleSpinComplete = async (offer) => {
    setShowSpinWheel(false);
    await finalizeSale();
  };

  // Handle complete sale with spin wheel logic
  const handleCompleteSale = () => {
    if (isProcessingSaleRef.current) return;

    // 1. Cart must not be empty
    if (!Object.keys(cart).length) {
      Swal.fire({
        icon: 'warning',
        title: 'Cart is Empty',
        text: 'Please scan or add at least one product before completing the sale.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    // 2. Customer name is required
    if (!customer.name || !customer.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Name Required',
        text: 'Please enter the customer name before completing the sale.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    // 3. Online payment requires UPI ID
    if (paymentMethod === 'ONLINE' && !upiIdA && !upiIdB) {
      Swal.fire({
        icon: 'warning',
        title: 'No UPI ID Configured',
        text: 'Please set a UPI ID in Settings before using Online payment.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    // 4. Amount paid must be valid if entered
    if (amountPaid !== '' && (isNaN(Number(amountPaid)) || Number(amountPaid) < 0)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Amount',
        text: 'Please enter a valid amount received (0 or more).',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    // 5. Payable amount must be > 0
    if (payableAmount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Total',
        text: 'Bill total must be greater than ₹0.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    // Show spin wheel only if enabled AND customer has a contact
    if (showSpinner && customer.contact) {
      setShowSpinWheel(true);
    } else {
      finalizeSale();
    }
  };

  // Quick-add customer modal state
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addCustomerLoading, setAddCustomerLoading] = useState(false);
  const [addCustomerForm] = Form.useForm();

  // Manual product entry modal state
  const [manualProductOpen, setManualProductOpen] = useState(false);
  const [manualProductForm] = Form.useForm();

  const openAddCustomer = () => {
    const nameParts = searchTerm.trim().split(' ').filter(Boolean);
    addCustomerForm.setFieldsValue({
      mobile: contactSearch.trim() || "",
      firstname: nameParts[0] || "",
      lastname: nameParts.slice(1).join(' ') || "",
      email: "",
      address: "",
      referredByMobile: customer.referralContact || "",
    });
    setAddCustomerOpen(true);
  };

  const openManualProductModal = () => {
    manualProductForm.resetFields();
    setManualProductOpen(true);
  };

  const handleAddCustomerSubmit = async (values) => {
    setAddCustomerLoading(true);
    try {
      const res = await axios.post(`${base_url}user/create-customer`, values, config);
      const newUser = res.data;
      await selectCustomerWithReferral({
        _id: newUser._id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        address: newUser.address || '',
        mobile: newUser.mobile || '',
      });
      setContactSearch("");
      setSearchTerm("");
      setContactResults([]);
      setNameResults([]);
      setContactSearchDone(false);
      setNameSearchDone(false);
      setAddCustomerOpen(false);
      addCustomerForm.resetFields();
      fetchCustomerOffer(newUser.mobile);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Could not add customer", confirmButtonColor: "#d4af37" });
    } finally {
      setAddCustomerLoading(false);
    }
  };

  const handleManualProductSubmit = (values) => {
    const barcode = values.barcode?.trim() || `MANUAL-${Date.now()}`;
    const price = Number(values.price) || 0;
    const qty = Number(values.qty || 1);
    const type = values.type || "product"; // "product" or "charge"

    if (!values.name?.trim() || price <= 0 || qty <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid product',
        text: 'Please enter a valid product name, price and quantity.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    const pkey = type === "charge" ? "MANUAL_CHARGE" : "MANUAL";

    setCart((prev) => {
      if (prev[barcode]) {
        return {
          ...prev,
          [barcode]: {
            ...prev[barcode],
            qty: prev[barcode].qty + qty,
          },
        };
      }

      const itemMrp = Number(values.mrp) || price;

      return {
        ...prev,
        [barcode]: {
          name: values.name.trim(),
          price,
          mrp: itemMrp > price ? itemMrp : price,
          qty,
          size: null,
          color: null,
          isSizeSpecific: false,
          pkey,
        },
      };
    });

    setManualProductOpen(false);
    manualProductForm.resetFields();
    setBuffer("");
  };

  // Show + Add button: typed 10 digits, search done, no results, no confirmed customer
  const [contactSearchDone, setContactSearchDone] = useState(false);
  const showAddButton = contactSearch.trim().length >= 10 && contactSearchDone && contactResults.length === 0;

  const [nameSearchDone, setNameSearchDone] = useState(false);
  const showAddButtonByName = searchTerm.trim().length >= 2 && nameSearchDone && nameResults.length === 0;

  // Search by name
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setNameResults([]);
      setNameSearchDone(false);
      return;
    }
    setNameSearchDone(false);
    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(`${base_url}user/search?query=${encodeURIComponent(searchTerm.trim())}`, config);
        setNameResults(res.data || []);
      } catch (err) { console.error(err); }
      finally { setNameSearchDone(true); }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Search by contact
  useEffect(() => {
    if (contactSearch.trim().length < 2) {
      setContactResults([]);
      setContactSearchDone(false);
      return;
    }
    setContactSearchDone(false);
    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(`${base_url}user/search?query=${encodeURIComponent(contactSearch.trim())}`, config);
        setContactResults(res.data || []);
      } catch (err) { console.error(err); }
      finally { setContactSearchDone(true); }
    }, 300);
    return () => clearTimeout(delay);
  }, [contactSearch]);

  // Return & Exchange Customer Search debounce
  useEffect(() => {
    if (retCustSearchInput.trim().length < 2) {
      setRetCustResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${base_url}user/search?query=${encodeURIComponent(retCustSearchInput.trim())}`,
          config
        );
        setRetCustResults(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [retCustSearchInput]);

  // Search referrals with debounce
  useEffect(() => {
    if (!referralSearch.trim()) {
      setReferralResults([]);
      return;
    }
    const delay = setTimeout(() => searchReferrals(referralSearch), 400);
    return () => clearTimeout(delay);
  }, [referralSearch]);

  // Fetch customer offer + coins when customer contact is set
  useEffect(() => {
    if (customer.contact) {
      fetchCustomerOffer(customer.contact); // also sets coins
    } else {
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: '' });
      setCustomerCoins(0);
      setAppliedOfferAmount(0);
      setUseCoins(false);
      setCoinAmount(0);
    }
  }, [customer.contact]);

  /* =========================
     GENERATE WHATSAPP MESSAGE
     ========================= */
  const generateWhatsAppMessage = (activeCart, activeCustomer, activeOffer, activeAppliedAmount, activeWonOffer, coinsEarned = 0, newCoinBalance = 0) => {
    const now = new Date();
    let msg = `🧾 *Bill Receipt - ${storeName}*\n\n`;
    msg += `👤 *${activeCustomer.name || "Walk-in Customer"}*\n`;
    if (activeCustomer.contact) msg += `📞 ${activeCustomer.contact}\n`;
    msg += `📅 ${now.toLocaleDateString('en-GB')} | 🕐 ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    msg += `🛍️ *Items Purchased:*\n`;
    Object.values(activeCart).forEach((item) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      msg += `  • *${item.name}*`;
      if (item.size) msg += ` (${item.size})`;
      if (item.color) msg += ` [${item.color}]`;
      msg += `\n`;
      if (itemMrp > item.price) {
        msg += `    MRP: ~₹${itemMrp.toFixed(2)}~ | Price: ₹${item.price.toFixed(2)} × ${item.qty} = ₹${(item.qty * item.price).toFixed(2)}\n`;
      } else {
        msg += `    Price: ₹${item.price.toFixed(2)} × ${item.qty} = ₹${(item.qty * item.price).toFixed(2)}\n`;
      }
    });

    const activeTotalMrp = Object.values(activeCart).reduce((sum, item) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      return sum + (itemMrp * item.qty);
    }, 0);

    const prodDiscount = Math.max(0, activeTotalMrp - grandTotal);
    const totalSavingsAmt = prodDiscount + discountAmount + coinDiscountAmount;

    msg += `\n━━━━━━━━━━━━━━━\n`;
    if (activeTotalMrp > grandTotal) {
      msg += `Total MRP: ~₹${activeTotalMrp.toFixed(2)}~\n`;
      if (prodDiscount > 0) msg += `Product Discount: -₹${prodDiscount.toFixed(2)}\n`;
      msg += `Subtotal: ₹${grandTotal.toFixed(2)}\n`;
    } else {
      msg += `Subtotal: ₹${grandTotal.toFixed(2)}\n`;
    }

    if (gstType === "IGST" && igstPercent > 0) {
      msg += `IGST (${igstPercent}%): ₹${igstAmount.toFixed(2)}\n`;
    } else {
      if (cgstPercent > 0) msg += `CGST (${cgstPercent}%): ₹${cgstAmount.toFixed(2)}\n`;
      if (sgstPercent > 0) msg += `SGST (${sgstPercent}%): ₹${sgstAmount.toFixed(2)}\n`;
    }
    if (activeAppliedAmount > 0) msg += `🎁 Offer Discount: -₹${activeAppliedAmount.toFixed(2)}\n`;
    if (discountAmount > activeAppliedAmount) msg += `💰 Extra Discount: -₹${(discountAmount - activeAppliedAmount).toFixed(2)}\n`;
    if (coinDiscountAmount > 0) msg += `🪙 Coins Used: -₹${coinDiscountAmount.toFixed(2)} (${coinAmount} coins)\n`;
    msg += `\n*💵 Total Paid: ₹${payableAmount.toFixed(2)}*\n`;

    if (totalSavingsAmt > 0) {
      const savingsPercent = activeTotalMrp > 0 ? Math.round((totalSavingsAmt / activeTotalMrp) * 100) : 0;
      msg += `\n🎉 *YOUR TOTAL SAVINGS: ₹${totalSavingsAmt.toFixed(2)}*${savingsPercent > 0 ? ` (${savingsPercent}% OFF)` : ''}\n`;
      msg += `💥 *આ બિલ પર તમારી કુલ બચત: ₹${totalSavingsAmt.toFixed(2)}*\n`;
    }
    msg += `━━━━━━━━━━━━━━━\n\n`;

    // Coins earned on this purchase
    if (coinsEarned > 0) {
      msg += `🪙 *Coins Earned This Purchase: +${coinsEarned} coins*\n`;
      msg += `💼 *Your Coin Balance: ${newCoinBalance} coins*\n`;
      msg += `✨ You can use these coins as discount on your next purchase!\n`;
      msg += `   (1 coin = ₹1 discount)\n\n`;
      msg += `🔁 *Referral Total Coins: ${newCoinBalance} coins*\n`;
      msg += `💥 આ બિલ પર તમે કમાયા: ${coinsEarned} કોઇન્સ\n\n`;
    } else if (activeCustomer.contact && customerCoins > 0) {
      msg += `🪙 *Your Coin Balance: ${customerCoins} coins*\n`;
      msg += `✨ Use these coins as discount on your next purchase!\n`;
      msg += `   (1 coin = ₹1 discount)\n\n`;
      msg += `🔁 *Referral Total Coins: ${customerCoins} coins*\n\n`;
    }

    msg += `📣 *Referral અને ખરીદી બંને પર coin મેળવો!*\n`;
    msg += `જો તમે કોઈને રેફર કરો તો રેફરલ coin અને તમારા ખરીદી પર પણ coin મળશે.\n`;
    msg += `તમારી આવનારી ખરીદી માટે coin ની બચત કરો અને ડિસ્કાઉન્ટ મેળવો.\n\n`;
    msg += `હવે જોડાઓ અને વધુ ઓફર્સ અને રિવર્ડ્સ મેળવો!\n\n`;

    // Spin wheel offer won
    if (activeWonOffer && activeWonOffer.type !== "none") {
      const offerText = activeWonOffer.type === "percentage"
        ? `${activeWonOffer.value}% OFF`
        : `₹${activeWonOffer.value} FLAT OFF`;
      msg += `🎉 *SPECIAL OFFER FOR NEXT PURCHASE!*\n`;
      msg += `You won: *${offerText}*\n`;
      msg += `Use this offer on your next visit! 🛍️\n\n`;
    }

    msg += `🤝 *Join Our WhatsApp Community:*\nhttps://chat.whatsapp.com/K4Wwm9dv0hj5fkaVUtTJbi\n\n`;
    msg += `📌 *નોંધ:*\n`;
    msg += `• કાપડ અને કલર ની કોઈ ગેરંટી રહેશે નહીં.\n`;
    msg += `• એક વાર બિલ બન્યા પછી વસ્તુ પાછી લેવામાં આવશે નહીં અને બદલી આપવામાં આવશે નહીં.\n\n`;
    msg += `🙏 Thank you for shopping at *${storeName}*!\n`;
    msg += `${storeTagline}`;

    return msg;
  };

  /* =========================
     OPEN WHATSAPP
     ========================= */
  const openWhatsApp = (whatsAppMessage, activeCustomer) => {
    // Encode message for WhatsApp
    const encodedMessage = encodeURIComponent(whatsAppMessage);
    
    // Open WhatsApp with pre-filled message
    const phoneNumber = activeCustomer.contact ? activeCustomer.contact.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = phoneNumber 
      ? `https://wa.me/91${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  /* =========================
     FINALIZE SALE
     ========================= */
  const finalizeSale = async () => {
    if (isProcessingSaleRef.current) return; // Prevent multiple calls using ref

    const items = Object.entries(cart).map(([barcode, data]) => ({
      barcode,
      quantity: data.qty,
      price: data.price,
      name: data.name,
      size: data.size || null,
      color: data.color || null,
      pkey: data.pkey || null,
      manual: String(data.pkey || "").startsWith("MANUAL"),
    }));

    if (!items.length) return;

    // Store cart and customer data BEFORE making API call
    // because we need this data for WhatsApp message after sale is complete
    const cartData = { ...cart };
    const customerData = { ...customer };
    const offerData = { ...customerOffer };
    const appliedAmount = appliedOfferAmount;

    // Additional check: if cart becomes empty during processing, abort
    if (Object.keys(cart).length === 0) return;

    setIsProcessingSale(true); // Set loading state
    isProcessingSaleRef.current = true; // Set ref immediately

    try {
      await axios.post(
        `${base_url}user/offline-order`,
        {
          customer,
          items,
          taxPercent: cgstPercent + sgstPercent + igstPercent,
          discount: discountAmount,
          offerDiscount: appliedOfferAmount + offerModelDiscount,
          total: payableAmount,
          paymentMethod: paymentMethod === "CASH" ? "CASH" : "ONLINE",
          paymentDestination: paymentMethod === "CASH" ? "CASH" : ac === "C" ? "CURRENT_ACCOUNT" : "OTHER_ACCOUNT",
          referralContact: customer.referralContact || null,
          coinsUsed: useCoins ? coinAmount : 0,
          coinAmount: useCoins ? coinDiscountAmount : 0,
          sendReferrerCoins,
          sendBuyerCoins,
          amountPaid: parsedAmountPaid,
          paymentNote: paymentNote || "",
          gstBreakdown: {
            cgst: cgstAmount,
            sgst: sgstAmount,
            igst: igstAmount,
            cgstRate: cgstPercent,
            sgstRate: sgstPercent,
            igstRate: igstPercent,
            gstType,
            taxableAmount: taxIncluded
              ? Math.round((grandTotal / (1 + (gstType === "IGST" ? igstPercent : (cgstPercent + sgstPercent)) / 100)) * 100) / 100
              : grandTotal,
            taxIncluded,
          },
        },
        config
      );

      // If offer was applied, clear it from customer (used)
      if (customer.contact && appliedOfferAmount > 0) {
        try {
          await axios.put(
            `${base_url}user/customer-offer`,
            {
              mobile: customer.contact,
              offerDiscount: 0,
              offerType: ""
            },
            config
          );
        } catch (err) {
          console.error("Failed to clear customer offer:", err);
        }
      }

      // Capture all bill values BEFORE resetting state
      const billCart = { ...cart };
      const billCustomer = { ...customer };
      const billPayable = payableAmount;
      const billGstin = gstin;
      const billCgst = cgstAmount;
      const billSgst = sgstAmount;
      const billIgst = igstAmount;
      const billGstType = gstType;
      const billDiscount = discountAmount;
      const billSubtotal = grandTotal;
      const billCoinDiscount = coinDiscountAmount;
      const billCoinsUsed = coinAmount;
      const billPaymentMethod = paymentMethod;
      const billAc = ac;
      const billPaidAmt = parsedAmountPaid;
      const billBalanceDue = balanceDue;
      const billChangeToReturn = changeToReturn;

      // Fetch updated coin balance to include in WhatsApp message
      let coinsEarned = 0;
      let newCoinBalance = customerCoins;
      if (customerData.contact) {
        try {
          const updatedOffer = await axios.get(`${base_url}user/customer-offer?mobile=${customerData.contact}`, config);
          const updatedCoins = updatedOffer.data.coins || 0;
          coinsEarned = Math.max(0, updatedCoins - (useCoins ? customerCoins - coinAmount : customerCoins));
          newCoinBalance = updatedCoins;
        } catch (_) {}
      }

      // Send WhatsApp message if customer has contact
      if (customerData.contact) {
        const message = generateWhatsAppMessage(cartData, customerData, offerData, appliedAmount, null, coinsEarned, newCoinBalance);
        openWhatsApp(message, customerData);
        Swal.fire({
          icon: 'success',
          title: 'Sale Completed! 🎉',
          text: 'Bill sent to WhatsApp!',
          confirmButtonColor: '#d4af37'
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Sale Completed',
          text: 'SALE COMPLETED SUCCESSFULLY!',
          confirmButtonColor: '#d4af37',
          timer: 1500,
          showConfirmButton: false
        });
      }

      // Auto-print bill with captured snapshot (after state reset is safe)
      await printBill(
        billCart, billCustomer, billPayable, billGstin,
        billCgst, billSgst, billIgst, billGstType,
        billDiscount, billSubtotal, billCoinDiscount, billCoinsUsed,
        billPaymentMethod, billAc, billPaidAmt, billBalanceDue, billChangeToReturn
      );

      setCart({});
      setCustomer({ name: "", address: "", contact: "", referralContact: "", referralCode: "" });
      setCustomerState("Gujarat");
      setSearchTerm("");
      setContactSearch("");
      setNameResults([]);
      setContactResults([]);
      setContactSearchDone(false);
      setNameSearchDone(false);
      setShowDropdown(false);
      setShowContactDropdown(false);
      setReferralSearch("");
      setReferralResults([]);
      setReferrerName("");
      setReferrerError("");
      setReferrerCode("");
      setReferralSearch("");
      setReferralResults([]);
      // Restore tax to saved defaults, NOT to 0
      setCgstPercent(defaultCgst);
      setSgstPercent(defaultSgst);
      setIgstPercent(0);
      setGstType("CGST_SGST");
      setDiscountPercent(0);
      setFlatDiscount(0);
      setAppliedOfferAmount(0);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setUseCoins(false);
      setCoinAmount(0);
      setPaymentMethod("CASH"); // Reset to CASH
      setAc("S"); // Reset account type
      setQrDataUrl(""); // Reset QR
      setAmountPaid(""); // Reset payment received
      setPaymentNote("");
    } catch (err) {
      console.error("Failed to complete sale:", err);
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: 'Failed to complete sale. Please try again.',
        confirmButtonColor: '#1a1a1a'
      });
    } finally {
      setIsProcessingSale(false); // Always reset loading state
      isProcessingSaleRef.current = false; // Always reset ref
    }
  };

  /* =========================
     PRINT BILL
     ========================= */
  const printBill = async (
    cartData = cart,
    customerData = customer,
    payableAmt = payableAmount,
    gstinData = gstin,
    cgstAmt = cgstAmount,
    sgstAmt = sgstAmount,
    igstAmt = igstAmount,
    gstTypeData = gstType,
    discountAmt = discountAmount,
    subtotalAmt = grandTotal,
    coinDiscountAmt = coinDiscountAmount,
    coinsUsedAmt = coinAmount,
    activePaymentMethod = paymentMethod,
    activeAc = ac,
    paidAmt = parsedAmountPaid,
    balAmt = balanceDue,
    changeAmt = changeToReturn
  ) => {
    const activeCart = cartData;
    const activeCustomer = customerData;
    const activePayable = payableAmt;
    const activeGstin = gstinData;
    const activeCgst = cgstAmt;
    const activeSgst = sgstAmt;
    const activeIgst = igstAmt;
    const activeGstType = gstTypeData;
    const activeDiscount = discountAmt;
    const activeSubtotal = subtotalAmt;
    const activeCoinDiscount = coinDiscountAmt;
    const activeCoinsUsed = coinsUsedAmt || coinDiscountAmt;

    if (!Object.keys(activeCart).length) {
      Swal.fire({ icon: 'warning', title: 'Cart is Empty', text: 'Please add items to the cart before printing.', confirmButtonColor: '#d4af37' });
      return;
    }

    const invoiceNo = (() => {
      const d = new Date();
      const r = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `INV-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}-${r}`;
    })();

    const payLabel = activePaymentMethod === "CASH"
      ? "💵 Cash"
      : activeAc === "C"
      ? "💳 Online (Account A)"
      : "🏦 Online (Account B)";

    const payColor = activePaymentMethod === "CASH"
      ? "#d97706"
      : activeAc === "C"
      ? "#059669"
      : "#7c3aed";

    const paymentSummaryRows = (() => {
      const rows = [];
      if (paidAmt < payableAmt) {
        rows.push(`<tr class="s-row"><td>Paid Now</td><td style="text-align:right;color:#059669;font-weight:700">Rs.${paidAmt.toFixed(2)}</td></tr>`);
        rows.push(`<tr class="s-row" style="background:#fff0f0"><td style="color:#dc2626;font-weight:700">Balance Due (Udhar)</td><td style="text-align:right;color:#dc2626;font-weight:700">Rs.${balAmt.toFixed(2)}</td></tr>`);
      } else if (changeAmt > 0) {
        rows.push(`<tr class="s-row"><td>Received</td><td style="text-align:right">Rs.${paidAmt.toFixed(2)}</td></tr>`);
        rows.push(`<tr class="s-row" style="background:#f0fff4"><td style="color:#059669;font-weight:700">Return Change</td><td style="text-align:right;color:#059669;font-weight:700">Rs.${changeAmt.toFixed(2)}</td></tr>`);
      }
      return rows.join("");
    })();

    // Generate QR BEFORE opening window to avoid delay
    let printQrDataUrl = "";
    const activeUpi = activeAc === "C" ? upiIdA : upiIdB;
    if (activePaymentMethod === "ONLINE" && activeUpi && payableAmt > 0) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(activeUpi)}&pn=${encodeURIComponent(storeName)}&am=${payableAmt.toFixed(2)}&cu=INR`;
      try { printQrDataUrl = await QRCode.toDataURL(upiUrl, { width: 160, margin: 1 }); } catch (_) {}
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const gstTotal = activeCgst + activeSgst + activeIgst;

    const activeTotalMrp = Object.values(activeCart).reduce((sum, item) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      return sum + (itemMrp * item.qty);
    }, 0);
    const printProdSavings = Math.max(0, activeTotalMrp - activeSubtotal);
    const printTotalSavings = printProdSavings + activeDiscount + activeCoinDiscount;

    const itemRows = Object.values(activeCart).map((item, i) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      const mrpHtml = itemMrp > item.price ? `<br><span class="item-meta">MRP: <span style="text-decoration:line-through">Rs.${itemMrp.toFixed(2)}</span></span>` : '';
      return `<tr>
        <td>${i+1}</td>
        <td class="item-name">${item.name}${item.size ? `<br><span class="item-meta">Size: ${item.size}</span>` : ''}${item.color ? `<span class="item-meta"> | Color: ${item.color}</span>` : ''}${mrpHtml}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${item.price.toFixed(2)}</td>
        <td style="text-align:right;font-weight:700">${(item.qty * item.price).toFixed(2)}</td>
      </tr>`;
    }).join("");

    const gstRows = gstTotal > 0
      ? (activeGstType === "IGST"
        ? `<tr class="s-row gst"><td>IGST (${igstPercent}%) incl.</td><td style="text-align:right">${activeIgst.toFixed(2)}</td></tr>`
        : `<tr class="s-row gst"><td>CGST (${cgstPercent}%) incl.</td><td style="text-align:right">${activeCgst.toFixed(2)}</td></tr><tr class="s-row gst"><td>SGST (${sgstPercent}%) incl.</td><td style="text-align:right">${activeSgst.toFixed(2)}</td></tr>`)
      : "";

    const discountRows = [
      activeDiscount > 0 ? `<tr class="s-row disc"><td>Discount</td><td style="text-align:right">-${activeDiscount.toFixed(2)}</td></tr>` : "",
      activeCoinDiscount > 0 ? `<tr class="s-row coin"><td>Coins (${activeCoinsUsed})</td><td style="text-align:right">-${activeCoinDiscount.toFixed(2)}</td></tr>` : "",
    ].join("");

    const totalMrpRow = activeTotalMrp > activeSubtotal
      ? `<tr class="s-row"><td>Total MRP</td><td style="text-align:right;text-decoration:line-through">Rs.${activeTotalMrp.toFixed(2)}</td></tr>`
      : "";

    const savingsRow = printTotalSavings > 0
      ? `<tr class="s-row" style="background:#f0fff4"><td style="color:#059669;font-weight:700">YOUR TOTAL SAVINGS</td><td style="text-align:right;color:#059669;font-weight:700">Rs.${printTotalSavings.toFixed(2)}</td></tr>`
      : "";

    win.document.write(`<!DOCTYPE html><html><head><title>Bill #${invoiceNo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;background:#fff;display:flex;justify-content:center;padding:20px 8px}
.receipt{width:320px;background:#fff}
.center{text-align:center}
.store-name{font-size:18px;font-weight:900;letter-spacing:1px}
.store-info{font-size:11px;color:#444;margin-top:3px;line-height:1.5}
.divider{border:none;border-top:1px dashed #999;margin:10px 0}
.inv-row{display:flex;justify-content:space-between;font-size:11px;color:#555;margin:2px 0}
.cust-block{background:#f9f9f9;border:1px solid #e5e5e5;padding:8px 10px;margin:8px 0;font-size:12px}
.cust-name{font-weight:700;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{border-bottom:1px solid #333}
thead th{padding:5px 4px;font-size:10px;font-weight:700;text-transform:uppercase}
tbody tr{border-bottom:1px dotted #ddd}
tbody td{padding:6px 4px;vertical-align:top}
.item-name{font-weight:700;font-size:12px}
.item-meta{font-size:10px;color:#666}
.s-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}
.s-row td{padding:3px 4px}
.s-row.disc td{color:#b12704}
.s-row.gst td{color:#007600}
.s-row.coin td{color:#7c3aed}
.total-row{border-top:2px solid #111;margin-top:6px}
.total-row td{padding:8px 4px;font-size:16px;font-weight:900}
.pay-badge{display:inline-block;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;margin-top:6px}
.footer-msg{font-size:12px;font-weight:700;margin-top:4px}
.footer-note{font-size:10px;color:#777;margin-top:2px}
.qr-block{margin-top:10px;padding-top:10px;border-top:1px dashed #999}
.no-print{padding:12px;text-align:center;margin-top:8px}
@media print{body{padding:0}.receipt{width:100%}.no-print{display:none}}
</style></head><body>
<div class="receipt">
  <div class="center">
    <div class="store-name">${storeName}</div>
    <div class="store-info">${storeTagline}</div>
    ${activeGstin ? `<div class="store-info" style="font-family:monospace">GSTIN: ${activeGstin}</div>` : ""}
  </div>

  <hr class="divider">

  <div class="inv-row"><span>Invoice #${invoiceNo}</span><span>${dateStr}</span></div>
  <div class="inv-row"><span>POS Sale</span><span>${timeStr}</span></div>

  <div class="cust-block">
    <div class="cust-name">${activeCustomer.name || "Walk-in Customer"}</div>
    ${activeCustomer.contact ? `<div style="font-size:11px;color:#555">${activeCustomer.contact}</div>` : ""}
  </div>

  <hr class="divider">

  <table>
    <thead><tr>
      <th style="text-align:left;width:28px">#</th>
      <th style="text-align:left">Item</th>
      <th style="text-align:center;width:30px">Qty</th>
      <th style="text-align:right;width:52px">Rate</th>
      <th style="text-align:right;width:58px">Amt</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider">

  <table class="s-table">
    ${totalMrpRow}
    <tr><td>Subtotal</td><td style="text-align:right">${activeSubtotal.toFixed(2)}</td></tr>
    ${discountRows}
    ${gstRows}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">Rs.${activePayable.toFixed(2)}</td></tr>
    ${savingsRow}
    ${paymentSummaryRows}
  </table>

  <hr class="divider">

  <div class="center">
    <span class="pay-badge" style="background:${activePaymentMethod==='CASH'?'#fef3c7;color:#92400e':'#eff6ff;color:#1e40af'}">
      ${activePaymentMethod === "CASH" ? "CASH" : activeAc === "C" ? "ONLINE - A/C A" : "ONLINE - A/C B"}
    </span>
    ${printQrDataUrl ? `
    <div class="qr-block">
      <div style="font-size:11px;font-weight:700;margin-bottom:6px">Scan to Pay - Rs.${payableAmt.toFixed(2)}</div>
      <img src="${printQrDataUrl}" alt="UPI QR" style="width:130px;height:130px;display:block;margin:0 auto" />
      <div style="font-size:10px;color:#777;margin-top:4px">${activeUpi}</div>
    </div>` : ""}
  </div>

  <hr class="divider">

  <div class="center">
    <div class="footer-msg">Thank You! Visit Again</div>
    <div class="footer-note">Computer-generated bill</div>
  </div>

  <div class="no-print">
    <button onclick="window.print()" style="background:#111;color:#fff;border:none;padding:9px 28px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:sans-serif">Print Bill</button>
  </div>
</div>
</body></html>`);

    win.document.close();
    win.print();
  };

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-3 md:p-6">
      {/* POS MODE SWITCH HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-md border border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPosTabMode("BILLING")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              posTabMode === "BILLING"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaShoppingCart /> POS Billing Mode
          </button>
          <button
            type="button"
            onClick={() => setPosTabMode("RETURN_EXCHANGE")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              posTabMode === "RETURN_EXCHANGE"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaSync className={posTabMode === "RETURN_EXCHANGE" ? "animate-spin" : ""} /> Return & Exchange Tab
          </button>
        </div>

        <div className="flex items-center gap-4">
          {customer?._id && (
            <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200">
              <FaCoins className="text-amber-500" />
              <span className="text-xs font-bold text-amber-900">
                {customer.name}: {customer.coins || 0} Reward Coins
              </span>
            </div>
          )}
          <span className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl">
            Store: {storeName}
          </span>
        </div>
      </div>

      {posTabMode === "RETURN_EXCHANGE" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT 2/3 COLUMN: RETURN & EXCHANGE SCANNING */}
          <div className="xl:col-span-2 space-y-6">

            {/* CUSTOMER SELECTION CARD WITH AUTO-SUGGESTIONS */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FaUser className="text-amber-600" />
                Select Customer (Required for Bill Verification & Coins)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Auto-Suggest Input */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Search Customer by Name or Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaSearch className="absolute left-3 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-sm font-medium"
                      value={retCustSearchInput}
                      placeholder="Type mobile number or name..."
                      onChange={(e) => {
                        const val = e.target.value;
                        setRetCustSearchInput(val);
                        setShowRetCustDropdown(true);
                      }}
                      onFocus={() => {
                        if (retCustSearchInput.trim()) setShowRetCustDropdown(true);
                      }}
                    />
                  </div>
                  {/* Dropdown Auto-Suggestions */}
                  {showRetCustDropdown && retCustResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {retCustResults.map((cust) => {
                        const fullName = `${cust.firstname || ""} ${cust.lastname || ""}`.trim() || cust.mobile;
                        return (
                          <div
                            key={cust._id}
                            className="p-3 hover:bg-amber-50 cursor-pointer transition-colors flex items-center justify-between"
                            onClick={async () => {
                              const newCustObj = {
                                _id: cust._id,
                                name: fullName,
                                contact: cust.mobile,
                                coins: cust.coins || 0,
                              };
                              setCustomer(newCustObj);
                              setRetCustSearchInput(`${fullName} (${cust.mobile})`);
                              setShowRetCustDropdown(false);

                              // Re-verify returned products if already scanned
                              if (Object.keys(retCart).length > 0) {
                                for (const b of Object.keys(retCart)) {
                                  const item = retCart[b];
                                  if (item?.product?._id) {
                                    try {
                                      const verRes = await axios.post(
                                        `${base_url}user/pos/verify-return-product`,
                                        { customerId: newCustObj._id, barcode: b, productId: item.product._id },
                                        config
                                      );
                                      if (verRes?.data) {
                                        setRetCart(prev => ({
                                          ...prev,
                                          [b]: {
                                            ...prev[b],
                                            purchaseVerification: verRes.data,
                                            price: verRes.data.pricePaid || prev[b].price,
                                          }
                                        }));
                                      }
                                    } catch (err) { console.error(err); }
                                  }
                                }
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                                {fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{fullName}</p>
                                <p className="text-xs text-gray-500">📱 {cust.mobile}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg">
                              🪙 {cust.coins || 0} Coins
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Customer Details */}
                {customer?._id ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-900">{customer.name}</p>
                      <p className="text-xs text-amber-700">📱 {customer.contact}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold block text-amber-800">Wallet Balance</span>
                      <span className="text-base font-extrabold text-amber-900">🪙 {customer.coins || 0} Coins</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center text-xs text-gray-500">
                    ⚠️ Type above to select customer
                  </div>
                )}
              </div>
            </div>

            {/* STEP 1: RETURN PRODUCTS BASKET */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <div className="flex items-center justify-between border-b border-red-50 pb-3 mb-4">
                <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                  <FaUndo className="text-red-500" /> Step 1: Scan Return Product Barcodes
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                  {Object.keys(retCart).length} RETURN ITEMS
                </span>
              </div>

              {/* Barcode Search Row */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <FaBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-red-500 outline-none text-sm font-mono"
                    placeholder="Scan returned item barcode or enter..."
                    value={retBarcode}
                    onChange={(e) => setRetBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddReturnProductByBarcode(e.target.value);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddReturnProductByBarcode()}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <FaPlus /> Add Return Item
                </button>
              </div>

              {/* Return Cart Items Table */}
              {Object.keys(retCart).length > 0 ? (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-red-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-red-50/70 text-red-900 font-bold border-b border-red-100">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Barcode</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-center">QC Status</th>
                          <th className="p-3 text-right">Agreed Price (₹)</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {Object.entries(retCart).map(([b, item]) => (
                          <tr key={b} className="hover:bg-red-50/30">
                            <td className="p-3 font-bold text-gray-900">{item.product.title}</td>
                            <td className="p-3 font-mono text-gray-500">{b}</td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateRetCartQty(b, item.qty - 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                                >
                                  -
                                </button>
                                <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateRetCartQty(b, item.qty + 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <select
                                className="py-1 px-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg outline-none"
                                value={item.qcStatus}
                                onChange={(e) => updateRetCartQc(b, e.target.value)}
                              >
                                <option value="RESELLABLE">🟢 Resellable (+stock)</option>
                                <option value="DAMAGED">🔴 Damaged</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                className="w-24 text-right font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-red-500"
                                value={item.price}
                                onChange={(e) => updateRetCartPrice(b, e.target.value)}
                              />
                            </td>
                            <td className="p-3 text-right font-extrabold text-red-600">
                              - ₹{(item.price * item.qty).toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeRetCartItem(b)}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Per-item Purchase Verifications */}
                  {Object.values(retCart).map((item) => (
                    item.purchaseVerification && (
                      <div key={item.barcode} className={`p-3 rounded-xl border text-xs ${
                        item.purchaseVerification.isPurchased
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-amber-50 border-amber-300 text-amber-900"
                      }`}>
                        {item.purchaseVerification.isPurchased ? (
                          <div className="flex items-center justify-between font-medium">
                            <span>✅ <strong>{item.product.title} ({item.barcode}):</strong> {item.purchaseVerification.message}</span>
                            <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs font-mono font-bold">
                              {item.purchaseVerification.recencyText}
                            </span>
                          </div>
                        ) : (
                          <span>⚠️ <strong>{item.product.title} ({item.barcode}):</strong> Customer has no purchase record for this item.</span>
                        )}
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                  Scan barcode of returned products to add them to Return Basket
                </div>
              )}
            </div>

            {/* STEP 2: EXCHANGE PRODUCTS BASKET */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
              <div className="flex items-center justify-between border-b border-green-50 pb-3 mb-4">
                <h3 className="text-base font-bold text-green-700 flex items-center gap-2">
                  <FaExchangeAlt className="text-green-500" /> Step 2: Scan Exchange Product Barcodes (Optional)
                </h3>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                  {Object.keys(exCart).length} NEW ITEMS
                </span>
              </div>

              {/* Barcode Search Row */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <FaBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 outline-none text-sm font-mono"
                    placeholder="Scan exchange item barcode or enter..."
                    value={exBarcode}
                    onChange={(e) => setExBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddExchangeProductByBarcode(e.target.value);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddExchangeProductByBarcode()}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <FaPlus /> Add Exchange Item
                </button>
              </div>

              {/* Exchange Cart Items Table */}
              {Object.keys(exCart).length > 0 ? (
                <div className="overflow-x-auto border border-green-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-green-50/70 text-green-900 font-bold border-b border-green-100">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Barcode</th>
                        <th className="p-3 text-center">Stock</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price (₹)</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {Object.entries(exCart).map(([b, item]) => (
                        <tr key={b} className="hover:bg-green-50/30">
                          <td className="p-3 font-bold text-gray-900">{item.product.title}</td>
                          <td className="p-3 font-mono text-gray-500">{b}</td>
                          <td className="p-3 text-center text-xs font-bold text-gray-600">{item.product.quantity}</td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-white">
                              <button
                                type="button"
                                onClick={() => updateExCartQty(b, item.qty - 1)}
                                className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateExCartQty(b, item.qty + 1)}
                                className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              className="w-24 text-right font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-green-500"
                              value={item.price}
                              onChange={(e) => updateExCartPrice(b, e.target.value)}
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold text-green-600">
                            + ₹{(item.price * item.qty).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeExCartItem(b)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                  Scan barcode of exchange products to add them to Exchange Basket (Leave empty for pure return)
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 1/3 COLUMN: SUMMARY & SETTLEMENT PANEL */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <FaCoins className="text-amber-500" /> Exchange Settlement Summary
              </h3>

              {/* Calculation Breakdown */}
              <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Returned Product Value:</span>
                  <span className="font-bold text-red-600">- ₹{retTotalVal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New Product Value:</span>
                  <span className="font-bold text-green-600">+ ₹{exTotalVal}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between items-center text-base font-extrabold">
                  <span>Net Differential:</span>
                  <span className={retDifferential > 0 ? "text-green-600" : retDifferential < 0 ? "text-amber-600" : "text-blue-600"}>
                    {retDifferential > 0 ? `+ ₹${retDifferential}` : retDifferential < 0 ? `- ₹${Math.abs(retDifferential)}` : "₹0"}
                  </span>
                </div>
              </div>

              {/* Action & Policy Box */}
              <div className={`p-4 rounded-xl mb-6 text-xs font-semibold ${
                retDifferential > 0 
                  ? "bg-green-50 border border-green-200 text-green-800" 
                  : retDifferential < 0 
                  ? "bg-amber-50 border border-amber-200 text-amber-900" 
                  : "bg-blue-50 border border-blue-200 text-blue-800"
              }`}>
                {retDifferential > 0 ? (
                  <div>
                    <p className="font-bold text-sm mb-1">💵 Customer Pays Extra (+₹{retDifferential})</p>
                    <p>Customer selected a higher value item. Collect ₹{retDifferential} extra money or use existing reward coins.</p>
                  </div>
                ) : retDifferential < 0 ? (
                  <div>
                    <p className="font-bold text-sm mb-1">🪙 Reward Coins Credit ({Math.abs(retDifferential)} Coins)</p>
                    <p>🚫 <strong>Strict No Cash Refund Policy!</strong> {Math.abs(retDifferential)} reward coins will be credited to customer's wallet balance.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm mb-1">⚖️ Even Exchange (₹0)</p>
                    <p>Equal value product exchange. Stock will be adjusted automatically.</p>
                  </div>
                )}
              </div>

              {/* Payment selector for Extra Amount */}
              {retDifferential > 0 && (
                <div className="space-y-3 mb-6">
                  <label className="block text-xs font-bold text-gray-700">Select Extra Payment Method (+₹{retDifferential})</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setRetPaymentMethod("CASH")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                        retPaymentMethod === "CASH" ? "bg-green-600 text-white border-green-600 shadow-md" : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setRetPaymentMethod("ONLINE")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                        retPaymentMethod === "ONLINE" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      💳 Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setRetPaymentMethod("COINS")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                        retPaymentMethod === "COINS" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      🪙 Coins
                    </button>
                    <button
                      type="button"
                      onClick={() => setRetPaymentMethod("UDHAR")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                        retPaymentMethod === "UDHAR" ? "bg-red-600 text-white border-red-600 shadow-md animate-pulse" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-red-50"
                      }`}
                    >
                      🤝 Udhar
                    </button>
                  </div>
                  {retPaymentMethod === "UDHAR" && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg py-1.5 px-3 flex items-center gap-1.5">
                      <span>🤝</span> ₹{retDifferential} balance will be auto-saved to Udhar Khata for {customer?.name || "Customer"}
                    </p>
                  )}
                </div>
              )}

              {/* Note / Reason input */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 mb-1">Exchange Reason / Note</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-amber-500"
                  placeholder="e.g. Size issue / Product swap"
                  value={retNote}
                  onChange={(e) => setRetNote(e.target.value)}
                />
              </div>

              {/* Submit Exchange Button */}
              <button
                type="button"
                disabled={isProcessingReturn || Object.keys(retCart).length === 0 || !customer?._id}
                onClick={handleExecutePosReturnExchange}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-amber-200 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingReturn ? (
                  "Processing Exchange..."
                ) : (
                  <>
                    <FaCheckCircle /> Complete Return & Exchange
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN CONTENT GRID */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN - 2/3 */}
        <div className="xl:col-span-2 space-y-6">
          {/* CUSTOMER DETAILS CARD */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaUser className="text-indigo-600" />
                Customer Details
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all ${
                          !customer.name.trim() && Object.keys(cart).length > 0
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                        }`}
                        value={customer.name}
                        placeholder="Type 2+ chars to search..."
                        autoComplete="off"
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomer(prev => ({ ...prev, name: value }));
                          setSearchTerm(value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => { if (searchTerm.trim()) setShowDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      />
                    </div>
                    {showAddButtonByName && (
                      <button
                        type="button"
                        onClick={openAddCustomer}
                        className="flex items-center gap-1.5 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all whitespace-nowrap shadow-md"
                      >
                        <FaUserPlus size={12} /> Add
                      </button>
                    )}
                  </div>
                  {showDropdown && nameResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto mt-1" style={{zIndex:9999}}>
                      {nameResults.map((cust) => (
                        <div
                          key={cust._id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={async () => {
                            await selectCustomerWithReferral(cust);
                            setShowDropdown(false);
                            setShowContactDropdown(false);
                          }}
                        >
                          <div className="font-semibold text-gray-800">{cust.firstname} {cust.lastname}</div>
                          <div className="text-xs text-gray-500 mt-0.5">📞 {cust.mobile}{cust.address ? ` · ${cust.address}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAddButtonByName && (
                    <p className="text-xs text-blue-500 mt-1">No customer found — click <b>Add</b> to register</p>
                  )}
                </div>

                {/* Contact */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Contact Number
                  </label>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        value={customer.contact}
                        placeholder="Type 2+ digits to search..."
                        autoComplete="off"
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomer(prev => ({ ...prev, contact: value }));
                          setContactSearch(value);
                          setShowContactDropdown(true);
                        }}
                        onFocus={() => { if (contactSearch.trim()) setShowContactDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                      />
                    </div>
                    {showAddButton && (
                      <button
                        type="button"
                        onClick={openAddCustomer}
                        className="flex items-center gap-1.5 px-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all whitespace-nowrap shadow-md"
                      >
                        <FaUserPlus size={12} /> Add
                      </button>
                    )}
                  </div>
                  {showContactDropdown && contactResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto mt-1" style={{zIndex:9999}}>
                      {contactResults.map((cust) => (
                        <div
                          key={cust._id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={async () => {
                            await selectCustomerWithReferral(cust);
                            setSearchTerm('');
                            setContactSearch('');
                            setNameResults([]);
                            setContactResults([]);
                            setContactSearchDone(false);
                            setShowDropdown(false);
                            setShowContactDropdown(false);
                          }}
                        >
                          <div className="font-semibold text-gray-800">📞 {cust.mobile}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{cust.firstname} {cust.lastname}{cust.address ? ` · ${cust.address}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAddButton && (
                    <p className="text-xs text-indigo-500 mt-1">No customer found — click <b>Add</b> to register</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      value={customer.address}
                      placeholder="Enter address..."
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
                  </div>
                </div>

                {/* Customer State for GST */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Customer State <span className="text-indigo-500">(for GST calculation)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      className="flex-1 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                      value={customerState}
                      onChange={(e) => setCustomerState(e.target.value)}
                    >
                      <option value="">-- Select State --</option>
                      <option value="Gujarat">Gujarat</option>
                      {["Maharashtra","Delhi","Karnataka","Tamil Nadu","Rajasthan","Uttar Pradesh","West Bengal","Telangana","Punjab","Madhya Pradesh","Bihar","Haryana","Odisha","Kerala","Andhra Pradesh","Assam","Chhattisgarh","Goa","Himachal Pradesh","Jharkhand","Jammu & Kashmir","Uttarakhand"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      gstType === "IGST" ? "bg-orange-100 text-orange-700 border border-orange-300" :
                      gstType === "CGST_SGST" ? "bg-green-100 text-green-700 border border-green-300" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {gstType === "IGST" ? `IGST ${igstPercent}%` :
                       gstType === "CGST_SGST" ? `CGST ${cgstPercent}% + SGST ${sgstPercent}%` :
                       "No Tax"}
                    </div>
                  </div>
                  {customerState && customerState !== defaultStoreState && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ Inter-state order → IGST {igstPercent}% applied</p>
                  )}
                  {customerState && customerState === defaultStoreState && (
                    <p className="text-xs text-green-600 mt-1">✅ Intra-state order → CGST {cgstPercent}% + SGST {sgstPercent}% applied</p>
                  )}
                </div>

                {/* Referral Section */}
                <div className="md:col-span-2 mt-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Referrer &nbsp;<span className="text-indigo-400 font-normal">(search by name, phone or code)</span>
                  </label>
                  <div className="flex gap-3 items-start">

                    {/* Search Input + Dropdown */}
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                      <input
                        className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                        value={referralSearch}
                        placeholder="Search referrer..."
                        onChange={(e) => {
                          setReferralSearch(e.target.value);
                          setShowReferralDropdown(true);
                          if (!e.target.value) clearReferrer();
                        }}
                        onFocus={() => referralSearch && setShowReferralDropdown(true)}
                        onBlur={() => setTimeout(() => setShowReferralDropdown(false), 150)}
                      />
                      {referrerName && (
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 text-gray-500 text-xs"
                          onMouseDown={(e) => { e.preventDefault(); clearReferrer(); }}
                        >✕</button>
                      )}
                      {showReferralDropdown && referralResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-44 overflow-y-auto mt-1" style={{zIndex:9999}}>
                          {referralResults
                            .filter(u => u.mobile !== customer.contact)
                            .map(u => (
                              <div
                                key={u._id}
                                className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                onMouseDown={(e) => { e.preventDefault(); selectReferrer(u); }}
                              >
                                <div className="font-medium text-gray-800 text-sm">{u.firstname} {u.lastname}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">{u.mobile}</span>
                                  {u.referralCode && (
                                    <span className="text-xs text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{u.referralCode}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Referrer Info Badge */}
                    {referrerName ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl min-w-0 flex-shrink-0 max-w-[220px]">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FaUser className="text-green-600 text-xs" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-green-700 truncate leading-tight">{referrerName}</p>
                          <p className="text-xs text-green-500 truncate leading-tight">{customer.referralContact}</p>
                          {referrerCode && referrerCode !== "N/A" && (
                            <span className="inline-block text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded mt-0.5">{referrerCode}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex-shrink-0">
                        <FaUser className="text-gray-300 text-sm" />
                        <span className="text-xs text-gray-400 whitespace-nowrap">No referrer</span>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* SCANNER INPUT */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <FaBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/70" />
                  <input
                    ref={scannerRef}
                    className="w-full pl-14 pr-4 py-4 bg-white/20 backdrop-blur border-2 border-white/30 rounded-xl text-white placeholder-white/70 text-lg focus:bg-white/30 focus:border-white outline-none transition-all"
                    value={buffer}
                    onChange={(e) => setBuffer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scan barcode or type manually..."
                    autoFocus
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm">Press Enter to add item</p>
                <p className="text-white/60 text-xs mt-1">Leave empty & press Enter to complete sale</p>
                <button
                  type="button"
                  onClick={openManualProductModal}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  <FaPlus className="text-sm" /> Add product manually
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCTS TABLE */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaShoppingCart className="text-indigo-600" />
                Cart Items
              </h2>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Barcode</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(cart).map(([barcode, item], i) => (
                    <tr key={barcode} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">
                          {item.name}
                          {item.pkey === "MANUAL_CHARGE" ? (
                            <span className="ml-2 inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Extra</span>
                          ) : null}
                        </div>
                        {item.color && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Color: {item.color}
                          </div>
                        )}
                        {item.size && (
                          <div className="text-xs text-indigo-600 font-medium mt-1">
                            Size: {item.size}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                          {barcode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.mrp && item.mrp > item.price && (
                          <div className="text-xs text-gray-400 line-through">
                            ₹{item.mrp.toFixed(2)}
                          </div>
                        )}
                        <div className="font-medium text-gray-700">
                          ₹{item.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="w-8 h-8 border-2 border-gray-200 rounded-full hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center transition-all"
                            onClick={() => decreaseQty(barcode)}
                          >
                            <FaMinus className="text-xs" />
                          </button>
                          <span className="w-12 text-center font-semibold text-gray-800">
                            {item.qty}
                          </span>
                          <button
                            className="w-8 h-8 border-2 border-gray-200 rounded-full hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center transition-all"
                            onClick={() => increaseQty(barcode)}
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">
                        ₹{(item.qty * item.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                          onClick={() => removeItem(barcode)}
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!Object.keys(cart).length && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <FaBarcode className="text-3xl text-gray-400" />
                          </div>
                          <p className="text-gray-500">Scan items to start billing</p>
                          <p className="text-gray-400 text-sm">Use barcode scanner or type manually</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - 1/3 */}
        <div className="space-y-6">
          {/* BILL SUMMARY */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-2xl shadow-2xl text-white overflow-hidden">
            <div className="bg-white/10 backdrop-blur px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaRupeeSign className="text-amber-400" />
                Bill Summary
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-indigo-200">Subtotal</span>
                <span className="font-semibold text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>

             

              {/* Discount */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-indigo-200">Discount</span>
                  <span className="font-semibold text-green-400">-₹{discountAmount.toFixed(2)}</span>
                </div>
                {/* Toggle */}
                <div className="flex rounded-lg overflow-hidden border border-white/20 mb-3">
                  <button
                    onClick={() => setDiscountType("percent")}
                    className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                      discountType === "percent" ? "bg-amber-500 text-white" : "bg-white/5 text-indigo-300 hover:bg-white/10"
                    }`}
                  >
                    % Percent
                  </button>
                  <button
                    onClick={() => setDiscountType("flat")}
                    className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                      discountType === "flat" ? "bg-amber-500 text-white" : "bg-white/5 text-indigo-300 hover:bg-white/10"
                    }`}
                  >
                    ₹ Flat
                  </button>
                </div>
                {discountType === "percent" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-white placeholder-white/50"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(clampNonNegative(e.target.value))}
                    />
                    <span className="text-indigo-200">%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-200">₹</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="w-28 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-white placeholder-white/50"
                      value={flatDiscount}
                      onChange={(e) => setFlatDiscount(clampNonNegative(e.target.value))}
                      placeholder="0"
                    />
                    <span className="text-indigo-200 text-xs">flat off</span>
                  </div>
                )}
              </div>

              {/* Coins Payment Option - Show when customer is selected */}
              {customer.contact && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaCoins className="text-amber-400" />
                      <span className="text-indigo-200">Use Coins</span>
                    </div>
                    <span className="text-sm text-amber-400">
                      (Available: {customerCoins} coins)
                    </span>
                  </div>
                  
                  {customerCoins > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={useCoins}
                          onChange={(e) => handleUseCoinsChange(e.target.checked)}
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-indigo-200 text-sm">
                          Apply coins to get discount
                        </span>
                      </div>

                      {showCoinCelebration && celebratedCoins > 0 && (
                        <div className="relative mb-3 overflow-hidden rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2">
                          <p className="text-sm font-semibold text-emerald-300 animate-pulse">
                            Whoa! {celebratedCoins} coins discount is applied.
                          </p>
                          <div className="pointer-events-none absolute inset-0">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <span
                                key={i}
                                className="absolute h-1.5 w-1.5 rounded-full bg-amber-300/90 animate-bounce"
                                style={{
                                  left: `${6 + i * 9}%`,
                                  top: i % 2 === 0 ? "20%" : "65%",
                                  animationDelay: `${i * 0.08}s`,
                                  animationDuration: "0.9s",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {useCoins && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-200 text-sm">Coins to use:</span>
                          <input
                            type="number"
                            min={0}
                            max={customerCoins}
                            className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-white placeholder-white/50"
                            value={coinAmount}
                            onChange={(e) => handleCoinAmountChange(e.target.value)}
                          />
                          </div>
                          {coinDiscountAmount > 0 && (
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                              <span className="text-indigo-200">Coin Discount</span>
                              <span className="font-semibold text-green-400">-₹{coinDiscountAmount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-indigo-300 text-sm">
                        No coins available. Earn coins on your next purchase!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Coin Award Controls */}
              {customer.contact && (
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCoins className="text-amber-400" />
                    <span className="text-indigo-200 text-sm font-medium">Coin Awards</span>
                  </div>

                  {/* Referrer coins */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-indigo-200 text-sm">Send coins to Referrer</span>
                      <p className="text-xs text-indigo-400">
                        {sendReferrerCoins ? "Referrer will earn coins." : "Referrer will NOT earn coins."}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sendReferrerCoins}
                      onChange={(e) => setSendReferrerCoins(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </div>

                  {/* Buyer coins */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-indigo-200 text-sm">Send coins to Buyer</span>
                      <p className="text-xs text-indigo-400">
                        {sendBuyerCoins ? "Buyer will earn coins." : "Buyer will NOT earn coins."}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sendBuyerCoins}
                      onChange={(e) => setSendBuyerCoins(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/20 pt-4">
                {/* Grand Total */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-200">Grand Total</span>
                  <span className="text-sm">₹{grandTotal.toFixed(2)}</span>
                </div>
                {gstType === "IGST" ? (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-indigo-200">IGST ({igstPercent}%)</span>
                    <span className="text-sm">+₹{igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    {cgstPercent > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-indigo-200">CGST ({cgstPercent}%)</span>
                        <span className="text-sm">+₹{cgstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {sgstPercent > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-indigo-200">SGST ({sgstPercent}%)</span>
                        <span className="text-sm">+₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-200">Discount</span>
                  <span className="text-sm text-green-400">-₹{discountAmount.toFixed(2)}</span>
                </div>
                {offerModelDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-indigo-200 text-xs">↳ Product Offers</span>
                    <span className="text-xs text-green-400">-₹{offerModelDiscount.toFixed(2)}</span>
                  </div>
                )}
                {coinDiscountAmount > 0 && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-indigo-200">Coins Applied</span>
                    <span className="text-sm text-green-400">-₹{coinDiscountAmount.toFixed(2)} ({coinAmount} coins)</span>
                  </div>
                )}
              </div>

              {/* Payable Amount */}
              <div className="bg-amber-500 rounded-xl p-4 text-center">
                <p className="text-amber-100 text-sm mb-1">Payable Amount</p>
                <p className="text-4xl font-bold text-white">₹{payableAmount.toFixed(2)}</p>
              </div>

              {/* Total Savings Badge */}
              {totalSavings > 0 && (
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-3 text-center">
                  <p className="text-emerald-300 text-xs font-semibold">🎉 YOUR TOTAL SAVINGS</p>
                  <p className="text-xl font-bold text-emerald-400">₹{totalSavings.toFixed(2)}</p>
                  <p className="text-xs text-emerald-200/80 mt-0.5">💥 (તમારી કુલ બચત: ₹{totalSavings.toFixed(2)})</p>
                </div>
              )}

              {/* UPI QR Code — shown when ONLINE payment is selected */}
              {paymentMethod === "ONLINE" && qrDataUrl && (
                <div className="bg-white rounded-xl p-4 text-center border-2 border-indigo-200">
                  <p className="text-indigo-700 font-semibold text-sm mb-2">
                    📱 Scan to Pay · {ac === "C" ? "Account A" : "Account B"}
                  </p>
                  <img src={qrDataUrl} alt="UPI QR" className="mx-auto w-40 h-40" />
                  <p className="text-xs text-gray-500 mt-2">
                    Amount <span className="font-bold text-indigo-600">₹{payableAmount.toFixed(2)}</span> auto-filled
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ac === "C" ? upiIdA : upiIdB}
                  </p>
                </div>
              )}
              {paymentMethod === "ONLINE" && !qrDataUrl && (
                <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
                  <p className="text-indigo-300 text-xs">⚠️ Set UPI ID in Settings to show QR code</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
               <PrintBillButton
                  cart={cart}
                  customer={{
                    name: customer.name,
                    address: customer.address,
                    mobile: customer.contact
                  }}
                  payableAmount={payableAmount}
                  subtotal={grandTotal}
                  cgstAmount={cgstAmount}
                  sgstAmount={sgstAmount}
                  igstAmount={igstAmount}
                  gstType={gstType}
                  cgstPercent={cgstPercent}
                  sgstPercent={sgstPercent}
                  igstPercent={igstPercent}
                  discountAmount={discountAmount}
                  coinDiscountAmount={coinDiscountAmount}
                  coinsUsed={coinAmount}
                  gstin={gstin}
                  storeName={storeName}
                  storeTagline={storeTagline}
                  paymentMethod={paymentMethod}
                  paymentDestination={ac === "C" ? "CURRENT_ACCOUNT" : "OTHER_ACCOUNT"}
                  upiIdA={upiIdA}
                  upiIdB={upiIdB}
                  ac={ac}
                />
                
                {/* Payment Method + Received Panel */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/20">

                  {/* ── Payment Method ── */}
                  <span className="text-indigo-200 text-sm font-semibold block mb-3">💳 Payment Method</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("CASH")}
                      className={`py-2.5 px-3 rounded-lg font-bold text-sm transition-all border-2 ${
                        paymentMethod === "CASH"
                          ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30"
                          : "bg-white/5 border-white/20 text-indigo-300 hover:bg-white/10"
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod("ONLINE")}
                      className={`py-2.5 px-3 rounded-lg font-bold text-sm transition-all border-2 ${
                        paymentMethod === "ONLINE"
                          ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                          : "bg-white/5 border-white/20 text-indigo-300 hover:bg-white/10"
                      }`}
                    >
                      💳 Online
                    </button>
                  </div>

                  {/* Online account info / UPI warning */}
                  {paymentMethod === "ONLINE" && (
                    <div className="mt-2">
                      {(upiIdA || upiIdB) ? (
                        <div className={`rounded-lg px-3 py-2 text-xs font-semibold border flex items-center justify-between ${
                          ac === "C"
                            ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                            : "bg-violet-500/10 border-violet-400/30 text-violet-300"
                        }`}>
                          <span>{ac === "C" ? "🟢 Account A" : "🟣 Account B"}</span>
                          <span className="opacity-70 font-mono text-xs">{ac === "C" ? upiIdA : upiIdB}</span>
                        </div>
                      ) : (
                        <div className="rounded-lg px-3 py-2 text-xs font-semibold border bg-red-500/10 border-red-400/30 text-red-300">
                          ⚠️ No UPI ID set — go to Settings to add one
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Amount Received ── */}
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-indigo-200 text-sm font-semibold">Amount Received (₹)</span>
                      <button
                        className="text-xs text-amber-400 underline hover:text-amber-300"
                        onClick={() => setAmountPaid(payableAmount.toFixed(0))}
                      >
                        Full ₹{payableAmount.toFixed(0)}
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={`Enter amount (default: ₹${payableAmount.toFixed(0)})`}
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      className="w-full px-3 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/30 text-center text-xl font-bold outline-none focus:border-amber-400 transition-colors"
                    />

                    {/* Live feedback */}
                    <div className="mt-3 space-y-2">
                      {amountPaid === "" && (
                        <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                          <span className="text-emerald-300 text-xs">Assuming full payment</span>
                          <span className="text-emerald-300 font-bold">₹{payableAmount.toFixed(0)}</span>
                        </div>
                      )}
                      {amountPaid !== "" && changeToReturn > 0 && (
                        <div className="flex justify-between items-center bg-green-500/20 border border-green-400/40 rounded-lg px-3 py-2">
                          <span className="text-green-300 text-sm font-bold">💵 Return Change</span>
                          <span className="text-green-300 font-bold text-lg">₹{changeToReturn.toFixed(0)}</span>
                        </div>
                      )}
                      {amountPaid !== "" && balanceDue > 0 && (
                        <div className="flex justify-between items-center bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                          <span className="text-red-300 text-sm font-bold">🤝 Udhar Due</span>
                          <span className="text-red-300 font-bold text-lg">₹{balanceDue.toFixed(0)}</span>
                        </div>
                      )}
                      {amountPaid !== "" && balanceDue === 0 && changeToReturn === 0 && (
                        <div className="flex justify-between items-center bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-3 py-2">
                          <span className="text-emerald-300 text-sm font-bold">✅ Fully Paid</span>
                          <span className="text-emerald-300 font-bold">₹{payableAmount.toFixed(0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick amount buttons */}
                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                      {[0, 500, 1000, 2000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setAmountPaid(amt === 0 ? "0" : String(amt))}
                          className={`py-1.5 text-xs rounded-lg font-medium transition-all border ${
                            (amountPaid === String(amt) || (amt === 0 && amountPaid === "0"))
                              ? "bg-amber-500 border-amber-400 text-white"
                              : "bg-white/10 border-white/20 text-indigo-200 hover:bg-white/20"
                          }`}
                        >
                          {amt === 0 ? "Udhar" : `₹${amt}`}
                        </button>
                      ))}
                    </div>

                    {/* Note */}
                    <input
                      type="text"
                      placeholder="Payment note (optional)"
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm outline-none focus:border-white/40"
                    />

                    {/* Udhar auto-save notice */}
                    {amountPaid !== "" && balanceDue > 0 && (
                      <p className="text-xs text-amber-300 mt-2 text-center bg-amber-500/10 border border-amber-400/20 rounded-lg py-1.5">
                        🤝 ₹{balanceDue.toFixed(0)} will be auto-saved to Udhar Khata
                      </p>
                    )}
                  </div>
                </div>

                {/* Inline warnings */}
                {Object.keys(cart).length > 0 && !customer.name.trim() && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-xl px-3 py-2.5">
                    <span className="text-red-300 text-sm">⚠️ Customer name is required</span>
                  </div>
                )}

                <button
                  onClick={handleCompleteSale}
                  disabled={!Object.keys(cart).length || isProcessingSale}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingSale ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Complete Sale
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Total Items</span>
                <span className="font-bold text-indigo-600">{itemCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Unique Products</span>
                <span className="font-bold text-indigo-600">{Object.keys(cart).length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Customer</span>
                <span className="font-bold text-indigo-600">{customer.name || "Walk-in"}</span>
              </div>
              
              {/* Customer Offer Display */}
              {customerOffer.hasOffer && !appliedOfferAmount && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaGift className="text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">Available Offer</span>
                  </div>
                  <p className="text-lg font-bold text-amber-600">
                    {customerOffer.offerType === "percentage"
                      ? `${customerOffer.offerDiscount}% OFF`
                      : customerOffer.offerType === "flat"
                      ? `₹${customerOffer.offerDiscount} FLAT OFF`
                      : customerOffer.offerType === "free_product"
                      ? "🎀 FREE PRODUCT"
                      : "Special Offer"}
                  </p>
                  <button
                    onClick={applyOffer}
                    disabled={grandTotal === 0}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {customerOffer.offerType === "free_product" ? "View Details" : "Apply Offer"}
                  </button>
                </div>
              )}

              {/* Applied Offer Display */}
              {appliedOfferAmount > 0 && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaGift className="text-green-500" />
                      <span className="text-sm font-medium text-green-700">Applied Offer</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {customerOffer.offerType === "percentage" 
                      ? `${customerOffer.offerDiscount}% OFF` 
                      : `₹${customerOffer.offerDiscount} FLAT OFF`}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    You save: -₹{appliedOfferAmount.toFixed(2)}
                  </p>
                  <button
                    onClick={removeOffer}
                    className="w-full mt-2 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-300 transition-all"
                  >
                    Remove Offer
                  </button>
                </div>
              )}
              
              {/* No Offer Message for Registered Customers */}
              {customer.contact && !customerOffer.hasOffer && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <FaTag className="text-gray-400" />
                    <span className="text-sm text-gray-500">Spin to win on first purchase!</span>
                  </div>
                </div>
              )}

              {/* Coin Earn Preview — shown when customer selected & cart has items */}
              {customer.contact && coinConfig?.isEnabled && payableAmount > 0 && (() => {
                // Buyer coins
                let buyerCoins = 0;
                if (coinConfig.purchaseRewardEnabled && coinConfig.buyerPurchaseRewardEnabled) {
                  if (payableAmount >= (coinConfig.purchaseMinOrderAmount || 0)) {
                    buyerCoins = coinConfig.purchaseRewardType === "FIXED"
                      ? coinConfig.purchaseFixedCoins
                      : Math.floor(payableAmount * (coinConfig.purchasePercentage || 0) / 100);
                    if (coinConfig.purchaseMaxCoinsPerOrder > 0)
                      buyerCoins = Math.min(buyerCoins, coinConfig.purchaseMaxCoinsPerOrder);
                  }
                }

                // Referrer coins
                let referrerCoins = 0;
                if (
                  referralConfig?.isEnabled &&
                  coinConfig.referrerPurchaseRewardEnabled &&
                  referrerName
                ) {
                  if (payableAmount >= (referralConfig.minPurchaseAmount || 0)) {
                    referrerCoins = referralConfig.rewardType === "FIXED_COINS"
                      ? referralConfig.fixedCoins
                      : Math.floor(payableAmount * (referralConfig.percentage || 0) / 100);
                  }
                }

                if (buyerCoins === 0 && referrerCoins === 0) return null;

                return (
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FaCoins className="text-amber-500" />
                      <span className="text-sm font-semibold text-amber-700">Coins to be Earned</span>
                      <span className="ml-auto text-xs text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">on ₹{payableAmount.toFixed(0)}</span>
                    </div>

                    <div className="space-y-2">
                      {buyerCoins > 0 && (
                        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <FaUser className="text-green-600" style={{fontSize: 10}} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Buyer</p>
                              <p className="text-xs text-gray-400 truncate max-w-[100px]">{customer.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCoins className="text-amber-400" style={{fontSize: 11}} />
                            <span className="font-bold text-amber-600">+{buyerCoins}</span>
                          </div>
                        </div>
                      )}

                      {referrerCoins > 0 && (
                        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-indigo-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <FaUserPlus className="text-indigo-600" style={{fontSize: 10}} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Referrer</p>
                              <p className="text-xs text-gray-400 truncate max-w-[100px]">{referrerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCoins className="text-indigo-400" style={{fontSize: 11}} />
                            <span className="font-bold text-indigo-600">+{referrerCoins}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-amber-500 mt-2 text-center">Coins credited after sale completes</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Manual Add Product Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
              <FaPlus size={14} />
            </div>
            <span className="text-base font-semibold text-gray-800">Add Product Manually</span>
          </div>
        }
        open={manualProductOpen}
        onCancel={() => { setManualProductOpen(false); manualProductForm.resetFields(); }}
        footer={null}
        width={540}
        centered
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 } }}
      >
        <Form form={manualProductForm} layout="vertical" onFinish={handleManualProductSubmit} className="pt-4">
          <Form.Item
            name="name"
            label={<span className="text-gray-600 text-sm font-medium">Product Name</span>}
            rules={[{ required: true, message: "Required" }, { min: 2, message: "Enter at least 2 characters" }]}
          >
            <Input placeholder="e.g. Shirt, Shoes, Mug" size="large" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="price"
            label={<span className="text-gray-600 text-sm font-medium">Selling Price (₹)</span>}
            rules={[{ required: true, message: "Required" }, { validator: (_, value) => value > 0 ? Promise.resolve() : Promise.reject('Price must be greater than 0') }]}
          >
            <Input type="number" min={0.01} step={0.01} placeholder="e.g. 499.00" size="large" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="mrp"
            label={<span className="text-gray-600 text-sm font-medium">MRP (₹) <span className="text-gray-400 font-normal">(optional)</span></span>}
          >
            <Input type="number" min={0.01} step={0.01} placeholder="e.g. 799.00 (leave blank if same as price)" size="large" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="qty"
            label={<span className="text-gray-600 text-sm font-medium">Quantity</span>}
            initialValue={1}
            rules={[{ required: true, message: "Required" }, { validator: (_, value) => value > 0 ? Promise.resolve() : Promise.reject('Quantity must be at least 1') }]}
          >
            <Input type="number" min={1} step={1} placeholder="1" size="large" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="type"
            label={<span className="text-gray-600 text-sm font-medium">Type</span>}
            initialValue="product"
          >
            <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none">
              <option value="product">Product / Item</option>
              <option value="charge">Extra charge / Service</option>
            </select>
          </Form.Item>
          <Form.Item
            name="barcode"
            label={<span className="text-gray-600 text-sm font-medium">Barcode / SKU <span className="text-gray-400 font-normal">(optional)</span></span>}
          >
            <Input placeholder="Optional barcode or identifier" size="large" className="rounded-xl" />
          </Form.Item>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setManualProductOpen(false); manualProductForm.resetFields(); }}
              className="flex-1 h-11 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-amber-200"
            >
              Add Product
            </button>
          </div>
        </Form>
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <FaUserPlus size={14} />
            </div>
            <span className="text-base font-semibold text-gray-800">Add New Customer</span>
          </div>
        }
        open={addCustomerOpen}
        onCancel={() => { setAddCustomerOpen(false); addCustomerForm.resetFields(); }}
        footer={null}
        width={540}
        centered
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 } }}
      >
        <Form form={addCustomerForm} layout="vertical" onFinish={handleAddCustomerSubmit} className="pt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="firstname"
              label={<span className="text-gray-600 text-sm font-medium">First Name</span>}
              rules={[{ required: true, message: "Required" }, { min: 2, message: "Min 2 chars" }]}
            >
              <Input prefix={<FaUser className="text-gray-300" size={12} />} placeholder="First name" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item
              name="lastname"
              label={<span className="text-gray-600 text-sm font-medium">Last Name <span className="text-gray-400 font-normal">(optional)</span></span>}
              rules={[{ min: 2, message: "Min 2 chars" }]}
            >
              <Input prefix={<FaUser className="text-gray-300" size={12} />} placeholder="Last name" size="large" className="rounded-xl" />
            </Form.Item>
          </div>
          <Form.Item
            name="email"
            label={<span className="text-gray-600 text-sm font-medium">Email Address <span className="text-gray-400 font-normal">(optional)</span></span>}
            rules={[{ type: "email", message: "Invalid email" }]}
          >
            <Input prefix={<FaUser className="text-gray-300" size={12} />} placeholder="email@example.com" size="large" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="mobile"
            label={<span className="text-gray-600 text-sm font-medium">Mobile Number</span>}
            rules={[{ required: true, message: "Required" }, { pattern: /^[0-9]{10}$/, message: "Must be 10 digits" }]}
          >
            <Input prefix={<FaPhone className="text-gray-300" size={12} />} placeholder="10-digit mobile" size="large" maxLength={10} className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="address"
            label={<span className="text-gray-600 text-sm font-medium">Address <span className="text-gray-400 font-normal">(optional)</span></span>}
          >
            <Input.TextArea placeholder="Enter address" rows={3} className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="referralCode"
            label={<span className="text-gray-600 text-sm font-medium">Referral Code <span className="text-gray-400 font-normal">(optional — auto-generated if blank)</span></span>}
            rules={[{ pattern: /^[A-Z0-9]{4,12}$/i, message: "4–12 alphanumeric chars" }]}
          >
            <Input
              prefix={<FaTag className="text-gray-300" size={12} />}
              placeholder="e.g. JOHN123"
              size="large"
              className="rounded-xl"
              onChange={(e) => addCustomerForm.setFieldValue("referralCode", e.target.value.toUpperCase())}
            />
          </Form.Item>
          <Form.Item
            name="referredByMobile"
            label={<span className="text-gray-600 text-sm font-medium">Referred By Mobile <span className="text-gray-400 font-normal">(optional)</span></span>}
            rules={[{ pattern: /^[0-9]{10}$/, message: "Must be 10 digits" }]}
          >
            <Input
              prefix={<FaPhone className="text-gray-300" size={12} />}
              placeholder="Referrer's 10-digit mobile"
              size="large"
              maxLength={10}
              className="rounded-xl"
            />
          </Form.Item>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setAddCustomerOpen(false); addCustomerForm.resetFields(); }}
              className="flex-1 h-11 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addCustomerLoading}
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-200 cursor-pointer border-0 disabled:opacity-60"
            >
              {addCustomerLoading ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* GSTIN Modal */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <FaBuilding className="text-indigo-600" />
            {gstin ? "Edit GSTIN" : "Add GSTIN"}
          </span>
        }
        open={gstinModalVisible}
        onOk={saveGstin}
        onCancel={() => setGstinModalVisible(false)}
        okText="Save"
        className="premium-modal"
      >
        <div className="py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GSTIN Number
          </label>
          <Input
            placeholder="Enter GSTIN (e.g., 22AAAAA0000A1Z5)"
            value={gstinInput}
            onChange={(e) => setGstinInput(e.target.value)}
            onPressEnter={saveGstin}
            className="py-3"
          />
          <p className="text-xs text-gray-500 mt-2">
            Format: 15 characters (e.g., 22AAAAA0000A1Z5)
          </p>
        </div>
      </Modal>

      {/* Spin Wheel Modal */}
      {showSpinner && (
        <SpinWheel
          isOpen={showSpinWheel}
          onClose={() => {
            setShowSpinWheel(false);
            // Only finalize if the spin produced a result (handled via onSpinComplete).
            // Closing without spinning should NOT charge the customer.
          }}
          onSpinComplete={handleSpinComplete}
          customerMobile={customer.contact}
        />
      )}
    </div>
  );
};

export default LiveBilling;
