import JsBarcode from "jsbarcode";

export const buildStickerHTML = ({ barcode, size, price, mrp, title }) => {
  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, barcode, {
    format: "CODE128",
    width: 3,
    height: 100,
    displayValue: false,
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
            width: 9cm; height: 5cm;
            border: 2px solid #000;
            padding: 8px 12px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 4px;
          }
          .meta { font-size: 11px; color: #333; }
          .barcode-img { max-width: 100%; height: 60px; }
          .barcode-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 2px; }
          .barcode-code { font-size: 9px; font-family: monospace; color: #555; }
          .price-row { display: flex; align-items: center; gap: 8px; }
          .price { font-size: 22px; font-weight: bold; color: #000; }
          .mrp { font-size: 13px; color: #888; text-decoration: line-through; }
          .discount-badge { font-size: 11px; font-weight: bold; color: #fff; background: #e53935; padding: 2px 6px; border-radius: 4px; }
          @media print {
            @page { margin: 0; size: 9cm 5cm; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sticker">
          ${size ? `<div class="meta">Size: ${size}</div>` : ""}
          <img class="barcode-img" src="${barcodeDataUrl}" />
          <div class="barcode-row">
            <span class="barcode-code">${barcode}</span>
          </div>
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

export const downloadStickerPNG = ({ barcode, size, price, mrp, title }) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 600;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  let y = 70;
  if (size) {
    ctx.font = "26px Arial";
    ctx.fillText(`Size: ${size}`, canvas.width / 2, y);
    y += 34;
  }

  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, barcode, {
    format: "CODE128",
    width: 3,
    height: 100,
    displayValue: false,
  });

  const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
  ctx.drawImage(barcodeCanvas, barcodeX, y + 10);

  const belowBarcode = y + 10 + barcodeCanvas.height + 28;
  ctx.font = "22px monospace";
  ctx.textAlign = "left";
  const barcodeTextWidth = ctx.measureText(barcode).width;
  const priceText = price ? `  ₹${price}` : "";
  ctx.font = "bold 22px Arial";
  const priceWidth = price ? ctx.measureText(priceText).width : 0;
  const totalWidth = barcodeTextWidth + priceWidth;
  let textX = (canvas.width - totalWidth) / 2;

  ctx.font = "22px monospace";
  ctx.fillStyle = "#555";
  ctx.fillText(barcode, textX, belowBarcode);

  if (price) {
    textX += barcodeTextWidth;
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(priceText, textX, belowBarcode);
  }

  if (mrp && price && mrp > price) {
    const discountPct = Math.round((1 - price / mrp) * 100);
    const mrpY = belowBarcode + 34;
    ctx.font = "18px Arial";
    ctx.fillStyle = "#888";
    ctx.textAlign = "center";
    ctx.fillText(`MRP ₹${mrp}`, canvas.width / 2 - 60, mrpY);
    // strikethrough
    const mrpW = ctx.measureText(`MRP ₹${mrp}`).width;
    ctx.beginPath();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1.5;
    ctx.moveTo(canvas.width / 2 - 60 - mrpW / 2, mrpY - 6);
    ctx.lineTo(canvas.width / 2 - 60 + mrpW / 2, mrpY - 6);
    ctx.stroke();
    // discount badge
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#fff";
    const badgeText = `${discountPct}% OFF`;
    const badgeW = ctx.measureText(badgeText).width + 16;
    const badgeX = canvas.width / 2 + 20;
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.roundRect(badgeX - badgeW / 2, mrpY - 22, badgeW, 28, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(badgeText, badgeX, mrpY - 4);
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${(title || barcode).replace(/[^a-zA-Z0-9]/g, "_")}_sticker.png`;
  link.click();
};

export const printSticker = (params) => {
  const html = buildStickerHTML(params);
  const printWindow = window.open("", "", "width=420,height=340");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};
