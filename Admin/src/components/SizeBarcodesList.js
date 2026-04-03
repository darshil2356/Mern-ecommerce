import React, { useEffect, useRef } from "react";
import { Button, Tag, Space } from "antd";
import { AiOutlineDownload, AiOutlinePrinter } from "react-icons/ai";
import { FaPrint } from "react-icons/fa";
import JsBarcode from "jsbarcode";
import { getReadableColorName, getColorSwatch } from "../utils/colorDisplay";

const SizeBarcodesList = ({ barcodes, onDownload, productData }) => {
  const barcodeRefs = useRef([]);

  useEffect(() => {
    // Generate barcodes when component mounts or barcodes change
    barcodeRefs.current.forEach((svg, index) => {
      if (svg && barcodes[index]) {
        try {
          JsBarcode(svg, barcodes[index].barcode, {
            format: "CODE128",
            width: 1,
            height: 30,
            displayValue: true,
            fontSize: 10,
            margin: 0
          });
        } catch (e) {
          console.error("Error generating barcode:", e);
        }
      }
    });
  }, [barcodes]);

  const downloadSticker = (item) => {
    // Create a larger canvas for sticker printing
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size for sticker (3x1.5 inches at 300 DPI)
    canvas.width = 900;  // 3 inches * 300 DPI
    canvas.height = 450; // 1.5 inches * 300 DPI

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    // Add product title (truncated if too long)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    const title = productData?.title || "Product";
    const truncatedTitle = title.length > 20 ? title.substring(0, 17) + "..." : title;
    ctx.fillText(truncatedTitle, canvas.width / 2, 50);

    // Add product details
    ctx.font = "18px Arial";
    let yPos = 80;
    if (productData) {
      if (productData.price) {
        ctx.fillText(`₹${productData.price}`, canvas.width / 2, yPos);
        yPos += 25;
      }
      if (productData.color) {
        ctx.fillText(`Color: ${getReadableColorName(productData.color)}`, canvas.width / 2, yPos);
        yPos += 25;
      }
    }

    // Add size
    ctx.fillText(`Size: ${item.size}`, canvas.width / 2, yPos);
    yPos += 25;

    // Generate and add barcode
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, item.barcode, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 16,
    });

    // Center the barcode
    const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
    ctx.drawImage(barcodeCanvas, barcodeX, yPos);

    // Download the sticker
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${truncatedTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${item.size}_sticker.png`;
    link.click();
  };

  const printBarcode = (item) => {
    const printWindow = window.open("", "", "width=400,height=250");

    printWindow.document.write(`
      <html>
        <head>
          <title>${productData?.title || "Product"} - ${item.size}</title>
          <style>
            body {
              text-align: center;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
            }
            .barcode-container {
              border: 2px solid #000;
              padding: 15px;
              margin: 10px auto;
              width: 250px;
              background: white;
            }
            .product-info {
              margin-bottom: 10px;
              font-size: 10px;
            }
            .barcode-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-info">
              <div class="barcode-title">${productData?.title || "Product"} - ${item.size}</div>
              ${productData ? `
                <div>Price: ₹${productData.price}</div>
                ${productData.color ? `<div>Color: ${getReadableColorName(productData.color)}</div>` : ''}
              ` : ''}
            </div>
            <svg id="barcode"></svg>
            <div style="margin-top: 5px; font-size: 8px; color: #666;">
              ${item.barcode}
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${item.barcode}", {
              format: "CODE128",
              width: 2,
              height: 50,
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

  if (!barcodes || barcodes.length === 0) {
    return (
      <div className="text-center py-3 text-muted" style={{ fontSize: '12px' }}>
        No barcodes available for this product
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-3 text-center">
        <Space direction="vertical" size="small">
          {productData?.color && (
            <div>
              <Tag color={getColorSwatch(productData.color)} style={{ fontSize: '12px' }}>
                Color: {getReadableColorName(productData.color)}
              </Tag>
            </div>
          )}
          {productData?.price && (
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}>
              Price: ₹{productData.price}
            </div>
          )}
        </Space>
      </div>

      <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
        Barcodes for each size:
      </p>
      <div className="row g-2">
        {barcodes.map((item, index) => (
          <div key={index} className="col-6">
            <div className="card border" style={{ borderColor: '#d9d9d9' }}>
              <div className="card-body text-center p-2">
                <h6 className="mb-1">
                  <Tag color="blue" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    Size: {item.size}
                  </Tag>
                </h6>
                <p className="text-muted mb-1" style={{ fontSize: '10px' }}>
                  Stock: {item.quantity}
                </p>
                <div className="mb-1">
                  <svg
                    ref={el => barcodeRefs.current[index] = el}
                    id={`barcode-${index}`}
                  ></svg>
                </div>
                <p className="font-monospace fw-bold text-success mb-2" style={{ fontSize: '9px' }}>
                  {item.barcode}
                </p>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<AiOutlineDownload />}
                    onClick={() => onDownload(item.barcode)}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: '10px', height: '24px', width: '100%' }}
                  >
                    Download
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<FaPrint />}
                    onClick={() => downloadSticker(item)}
                    style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', fontSize: '10px', height: '24px', width: '100%' }}
                  >
                    Sticker
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<AiOutlinePrinter />}
                    onClick={() => printBarcode(item)}
                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', fontSize: '10px', height: '24px', width: '100%' }}
                  >
                    Print
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
