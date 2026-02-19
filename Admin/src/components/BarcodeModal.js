import React, { useEffect, useRef } from "react";
import { Modal } from "antd";
import JsBarcode from "jsbarcode";
import { FaDownload } from "react-icons/fa";
import { MdPrint } from "react-icons/md";

const BarcodeModal = ({ open, onClose, barcode, title }) => {
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
    const printWindow = window.open("", "", "width=600,height=400");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { text-align: center; font-family: Arial, sans-serif; }
            h4 { margin-bottom: 10px; }
          </style>
        </head>
        <body style="text-align:center;">
          <h4>${title}</h4>
          <svg id="barcode"></svg>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode/dist/JsBarcode.all.min.js"><\/script>
          <script>
            JsBarcode("#barcode", "${barcode}", {
              format: "CODE128",
              width: 2,
              height: 80,
              displayValue: true
            });
            window.print();
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const downloadBarcode = () => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${barcode}.png`;
    link.click();
  };

  return (
    <Modal 
      open={open} 
      onCancel={onClose} 
      footer={null} 
      centered
      width={300}
    >
      <h5 style={{ textAlign: "center", marginBottom: "16px" }}>{title}</h5>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
        <button
          type="button"
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
          onClick={downloadBarcode}
        >
          <FaDownload size={14} /> Download
        </button>
        <button
          type="button"
          className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1"
          onClick={printBarcode}
        >
          <MdPrint size={16} /> Print
        </button>
      </div>
    </Modal>
  );
};

export default BarcodeModal;

