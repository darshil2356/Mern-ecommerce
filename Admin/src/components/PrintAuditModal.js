import React, { useRef, useState } from "react";
import { Modal, Button, Radio } from "antd";
import { FiPrinter, FiDownload, FiCheckCircle } from "react-icons/fi";

const PrintAuditModal = ({ open, audit, onCancel }) => {
  const [printType, setPrintType] = useState("DISCREPANCY_REPORT");
  const printAreaRef = useRef(null);

  if (!audit) return null;

  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (!printContent) return;

    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${audit.title} - ${audit.auditNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 4px 0; }
            h2 { font-size: 14px; margin: 0 0 16px 0; color: #555; }
            .header-box { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
            .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
            .kpi-card { flex: 1; border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; }
            .kpi-title { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; }
            .kpi-val { font-size: 16px; font-weight: bold; margin-top: 2px; }
            .text-red { color: #dc2626; }
            .text-blue { color: #2563eb; }
            .text-green { color: #16a34a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { background-color: #f3f4f6; border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            td { border: 1px solid #ddd; padding: 6px 8px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .sign-box { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; }
            .sign-line { width: 220px; text-align: center; border-top: 1px dashed #333; padding-top: 6px; }
            @media print {
              @page { margin: 12mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const missingItems = (audit.items || []).filter(
    (i) => i.isCounted && (i.discrepancy || 0) < 0
  );
  const excessItems = (audit.items || []).filter(
    (i) => i.isCounted && (i.discrepancy || 0) > 0
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <FiPrinter className="text-indigo-600" />
          <span>Print Stock Audit Reports</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Close
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<FiPrinter />}
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Print Now
        </Button>,
      ]}
      width={760}
      centered
      destroyOnClose
    >
      <div className="py-2 space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Select Report Type:
          </div>
          <Radio.Group
            value={printType}
            onChange={(e) => setPrintType(e.target.value)}
          >
            <Radio value="DISCREPANCY_REPORT">Discrepancy & Theft Loss Report</Radio>
            <Radio value="BLANK_COUNT_SHEET">Blank Store Counting Sheet</Radio>
          </Radio.Group>
        </div>

        {/* Printable View Container */}
        <div
          ref={printAreaRef}
          className="border border-gray-300 rounded-xl p-6 bg-white max-h-[500px] overflow-y-auto text-xs"
        >
          {printType === "DISCREPANCY_REPORT" ? (
            <div>
              <div className="border-b-2 border-gray-900 pb-3 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-wide text-gray-900">
                      Store Physical Stock Audit & Discrepancy Report
                    </h1>
                    <div className="text-xs text-gray-600 mt-1">
                      Cycle: <strong>{audit.periodType?.replace(/_/g, " ")}</strong> | Session: <strong>{audit.auditNumber}</strong>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>Date: <strong>{new Date(audit.createdAt).toLocaleDateString()}</strong></div>
                    <div>Status: <strong>{audit.status}</strong></div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="border border-gray-300 p-2 rounded bg-gray-50">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">System Expected</div>
                  <div className="text-base font-bold text-gray-800">{audit.totalSystemUnits || 0} pcs</div>
                </div>
                <div className="border border-gray-300 p-2 rounded bg-gray-50">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Physical Counted</div>
                  <div className="text-base font-bold text-blue-600">{audit.totalPhysicalUnits || 0} pcs</div>
                </div>
                <div className="border border-gray-300 p-2 rounded bg-red-50">
                  <div className="text-[10px] text-red-600 uppercase font-bold">Missing (Unbilled / Theft)</div>
                  <div className="text-base font-bold text-red-600">-{audit.totalShortageUnits || 0} pcs</div>
                </div>
                <div className="border border-gray-300 p-2 rounded bg-rose-50">
                  <div className="text-[10px] text-rose-600 uppercase font-bold">Unbilled Cash Loss (Retail)</div>
                  <div className="text-base font-bold text-rose-700">₹{(audit.totalRetailLoss || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>

              {/* Discrepancy Items Table */}
              <div className="font-bold text-gray-800 text-sm mb-1">
                Discrepancy Details ({missingItems.length} Missing, {excessItems.length} Excess)
              </div>
              <table className="w-full border-collapse border border-gray-300 text-[11px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1.5 text-left">Product Title</th>
                    <th className="border border-gray-300 p-1.5 text-left">Barcode</th>
                    <th className="border border-gray-300 p-1.5 text-center">System</th>
                    <th className="border border-gray-300 p-1.5 text-center">Counted</th>
                    <th className="border border-gray-300 p-1.5 text-center">Diff</th>
                    <th className="border border-gray-300 p-1.5 text-right">Cost Loss</th>
                    <th className="border border-gray-300 p-1.5 text-right">Retail Loss</th>
                    <th className="border border-gray-300 p-1.5 text-left">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {missingItems.length === 0 && excessItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-3 text-center text-gray-500">
                        No discrepancies found. 100% matched!
                      </td>
                    </tr>
                  ) : (
                    [...missingItems, ...excessItems].map((item, idx) => (
                      <tr key={idx} className={item.discrepancy < 0 ? "bg-red-50/30" : "bg-blue-50/30"}>
                        <td className="border border-gray-300 p-1.5 font-medium">{item.productTitle}</td>
                        <td className="border border-gray-300 p-1.5">{item.barcode || item.sku || "-"}</td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.systemStock}</td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.countedStock}</td>
                        <td className={`border border-gray-300 p-1.5 text-center font-bold ${item.discrepancy < 0 ? "text-red-600" : "text-blue-600"}`}>
                          {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right">
                          {item.costLoss > 0 ? `₹${item.costLoss.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-medium">
                          {item.retailLoss > 0 ? `₹${item.retailLoss.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          {item.suspicionReason?.replace(/_/g, " ") || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Signoff */}
              <div className="flex justify-between items-center mt-12 pt-4 border-t border-gray-300">
                <div className="text-center w-56">
                  <div className="border-t border-gray-800 pt-1 font-semibold text-gray-800">
                    Store Manager / Staff Signature
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">({audit.supervisorStaff || "Staff In-Charge"})</div>
                </div>
                <div className="text-center w-56">
                  <div className="border-t border-gray-800 pt-1 font-semibold text-gray-800">
                    Shop Owner Signature
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">(Final Verification & Approval)</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Blank Counting Sheet */}
              <div className="border-b-2 border-gray-900 pb-3 mb-4">
                <h1 className="text-xl font-black uppercase tracking-wide text-gray-900">
                  Store Physical Stock Counting Sheet
                </h1>
                <div className="text-xs text-gray-600 mt-1">
                  Session: <strong>{audit.auditNumber}</strong> | Date: <strong>{new Date().toLocaleDateString()}</strong> | Staff: <strong>{audit.supervisorStaff || "___________"}</strong>
                </div>
                <div className="text-[11px] text-gray-500 mt-1 italic">
                  Instructions: Count physical products on racks/shelves. Write the actual count in the box. Return completed sheet to Owner.
                </div>
              </div>

              <table className="w-full border-collapse border border-gray-300 text-[11px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1.5 text-center w-10">#</th>
                    <th className="border border-gray-300 p-1.5 text-left">Product Title</th>
                    <th className="border border-gray-300 p-1.5 text-left">Barcode / SKU</th>
                    <th className="border border-gray-300 p-1.5 text-left">Category</th>
                    <th className="border border-gray-300 p-1.5 text-center w-28">Physical Count</th>
                    <th className="border border-gray-300 p-1.5 text-left">Counter Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(audit.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-2 text-center text-gray-400">{idx + 1}</td>
                      <td className="border border-gray-300 p-2 font-medium">{item.productTitle}</td>
                      <td className="border border-gray-300 p-2">{item.barcode || item.sku || "-"}</td>
                      <td className="border border-gray-300 p-2">{item.category || "-"}</td>
                      <td className="border border-gray-300 p-2 text-center font-bold">
                        <div className="border border-dashed border-gray-400 rounded h-6 w-20 mx-auto"></div>
                      </td>
                      <td className="border border-gray-300 p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-12 pt-4 border-t border-gray-300">
                <div className="text-center w-56">
                  <div className="border-t border-gray-800 pt-1 font-semibold text-gray-800">
                    Counted By (Staff Name & Sign)
                  </div>
                </div>
                <div className="text-center w-56">
                  <div className="border-t border-gray-800 pt-1 font-semibold text-gray-800">
                    Verified By (Owner Sign)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PrintAuditModal;
