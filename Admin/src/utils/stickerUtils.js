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
            overflow: hidden;
            display: flex; flex-direction: column;
          }
          .content {
            height: 75%;
            padding: 1mm 3mm;
            display: flex; flex-direction: column;
            align-items: center; justify-content: flex-start;
            gap: 1mm;
            overflow: hidden;
          }
          .bottom-blank { height: 25%; }
          .title {margin-top: 15px; font-size: 10px; font-weight: bold; color: #000; text-align: center; line-height: 1.2; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
          .barcode-img { max-width: 100%; height: auto; display: block; }
          .price-row {margin-top: 15px;display: flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: center; }
          .price { font-size: 18px; font-weight: bold; color: #000; }
          .mrp { font-size: 14px; color: #555; }
          .discount-badge { font-size: 10px; font-weight: bold; color: #000 }
          .size-row { margin-top: 15px;font-size: 13px; color: #333; }
          @media print {
            @page { margin: 0; size: 70mm 63mm; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sticker">
          <div class="content">
            ${title ? `<div class="title">${title}</div>` : ""}
            ${size ? `<div class="size-row">Size: <strong>${size}</strong></div>` : ""}
            <img class="barcode-img" src="${barcodeDataUrl}" />
            ${price ? `
            <div class="price-row">
              <span class="price">₹${price}</span>
              ${mrp && mrp > price ? `<span class="mrp">MRP: ₹${mrp}</span>` : ""}
              ${discountPct ? `<span class="discount-badge">${discountPct}% OFF</span>` : ""}
            </div>` : ""}
          </div>
          <div class="bottom-blank"></div>
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

  // content fills top 75%, bottom 25% blank
  let y = PAD + 8;
  const contentMaxY = Math.round(H * 0.75);

  // Title
  if (title) {
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(title.length > 40 ? title.slice(0, 40) + "…" : title, W / 2, y + 18);
    y += 30;
  }

  // Size at top
  if (size) {
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText(`Size: ${size}`, W / 2, y + 24);
    y += 34;
  }

  // Barcode — fill space, leave room for price row
  const priceRowH = price ? 70 : 0;
  const barcodeH = contentMaxY - y - priceRowH - 10;

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
  ctx.drawImage(barcodeCanvas, (W - barcodeDrawW) / 2, y, barcodeDrawW, barcodeH);
  y += barcodeH + 6;

  // Price row
  if (price) {
    const discountPct = mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null;

    if (mrp && mrp > price) {
      // ₹price on left
      ctx.font = "bold 42px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "left";
      ctx.fillText(`₹${price}`, PAD + 10, y + 44);

      // MRP: ₹X on right top
      ctx.font = "22px Arial";
      ctx.fillStyle = "#555";
      ctx.textAlign = "right";
      ctx.fillText(`MRP: ₹${mrp}`, W - PAD - 10, y + 26);

      // % OFF badge below MRP
      if (discountPct) {
        const badgeText = `${discountPct}% OFF`;
        ctx.font = "bold 18px Arial";
        const bw = ctx.measureText(badgeText).width + 14;
        const bx = W - PAD - 10 - bw;  // left edge of badge
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.roundRect(bx, y + 32, bw, 26, 5);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(badgeText, bx + bw / 2, y + 50);
      }
    } else {
      ctx.font = "bold 42px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(`₹${price}`, W / 2, y + 50);
    }
    y += priceRowH;
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
