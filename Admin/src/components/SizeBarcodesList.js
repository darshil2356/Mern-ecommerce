import React, { useEffect, useRef } from "react";
import { Button, Tag } from "antd";
import { AiOutlineDownload } from "react-icons/ai";
import JsBarcode from "jsbarcode";

const SizeBarcodesList = ({ barcodes, onDownload }) => {
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

  if (!barcodes || barcodes.length === 0) {
    return (
      <div className="text-center py-3 text-muted" style={{ fontSize: '12px' }}>
        No barcodes available for this product
      </div>
    );
  }

  return (
    <div className="p-2">
      <p className="text-muted mb-2" style={{ fontSize: '12px' }}>
        Barcodes for each size:
      </p>
      <div className="row g-2">
        {barcodes.map((item, index) => (
          <div key={index} className="col-6">
            <div className="card border" style={{ borderColor: '#d9d9d9' }}>
              <div className="card-body text-center p-2">
                <h6 className="mb-1">
                  <Tag color="blue" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    {item.size}
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
                <p className="font-monospace fw-bold text-success mb-1" style={{ fontSize: '10px' }}>
                  {item.barcode}
                </p>
                <Button
                  type="primary"
                  size="small"
                  icon={<AiOutlineDownload />}
                  onClick={() => onDownload(item.barcode)}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: '10px', height: '24px' }}
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizeBarcodesList;

