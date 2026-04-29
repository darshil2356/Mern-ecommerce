import React, { useEffect, useState } from "react";
import { Modal, Button, Space } from "antd";
import { FaDownload, FaPrint } from "react-icons/fa";
import QRCode from "qrcode";

const QRCodeModal = ({ open, onClose, value, title, productData }) => {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (open && value) {
      QRCode.toDataURL(value, { width: 300, margin: 2 })
        .then(setQrDataUrl)
        .catch((e) => console.error("QR generation error:", e));
    }
  }, [open, value]);

  const printQR = () => {
    const price = productData?.price ? `₹${productData.price}` : "";
    const size = productData?.size || "";
    const printWindow = window.open("", "", "width=400,height=420");
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - QR Code</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #fff; }
            .sticker {
              width: 9cm; height: 9cm;
              border: 2px solid #000;
              padding: 10px;
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              gap: 6px;
            }
            .product-name { font-size: 13px; font-weight: bold; text-align: center; }
            .price { font-size: 20px; font-weight: bold; }
            .meta { font-size: 11px; color: #333; }
            img { width: 160px; height: 160px; }
            @media print {
              @page { margin: 0; size: 9cm 9cm; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="product-name">${title}</div>
            ${price ? `<div class="price">${price}</div>` : ""}
            ${size ? `<div class="meta">Size: ${size}</div>` : ""}
            <img src="${qrDataUrl}" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_qr.png`;
    link.click();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={380}
      title={<span style={{ color: "#1677ff", fontWeight: "bold" }}>📱 Product QR Code</span>}
    >
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <h5 style={{ marginBottom: "12px", color: "#1a1a1a" }}>{title}</h5>

        {productData && (
          <Space direction="vertical" size="small" style={{ marginBottom: "14px" }}>
            {productData.price && (
              <div style={{ fontSize: "22px", fontWeight: "bold" }}>₹{productData.price}</div>
            )}
            {productData.size && (
              <div style={{ fontSize: "14px" }}>
                Size: <strong>{productData.size}</strong>
              </div>
            )}
          </Space>
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
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
          ) : (
            <div style={{ width: 200, height: 200, margin: "0 auto", background: "#eee" }} />
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            type="primary"
            icon={<FaDownload />}
            onClick={downloadQR}
            disabled={!qrDataUrl}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Download PNG
          </Button>
          <Button
            type="primary"
            icon={<FaPrint />}
            onClick={printQR}
            disabled={!qrDataUrl}
            style={{ backgroundColor: "#1677ff", borderColor: "#1677ff" }}
          >
            Print Sticker
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
