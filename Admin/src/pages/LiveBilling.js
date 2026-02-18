import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const LiveBilling = () => {
  // const inputRef = useRef(null);

  const [buffer, setBuffer] = useState("");
  const [cart, setCart] = useState({});

  const [cgstPercent, setCgstPercent] = useState(0);
const [sgstPercent, setSgstPercent] = useState(0);
const [discountPercent, setDiscountPercent] = useState(0);

const clampNonNegative = (v) => {
  if (v === "" || isNaN(v)) return 0;
  return Math.max(0, Number(v));
};



  const [customer, setCustomer] = useState({
    name: "",
    address: "",
  });

  const [taxPercent, setTaxPercent] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [customers, setCustomers] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [showDropdown, setShowDropdown] = useState(false);


  /* =========================
     AUTO FOCUS SCANNER INPUT
     ========================= */







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

  const taxAmount = useMemo(() => {
    return (grandTotal * taxPercent) / 100;
  }, [grandTotal, taxPercent]);

  const finalTotal = useMemo(() => {
    return grandTotal + taxAmount - discount;
  }, [grandTotal, taxAmount, discount]);

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
  
  useEffect(() => {
  let scanBuffer = "";
  let scanTimeout = null;

  const isValidChar = (key) => {
    // allow numbers, letters, dash
    return /^[a-zA-Z0-9\-]$/.test(key);
  };

  const handleKeyDown = async (e) => {
    const activeTag = document.activeElement.tagName;

    // 🚫 Ignore typing inside inputs
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

    // 🚫 Ignore modifier keys
    if (
      e.key === "Shift" ||
      e.key === "Alt" ||
      e.key === "Control" ||
      e.key === "Meta"
    ) {
      return;
    }

    // ✅ Scanner finishes with Enter
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

    // ✅ Accept only valid barcode characters
    if (isValidChar(e.key)) {
      scanBuffer += e.key;
    }

    // 🕒 Reset buffer if delay occurs (human typing)
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      scanBuffer = "";
    }, 80);
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);


useEffect(() => {
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${base_url}user/all-users`, config);
      setCustomers(res.data.filter(u => u.role !== "admin"));
    } catch (err) {
      console.error("Failed to fetch customers");
    }
  };

  fetchCustomers();
}, []);



const filteredCustomers = useMemo(() => {
  if (!searchTerm) return [];
  return customers.filter((c) =>
    `${c.firstname} ${c.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
}, [searchTerm, customers]);


  /* =========================
     FINALIZE SALE
     ========================= */
  const finalizeSale = async () => {
    const items = Object.entries(cart).map(([barcode, data]) => ({
      barcode,
      quantity: data.qty,
    }));

    if (!items.length) return;

    await axios.post(
      `${base_url}user/offline-order`,
      {
        customer,
        items,
        taxPercent,
        discount,
        total: finalTotal,
        paymentMethod: "CASH",
      },
      config
    );

    printBill();
    alert("SALE COMPLETED");

    setCart({});
    setCustomer({ name: "", address: "" });
    setTaxPercent(0);
    setDiscount(0);
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
          <h2 align="center">STORE BILL</h2>
          <p>Customer: ${customer.name}</p>
          <p>Address: ${customer.address}</p>

          <table>
            <tr><th>Item</th><th class="right">Qty</th><th class="right">₹</th></tr>
            ${Object.values(cart)
              .map(
                (i) =>
                  `<tr><td>${i.name}</td><td class="right">${i.qty}</td><td class="right">${i.qty * i.price}</td></tr>`
              )
              .join("")}
            <tr class="total">
              <td>Total</td><td></td><td class="right">₹ ${finalTotal}</td>
            </tr>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => win.print(), 300);
  };




const cgstAmount = useMemo(
  () => (grandTotal * cgstPercent) / 100,
  [grandTotal, cgstPercent]
);

const sgstAmount = useMemo(
  () => (grandTotal * sgstPercent) / 100,
  [grandTotal, sgstPercent]
);

const discountAmount = useMemo(
  () => (grandTotal * discountPercent) / 100,
  [grandTotal, discountPercent]
);

const payableAmount = useMemo(
  () => grandTotal + cgstAmount + sgstAmount - discountAmount,
  [grandTotal, cgstAmount, sgstAmount, discountAmount]
);


  /* =========================
     UI
     ========================= */
  return (
    <div className="p-6 min-w-[900px] bg-gray-50">
  <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
    🧾 Live Billing
  </h1>


      {/* CUSTOMER */}
     {/* CUSTOMER DETAILS */}
     


<div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
  <div className="flex gap-8">

    {/* LEFT – Customer (66%) */}
    <div className="w-2/3 space-y-4">
      <h2 className="font-semibold text-sm text-gray-600">
        Customer Details
      </h2>

      {/* <div>
        <label className="text-xs font-medium">Customer Name</label>
        <input
          className="w-[4/5] border-b border-gray-300 focus:border-black outline-none py-1"
          value={customer.name}
          onChange={(e) =>
            setCustomer({ ...customer, name: e.target.value })
          }
        />
      </div> */}

      

      {/* <div>
        <label className="text-xs font-medium">Address</label>
        <input
          className="w-[4/5] border-b border-gray-300 focus:border-black outline-none py-1"
          value={customer.address}
          onChange={(e) =>
            setCustomer({ ...customer, address: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-xs font-medium">Contact</label>
        <input
          className="w-[4/5] border-b border-gray-300 focus:border-black outline-none py-1"
        />
      </div> */}

      <div className="space-y-2">
  {/* <div className="flex items-end gap-3">
    <label className="w-24 text-xs font-medium">Name</label>
    <input
      className="flex-1 border-b border-gray-300 focus:border-black outline-none py-1"
      value={customer.name}
      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
    />
  </div> */}

  <div className="flex items-end gap-3 relative">
  <label className="w-24 text-xs font-medium">Name</label>

  <input
    className="flex-1 border-b border-gray-300 focus:border-black outline-none py-1"
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setShowDropdown(true);
    }}
    onFocus={() => setShowDropdown(true)}
  />

  {showDropdown && filteredCustomers.length > 0 && (
    <div className="absolute top-8 left-24 w-[300px] bg-white border rounded shadow-md max-h-40 overflow-y-auto z-50">
      {filteredCustomers.map((cust) => (
        <div
          key={cust._id}
          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
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
          {cust.firstname} {cust.lastname}
        </div>
      ))}
    </div>
  )}
