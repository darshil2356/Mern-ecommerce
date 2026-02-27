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
  const [spinCompleted, setSpinCompleted] = useState(false);

  const [cgstPercent, setCgstPercent] = useState(0);
  const [sgstPercent, setSgstPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

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
    referralContact: ""  // New field for referral contact number
  });

  // Referral validation state
  const [referrerName, setReferrerName] = useState("");
  const [referrerError, setReferrerError] = useState("");
  const [referrerCode, setReferrerCode] = useState("");

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
  const [showSpinner, setShowSpinner] = useState(true);
  const [showReferralOffer, setShowReferralOffer] = useState(false);
  const [referralCoinPercent, setReferralCoinPercent] = useState(10);
  const [storeName, setStoreName] = useState("Cart Corner");
  const [storeTagline, setStoreTagline] = useState("Your One-Stop Shopping Destination");

  // Coins state
  const [customerCoins, setCustomerCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);

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
    return Object.values(cart).reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );
  }, [cart]);

  const cgstAmount = useMemo(
    () => (grandTotal * cgstPercent) / 100,
    [grandTotal, cgstPercent]
  );

  const sgstAmount = useMemo(
    () => (grandTotal * sgstPercent) / 100,
    [grandTotal, sgstPercent]
  );

  const discountAmount = useMemo(
    () => (grandTotal * discountPercent) / 100 + appliedOfferAmount,
    [grandTotal, discountPercent, appliedOfferAmount]
  );

  const coinDiscountAmount = useMemo(() => {
    if (!useCoins || coinAmount <= 0) return 0;
    // Calculate amount before coins: subtotal + taxes - discount
    const amountBeforeCoins = grandTotal + cgstAmount + sgstAmount - discountAmount;
    // Can't use more coins than available or more than the amount before coins
    const maxCoins = Math.min(customerCoins, Math.floor(amountBeforeCoins));
    const actualCoins = Math.min(coinAmount, maxCoins);
    return actualCoins;
  }, [useCoins, coinAmount, customerCoins, grandTotal, cgstAmount, sgstAmount, discountAmount]);

  const payableAmount = useMemo(
    () => grandTotal + cgstAmount + sgstAmount - discountAmount - coinDiscountAmount,
    [grandTotal, cgstAmount, sgstAmount, discountAmount, coinDiscountAmount]
  );

  const itemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  /* =========================
     BARCODE HANDLER
     ========================= */
  const handleKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    if (buffer.trim() === "") {
      await finalizeSale();
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
        const res = await axios.get(`${base_url}user/settings`, config);
        // Set fetched values to state
        setCgstPercent(res.data.cgst || 0);
        setSgstPercent(res.data.sgst || 0);
        setShowSpinner(res.data.showSpinner === true);
        setShowReferralOffer(res.data.showReferralOffer === true);
        setReferralCoinPercent(res.data.referralCoinPercent || 10);
        setStoreName(res.data.storeName || "Cart Corner");
        setStoreTagline(res.data.storeTagline || "Your One-Stop Shopping Destination");
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
    } else {
      // Calculate amount before coins: subtotal + taxes - discount
      const amountBeforeCoins = grandTotal + cgstAmount + sgstAmount - discountAmount;
      // Default to using all available coins (up to the amount before coins)
      const maxCoins = Math.min(customerCoins, Math.floor(amountBeforeCoins));
      setCoinAmount(maxCoins);
    }
  };

  // Handle coin amount change
  const handleCoinAmountChange = (value) => {
    const val = parseInt(value) || 0;
    // Calculate amount before coins: subtotal + taxes - discount
    const amountBeforeCoins = grandTotal + cgstAmount + sgstAmount - discountAmount;
    const maxCoins = Math.min(customerCoins, Math.floor(amountBeforeCoins));
    setCoinAmount(Math.min(val, maxCoins));
  };

  // Validate referral contact and get referrer name
