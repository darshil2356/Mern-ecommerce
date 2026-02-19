import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const BarcodePreview = ({ barcode, title }) => {
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

  const printBarcode = () => {
    const printWindow = window.open("", "", "width=600,height=400");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
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

  if (!barcode) return null;

  return (
    <div className="card p-4 mt-4 text-center">
      <h5>Generated Barcode</h5>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg ref={svgRef}></svg>
      </div>

      <div className="mt-3">
        <button
          type="button"
          className="btn btn-outline-success me-2"
          onClick={downloadBarcode}
        >
          Download
        </button>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={printBarcode}
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default BarcodePreview;
