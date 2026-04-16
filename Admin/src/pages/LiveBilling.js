import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import { Modal, Input } from "antd";
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
  FaCoins
} from "react-icons/fa";
import SpinWheel from "../components/SpinWheel";
import PrintBillButton from "../components/PrintBillButton";

const LiveBilling = () => {
  const [buffer, setBuffer] = useState("");
  const [cart, setCart] = useState({});

  const [cgstPercent, setCgstPercent] = useState(0);
  const [sgstPercent, setSgstPercent] = useState(0);
  const [igstPercent, setIgstPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  // GST type: "CGST_SGST" for intra-state, "IGST" for inter-state, "NONE" for no tax
  const [gstType, setGstType] = useState("CGST_SGST");
  const [storeState, setStoreState] = useState("Gujarat");

  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);

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
  const [storeName, setStoreName]               = useState("Cart Corner");
  const [storeTagline, setStoreTagline]         = useState("Your One-Stop Shopping Destination");
  // Tax settings — persisted from backend, NOT reset after sale
  const [taxIncluded, setTaxIncluded]           = useState(false);
  const [defaultCgst, setDefaultCgst]           = useState(0);
  const [defaultSgst, setDefaultSgst]           = useState(0);
  const [defaultIgst, setDefaultIgst]           = useState(0);
  const [defaultStoreState, setDefaultStoreState] = useState("Gujarat");
  // Customer shipping state for GST determination
  const [customerState, setCustomerState]       = useState("Gujarat");

  // Coins state
  const [customerCoins, setCustomerCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [showCoinCelebration, setShowCoinCelebration] = useState(false);
  const [celebratedCoins, setCelebratedCoins] = useState(0);
  const coinCelebrationTimerRef = useRef(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // CASH or ONLINE
  const [paymentDestination, setPaymentDestination] = useState("CURRENT_ACCOUNT"); // CURRENT_ACCOUNT or OTHER_ACCOUNT
  const [onlinePaymentDestinationConfig, setOnlinePaymentDestinationConfig] = useState("CURRENT_ACCOUNT"); // Admin setting

  // Sale processing state
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const isProcessingSaleRef = useRef(false); // Synchronous ref for immediate checks

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
     TOTAL CALCULATIONS
     ========================= */
  const grandTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.qty * item.price, 0);
  }, [cart]);

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

  // Discount is always on grandTotal (subtotal)
  const discountAmount = useMemo(
    () => (grandTotal * discountPercent) / 100 + appliedOfferAmount,
    [grandTotal, discountPercent, appliedOfferAmount]
  );

  const coinDiscountAmount = useMemo(() => {
    if (!useCoins || coinAmount <= 0) return 0;
    const amountBeforeCoins = taxIncluded
      ? grandTotal - discountAmount
      : grandTotal + totalTaxAmount - discountAmount;
    const maxCoins = Math.min(customerCoins, Math.floor(amountBeforeCoins));
    return Math.min(coinAmount, maxCoins);
  }, [useCoins, coinAmount, customerCoins, grandTotal, totalTaxAmount, discountAmount, taxIncluded]);

  const payableAmount = useMemo(() => {
    if (taxIncluded) {
      return Math.max(0, grandTotal - discountAmount - coinDiscountAmount);
    }
    return Math.max(0, grandTotal + totalTaxAmount - discountAmount - coinDiscountAmount);
  }, [grandTotal, totalTaxAmount, discountAmount, coinDiscountAmount, taxIncluded]);

  // The amount coins are calculated on = final payable (after ALL discounts)
  // This is what gets passed to awardCoinsOnOrder on the backend
  const coinBaseAmount = payableAmount;

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
      
      if (stockInfo && !stockInfo.isAvailable) {
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
            qty: 1,
            size: product.size || null, // Store size info
            color: product.color || null, // Store color info
            isSizeSpecific: product.isSizeSpecific || false,
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
    
    if (stockInfo && !stockInfo.isAvailable) {
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
          
          if (stockInfo && !stockInfo.isAvailable) {
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
                qty: 1,
                size: product.size || null,
                color: product.color || null,
                isSizeSpecific: product.isSizeSpecific || false,
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

  // Fetch GSTIN on mount
  useEffect(() => {
    const fetchGstin = async () => {
      try {
        const res = await axios.get(`${base_url}user/gstin`, config);
        setGstin(res.data.gstin || "");
      } catch (err) {
        console.error("Failed to fetch GSTIN:", err);
      }
    };
    fetchGstin();
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, spinRes] = await Promise.all([
          axios.get(`${base_url}user/settings`, config),
          axios.get(`${base_url}spin/config`, config),
        ]);
        const cgst = settingsRes.data.cgst || 0;
        const sgst = settingsRes.data.sgst || 0;
        const igst = settingsRes.data.igst || 0;
        const sState = settingsRes.data.storeState || "Gujarat";
        setCgstPercent(cgst);
        setSgstPercent(sgst);
        setIgstPercent(igst);
        setDefaultCgst(cgst);
        setDefaultSgst(sgst);
        setDefaultIgst(igst);
        setDefaultStoreState(sState);
        setStoreState(sState);
        setGstType("CGST_SGST");
        setTaxIncluded(settingsRes.data.taxIncluded === true);
        setShowSpinner(spinRes.data.isEnabled === true);
        setOnlinePaymentDestinationConfig(settingsRes.data.onlinePaymentDestination || "CURRENT_ACCOUNT");
        setStoreName(settingsRes.data.storeName || "Cart Corner");
        setStoreTagline(settingsRes.data.storeTagline || "Your One-Stop Shopping Destination");
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
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
        offerType: res.data.offerType || ""
      });
      
      // DON'T auto-apply - user must click "Apply Offer" button
      setAppliedOfferAmount(0);
    } catch (err) {
      console.error("Failed to fetch customer offer:", err);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setAppliedOfferAmount(0);
    }
  };

  // Fetch customer coins when customer is selected
  const fetchCustomerCoins = async (mobile) => {
  if (!mobile) {
    setCustomerCoins(0);
    return;
  }

  try {
    const res = await axios.get(
      `${base_url}user/search?query=${mobile}`,
      config
    );

    if (res.data && res.data.length > 0)
      {
      const coins = res.data[0].coins;
      console.log("RESUT Data ===",res.data);
      console.log("RESUT Data ===",res.data);
      console.log("RESUT Data 0 ===",res.data[0]);

      console.log("Fetched coins for customer:", coins); // Debug log

      setCustomerCoins(coins || 0);
    }
  } catch (err) {
    console.error("Failed to fetch customer coins:", err);
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

  // Apply offer to current bill
  const applyOffer = () => {
    if (!customerOffer.hasOffer || grandTotal === 0) return;
    let offerAmt = 0;
    if (customerOffer.offerType === "percentage") {
      offerAmt = (grandTotal * customerOffer.offerDiscount) / 100;
    } else if (customerOffer.offerType === "flat") {
      offerAmt = Math.min(customerOffer.offerDiscount, grandTotal);
    } else if (customerOffer.offerType === "free_product") {
      // Free product — no monetary discount, admin handles manually
      Swal.fire({
        icon: 'info',
        title: 'Free Product Offer',
        text: 'This customer has a FREE PRODUCT reward from the spin wheel. Please add the free product to the cart manually.',
        confirmButtonColor: '#d4af37',
      });
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
    if (!isProcessingSaleRef.current) {
      await finalizeSale();
    }
  };

  // Handle complete sale with spin wheel logic
  const handleCompleteSale = () => {
    if (!Object.keys(cart).length || isProcessingSaleRef.current) return;
    // Show spin wheel only if enabled AND customer has a contact
    if (showSpinner && customer.contact) {
      setShowSpinWheel(true);
    } else {
      finalizeSale();
    }
  };

  // Search customers
  useEffect(() => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${base_url}user/search?query=${searchTerm}`,
          config
        );
        setCustomers(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Search by contact
  useEffect(() => {
    if (!contactSearch.trim()) {
      setCustomers([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${base_url}user/search?query=${contactSearch}`,
          config
        );
        setCustomers(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [contactSearch]);

  // Search referrals with debounce
  useEffect(() => {
    if (!referralSearch.trim()) {
      setReferralResults([]);
      return;
    }
    const delay = setTimeout(() => searchReferrals(referralSearch), 400);
    return () => clearTimeout(delay);
  }, [referralSearch]);

  // Fetch customer offer + auto-fill referral when customer is selected
  useEffect(() => {
    if (customer.contact) {
      fetchCustomerOffer(customer.contact);
      fetchCustomerCoins(customer.contact);
      // Auto-fill referral if customer already has a referrer in DB
      const autoFillReferral = async () => {
        try {
          const res = await axios.get(`${base_url}user/search?query=${customer.contact}`, config);
          if (res.data && res.data.length > 0) {
            const found = res.data.find(u => u.mobile === customer.contact);
            if (found && found.referredBy && !referrerName) {
              const ref = found.referredBy;
              setReferrerName((ref.firstname || "") + " " + (ref.lastname || ""));
              setReferrerCode(ref.referralCode || "N/A");
              setReferralSearch(ref.mobile || "");
              setCustomer(prev => ({
                ...prev,
                referralContact: ref.mobile || "",
                referralCode: ref.referralCode || ""
              }));
            }
          }
        } catch (err) { /* silent */ }
      };
      autoFillReferral();
    } else {
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setAppliedOfferAmount(0);
      setUseCoins(false);
      setCoinAmount(0);
    }
  }, [customer.contact]);

  /* =========================
     GENERATE WHATSAPP MESSAGE
     ========================= */
  const generateWhatsAppMessage = (activeCart, activeCustomer, activeOffer, activeAppliedAmount, activeWonOffer) => {
    // Generate WhatsApp message
    let whatsAppMessage = `🧾 *Bill Receipt - ${storeName}*\n\n`;
    whatsAppMessage += `Customer: ${activeCustomer.name || "Walk-in Customer"}\n`;
    if (activeCustomer.contact) whatsAppMessage += `Mobile: ${activeCustomer.contact}\n`;
    whatsAppMessage += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
    whatsAppMessage += `Time: ${new Date().toLocaleTimeString()}\n\n`;
    whatsAppMessage += `*Items:*\n`;
    
    Object.values(activeCart).forEach((item) => {
      whatsAppMessage += `• ${item.name} x${item.qty} = ₹${(item.qty * item.price).toFixed(2)}\n`;
    });
    
    whatsAppMessage += `\n─────────────\n`;
    whatsAppMessage += `Subtotal: ₹${grandTotal.toFixed(2)}\n`;
    if (gstType === "IGST" && igstPercent > 0) {
      whatsAppMessage += `IGST (${igstPercent}%): ₹${igstAmount.toFixed(2)}\n`;
    } else {
      if (cgstPercent > 0) whatsAppMessage += `CGST (${cgstPercent}%): ₹${cgstAmount.toFixed(2)}\n`;
      if (sgstPercent > 0) whatsAppMessage += `SGST (${sgstPercent}%): ₹${sgstAmount.toFixed(2)}\n`;
    }
    if (discountPercent > 0) whatsAppMessage += `Additional Discount: -₹${((grandTotal * discountPercent) / 100).toFixed(2)}\n`;
    if (activeAppliedAmount > 0) whatsAppMessage += `Customer Offer: -₹${activeAppliedAmount.toFixed(2)}\n`;
    whatsAppMessage += `*Total: ₹${payableAmount.toFixed(2)}*\n`;
    whatsAppMessage += `─────────────\n\n`;
    
    // Add offer message for NEXT purchase (if won)
    if (activeWonOffer && activeWonOffer.type !== "none") {
      const offerText = activeWonOffer.type === "percentage" 
        ? `${activeWonOffer.value}% OFF` 
        : `₹${activeWonOffer.value} FLAT OFF`;
      whatsAppMessage += `🎁 *SPECIAL OFFER FOR NEXT PURCHASE!*\n`;
      whatsAppMessage += `You won: *${offerText}*\n`;
      whatsAppMessage += `Use this offer on your next visit!\n\n`;
    } else if (activeOffer && activeOffer.hasOffer && activeAppliedAmount > 0) {
      // Show existing offer if customer has one and it's applied
      const offerText = activeOffer.offerType === "percentage" 
        ? `${activeOffer.offerDiscount}% OFF` 
        : `₹${activeOffer.offerDiscount} FLAT OFF`;
      whatsAppMessage += `🎁 *YOUR OFFER*\n`;
      whatsAppMessage += `Current offer: *${offerText}*\n`;
      whatsAppMessage += `Offer applied: -₹${activeAppliedAmount.toFixed(2)}\n\n`;
    }
    
    whatsAppMessage += `Thank you for shopping with us! 🙏\n`;
    whatsAppMessage += `${storeTagline}`;

    return whatsAppMessage;
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
          offerDiscount: appliedOfferAmount,
          total: payableAmount,
          paymentMethod: paymentMethod === "CASH" ? "CASH" : "ONLINE",
          paymentDestination: paymentMethod === "CASH" ? "CASH" : paymentDestination,
          referralContact: customer.referralContact || null,
          coinsUsed: useCoins ? coinAmount : 0,
          coinAmount: useCoins ? coinDiscountAmount : 0,
          gstBreakdown: {
            cgst: cgstAmount,
            sgst: sgstAmount,
            igst: igstAmount,
            cgstRate: cgstPercent,
            sgstRate: sgstPercent,
            igstRate: igstPercent,
            gstType,
            taxableAmount: grandTotal,
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

      // Send WhatsApp message if customer has contact
      // Use the stored customerData to ensure we have the correct data
      if (customerData.contact) {
        const message = generateWhatsAppMessage(cartData, customerData, offerData, appliedAmount, null);
        openWhatsApp(message, customerData);
        printBill();
        Swal.fire({
          icon: 'success',
          title: 'Sale Completed',
          text: 'SALE COMPLETED SUCCESSFULLY! Bill sent to WhatsApp!',
          confirmButtonColor: '#d4af37'
        });
      } else {
        printBill();
        Swal.fire({
          icon: 'success',
          title: 'Sale Completed',
          text: 'SALE COMPLETED SUCCESSFULLY!',
          confirmButtonColor: '#d4af37',
          timer: 1500,
          showConfirmButton: false
        });
      }

      setCart({});
      setCustomer({ name: "", address: "", contact: "", referralContact: "", referralCode: "" });
      setCustomerState("Gujarat");
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
      setAppliedOfferAmount(0);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setUseCoins(false);
      setCoinAmount(0);
      setPaymentMethod("CASH"); // Reset to CASH
      setPaymentDestination("CURRENT_ACCOUNT"); // Reset destination
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
     PRINT BILL - Premium Design (same as PrintBillButton)
     ========================= */
  const printBill = (
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
    coinsUsedAmt = coinAmount
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
    const activeTotalDiscount = activeDiscount + activeCoinDiscount;

    if (!Object.keys(activeCart).length) {
      Swal.fire({
        icon: 'warning',
        title: 'Cart is Empty',
        text: 'Please add items to the cart before printing.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    // Generate invoice number
    const invoiceNum = () => {
      const date = new Date();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${random}`;
    };

    const win = window.open("", "_blank");
    if (!win) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Helper function to convert number to words
    const numberToWords = (num) => {
      const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
      const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

      const numToWords = (n) => {
        if ((n = n.toString()).length > 9) return 'overflow';
        let n_zero = ('000000000' + n).substr(-9);
        let n1 = n_zero.substr(0, 2), n2 = n_zero.substr(2, 2), n3 = n_zero.substr(4, 2), n4 = n_zero.substr(6, 2), n5 = n_zero.substr(8, 2);
        let res = '';
        res += (n1 != 0) ? (a[Number(n1)] || b[n1[0]] + ' ' + a[n1[1]]) + 'Crore ' : '';
        res += (n2 != 0) ? (a[Number(n2)] || b[n2[0]] + ' ' + a[n2[1]]) + 'Lakh ' : '';
        res += (n3 != 0) ? (a[Number(n3)] || b[n3[0]] + ' ' + a[n3[1]]) + 'Thousand ' : '';
        res += (n4 != 0) ? (a[Number(n4)] || b[n4[0]] + ' ' + a[n4[1]]) + 'Hundred ' : '';
        res += (n5 != 0) ? ((res != '') ? 'and ' : '') + (a[Number(n5)] || b[n5[0]] + ' ' + a[n5[1]]) : '';
        return res;
      };

      if (num <= 0) return 'Zero';
      return numToWords(Math.floor(num));
    };

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNum()}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { font-family: 'Inter', 'Segoe UI', sans-serif; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body class="bg-gray-50 p-4">
          <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            
            <!-- Premium Header -->
            <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white p-6">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h1 class="text-2xl font-bold tracking-tight">${storeName}</h1>
                      <p class="text-blue-200 text-xs">${storeTagline}</p>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="bg-white/20 px-4 py-2 rounded-lg inline-block">
                    <span class="text-xs text-blue-200 block">INVOICE</span>
                    <span class="text-xl font-bold">${invoiceNum()}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invoice Meta Info -->
            <div class="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Bill To</p>
                <p class="font-semibold text-gray-800">${activeCustomer.name || "Walk-in Customer"}</p>
                <p class="text-sm text-gray-600">${activeCustomer.address || "N/A"}</p>
                ${activeCustomer.contact ? `<p class="text-sm text-gray-600">📞 ${activeCustomer.contact}</p>` : ''}
                ${activeGstin ? `<p class="text-sm text-gray-600 font-medium">GSTIN: ${activeGstin}</p>` : ''}
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600"><span class="text-gray-500">Date:</span> ${dateStr}</p>
                <p class="text-sm text-gray-600"><span class="text-gray-500">Time:</span> ${timeStr}</p>
                <p class="text-sm text-gray-600"><span class="text-gray-500">Payment:</span> <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">CASH</span></p>
              </div>
            </div>

            <!-- Items Table -->
            <div class="p-6">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left">
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold rounded-l-lg">#</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold">Item Description</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold text-center">Qty</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold text-right">Rate</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.values(activeCart)
                    .map(
                      (item, index) => `
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="py-3 px-2 text-gray-500">${index + 1}</td>
                      <td class="py-3 px-2 font-medium text-gray-800">${item.name}</td>
                      <td class="py-3 px-2 text-center text-gray-600">${item.qty}</td>
                      <td class="py-3 px-2 text-right text-gray-600">₹${item.price.toFixed(2)}</td>
                      <td class="py-3 px-2 text-right font-medium text-gray-800">₹${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <!-- Summary Section -->
              <div class="mt-6 flex justify-end">
                <div class="w-72">
                  <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Subtotal</span>
                      <span class="font-medium">₹${activeSubtotal.toFixed(2)}</span>
                    </div>
                    ${activeCgst > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">CGST (${cgstPercent}%)</span>
                      <span class="text-green-600">+₹${activeCgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeSgst > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">SGST (${sgstPercent}%)</span>
                      <span class="text-green-600">+₹${activeSgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeIgst > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">IGST (${igstPercent}%)</span>
                      <span class="text-green-600">+₹${activeIgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeDiscount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Discount</span>
                      <span class="text-red-600">-₹${activeDiscount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeCoinDiscount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Coin Discount (${activeCoinsUsed} coins)</span>
                      <span class="text-red-600">-₹${activeCoinDiscount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeTotalDiscount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-700 font-medium">Total Discount</span>
                      <span class="text-red-700 font-medium">-₹${activeTotalDiscount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="border-t border-gray-200 pt-2 mt-2">
                      <div class="flex justify-between items-center">
                        <span class="text-lg font-bold text-gray-800">Total Payable</span>
                        <span class="text-2xl font-bold text-blue-600">₹${activePayable.toFixed(2)}</span>
                      </div>
                    </div>
                    <div class="text-center pt-2">
                      <span class="text-xs text-gray-400">Amount in Words</span>
                      <p class="text-sm font-medium text-gray-700">${numberToWords(activePayable)} Rupees Only</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="bg-gray-900 text-white p-6">
              <div class="flex justify-between items-start">
                <div class="text-sm">
                  <p class="font-semibold mb-1">Terms & Conditions</p>
                  <p class="text-gray-400 text-xs">• Goods once sold cannot be returned<br>• Warranty as per manufacturer policy<br>• Please retain this invoice for future reference</p>
                </div>
                <div class="text-center">
                  <div class="w-32 h-16 border-b border-gray-600 mb-2"></div>
                  <p class="text-xs text-gray-400">Authorized Signature</p>
                </div>
              </div>
              <div class="border-t border-gray-700 mt-4 pt-4 text-center">
                <p class="text-blue-400 font-semibold text-sm">Thank You for Shopping with Us! 🙏</p>
                <p class="text-gray-500 text-xs mt-1">Visit Again | Quality Guaranteed | Best Prices</p>
              </div>
            </div>

            <!-- Footer Bar -->
            <div class="bg-blue-600 text-white text-center py-2">
              <p class="text-xs">${storeName} | Powered by Premium Store Billing System</p>
            </div>

          </div>
        </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* PREMIUM HEADER */}


      {/* MAIN CONTENT GRID */}
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
                    Customer Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      value={customer.name}
                      placeholder="Enter customer name..."
                      onChange={(e) => {
                        const value = e.target.value;

                        setCustomer(prev => ({
                          ...prev,
                          name: value
                        }));

                        setSearchTerm(value); // still allow searching
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>
                  {showDropdown && customers.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1" style={{zIndex:9999}}>
                      {customers.map((cust) => (
                        <div
                          key={cust._id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          onClick={() => {
                            setCustomer({
                              name: cust.firstname + " " + cust.lastname,
                              address: cust.address || "",
                              contact: cust.mobile || "",
                              referralContact: customer.referralContact || "",
                              referralCode: customer.referralCode || "",
                            });
                            setCustomerCoins(cust.coins || 0);
                            setSearchTerm(cust.firstname + " " + cust.lastname);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-medium text-gray-800">
                            {cust.firstname} {cust.lastname}
                          </div>
                          <div className="text-xs text-gray-500">{cust.mobile}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                      value={customer.contact}
                      placeholder="Search by phone..."
                      onChange={(e) => {
                        const value = e.target.value;

                        setCustomer(prev => ({
                          ...prev,
                          contact: value
                        }));

                        setContactSearch(value);
                        setShowContactDropdown(true);
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                    />
                  </div>
                  {showContactDropdown && customers.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1" style={{zIndex:9999}}>
                      {customers.map((cust) => (
                        <div
                          key={cust._id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          onClick={() => {
                            setCustomer({
                              name: cust.firstname + " " + cust.lastname,
                              address: cust.address || "",
                              contact: cust.mobile || "",
                              referralContact: customer.referralContact || "",
                              referralCode: customer.referralCode || "",
                            });
                            setCustomerCoins(cust.coins || 0);
                            setContactSearch(cust.mobile);
                            setSearchTerm(cust.firstname + " " + cust.lastname);
                            setShowContactDropdown(false);
                          }}
                        >
                          <div className="font-medium text-gray-800">{cust.mobile}</div>
                          <div className="text-xs text-gray-500">
                            {cust.firstname} {cust.lastname}
                          </div>
                        </div>
                      ))}
                    </div>
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
                        <div className="font-semibold text-gray-800">{item.name}</div>
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
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        ₹{item.price.toFixed(2)}
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-200">Discount</span>
                  <span className="font-semibold text-green-400">-₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-white placeholder-white/50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(clampNonNegative(e.target.value))}
                  />
                  <span className="text-indigo-200">%</span>
                </div>
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
                />
                
                {/* Payment Method Selection */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                  <span className="text-indigo-200 text-sm font-semibold block mb-3">Payment Method</span>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setPaymentMethod("CASH");
                        setPaymentDestination("CURRENT_ACCOUNT");
                      }}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        paymentMethod === "CASH"
                          ? "bg-green-500 text-white"
                          : "bg-white/10 text-indigo-200 hover:bg-white/20"
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod("ONLINE")}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        paymentMethod === "ONLINE"
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-indigo-200 hover:bg-white/20"
                      }`}
                    >
                      💳 Online
                    </button>
                  </div>
                  
                  {/* Online Account Destination */}
                  {paymentMethod === "ONLINE" && (
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <span className="text-blue-200 text-xs font-semibold block mb-2">Account Type</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentDestination("CURRENT_ACCOUNT")}
                          className={`py-2 px-2 rounded text-sm font-medium transition-all ${
                            paymentDestination === "CURRENT_ACCOUNT"
                              ? "bg-blue-500 text-white"
                              : "bg-white/10 text-blue-200 hover:bg-white/20"
                          }`}
                        >
                          Current
                        </button>
                        <button
                          onClick={() => setPaymentDestination("OTHER_ACCOUNT")}
                          className={`py-2 px-2 rounded text-sm font-medium transition-all ${
                            paymentDestination === "OTHER_ACCOUNT"
                              ? "bg-blue-500 text-white"
                              : "bg-white/10 text-blue-200 hover:bg-white/20"
                          }`}
                        >
                          Other
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
            </div>
          </div>
        </div>
      </div>

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
            // User closed without spinning — still complete the sale
            if (!isProcessingSaleRef.current) {
              finalizeSale();
            }
          }}
          onSpinComplete={handleSpinComplete}
          customerMobile={customer.contact}
        />
      )}
    </div>
  );
};

export default LiveBilling;
