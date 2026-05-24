import React, { useEffect, useRef } from "react";
import { Button, Tag, Space } from "antd";
import { AiOutlineDownload, AiOutlinePrinter } from "react-icons/ai";
import JsBarcode from "jsbarcode";
import { downloadStickerPNG, printSticker } from "../utils/stickerUtils";

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
        <div className="mb-3 text-center" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#000" }}>₹{productData.price}</span>
          {productData?.mrp && productData.mrp > productData.price && (
            <span style={{ fontSize: "13px", color: "#aaa", textDecoration: "line-through" }}>MRP ₹{productData.mrp}</span>
          )}
          {productData?.mrp && productData.mrp > productData.price && (
            <span style={{ fontSize: "11px", fontWeight: 700, background: "#e53935", color: "#fff", padding: "2px 7px", borderRadius: 4 }}>
              {Math.round((1 - productData.price / productData.mrp) * 100)}% OFF
            </span>
          )}
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
                    onClick={() => downloadStickerPNG({ barcode: item.barcode, size: item.size, price: productData?.price, mrp: productData?.mrp })}
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
                    onClick={() => printSticker({ barcode: item.barcode, size: item.size, price: productData?.price, mrp: productData?.mrp })}
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