const validateReferralContact = async (mobile) => {
  if (!mobile || mobile.length < 10) {
    setReferrerName("");
    setReferrerError("");
    setReferrerCode("");
    return;
  }

  try {
    const res = await axios.get(
      `${base_url}user/search?query=${mobile}`,
      config
    );

    if (res.data && res.data.length > 0) {
      const foundUser = res.data.find(
        (u) => u.mobile === mobile
      );

      if (foundUser) {
        setReferrerName(foundUser.firstname + " " + foundUser.lastname);
        setReferrerCode(foundUser.referralCode || "N/A");
        setReferrerError("");
      } else {
        setReferrerName("");
        setReferrerCode("");
        setReferrerError("Incorrect referral number");
      }
    } else {
      setReferrerName("");
      setReferrerCode("");
      setReferrerError("Incorrect referral number");
    }
  } catch (err) {
    console.error("Referral validation failed:", err);
    setReferrerName("");
    setReferrerCode("");
    setReferrerError("Incorrect referral number");
  }
};

  // Clear referral when customer contact changes (to prevent self-referral)
  useEffect(() => {
    if (customer.contact && customer.referralContact) {
      // If referral contact is same as customer contact, clear it
      if (customer.contact === customer.referralContact) {
        setCustomer(prev => ({ ...prev, referralContact: "" }));
        setReferrerName("");
        setReferrerError("");
        setReferrerCode("");
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
      offerAmt = Math.min(customerOffer.offerDiscount, grandTotal); // Can't exceed total
    }
    setAppliedOfferAmount(offerAmt);
    Swal.fire({
      icon: 'success',
      title: 'Offer Applied!',
      text: `Offer applied: -₹${offerAmt.toFixed(2)}`,
      confirmButtonColor: '#d4af37',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Remove applied offer
  const removeOffer = () => {
    setAppliedOfferAmount(0);
  };

  // Handle spin wheel result
  const handleSpinComplete = async (offer) => {
    setSpinCompleted(true); // IMPORTANT
    if (!customer.contact) return;
    
    try {
      // Save the offer for NEXT order (not current)
      // await axios.put(
      //   `${base_url}user/customer-offer`,
      //   {
      //     mobile: customer.contact,
      //     offerDiscount: offer.value,
      //     offerType: offer.type
      //   },
      //   config
      // );
      
      // Update local state to show offer is now active for next order
      setCustomerOffer({
        hasOffer: offer.type !== "none",
        offerDiscount: offer.value,
        offerType: offer.type
      });
      
      setShowSpinWheel(false);
      
      // Show success message
      if (offer.type !== "none") {
        Swal.fire({
          icon: 'success',
          title: 'Congratulations!',
          text: `Offer won: ${offer.type === "percentage" ? `${offer.value}% OFF` : `₹${offer.value} FLAT OFF`}. This offer will be applicable on your NEXT purchase!`,
          confirmButtonColor: '#d4af37'
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Offer',
          text: 'Better luck next time! No offer this time.',
          confirmButtonColor: '#1a1a1a'
        });
      }
      
      // Now finalize the sale WITHOUT the current offer (offer applies to next order)
      finalizeSaleWithWhatsApp(offer);
      setSpinCompleted(false);
      
    } catch (err) {
      console.error("Failed to save customer offer:", err);
    }
  };

  // Handle complete sale with spin wheel logic
  const handleCompleteSale = () => {
  if (!Object.keys(cart).length) return;

  // If already spun → just finalize
  if (spinCompleted) {
    finalizeSale();
    setSpinCompleted(false);
    return;
  }

  // First time spin - only if showSpinner is enabled
  if (customer.contact && showSpinner) {
    setShowSpinWheel(true);
  } else {
    finalizeSale();
    setSpinCompleted(false);
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

  // Fetch customer offer when customer contact changes
  useEffect(() => {
    if (customer.contact) {
      fetchCustomerOffer(customer.contact);
      fetchCustomerCoins(customer.contact);
    } else {
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setAppliedOfferAmount(0);
      // setCustomerCoins(0);
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
    if (cgstPercent > 0) whatsAppMessage += `CGST (${cgstPercent}%): ₹${cgstAmount.toFixed(2)}\n`;
    if (sgstPercent > 0) whatsAppMessage += `SGST (${sgstPercent}%): ₹${sgstAmount.toFixed(2)}\n`;
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

    try {
      await axios.post(
        `${base_url}user/offline-order`,
        {
          customer,
          items,
          taxPercent: cgstPercent + sgstPercent,
          discount: discountAmount,
          total: payableAmount,
          paymentMethod: "CASH",
          referralContact: customer.referralContact || null,
          coinsUsed: useCoins ? coinAmount : 0,
          coinAmount: useCoins ? coinDiscountAmount : 0
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
      setCustomer({ name: "", address: "", contact: "", referralContact: "" });
      setReferrerName("");
      setReferrerError("");
      setReferrerCode("");
      setCgstPercent(0);
      setSgstPercent(0);
      setDiscountPercent(0);
      setAppliedOfferAmount(0);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setUseCoins(false);
      setCoinAmount(0);
    } catch (err) {
      console.error("Failed to complete sale:", err);
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: 'Failed to complete sale. Please try again.',
        confirmButtonColor: '#1a1a1a'
      });
    }
  };

  /* =========================
     FINALIZE SALE WITH WHATSAPP (Spin Wheel)
     ========================= */
  const finalizeSaleWithWhatsApp = async (wonOffer = null) => {
    const items = Object.entries(cart).map(([barcode, data]) => ({
      barcode,
      quantity: data.qty,
    }));

    if (!items.length) return;

    // Store data for WhatsApp message
    const cartData = { ...cart };
    const customerData = { ...customer };
    const offerData = { ...customerOffer };
    const appliedAmount = appliedOfferAmount;

    try {
      await axios.post(
        `${base_url}user/offline-order`,
        {
          customer,
          items,
          taxPercent: cgstPercent + sgstPercent,
          discount: discountAmount,
          total: payableAmount,
          paymentMethod: "CASH",
          referralContact: customer.referralContact || null,
          coinsUsed: useCoins ? coinAmount : 0,
          coinAmount: useCoins ? coinDiscountAmount : 0
        },
        config
      );

      // Save the won offer for next purchase
      if (wonOffer && customer.contact) {
        await axios.put(
          `${base_url}user/customer-offer`,
          {
            mobile: customer.contact,
            offerDiscount: wonOffer.value,
            offerType: wonOffer.type
          },
          config
        );
      }

      // Generate and send WhatsApp message
      const message = generateWhatsAppMessage(cartData, customerData, offerData, appliedAmount, wonOffer);
      openWhatsApp(message, customerData);

      printBill();
      Swal.fire({
        icon: 'success',
        title: 'Sale Completed',
        text: 'SALE COMPLETED SUCCESSFULLY! Bill sent to WhatsApp!',
        confirmButtonColor: '#d4af37'
      });

      setCart({});
      setCustomer({ name: "", address: "", contact: "", referralContact: "" });
      setReferrerName("");
      setReferrerError("");
      setReferrerCode("");
      setCgstPercent(0);
      setSgstPercent(0);
      setDiscountPercent(0);
      setAppliedOfferAmount(0);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setUseCoins(false);
      setCoinAmount(0);
    } catch (err) {
      console.error("Failed to complete sale:", err);
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: 'Failed to complete sale. Please try again.',
        confirmButtonColor: '#1a1a1a'
      });
    }
  };

  /* =========================
     PRINT BILL - Premium Design (same as PrintBillButton)
     ========================= */
  const printBill = (cartData = cart, customerData = customer, payableAmt = payableAmount, gstinData = gstin, cgstAmt = cgstAmount, sgstAmt = sgstAmount, discountAmt = discountAmount, subtotalAmt = grandTotal) => {
    const activeCart = cartData;
    const activeCustomer = customerData;
    const activePayable = payableAmt;
    const activeGstin = gstinData;
    const activeCgst = cgstAmt;
    const activeSgst = sgstAmt;
    const activeDiscount = discountAmt;
    const activeSubtotal = subtotalAmt;

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
                      <span class="text-gray-600">CGST</span>
                      <span class="text-green-600">+₹${activeCgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeSgst > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">SGST</span>
                      <span class="text-green-600">+₹${activeSgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${activeDiscount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Discount</span>
                      <span class="text-red-600">-₹${activeDiscount.toFixed(2)}</span>
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
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
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 mt-1">
                      {customers.map((cust) => (
                        <div
                          key={cust._id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          onClick={() => {
                            setCustomer({
                              name: cust.firstname + " " + cust.lastname,
                              address: cust.address || "",
                              contact: cust.mobile || "",
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
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 mt-1">
                      {customers.map((cust) => (
                        <div
                          key={cust._id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          onClick={() => {
                            setCustomer({
                              name: cust.firstname + " " + cust.lastname,
                              address: cust.address || "",
                              contact: cust.mobile || "",
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

                {/* Referral Contact Number - Only show if enabled in settings */}
                {showReferralOffer && (
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Referral Contact Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Referral Contact Number (Optional)
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          value={customer.referralContact || ""}
                          placeholder="Enter referrer's contact number..."
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomer({ ...customer, referralContact: value });
                            // Clear previous timeout
                            if (window.referralTimeout) {
                              clearTimeout(window.referralTimeout);
                            }
                            // Validate after user stops typing (debounced - 500ms)
                            if (value.length >= 10) {
                              window.referralTimeout = setTimeout(() => {
                                validateReferralContact(value);
                              }, 500);
                            } else {
                              setReferrerName("");
                              setReferrerError("");
                              setReferrerCode("");
                            }
                          }}
                        />
                      </div>
                      {/* Error Message */}
                      {referrerError && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {referrerError}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        If someone referred this customer, enter their mobile number
                      </p>
                    </div>

                    {/* Right: Referrer Info (Non-editable) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Referrer Details
                      </label>
                      {referrerName ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <FaUser className="text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              {referrerName}
                            </span>
                          </div>
                          {referrerCode && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600">Referral Code:</span>
                              <span className="text-sm font-bold text-green-700">{referrerCode}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                          <p className="text-sm text-gray-400">Enter referrer's contact number</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}

                
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-200">Tax</span>
                  <span className="text-sm">+₹{(cgstAmount + sgstAmount).toFixed(2)}</span>
                </div>
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
                  discountAmount={discountAmount}
                  gstin={gstin}
                />
                <button
                  onClick={handleCompleteSale}
                  disabled={!Object.keys(cart).length}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCheckCircle />
                  Complete Sale
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaGift className="text-amber-500" />
                      <span className="text-sm font-medium text-amber-700">Available Offer</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-amber-600">
                    {customerOffer.offerType === "percentage" 
                      ? `${customerOffer.offerDiscount}% OFF` 
                      : `₹${customerOffer.offerDiscount} FLAT OFF`}
                  </p>
                  <button
                    onClick={applyOffer}
                    disabled={grandTotal === 0}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Offer
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
          onClose={() => setShowSpinWheel(false)}
          onSpinComplete={handleSpinComplete}
          purchaseAmount={grandTotal}
        />
      )}
    </div>
  );
};

export default LiveBilling;

