import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Space, Switch } from "antd";
import { FaDownload, FaPrint } from "react-icons/fa";
import JsBarcode from "jsbarcode";
import { buildStickerHTML, downloadStickerPNG, printSticker } from "../utils/stickerUtils";

const BarcodeModal = ({ open, onClose, barcode, title, productData }) => {
  const [showName, setShowName] = useState(false);
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

  const stickerParams = {
    barcode,
    size: productData?.size,
    price: productData?.price,
    mrp: productData?.mrp,
    title: showName ? title : undefined,
  };
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
            <Space direction="vertical" size={2} style={{ alignItems: "center" }}>
              {productData.price && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "26px", fontWeight: "bold", color: "#000" }}>₹{productData.price}</span>
                  {productData.mrp && productData.mrp > productData.price && (
                    <span style={{ fontSize: "14px", color: "#aaa", textDecoration: "line-through" }}>MRP ₹{productData.mrp}</span>
                  )}
                  {productData.mrp && productData.mrp > productData.price && (
                    <span style={{ fontSize: "12px", fontWeight: 700, background: "#e53935", color: "#fff", padding: "2px 7px", borderRadius: 4 }}>
                      {Math.round((1 - productData.price / productData.mrp) * 100)}% OFF
                    </span>
                  )}
                </div>
              )}
              {productData.size && (
                <div style={{ fontSize: 13, color: "#555" }}>Size: <strong>{productData.size}</strong></div>
              )}
            </Space>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Show name</span>
            <Switch size="small" checked={showName} onChange={(checked) => setShowName(checked)} />
          </div>
        </div>

        <div
          style={{
            marginBottom: "8px",
            padding: "6px 8px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #e8e8e8",
          }}
        >
          <svg ref={svgRef} style={{ maxWidth: "100%", height: "auto", display: "block" }}></svg>
          <div style={{ marginTop: "2px", fontSize: "11px", color: "#888", fontFamily: "monospace" }}>
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
