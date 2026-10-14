import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Button, Alert, Tag, Avatar } from "antd";
import { FiAlertTriangle, FiShield, FiPackage, FiUser, FiFileText } from "react-icons/fi";
import api from "../utils/axiosconfig";

const { TextArea } = Input;

export const PREDEFINED_REASONS = [
  { value: "Damaged / Defective Stock", label: "⚠️ Damaged / Defective Stock (ખરાબ / તૂટેલો માલ)" },
  { value: "Physical Audit Discrepancy", label: "🔍 Physical Audit Discrepancy (ઓડિટમાં માલ ઓછો નીકળ્યો)" },
  { value: "Expired / Discarded Stock", label: "⏳ Expired / Discarded Stock (જૂનો / નકામો માલ)" },
  { value: "Store Display / Sample Piece", label: "🏷️ Store Display / Sample Piece (ડિસ્પ્લે / સેમ્પલ માટે લીધેલ)" },
  { value: "Customer Exchange Scrap", label: "🔄 Customer Exchange Scrap (ગ્રાહક એક્સચેન્જ ખરાબ માલ)" },
  { value: "Theft / Missing Stock Suspected", label: "🚨 Theft / Missing Stock Suspected (ચોરી / ગુમ થયેલ માલ)" },
  { value: "Inventory Recount Correction", label: "✏️ Inventory Recount Correction (સ્ટોક ગણતરી ભૂલ સુધારો)" },
  { value: "Other", label: "📝 Other Reason (અન્ય ચોક્કસ કારણ આપો)" },
];

