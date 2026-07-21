import React from "react";
import { Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import axios from "axios";
import QRCode from "qrcode";
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
  upiIdA = "",
  upiIdB = "",
  ac = "S",
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

    // Generate QR BEFORE opening window
    let printQrDataUrl = "";
    const activeUpi = ac === "C" ? upiIdA : upiIdB;
    if ((paymentMethod === "ONLINE" || paymentDestination !== "CASH") && activeUpi && payableAmount > 0) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(activeUpi)}&pn=${encodeURIComponent(fetchedStoreName)}&am=${payableAmount.toFixed(2)}&cu=INR`;
      try { printQrDataUrl = await QRCode.toDataURL(upiUrl, { width: 160, margin: 1 }); } catch (_) {}
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const invoiceNum = invoiceNumber || (() => {
      const d = new Date();
      const r = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return `INV-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,"0")}${d.getDate().toString().padStart(2,"0")}-${r}`;
    })();

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const gstTotal = cgstAmount + sgstAmount + igstAmount;
    const totalDiscount = discountAmount + coinDiscountAmount;
    const displayCoinsUsed = coinsUsed || coinDiscountAmount;

    const activeTotalMrp = cart ? Object.values(cart).reduce((sum, item) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      return sum + (itemMrp * item.qty);
    }, 0) : 0;
    const printProdSavings = Math.max(0, activeTotalMrp - subtotal);
    const printTotalSavings = printProdSavings + discountAmount + coinDiscountAmount;

    const itemRows = Object.values(cart).map((item, i) => {
      const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
      const mrpHtml = itemMrp > item.price ? `<br><span class="item-meta">MRP: <span style="text-decoration:line-through">Rs.${itemMrp.toFixed(2)}</span></span>` : '';
      return `
      <tr>
        <td>${i + 1}</td>
        <td class="item-name">${item.name}${item.size ? `<br><span class="item-meta">Size: ${item.size}</span>` : ""}${item.color ? `<span class="item-meta"> | Color: ${item.color}</span>` : ""}${mrpHtml}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${item.price.toFixed(2)}</td>
        <td style="text-align:right;font-weight:700">${(item.qty * item.price).toFixed(2)}</td>
      </tr>`;
    }).join("");

    const gstRows = gstTotal > 0
      ? (gstType === "IGST"
        ? `<tr class="s-row gst"><td>IGST (${igstPercent}%) incl.</td><td style="text-align:right">${igstAmount.toFixed(2)}</td></tr>`
        : `<tr class="s-row gst"><td>CGST (${cgstPercent}%) incl.</td><td style="text-align:right">${cgstAmount.toFixed(2)}</td></tr><tr class="s-row gst"><td>SGST (${sgstPercent}%) incl.</td><td style="text-align:right">${sgstAmount.toFixed(2)}</td></tr>`)
      : "";

    const discountRows = [
      discountAmount > 0 ? `<tr class="s-row disc"><td>Discount</td><td style="text-align:right">-${discountAmount.toFixed(2)}</td></tr>` : "",
      coinDiscountAmount > 0 ? `<tr class="s-row coin"><td>Coins (${displayCoinsUsed})</td><td style="text-align:right">-${coinDiscountAmount.toFixed(2)}</td></tr>` : "",
    ].join("");

    const totalMrpRow = activeTotalMrp > subtotal
      ? `<tr class="s-row"><td>Total MRP</td><td style="text-align:right;text-decoration:line-through">Rs.${activeTotalMrp.toFixed(2)}</td></tr>`
      : "";

    const savingsRow = printTotalSavings > 0
      ? `<tr class="s-row" style="background:#f0fff4"><td style="color:#059669;font-weight:700">YOUR TOTAL SAVINGS</td><td style="text-align:right;color:#059669;font-weight:700">Rs.${printTotalSavings.toFixed(2)}</td></tr>`
      : "";

    win.document.write(`<!DOCTYPE html><html><head><title>Bill #${invoiceNum}</title>
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
    <div class="store-name">${fetchedStoreName}</div>
    ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ""}
    ${storePhone ? `<div class="store-info">${storePhone}</div>` : ""}
    ${gstin ? `<div class="store-info" style="font-family:monospace">GSTIN: ${gstin}</div>` : ""}
  </div>

  <hr class="divider">

  <div class="inv-row"><span>Invoice #${invoiceNum}</span><span>${dateStr}</span></div>
  <div class="inv-row"><span>POS Sale</span><span>${timeStr}</span></div>

  <div class="cust-block">
    <div class="cust-name">${customer.name || "Walk-in Customer"}</div>
    ${customer.mobile ? `<div style="font-size:11px;color:#555">${customer.mobile}</div>` : ""}
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
    <tr><td>Subtotal</td><td style="text-align:right">${subtotal.toFixed(2)}</td></tr>
    ${discountRows}
    ${gstRows}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">Rs.${payableAmount.toFixed(2)}</td></tr>
    ${savingsRow}
  </table>

  <hr class="divider">

  <div class="center">
    <span class="pay-badge" style="background:${paymentMethod==='CASH'||paymentDestination==='CASH'?'#fef3c7;color:#92400e':'#eff6ff;color:#1e40af'}">
      ${paymentMethod === "CASH" || paymentDestination === "CASH" ? "CASH" : ac === "C" ? "ONLINE - A/C A" : "ONLINE - A/C B"}
    </span>
    ${printQrDataUrl ? `
    <div class="qr-block">
      <div style="font-size:11px;font-weight:700;margin-bottom:6px">Scan to Pay - Rs.${payableAmount.toFixed(2)}</div>
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