</div>


  <div className="flex items-end gap-3">
    <label className="w-24 text-xs font-medium">Address</label>
    <input
      className="flex-1 border-b border-gray-300 focus:border-black outline-none py-1"
      value={customer.address}
      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
    />
  </div>

  <div className="flex items-end gap-3">
    <label className="w-24 text-xs font-medium">Contact</label>
    <input
      className="flex-1 border-b border-gray-300 focus:border-black outline-none py-1"
      value={customer.contact}
      onChange={(e) => setCustomer({ ...customer, contact: e.target.value })}
    />
  </div>
</div>

    </div>

    {/* RIGHT – Date / Time (34%) */}
    <div className="w-1/3 text-right text-sm">
      <div className="text-gray-500">Date</div>
      <div className="font-medium">
        {new Date().toLocaleDateString()}
      </div>

      <div className="mt-3 text-gray-500">Time</div>
      <div className="font-medium">
        {new Date().toLocaleTimeString()}
      </div>
    </div>

  </div>
</div>



      {/* SCANNER */}
    

      {/* TABLE */}
      {/* ITEMS TABLE */}

     <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
  <table className="w-full text-sm">
    <thead className="bg-gray-100 text-gray-700">
      <tr>
        <th className="p-3 w-[5%]">#</th>
        <th className="p-3 w-[25%]">Product</th>
        <th className="p-3 w-[20%]">Barcode</th>
        <th className="p-3 text-right w-[15%]">Price</th>
        <th className="p-3 text-center w-[15%]">Qty</th>
        <th className="p-3 text-right w-[20%]">Total</th>
      </tr>
    </thead>

    <tbody>
      {Object.entries(cart).map(([barcode, item], i) => (
        <tr key={barcode} className="border-t">
          <td className="p-3">{i + 1}</td>

          <td className="p-3 font-medium">
            {item.name}
          </td>

          <td className="p-3 text-xs text-gray-500">
            {barcode}
          </td>

          <td className="p-3 text-right">
            ₹ {item.price.toFixed(2)}
          </td>

          <td className="p-3 text-center">
            <div className="inline-flex items-center gap-2">
              <button
                className="w-6 h-6 border rounded-full hover:bg-gray-100"
                onClick={() => decreaseQty(barcode)}
              >
                −
              </button>

              <span className="min-w-[20px] text-center">
                {item.qty}
              </span>

              <button
                className="w-6 h-6 border rounded-full hover:bg-gray-100"
                onClick={() => increaseQty(barcode)}
              >
                +
              </button>
            </div>
          </td>

          <td className="p-3 text-right font-semibold">
            ₹ {(item.qty * item.price).toFixed(2)}
          </td>
        </tr>
      ))}

      {!Object.keys(cart).length && (
        <tr>
          <td
            colSpan={6}
            className="p-6 text-center text-gray-400"
          >
            Scan items to start billing
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


{/* <div className="border border-black">
  <table className="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th className="border border-black p-2 text-left w-[5%]">#</th>
        <th className="border border-black p-2 text-left w-[30%]">Product</th>
        <th className="border border-black p-2 text-left w-[20%]">Barcode</th>
        <th className="border border-black p-2 text-right w-[15%]">Price</th>
        <th className="border border-black p-2 text-center w-[15%]">Qty</th>
        <th className="border border-black p-2 text-right w-[15%]">Total</th>
      </tr>
    </thead>

    <tbody>
      {Object.entries(cart).map(([barcode, item], i) => (
        <tr key={barcode}>
          <td className="border border-black p-2">{i + 1}</td>
          <td className="border border-black p-2">{item.name}</td>
          <td className="border border-black p-2">{barcode}</td>
          <td className="border border-black p-2 text-right">
            ₹ {item.price.toFixed(2)}
          </td>
          <td className="border border-black p-2 text-center">
            <button
              className="px-2 border border-black rounded-full"
              onClick={() => decreaseQty(barcode)}
            >
              -
            </button>
            <span className="mx-2">{item.qty}</span>
            <button
              className="px-2 border border-black rounded-full"
              onClick={() => increaseQty(barcode)}
            >
              +
            </button>
          </td>
          <td className="border border-black p-2 text-right">
            ₹ {(item.qty * item.price).toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div> */}




      {/* TAX */}
     {/* BILL SUMMARY */}
{/* BILL SUMMARY – HORIZONTAL */}
{/* BILL SUMMARY – HORIZONTAL */}




<div className="bg-white rounded-xl shadow-sm border p-4">
  <table className="w-full text-sm text-center mb-4">
    <thead className="text-gray-600">
      <tr>
        <th>Total</th>
        <th>CGST %</th>
        <th>CGST ₹</th>
        <th>SGST %</th>
        <th>SGST ₹</th>
        <th>Disc %</th>
        <th>Disc ₹</th>
        <th>Payable</th>
      </tr>
    </thead>

    <tbody>
      <tr className="font-medium">
        <td>₹ {grandTotal.toFixed(2)}</td>

        <td>
          {/* <input
            type="number"
            className="w-16 text-center border rounded"
            value={cgstPercent}
            onChange={(e) => setCgstPercent(+e.target.value)}
          /> */}

          <input
  type="number"
  min={0}
  step={1}
  className="w-16 text-center border rounded"
  value={cgstPercent}
  onChange={(e) => setCgstPercent(clampNonNegative(e.target.value))}
/>

        </td>

        <td>₹ {cgstAmount.toFixed(2)}</td>

        <td>
         <input
  type="number"
  min={0}
  step={1}
  className="w-16 text-center border rounded"
  value={sgstPercent}
  onChange={(e) => setSgstPercent(clampNonNegative(e.target.value))}
/>

        </td>

        <td>₹ {sgstAmount.toFixed(2)}</td>

        <td>
          <input
  type="number"
  min={0}
  step={1}
  className="w-16 text-center border rounded"
  value={discountPercent}
  onChange={(e) => setDiscountPercent(clampNonNegative(e.target.value))}
/>

        </td>

        <td>₹ {discountAmount.toFixed(2)}</td>

        <td className="text-lg font-bold">
          ₹ {payableAmount.toFixed(2)}
        </td>
      </tr>
    </tbody>
  </table>

  {/* ACTION BUTTONS */}
  <div className="flex justify-end gap-3">
    <button
      onClick={printBill}
      className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
    >
      🖨️ Print / Download Bill
    </button>

    <button
      onClick={finalizeSale}
      className="px-5 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-900"
    >
      ✅ Complete Sale
    </button>
  </div>
</div>





    </div>
  );
};

export default LiveBilling;
