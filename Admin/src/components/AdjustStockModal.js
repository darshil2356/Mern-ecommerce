import React, { useState, useEffect } from "react";
import { Modal, InputNumber, Select, Input, Button, Alert, Tag, Avatar, message } from "antd";
import { FiAlertTriangle, FiPlus, FiMinus, FiPackage, FiShield } from "react-icons/fi";
import productService from "../features/product/productService";
import api from "../utils/axiosconfig";
import { PREDEFINED_REASONS } from "./StockReductionReasonModal";

const { TextArea } = Input;

const AdjustStockModal = ({ open, onClose, product = null, onSuccess }) => {
  const [currentQty, setCurrentQty] = useState(0);
  const [targetQty, setTargetQty] = useState(0);
  const [sizeStock, setSizeStock] = useState([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && product) {
      const stock = Number(product.quantity || 0);
      setCurrentQty(stock);
      setTargetQty(stock);
      setReason("");
      setNotes("");
      setErrorMsg("");

      if (product.sizeStock?.length > 0) {
        setSizeStock(product.sizeStock.map((s) => ({ ...s, quantity: Number(s.quantity || 0) })));
      } else {
        setSizeStock([]);
      }

      // Default staff
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.firstname) {
          setStaffName(`${user.firstname} ${user.lastname || ""}`.trim());
        }
      } catch (e) {}

      api.get("staff/")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setStaffList(res.data.filter((s) => s.status === "ACTIVE" || !s.status));
          }
        })
        .catch(() => {});
    }
  }, [open, product]);

  const handleSizeQtyChange = (index, val) => {
    const updated = [...sizeStock];
    updated[index] = { ...updated[index], quantity: Math.max(0, Number(val) || 0) };
    setSizeStock(updated);
    const sum = updated.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    setTargetQty(sum);
  };

  const diff = targetQty - currentQty;
  const isReduction = diff < 0;
  const unitsReduced = Math.abs(diff);
  const potentialLoss = isReduction ? unitsReduced * (Number(product?.price) || 0) : 0;

  const handleSave = async () => {
    if (diff === 0) {
      onClose();
      return;
    }

    if (isReduction) {
      if (!reason || !reason.trim()) {
        setErrorMsg("Reason is strictly mandatory when reducing stock (anti-fraud check).");
        return;
      }
      if (reason === "Other" && (!notes || !notes.trim())) {
        setErrorMsg("Please specify the explanation notes when selecting 'Other'.");
        return;
      }
      if (!staffName || !staffName.trim()) {
        setErrorMsg("Please select or enter staff name authorizing this reduction.");
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        newQuantity: targetQty,
        reason: isReduction ? reason : (reason || "Stock Increase / Restock"),
        notes,
        staffName,
      };

      if (sizeStock.length > 0) {
        payload.sizeStock = sizeStock;
      }

      await productService.adjustStock({
        id: product._id,
        data: payload,
      });

      message.success(isReduction ? `Stock reduced by ${unitsReduced} units and audit log created!` : "Stock updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to adjust stock";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={540}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <FiPackage size={16} />
          </div>
          <span className="font-bold text-gray-900 text-sm">
            Quick Stock Adjustment: {product?.title || "Product"}
          </span>
        </div>
      }
    >
      <div className="py-2">
        {/* Product Info Bar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar
              shape="square"
              size={44}
              src={product?.images?.[0]?.url}
              icon={<FiPackage />}
              className="rounded-lg bg-white border border-gray-200"
            />
            <div>
              <div className="font-semibold text-gray-800 text-sm max-w-[240px] truncate">
                {product?.title}
              </div>
              <div className="text-xs text-gray-500">
                {product?.barcode ? `Barcode: ${product.barcode}` : product?.category || ""}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Current Stock</span>
            <span className="font-bold text-gray-900 text-base">{currentQty} units</span>
          </div>
        </div>

        {/* Size breakdown if exists */}
        {sizeStock.length > 0 ? (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Adjust Quantity by Size:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {sizeStock.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                  <span className="font-semibold text-xs text-gray-700">{item.size}</span>
                  <InputNumber
                    min={0}
                    value={item.quantity}
                    onChange={(val) => handleSizeQtyChange(idx, val)}
                    size="small"
                    className="w-20"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Simple Quantity Input */
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              New Total Stock Quantity:
            </label>
            <div className="flex items-center gap-3">
              <Button
                icon={<FiMinus />}
                onClick={() => setTargetQty(Math.max(0, targetQty - 1))}
                disabled={targetQty <= 0}
              />
              <InputNumber
                min={0}
                value={targetQty}
                onChange={(val) => setTargetQty(Math.max(0, Number(val) || 0))}
                className="w-32 text-center text-lg font-bold"
              />
              <Button
                icon={<FiPlus />}
                onClick={() => setTargetQty(targetQty + 1)}
              />
              <span className="text-xs text-gray-500">units</span>
            </div>
          </div>
        )}

        {/* Stock Delta Banner */}
        {diff !== 0 && (
          <div className={`p-3 rounded-xl mb-4 border ${isReduction ? "bg-red-50 border-red-200 text-red-900" : "bg-green-50 border-green-200 text-green-900"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold">
                {isReduction ? <FiAlertTriangle className="text-red-500" /> : <FiPlus className="text-green-500" />}
                <span>
                  {isReduction ? `Stock Reduction Detected: -${unitsReduced} units` : `Stock Increase: +${diff} units`}
                </span>
              </div>
              {isReduction && potentialLoss > 0 && (
                <Tag color="error" className="m-0 font-bold text-xs rounded-full">
                  Cash Value at Risk: ₹{potentialLoss.toLocaleString()}
                </Tag>
              )}
            </div>
          </div>
        )}

        {/* Mandatory Fraud Prevention Fields when reducing */}
        {isReduction && (
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2.5">
              <FiShield className="text-amber-600" />
              <span>Fraud Prevention Audit Fields (Mandatory)</span>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Less Stock <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="-- Select Reason --"
                className="w-full"
                value={reason || undefined}
                onChange={(val) => { setReason(val); setErrorMsg(""); }}
                options={PREDEFINED_REASONS}
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Staff Authorizing / Adjusting <span className="text-red-500">*</span>
              </label>
              {staffList.length > 0 ? (
                <Select
                  showSearch
                  placeholder="Select staff member"
                  className="w-full"
                  value={staffName || undefined}
                  onChange={(val) => { setStaffName(val); setErrorMsg(""); }}
                  options={staffList.map((s) => ({ value: s.name, label: `${s.name} (${s.designation || "Staff"})` }))}
                />
              ) : (
                <Input
                  placeholder="Staff / Manager Name"
                  value={staffName}
                  onChange={(e) => { setStaffName(e.target.value); setErrorMsg(""); }}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notes / Explanation {reason === "Other" && <span className="text-red-500">*</span>}
              </label>
              <TextArea
                rows={2}
                placeholder="Details of damage, discrepancy, or reason..."
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setErrorMsg(""); }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            className="mb-3 text-xs rounded-lg"
            closable
            onClose={() => setErrorMsg("")}
          />
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button onClick={onClose} disabled={loading} className="rounded-lg">
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            danger={isReduction}
            onClick={handleSave}
            disabled={diff === 0}
            className={`rounded-lg font-semibold ${isReduction ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {isReduction ? `Confirm Reduction (-${unitsReduced})` : "Update Stock"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdjustStockModal;
