import React, { useEffect, useRef } from "react";
import { Modal, Button, Space } from "antd";
import { FaDownload, FaPrint } from "react-icons/fa";
import JsBarcode from "jsbarcode";

const BarcodeModal = ({ open, onClose, barcode, title, productData }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (open && barcode && svgRef.current) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [open, barcode]);

  const buildStickerHTML = () => {
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, barcode, {
      format: "CODE128",
      width: 3,
      height: 100,
      displayValue: false,
    });
    const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
    const price = productData?.price ? `₹${productData.price}` : "";
    const size = productData?.size || "";

    return `
      <html>
        <head>
          <title>${title} - Barcode Sticker</title>
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
            .barcode-img { max-width: 100%; height: 60px; }
            .barcode-code { font-size: 9px; font-family: monospace; color: #555; margin-top: 2px; }
            @media print {
              @page { margin: 0; size: 9cm 5cm; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="product-name">${title}</div>
            ${price ? `<div class="price">${price}</div>` : ""}
            ${size ? `<div class="meta">Size: ${size}</div>` : ""}
            <img class="barcode-img" src="${barcodeDataUrl}" />
            <div class="barcode-code">${barcode}</div>
          </div>
        </body>
      </html>
    `;
  };

  const printBarcode = () => {
    const html = buildStickerHTML();
    const printWindow = window.open("", "", "width=400,height=320");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadSticker = () => {
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
    ctx.font = "bold 36px Arial";
    const truncated = title.length > 28 ? title.substring(0, 25) + "..." : title;
    ctx.fillText(truncated, canvas.width / 2, y);
    y += 50;

    if (productData?.price) {
      ctx.font = "bold 52px Arial";
      ctx.fillText(`₹${productData.price}`, canvas.width / 2, y);
      y += 55;
    }

    ctx.font = "26px Arial";
    if (productData?.size) {
      ctx.fillText(`Size: ${productData.size}`, canvas.width / 2, y);
      y += 34;
    }

    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, barcode, {
      format: "CODE128",
      width: 3,
      height: 100,
      displayValue: true,
      fontSize: 22,
    });

    const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
    ctx.drawImage(barcodeCanvas, barcodeX, y + 10);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_sticker.png`;
    link.click();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="min(420px, 95vw)"
      title={<span style={{ color: "#722ed1", fontWeight: "bold" }}>🏷️ Product Barcode Sticker</span>}
    >
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <h5 style={{ marginBottom: "12px", color: "#1a1a1a" }}>{title}</h5>

        {productData && (
          <div style={{ marginBottom: "14px", fontSize: "14px" }}>
            <Space direction="vertical" size="small">
              {productData.price && (
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
                  ₹{productData.price}
                </div>
              )}
              {productData.size && (
                <div>
                  Size: <strong>{productData.size}</strong>
                </div>
              )}
            </Space>
          </div>
        )}

        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #e8e8e8",
          }}
        >
          <svg ref={svgRef} style={{ maxWidth: "100%", height: "auto" }}></svg>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "#888", fontFamily: "monospace" }}>
            {barcode}
          </div>
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <Button
              type="primary"
              icon={<FaDownload />}
              onClick={downloadSticker}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              Download PNG
            </Button>
            <Button
              type="primary"
              icon={<FaPrint />}
              onClick={printBarcode}
              style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
            >
              Print Sticker
            </Button>
          </div>
        </Space>
      </div>
    </Modal>
  );
};

export default BarcodeModal;
