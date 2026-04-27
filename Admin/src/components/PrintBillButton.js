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
      <tr>
        <td style="text-align:left;color:#94a3b8">${i + 1}</td>
        <td><span class="item-name">${item.name}</span></td>
        <td style="text-align:center;font-weight:600">${item.qty}</td>
        <td style="text-align:right;color:#64748b">₹${item.price.toFixed(2)}</td>
        <td style="text-align:right;font-weight:800;color:#4f46e5">₹${(item.qty * item.price).toFixed(2)}</td>
      </tr>`).join("");

    const gstRows = gstTotal > 0
      ? (gstType === "IGST"
        ? `<tr><td style="color:#15803d;font-size:12px">IGST (${igstPercent}%) incl.</td><td style="text-align:right;color:#15803d;font-size:12px">₹${igstAmount.toFixed(2)}</td></tr>`
        : `<tr><td style="color:#15803d;font-size:12px">CGST (${cgstPercent}%) incl.</td><td style="text-align:right;color:#15803d;font-size:12px">₹${cgstAmount.toFixed(2)}</td></tr>
           <tr><td style="color:#15803d;font-size:12px">SGST (${sgstPercent}%) incl.</td><td style="text-align:right;color:#15803d;font-size:12px">₹${sgstAmount.toFixed(2)}</td></tr>`)
      : "";

    const discountRows = [
      discountAmount > 0 ? `<tr><td style="color:#16a34a;font-size:13px">🏷️ Discount</td><td style="text-align:right;color:#16a34a;font-size:13px">-₹${discountAmount.toFixed(2)}</td></tr>` : "",
      coinDiscountAmount > 0 ? `<tr><td style="color:#7c3aed;font-size:13px">🪙 Coins (${displayCoinsUsed})</td><td style="text-align:right;color:#7c3aed;font-size:13px">-₹${coinDiscountAmount.toFixed(2)}</td></tr>` : "",
    ].join("");

    win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${invoiceNum}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;display:flex;justify-content:center;padding:30px 16px}
.page{width:680px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.13)}
.header{background:linear-gradient(135deg,#1e1b4b 0%,#3730a3 60%,#4f46e5 100%);padding:32px 36px;display:flex;justify-content:space-between;align-items:flex-start}
.store-name{font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px}
.store-sub{font-size:12px;color:#a5b4fc;margin-top:5px}
.invoice-label{font-size:11px;font-weight:800;color:#a5b4fc;letter-spacing:3px;text-transform:uppercase}
.invoice-num{font-size:22px;font-weight:900;color:#fff;margin-top:4px;font-family:monospace}
.invoice-date{font-size:12px;color:#a5b4fc;margin-top:3px}
.badge{display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:800;padding:4px 14px;border-radius:20px;margin-top:8px;letter-spacing:0.5px}
.customer-bar{padding:22px 36px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:18px}
.avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0}
.cust-name{font-size:16px;font-weight:800;color:#0f172a}
.cust-phone{font-size:13px;color:#64748b;margin-top:3px}
.items-section{padding:0 36px 8px}
.items-title{font-size:11px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:1.5px;padding:18px 0 10px}
table{width:100%;border-collapse:collapse}
thead tr{background:#0f172a}
thead th{padding:11px 10px;font-size:10px;font-weight:700;color:#e2e8f0;letter-spacing:0.8px;text-transform:uppercase}
tbody tr{border-bottom:1px solid #f1f5f9;transition:background 0.1s}
tbody tr:hover{background:#f8fafc}
tbody td{padding:12px 10px;font-size:13px;color:#374151}
.item-name{font-weight:700;color:#0f172a}
.summary-section{padding:16px 36px 28px}
.summary-table{width:100%;max-width:300px;margin-left:auto;border-collapse:collapse}
.summary-table td{padding:7px 10px;font-size:13px}
.summary-divider{border-top:2px solid #e2e8f0}
.total-row td{padding:14px 10px;font-size:18px;font-weight:900}
.footer-bar{background:linear-gradient(135deg,#f8fafc,#f1f5f9);padding:18px 36px;border-top:1px solid #e2e8f0;text-align:center}
.thank-you{font-size:14px;color:#475569;font-weight:600}
.thank-you strong{color:#4f46e5}
.footer-note{font-size:11px;color:#94a3b8;margin-top:5px}
.no-print{padding:16px 36px;text-align:center;background:#f8fafc;border-top:1px solid #e2e8f0}
@media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;width:100%}.no-print{display:none}}
</style></head><body>
<div class="page">
  <div class="header">
    <div>
      <div class="store-name">🛍️ ${fetchedStoreName}</div>
      ${storeAddress ? `<div class="store-sub">📍 ${storeAddress}</div>` : ""}
      ${storePhone ? `<div class="store-sub">📞 ${storePhone}</div>` : ""}
      ${gstin ? `<div class="store-sub" style="font-family:monospace">GSTIN: ${gstin}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div class="invoice-label">Invoice</div>
      <div class="invoice-num">#${invoiceNum}</div>
      <div class="invoice-date">📅 ${dateStr}</div>
      <div class="badge">✅ POS Sale</div>
    </div>
  </div>

  <div class="customer-bar">
    <div class="avatar">${(customer.name || "W").charAt(0).toUpperCase()}</div>
    <div>
      <div class="cust-name">${customer.name || "Walk-in Customer"}</div>
      ${customer.mobile ? `<div class="cust-phone">📞 ${customer.mobile}</div>` : `<div class="cust-phone" style="color:#94a3b8">Walk-in Customer</div>`}
    </div>
  </div>

  <div class="items-section">
    <div class="items-title">Order Items</div>
    <table>
      <thead><tr>
        <th style="text-align:left;width:36px">#</th>
        <th style="text-align:left">Item Description</th>
        <th style="text-align:center;width:50px">Qty</th>
        <th style="text-align:right;width:80px">Rate</th>
        <th style="text-align:right;width:90px">Amount</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div class="summary-section">
    <table class="summary-table">
      <tr><td style="color:#64748b">Subtotal</td><td style="text-align:right">₹${subtotal.toFixed(2)}</td></tr>
      ${discountRows}
      ${gstRows}
      <tr class="summary-divider total-row">
        <td style="color:#0f172a">💰 Total Payable</td>
        <td style="text-align:right;color:#4f46e5">₹${payableAmount.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="footer-bar">
    <div class="thank-you">🙏 Thank you for shopping at <strong>${fetchedStoreName}</strong>!</div>
    <div class="footer-note">Computer-generated invoice · No signature required</div>
  </div>

  <div class="no-print">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;padding:11px 36px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.3px">🖨️ Print Invoice</button>
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