const StockReductionReasonModal = ({
  open,
  onClose,
  onSubmit,
  product = {},
  oldStock = 0,
  newStock = 0,
  reducedItems = [],
  loading = false,
}) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const calculatedReduced = reducedItems && reducedItems.length > 0
    ? reducedItems.reduce((acc, curr) => acc + (Number(curr.reducedUnits) || 0), 0)
    : Math.max(0, Number(oldStock || 0) - Number(newStock || 0));

  const unitsReduced = calculatedReduced;
  const unitPrice = Number(product?.price || 0);
  const potentialLoss = unitsReduced * unitPrice;

  // Load staff list
  useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
      setErrorMsg("");

      // Attempt to get user from localStorage for default
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.firstname) {
          setStaffName(`${user.firstname} ${user.lastname || ""}`.trim());
        }
      } catch (e) {
        // ignore
      }

      // Fetch staff members
      api.get("staff/")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setStaffList(res.data.filter((s) => s.status === "ACTIVE" || !s.status));
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleConfirm = () => {
    if (!reason || !reason.trim()) {
      setErrorMsg("Please select a mandatory reason for reducing stock.");
      return;
    }

    if (reason === "Other" && (!notes || !notes.trim())) {
      setErrorMsg("Please provide detailed explanation notes when choosing 'Other'.");
      return;
    }

    if (!staffName || !staffName.trim()) {
      setErrorMsg("Please specify the staff member authorizing/handling this reduction.");
      return;
    }

    setErrorMsg("");
    onSubmit({
      reason: reason.trim(),
      notes: notes.trim(),
      staffName: staffName.trim(),
      reductionItems: reducedItems,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      title={
        <div className="flex items-center gap-2 text-red-600 font-bold text-base">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <FiShield size={18} />
          </div>
          <span>Security & Fraud Prevention: Stock Reduction Audit</span>
        </div>
      }
    >
      <div className="py-2">
        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <FiAlertTriangle className="text-amber-600 text-lg flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-950 font-semibold mb-0.5">
              Mandatory Anti-Fraud Verification Required
            </strong>
            Physical stock is being reduced manually without a POS/Billing sale. To prevent
            unrecorded cash sales and staff inventory manipulation, this action is strictly logged.
            A reason and staff name must be recorded before saving.
          </div>
        </div>

        {/* Product & Stock Difference Overview */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              shape="square"
              size={48}
              src={product?.images?.[0]?.url}
              icon={<FiPackage />}
              className="rounded-lg bg-white border border-gray-200 flex-shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm truncate max-w-[220px]">
                {product?.title || "Product"}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                {product?.barcode && <span>Code: {product.barcode}</span>}
                {unitPrice > 0 && <span>• ₹{unitPrice.toLocaleString()} / unit</span>}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-gray-400 line-through text-xs">{oldStock} units</span>
              <span className="text-gray-400">➔</span>
              <span className="font-bold text-gray-900 text-sm">{newStock} units</span>
            </div>
            <div className="mt-1 flex items-center gap-1 justify-end">
              <Tag color="error" className="font-bold text-xs m-0 px-2 py-0.5 rounded-full">
                -{unitsReduced} {unitsReduced === 1 ? "Unit" : "Units"}
              </Tag>
              {potentialLoss > 0 && (
                <Tag color="volcano" className="font-semibold text-xs m-0 px-2 py-0.5 rounded-full">
                  Cash Risk: ₹{potentialLoss.toLocaleString()}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown of Color & Size Reductions */}
        {reducedItems && reducedItems.length > 0 && (
          <div className="mb-4 bg-red-50/40 border border-red-200 rounded-xl p-3">
            <div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>Specific Color & Size Reductions ({reducedItems.length} {reducedItems.length === 1 ? "item" : "items"})</span>
              <span className="text-[11px] text-gray-500 font-normal">Total: -{unitsReduced} units</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {reducedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-red-100 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.color && (
                      <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        🎨 {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Size: {item.size}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-[11px]">{item.oldStock}</span>
                    <span className="text-gray-300">➔</span>
                    <span className="font-bold text-gray-900">{item.newStock}</span>
                    <Tag color="error" className="m-0 font-bold px-1.5 py-0 rounded text-[11px]">
                      -{item.reducedUnits}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            className="mb-3 rounded-lg text-xs"
            closable
            onClose={() => setErrorMsg("")}
          />
        )}

        {/* Reason Field */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <span>Reason for Reducing Stock</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <Select
            placeholder="-- Select Mandatory Reason --"
            className="w-full"
            size="large"
            value={reason || undefined}
            onChange={(val) => {
              setReason(val);
              setErrorMsg("");
            }}
            options={PREDEFINED_REASONS}
          />
        </div>

        {/* Staff Member Field */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <FiUser size={13} className="text-gray-500" />
            <span>Staff Member Authorizing / Handling</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          {staffList.length > 0 ? (
            <Select
              showSearch
              placeholder="Select or enter staff name"
              className="w-full"
              value={staffName || undefined}
              onChange={(val) => {
                setStaffName(val);
                setErrorMsg("");
              }}
              options={staffList.map((s) => ({
                value: s.name,
                label: `${s.name} (${s.designation || "Staff"})`,
              }))}
            />
          ) : (
            <Input
              prefix={<FiUser className="text-gray-400" />}
              placeholder="Enter staff / manager name"
              value={staffName}
              onChange={(e) => {
                setStaffName(e.target.value);
                setErrorMsg("");
              }}
            />
          )}
        </div>

        {/* Detailed Notes / Remarks */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <FiFileText size={13} className="text-gray-500" />
            <span>Audit Notes & Explanation {reason === "Other" && <span className="text-red-500">*</span>}</span>
          </label>
          <TextArea
            rows={3}
            placeholder="Add specific details (e.g., 'Piece stained with ink during unpacking', 'CCTV checked box missing', etc.)"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setErrorMsg("");
            }}
            className="rounded-lg text-sm"
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button onClick={onClose} disabled={loading} className="rounded-lg">
            Cancel
          </Button>
          <Button
            type="primary"
            danger
            loading={loading}
            onClick={handleConfirm}
            className="rounded-lg font-semibold bg-red-600 hover:bg-red-700 border-red-600 shadow-sm"
          >
            Confirm & Log Stock Reduction (-{unitsReduced})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StockReductionReasonModal;
