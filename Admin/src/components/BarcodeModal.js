import React, { useEffect, useRef } from "react";
import { Modal, Button, Space, Tag } from "antd";
import { FaDownload, FaPrint } from "react-icons/fa";
import { MdPrint } from "react-icons/md";
import JsBarcode from "jsbarcode";
import { getReadableColorName, getColorSwatch } from "../utils/colorDisplay";

const BarcodeModal = ({ open, onClose, barcode, title, productData }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (barcode && svgRef.current) {
      JsBarcode(svgRef.current, barcode, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
      });
    }
  }, [barcode]);

  const printBarcode = () => {
    const printWindow = window.open("", "", "width=400,height=300");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - Barcode</title>
          <style>
            body {
              text-align: center;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .barcode-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              width: 300px;
              background: white;
            }
            .product-info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .barcode-title {
              font-weight: bold;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-info">
              <div class="barcode-title">${title}</div>
              ${productData ? `
                <div>Price: ₹${productData.price}</div>
                ${productData.color ? `<div>Color: ${getReadableColorName(productData.color)}</div>` : ''}
                ${productData.size ? `<div>Size: ${productData.size}</div>` : ''}
              ` : ''}
            </div>
            <svg id="barcode"></svg>
            <div style="margin-top: 10px; font-size: 10px; color: #666;">
              ${barcode}
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${barcode}", {
              format: "CODE128",
              width: 2,
              height: 60,
              displayValue: false,
              margin: 0
            });
            window.print();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const downloadBarcode = (format = 'png') => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL(`image/${format}`);
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_barcode.${format}`;
    link.click();
  };

  const downloadSticker = () => {
    // Create a larger canvas for sticker printing
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size for sticker (4x2 inches at 300 DPI)
    canvas.width = 1200; // 4 inches * 300 DPI
    canvas.height = 600;  // 2 inches * 300 DPI

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Add product title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, 80);

    // Add product details
    ctx.font = "24px Arial";
    let yPos = 120;
    if (productData) {
      if (productData.price) {
        ctx.fillText(`Price: ₹${productData.price}`, canvas.width / 2, yPos);
        yPos += 30;
      }
      if (productData.color) {
        ctx.fillText(`Color: ${getReadableColorName(productData.color)}`, canvas.width / 2, yPos);
        yPos += 30;
      }
      if (productData.size) {
        ctx.fillText(`Size: ${productData.size}`, canvas.width / 2, yPos);
        yPos += 30;
      }
    }

    // Generate and add barcode
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, barcode, {
      format: "CODE128",
      width: 3,
      height: 100,
      displayValue: true,
      fontSize: 24,
    });

    // Center the barcode
    const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
    ctx.drawImage(barcodeCanvas, barcodeX, yPos + 20);

    // Download the sticker
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_sticker.png`;
    link.click();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      title={<span style={{ color: '#722ed1', fontWeight: 'bold' }}>📦 Product Barcode</span>}
    >
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <h5 style={{ marginBottom: "16px", color: "#1a1a1a" }}>{title}</h5>

        {productData && (
          <div style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
            <Space direction="vertical" size="small">
              {productData.price && <div>Price: <strong>₹{productData.price}</strong></div>}
              {productData.color && (
                <div>
                  Color: <Tag color={getColorSwatch(productData.color)}>{getReadableColorName(productData.color)}</Tag>
                </div>
              )}
              {productData.size && <div>Size: <strong>{productData.size}</strong></div>}
            </Space>
          </div>
        )}

        <div style={{ marginBottom: "16px", padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <svg ref={svgRef} style={{ maxWidth: "100%", height: "auto" }}></svg>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666", fontFamily: "monospace" }}>
            {barcode}
          </div>
        </div>

        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              type="primary"
              icon={<FaDownload />}
              onClick={() => downloadBarcode('png')}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Download PNG
            </Button>
            <Button
              type="primary"
              icon={<FaDownload />}
              onClick={() => downloadBarcode('jpg')}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              Download JPG
            </Button>
            <Button
              type="primary"
              icon={<MdPrint />}
              onClick={printBarcode}
              style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
            >
              Print Barcode
            </Button>
          </div>

          <Button
            type="primary"
            icon={<FaPrint />}
            onClick={downloadSticker}
            size="large"
            style={{
              backgroundColor: '#fa8c16',
              borderColor: '#fa8c16',
              width: "100%",
              marginTop: "12px"
            }}
          >
            🏷️ Download Product Sticker (4x2 inches)
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default BarcodeModal;
