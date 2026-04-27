import React from "react";
import { Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const PrintBillButton = ({
  cart,
  customer,
  payableAmount,
  cgstAmount = 0,
  sgstAmount = 0,
  igstAmount = 0,
  gstType = "CGST_SGST",
  cgstPercent = 0,
  sgstPercent = 0,
  igstPercent = 0,
  discountAmount = 0,
  coinDiscountAmount = 0,
  coinsUsed = 0,
  subtotal = 0,
  invoiceNumber = null,
  gstin = "",
  storeName = "Yashoda Fashion",
  storeTagline = "Your One-Stop Shopping Destination",
  paymentMethod = "CASH",
  paymentDestination = "CURRENT_ACCOUNT",
}) => {
  const printBill = async () => {
    if (!cart || !Object.keys(cart).length) {
      Swal.fire({ icon: "warning", title: "Cart is Empty", text: "Please add items to the cart before printing.", confirmButtonColor: "#d4af37" });
      return;
    }

    // Fetch store settings for address/phone
    let storeAddress = "";
    let storePhone = "";
    let fetchedStoreName = storeName;
    try {
      const settingsRes = await axios.get(`${base_url}user/settings`, config);
      storeAddress = settingsRes.data.storeAddress || "";
      storePhone = settingsRes.data.storePhone || "";
      fetchedStoreName = settingsRes.data.storeName || storeName;
    } catch (_) {}

    const win = window.open("", "_blank");
    if (!win) return;

    const invoiceNum = invoiceNumber || (() => {
      const d = new Date();
      const r = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return `INV-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,"0")}${d.getDate().toString().padStart(2,"0")}-${r}`;
    })();

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const gstTotal = cgstAmount + sgstAmount + igstAmount;
    const taxIncluded = true; // LiveBilling always uses tax-included mode
    const totalDiscount = discountAmount + coinDiscountAmount;
    const displayCoinsUsed = coinsUsed || coinDiscountAmount;

    const paymentLabel =
      paymentMethod === "CASH" || paymentDestination === "CASH"
        ? "💵 Cash"
        : paymentDestination === "OTHER_ACCOUNT"
        ? "🏦 Online (Other Account)"
        : "💳 Online (Current Account)";

    const paymentColor =
      paymentMethod === "CASH" || paymentDestination === "CASH"
        ? "#d97706"
        : paymentDestination === "OTHER_ACCOUNT"
        ? "#7c3aed"
        : "#059669";

    const itemRows = Object.values(cart).map((item, i) => `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:10px 8px;color:#666;font-size:13px">${i + 1}</td>
        <td style="padding:10px 8px;font-size:13px;font-weight:600">${item.name}</td>
        <td style="padding:10px 8px;font-size:12px;color:#888;font-family:monospace">-</td>
        <td style="padding:10px 8px;text-align:center;font-size:13px">${item.qty}</td>
        <td style="padding:10px 8px;text-align:right;font-size:13px">₹${item.price.toFixed(2)}</td>
        <td style="padding:10px 8px;text-align:right;font-size:13px;font-weight:700">₹${(item.qty * item.price).toFixed(2)}</td>
      </tr>`).join("");

    const gstRows = gstTotal > 0
      ? (gstType === "IGST"
        ? `<tr><td colspan="5" style="padding:6px 8px;color:#15803d;font-size:12px">✅ IGST (${igstPercent}%) — included in price</td><td style="padding:6px 8px;text-align:right;color:#15803d;font-size:12px">₹${igstAmount.toFixed(2)}</td></tr>`
        : `<tr><td colspan="5" style="padding:6px 8px;color:#15803d;font-size:12px">✅ CGST (${cgstPercent}%) — included in price</td><td style="padding:6px 8px;text-align:right;color:#15803d;font-size:12px">₹${cgstAmount.toFixed(2)}</td></tr>
           <tr><td colspan="5" style="padding:6px 8px;color:#15803d;font-size:12px">✅ SGST (${sgstPercent}%) — included in price</td><td style="padding:6px 8px;text-align:right;color:#15803d;font-size:12px">₹${sgstAmount.toFixed(2)}</td></tr>`)
      : "";

    const discountRows = [
      discountAmount > 0 ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">💰 Discount</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">-₹${discountAmount.toFixed(2)}</td></tr>` : "",
      coinDiscountAmount > 0 ? `<tr><td style="padding:6px 8px;color:#7c3aed;font-size:13px">🪙 Coin Discount (${displayCoinsUsed} coins)</td><td style="padding:6px 8px;text-align:right;color:#7c3aed;font-size:13px">-₹${coinDiscountAmount.toFixed(2)}</td></tr>` : "",
    ].join("");

    win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${invoiceNum}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px}.page{max-width:720px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}@media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}.no-print{display:none}}</style>
</head><body>
<div class="page">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px">${fetchedStoreName}</div>
      ${storeAddress ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px;max-width:280px">${storeAddress}</div>` : ""}
      ${storePhone ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">📞 ${storePhone}</div>` : ""}
      ${gstin ? `<div style="font-size:11px;color:#64748b;margin-top:4px;font-family:monospace">GSTIN: ${gstin}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div style="font-size:22px;font-weight:900;color:#818cf8;letter-spacing:1px">INVOICE</div>
      <div style="font-size:14px;color:#94a3b8;margin-top:4px;font-family:monospace">#${invoiceNum}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">${dateStr}</div>
      <div style="margin-top:8px;background:#059669;color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block">POS Sale</div>
    </div>
  </div>

  <div style="display:flex;gap:0;border-bottom:1px solid #f0f0f0">
    <div style="flex:1;padding:20px 32px;border-right:1px solid #f0f0f0">
      <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Bill To</div>
      <div style="font-weight:700;font-size:15px;color:#0f172a">${customer.name || "Walk-in Customer"}</div>
      ${customer.mobile ? `<div style="font-size:13px;color:#64748b;margin-top:4px">📞 ${customer.mobile}</div>` : ""}
      ${customer.address ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">${customer.address}</div>` : ""}
    </div>
    <div style="flex:1;padding:20px 32px">
      <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Payment</div>
      <div style="font-size:14px;font-weight:700;color:${paymentColor}">${paymentLabel}</div>
      <div style="font-size:12px;color:#64748b;margin-top:6px">Date: ${dateStr}</div>
    </div>
  </div>

  <div style="padding:0 32px">
    <table style="width:100%;border-collapse:collapse;margin-top:20px">
      <thead>
        <tr style="background:#0f172a;color:#e2e8f0">
          <th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">#</th>
          <th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">ITEM</th>
          <th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">HSN</th>
          <th style="padding:12px 8px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.5px">QTY</th>
          <th style="padding:12px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px">RATE</th>
          <th style="padding:12px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div style="padding:16px 32px 28px">
    <table style="width:100%;border-collapse:collapse;margin-left:auto;max-width:320px">
      <tr><td style="padding:6px 8px;color:#64748b;font-size:13px">Subtotal</td><td style="padding:6px 8px;text-align:right;font-size:13px">₹${subtotal.toFixed(2)}</td></tr>
      ${discountRows}
      ${gstRows}
      <tr style="border-top:2px solid #0f172a">
        <td style="padding:12px 8px;font-size:17px;font-weight:900;color:#0f172a">TOTAL</td>
        <td style="padding:12px 8px;text-align:right;font-size:17px;font-weight:900;color:#6366f1">₹${payableAmount.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
    <div>
      <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Payment</span>
      <span style="margin-left:10px;font-size:13px;font-weight:700;color:${paymentColor}">${paymentLabel}</span>
    </div>
  </div>

  <div style="padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0">
    <div style="font-size:12px;color:#94a3b8">Thank you for shopping with <strong>${fetchedStoreName}</strong> 🛍️</div>
    <div style="font-size:11px;color:#cbd5e1;margin-top:4px">This is a computer-generated invoice. No signature required.</div>
  </div>

  <div class="no-print" style="padding:16px 32px;text-align:center;background:#f8fafc">
    <button onclick="window.print()" style="background:#6366f1;color:#fff;border:none;padding:10px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Print Invoice</button>
  </div>
</div>
</body></html>`);

    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  return (
    <Button
      icon={<PrinterOutlined />}
      onClick={printBill}
      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg h-10 font-medium shadow-md hover:shadow-lg transition-all duration-200 border-0"
    >
      Print Bill
    </Button>
  );
};

export default PrintBillButton;
