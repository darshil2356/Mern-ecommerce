import JsBarcode from "jsbarcode";

export const buildStickerHTML = ({ barcode, size, price, mrp, title }) => {
  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, barcode, {
    format: "CODE128",
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 11,
    margin: 2,
  });
  const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
  const discountPct = mrp && price && mrp > price ? Math.round((1 - price / mrp) * 100) : null;

  return `
    <html>
      <head>
        <title>Barcode Sticker</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #fff; }
          .sticker {
            width: 70mm; height: 63mm;
            border: 1.5px solid #000;
            padding: 2mm 3mm;
            display: flex; flex-direction: column;
            align-items: center; justify-content: space-evenly;
            overflow: hidden;
          }
          .title { font-size: 9px; font-weight: bold; color: #000; text-align: center; line-height: 1.2; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
          .meta { font-size: 9px; color: #333; }
          .barcode-img { width: 100%; height: 38mm; object-fit: fill; display: block; }
          .price-row { display: flex; align-items: center; gap: 4px; }
          .price { font-size: 16px; font-weight: bold; color: #000; }
          .mrp { font-size: 9px; color: #888; text-decoration: line-through; }
          .discount-badge { font-size: 8px; font-weight: bold; color: #fff; background: #e53935; padding: 1px 4px; border-radius: 3px; }
          @media print {
            @page { margin: 0; size: 70mm 63mm; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sticker">
          ${title ? `<div class="title">${title}</div>` : ""}
          ${size ? `<div class="meta">Size: <strong>${size}</strong></div>` : ""}
          <img class="barcode-img" src="${barcodeDataUrl}" />
          ${price ? `
          <div class="price-row">
            <span class="price">₹${price}</span>
            ${mrp && mrp > price ? `<span class="mrp">MRP ₹${mrp}</span>` : ""}
            ${discountPct ? `<span class="discount-badge">${discountPct}% OFF</span>` : ""}
          </div>` : ""}
        </div>
      </body>
    </html>
  `;
};

// 70mm x 63mm at 300dpi = 826 x 744px
const W = 826;
const H = 744;
const PAD = 20;

export const downloadStickerPNG = ({ barcode, size, price, mrp, title }) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.strokeRect(PAD / 2, PAD / 2, W - PAD, H - PAD);

  let y = PAD + 8;

  // Title
  if (title) {
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(title.length > 40 ? title.slice(0, 40) + "…" : title, W / 2, y + 18);
    y += 30;
  }

  // Size
  if (size) {
    ctx.font = "22px Arial";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText(`Size: ${size}`, W / 2, y + 18);
    y += 28;
  }

  // Barcode — fill remaining space minus price row
  const priceRowH = price ? 80 : 0;
  const barcodeH = H - y - priceRowH - PAD - 10;

  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, barcode, {
    format: "CODE128",
    width: 3,
    height: Math.max(barcodeH - 30, 80),
    displayValue: true,
    fontSize: 22,
    margin: 4,
  });

  const barcodeDrawW = Math.min(barcodeCanvas.width, W - PAD * 2);
  const barcodeDrawH = barcodeH;
  ctx.drawImage(barcodeCanvas, (W - barcodeDrawW) / 2, y, barcodeDrawW, barcodeDrawH);
  y += barcodeDrawH + 6;

  // Price row
  if (price) {
    const discountPct = mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null;

    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    if (mrp && mrp > price) {
      // price left, mrp + badge right
      ctx.textAlign = "left";
      ctx.fillText(`₹${price}`, PAD + 10, y + 44);

      ctx.font = "22px Arial";
      ctx.fillStyle = "#888";
      ctx.textAlign = "right";
      ctx.fillText(`MRP ₹${mrp}`, W - PAD - 10, y + 26);
      const mrpW = ctx.measureText(`MRP ₹${mrp}`).width;
      ctx.beginPath();
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5;
      ctx.moveTo(W - PAD - 10 - mrpW, y + 18);
      ctx.lineTo(W - PAD - 10, y + 18);
      ctx.stroke();

      if (discountPct) {
        const badgeText = `${discountPct}% OFF`;
        ctx.font = "bold 18px Arial";
        const bw = ctx.measureText(badgeText).width + 14;
        const bx = W - PAD - 10 - bw / 2;
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.roundRect(bx - bw / 2, y + 34, bw, 26, 5);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(badgeText, bx, y + 52);
      }
    } else {
      ctx.textAlign = "center";
      ctx.fillText(`₹${price}`, W / 2, y + 50);
    }
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${(title || barcode).replace(/[^a-zA-Z0-9]/g, "_")}_sticker.png`;
  link.click();
};

export const printSticker = (params) => {
  const html = buildStickerHTML(params);
  const printWindow = window.open("", "", "width=265,height=239");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};
