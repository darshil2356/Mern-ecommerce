import React, { useState } from "react";
import { Modal, Input, Checkbox, Alert, message, Tag } from "antd";
import { FiCheckCircle, FiAlertTriangle, FiDollarSign, FiShield } from "react-icons/fi";
import stockAuditService from "../features/stockAudit/stockAuditService";

const { TextArea } = Input;

const ReconcileAuditModal = ({ open, audit, onCancel, onSuccess }) => {
  const [ownerSummaryNotes, setOwnerSummaryNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!audit) return null;

  const totalCostLoss = audit.totalCostLoss || 0;
  const totalRetailLoss = audit.totalRetailLoss || 0;
  const missingUnits = audit.totalShortageUnits || 0;
  const surplusUnits = audit.totalSurplusUnits || 0;

  const handleReconcile = async () => {
    if (!confirmed) {
      message.error("Please confirm that you authorize live inventory adjustment.");
      return;
    }

    setLoading(true);
    try {
      const res = await stockAuditService.reconcileAudit(audit._id, {
        ownerSummaryNotes: ownerSummaryNotes.trim(),
      });
      message.success(res.message || "Store inventory successfully reconciled!");
      if (onSuccess) onSuccess(res.audit);
      onCancel();
    } catch (err) {
      console.error("Reconciliation failed", err);
      message.error(err?.response?.data?.message || "Failed to reconcile audit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">⚖️</span>
          <span>Reconcile & Correct Live Shop Stock</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleReconcile}
      okText={loading ? "Reconciling..." : "Confirm & Update Live Inventory"}
      okButtonProps={{
        loading,
        disabled: !confirmed,
        className: "bg-emerald-600 hover:bg-emerald-700",
      }}
      cancelButtonProps={{ disabled: loading }}
      width={640}
      centered
      destroyOnClose
    >
      <div className="py-2 space-y-4 text-sm text-gray-700">
        <Alert
          message="Final Inventory Alignment"
          description="Clicking reconcile will update your actual product catalog inventory to match your physical counted stock. All discrepancies will be permanently logged in the Audit Trail for future proof."
          type="warning"
          showIcon
          className="rounded-xl border-amber-200 bg-amber-50"
        />

        {/* Financial & Shrinkage Impact Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <div className="text-xs text-gray-500 font-medium">Missing (Theft)</div>
            <div className="text-xl font-bold text-red-600 mt-0.5">-{missingUnits} pcs</div>
            <div className="text-[11px] text-gray-400">Unbilled / Stolen</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Surplus Units</div>
            <div className="text-xl font-bold text-blue-600 mt-0.5">+{surplusUnits} pcs</div>
            <div className="text-[11px] text-gray-400">Extra Found</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Capital Cost Loss</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              ₹{totalCostLoss.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-gray-400">At Purchase Rate</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Unbilled Cash Value</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              ₹{totalRetailLoss.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-gray-400">At Selling Rate</div>
          </div>
        </div>

        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
          <div className="font-bold flex items-center gap-1 text-red-900">
            <FiAlertTriangle /> Staff Cheating & Theft Detection:
          </div>
          <p>
            The system detected <strong>{missingUnits} missing items</strong> with an estimated unbilled cash value of <strong>₹{totalRetailLoss.toLocaleString("en-IN")}</strong>. These are items sold for cash without generating a bill or taken out without payment.
          </p>
        </div>

        {/* Owner Final Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Owner Audit Findings & Resolution Notes
          </label>
          <TextArea
            rows={3}
            value={ownerSummaryNotes}
            onChange={(e) => setOwnerSummaryNotes(e.target.value)}
            placeholder="e.g. Staff admitted unbilled cash sale of 8 shirts; ₹9,600 recovered. System stock adjusted for next 6-month cycle."
            className="rounded-lg"
          />
        </div>

        <div className="pt-2">
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="text-gray-800 font-medium"
          >
            I confirm that I have personally counted or verified the physical store stock, and I authorize the system to adjust live inventory to these physical numbers.
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
};

export default ReconcileAuditModal;
