import React, { useEffect, useRef } from "react";
import { Button, Tag, Space } from "antd";
import { AiOutlineDownload, AiOutlinePrinter } from "react-icons/ai";
import JsBarcode from "jsbarcode";

const SizeBarcodesList = ({ barcodes, productData }) => {
  const barcodeRefs = useRef([]);

  useEffect(() => {
    barcodeRefs.current.forEach((svg, index) => {
      if (svg && barcodes[index]) {
        try {
          JsBarcode(svg, barcodes[index].barcode, {
            format: "CODE128",
            width: 1,
            height: 30,
            displayValue: true,
            fontSize: 10,
            margin: 2,
          });
        } catch (e) {
          console.error("Barcode error:", e);
        }
      }
    });
  }, [barcodes]);

  const buildStickerHTML = (item) => {
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, item.barcode, {
      format: "CODE128",
      width: 3,
      height: 90,
      displayValue: false,
    });
    const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
    const productTitle = productData?.title || "Product";
    const price = productData?.price ? `₹${productData.price}` : "";

    return `
      <html>
        <head>
          <title>${productTitle} - ${item.size}</title>
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
            .product-name { font-size: 13px; font-weight: bold; text-align: center; }
            .price { font-size: 20px; font-weight: bold; color: #000; }
            .meta { font-size: 11px; color: #333; }
            .barcode-img { max-width: 100%; height: 55px; }
            .barcode-code { font-size: 9px; font-family: monospace; color: #555; margin-top: 2px; }
            @media print {
              @page { margin: 0; size: 9cm 5cm; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="product-name">${productTitle.length > 28 ? productTitle.substring(0, 25) + "..." : productTitle}</div>
            ${price ? `<div class="price">${price}</div>` : ""}
            <div class="meta">Size: ${item.size}</div>
            <img class="barcode-img" src="${barcodeDataUrl}" />
            <div class="barcode-code">${item.barcode}</div>
          </div>
        </body>
      </html>
    `;
  };

  const printSticker = (item) => {
    const html = buildStickerHTML(item);
    const printWindow = window.open("", "", "width=420,height=340");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadSticker = (item) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 600;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    let y = 65;
    const productTitle = productData?.title || "Product";
    ctx.font = "bold 34px Arial";
    const truncated = productTitle.length > 28 ? productTitle.substring(0, 25) + "..." : productTitle;
    ctx.fillText(truncated, canvas.width / 2, y);
    y += 50;

    if (productData?.price) {
      ctx.font = "bold 52px Arial";
      ctx.fillText(`₹${productData.price}`, canvas.width / 2, y);
      y += 55;
    }

    ctx.font = "26px Arial";
    ctx.fillText(`Size: ${item.size}`, canvas.width / 2, y);
    y += 34;

    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, item.barcode, {
      format: "CODE128",
      width: 3,
      height: 100,
      displayValue: true,
      fontSize: 22,
    });

    const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
    ctx.drawImage(barcodeCanvas, barcodeX, y + 8);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${truncated.replace(/[^a-zA-Z0-9]/g, "_")}_${item.size}_sticker.png`;
    link.click();
  };

  if (!barcodes || barcodes.length === 0) {
    return (
      <div className="text-center py-3 text-muted" style={{ fontSize: "13px" }}>
        No barcodes available for this product
      </div>
    );
  }

  return (
    <div className="p-2">
      {productData?.price && (
        <div className="mb-3 text-center">
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#000" }}>
            ₹{productData.price}
          </span>
        </div>
      )}

      <div className="row g-2">
        {barcodes.map((item, index) => (
          <div key={index} className="col-6">
            <div className="card border" style={{ borderColor: "#d9d9d9" }}>
              <div className="card-body text-center p-2">
                <Tag color="blue" style={{ fontSize: "11px", marginBottom: "4px" }}>
                  Size: {item.size}
                </Tag>
                <p className="text-muted mb-1" style={{ fontSize: "10px" }}>
                  Stock: {item.quantity}
                </p>
                <div className="mb-1" style={{ overflow: "hidden" }}>
                  <svg
                    ref={(el) => (barcodeRefs.current[index] = el)}
                    style={{ maxWidth: "100%" }}
                  ></svg>
                </div>
                <p className="font-monospace text-success mb-2" style={{ fontSize: "9px" }}>
                  {item.barcode}
                </p>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<AiOutlineDownload />}
                    onClick={() => downloadSticker(item)}
                    style={{
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a",
                      fontSize: "10px",
                      height: "26px",
                      width: "100%",
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<AiOutlinePrinter />}
                    onClick={() => printSticker(item)}
                    style={{
                      backgroundColor: "#722ed1",
                      borderColor: "#722ed1",
                      fontSize: "10px",
                      height: "26px",
                      width: "100%",
                    }}
                  >
                    Print Sticker
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizeBarcodesList;
