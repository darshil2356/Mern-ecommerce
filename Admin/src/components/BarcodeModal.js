import React, { useEffect, useRef } from "react";
import { Modal, Button, Space } from "antd";
import { FaDownload, FaPrint } from "react-icons/fa";
import JsBarcode from "jsbarcode";
import { buildStickerHTML, downloadStickerPNG, printSticker } from "../utils/stickerUtils";

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

  const stickerParams = { barcode, size: productData?.size, price: productData?.price, title };
  const handlePrint = () => printSticker(stickerParams);
  const handleDownload = () => downloadStickerPNG(stickerParams);

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
              onClick={handleDownload}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              Download PNG
            </Button>
            <Button
              type="primary"
              icon={<FaPrint />}
              onClick={handlePrint}
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
