import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import { Modal, Input } from "antd";
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
  FaTag
} from "react-icons/fa";
import SpinWheel from "../components/SpinWheel";

const LiveBilling = () => {
  const [buffer, setBuffer] = useState("");
  const [cart, setCart] = useState({});

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
    contact: ""
  });

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

  // Store info
  const [storeName] = useState("Cart Corner");
  const [storeTagline] = useState("Your One-Stop Shopping Destination");

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

  const payableAmount = useMemo(
    () => grandTotal + cgstAmount + sgstAmount - discountAmount,
    [grandTotal, cgstAmount, sgstAmount, discountAmount]
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
          },
        };
      });
    } catch {
      alert(`Product not found for barcode: ${barcode}`);
    }

    setBuffer("");
  };

  /* =========================
     QTY CONTROLS
     ========================= */
  const increaseQty = (barcode) => {
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

    const handleKeyDown = async (e) => {
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
              },
            };
          });
        } catch {
          alert(`Product not found for barcode: ${barcode}`);
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      alert("Failed to save GSTIN. Please try again.");
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
    alert(`Offer applied: -₹${offerAmt.toFixed(2)}`);
  };

  // Remove applied offer
  const removeOffer = () => {
    setAppliedOfferAmount(0);
  };

  // Handle spin wheel result
  const handleSpinComplete = async (offer) => {
    if (!customer.contact) return;
    
    try {
      // Save the offer for NEXT order (not current)
      await axios.put(
        `${base_url}user/customer-offer`,
        {
          mobile: customer.contact,
          offerDiscount: offer.value,
          offerType: offer.type
        },
        config
      );
      
      // Update local state to show offer is now active for next order
      setCustomerOffer({
        hasOffer: offer.type !== "none",
        offerDiscount: offer.value,
        offerType: offer.type
      });
      
      setShowSpinWheel(false);
      
      // Show success message
      if (offer.type !== "none") {
        alert(`Offer won: ${offer.type === "percentage" ? `${offer.value}% OFF` : `₹${offer.value} FLAT OFF`}\nThis offer will be applicable on your NEXT purchase!`);
      } else {
        alert("Better luck next time! No offer this time.");
      }
      
      // Now finalize the sale WITHOUT the current offer (offer applies to next order)
      finalizeSaleWithWhatsApp(offer);
      
    } catch (err) {
      console.error("Failed to save customer offer:", err);
    }
  };

  // Handle complete sale with spin wheel logic
  const handleCompleteSale = () => {
    // ALWAYS show spin wheel for every customer with mobile number
    // The offer won will apply to NEXT order
    if (customer.contact && Object.keys(cart).length > 0) {
      setShowSpinWheel(true);
    } else {
      // For walk-in customers (no contact), proceed normally
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

  // Fetch customer offer when customer contact changes
  useEffect(() => {
    if (customer.contact) {
      fetchCustomerOffer(customer.contact);
    } else {
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
      setAppliedOfferAmount(0);
    }
  }, [customer.contact]);

  /* =========================
     FINALIZE SALE
     ========================= */
  const finalizeSale = async () => {
    const items = Object.entries(cart).map(([barcode, data]) => ({
      barcode,
      quantity: data.qty,
    }));

    if (!items.length) return;

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
      if (customer.contact) {
        sendWhatsAppMessage();
      } else {
        printBill();
        alert("SALE COMPLETED SUCCESSFULLY!");
      }

      setCart({});
      setCustomer({ name: "", address: "", contact: "" });
      setCgstPercent(0);
      setSgstPercent(0);
      setDiscountPercent(0);
      setAppliedOfferAmount(0);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
    } catch (err) {
      console.error("Failed to complete sale:", err);
      alert("Failed to complete sale. Please try again.");
    }
  };

  /* =========================
     SEND WHATSAPP MESSAGE
     ========================= */
  const sendWhatsAppMessage = (wonOffer = null) => {
    // Generate WhatsApp message
    let whatsAppMessage = `🧾 *Bill Receipt - ${storeName}*\n\n`;
    whatsAppMessage += `Customer: ${customer.name || "Walk-in Customer"}\n`;
    if (customer.contact) whatsAppMessage += `Mobile: ${customer.contact}\n`;
    whatsAppMessage += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
    whatsAppMessage += `Time: ${new Date().toLocaleTimeString()}\n\n`;
    whatsAppMessage += `*Items:*\n`;
    
    Object.values(cart).forEach((item) => {
      whatsAppMessage += `• ${item.name} x${item.qty} = ₹${(item.qty * item.price).toFixed(2)}\n`;
    });
    
    whatsAppMessage += `\n─────────────\n`;
    whatsAppMessage += `Subtotal: ₹${grandTotal.toFixed(2)}\n`;
    if (cgstPercent > 0) whatsAppMessage += `CGST (${cgstPercent}%): ₹${cgstAmount.toFixed(2)}\n`;
    if (sgstPercent > 0) whatsAppMessage += `SGST (${sgstPercent}%): ₹${sgstAmount.toFixed(2)}\n`;
    if (discountPercent > 0) whatsAppMessage += `Additional Discount: -₹${((grandTotal * discountPercent) / 100).toFixed(2)}\n`;
    if (appliedOfferAmount > 0) whatsAppMessage += `Customer Offer: -₹${appliedOfferAmount.toFixed(2)}\n`;
    whatsAppMessage += `*Total: ₹${payableAmount.toFixed(2)}*\n`;
    whatsAppMessage += `─────────────\n\n`;
    
    // Add offer message for NEXT purchase (if won)
    if (wonOffer && wonOffer.type !== "none") {
      const offerText = wonOffer.type === "percentage" 
        ? `${wonOffer.value}% OFF` 
        : `₹${wonOffer.value} FLAT OFF`;
      whatsAppMessage += `🎁 *SPECIAL OFFER FOR NEXT PURCHASE!*\n`;
      whatsAppMessage += `You won: *${offerText}*\n`;
      whatsAppMessage += `Use this offer on your next visit!\n\n`;
    } else if (customerOffer.hasOffer) {
      // Show existing offer if customer has one
      const offerText = customerOffer.offerType === "percentage" 
        ? `${customerOffer.offerDiscount}% OFF` 
        : `₹${customerOffer.offerDiscount} FLAT OFF`;
      whatsAppMessage += `🎁 *YOUR OFFER*\n`;
      whatsAppMessage += `Current offer: *${offerText}*\n`;
      whatsAppMessage += `Offer applied: -₹${appliedOfferAmount.toFixed(2)}\n\n`;
    }
    
    whatsAppMessage += `Thank you for shopping with us! 🙏\n`;
    whatsAppMessage += `${storeTagline}`;

    // Encode message for WhatsApp
    const encodedMessage = encodeURIComponent(whatsAppMessage);
    
    // Open WhatsApp with pre-filled message
    const phoneNumber = customer.contact ? customer.contact.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = phoneNumber 
      ? `https://wa.me/91${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    printBill();
    alert("SALE COMPLETED SUCCESSFULLY!\nBill sent to WhatsApp!");
  };

  /* =========================
     FINALIZE SALE WITH WHATSAPP
     ========================= */
  const finalizeSaleWithWhatsApp = async (wonOffer = null) => {
    const items = Object.entries(cart).map(([barcode, data]) => ({
      barcode,
      quantity: data.qty,
    }));

    if (!items.length) return;

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
        },
        config
      );

      // Generate WhatsApp message
      let whatsAppMessage = `🧾 *Bill Receipt - ${storeName}*\n\n`;
      whatsAppMessage += `Customer: ${customer.name || "Walk-in Customer"}\n`;
      if (customer.contact) whatsAppMessage += `Mobile: ${customer.contact}\n`;
      whatsAppMessage += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
      whatsAppMessage += `Time: ${new Date().toLocaleTimeString()}\n\n`;
      whatsAppMessage += `*Items:*\n`;
      
      Object.values(cart).forEach((item) => {
        whatsAppMessage += `• ${item.name} x${item.qty} = ₹${(item.qty * item.price).toFixed(2)}\n`;
      });
      
      whatsAppMessage += `\n─────────────\n`;
      whatsAppMessage += `Subtotal: ₹${grandTotal.toFixed(2)}\n`;
      if (cgstPercent > 0) whatsAppMessage += `CGST (${cgstPercent}%): ₹${cgstAmount.toFixed(2)}\n`;
      if (sgstPercent > 0) whatsAppMessage += `SGST (${sgstPercent}%): ₹${sgstAmount.toFixed(2)}\n`;
      if (discountPercent > 0) whatsAppMessage += `Additional Discount: -₹${((grandTotal * discountPercent) / 100).toFixed(2)}\n`;
      whatsAppMessage += `*Total: ₹${payableAmount.toFixed(2)}*\n`;
      whatsAppMessage += `─────────────\n\n`;
      
      // Add offer message for NEXT purchase
      if (wonOffer && wonOffer.type !== "none") {
        const offerText = wonOffer.type === "percentage" 
          ? `${wonOffer.value}% OFF` 
          : `₹${wonOffer.value} FLAT OFF`;
        whatsAppMessage += `🎁 *SPECIAL OFFER FOR NEXT PURCHASE!*\n`;
        whatsAppMessage += `You won: *${offerText}*\n`;
        whatsAppMessage += `Use this offer on your next visit!\n\n`;
      }
      
      whatsAppMessage += `Thank you for shopping with us! 🙏\n`;
      whatsAppMessage += `${storeTagline}`;

      // Encode message for WhatsApp
      const encodedMessage = encodeURIComponent(whatsAppMessage);
      
      // Open WhatsApp with pre-filled message
      const phoneNumber = customer.contact ? customer.contact.replace(/[^0-9]/g, '') : '';
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/91${phoneNumber}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');

      printBill();
      alert("SALE COMPLETED SUCCESSFULLY!\nBill sent to WhatsApp!");

      setCart({});
      setCustomer({ name: "", address: "", contact: "" });
      setCgstPercent(0);
      setSgstPercent(0);
      setDiscountPercent(0);
      setAppliedOfferAmount(0);
      setCustomerOffer({ hasOffer: false, offerDiscount: 0, offerType: "" });
    } catch (err) {
      console.error("Failed to complete sale:", err);
      alert("Failed to complete sale. Please try again.");
    }
  };

  /* =========================
     PRINT BILL
     ========================= */
  const printBill = () => {
    if (!Object.keys(cart).length) {
      alert("Cart is empty");
      return;
    }

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 6px 0; }
            .right { text-align: right; }
            .total { border-top: 1px dashed #000; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2 align="center">${storeName}</h2>
          <p>Customer: ${customer.name || "Walk-in Customer"}</p>
          <p>Address: ${customer.address || "-"}</p>
          ${gstin ? `<p>GSTIN: ${gstin}</p>` : ''}

          <table>
            <tr><th>Item</th><th class="right">Qty</th><th class="right">₹</th></tr>
            ${Object.values(cart)
              .map(
                (i) =>
                  `<tr><td>${i.name}</td><td class="right">${i.qty}</td><td class="right">${i.qty * i.price}</td></tr>`
              )
              .join("")}
            <tr class="total">
              <td>Total</td><td></td><td class="right">₹ ${payableAmount.toFixed(2)}</td>
            </tr>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* PREMIUM HEADER */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 rounded-2xl shadow-2xl p-6 mb-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
              <FaShoppingCart className="text-3xl text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {storeName}
              </h1>
              <p className="text-indigo-200 text-sm">{storeTagline}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex gap-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
              <FaCalendarAlt className="text-amber-400" />
              <div>
                <p className="text-xs text-indigo-200">Date</p>
                <p className="font-semibold">{new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
              <FaClock className="text-amber-400" />
              <div>
                <p className="text-xs text-indigo-200">Time</p>
                <p className="font-semibold">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                      value={searchTerm}
                      placeholder="Search customer..."
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
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
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      value={contactSearch}
                      placeholder="Search by phone..."
                      onChange={(e) => {
                        setContactSearch(e.target.value);
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

                {/* GSTIN */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    GSTIN (Tax Registration)
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          value={gstin}
                          placeholder="GSTIN not set"
                          readOnly
                        />
                      </div>
                    </div>
                    <button
                      onClick={openGstinModal}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                      {gstin ? "Edit GSTIN" : "Add GSTIN"}
                    </button>
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

              {/* CGST */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-200">CGST</span>
                  <span className="font-semibold">₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-white placeholder-white/50"
                    value={cgstPercent}
                    onChange={(e) => setCgstPercent(clampNonNegative(e.target.value))}
                  />
                  <span className="text-indigo-200">%</span>
                </div>
              </div>

              {/* SGST */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-200">SGST</span>
                  <span className="font-semibold">₹{sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-white placeholder-white/50"
                    value={sgstPercent}
                    onChange={(e) => setSgstPercent(clampNonNegative(e.target.value))}
                  />
                  <span className="text-indigo-200">%</span>
                </div>
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
                <div className="flex justify-between items-center mb-4">
                  <span className="text-indigo-200">Discount</span>
                  <span className="text-sm text-green-400">-₹{discountAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payable Amount */}
              <div className="bg-amber-500 rounded-xl p-4 text-center">
                <p className="text-amber-100 text-sm mb-1">Payable Amount</p>
                <p className="text-4xl font-bold text-white">₹{payableAmount.toFixed(2)}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={printBill}
                  disabled={!Object.keys(cart).length}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPrint />
                  Print / Download Bill
                </button>
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
      <SpinWheel 
        isOpen={showSpinWheel} 
        onClose={() => setShowSpinWheel(false)}
        onSpinComplete={handleSpinComplete}
        purchaseAmount={grandTotal}
      />
    </div>
  );
};

export default LiveBilling;

