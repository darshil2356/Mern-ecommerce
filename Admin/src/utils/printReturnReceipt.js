import axios from "axios";
import { base_url } from "./baseUrl";
import { config } from "./axiosconfig";

export const printReturnExchangeReceipt = async (returnDoc, customerInfo = {}, storeSettingsOverride = null) => {
  if (!returnDoc) return;

  let storeAddress = "";
  let storePhone = "";
  let storeName = "Yashoda Fashion";
  let gstin = "";

  if (storeSettingsOverride) {
    storeAddress = storeSettingsOverride.storeAddress || "";
    storePhone = storeSettingsOverride.storePhone || "";
    storeName = storeSettingsOverride.storeName || storeName;
    gstin = storeSettingsOverride.gstin || "";
  } else {
    try {
      const settingsRes = await axios.get(`${base_url}user/settings`, config);
      storeAddress = settingsRes.data?.storeAddress || "";
      storePhone = settingsRes.data?.storePhone || "";
      storeName = settingsRes.data?.storeName || storeName;
      gstin = settingsRes.data?.gstin || "";
    } catch (_) {}
  }

  const win = window.open("", "_blank");
  if (!win) return;

  const returnId = returnDoc.returnId || "RET-UNKNOWN";
  const createdAt = returnDoc.createdAt ? new Date(returnDoc.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const custName = customerInfo.name || customerInfo.firstname || (returnDoc.customer?.firstname ? `${returnDoc.customer.firstname} ${returnDoc.customer.lastname || ""}` : "Valued Customer");
  const custMobile = customerInfo.mobile || returnDoc.customer?.mobile || "";

  // Returned items HTML
  const returnedItems = returnDoc.returnedItems && returnDoc.returnedItems.length > 0
    ? returnDoc.returnedItems
    : returnDoc.returnedItem?.product ? [returnDoc.returnedItem] : [];

  const returnedRowsHtml = returnedItems.map((item, i) => {
    const qty = item.quantity || 1;
    const price = item.agreedValue || 0;
    const lineTotal = qty * price;
    const title = item.title || item.product?.title || "Returned Product";
    const qcStr = item.qcStatus === "DAMAGED" ? ` <span style="color:#dc2626;font-size:9px">[DAMAGED]</span>` : "";
    return `
    <tr>
      <td>${i + 1}</td>
      <td class="item-name">${title}${item.size ? `<br><span class="item-meta">Size: ${item.size}</span>` : ""}${item.color ? `<span class="item-meta"> | Color: ${item.color}</span>` : ""}${qcStr}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">Rs.${price.toFixed(2)}</td>
      <td style="text-align:right;font-weight:700">Rs.${lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  // Exchange items HTML
  const exchangeItems = returnDoc.exchangeItems && returnDoc.exchangeItems.length > 0
    ? returnDoc.exchangeItems
    : returnDoc.exchangeItem?.product ? [returnDoc.exchangeItem] : [];

  const exchangeRowsHtml = exchangeItems.map((item, i) => {
    const qty = item.quantity || 1;
    const price = item.itemValue || 0;
    const lineTotal = qty * price;
    const title = item.title || item.product?.title || "Exchange Product";
    return `
    <tr>
      <td>${i + 1}</td>
      <td class="item-name">${title}${item.size ? `<br><span class="item-meta">Size: ${item.size}</span>` : ""}${item.color ? `<span class="item-meta"> | Color: ${item.color}</span>` : ""}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">Rs.${price.toFixed(2)}</td>
      <td style="text-align:right;font-weight:700">Rs.${lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const retTotal = returnDoc.returnedTotal || 0;
  const exTotal = returnDoc.exchangeTotal || 0;
  const diffAmt = returnDoc.differentialAmount || 0;
  const payMethod = returnDoc.paymentMethod || "NONE";
  const settlementType = returnDoc.settlementType || "EVEN";

  let settlementBadgeText = "EVEN EXCHANGE (Rs.0)";
  let settlementBadgeBg = "#eff6ff;color:#1e40af";

  if (diffAmt > 0) {
    if (payMethod === "UDHAR") {
      settlementBadgeText = `ADD TO UDHAR: +Rs.${diffAmt.toFixed(2)}`;
      settlementBadgeBg = "#fef2f2;color:#dc2626";
    } else {
      settlementBadgeText = `EXTRA PAID (${payMethod}): +Rs.${diffAmt.toFixed(2)}`;
      settlementBadgeBg = "#ecfdf5;color:#047857";
    }
  } else if (diffAmt < 0) {
    const absDiff = Math.abs(diffAmt);
    if (payMethod === "UDHAR" || settlementType === "UDHAR_ADJUST") {
      settlementBadgeText = `UDHAR ADJUSTED: -Rs.${absDiff.toFixed(2)}`;
      settlementBadgeBg = "#fffbeb;color:#b45309";
    } else if (payMethod === "CASH" || payMethod === "ONLINE" || settlementType.includes("REFUND")) {
      settlementBadgeText = `REFUNDED (${payMethod}): -Rs.${absDiff.toFixed(2)}`;
      settlementBadgeBg = "#ecfdf5;color:#047857";
    } else {
      settlementBadgeText = `REWARD COINS CREDIT: +${returnDoc.coinsCredited || absDiff} Coins`;
      settlementBadgeBg = "#f5f3ff;color:#6d28d9";
    }
  }

  win.document.write(`<!DOCTYPE html><html><head><title>Return Receipt #${returnId}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;background:#fff;display:flex;justify-content:center;padding:20px 8px}
.receipt{width:320px;background:#fff}
.center{text-align:center}
.store-name{font-size:18px;font-weight:900;letter-spacing:1px}
.store-info{font-size:11px;color:#444;margin-top:3px;line-height:1.5}
.receipt-title{font-size:13px;font-weight:900;margin-top:6px;padding:3px;background:#111;color:#fff;text-align:center;letter-spacing:0.5px}
.divider{border:none;border-top:1px dashed #999;margin:10px 0}
.inv-row{display:flex;justify-content:space-between;font-size:11px;color:#555;margin:2px 0}
.cust-block{background:#f9f9f9;border:1px solid #e5e5e5;padding:8px 10px;margin:8px 0;font-size:12px}
.cust-name{font-weight:700;font-size:13px}
.sec-hdr{font-size:11px;font-weight:900;background:#f3f4f6;padding:3px 6px;margin:6px 0 4px 0;border-left:3px solid #111;text-transform:uppercase}
table{width:100%;border-collapse:collapse;font-size:11px}
thead tr{border-bottom:1px solid #333}
thead th{padding:4px 3px;font-size:10px;font-weight:700;text-transform:uppercase}
tbody tr{border-bottom:1px dotted #ddd}
tbody td{padding:5px 3px;vertical-align:top}
.item-name{font-weight:700;font-size:11px}
.item-meta{font-size:9px;color:#666}
.s-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:4px}
.s-row td{padding:3px 4px}
.total-row{border-top:2px solid #111;margin-top:6px}
.total-row td{padding:6px 4px;font-size:14px;font-weight:900}
.pay-badge{display:inline-block;padding:5px 12px;border-radius:4px;font-size:11px;font-weight:800;margin-top:6px;text-align:center}
.footer-msg{font-size:11px;font-weight:700;margin-top:6px}
.footer-note{font-size:9px;color:#777;margin-top:2px}
.no-print{padding:12px;text-align:center;margin-top:8px}
@media print{body{padding:0}.receipt{width:100%}.no-print{display:none}}
</style></head><body>
<div class="receipt">
  <div class="center">
    <div class="store-name">${storeName}</div>
    ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ""}
    ${storePhone ? `<div class="store-info">${storePhone}</div>` : ""}
    ${gstin ? `<div class="store-info" style="font-family:monospace">GSTIN: ${gstin}</div>` : ""}
    <div class="receipt-title">RETURN & EXCHANGE RECEIPT</div>
  </div>

  <hr class="divider">

  <div class="inv-row"><span>Return ID: <strong>${returnId}</strong></span><span>${dateStr}</span></div>
  <div class="inv-row"><span>Type: POS Return/Exchange</span><span>${timeStr}</span></div>

  <div class="cust-block">
    <div class="cust-name">${custName}</div>
    ${custMobile ? `<div style="font-size:11px;color:#555">${custMobile}</div>` : ""}
  </div>

  <hr class="divider">

  <div class="sec-hdr">🔄 Returned Products</div>
  ${returnedRowsHtml ? `
  <table>
    <thead><tr>
      <th style="text-align:left;width:22px">#</th>
      <th style="text-align:left">Item</th>
      <th style="text-align:center;width:28px">Qty</th>
      <th style="text-align:right;width:48px">Rate</th>
      <th style="text-align:right;width:52px">Amt</th>
    </tr></thead>
    <tbody>${returnedRowsHtml}</tbody>
  </table>` : `<div style="font-size:11px;color:#777;padding:4px">No returned items</div>`}

  ${exchangeRowsHtml ? `
  <div class="sec-hdr" style="margin-top:10px">✨ New Exchange Items Taken</div>
  <table>
    <thead><tr>
      <th style="text-align:left;width:22px">#</th>
      <th style="text-align:left">Item</th>
      <th style="text-align:center;width:28px">Qty</th>
      <th style="text-align:right;width:48px">Rate</th>
      <th style="text-align:right;width:52px">Amt</th>
    </tr></thead>
    <tbody>${exchangeRowsHtml}</tbody>
  </table>` : ""}

  <hr class="divider">

  <table class="s-table">
    <tr><td>Total Returned Value</td><td style="text-align:right;font-weight:700;color:#dc2626">-Rs.${retTotal.toFixed(2)}</td></tr>
    <tr><td>Total Exchange Value</td><td style="text-align:right;font-weight:700;color:#059669">+Rs.${exTotal.toFixed(2)}</td></tr>
    <tr class="total-row">
      <td>DIFFERENTIAL BAL.</td>
      <td style="text-align:right;color:${diffAmt > 0 ? '#059669' : diffAmt < 0 ? '#dc2626' : '#2563eb'}">
        ${diffAmt > 0 ? `+Rs.${diffAmt.toFixed(2)}` : diffAmt < 0 ? `-Rs.${Math.abs(diffAmt).toFixed(2)}` : 'Rs.0.00'}
      </td>
    </tr>
  </table>

  <div class="center" style="margin-top:8px">
    <span class="pay-badge" style="background:${settlementBadgeBg}">
      ${settlementBadgeText}
    </span>
  </div>

  ${returnDoc.note ? `
  <div style="margin-top:8px;padding:6px;background:#f9f9f9;border-left:2px solid #666;font-size:10px;color:#444">
    <strong>Note:</strong> ${returnDoc.note}
  </div>` : ""}

  <hr class="divider">

  <div class="center">
    <div class="footer-msg">Thank You! Visit Again</div>
    <div class="footer-note">Computer-generated Return Receipt</div>
  </div>

  <div class="no-print">
    <button onclick="window.print()" style="background:#111;color:#fff;border:none;padding:9px 28px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:sans-serif">Print Return Receipt</button>
  </div>
</div>
</body></html>`);

  win.document.close();
  win.print();
};
